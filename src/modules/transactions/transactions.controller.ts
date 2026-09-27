import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TransactionsService } from './transactions.service.js';
import { CreateTransactionDto } from './dto/create.transaction.js';
import { UpdateTransactionDto } from './dto/update.transaction.js';
import { FilterTransactionDto } from './dto/filter-transaction.dto.js';
import { CurrentUser, type AuthenticatedUser } from '../../common/index.js';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) {}

    @Post()
    create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTransactionDto) {
        return this.transactionsService.create(user.id, dto);
    }

    @Get()
    findAll(
        @CurrentUser() user: AuthenticatedUser,
        @Query() filter: FilterTransactionDto,
    ) {
        return this.transactionsService.findAll(user.id, filter);
    }

    @Get('summary')
    getSummary(
        @CurrentUser() user: AuthenticatedUser,
        @Query('month') month: string,
        @Query('year') year: string,
    ) {
        return this.transactionsService.getMonthlySummary(
            user.id,
            parseInt(month, 10),
            parseInt(year, 10),
        );
    }

    @Get(':id')
    findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
        return this.transactionsService.findOne(user.id, id);
    }

    @Patch(':id')
    update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body() dto: UpdateTransactionDto,
    ) {
        return this.transactionsService.update(user.id, id, dto);
    }

    @Delete(':id')
    remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
        return this.transactionsService.remove(user.id, id);
    }
}