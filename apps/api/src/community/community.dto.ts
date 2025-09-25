import { z } from 'zod';

// Community Stats DTO
export const CommunityStatsSchema = z.object({
  totalPosts: z.number(),
  activeUsers: z.number(),
  todayPosts: z.number(),
});

export type CommunityStatsDto = z.infer<typeof CommunityStatsSchema>;

// Post Query DTO
export const PostQuerySchema = z.object({
  category: z.string().optional().default('all'),
  search: z.string().optional().default(''),
  sortBy: z.enum(['latest', 'popular', 'comments', 'views']).optional().default('latest'),
  period: z.string().optional(),
  authorType: z.string().optional(),
  minLikes: z.string().optional(),
  userId: z.string().optional(),
  type: z.enum(['posts', 'comments']).optional(),
});

export type PostQueryDto = z.infer<typeof PostQuerySchema>;

// Create Post DTO
export const CreatePostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이하여야 합니다'),
  content: z.string().min(1, '내용을 입력해주세요').max(10000, '내용은 10000자 이하여야 합니다'),
  category: z.string().min(1, '카테고리를 선택해주세요'),
  postType: z.enum(['general', 'consultation_request', 'consultation_review', 'expert_intro']).default('general'),
  tags: z.array(z.string()).optional().default([]),
  profileVisibility: z.enum(['public', 'experts', 'private']).optional().default('experts'),
  urgency: z.string().optional(),
  preferredMethod: z.string().optional(),
  availableTime: z.string().optional(),
  isAnonymous: z.boolean().optional().default(false),
});

export type CreatePostDto = z.infer<typeof CreatePostSchema>;

// Post Response DTO
export const PostResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  category: z.string(),
  postType: z.string(),
  tags: z.array(z.string()),
  author: z.object({
    id: z.number(),
    name: z.string(),
    role: z.string().optional(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  likes: z.number().default(0),
  comments: z.number().default(0),
  views: z.number().default(0),
  urgency: z.string().optional(),
  preferredMethod: z.string().optional(),
});

export type PostResponseDto = z.infer<typeof PostResponseSchema>;

// Category DTO
export const CategoryResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean(),
  postCount: z.number().optional(),
});

export type CategoryResponseDto = z.infer<typeof CategoryResponseSchema>;

// Expert Proposal DTO
export const ExpertProposalSchema = z.object({
  expertId: z.string(),
  expertName: z.string(),
  consultationPostId: z.string().optional(),
  message: z.string().min(1, '메시지를 입력해주세요'),
  proposedMethod: z.string().min(1, '상담 방식을 선택해주세요'),
  proposedTime: z.string().min(1, '상담 시간을 입력해주세요'),
  experience: z.string().optional(),
  credentials: z.string().optional(),
  submittedAt: z.string(),
});

export type ExpertProposalDto = z.infer<typeof ExpertProposalSchema>;