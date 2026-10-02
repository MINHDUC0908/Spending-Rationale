import {
    IsUUID,
    IsOptional,
    IsNumber,
    IsPositive,
    IsString,
    IsDateString,
    Length,
} from 'class-validator';

// User xác nhận kết quả AI - chỉ walletId là bắt buộc, các field khác để trống thì dùng giá trị AI đọc được
export class ConfirmReceiptDto {
    @IsUUID()
    walletId: string;

    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    amount?: number;

    @IsOptional()
    @IsDateString()
    transactionDate?: string;

    @IsOptional()
    @IsString()
    @Length(0, 500)
    description?: string;
}