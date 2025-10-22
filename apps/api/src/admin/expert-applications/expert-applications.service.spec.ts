import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { ExpertApplicationsService, ReviewApplicationDto } from './expert-applications.service'
import { PrismaService } from '../../prisma/prisma.service'
import { MailService } from '../../mail/mail.service'

describe('ExpertApplicationsService', () => {
  let service: ExpertApplicationsService
  let prisma: PrismaService

  const mockPrismaService = {
    expertApplication: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    expert: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    expertCategory: {
      create: jest.fn(),
    },
    expertAvailability: {
      createMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  }

  const mockMailService = {
    sendExpertApplicationStatusEmail: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpertApplicationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile()

    service = module.get<ExpertApplicationsService>(ExpertApplicationsService)
    prisma = module.get<PrismaService>(PrismaService)

    jest.clearAllMocks()
  })

  describe('approveApplication', () => {
    const mockApplication = {
      id: 1,
      userId: 100,
      displayId: 'APP-001',
      name: '김전문',
      email: 'expert@example.com',
      phoneNumber: '010-1234-5678',
      jobTitle: 'Senior Consultant',
      bio: 'Expert bio',
      profileImage: 'https://example.com/avatar.jpg',
      experienceYears: 10,
      mbti: 'INTJ',
      consultationStyle: 'Coaching',
      workExperience: [{ company: 'ABC Corp', role: 'Consultant' }],
      keywords: ['career', 'leadership'],
      certifications: ['CPC', 'ACC'],
      consultationTypes: ['1:1', 'group'],
      languages: ['한국어', 'English'],
      education: [{ school: 'University', degree: 'MBA' }],
      portfolioImages: ['https://example.com/portfolio1.jpg'],
      socialLinks: JSON.stringify({
        website: 'https://example.com',
        instagram: '@expert',
        linkedin: '',
        blog: '',
      }),
      availability: JSON.stringify({
        availabilitySlots: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isActive: true },
        ],
        holidaySettings: { enabled: true, dates: ['2025-01-01'] },
      }),
      status: 'PENDING',
      emailNotification: false,
    }

    const mockUser = {
      id: 100,
      email: 'expert@example.com',
      roles: JSON.stringify(['USER', 'EXPERT_APPLICANT']),
    }

    const mockExpert = {
      id: 50,
      displayId: 'EXP123456789100',
      userId: 100,
      name: '김전문',
      contactInfo: {
        phone: '010-1234-5678',
        email: 'expert@example.com',
        location: '',
        website: '',
      },
      socialLinks: {
        website: 'https://example.com',
        instagram: '@expert',
      },
    }

    const reviewDto: ReviewApplicationDto = {
      status: 'APPROVED' as const,
      reviewedBy: 1,
      reviewNotes: '승인합니다',
    }

    it('should successfully approve application with all data copied correctly', async () => {
      mockPrismaService.expertApplication.findUnique.mockResolvedValue(mockApplication)
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaService.expert.findFirst.mockResolvedValue(null) // No existing expert
      mockPrismaService.expertApplication.update.mockResolvedValue({
        ...mockApplication,
        status: 'APPROVED',
      })
      mockPrismaService.expert.create.mockResolvedValue(mockExpert)
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        roles: JSON.stringify(['USER', 'EXPERT']),
      })
      mockPrismaService.expertAvailability.createMany.mockResolvedValue({ count: 2 })
      mockPrismaService.expertAvailability.count.mockResolvedValue(2)

      const result = await service.approveApplication(mockApplication.id, reviewDto)

      expect(result.success).toBe(true)
      expect(result.expert).toBeDefined()
      expect(mockPrismaService.expert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockApplication.userId,
            name: mockApplication.name,
            contactInfo: expect.objectContaining({
              phone: '010-1234-5678',
              email: mockApplication.email,
            }),
          }),
        })
      )
    })

    it('should copy phoneNumber to contactInfo.phone', async () => {
      mockPrismaService.expertApplication.findUnique.mockResolvedValue(mockApplication)
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaService.expert.findFirst.mockResolvedValue(null)
      mockPrismaService.expertApplication.update.mockResolvedValue({
        ...mockApplication,
        status: 'APPROVED',
      })
      mockPrismaService.expert.create.mockResolvedValue(mockExpert)
      mockPrismaService.user.update.mockResolvedValue(mockUser)
      mockPrismaService.expertAvailability.createMany.mockResolvedValue({ count: 2 })
      mockPrismaService.expertAvailability.count.mockResolvedValue(2)

      await service.approveApplication(mockApplication.id, reviewDto)

      const createCall = mockPrismaService.expert.create.mock.calls[0][0]
      const contactInfo = createCall.data.contactInfo

      expect(contactInfo.phone).toBe('010-1234-5678')
    })

    it('should copy socialLinks with conditional properties (only non-empty values)', async () => {
      mockPrismaService.expertApplication.findUnique.mockResolvedValue(mockApplication)
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaService.expert.findFirst.mockResolvedValue(null)
      mockPrismaService.expertApplication.update.mockResolvedValue({
        ...mockApplication,
        status: 'APPROVED',
      })
      mockPrismaService.expert.create.mockResolvedValue(mockExpert)
      mockPrismaService.user.update.mockResolvedValue(mockUser)
      mockPrismaService.expertAvailability.createMany.mockResolvedValue({ count: 2 })
      mockPrismaService.expertAvailability.count.mockResolvedValue(2)

      await service.approveApplication(mockApplication.id, reviewDto)

      const createCall = mockPrismaService.expert.create.mock.calls[0][0]
      const socialLinks = createCall.data.socialLinks

      // Should only include non-empty values
      expect(socialLinks.website).toBe('https://example.com')
      expect(socialLinks.instagram).toBe('@expert')
      expect(socialLinks.linkedin).toBeUndefined()
      expect(socialLinks.blog).toBeUndefined()
    })

    it('should create availabilitySlots from application data', async () => {
      mockPrismaService.expertApplication.findUnique.mockResolvedValue(mockApplication)
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaService.expert.findFirst.mockResolvedValue(null)
      mockPrismaService.expertApplication.update.mockResolvedValue({
        ...mockApplication,
        status: 'APPROVED',
      })
      mockPrismaService.expert.create.mockResolvedValue(mockExpert)
      mockPrismaService.user.update.mockResolvedValue(mockUser)
      mockPrismaService.expertAvailability.createMany.mockResolvedValue({ count: 2 })
      mockPrismaService.expertAvailability.count.mockResolvedValue(2)

      await service.approveApplication(mockApplication.id, reviewDto)

      expect(mockPrismaService.expertAvailability.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            expertId: mockExpert.id,
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
          }),
          expect.objectContaining({
            expertId: mockExpert.id,
            dayOfWeek: 3,
            startTime: '09:00',
            endTime: '17:00',
          }),
        ]),
        skipDuplicates: true,
      })
    })

    it('should throw validation error if phoneNumber not copied', async () => {
      mockPrismaService.expertApplication.findUnique.mockResolvedValue(mockApplication)
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaService.expert.findFirst.mockResolvedValue(null)
      mockPrismaService.expertApplication.update.mockResolvedValue({
        ...mockApplication,
        status: 'APPROVED',
      })

      // Mock Expert creation with missing phoneNumber (bug simulation)
      mockPrismaService.expert.create.mockResolvedValue({
        ...mockExpert,
        contactInfo: {
          phone: '', // Missing phone number!
          email: mockApplication.email,
          location: '',
          website: '',
        },
      })

      mockPrismaService.user.update.mockResolvedValue(mockUser)
      mockPrismaService.expertAvailability.createMany.mockResolvedValue({ count: 2 })
      mockPrismaService.expertAvailability.count.mockResolvedValue(2)

      await expect(service.approveApplication(mockApplication.id, reviewDto)).rejects.toThrow(
        BadRequestException
      )
    })

    it('should throw validation error if socialLinks not copied despite application having links', async () => {
      mockPrismaService.expertApplication.findUnique.mockResolvedValue(mockApplication)
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaService.expert.findFirst.mockResolvedValue(null)
      mockPrismaService.expertApplication.update.mockResolvedValue({
        ...mockApplication,
        status: 'APPROVED',
      })

      // Mock Expert creation with empty socialLinks (bug simulation)
      mockPrismaService.expert.create.mockResolvedValue({
        ...mockExpert,
        socialLinks: {}, // Empty socialLinks despite application having them!
      })

      mockPrismaService.user.update.mockResolvedValue(mockUser)
      mockPrismaService.expertAvailability.createMany.mockResolvedValue({ count: 2 })
      mockPrismaService.expertAvailability.count.mockResolvedValue(2)

      await expect(service.approveApplication(mockApplication.id, reviewDto)).rejects.toThrow(
        BadRequestException
      )
    })

    it('should throw validation error if availabilitySlots not created', async () => {
      mockPrismaService.expertApplication.findUnique.mockResolvedValue(mockApplication)
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaService.expert.findFirst.mockResolvedValue(null)
      mockPrismaService.expertApplication.update.mockResolvedValue({
        ...mockApplication,
        status: 'APPROVED',
      })
      mockPrismaService.expert.create.mockResolvedValue(mockExpert)
      mockPrismaService.user.update.mockResolvedValue(mockUser)
      mockPrismaService.expertAvailability.createMany.mockResolvedValue({ count: 2 })

      // Mock no slots created (bug simulation)
      mockPrismaService.expertAvailability.count.mockResolvedValue(0)

      await expect(service.approveApplication(mockApplication.id, reviewDto)).rejects.toThrow(
        BadRequestException
      )
    })

    it('should prevent duplicate Expert creation for same user', async () => {
      mockPrismaService.expertApplication.findUnique.mockResolvedValue(mockApplication)
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      // Mock existing expert for this user
      mockPrismaService.expert.findFirst.mockResolvedValue({
        id: 999,
        userId: mockApplication.userId,
        name: '김전문',
      })

      mockPrismaService.expertApplication.update.mockResolvedValue({
        ...mockApplication,
        status: 'APPROVED',
      })
      mockPrismaService.expert.create.mockResolvedValue(mockExpert)
      mockPrismaService.user.update.mockResolvedValue(mockUser)
      mockPrismaService.expertAvailability.createMany.mockResolvedValue({ count: 2 })
      mockPrismaService.expertAvailability.count.mockResolvedValue(2)

      await expect(service.approveApplication(mockApplication.id, reviewDto)).rejects.toThrow(
        BadRequestException
      )

      // Verify error code
      try {
        await service.approveApplication(mockApplication.id, reviewDto)
      } catch (error) {
        expect(error.response.error.code).toBe('E_DUPLICATE_EXPERT')
      }
    })

    it('should throw error if application not found', async () => {
      mockPrismaService.expertApplication.findUnique.mockResolvedValue(null)

      await expect(service.approveApplication(999, reviewDto)).rejects.toThrow(NotFoundException)
    })

    it('should throw error if application already reviewed', async () => {
      mockPrismaService.expertApplication.findUnique.mockResolvedValue({
        ...mockApplication,
        status: 'APPROVED',
      })

      await expect(service.approveApplication(mockApplication.id, reviewDto)).rejects.toThrow(
        BadRequestException
      )

      try {
        await service.approveApplication(mockApplication.id, reviewDto)
      } catch (error) {
        expect(error.response.error.code).toBe('E_ALREADY_REVIEWED')
      }
    })

    it('should handle application with no phoneNumber gracefully', async () => {
      const appWithoutPhone = {
        ...mockApplication,
        phoneNumber: null,
      }

      mockPrismaService.expertApplication.findUnique.mockResolvedValue(appWithoutPhone)
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaService.expert.findFirst.mockResolvedValue(null)
      mockPrismaService.expertApplication.update.mockResolvedValue({
        ...appWithoutPhone,
        status: 'APPROVED',
      })
      mockPrismaService.expert.create.mockResolvedValue({
        ...mockExpert,
        contactInfo: {
          phone: '',
          email: appWithoutPhone.email,
          location: '',
          website: '',
        },
      })
      mockPrismaService.user.update.mockResolvedValue(mockUser)
      mockPrismaService.expertAvailability.createMany.mockResolvedValue({ count: 2 })
      mockPrismaService.expertAvailability.count.mockResolvedValue(2)

      const result = await service.approveApplication(appWithoutPhone.id, reviewDto)

      expect(result.success).toBe(true)
      // Should not throw validation error since application had no phoneNumber
    })

    it('should handle application with no socialLinks gracefully', async () => {
      const appWithoutSocialLinks = {
        ...mockApplication,
        socialLinks: JSON.stringify({}),
      }

      mockPrismaService.expertApplication.findUnique.mockResolvedValue(appWithoutSocialLinks)
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaService.expert.findFirst.mockResolvedValue(null)
      mockPrismaService.expertApplication.update.mockResolvedValue({
        ...appWithoutSocialLinks,
        status: 'APPROVED',
      })
      mockPrismaService.expert.create.mockResolvedValue({
        ...mockExpert,
        socialLinks: {},
      })
      mockPrismaService.user.update.mockResolvedValue(mockUser)
      mockPrismaService.expertAvailability.createMany.mockResolvedValue({ count: 2 })
      mockPrismaService.expertAvailability.count.mockResolvedValue(2)

      const result = await service.approveApplication(appWithoutSocialLinks.id, reviewDto)

      expect(result.success).toBe(true)
      // Should not throw validation error since application had no socialLinks
    })

    it('should handle application with no availabilitySlots gracefully', async () => {
      const appWithoutSlots = {
        ...mockApplication,
        availability: JSON.stringify({
          availabilitySlots: [],
          holidaySettings: { enabled: false },
        }),
      }

      mockPrismaService.expertApplication.findUnique.mockResolvedValue(appWithoutSlots)
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaService.expert.findFirst.mockResolvedValue(null)
      mockPrismaService.expertApplication.update.mockResolvedValue({
        ...appWithoutSlots,
        status: 'APPROVED',
      })
      mockPrismaService.expert.create.mockResolvedValue(mockExpert)
      mockPrismaService.user.update.mockResolvedValue(mockUser)
      mockPrismaService.expertAvailability.createMany.mockResolvedValue({ count: 0 })
      mockPrismaService.expertAvailability.count.mockResolvedValue(0)

      const result = await service.approveApplication(appWithoutSlots.id, reviewDto)

      expect(result.success).toBe(true)
      // Should not throw validation error since application had no availabilitySlots
    })
  })
})
