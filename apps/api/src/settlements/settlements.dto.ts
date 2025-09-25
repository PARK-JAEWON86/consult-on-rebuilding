import { z } from 'zod';

// 정산 요약 정보
export const SettlementSummarySchema = z.object({
  totalConsultations: z.number().int().min(0),
  totalGrossCredits: z.number().int().min(0),
  totalGrossKrw: z.number().int().min(0),
  totalPlatformFeeKrw: z.number().int().min(0),
  taxWithheldKrw: z.number().int().min(0),
  netPayoutCredits: z.number().int().min(0),
  avgDurationMin: z.number().int().min(0),
});

// 상담 아이템
export const ConsultationItemSchema = z.object({
  id: z.number().int(),
  date: z.string(),
  customer: z.string(),
  topic: z.string(),
  amount: z.number().int().min(0),
  status: z.enum(['completed', 'scheduled', 'canceled']),
});

// 월별 통계
export const MonthlyStatsSchema = z.object({
  month: z.number().int().min(1).max(12),
  label: z.string(),
  gross: z.number().int().min(0),
  fee: z.number().int().min(0),
  net: z.number().int().min(0),
  consultationCount: z.number().int().min(0),
});

// 정산 응답
export const SettlementResponseSchema = z.object({
  summary: SettlementSummarySchema,
  consultations: z.array(ConsultationItemSchema),
  monthlyStats: z.array(MonthlyStatsSchema),
  nextSettlementDate: z.string(),
  daysUntilSettlement: z.number().int().min(0),
});

// 타입 추출
export type SettlementSummary = z.infer<typeof SettlementSummarySchema>;
export type ConsultationItem = z.infer<typeof ConsultationItemSchema>;
export type MonthlyStats = z.infer<typeof MonthlyStatsSchema>;
export type SettlementResponse = z.infer<typeof SettlementResponseSchema>;