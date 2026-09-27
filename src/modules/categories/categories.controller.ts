import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../../common/index.js';
import { UpdateCategoryDto } from './dto/update.category.js';
import { CreateCategoryDto } from './dto/create.category.js';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)  
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

    @Post()
    create (@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCategoryDto) {
        return this.categoriesService.create(user.id, dto);
    }
 
    @Get()
    findAll (@CurrentUser() user: AuthenticatedUser) {
        return this.categoriesService.findAll(user.id);
    }
 
    @Get(':id')
    findOne (@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
        return this.categoriesService.findOne(user.id, id);
    }
 
    @Patch(':id')
    update (
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body() dto: UpdateCategoryDto,
    ) {
        return this.categoriesService.update(user.id, id, dto);
    }
 
    @Delete(':id')
    remove (@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
        return this.categoriesService.remove(user.id, id);
    }
}

