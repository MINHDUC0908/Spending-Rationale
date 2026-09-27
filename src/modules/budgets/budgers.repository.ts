import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './entities/budget.entity.js';
import { Transaction } from '../transactions/entities/transaction.entity.js';


@Injectable()
export class BudgetsRepository {
    constructor (
        @InjectRepository(Budget)
        private readonly budgetRepository: Repository<Budget>,
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
    ) {}

    findAllByUser (userId: string, month?: number, year?: number): Promise<Budget[]> {
        const where: any = { userId };
        if (month) where.month = month;
        if (year) where.year = year;

        return this.budgetRepository.find({
            where,
            relations: { category: true },
            order: { year: 'DESC', month: 'DESC' },
        });
    }

    findById (id: string): Promise<Budget | null> {
        return this.budgetRepository.findOne({
            where: { id },
            relations: { category: true },
        });
    }

    findByCategoryAndMonth (
        userId: string,
        categoryId: string,
        month: number,
        year: number,
    ): Promise<Budget | null> {
        return this.budgetRepository.findOne({
            where: { userId, categoryId, month, year },
        });
    }

    create (data: Partial<Budget>): Budget {
        return this.budgetRepository.create(data);
    }

    save (budget: Budget): Promise<Budget> {
        return this.budgetRepository.save(budget);
    }

    remove (budget: Budget): Promise<Budget> {
        return this.budgetRepository.remove(budget);
    }

    // Tổng số tiền đã chi thực tế cho 1 category trong 1 tháng
    async getSpentAmount (
        userId: string,
        categoryId: string,
        month: number,
        year: number,
    ): Promise<number> {
        const result = await this.transactionRepository
            .createQueryBuilder('transaction')
            .select('SUM(transaction.amount)', 'total')
            .where('transaction.userId = :userId', { userId })
            .andWhere('transaction.categoryId = :categoryId', { categoryId })
            .andWhere('transaction.type = :type', { type: 'expense' })
            .andWhere('MONTH(transaction.transactionDate) = :month', { month })
            .andWhere('YEAR(transaction.transactionDate) = :year', { year })
            .getRawOne();

        return Number(result.total) || 0;
    }
}