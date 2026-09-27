import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Wallet } from '../../wallets/entities/wallet.entity.js';
import { Category } from '../../categories/entities/category.entity.js';

@Entity('transactions')
@Index(['userId', 'transactionDate'])
@Index(['userId', 'walletId', 'transactionDate'])
@Index(['userId', 'categoryId', 'transactionDate'])
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    userId: string;

    @Column()
    walletId: string;

    @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'walletId' })
    wallet: Wallet;

    @Column()
    categoryId: string;

    @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'categoryId' })
    category: Category;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    amount: number;

    @Column({ type: 'enum', enum: ['income', 'expense'] })
    type: 'income' | 'expense';

    @Column({ type: 'varchar', length: 500, nullable: true })
    description: string | null;

    // Ngày giao dịch thực tế (khác createdAt - ngày record được tạo trong DB)
    @Index()
    @Column({ type: 'date' })
    transactionDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}