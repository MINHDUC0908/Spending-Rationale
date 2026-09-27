import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create.transaction.js';


export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}