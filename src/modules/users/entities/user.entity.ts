import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Email lấy từ Google, dùng để định danh + hiển thị
    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    fullName: string;

    // Ảnh đại diện Google trả về
    @Column({ type: 'varchar', length: 500, nullable: true })
    avatarUrl: string | null;

    // ID duy nhất Google cấp cho tài khoản (sub trong payload)
    // Dùng để tra cứu user khi họ login lại lần sau
    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255, nullable: true })
    googleId: string | null;

    // Cho phép mở rộng sau này nếu thêm đăng nhập thường (email/password)
    @Column({ type: 'varchar', length: 255, nullable: true, select: false })
    password: string | null;

    // Đánh dấu nguồn đăng nhập, hữu ích khi user có cả 2 cách login
    @Column({ type: 'enum', enum: ['google', 'local'], default: 'google' })
    provider: 'google' | 'local';

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}