import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiptsService } from './receipts.service.js';
import { ReceiptsController } from './receipts.controller.js';
import { CloudinaryService } from '../../shared/cloudinary.service.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { Receipt } from './entities/receipts.entity.js';
import { TransactionAiMeta } from './entities/transaction-ai-meta.entity.js';
import { AiIntegrationModule } from '../ai-integration/ai-integration.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([Receipt, TransactionAiMeta]),
        CategoriesModule,
        TransactionsModule,
        AiIntegrationModule,
        AuthModule,
    ],
    controllers: [ReceiptsController],
    providers: [ReceiptsService, CloudinaryService],
})
export class ReceiptsModule { }