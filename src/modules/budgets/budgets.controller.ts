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
import { BudgetsService } from './budgets.service.js';
import { CreateBudgetDto } from './dto/create.budget.js';
import { UpdateBudgetDto } from './dto/update.budget.js';
import { CurrentUser, type AuthenticatedUser } from '../../common/index.js';

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
    constructor (private readonly budgetsService: BudgetsService) {}

    @Post()
    create (@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBudgetDto) {
        return this.budgetsService.create(user.id, dto);
    }

    @Get()
    findAll (
        @CurrentUser() user: AuthenticatedUser,
        @Query('month') month?: string,
        @Query('year') year?: string,
    ) {
        return this.budgetsService.findAll(
            user.id,
            month ? parseInt(month, 10) : undefined,
            year ? parseInt(year, 10) : undefined,
        );
    }

    // Đặt trước ':id' để tránh Nest hiểu nhầm "status" là 1 id
    @Get('status')
    getStatus (
        @CurrentUser() user: AuthenticatedUser,
        @Query('month') month: string,
        @Query('year') year: string,
    ) {
        return this.budgetsService.getStatus(
            user.id,
            parseInt(month, 10),
            parseInt(year, 10),
        );
    }

    @Get(':id')
    findOne (@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
        return this.budgetsService.findOne(user.id, id);
    }

    @Patch(':id')
    update (
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body() dto: UpdateBudgetDto,
    ) {
        return this.budgetsService.update(user.id, id, dto);
    }

    @Delete(':id')
    remove (@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
        return this.budgetsService.remove(user.id, id);
    }
}