import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Response } from 'express';

export interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    data: T;
    meta?: any;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>>
{
    intercept (
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ApiResponse<T>> {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<Response>();

        return next.handle().pipe(
            map((result) => {
                const statusCode = response.statusCode;

                // Nếu kết quả trả về đã có cấu trúc phân trang { data, meta }
                if (
                    result &&
                    typeof result === 'object' &&
                    'data' in result &&
                    'meta' in result
                ) {
                    return {
                        success: true,
                        statusCode,
                        data: result.data,
                        meta: result.meta,
                    };
                }

                // Nếu kết quả đã được format trước đó (ví dụ từ custom handler)
                if (result && typeof result === 'object' && 'success' in result) {
                    return result;
                }

                return {
                    success: true,
                    statusCode,
                    data: result ?? null,
                };
            }),
        );
    }
}
