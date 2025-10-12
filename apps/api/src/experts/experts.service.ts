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

    // Sorting - sortMap으로 정리하고 experienceYears 사용
    const sortMap: Record<string, any> = {
      'rating': { ratingAvg: 'desc' },
      '-rating': { ratingAvg: 'asc' },
      'experience': { experienceYears: 'desc' },  // experience → experienceYears로 변경
      'reviews': { reviewCount: 'desc' },
      'sessions': { totalSessions: 'desc' },
      'recent': { createdAt: 'desc' },
      // ranking, level, credits 정렬은 실시간 계산 필요 (메모리 정렬)
    };

    // ranking, level, credits 정렬은 실시간 rankingScore 계산이 필요하므로 특별 처리
    const needsRuntimeSort = sort && ['ranking', 'level', 'credits-low', 'credits-high'].includes(sort);

    let total: number;
    let items: any[];

    if (needsRuntimeSort) {
      // 전체 데이터를 가져와서 메모리에서 정렬
      const [countResult, allItems] = await this.prisma.$transaction([
        this.prisma.expert.count({ where }),
        this.prisma.expert.findMany({
          where,
          // 정렬 없이 전체 가져오기
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

      total = countResult;

      // 각 전문가의 실시간 rankingScore 계산 (ExpertLevelsService 사용)
      const itemsWithScore = allItems.map(expert => {
        const score = this.expertLevelsService.calculateRankingScore({
          totalSessions: expert.totalSessions,
          avgRating: expert.ratingAvg,
          reviewCount: expert.reviewCount,
          repeatClients: expert.repeatClients,
          likeCount: 0,
        });
        return {
          ...expert,
          calculatedRankingScore: score,
        };
      });

      console.log(`[DEBUG] Runtime sort - First 3 experts before sort:`, itemsWithScore.slice(0, 3).map(e => ({ name: e.name, score: e.calculatedRankingScore })));

      // 메모리에서 정렬
      if (sort === 'ranking') {
        itemsWithScore.sort((a, b) => b.calculatedRankingScore - a.calculatedRankingScore);
      } else if (sort === 'level') {
        itemsWithScore.sort((a, b) => b.calculatedRankingScore - a.calculatedRankingScore);
      } else if (sort === 'credits-low') {
        itemsWithScore.sort((a, b) => a.calculatedRankingScore - b.calculatedRankingScore);
      } else if (sort === 'credits-high') {
        itemsWithScore.sort((a, b) => b.calculatedRankingScore - a.calculatedRankingScore);
      }

      console.log(`[DEBUG] Runtime sort - First 3 experts after sort:`, itemsWithScore.slice(0, 3).map(e => ({ name: e.name, score: e.calculatedRankingScore })));

      // 페이지네이션 적용
      items = itemsWithScore.slice((page - 1) * size, page * size);
    } else {
      // 기존 DB 정렬 방식
      const orderBy = sortMap[sort || 'recent'] || { createdAt: 'desc' };

      const [countResult, dbItems] = await this.prisma.$transaction([
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

      total = countResult;
      items = dbItems;
    }

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
      categories: expert.categoryLinks.map((link: any) => link.category.nameKo),
      categorySlugs: expert.categoryLinks.map((link: any) => link.category.slug),
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
      // Calculate ranking score (calculatedRankingScore가 있으면 사용, 없으면 ExpertLevelsService로 계산)
      rankingScore: (expert as any).calculatedRankingScore ?? this.expertLevelsService.calculateRankingScore({
        totalSessions: expert.totalSessions,
        avgRating: expert.ratingAvg,
        reviewCount: expert.reviewCount,
        repeatClients: expert.repeatClients,
        likeCount: 0,
      }),
    }));

    return { total, items: transformedItems };
  }

  // calculateRankingScore 제거 - ExpertLevelsService 사용

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

    // availability Json 필드에서 공휴일 설정 추출
    const availabilityData = parseJsonObject(expert.availability);
    const holidaySettings = availabilityData?.holidaySettings || {
      acceptHolidayConsultations: false,
      holidayNote: ''
    };

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
      availability: availabilityData,
      contactInfo: parseJsonObject(expert.contactInfo),
      socialProof: parseJsonObject(expert.socialProof),
      socialLinks: parseJsonObject(expert.socialLinks),
      // 카테고리 정보도 추가
      categories: expert.categoryLinks.map((link: any) => link.category.nameKo),
      categorySlugs: expert.categoryLinks.map((link: any) => link.category.slug),
      // 예약 가능시간 정보 (정규화된 테이블 데이터)
      availabilitySlots: expert.availabilitySlots || [],
      // 공휴일 설정 정보 추가
      holidaySettings,
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
    try {
      const displayId = ulid();

      console.log('Creating expert application for userId:', userId);
      console.log('Application data:', {
        displayId,
        name: dto.name,
        email: dto.email,
        specialty: dto.specialty,
        experienceYears: dto.experienceYears,
        keywordsCount: dto.keywords?.length,
        consultationTypesCount: dto.consultationTypes?.length,
        certificationsCount: dto.certifications?.length,
        hasProfileImage: !!dto.profileImage,
        availabilityKeys: Object.keys(dto.availability || {}),
      });

      // ExpertApplication 생성 및 User의 roles 업데이트를 트랜잭션으로 처리
      const [application] = await this.prisma.$transaction([
        // ExpertApplication 생성
        this.prisma.expertApplication.create({
          data: {
            displayId,
            userId,
            name: dto.name,
            email: dto.email,
            jobTitle: dto.jobTitle || '',
            specialty: dto.specialty,
            experienceYears: dto.experienceYears,
            bio: dto.bio,
            keywords: JSON.stringify(dto.keywords),
            consultationTypes: JSON.stringify(dto.consultationTypes),
            availability: JSON.stringify({
              ...dto.availability,
              holidaySettings: dto.holidaySettings
            }),
            certifications: JSON.stringify(dto.certifications),
            mbti: dto.mbti || null,
            consultationStyle: dto.consultationStyle || null,
            profileImage: dto.profileImage || null,
            status: 'PENDING',
            currentStage: 'SUBMITTED',
          },
        }),
        // User의 roles에 expertApplicationStatus 추가 (JSON 필드 업데이트)
        this.prisma.$executeRaw`
          UPDATE User
          SET roles = JSON_SET(
            roles,
            '$.expertApplicationStatus',
            'PENDING'
          )
          WHERE id = ${userId}
        `,
      ]);

      console.log('Application created successfully:', application.id);
      return application;
    } catch (error: any) {
      console.error('Error creating expert application:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        meta: error?.meta,
        stack: error?.stack,
      });
      throw error;
    }
  }

  async getExpertStats(userId: number) {
    // Find expert record for this user
    const expert = await this.prisma.expert.findFirst({
      where: { userId: userId },
      include: {
        reservations: {
          include: {
            user: true,
          },
        },
        reviews: true,
      },
    });

    if (!expert) {
      // Return empty stats if expert not found
      return {
        totalConsultations: 0,
        completedConsultations: 0,
        pendingConsultations: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalClients: 0,
        thisMonthEarnings: 0,
        attendanceRate: 0,
        newClients: 0,
      };
    }

    // Get all sessions for this expert's reservations
    const reservationIds = expert.reservations.map(r => r.id);
    const sessions = await this.prisma.session.findMany({
      where: {
        reservationId: { in: reservationIds },
      },
    });

    // Calculate consultation statistics
    const totalConsultations = sessions.length;
    const completedConsultations = sessions.filter(
      (session) => session.status === 'COMPLETED',
    ).length;
    const pendingConsultations = sessions.filter(
      (session) => session.status === 'SCHEDULED' || session.status === 'IN_PROGRESS',
    ).length;

    // Calculate earnings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedReservations = expert.reservations.filter(
      (reservation) => reservation.status === 'CONFIRMED',
    );

    const totalEarnings = completedReservations.reduce(
      (sum, reservation) => sum + (reservation.cost || 0),
      0,
    );

    const thisMonthEarnings = completedReservations
      .filter((reservation) => reservation.endAt && reservation.endAt >= startOfMonth)
      .reduce((sum, reservation) => sum + (reservation.cost || 0), 0);

    // Calculate average rating
    const averageRating =
      expert.reviews.length > 0
        ? expert.reviews.reduce((sum, review) => sum + review.rating, 0) / expert.reviews.length
        : 0;

    // Calculate unique clients
    const uniqueClients = new Set(
      completedReservations.map((reservation) => reservation.userId).filter(Boolean),
    );
    const totalClients = uniqueClients.size;

    // Calculate new clients this month
    const newClientsThisMonth = new Set(
      completedReservations
        .filter((reservation) => reservation.endAt && reservation.endAt >= startOfMonth)
        .map((reservation) => reservation.userId)
        .filter(Boolean),
    );

    // Calculate attendance rate
    const scheduledReservations = expert.reservations.filter(
      (reservation) => reservation.status !== 'CANCELED',
    );
    const attendanceRate =
      scheduledReservations.length > 0
        ? (completedConsultations / scheduledReservations.length) * 100
        : 0;

    return {
      totalConsultations,
      completedConsultations,
      pendingConsultations,
      totalEarnings,
      averageRating: Number(averageRating.toFixed(1)),
      totalClients,
      thisMonthEarnings,
      attendanceRate: Math.round(attendanceRate),
      newClients: newClientsThisMonth.size,
    };
  }

  async getMonthlyRevenue(userId: number) {
    // Find expert record for this user
    const expert = await this.prisma.expert.findFirst({
      where: { userId: userId },
    });

    if (!expert) {
      return [];
    }

    // Get last 12 months of revenue data
    const now = new Date();
    const monthlyData = [];

    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

      // Get completed reservations for this month
      const reservations = await this.prisma.reservation.findMany({
        where: {
          expertId: expert.id,
          status: 'CONFIRMED',
          endAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      const revenue = reservations.reduce(
        (sum, reservation) => sum + (reservation.cost || 0),
        0,
      );

      const sessionCount = reservations.length;

      monthlyData.push({
        month: targetDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' }),
        revenue,
        sessionCount,
      });
    }

    return monthlyData;
  }

  async getTodaySchedule(userId: number) {
    // Find expert record for this user
    const expert = await this.prisma.expert.findFirst({
      where: { userId: userId },
    });

    if (!expert) {
      return [];
    }

    // Get today's reservations
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todayReservations = await this.prisma.reservation.findMany({
      where: {
        expertId: expert.id,
        startAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    return todayReservations.map((reservation) => {
      // Calculate duration in minutes
      const durationMs = reservation.endAt.getTime() - reservation.startAt.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      return {
        id: reservation.id,
        displayId: reservation.displayId,
        time: reservation.startAt,
        endTime: reservation.endAt,
        duration: durationMinutes,
        status: reservation.status,
        clientName: reservation.user?.name || '알 수 없음',
        clientEmail: reservation.user?.email,
        consultationType: 'VIDEO',
        price: reservation.cost || 0,
      };
    });
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
      consultationStyle: expert.consultationStyle,
      workExperience: expert.workExperience,
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
      consultationStyle: profileData.consultationStyle,
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
    if (profileData.workExperience) {
      updateData.workExperience = stringifyJsonField(profileData.workExperience);
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

  /**
   * 전문가의 특정 날짜 예약 가능 시간 조회
   * @param displayId 전문가 displayId
   * @param targetDate 조회할 날짜
   * @returns 예약 가능한 타임슬롯 목록
   */
  async getAvailableTimeSlots(displayId: string, targetDate: Date) {
    // 1. 전문가 조회
    const expert = await this.prisma.expert.findUnique({
      where: { displayId },
      select: { id: true, name: true }
    });

    if (!expert) {
      throw new Error('Expert not found');
    }

    // 2. 요일 추출 (일요일=0, 월요일=1, ...)
    const dayOfWeek = this.getDayOfWeekEnum(targetDate.getDay());

    // 3. 전문가의 해당 요일 근무 시간 조회
    const availabilitySlots = await this.prisma.expertAvailability.findMany({
      where: {
        expertId: expert.id,
        dayOfWeek: dayOfWeek as any,
        isActive: true
      },
      orderBy: { startTime: 'asc' }
    });

    if (availabilitySlots.length === 0) {
      return {
        date: targetDate.toISOString().split('T')[0],
        dayOfWeek,
        slots: [],
        message: '해당 날짜에 예약 가능한 시간이 없습니다.'
      };
    }

    // 4. 해당 날짜의 기존 예약 조회
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        expertId: expert.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startAt: { gte: startOfDay, lte: endOfDay }
      },
      select: { startAt: true, endAt: true }
    });

    // 5. 30분 단위 타임슬롯 생성 및 예약 여부 체크
    const slots: Array<{
      time: string;
      available: boolean;
      reserved: boolean;
    }> = [];

    for (const availSlot of availabilitySlots) {
      const slotStart = this.parseTime(availSlot.startTime);
      const slotEnd = this.parseTime(availSlot.endTime);

      // 30분 단위로 슬롯 생성
      let currentTime = slotStart;
      while (currentTime < slotEnd) {
        const timeString = this.formatTime(currentTime);
        const slotDateTime = this.combineDateAndTime(targetDate, currentTime);
        const slotEndTime = currentTime + 30;

        // 현재 시간보다 이전인지 체크 (과거 시간은 예약 불가)
        const isPast = slotDateTime < new Date();

        // 기존 예약과 겹치는지 체크
        const slotEndDateTime = this.combineDateAndTime(targetDate, slotEndTime);
        const slotEndTimeMs = slotEndDateTime.getTime();
        const isReserved = existingReservations.some(res => {
          const resStart = res.startAt.getTime();
          const resEnd = res.endAt.getTime();
          const slotStartTime = slotDateTime.getTime();

          // 겹침 체크: (슬롯시작 < 예약종료) && (슬롯종료 > 예약시작)
          return slotStartTime < resEnd && slotEndTimeMs > resStart;
        });

        slots.push({
          time: timeString,
          available: !isPast && !isReserved,
          reserved: isReserved
        });

        currentTime = slotEndTime;
      }
    }

    return {
      date: targetDate.toISOString().split('T')[0],
      dayOfWeek,
      expertId: expert.id,
      expertName: expert.name,
      slots
    };
  }

  /**
   * 요일 숫자를 Enum으로 변환
   * @param dayNum 0(일요일) ~ 6(토요일)
   */
  private getDayOfWeekEnum(dayNum: number): string {
    const mapping = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return mapping[dayNum];
  }

  /**
   * 시간 문자열을 분 단위로 변환 (예: "09:00" -> 540)
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 분 단위를 시간 문자열로 변환 (예: 540 -> "09:00")
   */
  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * 날짜와 분 단위 시간을 결합하여 Date 객체 생성
   */
  private combineDateAndTime(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return result;
  }

  /**
   * 전문가의 예약 가능 시간 슬롯 조회
   * @param displayId 전문가 displayId
   * @returns 모든 예약 가능 시간 슬롯 및 공휴일 설정
   */
  async getAvailabilitySlots(displayId: string) {
    const expert = await this.prisma.expert.findUnique({
      where: { displayId },
      select: {
        id: true,
        availability: true
      }
    });

    if (!expert) {
      throw new Error('Expert not found');
    }

    const slots = await this.prisma.expertAvailability.findMany({
      where: {
        expertId: expert.id,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // availability Json 필드에서 공휴일 설정 추출
    const availabilityData = expert.availability as any;
    const holidaySettings = availabilityData?.holidaySettings || {
      acceptHolidayConsultations: false,
      holidayNote: ''
    };

    return {
      slots,
      holidaySettings
    };
  }

  /**
   * 전문가의 예약 가능 시간 슬롯 업데이트
   * @param displayId 전문가 displayId
   * @param slots 업데이트할 슬롯 목록
   * @param holidaySettings 공휴일 상담 설정
   */
  async updateAvailabilitySlots(displayId: string, slots: any[], holidaySettings?: any) {
    const expert = await this.prisma.expert.findUnique({
      where: { displayId },
      select: {
        id: true,
        availability: true
      }
    });

    if (!expert) {
      throw new Error('Expert not found');
    }

    // 트랜잭션으로 기존 슬롯 삭제 후 새로운 슬롯 생성 및 공휴일 설정 업데이트
    await this.prisma.$transaction(async (tx) => {
      // 기존 슬롯 모두 삭제
      await tx.expertAvailability.deleteMany({
        where: { expertId: expert.id }
      });

      // 새로운 슬롯 생성 (활성화된 슬롯만)
      const activeSlots = slots.filter(slot => slot.isActive);

      if (activeSlots.length > 0) {
        await tx.expertAvailability.createMany({
          data: activeSlots.map(slot => ({
            expertId: expert.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: true,
          }))
        });
      }

      // 공휴일 설정을 availability Json 필드에 저장
      if (holidaySettings) {
        const currentAvailability = (expert.availability as any) || {};
        await tx.expert.update({
          where: { id: expert.id },
          data: {
            availability: {
              ...currentAvailability,
              holidaySettings
            }
          }
        });
      }
    });

    // 업데이트된 슬롯 반환
    return this.getAvailabilitySlots(displayId);
  }
}
