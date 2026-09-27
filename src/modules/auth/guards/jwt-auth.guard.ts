import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Gắn @UseGuards(JwtAuthGuard) vào route để yêu cầu đăng nhập.
 * Nếu không có token hoặc token không hợp lệ → 401 Unauthorized tự động.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
