import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { MailService } from '../../mail/mail.service'

export interface ApplicationListQuery {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  page?: number
  limit?: number
  search?: string
}

export interface ReviewApplicationDto {
  status: 'APPROVED' | 'REJECTED'
  reviewNotes?: string
  reviewedBy: number
}

@Injectable()
export class ExpertApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService
  ) {}

  /**
   * 전문가 지원 목록 조회
   */
  async getApplications(query: ApplicationListQuery) {
    const { status, search } = query
    // 쿼리 파라미터는 문자열로 전달되므로 숫자로 변환
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 20

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { specialty: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      this.prisma.expertApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.expertApplication.count({ where }),
    ])

    // specialty 파싱: "카테고리명 - 키워드" 형식에서 카테고리명만 추출
    const parseSpecialty = (specialty: string): string => {
      if (!specialty) return '';
      // " - " 로 분리되어 있는 경우 첫 번째 부분만 반환
      const parts = specialty.split(' - ');
      return parts[0].trim();
    };

    // 목록의 각 항목에 대해 specialty 파싱
    const parsedData = data.map(app => ({
      ...app,
      specialty: parseSpecialty(app.specialty),
    }));

    return {
      data: parsedData,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * 전문가 지원 상세 조회
   */
  async getApplicationDetail(id: number) {
    const application = await this.prisma.expertApplication.findUnique({
      where: { id },
    })

    if (!application) {
      throw new NotFoundException({
        success: false,
        error: { code: 'E_APPLICATION_NOT_FOUND', message: 'Application not found' }
      })
    }

    // 관리자가 조회하면 viewedByAdmin을 true로 업데이트
    if (!application.viewedByAdmin) {
      await this.prisma.expertApplication.update({
        where: { id },
        data: {
          viewedByAdmin: true,
          viewedAt: new Date(),
        },
      })
    }

    // JSON 필드 파싱 (이중 인코딩된 경우 처리)
    const parseJsonField = (field: any): any => {
      if (!field) return []
      if (Array.isArray(field)) return field
      if (typeof field === 'string') {
        try {
          return JSON.parse(field)
        } catch {
          return []
        }
      }
      return []
    }

    // 신청자 정보
    const user = await this.prisma.user.findUnique({
      where: { id: application.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        avatarUrl: true,
        phoneNumber: true,
      }
    })

    // 이전 지원 이력
    const previousApplications = await this.prisma.expertApplication.findMany({
      where: {
        userId: application.userId,
        id: { not: id },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // specialty 파싱: "카테고리명 - 키워드" 형식에서 카테고리명만 추출
    const parseSpecialty = (specialty: string): string => {
      if (!specialty) return '';
      const parts = specialty.split(' - ');
      return parts[0].trim();
    };

    // 승인된 전문가의 경우 Expert 테이블에서 socialLinks 조회
    let socialLinks = null;
    if (application.status === 'APPROVED') {
      const expert = await this.prisma.expert.findFirst({
        where: { userId: application.userId },
        select: { socialLinks: true },
      });
      if (expert) {
        socialLinks = expert.socialLinks;
      }
    }

    return {
      application: {
        ...application,
        specialty: parseSpecialty(application.specialty),
        keywords: parseJsonField(application.keywords),
        consultationTypes: parseJsonField(application.consultationTypes),
        languages: parseJsonField(application.languages),
        certifications: parseJsonField(application.certifications),
        education: parseJsonField(application.education),
        workExperience: parseJsonField(application.workExperience),
        availability: typeof application.availability === 'string'
          ? JSON.parse(application.availability)
          : application.availability,
        socialLinks: socialLinks,
      },
      user,
      previousApplications,
    }
  }

  /**
   * 전문가 지원 승인
   */
  async approveApplication(id: number, dto: ReviewApplicationDto) {
    const application = await this.prisma.expertApplication.findUnique({
      where: { id },
    })

    if (!application) {
      throw new NotFoundException({
        success: false,
        error: { code: 'E_APPLICATION_NOT_FOUND', message: 'Application not found' }
      })
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException({
        success: false,
        error: { code: 'E_ALREADY_REVIEWED', message: 'Application already reviewed' }
      })
    }

    // 트랜잭션으로 처리
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. ExpertApplication 상태 업데이트
      const updatedApplication = await tx.expertApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: dto.reviewedBy,
          reviewNotes: dto.reviewNotes,
        },
      })

      // 2. Expert 레코드 생성 (ExpertApplication의 모든 데이터 매핑)

      // specialty 파싱: "카테고리명 - 키워드1, 키워드2" 형식에서 카테고리명만 추출
      const parseSpecialty = (specialty: string): string => {
        if (!specialty) return '';
        // " - " 로 분리되어 있는 경우 첫 번째 부분만 반환
        const parts = specialty.split(' - ');
        return parts[0].trim();
      };

      const cleanSpecialty = parseSpecialty(application.specialty);

      const expert = await tx.expert.create({
        data: {
          displayId: `EXP${Date.now()}${application.userId}`,
          userId: application.userId,
          name: application.name,
          title: application.jobTitle || cleanSpecialty,
          specialty: cleanSpecialty,
          bio: application.bio,
          description: application.bio, // description 필드도 설정
          avatarUrl: application.profileImage,
          experience: application.experienceYears,
          experienceYears: application.experienceYears,

          // MBTI 및 상담 스타일
          mbti: application.mbti || null,
          consultationStyle: application.consultationStyle || null,
          workExperience: application.workExperience || [],

          // JSON 배열 필드들 (application에서 그대로 전송)
          categories: [], // 카테고리는 별도 ExpertCategory 테이블에서 관리
          keywords: application.keywords || [],
          certifications: application.certifications || [],
          consultationTypes: application.consultationTypes || [],
          languages: application.languages || ['한국어'],
          education: application.education || [],
          portfolioFiles: [], // 초기에는 빈 배열
          portfolioItems: application.workExperience || [],

          // JSON 객체 필드들 - availability에 모든 스케줄 정보 통합
          availability: (() => {
            const availabilityData = typeof application.availability === 'object'
              ? application.availability
              : {};

            // availability Json 내부에 holidaySettings 포함
            return {
              ...availabilityData,
              holidaySettings: {
                acceptHolidayConsultations: false,
                holidayNote: ''
              }
            } as any;
          })(),
          contactInfo: {
            phone: '',
            email: application.email,
            location: '',
            website: ''
          } as any,
          socialLinks: {
            linkedin: '',
            github: '',
            twitter: '',
            instagram: '',
            facebook: '',
            youtube: ''
          } as any,
          socialProof: {} as any,

          // 통계 초기값
          totalSessions: 0,
          repeatClients: 0,
          ratingAvg: 0,
          reviewCount: 0,
          responseTime: '2시간 내',

          // 상태 플래그
          isActive: true,
          isProfileComplete: true,
          isProfilePublic: false, // 초기에는 비공개로 설정 (전문가가 직접 공개 설정)
        },
      })

      // 3. User roles에 EXPERT 추가
      const user = await tx.user.findUnique({
        where: { id: application.userId },
      })

      if (!user) {
        throw new Error('User not found')
      }

      const roles = Array.isArray(user.roles)
        ? user.roles
        : typeof user.roles === 'string'
        ? JSON.parse(user.roles)
        : ['USER']

      if (!roles.includes('EXPERT')) {
        roles.push('EXPERT')
      }

      await tx.user.update({
        where: { id: application.userId },
        data: { roles: JSON.stringify(roles) },
      })

      // 4. ExpertCategory 연결 생성 (categoryId가 있는 경우)
      const appData = application as any;
      if (appData.categoryId) {
        try {
          await tx.expertCategory.create({
            data: {
              expertId: expert.id,
              categoryId: appData.categoryId,
            },
          });
          console.log(`✅ ExpertCategory 연결 생성: expertId=${expert.id}, categoryId=${appData.categoryId}`);
        } catch (error) {
          console.error('⚠️ ExpertCategory 연결 생성 실패:', error);
          // 카테고리 연결 실패는 치명적이지 않으므로 계속 진행
        }
      }

      // 5. ExpertAvailability 슬롯 생성 (availabilitySlots가 있는 경우)
      if (appData.availabilitySlots && Array.isArray(appData.availabilitySlots)) {
        try {
          const slots = appData.availabilitySlots.map((slot: any) => ({
            expertId: expert.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: slot.isActive !== false, // 기본값 true
            timeZone: 'Asia/Seoul',
          }));

          await tx.expertAvailability.createMany({
            data: slots,
            skipDuplicates: true, // 중복 방지
          });
          console.log(`✅ ExpertAvailability 슬롯 생성: ${slots.length}개`);
        } catch (error) {
          console.error('⚠️ ExpertAvailability 슬롯 생성 실패:', error);
          // 슬롯 생성 실패는 치명적이지 않으므로 계속 진행
        }
      }

      return { updatedApplication, expert, user }
    })

    // 4. 승인 이메일 발송 (emailNotification 설정 확인)
    if (application.emailNotification) {
      try {
        await this.mail.sendExpertApplicationStatusEmail(
          application.email,
          'APPROVED',
          application.name,
          application.displayId
        )
        console.log(`✅ Approval email sent to ${application.email}`)
      } catch (error) {
        console.error('Failed to send approval email:', error)
      }
    } else {
      console.log(`ℹ️ Email notification disabled for application ${application.displayId}`)
    }

    return {
      success: true,
      expert: result.expert,
    }
  }

  /**
   * 전문가 지원 거절
   */
  async rejectApplication(id: number, dto: ReviewApplicationDto) {
    const application = await this.prisma.expertApplication.findUnique({
      where: { id },
    })

    if (!application) {
      throw new NotFoundException({
        success: false,
        error: { code: 'E_APPLICATION_NOT_FOUND', message: 'Application not found' }
      })
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException({
        success: false,
        error: { code: 'E_ALREADY_REVIEWED', message: 'Application already reviewed' }
      })
    }

    // ExpertApplication 상태 업데이트
    const updatedApplication = await this.prisma.expertApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: dto.reviewedBy,
        reviewNotes: dto.reviewNotes,
      },
    })

    // 거절 이메일 발송 (emailNotification 설정 확인)
    if (application.emailNotification) {
      try {
        await this.mail.sendExpertApplicationStatusEmail(
          application.email,
          'REJECTED',
          application.name,
          application.displayId,
          dto.reviewNotes
        )
        console.log(`✅ Rejection email sent to ${application.email}`)
      } catch (error) {
        console.error('Failed to send rejection email:', error)
      }
    } else {
      console.log(`ℹ️ Email notification disabled for application ${application.displayId}`)
    }

    return {
      success: true,
      application: updatedApplication,
    }
  }

  /**
   * 추가 정보 요청
   */
  async requestAdditionalInfo(id: number, dto: { reviewNotes: string; reviewedBy: number }) {
    const application = await this.prisma.expertApplication.findUnique({
      where: { id },
    })

    if (!application) {
      throw new NotFoundException({
        success: false,
        error: { code: 'E_APPLICATION_NOT_FOUND', message: 'Application not found' }
      })
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException({
        success: false,
        error: { code: 'E_ALREADY_REVIEWED', message: 'Application already reviewed' }
      })
    }

    // ExpertApplication 상태 업데이트
    const updatedApplication = await this.prisma.expertApplication.update({
      where: { id },
      data: {
        status: 'ADDITIONAL_INFO_REQUESTED',
        reviewedAt: new Date(),
        reviewedBy: dto.reviewedBy,
        reviewNotes: dto.reviewNotes,
      },
    })

    // 추가 정보 요청 이메일 발송
    try {
      await this.mail.sendAdditionalInfoRequestEmail(
        application.email,
        application.name,
        application.displayId,
        dto.reviewNotes
      )
      console.log(`✅ Additional info request email sent to ${application.email}`)
    } catch (error) {
      console.error('Failed to send additional info request email:', error)
    }

    return {
      success: true,
      application: updatedApplication,
    }
  }

  /**
   * 통계 조회
   */
  async getStatistics() {
    const [total, pending, approved, rejected, infoRequested] = await Promise.all([
      this.prisma.expertApplication.count(),
      this.prisma.expertApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.expertApplication.count({ where: { status: 'APPROVED' } }),
      this.prisma.expertApplication.count({ where: { status: 'REJECTED' } }),
      this.prisma.expertApplication.count({ where: { status: 'ADDITIONAL_INFO_REQUESTED' } }),
    ])

    return {
      total,
      pending,
      approved,
      rejected,
      infoRequested,
      conversionRate: total > 0 ? (approved / total) * 100 : 0,
    }
  }
}
