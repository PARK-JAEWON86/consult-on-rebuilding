export interface ExpertProfile {
  id: number;
  name: string;
  specialty: string;
  experience: number;
  description: string;
  education: string[];
  certifications: string[];
  keywords: string[];  // specialties → keywords로 변경
  specialtyAreas: string[];
  consultationTypes: ConsultationType[];
  languages: string[];
  hourlyRate: number;
  pricePerMinute: number;
  totalSessions: number;
  avgRating: number;
  rating: number;
  reviewCount: number;
  completionRate: number;
  repeatClients: number;
  responseTime: string;
  averageSessionDuration: number;
  cancellationPolicy: string;
  availability: WeeklyAvailability;
  weeklyAvailability: WeeklyAvailability;
  holidayPolicy?: string;
  contactInfo: ContactInfo;
  location: string;
  timeZone: string;
  profileImage: string | null;
  portfolioFiles: PortfolioFile[];
  portfolioItems: PortfolioItem[];
  tags: string[];
  targetAudience: string[];
  isOnline: boolean;
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  price: string;
  image: string | null;
  consultationStyle: string;
  successStories: number;
  nextAvailableSlot: string;
  profileViews: number;
  lastActiveAt: Date;
  joinedAt: Date;
  socialProof: SocialProof;
  pricingTiers: PricingTier[];
  reschedulePolicy: string;
}

export interface Review {
  id: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  expertId: number;
  rating: number;
  comment: string;
  consultationTopic: string;
  consultationType: ConsultationType;
  createdAt: string;
  isVerified: boolean;
  expertReply?: ExpertReply;
}

export interface ExpertReply {
  message: string;
  createdAt: string;
}

export type ConsultationType = 'video' | 'voice' | 'chat';

export interface WeeklyAvailability {
  monday: DayAvailability[];
  tuesday: DayAvailability[];
  wednesday: DayAvailability[];
  thursday: DayAvailability[];
  friday: DayAvailability[];
  saturday: DayAvailability[];
  sunday: DayAvailability[];
}

export interface DayAvailability {
  available: boolean;
  hours: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  location: string;
  website: string;
}

export interface PortfolioFile {
  id: number;
  name: string;
  type: string;
  size: number;
  data: string;
}

export interface PortfolioItem {
  title: string;
  description: string;
  type: string;
}

export interface SocialProof {
  linkedIn?: string;
  website?: string;
  publications: string[];
}

export interface PricingTier {
  duration: number;
  price: number;
  description: string;
}