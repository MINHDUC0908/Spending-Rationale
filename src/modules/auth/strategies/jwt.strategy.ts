import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service.js';

// Khớp với payload đã ký trong AuthService.login()
export interface JwtPayload {
  sub: string;   // user ID
  email: string;
  iat?: number;  // issued at (tự động thêm bởi jsonwebtoken)
  exp?: number;  // expiration (tự động thêm bởi jsonwebtoken)
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // Lấy token từ header: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Tự động từ chối token hết hạn
      ignoreExpiration: false,
      // Secret lấy từ .env — không bao giờ hard-code
      secretOrKey: config.get<string>('jwt.secret') as string,
    });
  }

  /**
   * Passport gọi validate() sau khi verify chữ ký JWT thành công.
   * Giá trị trả về sẽ được gắn vào request.user
   * và có thể lấy bằng @CurrentUser() decorator.
   */
  async validate(payload: JwtPayload) {
    // Kiểm tra user vẫn còn tồn tại trong DB
    // (phòng trường hợp tài khoản bị xóa sau khi token được cấp)
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị xóa');
    }

    // Trả về object này → Passport gắn vào req.user
    return { id: user.id, email: user.email, fullName: user.fullName };
  }
}
