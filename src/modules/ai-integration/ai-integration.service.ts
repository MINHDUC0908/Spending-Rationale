import {
    BadGatewayException,
    GatewayTimeoutException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiAnalyzeResult {
    ocr: {
        merchant_name: string | null;
        total_amount: number | null;
        transaction_date: string | null;
        items: { name: string; price: number; quantity: number }[];
        raw_text: string;
    };
    classification: {
        category: string;
        confidence_score: number;
        source: string;
    };
}

export interface UserCategoryHint {
    id: string;
    name: string;
}

@Injectable()
export class AiIntegrationService {
    private readonly logger = new Logger(AiIntegrationService.name);

    constructor(private readonly configService: ConfigService) { }

    async analyzeReceipt(
        imageUrl: string,
        categories?: UserCategoryHint[],
    ): Promise<AiAnalyzeResult> {
        const baseUrl = this.configService.get<string>('aiService.url');
        const timeout = this.configService.get<number>('aiService.timeout') ?? 30000;

        const startTime = Date.now();
        this.logger.log(`Bắt đầu gửi ảnh sang AI service: ${imageUrl}`);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${baseUrl}/receipt/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_url: imageUrl,
                    user_categories: categories ?? [],
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const detail = await response.text();
                this.logger.error(`AI service phản hồi lỗi [${response.status}]: ${detail}`);
                throw new BadGatewayException(`AI service lỗi: ${detail}`);
            }

            const data = (await response.json()) as AiAnalyzeResult;
            const duration = Date.now() - startTime;
            this.logger.log(`AI service xử lý thành công trong ${duration}ms`);

            return data;
        } catch (error: any) {
            if (error instanceof BadGatewayException) {
                throw error;
            }

            // Phân biệt Timeout (504) và Lỗi kết nối (502)
            if (error.name === 'AbortError') {
                this.logger.error(`AI service timeout sau ${timeout}ms`);
                throw new GatewayTimeoutException(
                    `AI service phản hồi quá lâu (vượt quá ${timeout / 1000}s)`,
                );
            }

            this.logger.error(`Không thể kết nối đến AI service: ${error.message}`);
            throw new BadGatewayException('Không thể kết nối đến AI service');
        } finally {
            clearTimeout(timer);
        }
    }
}
