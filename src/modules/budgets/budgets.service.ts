import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { Budget } from './entities/budget.entity.js';
import { BudgetsRepository } from './budgers.repository.js';
import { CreateBudgetDto } from './dto/create.budget.js';
import { UpdateBudgetDto } from './dto/update.budget.js';


@Injectable()
export class BudgetsService {
    constructor (private readonly budgetsRepository: BudgetsRepository) {}

    async create (userId: string, dto: CreateBudgetDto): Promise<Budget> {
        const existing = await this.budgetsRepository.findByCategoryAndMonth(
            userId,
            dto.categoryId,
            dto.month,
            dto.year,
        );

        if (existing) {
            throw new ConflictException(
                'Category này đã có ngân sách cho tháng này',
            );
        }

        const budget = this.budgetsRepository.create({ ...dto, userId });
        return this.budgetsRepository.save(budget);
    }

    findAll (userId: string, month?: number, year?: number): Promise<Budget[]> {
        return this.budgetsRepository.findAllByUser(userId, month, year);
    }

    async findOne (userId: string, id: string): Promise<Budget> {
        const budget = await this.budgetsRepository.findById(id);

        if (!budget) {
            throw new NotFoundException('Không tìm thấy ngân sách');
        }

        if (budget.userId !== userId) {
            throw new ForbiddenException('Bạn không có quyền truy cập ngân sách này');
        }

        return budget;
    }

    async update (
        userId: string,
        id: string,
        dto: UpdateBudgetDto,
    ): Promise<Budget> {
        const budget = await this.findOne(userId, id);

        budget.amountLimit = dto.amountLimit;

        return this.budgetsRepository.save(budget);
    }

    async remove (userId: string, id: string): Promise<void> {
        const budget = await this.findOne(userId, id);

        await this.budgetsRepository.remove(budget);
    }

    // Trạng thái ngân sách: đã chi bao nhiêu, còn lại bao nhiêu, có vượt không
    // Tối ưu: dùng getSpentAmountBulk → 1 query GROUP BY thay vì N query riêng lẻ (N+1)
    async getStatus (userId: string, month: number, year: number) {
        const budgets = await this.budgetsRepository.findAllByUser(userId, month, year);

        if (budgets.length === 0) return [];

        // Lấy hết số tiền đã chi cho tất cả category trong 1 lần query
        const categoryIds = budgets.map((b) => b.categoryId);
        const spentMap = await this.budgetsRepository.getSpentAmountBulk(
            userId,
            categoryIds,
            month,
            year,
        );

        return budgets.map((budget) => {
            const spent = spentMap[budget.categoryId] ?? 0;
            const limit = Number(budget.amountLimit);
            const remaining = limit - spent;
            const percentUsed = limit > 0 ? (spent / limit) * 100 : 0;

            return {
                categoryId: budget.categoryId,
                categoryName: budget.category?.name,
                amountLimit: limit,
                spent,
                remaining,
                percentUsed: Math.round(percentUsed * 100) / 100,
                isOverBudget: spent > limit,
            };
        });
    }
}