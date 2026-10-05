import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
    AiAnalyzeResult,
    AiIntegrationService,
} from '../ai-integration/ai-integration.service.js';
import { CategoriesService } from '../categories/categories.service.js';
import { TransactionsService } from '../transactions/transactions.service.js';
import { Receipt } from './entities/receipts.entity.js';
import { TransactionAiMeta } from './entities/transaction-ai-meta.entity.js';
import { ConfirmReceiptDto } from './dto/confirm.dto.js';

@Injectable()
export class ReceiptsService {
    constructor(
        @InjectRepository(Receipt)
        private readonly receiptRepository: Repository<Receipt>,
        @InjectRepository(TransactionAiMeta)
        private readonly aiMetaRepository: Repository<TransactionAiMeta>,
        private readonly aiIntegrationService: AiIntegrationService,
        private readonly categoriesService: CategoriesService,
        private readonly transactionsService: TransactionsService,
        private readonly dataSource: DataSource,
    ) { }

    // Bước 1: user upload ảnh -> Cloudinary -> AI đọc -> trả bản nháp để user xem/sửa
    // imageUrl: URL HTTPS từ Cloudinary (đã upload trước khi gọi hàm này)
    async scan(userId: string, imageUrl: string) {
        const receipt = await this.receiptRepository.save(
            this.receiptRepository.create({ userId, imageUrl, ocrStatus: 'pending' }),
        );

        let result: AiAnalyzeResult;
        try {
            result = await this.aiIntegrationService.analyzeReceipt(imageUrl);
        } catch (error) {
            receipt.ocrStatus = 'failed';
            receipt.errorMessage = String((error as Error).message).slice(0, 500);
            await this.receiptRepository.save(receipt);
            throw error;
        }

        receipt.rawOcrJson = result;
        receipt.ocrConfidence = result.classification.confidence_score;
        receipt.ocrStatus = 'done';
        await this.receiptRepository.save(receipt);

        const suggested = await this.matchCategory(userId, result.classification.category);

        return {
            receiptId: receipt.id,
            imageUrl,
            merchantName: result.ocr.merchant_name,
            amount: result.ocr.total_amount,
            transactionDate: result.ocr.transaction_date,
            items: result.ocr.items,
            suggestedCategory: suggested
                ? { id: suggested.id, name: suggested.name }
                : null,
            confidenceScore: result.classification.confidence_score,
            source: result.classification.source,
        };
    }

    // Bước 2: user xác nhận (có thể sửa) -> tạo Transaction thật + lưu dấu vết AI
    async confirm(userId: string, receiptId: string, dto: ConfirmReceiptDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Lấy receipt và khoá bi quan (pessimistic_write) để chống double-confirm race condition
            const receipt = await queryRunner.manager.findOne(Receipt, {
                where: { id: receiptId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!receipt) {
                throw new NotFoundException('Không tìm thấy hóa đơn');
            }
            if (receipt.userId !== userId) {
                throw new ForbiddenException('Bạn không có quyền truy cập hóa đơn này');
            }
            if (receipt.ocrStatus !== 'done') {
                throw new BadRequestException(
                    `Hóa đơn ở trạng thái "${receipt.ocrStatus}", không thể xác nhận`,
                );
            }

            const analysis = receipt.rawOcrJson as AiAnalyzeResult;
            const predicted = await this.matchCategory(userId, analysis.classification.category);

            // Ưu tiên giá trị user sửa, không có thì dùng giá trị AI đọc
            const categoryId = dto.categoryId ?? predicted?.id;
            const amount = dto.amount ?? analysis.ocr.total_amount;

            if (!categoryId) {
                throw new BadRequestException('Chưa có category, hãy chọn categoryId');
            }
            if (!amount) {
                throw new BadRequestException('AI không đọc được số tiền, hãy nhập amount');
            }

            const finalCategory = await this.categoriesService.findOne(userId, categoryId);

            // Tạo transaction trong cùng transaction DB
            const transaction = await this.transactionsService.create(
                userId,
                {
                    walletId: dto.walletId,
                    categoryId,
                    amount,
                    type: 'expense',
                    description: dto.description ?? analysis.ocr.merchant_name ?? undefined,
                    transactionDate:
                        dto.transactionDate ??
                        analysis.ocr.transaction_date ??
                        new Date().toISOString().slice(0, 10),
                },
                queryRunner.manager,
            );

            // User đổi category khác gợi ý của AI = dữ liệu sửa sai, dùng để train lại model
            const isUserCorrected = predicted?.id !== finalCategory.id;

            const aiMeta = queryRunner.manager.create(TransactionAiMeta, {
                transactionId: transaction.id,
                receiptId: receipt.id,
                predictedCategory: analysis.classification.category,
                confidenceScore: analysis.classification.confidence_score,
                source: analysis.classification.source,
                isUserCorrected,
                correctedCategory: isUserCorrected ? finalCategory.name : null,
            });
            await queryRunner.manager.save(aiMeta);

            receipt.transactionId = transaction.id;
            receipt.ocrStatus = 'confirmed';
            await queryRunner.manager.save(receipt);

            await queryRunner.commitTransaction();

            return transaction;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findOne(userId: string, id: string) {
        return this.findOwned(userId, id);
    }

    private async findOwned(userId: string, id: string): Promise<Receipt> {
        const receipt = await this.receiptRepository.findOne({ where: { id } });

        if (!receipt) {
            throw new NotFoundException('Không tìm thấy hóa đơn');
        }
        if (receipt.userId !== userId) {
            throw new ForbiddenException('Bạn không có quyền truy cập hóa đơn này');
        }

        return receipt;
    }

    // Tìm category expense của user (mặc định hoặc riêng) khớp tên AI trả về
    // Tối ưu: query thảng vào DB thay vì load hết vào memory rồi filter
    private matchCategory(userId: string, name: string) {
        return this.categoriesService.findByName(userId, name, 'expense');
    }
}