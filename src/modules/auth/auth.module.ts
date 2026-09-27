import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from '../users/users.module.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    // PassportModule: Cần thiết để @UseGuards(JwtAuthGuard) hoạt động
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // ThrottlerModule: Rate limiting chống brute-force cho endpoint login
    ThrottlerModule.forRoot({
      throttlers: [
        {
          limit: 10,
          ttl: 60_000,
        },
      ],
    }),

    // JwtModule: Lấy secret & expiresIn từ ConfigService (.env)
    // Tuyệt đối không hard-code secret ở đây
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: (config.get<string>('jwt.expiresIn') ?? '1d') as JwtModuleOptions['signOptions'] extends { expiresIn?: infer E } ? E : never,
        },
      }),
    }),

    // UsersModule: Cung cấp UsersService cho AuthService và JwtStrategy
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy, // Đăng ký strategy để Passport nhận diện 'jwt'
  ],
  // Export PassportModule để các module khác (Wallets, v.v.) dùng JwtAuthGuard
  // mà không cần tự import PassportModule vào từng module
  exports: [PassportModule, JwtStrategy],
})
export class AuthModule { }
