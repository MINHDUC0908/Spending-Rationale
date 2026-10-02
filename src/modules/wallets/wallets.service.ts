import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Wallet } from './entities/wallet.entity.js';
import { Repository } from 'typeorm';
import { CreateWalletDto } from './dto/create.wallet.dto.js';
import { UpdateWalletDto } from './dto/update.wallet.dto.js';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class WalletsService {
    constructor(
        @InjectRepository(Wallet)
        private readonly walletRepository: Repository<Wallet>
    ) { }

    async create(userId: string, dto: CreateWalletDto): Promise<Wallet> {
        const wallet = this.walletRepository.create({
            ...dto,
            userId,
        });

        return this.walletRepository.save(wallet);
    }

    // Chỉ lấy ví của user đang login
    async findAll(userId: string): Promise<Wallet[]> {
        return this.walletRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(userId: string, id: string): Promise<Wallet> {
        const wallet = await this.walletRepository.findOne({
            where: { id },
        });

        if (!wallet) {
            throw new NotFoundException('Không tìm thấy ví');
        }

        // Chặn xem ví của người khác dù biết id
        if (wallet.userId !== userId) {
            throw new ForbiddenException('Bạn không có quyền truy cập ví này');
        }

        return wallet;
    }

    async update(
        userId: string,
        id: string,
        dto: UpdateWalletDto,
    ): Promise<Wallet> {
        const wallet = await this.findOne(userId, id); // đã check quyền sở hữu

        Object.assign(wallet, dto);

        return this.walletRepository.save(wallet);
    }

    async remove(userId: string, id: string): Promise<void> {
        const wallet = await this.findOne(userId, id); // đã check quyền sở hữu

        await this.walletRepository.remove(wallet);
    }
}
