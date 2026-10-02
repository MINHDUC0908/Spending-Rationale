import { IsString, IsOptional, IsNumber, Min, Length } from 'class-validator';

export class CreateWalletDto {
    @IsString()
    @Length(1, 255)
    name: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    balance?: number;

    @IsOptional()
    @IsString()
    @Length(3, 10)
    currency?: string;
}