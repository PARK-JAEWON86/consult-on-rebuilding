import { z } from 'zod';

export const CreateExpertApplicationSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  phoneNumber: z.string().optional(),
  jobTitle: z.string().optional(),
  specialty: z.string().min(1, '전문 분야는 필수입니다'),
  categoryId: z.number().optional(), // 카테고리 ID (옵션)
  experienceYears: z.number().min(0, '경력은 0 이상이어야 합니다'),
  bio: z.string().min(30, '자기소개는 최소 30자 이상이어야 합니다'),
  keywords: z.array(z.string()).min(1, '최소 1개의 키워드가 필요합니다'),
  consultationTypes: z.array(z.enum(['video', 'chat', 'voice'])).min(1, '최소 1개의 상담 유형을 선택해야 합니다'),
  languages: z.array(z.string()).optional(),
  availability: z.record(z.object({
    available: z.boolean(),
    hours: z.string()
  })),
  availabilitySlots: z.array(z.object({
    dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    startTime: z.string(),
    endTime: z.string(),
    isActive: z.boolean().optional()
  })).optional(), // 예약 가능 시간대 (옵션)
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string()
  })),
  education: z.array(z.object({
    school: z.string(),
    major: z.string(),
    degree: z.string()
  })).optional(),
  workExperience: z.array(z.object({
    company: z.string(),
    position: z.string(),
    period: z.string()
  })).optional(),
  profileImage: z.string().optional(),
  mbti: z.string().optional(),
  consultationStyle: z.string().optional(),
  holidaySettings: z.object({
    acceptHolidayConsultations: z.boolean(),
    holidayNote: z.string().optional()
  }).optional(),
});

export type CreateExpertApplicationDto = z.infer<typeof CreateExpertApplicationSchema>;
