import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpertApplicationDto } from './dto/expert-application.dto';
import { ulid } from 'ulid';

type ListParams = { 
  page: number; 
  size: number; 
  q?: string; 
  category?: string; 
  sort?: string 
};

@Injectable()
export class ExpertsService {
  constructor(private prisma: PrismaService) {}

  async list(params: ListParams) {
    const { page, size, q, category, sort } = params;
    const where: any = { isActive: true };

    // Search query
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { title: { contains: q } },
        { bio: { contains: q } },
      ];
    }

    // Category filter - since categories is JSON, we use JSON_CONTAINS for MySQL
    if (category) {
      where.categories = {
        array_contains: category
      };
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'rating') orderBy = { ratingAvg: 'desc' };
    if (sort === '-rating') orderBy = { ratingAvg: 'asc' };
    if (sort === 'recent') orderBy = { createdAt: 'desc' };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.expert.count({ where }),
      this.prisma.expert.findMany({
        where,
        orderBy,
        skip: (page - 1) * size,
        take: size,
        select: {
          id: true,
          displayId: true,
          name: true,
          title: true,
          categories: true,
          bio: true,
          avatarUrl: true,
          ratingAvg: true,
          reviewCount: true,
          createdAt: true,
        },
      }),
    ]);

    return { total, items };
  }

  findByDisplayId(displayId: string) {
    return this.prisma.expert.findUnique({
      where: { displayId },
      select: {
        id: true,
        displayId: true,
        name: true,
        title: true,
        categories: true,
        bio: true,
        avatarUrl: true,
        ratingAvg: true,
        reviewCount: true,
        createdAt: true,
      },
    });
  }

  async createApplication(userId: number, dto: CreateExpertApplicationDto) {
    const displayId = ulid();
    
    return this.prisma.expertApplication.create({
      data: {
        displayId,
        userId,
        name: dto.name,
        email: dto.email,
        jobTitle: dto.jobTitle,
        specialty: dto.specialty,
        experienceYears: dto.experienceYears,
        bio: dto.bio,
        keywords: dto.keywords,
        consultationTypes: dto.consultationTypes,
        availability: dto.availability,
        certifications: dto.certifications,
        profileImage: dto.profileImage,
        status: 'PENDING',
      },
    });
  }
}
