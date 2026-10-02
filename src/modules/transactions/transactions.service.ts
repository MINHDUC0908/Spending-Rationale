import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionsRepository } from './transactions.repository.js';
import { CreateTransactionDto } from './dto/create.transaction.js';
import { Transaction } from './entities/transaction.entity.js';
import { Wallet } from '../wallets/entities/wallet.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { UpdateTransactionDto } from './dto/update.transaction.js';
import { FilterTransactionDto } from './dto/filter-transaction.dto.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';

@Injectable()
export class TransactionsService {
    constructor (
        private readonly dataSource: DataSource,
        private readonly transactionsRepository: TransactionsRepository,
    ) {}

    async create (
        userId: string,
        dto: CreateTransactionDto,
        externalManager?: EntityManager,
    ): Promise<Transaction> {
        const execute = async (manager: EntityManager) => {
            // Kiểm tra wallet và khoá dòng với Pessimistic Write Lock để chống Race Condition (Lost Update)
            const wallet = await manager.findOne(Wallet, {
                where: { id: dto.walletId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!wallet || wallet.userId !== userId) {
                throw new ForbiddenException('Ví không hợp lệ');
            }

            // Kiểm tra category hợp lệ (mặc định hoặc của chính user)
            const category = await manager.findOne(Category, {
                where: { id: dto.categoryId },
            });

            if (!category || (!category.isDefault && category.userId !== userId)) {
                throw new BadRequestException('Category không hợp lệ');
            }

            if (category.type !== dto.type) {
                throw new BadRequestException(
                    'Loại giao dịch không khớp với loại category',
                );
            }

            // Tạo transaction
            const transaction = manager.create(Transaction, {
                ...dto,
                userId,
            });
            await manager.save(transaction);

            // Cập nhật balance: expense trừ, income cộng
            const delta =
                dto.type === 'expense' ? -dto.amount : dto.amount;
            wallet.balance = Number(wallet.balance) + delta;
            await manager.save(wallet);

            return transaction;
        };

        if (externalManager) {
            return execute(externalManager);
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const transaction = await execute(queryRunner.manager);
            await queryRunner.commitTransaction();
            return transaction;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll (
        userId: string,
        filter: FilterTransactionDto,
    ): Promise<PaginatedResult<Transaction>> {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 10;
        const { data, total } = await this.transactionsRepository.findAllByFilter(userId, filter);
        const totalPages = Math.ceil(total / limit) || 1;

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    async findOne (userId: string, id: string): Promise<Transaction> {
        const transaction = await this.transactionsRepository.findById(id);

        if (!transaction) {
            throw new NotFoundException('Không tìm thấy giao dịch');
        }

        if (transaction.userId !== userId) {
            throw new ForbiddenException('Bạn không có quyền truy cập giao dịch này');
        }

        return transaction;
    }

    async update (
        userId: string,
        id: string,
        dto: UpdateTransactionDto,
    ): Promise<Transaction> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const oldTransaction = await queryRunner.manager.findOne(Transaction, {
                where: { id },
            });

            if (!oldTransaction) {
                throw new NotFoundException('Không tìm thấy giao dịch');
            }

            if (oldTransaction.userId !== userId) {
                throw new ForbiddenException('Bạn không có quyền sửa giao dịch này');
            }

            // Hoàn tác tác động cũ lên wallet cũ - khoá dòng wallet để đảm bảo an toàn số dư
            const oldWallet = await queryRunner.manager.findOne(Wallet, {
                where: { id: oldTransaction.walletId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!oldWallet) {
                throw new NotFoundException('Ví của giao dịch cũ không tồn tại');
            }
            const oldDelta =
                oldTransaction.type === 'expense'
                    ? oldTransaction.amount
                    : -oldTransaction.amount;
            oldWallet.balance = Number(oldWallet.balance) + Number(oldDelta);
            await queryRunner.manager.save(oldWallet);

            // Áp dữ liệu mới (có thể đổi wallet, amount, type)
            const newWalletId = dto.walletId ?? oldTransaction.walletId;
            const newAmount = dto.amount ?? oldTransaction.amount;
            const newType = dto.type ?? oldTransaction.type;

            const newWallet =
                newWalletId === oldWallet.id
                    ? oldWallet
                    : await queryRunner.manager.findOne(Wallet, {
                          where: { id: newWalletId },
                          lock: { mode: 'pessimistic_write' },
                      });

            if (!newWallet || newWallet.userId !== userId) {
                throw new ForbiddenException('Ví không hợp lệ');
            }

            const newDelta = newType === 'expense' ? -newAmount : newAmount;
            newWallet.balance = Number(newWallet.balance) + Number(newDelta);
            await queryRunner.manager.save(newWallet);

            Object.assign(oldTransaction, dto);
            await queryRunner.manager.save(oldTransaction);

            await queryRunner.commitTransaction();

            return oldTransaction;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async remove (userId: string, id: string): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const transaction = await queryRunner.manager.findOne(Transaction, {
                where: { id },
            });

            if (!transaction) {
                throw new NotFoundException('Không tìm thấy giao dịch');
            }

            if (transaction.userId !== userId) {
                throw new ForbiddenException('Bạn không có quyền xóa giao dịch này');
            }

            // Hoàn tác tác động lên wallet trước khi xóa - khoá dòng wallet với pessimistic_write
            const wallet = await queryRunner.manager.findOne(Wallet, {
                where: { id: transaction.walletId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!wallet) {
                throw new NotFoundException('Ví của giao dịch không tồn tại');
            }
            const delta =
                transaction.type === 'expense'
                    ? transaction.amount
                    : -transaction.amount;
            wallet.balance = Number(wallet.balance) + Number(delta);
            await queryRunner.manager.save(wallet);

            await queryRunner.manager.remove(transaction);

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getMonthlySummary (userId: string, month: number, year: number) {
        return this.transactionsRepository.getMonthlySummary(userId, month, year);
    }
}