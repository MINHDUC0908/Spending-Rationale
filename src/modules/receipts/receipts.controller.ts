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
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { ReceiptsService } from './receipts.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ConfirmReceiptDto } from './dto/confirm.dto.js';

interface JwtUser {
    userId: string;
    email: string;
}

// Thư mục lưu ảnh (ESM không có __dirname nên dùng process.cwd())
const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
}

@ApiBearerAuth()
@ApiTags('receipts')
@UseGuards(JwtAuthGuard)
@Controller('receipts')
export class ReceiptsController {
    constructor (private readonly receiptsService: ReceiptsService) {}

    @Post('scan')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: { image: { type: 'string', format: 'binary' } },
        },
    })
    @UseInterceptors(
        FileInterceptor('image', {
            storage: multer.diskStorage({
                destination: uploadDir,
                filename: (_req, file, callback) =>
                    callback(null, `${randomUUID()}${extname(file.originalname)}`),
            }),
            limits: { fileSize: 10 * 1024 * 1024 }, // tối đa 10MB
            fileFilter: (_req, file, callback) => {
                if (!file.mimetype.startsWith('image/')) {
                    return callback(new BadRequestException('Chỉ nhận file ảnh'), false);
                }
                callback(null, true);
            },
        }),
    )
    scan (@CurrentUser() user: JwtUser, @UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Thiếu file ảnh (field name: image)');
        }
        return this.receiptsService.scan(user.userId, file.filename);
    }

    @Post(':id/confirm')
    confirm (
        @CurrentUser() user: JwtUser,
        @Param('id') id: string,
        @Body() dto: ConfirmReceiptDto,
    ) {
        return this.receiptsService.confirm(user.userId, id, dto);
    }

    @Get(':id')
    findOne (@CurrentUser() user: JwtUser, @Param('id') id: string) {
        return this.receiptsService.findOne(user.userId, id);
    }
}