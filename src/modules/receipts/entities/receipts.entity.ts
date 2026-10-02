import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

@Entity('receipts')
export class Receipt {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    userId: string;

    @Column({ type: 'varchar', length: 500 })
    imageUrl: string;

    // Toàn bộ kết quả AI trả về (OCR + phân loại), lưu dạng JSON
    @Column({ type: 'json', nullable: true })
    rawOcrJson: any | null;

    // pending: vừa upload | done: AI xong, chờ user xác nhận
    // confirmed: đã tạo transaction | failed: AI lỗi
    @Column({
        type: 'enum',
        enum: ['pending', 'done', 'confirmed', 'failed'],
        default: 'pending',
    })
    ocrStatus: 'pending' | 'done' | 'confirmed' | 'failed';

    @Column({ type: 'decimal', precision: 4, scale: 3, nullable: true })
    ocrConfidence: number | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    errorMessage: string | null;

    // Transaction được tạo sau khi user xác nhận
    @Column({ type: 'varchar', nullable: true })
    transactionId: string | null;

    @CreateDateColumn()
    createdAt: Date;
}