import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import multer from 'multer';
import { ReceiptsService } from './receipts.service.js';
import { CloudinaryService } from '../../shared/cloudinary.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { ConfirmReceiptDto } from './dto/confirm.dto.js';

@ApiBearerAuth()
@ApiTags('receipts')
@UseGuards(JwtAuthGuard)
@Controller('receipts')
export class ReceiptsController {
    constructor(
        private readonly receiptsService: ReceiptsService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    @Post('scan')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: { image: { type: 'string', format: 'binary' } },
        },
    })
    // Dùng memoryStorage thay vì diskStorage:
    // File được giữ trong RAM buffer, không ghi ra đĩa local
    // → Upload thẳng lên Cloudinary → URL HTTPS vĩnh viễn
    @UseInterceptors(
        FileInterceptor('image', {
            storage: multer.memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 }, // tối đa 10MB
            fileFilter: (_req, file, callback) => {
                if (!file.mimetype.startsWith('image/')) {
                    return callback(new BadRequestException('Chỉ nhận file ảnh'), false);
                }
                callback(null, true);
            },
        }),
    )
    async scan(
        @CurrentUser() user: AuthenticatedUser,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('Thiếu file ảnh (field name: image)');
        }

        // Upload buffer lên Cloudinary và nhận về URL HTTPS
        const imageUrl = await this.cloudinaryService.uploadBuffer(
            file.buffer,
            'receipts', // folder trên Cloudinary
        );

        return this.receiptsService.scan(user.id, imageUrl);
    }

    @Post(':id/confirm')
    confirm(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body() dto: ConfirmReceiptDto,
    ) {
        return this.receiptsService.confirm(user.id, id, dto);
    }

    @Get(':id')
    findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
        return this.receiptsService.findOne(user.id, id);
    }
}