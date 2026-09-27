import { IsUUID, IsNumber, IsPositive, IsInt, Min, Max } from 'class-validator';

export class CreateBudgetDto {
    @IsUUID()
    categoryId: string;

    @IsNumber()
    @IsPositive()
    amountLimit: number;

    @IsInt()
    @Min(1)
    @Max(12)
    month: number;

    @IsInt()
    @Min(2020)
    year: number;
}