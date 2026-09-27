import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
    Unique,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity.js';

@Entity('budgets')
@Unique(['userId', 'categoryId', 'month', 'year']) // mỗi category chỉ có 1 budget/tháng
export class Budget {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    userId: string;

    @Column()
    categoryId: string;

    @ManyToOne(() => Category, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'categoryId' })
    category: Category;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    amountLimit: number;

    @Column({ type: 'int' })
    month: number; // 1-12

    @Column({ type: 'int' })
    year: number;

    @CreateDateColumn()
    createdAt: Date;
}