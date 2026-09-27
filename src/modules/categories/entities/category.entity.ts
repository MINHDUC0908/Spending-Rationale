import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'enum', enum: ['income', 'expense'] })
    type: 'income' | 'expense';

    @Column({ type: 'varchar', length: 100, nullable: true })
    icon: string | null;

    // true = category hệ thống, hiển thị cho mọi user
    @Column({ type: 'boolean', default: false })
    isDefault: boolean;

    // null nếu là category mặc định, có giá trị nếu do user tự tạo
    @Column({ type: 'varchar', nullable: true })
    userId: string | null;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User | null;

    @CreateDateColumn()
    createdAt: Date;
}