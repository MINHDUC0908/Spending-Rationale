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
    // Dùng range date >= startDate AND < endDate để DB tận dụng Index trên transactionDate
    // KHÔNG dùng MONTH() / YEAR() vì function-wrap vô hiệu hóa Index → full scan
    async getSpentAmount (
        userId: string,
        categoryId: string,
        month: number,
        year: number,
    ): Promise<number> {
        const { startDate, endDate } = this.monthRange(month, year);

        const result = await this.transactionRepository
            .createQueryBuilder('transaction')
            .select('SUM(transaction.amount)', 'total')
            .where('transaction.userId = :userId', { userId })
            .andWhere('transaction.categoryId = :categoryId', { categoryId })
            .andWhere('transaction.type = :type', { type: 'expense' })
            .andWhere('transaction.transactionDate >= :startDate', { startDate })
            .andWhere('transaction.transactionDate < :endDate', { endDate })
            .getRawOne();

        return Number(result?.total) || 0;
    }

    // Lấy tổng chi cho NHIỀU category trong 1 tháng bằng 1 query duy nhất (GROUP BY)
    // Dùng để tránh N+1 query trong BudgetsService.getStatus()
    async getSpentAmountBulk (
        userId: string,
        categoryIds: string[],
        month: number,
        year: number,
    ): Promise<Record<string, number>> {
        if (categoryIds.length === 0) return {};

        const { startDate, endDate } = this.monthRange(month, year);

        const rows = await this.transactionRepository
            .createQueryBuilder('transaction')
            .select('transaction.categoryId', 'categoryId')
            .addSelect('SUM(transaction.amount)', 'total')
            .where('transaction.userId = :userId', { userId })
            .andWhere('transaction.categoryId IN (:...categoryIds)', { categoryIds })
            .andWhere('transaction.type = :type', { type: 'expense' })
            .andWhere('transaction.transactionDate >= :startDate', { startDate })
            .andWhere('transaction.transactionDate < :endDate', { endDate })
            .groupBy('transaction.categoryId')
            .getRawMany<{ categoryId: string; total: string }>();

        // Chuyển array thành map { categoryId -> spent } để O(1) lookup
        return Object.fromEntries(
            rows.map((r) => [r.categoryId, Number(r.total) || 0]),
        );
    }

    // Helper: tính startDate và endDate của 1 tháng
    private monthRange (month: number, year: number) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const nextYear = month === 12 ? year + 1 : year;
        const nextMonth = month === 12 ? 1 : month + 1;
        const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
        return { startDate, endDate };
    }
}