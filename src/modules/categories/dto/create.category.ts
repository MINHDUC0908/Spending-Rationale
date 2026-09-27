import { IsString, IsEnum, IsOptional, Length } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @Length(1, 255)
    name: string;

    @IsEnum(['income', 'expense'])
    type: 'income' | 'expense';

    @IsOptional()
    @IsString()
    icon?: string;
}