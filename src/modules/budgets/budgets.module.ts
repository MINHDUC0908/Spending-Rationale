import { Module } from '@nestjs/common';
import { BudgetsService } from './budgets.service.js';
import { BudgetsController } from './budgets.controller.js';
import { Transaction } from '../transactions/entities/transaction.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { Budget } from './entities/budget.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Wallet } from '../wallets/entities/wallet.entity.js';
import { BudgetsRepository } from './budgers.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Wallet, Category, Budget]), AuthModule],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetsRepository],
  exports: [BudgetsService],
})
export class BudgetsModule {}
