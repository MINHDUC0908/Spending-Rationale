import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

export interface ErrorResponse {
    success: false;
    statusCode: number;
    message: string;
    errors?: any[];
    timestamp: string;
    path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch (exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
        let errors: any[] | undefined = undefined;

        if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const res = exceptionResponse as Record<string, any>;
                if (Array.isArray(res.message)) {
                    // Xử lý lỗi validation từ ValidationPipe
                    message = 'Dữ liệu không hợp lệ';
                    errors = res.message;
                } else {
                    message = res.message || exception.message;
                }
            }
        } else if (exception instanceof Error) {
            // Xử lý một số mã lỗi phổ biến của MySQL qua TypeORM
            const err = exception as any;
            if (err.code === 'ER_DUP_ENTRY') {
                statusCode = HttpStatus.CONFLICT;
                message = 'Dữ liệu đã tồn tại trong hệ thống';
            } else {
                message = exception.message || message;
            }
        }

        const errorPayload: ErrorResponse = {
            success: false,
            statusCode,
            message,
            ...(errors ? { errors } : {}),
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        if (statusCode >= 500) {
            this.logger.error(
                `[${request.method}] ${request.url} - Status: ${statusCode} - Error: ${
                    exception instanceof Error ? exception.stack : JSON.stringify(exception)
                }`,
            );
        } else {
            this.logger.warn(
                `[${request.method}] ${request.url} - Status: ${statusCode} - Message: ${message}`,
            );
        }

        response.status(statusCode).json(errorPayload);
    }
}
