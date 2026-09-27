import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create.category.js';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}