import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { MailService } from '../../mail/mail.service'

// 유효한 currentStage 값 정의
const VALID_STAGES = [
  'SUBMITTED',
  'DOCUMENT_REVIEW',
  'UNDER_REVIEW',
  'APPROVAL_PENDING',
  'APPROVED',
  'REJECTED',
  'ADDITIONAL_INFO_REQUESTED',
] as const

// 유효성 검증 함수
function isValidStage(stage: string): boolean {
  return VALID_STAGES.includes(stage as any)
}

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
        select: {
          id: true,
          displayId: true,
          userId: true,
          name: true,
          email: true,
          specialty: true,
          status: true,
          currentStage: true,
          createdAt: true,
          viewedByAdmin: true,
          reviewedAt: true,
          reviewedBy: true,
          experienceYears: true,
          jobTitle: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.expertApplication.count({ where }),
    ])

    // specialty 파싱: "카테고리명 - 키워드" 형식에서 카테고리명만 추출
    const parseSpecialty = (specialty: string): string => {
      if (!specialty) return ''
      // " - " 로 분리되어 있는 경우 첫 번째 부분만 반환
      const parts = specialty.split(' - ')
      return parts[0].trim()
    }

    // 목록의 각 항목에 대해 specialty 파싱
    const parsedData = data.map((app) => ({
      ...app,
      specialty: parseSpecialty(app.specialty),
    }))

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
        error: {
          code: 'E_APPLICATION_NOT_FOUND',
          message: 'Application not found',
        },
      })
    }

    // 관리자가 조회하면 viewedByAdmin을 true로 업데이트
    // + currentStage를 DOCUMENT_REVIEW로 변경 (서류 검토 시작)
    if (!application.viewedByAdmin) {
      const currentStage = application.currentStage || 'SUBMITTED'

      await this.prisma.expertApplication.update({
        where: { id },
        data: {
          viewedByAdmin: true,
          viewedAt: new Date(),
          // 처음 조회 시에만 DOCUMENT_REVIEW로 변경 (이미 다른 단계면 유지)
          currentStage: currentStage === 'SUBMITTED' ? 'DOCUMENT_REVIEW' : currentStage,
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
      },
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
      if (!specialty) return ''
      const parts = specialty.split(' - ')
      return parts[0].trim()
    }

    // socialLinks 파싱 헬퍼 함수
    const parseSocialLinks = (links: any) => {
      if (!links) return null
      if (typeof links === 'string') {
        try {
          return JSON.parse(links)
        } catch {
          return null
        }
      }
      return links
    }

    // socialLinks 조회: APPROVED 상태면 Expert 테이블에서, 아니면 ExpertApplication에서
    let socialLinks = parseSocialLinks(application.socialLinks)
    if (application.status === 'APPROVED') {
      const expert = await this.prisma.expert.findFirst({
        where: { userId: application.userId },
        select: { socialLinks: true },
      })
      if (expert) {
        // Expert 테이블에 socialLinks가 있으면 사용, 없으면 application에서 사용
        const expertSocialLinks = parseSocialLinks(expert.socialLinks)
        // Expert의 socialLinks에 실제 값이 있는지 확인 (빈 문자열만 있는 경우 application 데이터 사용)
        const hasValidLinks = expertSocialLinks &&
          typeof expertSocialLinks === 'object' &&
          Object.values(expertSocialLinks).some(link => link && link !== '')
        socialLinks = hasValidLinks ? expertSocialLinks : socialLinks
      }
    }

    // availability JSON 파싱 및 availabilitySlots 추출
    const parsedAvailability = typeof application.availability === 'string'
      ? JSON.parse(application.availability)
      : application.availability

    // availability 객체에서 availabilitySlots 추출 (있으면)
    const availabilitySlots = parsedAvailability?.availabilitySlots || []
    const holidaySettings = parsedAvailability?.holidaySettings || {
      acceptHolidayConsultations: false,
      holidayNote: ''
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
        portfolioImages: parseJsonField(application.portfolioImages),
        availability: parsedAvailability,
        availabilitySlots: availabilitySlots,  // 명시적으로 추출
        holidaySettings: holidaySettings,  // 명시적으로 추출
        socialLinks: socialLinks,  // 이미 파싱됨
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
        error: {
          code: 'E_APPLICATION_NOT_FOUND',
          message: 'Application not found',
        },
      })
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_ALREADY_REVIEWED',
          message: 'Application already reviewed',
        },
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
          // ✅ currentStage를 APPROVED로 변경 (사용자 UI 동기화)
          currentStage: 'APPROVED',
        },
      })

      // 2. Expert 레코드 생성 (ExpertApplication의 모든 데이터 매핑)

      // specialty 파싱: "카테고리명 - 키워드1, 키워드2" 형식에서 카테고리명만 추출
      const parseSpecialty = (specialty: string): string => {
        if (!specialty) return ''
        // " - " 로 분리되어 있는 경우 첫 번째 부분만 반환
        const parts = specialty.split(' - ')
        return parts[0].trim()
      }

      const cleanSpecialty = parseSpecialty(application.specialty)

      // availability 데이터 파싱 (문자열 또는 객체 처리)
      const parseAvailabilityData = (availability: any) => {
        if (!availability) return {}
        if (typeof availability === 'string') {
          try {
            return JSON.parse(availability)
          } catch {
            return {}
          }
        }
        return typeof availability === 'object' ? availability : {}
      }

      // socialLinks 데이터 파싱 (문자열 또는 객체 처리)
      const parseSocialLinksData = (links: any) => {
        if (!links) return {}
        if (typeof links === 'string') {
          try {
            return JSON.parse(links)
          } catch {
            return {}
          }
        }
        return typeof links === 'object' ? links : {}
      }

      // availability 파싱 및 필드 추출
      const availabilityData = parseAvailabilityData(application.availability)
      const availabilitySlots = availabilityData?.availabilitySlots || []
      const holidaySettings = availabilityData?.holidaySettings || {
        acceptHolidayConsultations: false,
        holidayNote: ''
      }

      // socialLinks 파싱
      const appSocialLinks = parseSocialLinksData(application.socialLinks)

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
          portfolioFiles: application.portfolioImages && Array.isArray(application.portfolioImages)
            ? application.portfolioImages
            : [], // portfolioImages 데이터 저장
          portfolioItems: application.workExperience || [],

          // JSON 객체 필드들 - availability에 모든 스케줄 정보 통합
          availability: {
            ...availabilityData,
            availabilitySlots,  // 명시적으로 추출한 슬롯 포함
            holidaySettings,    // 원본 데이터 사용 (하드코딩 제거)
          } as any,
          contactInfo: {
            phone: application.phoneNumber || '',  // phoneNumber 필드 사용
            email: application.email,
            location: '',
            website: '',
          } as any,
          socialLinks: {
            // 값이 있는 필드만 객체에 포함 (조건부 속성 추가)
            ...(appSocialLinks?.website && { website: appSocialLinks.website }),
            ...(appSocialLinks?.instagram && { instagram: appSocialLinks.instagram }),
            ...(appSocialLinks?.youtube && { youtube: appSocialLinks.youtube }),
            ...(appSocialLinks?.linkedin && { linkedin: appSocialLinks.linkedin }),
            ...(appSocialLinks?.blog && { blog: appSocialLinks.blog }),
            ...(appSocialLinks?.github && { github: appSocialLinks.github }),
            ...(appSocialLinks?.twitter && { twitter: appSocialLinks.twitter }),
            ...(appSocialLinks?.facebook && { facebook: appSocialLinks.facebook }),
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

      // EXPERT_APPLICANT 역할 제거 (신청 상태 → 승인 상태)
      const updatedRoles = roles.filter(
        (role: string) => role !== 'EXPERT_APPLICANT'
      )

      // EXPERT 역할 추가
      if (!updatedRoles.includes('EXPERT')) {
        updatedRoles.push('EXPERT')
      }

      await tx.user.update({
        where: { id: application.userId },
        data: { roles: JSON.stringify(updatedRoles) },
      })

      // 4. ExpertCategory 연결 생성 (categoryId가 있는 경우)
      const appData = application as any
      if (appData.categoryId) {
        try {
          await tx.expertCategory.create({
            data: {
              expertId: expert.id,
              categoryId: appData.categoryId,
            },
          })
          console.log(
            `✅ ExpertCategory 연결 생성: expertId=${expert.id}, categoryId=${appData.categoryId}`
          )
        } catch (error) {
          console.error('⚠️ ExpertCategory 연결 생성 실패:', error)
          // 카테고리 연결 실패는 치명적이지 않으므로 계속 진행
        }
      }

      // 5. ExpertAvailability 슬롯 생성 (availabilitySlots가 있는 경우)
      if (availabilitySlots && Array.isArray(availabilitySlots) && availabilitySlots.length > 0) {
        try {
          const slots = availabilitySlots.map((slot: any) => ({
            expertId: expert.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: slot.isActive !== false, // 기본값 true
            timeZone: 'Asia/Seoul',
          }))

          await tx.expertAvailability.createMany({
            data: slots,
            skipDuplicates: true, // 중복 방지
          })
          console.log(`✅ ExpertAvailability 슬롯 생성: ${slots.length}개`)
        } catch (error) {
          console.error('⚠️ ExpertAvailability 슬롯 생성 실패:', error)
          // 슬롯 생성 실패는 치명적이지 않으므로 계속 진행
        }
      }

      // 6. Expert 생성 데이터 검증 (데이터 무결성 보장)
      await this.validateExpertCreation(expert, application, tx)

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
      console.log(
        `ℹ️ Email notification disabled for application ${application.displayId}`
      )
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
        error: {
          code: 'E_APPLICATION_NOT_FOUND',
          message: 'Application not found',
        },
      })
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_ALREADY_REVIEWED',
          message: 'Application already reviewed',
        },
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
        // ✅ currentStage를 REJECTED로 변경 (사용자 UI 동기화)
        currentStage: 'REJECTED',
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
      console.log(
        `ℹ️ Email notification disabled for application ${application.displayId}`
      )
    }

    return {
      success: true,
      application: updatedApplication,
    }
  }

  /**
   * 추가 정보 요청
   */
  async requestAdditionalInfo(
    id: number,
    dto: { reviewNotes: string; reviewedBy: number }
  ) {
    const application = await this.prisma.expertApplication.findUnique({
      where: { id },
    })

    if (!application) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'E_APPLICATION_NOT_FOUND',
          message: 'Application not found',
        },
      })
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_ALREADY_REVIEWED',
          message: 'Application already reviewed',
        },
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
        // ✅ currentStage를 ADDITIONAL_INFO_REQUESTED로 변경 (사용자 UI 동기화)
        currentStage: 'ADDITIONAL_INFO_REQUESTED',
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
      console.log(
        `✅ Additional info request email sent to ${application.email}`
      )
    } catch (error) {
      console.error('Failed to send additional info request email:', error)
    }

    return {
      success: true,
      application: updatedApplication,
    }
  }

  /**
   * 심사 단계 수동 변경 (관리자용)
   */
  async updateApplicationStage(
    id: number,
    stage: string,
    adminUserId: number
  ) {
    // 유효한 stage 값 검증
    if (!isValidStage(stage)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_INVALID_STAGE',
          message: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`,
        },
      })
    }

    const application = await this.prisma.expertApplication.findUnique({
      where: { id },
    })

    if (!application) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'E_APPLICATION_NOT_FOUND',
          message: 'Application not found',
        },
      })
    }

    // 단계 업데이트
    const updatedApplication = await this.prisma.expertApplication.update({
      where: { id },
      data: {
        currentStage: stage,
        // 로그 목적으로 reviewedBy 업데이트 (선택사항)
        reviewedBy: adminUserId,
      },
    })

    return {
      success: true,
      application: updatedApplication,
    }
  }

  /**
   * 통계 조회
   */
  async getStatistics() {
    const [total, pending, approved, rejected, infoRequested] =
      await Promise.all([
        this.prisma.expertApplication.count(),
        this.prisma.expertApplication.count({ where: { status: 'PENDING' } }),
        this.prisma.expertApplication.count({ where: { status: 'APPROVED' } }),
        this.prisma.expertApplication.count({ where: { status: 'REJECTED' } }),
        this.prisma.expertApplication.count({
          where: { status: 'ADDITIONAL_INFO_REQUESTED' },
        }),
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

  /**
   * Expert 생성 데이터 검증
   * - approveApplication 트랜잭션 내에서 실행
   * - 검증 실패 시 전체 롤백으로 데이터 무결성 보장
   */
  private async validateExpertCreation(
    expert: any,
    application: any,
    tx: any
  ) {
    const issues: string[] = []

    // 1. 중복 Expert 체크 (userId는 유니크해야 함)
    const existingExpert = await tx.expert.findFirst({
      where: {
        userId: application.userId,
        id: { not: expert.id }  // 방금 생성한 expert는 제외
      }
    })

    if (existingExpert) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_DUPLICATE_EXPERT',
          message: `User ${application.userId} already has an expert profile (ID: ${existingExpert.id})`,
          details: {
            existingExpertId: existingExpert.id,
            newExpertId: expert.id,
            userId: application.userId
          }
        }
      })
    }

    // 2. phoneNumber 검증
    const contactInfo = typeof expert.contactInfo === 'string'
      ? JSON.parse(expert.contactInfo)
      : expert.contactInfo || {}

    if (application.phoneNumber && !contactInfo.phone) {
      issues.push('phoneNumber not copied to contactInfo.phone')
    }

    // 3. socialLinks 검증 (원본에 링크가 있었다면)
    const appSocialLinks = typeof application.socialLinks === 'string'
      ? JSON.parse(application.socialLinks)
      : application.socialLinks || {}

    const expertSocialLinks = typeof expert.socialLinks === 'string'
      ? JSON.parse(expert.socialLinks)
      : expert.socialLinks || {}

    const hasAppLinks = Object.values(appSocialLinks || {}).some(v => v)
    const hasExpertLinks = Object.values(expertSocialLinks || {}).some(v => v)

    if (hasAppLinks && !hasExpertLinks) {
      issues.push('socialLinks not copied despite application having links')
    }

    // 4. availabilitySlots 검증
    const availability = typeof application.availability === 'string'
      ? JSON.parse(application.availability)
      : application.availability || {}

    const appSlots = availability?.availabilitySlots || []

    if (appSlots.length > 0) {
      const createdSlots = await tx.expertAvailability.count({
        where: { expertId: expert.id }
      })

      if (createdSlots === 0) {
        issues.push(`availabilitySlots not created (expected ${appSlots.length} slots)`)
      }
    }

    // 검증 실패 시 예외 발생 → 트랜잭션 롤백
    if (issues.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_EXPERT_CREATION_VALIDATION_FAILED',
          message: `Expert creation validation failed: ${issues.join(', ')}`,
          details: {
            applicationId: application.id,
            userId: application.userId,
            expertId: expert.id,
            issues
          }
        }
      })
    }

    console.log(`✅ Expert 생성 검증 통과 (userId: ${application.userId}, expertId: ${expert.id})`)
  }
}
