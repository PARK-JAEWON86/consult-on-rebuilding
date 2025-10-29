import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface TransformPhotoResponse {
  success: boolean;
  data?: {
    transformedImage: string; // base64 encoded image
  };
  error?: {
    code: string;
    message: string;
  };
}

@Injectable()
export class AiPhotoStudioService {
  private readonly logger = new Logger(AiPhotoStudioService.name);
  private readonly httpClient: AxiosInstance;
  private readonly serviceUrl: string;
  private readonly timeout: number;

  constructor(private readonly configService: ConfigService) {
    this.serviceUrl = this.configService.get<string>('AI_PHOTO_STUDIO_URL', '');
    this.timeout = this.configService.get<number>('AI_PHOTO_STUDIO_TIMEOUT', 60000);

    this.httpClient = axios.create({
      baseURL: this.serviceUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!this.serviceUrl) {
      this.logger.warn('AI_PHOTO_STUDIO_URL is not configured. Service will be disabled.');
    }
  }

  /**
   * 셀카를 전문적인 프로필 사진으로 변환
   * @param imageBuffer 이미지 파일 버퍼
   * @param originalName 원본 파일 이름
   * @returns 변환된 이미지 (base64)
   */
  async transformPhoto(imageBuffer: Buffer, originalName: string): Promise<string> {
    // 개발 환경: placeholder URL이면 mock 응답 반환
    if (!this.serviceUrl || this.serviceUrl.includes('your-ai-photo-studio-service')) {
      this.logger.warn('Using mock AI transformation (service URL not configured)');
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getContentType(originalName);
      return `data:${mimeType};base64,${base64Image}`;
    }

    try {
      this.logger.log(`Transforming photo: ${originalName}`);

      // 이미지를 base64로 인코딩
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getContentType(originalName);
      const dataUri = `data:${mimeType};base64,${base64Image}`;

      // Cloud Run 서비스에 JSON 요청 전송
      const response = await this.httpClient.post(
        '/transform',
        {
          image: dataUri,
          filename: originalName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      // Cloud Run 응답 형식: { success: true, transformedImage: "data:image/...", analysis: "...", metadata: {...} }
      if (!response.data.success || !response.data.transformedImage) {
        throw new Error(
          response.data.error || 'Failed to transform photo',
        );
      }

      this.logger.log(`Photo transformed successfully: ${originalName}`);
      this.logger.log(`AI Analysis: ${response.data.analysis?.substring(0, 100)}...`);

      return response.data.transformedImage;
    } catch (error) {
      this.logger.error(
        `Failed to transform photo: ${originalName}`,
        error instanceof Error ? error.stack : String(error),
      );

      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const message =
          error.response?.data?.error?.message ||
          error.message ||
          'AI Photo Studio 서비스 요청 실패';

        throw new HttpException(
          {
            success: false,
            error: {
              code: 'E_AI_SERVICE_ERROR',
              message,
            },
          },
          status,
        );
      }

      throw new HttpException(
        {
          success: false,
          error: {
            code: 'E_UNKNOWN_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        500,
      );
    }
  }

  /**
   * 파일 확장자로부터 Content-Type 추정
   */
  private getContentType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * AI Photo Studio 서비스 헬스 체크
   */
  async healthCheck(): Promise<boolean> {
    if (!this.serviceUrl) {
      return false;
    }

    try {
      const response = await this.httpClient.get('/health', {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      this.logger.error('Health check failed', error);
      return false;
    }
  }
}
