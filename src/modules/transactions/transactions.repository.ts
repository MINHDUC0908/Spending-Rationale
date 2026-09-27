import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity.js';
import { FilterTransactionDto } from './dto/filter-transaction.dto.js';

@Injectable()
export class TransactionsRepository {
    constructor (
        @InjectRepository(Transaction)
        private readonly repository: Repository<Transaction>,
    ) {}

    async findAllByFilter (
        userId: string,
        filter: FilterTransactionDto,
    ): Promise<{ data: Transaction[]; total: number }> {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 10;
        const skip = (page - 1) * limit;

        const query = this.repository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.category', 'category')
            .leftJoinAndSelect('transaction.wallet', 'wallet')
            .where('transaction.userId = :userId', { userId });

        if (filter.walletId) {
            query.andWhere('transaction.walletId = :walletId', {
                walletId: filter.walletId,
            });
        }

        if (filter.from && filter.to) {
            query.andWhere(
                'transaction.transactionDate BETWEEN :from AND :to',
                { from: filter.from, to: filter.to },
            );
        } else if (filter.from) {
            query.andWhere('transaction.transactionDate >= :from', { from: filter.from });
        } else if (filter.to) {
            query.andWhere('transaction.transactionDate <= :to', { to: filter.to });
        }

        const [data, total] = await query
            .orderBy('transaction.transactionDate', 'DESC')
            .addOrderBy('transaction.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return { data, total };
    }

    findById (id: string): Promise<Transaction | null> {
        return this.repository.findOne({
            where: { id },
            relations: { category: true, wallet: true },
        });
    }

    // Tổng thu/chi group theo category trong 1 tháng - dùng cho dashboard
    // Tối ưu hóa: Dùng khoảng ngày >= startDate VÀ < endDate để database tận dụng Index trên transactionDate
    async getMonthlySummary (userId: string, month: number, year: number) {
        const formattedStart = `${year}-${String(month).padStart(2, '0')}-01`;
        const nextYear = month === 12 ? year + 1 : year;
        const nextMonth = month === 12 ? 1 : month + 1;
        const formattedEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

        return this.repository
            .createQueryBuilder('transaction')
            .select('transaction.categoryId', 'categoryId')
            .addSelect('category.name', 'categoryName')
            .addSelect('transaction.type', 'type')
            .addSelect('SUM(transaction.amount)', 'total')
            .leftJoin('transaction.category', 'category')
            .where('transaction.userId = :userId', { userId })
            .andWhere('transaction.transactionDate >= :startDate', { startDate: formattedStart })
            .andWhere('transaction.transactionDate < :endDate', { endDate: formattedEnd })
            .groupBy('transaction.categoryId')
            .addGroupBy('category.name')
            .addGroupBy('transaction.type')
            .getRawMany();
    }
}