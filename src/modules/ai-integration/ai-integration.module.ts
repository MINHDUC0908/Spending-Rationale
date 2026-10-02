import { Module } from '@nestjs/common';
import { AiIntegrationService } from './ai-integration.service.js';

@Module({
    providers: [AiIntegrationService],
    exports: [AiIntegrationService],
})
export class AiIntegrationModule {}