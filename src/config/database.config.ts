import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity.js';
import { Wallet } from '../modules/wallets/entities/wallet.entity.js';
import { Category } from '../modules/categories/entities/category.entity.js';
import { Transaction } from '../modules/transactions/entities/transaction.entity.js';
import { Budget } from '../modules/budgets/entities/budget.entity.js';

export default registerAs(
    'database',
    (): TypeOrmModuleOptions => ({
        type: 'mysql',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,

        entities: [User, Wallet, Category, Transaction, Budget], 

        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV === 'development',
        retryAttempts: 5,
        retryDelay: 3000,
        charset: 'utf8mb4',
    }),
);