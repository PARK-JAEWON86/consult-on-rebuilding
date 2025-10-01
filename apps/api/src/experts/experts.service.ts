import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpertApplicationDto } from './dto/expert-application.dto';
import { ExpertLevelsService } from '../expert-levels/expert-levels.service';
import { ulid } from 'ulid';
import { JsonValue } from '@prisma/client/runtime/library';

type ListParams = { 
  page: number; 
  size: number; 
  q?: string; 
  category?: string; 
  sort?: string 
};

@Injectable()
export class ExpertsService {
  constructor(
    private prisma: PrismaService,
    private expertLevelsService: ExpertLevelsService,
  ) {}

  async list(params: ListParams) {
    const { page, size, q, category, sort } = params;
    const where: any = {
      isActive: true,
      isProfileComplete: true,
      isProfilePublic: true
    };

    // Search query
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { title: { contains: q } },
        { bio: { contains: q } },
        { description: { contains: q } },
        { specialty: { contains: q } },
      ];
    }

    // Category filter - 정규화된 카테고리 테이블을 통해 검색
    if (category) {
      where.categoryLinks = {
        some: {
          category: {
            slug: category
          }
        }
      };
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'rating') orderBy = { ratingAvg: 'desc' };
    if (sort === '-rating') orderBy = { ratingAvg: 'asc' };
    if (sort === 'recent') orderBy = { createdAt: 'desc' };
    if (sort === 'experience') orderBy = { experience: 'desc' };
    if (sort === 'reviews') orderBy = { reviewCount: 'desc' };
    if (sort === 'sessions') orderBy = { totalSessions: 'desc' };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.expert.count({ where }),
      this.prisma.expert.findMany({
        where,
        orderBy,
        skip: (page - 1) * size,
        take: size,
        include: {
          categoryLinks: {
            include: {
              category: {
                select: {
                  nameKo: true,
                  nameEn: true,
                  slug: true,
                }
              }
            }
          },
          reviews: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  name: true,
                }
              }
            }
          }
        }
      }),
    ]);

    // JSON 문자열을 배열/객체로 파싱하는 헬퍼 함수들
    const parseJsonField = (field: JsonValue | null): any[] => {
      if (!field) return [];
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          console.warn(`Failed to parse JSON field: ${field}`);
          return [];
        }
      }
      return Array.isArray(field) ? field : [];
    };

    const parseJsonObject = (field: JsonValue | null): any => {
      if (!field) return {};
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          console.warn(`Failed to parse JSON object: ${field}`);
          return {};
        }
      }
      return typeof field === 'object' ? field : {};
    };

    // Transform data to include category information
    const transformedItems = items.map(expert => ({
      ...expert,
      // 기존 카테고리 정보
      categories: expert.categoryLinks.map(link => link.category.nameKo),
      categorySlugs: expert.categoryLinks.map(link => link.category.slug),
      recentReviews: expert.reviews,
      // JSON 문자열로 저장된 필드들을 실제 배열로 변환
      specialties: parseJsonField(expert.specialties),
      certifications: parseJsonField(expert.certifications),
      consultationTypes: parseJsonField(expert.consultationTypes),
      languages: parseJsonField(expert.languages),
      education: parseJsonField(expert.education),
      portfolioFiles: parseJsonField(expert.portfolioFiles),
      portfolioItems: parseJsonField(expert.portfolioItems),
      // 객체 필드들을 실제 객체로 변환
      availability: parseJsonObject(expert.availability),
      contactInfo: parseJsonObject(expert.contactInfo),
      socialProof: parseJsonObject(expert.socialProof),
      socialLinks: parseJsonObject(expert.socialLinks),
      // Calculate ranking score
      rankingScore: this.calculateRankingScore({
        totalSessions: expert.totalSessions,
        avgRating: expert.ratingAvg,
        reviewCount: expert.reviewCount,
        repeatClients: expert.repeatClients,
      }),
    }));

    return { total, items: transformedItems };
  }

  private calculateRankingScore(stats: {
    totalSessions: number;
    avgRating: number;
    reviewCount: number;
    repeatClients: number;
  }) {
    const { totalSessions, avgRating, reviewCount, repeatClients } = stats;

    // 가중치 적용한 랭킹 점수 계산
    const sessionScore = totalSessions * 0.3;
    const ratingScore = avgRating * 10;
    const reviewScore = reviewCount * 0.5;
    const repeatScore = repeatClients * 0.8;

    return sessionScore + ratingScore + reviewScore + repeatScore;
  }

  async findByDisplayId(displayId: string) {
    const expert = await this.prisma.expert.findUnique({
      where: { displayId },
      include: {
        categoryLinks: {
          include: {
            category: {
              select: {
                nameKo: true,
                nameEn: true,
                slug: true,
              }
            }
          }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                name: true,
              }
            }
          }
        },
        availabilitySlots: {
          where: { isActive: true },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        } // Include availability slots from normalized table
      }
    });

    if (!expert) {
      return null;
    }

    // JSON 문자열로 저장된 필드들을 실제 배열로 변환
    const parseJsonField = (field: JsonValue | null): any[] => {
      if (!field) return [];
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          console.warn(`Failed to parse JSON field: ${field}`);
          return [];
        }
      }
      return Array.isArray(field) ? field : [];
    };

    const parseJsonObject = (field: JsonValue | null): any => {
      if (!field) return {};
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          console.warn(`Failed to parse JSON object: ${field}`);
          return {};
        }
      }
      return typeof field === 'object' ? field : {};
    };

    // 레벨 정보 계산
    const stats = {
      totalSessions: expert.totalSessions || 0,
      avgRating: expert.ratingAvg || 0,
      reviewCount: expert.reviewCount || 0,
      repeatClients: expert.repeatClients || 0,
      likeCount: 0
    };

    const rankingScore = this.expertLevelsService.calculateRankingScore(stats);
    const calculatedLevel = this.expertLevelsService.calculateLevelByScore(rankingScore);
    const tierInfo = this.expertLevelsService.getTierInfo(calculatedLevel);
    const creditsPerMinute = this.expertLevelsService.calculateCreditsByLevel(calculatedLevel);

    return {
      ...expert,
      // 배열 필드들을 실제 배열로 변환
      specialties: parseJsonField(expert.specialties),
      certifications: parseJsonField(expert.certifications),
      consultationTypes: parseJsonField(expert.consultationTypes),
      languages: parseJsonField(expert.languages),
      education: parseJsonField(expert.education),
      portfolioFiles: parseJsonField(expert.portfolioFiles),
      portfolioItems: parseJsonField(expert.portfolioItems),
      // 객체 필드들을 실제 객체로 변환
      availability: parseJsonObject(expert.availability),
      contactInfo: parseJsonObject(expert.contactInfo),
      socialProof: parseJsonObject(expert.socialProof),
      socialLinks: parseJsonObject(expert.socialLinks),
      // 카테고리 정보도 추가
      categories: expert.categoryLinks.map(link => link.category.nameKo),
      categorySlugs: expert.categoryLinks.map(link => link.category.slug),
      // 예약 가능시간 정보 (정규화된 테이블 데이터)
      availabilitySlots: expert.availabilitySlots || [],
      // 레벨 정보 추가
      calculatedLevel,
      rankingScore,
      tierInfo,
      creditsPerMinute,
      // 레거시 호환성을 위해 level 필드에 티어 이름 설정
      level: tierInfo.name,
    };
  }

  async findById(id: number) {
    return this.prisma.expert.findUnique({
      where: { id },
      include: {
        categoryLinks: {
          include: {
            category: {
              select: {
                nameKo: true,
                nameEn: true,
                slug: true,
              }
            }
          }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                name: true,
              }
            }
          }
        }
      }
    });
  }

  async getPopularCategories(limit = 10) {
    // 전문가-카테고리 연결을 통해 인기 카테고리 조회
    const categoryStats = await this.prisma.expertCategory.groupBy({
      by: ['categoryId'],
      _count: {
        expertId: true
      },
      orderBy: {
        _count: {
          expertId: 'desc'
        }
      },
      take: limit
    });

    // 카테고리 정보와 함께 반환
    const categories = await Promise.all(
      categoryStats.map(async (stat) => {
        const category = await this.prisma.category.findUnique({
          where: { id: stat.categoryId },
          select: {
            id: true,
            nameKo: true,
            nameEn: true,
            slug: true,
            description: true,
            icon: true,
          }
        });

        return {
          ...category,
          expertCount: stat._count.expertId,
        };
      })
    );

    return categories.filter(cat => cat.id); // null 값 제거
  }

  async createApplication(userId: number, dto: CreateExpertApplicationDto) {
    const displayId = ulid();

    return this.prisma.expertApplication.create({
      data: {
        displayId,
        userId,
        name: dto.name,
        email: dto.email,
        jobTitle: dto.jobTitle,
        specialty: dto.specialty,
        experienceYears: dto.experienceYears,
        bio: dto.bio,
        keywords: dto.keywords,
        consultationTypes: dto.consultationTypes,
        availability: dto.availability,
        certifications: dto.certifications,
        profileImage: dto.profileImage,
        status: 'PENDING',
      },
    });
  }

  async getExpertStats(userId: number) {
    // For now, return dummy data since Expert model doesn't have userId relationship yet
    // TODO: Add proper Expert-User relationship in schema
    return {
      totalConsultations: 127,
      completedConsultations: 115,
      pendingConsultations: 3,
      totalEarnings: 2847500,
      averageRating: 4.8,
      totalClients: 89,
      thisMonthEarnings: 847500,
      attendanceRate: 95,
      newClients: 12,
    };
  }

  async getExpertProfile(displayId: string) {
    // 기존의 findByDisplayId 메서드를 재사용하되, 프로필 전용 필드만 반환
    const expert = await this.findByDisplayId(displayId);

    if (!expert) {
      return null;
    }

    // 프로필 편집에 필요한 필드들만 반환
    return {
      id: expert.id,
      displayId: expert.displayId,
      name: expert.name,
      title: expert.title,
      specialty: expert.specialty,
      bio: expert.bio,
      description: expert.description,
      experience: expert.experience,
      education: expert.education,
      certifications: expert.certifications,
      specialties: expert.specialties,
      consultationTypes: expert.consultationTypes,
      languages: expert.languages,
      hourlyRate: expert.hourlyRate,
      pricePerMinute: (expert as any).pricePerMinute,
      availability: expert.availability,
      contactInfo: expert.contactInfo,
      socialLinks: expert.socialLinks,
      profileImage: expert.avatarUrl,
      portfolioFiles: expert.portfolioFiles,
      portfolioItems: expert.portfolioItems,
      cancellationPolicy: expert.cancellationPolicy,
      isProfileComplete: expert.isProfileComplete,
      totalSessions: expert.totalSessions,
      ratingAvg: expert.ratingAvg,
      reviewCount: expert.reviewCount,
      mbti: expert.mbti,
      userId: (expert as any).userId, // userId 필드 추가
    };
  }

  async updateExpertProfile(displayId: string, profileData: any) {
    // JSON 필드들을 문자열로 변환하는 헬퍼 함수
    const stringifyJsonField = (field: any): string => {
      if (!field) return '[]';
      if (Array.isArray(field)) return JSON.stringify(field);
      if (typeof field === 'string') return field;
      return JSON.stringify(field);
    };

    const stringifyJsonObject = (field: any): string => {
      if (!field) return '{}';
      if (typeof field === 'object') return JSON.stringify(field);
      if (typeof field === 'string') return field;
      return JSON.stringify(field);
    };

    // 업데이트할 데이터 준비
    const updateData: any = {
      name: profileData.name,
      title: profileData.title,
      specialty: profileData.specialty,
      bio: profileData.bio || profileData.description,
      description: profileData.description || profileData.bio,
      experience: profileData.experience,
      hourlyRate: profileData.hourlyRate,
      cancellationPolicy: profileData.cancellationPolicy,
      isProfileComplete: profileData.isProfileComplete || false,
      mbti: profileData.mbti,
    };

    // JSON 필드들 처리
    if (profileData.education) {
      updateData.education = stringifyJsonField(profileData.education);
    }
    if (profileData.certifications) {
      updateData.certifications = stringifyJsonField(profileData.certifications);
    }
    if (profileData.specialties) {
      updateData.specialties = stringifyJsonField(profileData.specialties);
    }
    if (profileData.consultationTypes) {
      updateData.consultationTypes = stringifyJsonField(profileData.consultationTypes);
    }
    if (profileData.languages) {
      updateData.languages = stringifyJsonField(profileData.languages);
    }
    if (profileData.portfolioFiles) {
      updateData.portfolioFiles = stringifyJsonField(profileData.portfolioFiles);
    }
    if (profileData.portfolioItems) {
      updateData.portfolioItems = stringifyJsonField(profileData.portfolioItems);
    }
    if (profileData.availability) {
      updateData.availability = stringifyJsonObject(profileData.availability);
    }
    if (profileData.contactInfo) {
      updateData.contactInfo = stringifyJsonObject(profileData.contactInfo);
    }
    if (profileData.socialLinks) {
      updateData.socialLinks = stringifyJsonObject(profileData.socialLinks);
    }

    // 프로필 업데이트 실행
    const updatedExpert = await this.prisma.expert.update({
      where: { displayId },
      data: updateData,
    });

    // 업데이트된 프로필 반환 (변환된 형태로)
    return this.getExpertProfile(displayId);
  }
}
