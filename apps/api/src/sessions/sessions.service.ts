import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ulid } from 'ulid';
import { buildRtcToken, buildRtmToken } from '../agora/agora.util';
import { RtcRole } from 'agora-access-token';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async ensure(reservationId: number) {
    const res = await this.prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!res || res.status === 'CANCELED') {
      throw new NotFoundException({ 
        success: false, 
        error: { code: 'E_RES_NOT_FOUND', message: 'Reservation invalid' }
      });
    }

    const existing = await this.prisma.session.findFirst({ where: { reservationId } });
    if (existing) return existing;

    return this.prisma.session.create({
      data: { 
        displayId: ulid(), 
        reservationId, 
        channel: ulid(), 
        status: 'SCHEDULED' 
      },
    });
  }

  async start(displayId: string) {
    const s = await this.prisma.session.findUnique({ where: { displayId } });
    if (!s) {
      throw new NotFoundException({ 
        success: false, 
        error: { code: 'E_SES_NOT_FOUND', message: 'Session not found' }
      });
    }
    if (s.status !== 'SCHEDULED') {
      throw new BadRequestException({ 
        success: false, 
        error: { code: 'E_SES_STATE', message: 'Not schedulable' }
      });
    }
    return this.prisma.session.update({ 
      where: { id: s.id }, 
      data: { status: 'LIVE', startedAt: new Date() } 
    });
  }

  async end(displayId: string) {
    const s = await this.prisma.session.findUnique({ where: { displayId } });
    if (!s) {
      throw new NotFoundException({ 
        success: false, 
        error: { code: 'E_SES_NOT_FOUND', message: 'Session not found' }
      });
    }
    if (s.status !== 'LIVE') {
      throw new BadRequestException({ 
        success: false, 
        error: { code: 'E_SES_STATE', message: 'Not live' }
      });
    }
    return this.prisma.session.update({ 
      where: { id: s.id }, 
      data: { status: 'ENDED', endedAt: new Date() } 
    });
  }

  async getDetail(displayId: string) {
    const s = await this.prisma.session.findUnique({ 
      where: { displayId }
    });
    if (!s) {
      throw new NotFoundException({ 
        success: false, 
        error: { code: 'E_SES_NOT_FOUND', message: 'Session not found' }
      });
    }

    // reservation 정보 가져오기
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: s.reservationId }
    });

    return {
      displayId: s.displayId,
      status: s.status,
      channel: s.channel,
      reservation: reservation ? {
        id: reservation.id,
        displayId: reservation.displayId,
        userId: reservation.userId,
        expertId: reservation.expertId,
        startAt: reservation.startAt,
        endAt: reservation.endAt
      } : null
    };
  }

  async upsertNote(displayId: string, userId: number, content: string) {
    const s = await this.prisma.session.findUnique({ where: { displayId } });
    if (!s) {
      throw new NotFoundException({ 
        success: false, 
        error: { code: 'E_SES_NOT_FOUND', message: 'Session not found' }
      });
    }

    await this.prisma.sessionNote.upsert({
      where: { sessionId_userId: { sessionId: s.id, userId } },
      update: { content, updatedAt: new Date() },
      create: { sessionId: s.id, userId, content }
    });

    return { ok: true };
  }

  async getNote(displayId: string, userId: number) {
    const s = await this.prisma.session.findUnique({ where: { displayId } });
    if (!s) {
      throw new NotFoundException({ 
        success: false, 
        error: { code: 'E_SES_NOT_FOUND', message: 'Session not found' }
      });
    }

    const note = await this.prisma.sessionNote.findUnique({
      where: { sessionId_userId: { sessionId: s.id, userId } }
    });

    return { content: note?.content || '' };
  }

  async issueTokens(displayId: string, uid: string, role: 'host' | 'audience' = 'audience') {
    const s = await this.prisma.session.findUnique({ where: { displayId } });
    if (!s) {
      throw new NotFoundException({ 
        success: false, 
        error: { code: 'E_SES_NOT_FOUND', message: 'Session not found' }
      });
    }

    const appId = process.env.AGORA_APP_ID!;
    const appCert = process.env.AGORA_APP_CERT!;
    const ttl = Number(process.env.AGORA_TOKEN_TTL_SEC || 3600);
    const rtcRole = role === 'host' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    
    const rtcToken = buildRtcToken(appId, appCert, s.channel, uid, ttl, rtcRole);
    const rtmToken = buildRtmToken(appId, appCert, uid, ttl);
    
    return { 
      appId, 
      channel: s.channel, 
      uid, 
      role, 
      rtcToken, 
      rtmToken 
    };
  }
}
