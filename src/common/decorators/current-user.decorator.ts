import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthenticatedUser {
    id: string;
    email: string;
    fullName: string;
}

/**
 * Decorator lấy thông tin user đã xác thực từ Request (sau khi qua JwtAuthGuard).
 * 
 * @example
 * // 1. Lấy toàn bộ object user:
 * @Get('me')
 * getMe(@CurrentUser() user: AuthenticatedUser) { ... }
 * 
 * // 2. Lấy riêng một trường (ví dụ id):
 * @Get('transactions')
 * getTransactions(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
    (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
        const user = request.user;

        if (!user) {
            return null;
        }

        return data ? user[data] : user;
    },
);
