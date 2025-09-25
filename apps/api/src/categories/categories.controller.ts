import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query, 
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { 
  CreateCategoryDtoType, 
  UpdateCategoryDtoType, 
  ToggleCategoryDtoType,
  BulkUpsertCategoryDtoType,
  AdminListCategoryQueryDtoType 
} from './dto';
import { JwtGuard } from '../auth/jwt.guard';
import { User } from '../auth/user.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // 퍼블릭 카테고리 목록
  @Get()
  async listPublic() {
    const categories = await this.categoriesService.listPublic();
    return {
      success: true,
      data: categories,
    };
  }

  // 관리자 카테고리 목록
  @Get('admin')
  @UseGuards(JwtGuard)
  async listAdmin(@Query() query: AdminListCategoryQueryDtoType) {
    const result = await this.categoriesService.listAdmin(query);
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  // 관리자 카테고리 생성
  @Post('admin')
  @UseGuards(JwtGuard)
  async create(@Body() dto: CreateCategoryDtoType) {
    const category = await this.categoriesService.create(dto);
    return {
      success: true,
      data: category,
    };
  }

  // 관리자 카테고리 수정
  @Put('admin/:id')
  @UseGuards(JwtGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDtoType,
  ) {
    const category = await this.categoriesService.update(id, dto);
    return {
      success: true,
      data: category,
    };
  }

  // 관리자 카테고리 활성화 토글
  @Post('admin/:id/toggle')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleCategoryDtoType,
  ) {
    const category = await this.categoriesService.toggleActive(id, dto);
    return {
      success: true,
      data: category,
    };
  }

  // 관리자 일괄 업서트
  @Post('admin/bulk-upsert')
  @UseGuards(JwtGuard)
  async bulkUpsert(@Body() dto: BulkUpsertCategoryDtoType) {
    const result = await this.categoriesService.bulkUpsert(dto);
    return {
      success: true,
      data: result,
    };
  }

  // ID로 카테고리 조회
  @Get('admin/:id')
  @UseGuards(JwtGuard)
  async findById(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoriesService.findById(id);
    return {
      success: true,
      data: category,
    };
  }
}
