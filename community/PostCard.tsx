"use client";

import {
  Heart,
  MessageCircle,
  Eye,
  Bot,
  HelpCircle,
  Star,
  Award,
  MessageSquare,
} from "lucide-react";
import { maskPostAuthor, ProfileVisibility } from "@/utils/nameMasking";

interface Post {
  id: string;
  author: {
    id: number;
    name: string;
    avatar: string | null;
  };
  authorAvatar: string | null;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  postType: "consultation_request" | "consultation_review" | "expert_intro" | "general";
  isExpert?: boolean;
  isAISummary?: boolean;
  urgency?: string;
  preferredMethod?: string;
  likes: number;
  comments: number;
  views: number;
  profileVisibility?: ProfileVisibility;
  // 상담후기 관련 추가 필드
  consultationTopic?: string;
  rating?: number;
  expertName?: string;
  isVerified?: boolean;
  hasExpertReply?: boolean;
}

interface PostCardProps {
  post: Post;
  index: number; // 게시글 번호를 위한 인덱스
  onPostClick?: (postId: string) => void;
}

const PostCard = ({
  post,
  index,
  onPostClick,
}: PostCardProps) => {
  // 날짜 단순화 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // 오늘인 경우
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes <= 0 ? '방금 전' : `${diffMinutes}분 전`;
      }
      return `${diffHours}시간 전`;
    }
    
    // 1일 전인 경우
    if (diffDays === 1) {
      return '어제';
    }
    
    // 7일 이내인 경우
    if (diffDays < 7) {
      return `${diffDays}일 전`;
    }
    
    // 7일 이상인 경우 - 월/일 형식
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };
  // 게시글 타입별 정보 설정
  const getPostTypeInfo = (postType: string, isAISummary: boolean = false) => {
    if (isAISummary) {
      return {
        label: "AI 요약",
        icon: Bot,
        bgColor: "bg-purple-100",
        textColor: "text-purple-700",
        borderColor: "border-purple-200",
        cardBg: "bg-purple-50",
      };
    }

    switch (postType) {
      case "consultation_request":
        return {
          label: "상담요청",
          icon: HelpCircle,
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          borderColor: "border-red-200",
          cardBg: "bg-red-50",
        };
      case "consultation_review":
        return {
          label: "상담후기",
          icon: Star,
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-700",
          borderColor: "border-yellow-200",
          cardBg: "bg-yellow-50",
        };
      case "expert_intro":
        return {
          label: "전문가소개",
          icon: Award,
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
          borderColor: "border-blue-200",
          cardBg: "bg-blue-50",
        };
      case "general":
      default:
        return {
          label: "일반글",
          icon: MessageSquare,
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          borderColor: "border-gray-200",
          cardBg: "bg-gray-50",
        };
    }
  };

  const postTypeInfo = getPostTypeInfo(post.postType, post.isAISummary);

  return (
    <div
      className="grid grid-cols-12 gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-200 last:border-b-0"
      onClick={() => onPostClick && onPostClick(post.id)}
    >
      {/* 게시글 번호 */}
      <div className="col-span-1 text-center text-sm text-gray-500">
        {index}
      </div>

      {/* 게시글 제목 + 태그 */}
      <div className="col-span-5 min-w-0">
        <div className="flex flex-col gap-1">
          {/* 제목 */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1">
              {post.title}
            </h3>
            {/* 게시글 타입 배지 */}
            <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${postTypeInfo.bgColor} ${postTypeInfo.textColor} flex-shrink-0`}>
              <postTypeInfo.icon className="h-3 w-3" />
              {postTypeInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* 상담분야 */}
      <div className="col-span-1 text-center text-sm text-gray-600">
        {post.category}
      </div>

      {/* 게시자 */}
      <div className="col-span-1 text-center text-sm">
        <div className="flex flex-col items-center gap-1">
          {/* 작성자 이름 */}
          <span className="text-sm text-gray-700 font-medium">
            {maskPostAuthor(
              post.author.name, 
              post.profileVisibility || "experts",
              false
            )}
          </span>
          
          {/* 전문가 표시 */}
          {post.isExpert && (
            <span className="px-1 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              전문가
            </span>
          )}
        </div>
      </div>

      {/* 날짜 */}
      <div className="col-span-1 text-center text-sm text-gray-500">
        {formatDate(post.createdAt)}
      </div>

      {/* 좋아요-댓글 */}
      <div className="col-span-2 text-center text-sm">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1 text-gray-500">
            <Heart className="h-3 w-3" />
            <span>{post.likes}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <MessageCircle className="h-3 w-3" />
            <span>{post.comments}</span>
          </div>
        </div>
      </div>

      {/* 조회수 */}
      <div className="col-span-1 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-1">
          <Eye className="h-3 w-3" />
          <span>{post.views}</span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;