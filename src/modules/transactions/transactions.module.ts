import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsRepository } from './transactions.repository.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity.js';
import { Wallet } from '../wallets/entities/wallet.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    imports: [TypeOrmModule.forFeature([Transaction, Wallet, Category]), AuthModule],
    controllers: [TransactionsController],
    providers: [TransactionsService, TransactionsRepository],
    exports: [TransactionsService],
})
export class TransactionsModule { }
