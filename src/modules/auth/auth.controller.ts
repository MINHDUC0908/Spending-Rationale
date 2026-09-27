import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser, type AuthenticatedUser } from './decorators/current-user.decorator.js';

@ApiTags('Auth')
@Controller('auth')
@SkipThrottle() // Bỏ qua global throttle; chỉ áp dụng cho endpoint cụ thể
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * POST /auth/register
     * Đăng ký tài khoản mới với email & password
     */
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Đăng ký tài khoản mới (email & password)' })
    async register(@Body() dto: RegisterDto) {
        const user = await this.authService.register(dto);
        return {
            message: 'Đăng ký thành công',
            data: user,
        };
    }

    /**
     * POST /auth/login
     * Đăng nhập — áp dụng rate limit chống brute-force:
     * tối đa 5 lần thử trong 60 giây theo mỗi IP
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    @ApiOperation({ summary: 'Đăng nhập — trả về JWT access token' })
    async login(@Body() dto: LoginDto) {
        const result = await this.authService.login(dto);
        return {
            message: 'Đăng nhập thành công',
            data: result,
        };
    }

    /**
     * GET /auth/me
     * Xem thông tin profile của chính mình.
     * Yêu cầu gửi kèm JWT token trong header: Authorization: Bearer <token>
     * Nếu không có token hoặc token sai → 401 Unauthorized
     */
    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thông tin người dùng đang đăng nhập' })
    getMe(@CurrentUser() user: AuthenticatedUser) {
        return {
            message: 'Lấy thông tin thành công',
            data: user,
        };
    }
}
