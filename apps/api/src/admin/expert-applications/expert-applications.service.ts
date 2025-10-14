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

    return {
      data,
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

    return {
      application: {
        ...application,
        keywords: parseJsonField(application.keywords),
        consultationTypes: parseJsonField(application.consultationTypes),
        languages: parseJsonField(application.languages),
        certifications: parseJsonField(application.certifications),
        education: parseJsonField(application.education),
        workExperience: parseJsonField(application.workExperience),
        availability: typeof application.availability === 'string'
          ? JSON.parse(application.availability)
          : application.availability,
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

      // 2. Expert 레코드 생성
      const expert = await tx.expert.create({
        data: {
          displayId: `EXP${Date.now()}${application.userId}`,
          userId: application.userId,
          name: application.name,
          title: application.jobTitle || null,
          specialty: application.specialty,
          bio: application.bio,
          avatarUrl: application.profileImage,
          experience: application.experienceYears,
          categories: [], // JSON 배열
          certifications: application.certifications as any,
          consultationTypes: application.consultationTypes as any,
          availability: application.availability as any,
          contactInfo: {},
          education: [],
          languages: [],
          portfolioFiles: [],
          portfolioItems: [],
          socialProof: {},
          socialLinks: {},
          specialties: [],
          isActive: true,
          isProfileComplete: true,
          isProfilePublic: true,
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
