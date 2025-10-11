import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    reservation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    expertAvailability: {
      findMany: jest.fn(),
    },
    reservationHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    creditTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockCreditsService = {
    debit: jest.fn(),
    credit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CreditsService,
          useValue: mockCreditsService,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('예약 생성 (create)', () => {
    it('정상적인 예약 생성', async () => {
      const reservationData = {
        userId: 1,
        expertId: 1,
        startAt: new Date('2025-10-15T10:00:00Z').toISOString(),
        endAt: new Date('2025-10-15T11:00:00Z').toISOString(),
        note: '상담 요청',
      };

      // Mock expert availability
      mockPrismaService.expertAvailability.findMany.mockResolvedValue([
        {
          dayOfWeek: 'TUESDAY',
          startTime: '09:00',
          endTime: '18:00',
          isActive: true,
        },
      ]);

      // Mock no conflicts
      mockPrismaService.reservation.findFirst = jest.fn().mockResolvedValue(null);

      // Mock successful creation
      mockPrismaService.reservation.create.mockResolvedValue({
        id: 1,
        displayId: 'RES-001',
        ...reservationData,
        status: 'PENDING',
        cost: 100,
      });

      mockCreditsService.debit.mockResolvedValue({ success: true });

      const result = await service.create(reservationData);

      expect(result.displayId).toBe('RES-001');
      expect(result.status).toBe('PENDING');
      expect(mockCreditsService.debit).toHaveBeenCalledWith(1, 100, 'reservation', 'RES-001');
    });

    it('전문가 근무 시간 외 예약 시 에러', async () => {
      const reservationData = {
        userId: 1,
        expertId: 1,
        startAt: new Date('2025-10-15T20:00:00Z').toISOString(), // 근무시간 외
        endAt: new Date('2025-10-15T21:00:00Z').toISOString(),
      };

      mockPrismaService.expertAvailability.findMany.mockResolvedValue([
        {
          dayOfWeek: 'TUESDAY',
          startTime: '09:00',
          endTime: '18:00',
          isActive: true,
        },
      ]);

      await expect(service.create(reservationData)).rejects.toThrow(BadRequestException);
    });

    it('시간 충돌 시 대체 시간 제안', async () => {
      const reservationData = {
        userId: 1,
        expertId: 1,
        startAt: new Date('2025-10-15T10:00:00Z').toISOString(),
        endAt: new Date('2025-10-15T11:00:00Z').toISOString(),
      };

      // Mock expert availability
      mockPrismaService.expertAvailability.findMany.mockResolvedValue([
        {
          dayOfWeek: 'TUESDAY',
          startTime: '09:00',
          endTime: '18:00',
          isActive: true,
        },
      ]);

      // Mock conflict
      mockPrismaService.reservation.findFirst = jest.fn().mockResolvedValue({
        displayId: 'RES-EXISTING',
        startAt: new Date('2025-10-15T10:00:00Z'),
        endAt: new Date('2025-10-15T11:00:00Z'),
      });

      // Mock alternative slots
      mockPrismaService.reservation.findMany = jest.fn().mockResolvedValue([]);

      try {
        await service.create(reservationData);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.response.error.code).toBe('E_TIME_CONFLICT');
        expect(error.response.error.alternativeTimes).toBeDefined();
      }
    });
  });

  describe('예약 승인 (approve)', () => {
    it('정상적인 예약 승인', async () => {
      const displayId = 'RES-001';
      const expertId = 1;

      mockPrismaService.reservation.findUnique.mockResolvedValue({
        displayId,
        expertId,
        userId: 2,
        status: 'PENDING',
        cost: 100,
      });

      mockPrismaService.reservation.update.mockResolvedValue({
        id: 1,
        displayId,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      });

      mockPrismaService.reservationHistory.create.mockResolvedValue({});

      const result = await service.approve(displayId, expertId);

      expect(result.status).toBe('CONFIRMED');
      expect(result.confirmedAt).toBeDefined();
      expect(mockPrismaService.reservationHistory.create).toHaveBeenCalled();
    });

    it('PENDING 상태가 아닌 예약 승인 시 에러', async () => {
      const displayId = 'RES-001';
      const expertId = 1;

      mockPrismaService.reservation.findUnique.mockResolvedValue({
        displayId,
        expertId,
        status: 'CONFIRMED',
      });

      await expect(service.approve(displayId, expertId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('예약 거절 (reject)', () => {
    it('정상적인 예약 거절 및 환불', async () => {
      const displayId = 'RES-001';
      const expertId = 1;
      const reason = '일정 변경';

      mockPrismaService.reservation.findUnique.mockResolvedValue({
        displayId,
        expertId,
        userId: 2,
        status: 'PENDING',
        cost: 100,
      });

      mockPrismaService.reservation.update.mockResolvedValue({
        id: 1,
        displayId,
        status: 'REJECTED',
        cancelReason: reason,
        refundAmount: 100,
      });

      mockPrismaService.creditTransaction.create.mockResolvedValue({});
      mockPrismaService.reservationHistory.create.mockResolvedValue({});

      const result = await service.reject(displayId, expertId, reason);

      expect(result.status).toBe('REJECTED');
      expect(result.cancelReason).toBe(reason);
      expect(result.refundAmount).toBe(100);
      expect(mockPrismaService.creditTransaction.create).toHaveBeenCalled();
    });
  });

  describe('예약 취소 (cancel)', () => {
    it('24시간 이전 취소 - 전액 환불', async () => {
      const displayId = 'RES-001';
      const userId = 1;
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48시간 후

      mockPrismaService.reservation.findUnique.mockResolvedValue({
        displayId,
        userId,
        expertId: 2,
        status: 'PENDING',
        cost: 100,
        startAt: futureDate,
        expert: { cancellationPolicy: null },
      });

      mockPrismaService.reservation.update.mockResolvedValue({
        id: 1,
        displayId,
        status: 'CANCELED',
        refundAmount: 100,
      });

      mockPrismaService.creditTransaction.create.mockResolvedValue({});
      mockPrismaService.reservationHistory.create.mockResolvedValue({});

      const result = await service.cancel(displayId, userId);

      expect(result.refundAmount).toBe(100);
      expect(result.refundRate).toBe(100);
    });

    it('24시간 이내 취소 - 50% 환불', async () => {
      const displayId = 'RES-001';
      const userId = 1;
      const nearDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12시간 후

      mockPrismaService.reservation.findUnique.mockResolvedValue({
        displayId,
        userId,
        expertId: 2,
        status: 'PENDING',
        cost: 100,
        startAt: nearDate,
        expert: { cancellationPolicy: null },
      });

      mockPrismaService.reservation.update.mockResolvedValue({
        id: 1,
        displayId,
        status: 'CANCELED',
        refundAmount: 50,
      });

      mockPrismaService.creditTransaction.create.mockResolvedValue({});
      mockPrismaService.reservationHistory.create.mockResolvedValue({});

      const result = await service.cancel(displayId, userId);

      expect(result.refundAmount).toBe(50);
      expect(result.refundRate).toBe(50);
    });

    it('시작 시간 이후 취소 시 에러', async () => {
      const displayId = 'RES-001';
      const userId = 1;
      const pastDate = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1시간 전

      mockPrismaService.reservation.findUnique.mockResolvedValue({
        displayId,
        userId,
        status: 'CONFIRMED',
        cost: 100,
        startAt: pastDate,
        expert: { cancellationPolicy: null },
      });

      await expect(service.cancel(displayId, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('예약 히스토리 조회 (getReservationHistory)', () => {
    it('정상적인 히스토리 조회', async () => {
      const displayId = 'RES-001';

      mockPrismaService.reservation.findUnique.mockResolvedValue({
        id: 1,
        displayId,
      });

      mockPrismaService.reservationHistory.findMany.mockResolvedValue([
        {
          id: 1,
          fromStatus: 'PENDING',
          toStatus: 'CONFIRMED',
          changedBy: 1,
          reason: '전문가가 예약을 승인했습니다',
          createdAt: new Date(),
        },
      ]);

      const result = await service.getReservationHistory(displayId);

      expect(result).toHaveLength(1);
      expect(result[0].toStatus).toBe('CONFIRMED');
    });

    it('존재하지 않는 예약 히스토리 조회 시 에러', async () => {
      const displayId = 'INVALID';

      mockPrismaService.reservation.findUnique.mockResolvedValue(null);

      await expect(service.getReservationHistory(displayId)).rejects.toThrow(NotFoundException);
    });
  });
});
