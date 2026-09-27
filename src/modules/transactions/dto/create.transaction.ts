import {
    IsUUID,
    IsNumber,
    IsPositive,
    IsEnum,
    IsOptional,
    IsString,
    IsDateString,
    Length,
} from 'class-validator';

export class CreateTransactionDto {
    @IsUUID()
    walletId: string;

    @IsUUID()
    categoryId: string;

    @IsNumber()
    @IsPositive()
    amount: number;

    @IsEnum(['income', 'expense'])
    type: 'income' | 'expense';

    @IsOptional()
    @IsString()
    @Length(0, 500)
    description?: string;

    @IsDateString()
    transactionDate: string;
}