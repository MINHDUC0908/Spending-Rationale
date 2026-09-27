import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';
import appConfig, {
  aiServiceConfig,
  jwtConfig,
  redisConfig,
  s3Config,
} from './config/app.config.js';
import databaseConfig from './config/database.config.js';
import { validationSchema } from './config/validation.schema.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { WalletsModule } from './modules/wallets/wallets.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { TransactionsModule } from './modules/transactions/transactions.module.js';
import { BudgetsModule } from './modules/budgets/budgets.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, aiServiceConfig, s3Config],
      validationSchema, // import trực tiếp, không dùng require()
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<TypeOrmModuleOptions>('database') as TypeOrmModuleOptions,
    }),
    UsersModule,
    AuthModule,
    WalletsModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
  ],
  providers: [
    // Đăng ký ThrottlerGuard toàn cục — mọi route đều bị giới hạn theo cấu hình
    // mặc định trong AuthModule, trừ khi dùng @SkipThrottle()
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}