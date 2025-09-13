import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { 
  CreateCategoryDtoType, 
  UpdateCategoryDtoType, 
  ToggleCategoryDtoType,
  BulkUpsertCategoryDtoType,
  AdminListCategoryQueryDtoType 
} from './dto';

@Injectable()
export class CategoriesService {
  private readonly CACHE_KEY = 'cache:categories:public';
  private readonly CACHE_TTL = 600; // 10분

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // 퍼블릭 카테고리 목록 (캐시 사용)
  async listPublic() {
    // 캐시에서 조회
    const cached = await this.redis.get(this.CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    // DB에서 조회
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        slug: true,
        nameKo: true,
        nameEn: true,
        icon: true,
        description: true,
        order: true,
      },
    });

    // 캐시에 저장
    await this.redis.setex(this.CACHE_KEY, this.CACHE_TTL, JSON.stringify(categories));

    return categories;
  }

  // 관리자 카테고리 목록
  async listAdmin(query: AdminListCategoryQueryDtoType) {
    const { q, isActive, page, size } = query;
    const skip = (page - 1) * size;

    const where: any = {};
    
    if (q) {
      where.OR = [
        { nameKo: { contains: q } },
        { nameEn: { contains: q } },
        { slug: { contains: q } },
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: { order: 'asc' },
        skip,
        take: size,
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  // 카테고리 생성
  async create(dto: CreateCategoryDtoType) {
    try {
      const category = await this.prisma.category.create({
        data: dto,
      });

      // 캐시 무효화
      await this.invalidateCache();

      return category;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('이미 존재하는 슬러그입니다');
      }
      throw error;
    }
  }

  // 카테고리 수정
  async update(id: number, dto: UpdateCategoryDtoType) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다');
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: dto,
    });

    // 캐시 무효화
    await this.invalidateCache();

    return updated;
  }

  // 카테고리 활성화 토글
  async toggleActive(id: number, dto: ToggleCategoryDtoType) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다');
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: { isActive: dto.isActive },
    });

    // 캐시 무효화
    await this.invalidateCache();

    return updated;
  }

  // 일괄 업서트
  async bulkUpsert(dto: BulkUpsertCategoryDtoType) {
    const results = [];

    for (const item of dto.items) {
      try {
        const category = await this.prisma.category.upsert({
          where: { slug: item.slug },
          update: item,
          create: item,
        });
        results.push(category);
      } catch (error) {
        console.error(`Failed to upsert category ${item.slug}:`, error);
        // 개별 실패는 로그만 남기고 계속 진행
      }
    }

    // 캐시 무효화
    await this.invalidateCache();

    return { success: results.length, total: dto.items.length, results };
  }

  // ID로 카테고리 조회
  async findById(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다');
    }

    return category;
  }

  // 슬러그로 카테고리 조회
  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다');
    }

    return category;
  }

  // 캐시 무효화
  private async invalidateCache() {
    await this.redis.del(this.CACHE_KEY);
  }
}
