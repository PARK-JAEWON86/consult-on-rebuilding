import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { AiPhotoStudioService } from '../ai-photo-studio/ai-photo-studio.service';
import { UpdateMatchingProfileDto } from './dto/update-matching-profile.dto';
// Multer types are available globally via src/types/multer.d.ts

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly credits: CreditsService,
    private readonly aiPhotoStudio: AiPhotoStudioService,
  ) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  // 매칭 프로필 조회
  async getMatchingProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        interestedCategories: true,
        preferredConsultationType: true,
        ageGroup: true,
        budgetMin: true,
        budgetMax: true,
        consultationGoals: true,
        preferredTimes: true,
        matchingProfileUpdatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      interestedCategories: user.interestedCategories || [],
      preferredConsultationType: user.preferredConsultationType || [],
      ageGroup: user.ageGroup || '',
      budgetRange: {
        min: user.budgetMin || 30000,
        max: user.budgetMax || 100000,
      },
      consultationGoals: user.consultationGoals || '',
      preferredTimes: user.preferredTimes || [],
      updatedAt: user.matchingProfileUpdatedAt,
    };
  }

  // 매칭 프로필 업데이트
  async updateMatchingProfile(userId: number, dto: UpdateMatchingProfileDto) {
    const updateData: any = {
      matchingProfileUpdatedAt: new Date(),
    };

    if (dto.interestedCategories !== undefined) {
      updateData.interestedCategories = dto.interestedCategories;
    }
    if (dto.preferredConsultationType !== undefined) {
      updateData.preferredConsultationType = dto.preferredConsultationType;
    }
    if (dto.ageGroup !== undefined) {
      updateData.ageGroup = dto.ageGroup;
    }
    if (dto.budgetMin !== undefined) {
      updateData.budgetMin = dto.budgetMin;
    }
    if (dto.budgetMax !== undefined) {
      updateData.budgetMax = dto.budgetMax;
    }
    if (dto.consultationGoals !== undefined) {
      updateData.consultationGoals = dto.consultationGoals;
    }
    if (dto.preferredTimes !== undefined) {
      updateData.preferredTimes = dto.preferredTimes;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        interestedCategories: true,
        preferredConsultationType: true,
        ageGroup: true,
        budgetMin: true,
        budgetMax: true,
        consultationGoals: true,
        preferredTimes: true,
        matchingProfileUpdatedAt: true,
      },
    });

    return {
      interestedCategories: updatedUser.interestedCategories || [],
      preferredConsultationType: updatedUser.preferredConsultationType || [],
      ageGroup: updatedUser.ageGroup || '',
      budgetRange: {
        min: updatedUser.budgetMin || 30000,
        max: updatedUser.budgetMax || 100000,
      },
      consultationGoals: updatedUser.consultationGoals || '',
      preferredTimes: updatedUser.preferredTimes || [],
      updatedAt: updatedUser.matchingProfileUpdatedAt,
    };
  }

  /**
   * 프로필 사진 업로드 (AI 변환 옵션 포함)
   * @param userId 사용자 ID
   * @param file 업로드된 이미지 파일
   * @param useAiTransform AI 변환 사용 여부
   * @returns 업데이트된 사용자 정보 (avatarUrl 포함)
   */
  async uploadProfilePhoto(userId: number, file: Express.Multer.File, useAiTransform: boolean) {
    this.logger.log(`Uploading profile photo for user ${userId}, AI transform: ${useAiTransform}`);

    let avatarUrl: string;

    if (useAiTransform) {
      // AI 변환 사용
      this.logger.log('Requesting AI transformation for profile photo');
      const transformedBase64 = await this.aiPhotoStudio.transformPhoto(file.buffer, file.originalname);
      avatarUrl = transformedBase64;
    } else {
      // 원본 이미지를 base64로 변환
      this.logger.log('Converting original image to base64');
      avatarUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    // 데이터베이스에 저장
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    this.logger.log(`Profile photo uploaded successfully for user ${userId}`);

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl,
      transformedWithAi: useAiTransform,
    };
  }

  // 프로필 완성도 계산
  private calculateProfileCompletion(user: any): number {
    const fields = [
      { check: !!user.name, weight: 15 },
      { check: !!user.bio, weight: 15 },
      { check: !!user.ageGroup, weight: 10 },
      { check: Array.isArray(user.interestedCategories) && user.interestedCategories.length > 0, weight: 25 },
      { check: Array.isArray(user.preferredConsultationType) && user.preferredConsultationType.length > 0, weight: 15 },
      { check: Array.isArray(user.preferredTimes) && user.preferredTimes.length > 0, weight: 20 },
    ];

    const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
    const completedWeight = fields.filter(f => f.check).reduce((sum, f) => sum + f.weight, 0);

    return Math.round((completedWeight / totalWeight) * 100);
  }

  // 프로필 완성 보상 지급
  async claimProfileReward(userId: number) {
    // 1. 사용자 정보 조회
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        bio: true,
        ageGroup: true,
        interestedCategories: true,
        preferredConsultationType: true,
        preferredTimes: true,
        profileCompletionRewardClaimed: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 2. 이미 지급받았는지 확인
    if (user.profileCompletionRewardClaimed) {
      throw new Error('프로필 완성 보상을 이미 지급받았습니다');
    }

    // 3. 프로필 완성도 확인
    const completion = this.calculateProfileCompletion(user);
    if (completion < 100) {
      throw new Error('프로필이 완성되지 않았습니다');
    }

    // 4. 크레딧 지급 (300 크레딧)
    await this.credits.record(userId, 300, 'PROFILE_COMPLETION', `user-${userId}`);

    // 5. 지급 플래그 업데이트
    await this.prisma.user.update({
      where: { id: userId },
      data: { profileCompletionRewardClaimed: true },
    });

    return {
      message: '프로필 완성 보상 300 크레딧이 지급되었습니다!',
      amount: 300,
      newBalance: await this.credits.getBalance(userId),
    };
  }
}
