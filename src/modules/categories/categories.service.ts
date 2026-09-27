import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateCategoryDto } from './dto/update.category.js';
import { CreateCategoryDto } from './dto/create.category.js';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>
    ) {}

    async create (userId: string, dto: CreateCategoryDto): Promise<Category> {
        const category = this.categoryRepository.create({
            ...dto,
            userId,
            isDefault: false, // user thường không được tự tạo category mặc định
        });
 
        return this.categoryRepository.save(category);
    }
 
    // Trả về category mặc định (userId null) + category riêng của user này
    async findAll (userId: string): Promise<Category[]> {
        return this.categoryRepository
            .createQueryBuilder('category')
            .where('category.isDefault = true')
            .orWhere('category.userId = :userId', { userId })
            .orderBy('category.isDefault', 'DESC')
            .addOrderBy('category.name', 'ASC')
            .getMany();
    }
 
    async findOne (userId: string, id: string): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { id },
        });
 
        if (!category) {
            throw new NotFoundException('Không tìm thấy category');
        }
 
        // Cho xem nếu là mặc định hoặc do chính user tạo
        if (!category.isDefault && category.userId !== userId) {
            throw new ForbiddenException('Bạn không có quyền truy cập category này');
        }
 
        return category;
    }
 
    async update (
        userId: string,
        id: string,
        dto: UpdateCategoryDto,
    ): Promise<Category> {
        const category = await this.findOne(userId, id);
 
        if (category.isDefault) {
            throw new ForbiddenException('Không thể sửa category mặc định');
        }
 
        Object.assign(category, dto);
 
        return this.categoryRepository.save(category);
    }
 
    async remove (userId: string, id: string): Promise<void> {
        const category = await this.findOne(userId, id);
 
        if (category.isDefault) {
            throw new ForbiddenException('Không thể xóa category mặc định');
        }
 
        await this.categoryRepository.remove(category);
    }
}

