import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class FilterTransactionDto extends PaginationDto {
    @IsOptional()
    @IsUUID('4', { message: 'walletId phải là UUID hợp lệ' })
    walletId?: string;

    @IsOptional()
    @IsDateString({}, { message: 'from phải là định dạng ngày hợp lệ (YYYY-MM-DD)' })
    from?: string;

    @IsOptional()
    @IsDateString({}, { message: 'to phải là định dạng ngày hợp lệ (YYYY-MM-DD)' })
    to?: string;
}
