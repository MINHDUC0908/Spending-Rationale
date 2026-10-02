import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

// Lưu dấu vết AI cho từng transaction - dữ liệu này dùng để fine-tune PhoBERT sau này
@Entity('transaction_ai_meta')
export class TransactionAiMeta {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column()
    transactionId: string;

    @Column({ type: 'varchar', nullable: true })
    receiptId: string | null;

    @Column({ type: 'varchar', length: 255 })
    predictedCategory: string;

    @Column({ type: 'decimal', precision: 4, scale: 3 })
    confidenceScore: number;

    // "gemini" hoặc "phobert" - model nào đã trả lời
    @Column({ type: 'varchar', length: 50 })
    source: string;

    @Column({ type: 'boolean', default: false })
    isUserCorrected: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    correctedCategory: string | null;

    @CreateDateColumn()
    createdAt: Date;
}