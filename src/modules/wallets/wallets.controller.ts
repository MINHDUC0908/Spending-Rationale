import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateWalletDto } from './dto/create.wallet.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UpdateWalletDto } from './dto/update.wallet.dto.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
    constructor(private readonly walletsService: WalletsService) { }

    @Post()
    create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWalletDto) {
        return this.walletsService.create(user.id, dto);
    }

    @Get()
    findAll(@CurrentUser() user: AuthenticatedUser) {
        return this.walletsService.findAll(user.id);
    }

    @Get(':id')
    findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
        return this.walletsService.findOne(user.id, id);
    }

    @Patch(':id')
    update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body() dto: UpdateWalletDto,
    ) {
        return this.walletsService.update(user.id, id, dto);
    }

    @Delete(':id')
    remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
        return this.walletsService.remove(user.id, id);
    }
}

