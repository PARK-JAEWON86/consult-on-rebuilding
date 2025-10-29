import 'dotenv/config';
import express, { Request, Response } from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const app = express();
const port = process.env.PORT || 8080;

// Multer 설정 - 메모리에 파일 저장
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// Google Gemini AI 클라이언트 초기화
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// 프로필 사진 변환 프롬프트
const PROFILE_PHOTO_PROMPT = `Transform the uploaded selfie into a hyper-realistic, high-quality professional studio headshot. Maintain the subject's unique facial features and expression from the original image. The subject should be wearing a business formal attire (e.g., a fitted blazer and collared shirt). Employ professional studio strobe lighting with a large octabox as the key light and a fill light for subtle shadow reduction, ensuring soft and even illumination. The background must be a neutral, soft-focus studio backdrop (such as a smooth light gray or subtle gradient). The pose should be a head-and-shoulders close-up, with a confident and approachable expression and direct eye contact. Shot on a Canon EOS R5 with an 85mm f/1.4 lens. Output in 8K resolution, with crisp focus on the face.`;

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS 설정 (필요시)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check 엔드포인트
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ai-photo-studio',
  });
});

// 프로필 사진 변환 엔드포인트
app.post('/transform', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    // API 키 확인
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured',
      });
    }

    // 파일 업로드 확인
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No photo file uploaded',
      });
    }

    console.log(`Processing photo: ${req.file.originalname}, size: ${req.file.size} bytes`);

    // 이미지를 base64로 인코딩
    const imageBase64 = req.file.buffer.toString('base64');
    const imageMimeType = req.file.mimetype;

    console.log('Calling Gemini AI...');

    // Gemini AI 모델 설정
    const config = {
      responseModalities: ['IMAGE', 'TEXT'],
      imageConfig: {
        aspectRatio: '3:4', // 프로필 사진에 적합한 비율
      },
    };

    const model = 'gemini-2.5-flash-image';

    // 요청 콘텐츠 구성
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: PROFILE_PHOTO_PROMPT,
          },
          {
            inlineData: {
              mimeType: imageMimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ];

    // Gemini AI 호출
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let transformedImage: Buffer | null = null;
    let transformedMimeType = 'image/png';
    let aiResponse = '';

    // 스트림 응답 처리
    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }

      // 이미지 데이터 추출
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        transformedMimeType = inlineData.mimeType || 'image/png';
        transformedImage = Buffer.from(inlineData.data || '', 'base64');
        console.log('Received transformed image from AI');
      }

      // 텍스트 응답 추출
      if (chunk.text) {
        aiResponse += chunk.text;
      }
    }

    // 변환된 이미지가 없으면 오류 반환
    if (!transformedImage) {
      console.error('No image received from AI');
      return res.status(500).json({
        success: false,
        error: 'Failed to generate transformed image',
        aiResponse: aiResponse || 'No response from AI',
      });
    }

    console.log('Successfully transformed image');

    // 변환된 이미지를 base64로 인코딩하여 반환
    const transformedImageBase64 = transformedImage.toString('base64');

    res.status(200).json({
      success: true,
      data: {
        image: transformedImageBase64,
        mimeType: transformedMimeType,
        originalFilename: req.file.originalname,
        aiResponse: aiResponse,
      },
    });
  } catch (error: any) {
    console.error('Error transforming photo:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// 404 핸들러
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// 에러 핸들러
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`AI Photo Studio service running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`GEMINI_API_KEY configured: ${!!process.env.GEMINI_API_KEY}`);
});
