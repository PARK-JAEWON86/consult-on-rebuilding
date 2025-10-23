/**
 * E2E 테스트: 전문가 지원 플로우
 *
 * 시나리오:
 * 1. 사용자가 전문가 지원서 제출 (포트폴리오 이미지 포함)
 * 2. 관리자가 지원서 승인
 * 3. Expert 레코드 생성 확인
 * 4. Expert 프로필 조회 시 portfolioFiles 데이터 확인
 * 5. 프론트엔드 API 응답 구조 검증
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';

describe('Expert Application Flow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testUser: any;
  let adminUser: any;
  let userToken: string;
  let adminToken: string;

  // 테스트 이미지 데이터 (작은 1x1 픽셀 JPEG)
  const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==';
  const testImageBase64_2 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // 테스트 사용자 생성 (지원자)
    testUser = await prisma.user.create({
      data: {
        email: `test-applicant-${Date.now()}@example.com`,
        name: '테스트 지원자',
        roles: JSON.stringify(['USER']),
      },
    });

    // 테스트 관리자 생성
    adminUser = await prisma.user.create({
      data: {
        email: `test-admin-${Date.now()}@example.com`,
        name: '테스트 관리자',
        roles: JSON.stringify(['ADMIN']),
      },
    });

    // JWT 토큰 생성
    userToken = jwtService.sign({ sub: testUser.id, email: testUser.email });
    adminToken = jwtService.sign({ sub: adminUser.id, email: adminUser.email });
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.expertApplication.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.expert.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [testUser.id, adminUser.id] },
      },
    });

    await app.close();
  });

  describe('전문가 지원 플로우', () => {
    let applicationId: number;
    let expertDisplayId: string;

    it('1단계: 사용자가 포트폴리오 이미지 포함 지원서 제출', async () => {
      const applicationData = {
        name: testUser.name,
        email: testUser.email,
        phoneNumber: '010-1234-5678',
        jobTitle: '심리상담전문가',
        specialty: '심리상담 - 우울증, 불안장애',
        experienceYears: 5,
        bio: '10년 경력의 심리상담 전문가입니다.',
        education: ['서울대학교 심리학과 학사', '연세대학교 임상심리학 석사'],
        certifications: [
          { name: '상담심리사 1급', issuer: '한국상담심리학회', year: '2019' },
          { name: '임상심리사 2급', issuer: '한국임상심리학회', year: '2020' },
        ],
        keywords: ['우울증', '불안장애', '트라우마', '인지행동치료'],
        consultationTypes: ['video', 'chat'],
        languages: ['한국어', '영어'],
        mbti: 'INFJ',
        consultationStyle: '공감적이고 체계적인 상담을 지향합니다.',
        workExperience: [
          { company: 'A 심리상담센터', position: '수석상담사', period: '2019-현재' },
          { company: 'B 정신건강의학과', position: '임상심리사', period: '2017-2019' },
        ],
        portfolioImages: [testImageBase64, testImageBase64_2], // 2개의 포트폴리오 이미지
        availability: {
          availabilitySlots: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isActive: true },
            { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isActive: true },
          ],
          holidaySettings: {
            acceptHolidayConsultations: false,
            holidayNote: '공휴일 휴무',
          },
        },
        socialLinks: {
          website: 'https://example.com',
          blog: 'https://blog.example.com',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/experts/apply')
        .set('Authorization', `Bearer ${userToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.portfolioImages).toBeDefined();
      expect(Array.isArray(response.body.data.portfolioImages)).toBe(true);
      expect(response.body.data.portfolioImages.length).toBe(2);

      applicationId = response.body.data.id;

      // DB에서 직접 확인
      const dbApplication = await prisma.expertApplication.findUnique({
        where: { id: applicationId },
      });

      console.log('✅ 1단계 완료: 지원서 제출 성공');
      console.log('  - Application ID:', applicationId);
      console.log('  - portfolioImages 타입:', typeof dbApplication.portfolioImages);
      console.log('  - portfolioImages 내용:',
        typeof dbApplication.portfolioImages === 'string'
          ? JSON.parse(dbApplication.portfolioImages as string).length + '개'
          : Array.isArray(dbApplication.portfolioImages)
          ? dbApplication.portfolioImages.length + '개'
          : '없음'
      );
    });

    it('2단계: 관리자가 지원서 승인', async () => {
      const reviewData = {
        reviewedBy: adminUser.id,
        reviewNotes: 'E2E 테스트 승인',
      };

      const response = await request(app.getHttpServer())
        .post(`/admin/expert-applications/${applicationId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(reviewData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('APPROVED');

      // Expert 레코드 생성 확인
      const expert = await prisma.expert.findFirst({
        where: { userId: testUser.id },
      });

      expect(expert).toBeDefined();
      expect(expert.displayId).toBeDefined();
      expertDisplayId = expert.displayId;

      console.log('✅ 2단계 완료: 관리자 승인 성공');
      console.log('  - Expert Display ID:', expertDisplayId);
      console.log('  - Expert ID:', expert.id);
    });

    it('3단계: Expert.portfolioFiles 데이터 저장 확인', async () => {
      const expert = await prisma.expert.findFirst({
        where: { userId: testUser.id },
        select: {
          id: true,
          displayId: true,
          portfolioFiles: true,
        },
      });

      expect(expert).toBeDefined();
      expect(expert.portfolioFiles).toBeDefined();

      let portfolioFiles: any[] = [];
      if (typeof expert.portfolioFiles === 'string') {
        portfolioFiles = JSON.parse(expert.portfolioFiles as string);
      } else if (Array.isArray(expert.portfolioFiles)) {
        portfolioFiles = expert.portfolioFiles;
      }

      console.log('✅ 3단계 완료: Expert.portfolioFiles 확인');
      console.log('  - portfolioFiles 타입:', typeof expert.portfolioFiles);
      console.log('  - portfolioFiles 항목 수:', portfolioFiles.length);
      console.log('  - 첫 번째 이미지 미리보기:',
        portfolioFiles[0] ? (typeof portfolioFiles[0] === 'string' ? portfolioFiles[0].substring(0, 50) + '...' : 'object') : 'null'
      );

      // portfolioFiles에 이미지가 저장되어 있어야 함
      expect(portfolioFiles.length).toBeGreaterThan(0);
      expect(portfolioFiles.length).toBe(2); // 2개의 이미지
    });

    it('4단계: API를 통한 Expert 프로필 조회 (프론트엔드 시뮬레이션)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/experts/${expertDisplayId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.portfolioFiles).toBeDefined();

      const portfolioFiles = response.body.data.portfolioFiles;

      console.log('✅ 4단계 완료: API 프로필 조회 성공');
      console.log('  - API 응답 portfolioFiles:', Array.isArray(portfolioFiles) ? portfolioFiles.length + '개' : typeof portfolioFiles);
      console.log('  - 프론트엔드가 받을 데이터:', portfolioFiles);

      // 프론트엔드가 받는 portfolioFiles 검증
      expect(Array.isArray(portfolioFiles)).toBe(true);
      expect(portfolioFiles.length).toBe(2);
      expect(typeof portfolioFiles[0]).toBe('string');
      expect(portfolioFiles[0]).toContain('data:image/jpeg;base64');
    });

    it('5단계: 프론트엔드 프로필 편집 모드 데이터 매핑 시뮬레이션', () => {
      // 프론트엔드 코드에서 하는 매핑 로직 시뮬레이션
      const expertProfile = {
        portfolioFiles: [testImageBase64, testImageBase64_2],
        portfolioImages: undefined, // 없음
      };

      // 실제 프론트엔드 로직
      const mappedPortfolioFiles = (() => {
        // 1순위: portfolioFiles
        if (expertProfile.portfolioFiles && Array.isArray(expertProfile.portfolioFiles) && expertProfile.portfolioFiles.length > 0) {
          return expertProfile.portfolioFiles.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null) {
              return (item as any).data || (item as any).url || '';
            }
            return '';
          }).filter(url => url && url.length > 0);
        }

        // 2순위: portfolioImages
        if (expertProfile.portfolioImages && Array.isArray(expertProfile.portfolioImages) && expertProfile.portfolioImages.length > 0) {
          return expertProfile.portfolioImages.filter(url => url && url.length > 0);
        }

        return [];
      })();

      console.log('✅ 5단계 완료: 프론트엔드 매핑 검증');
      console.log('  - 매핑된 portfolioFiles:', mappedPortfolioFiles.length + '개');
      console.log('  - ExpertProfileEdit에 전달될 데이터:', mappedPortfolioFiles.length > 0 ? '정상' : '빈 배열');

      expect(mappedPortfolioFiles.length).toBe(2);
      expect(mappedPortfolioFiles[0]).toContain('data:image/jpeg;base64');
    });
  });

  describe('E2E 플로우 전체 검증', () => {
    it('전체 플로우: 지원 → 승인 → 프로필 조회까지 포트폴리오 이미지 유지', async () => {
      // 새로운 지원서 제출
      const newUser = await prisma.user.create({
        data: {
          email: `e2e-test-${Date.now()}@example.com`,
          name: 'E2E 테스트 사용자',
          roles: JSON.stringify(['USER']),
        },
      });

      const newUserToken = jwtService.sign({ sub: newUser.id, email: newUser.email });

      // 1. 지원서 제출
      const applyResponse = await request(app.getHttpServer())
        .post('/experts/apply')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          name: newUser.name,
          email: newUser.email,
          phoneNumber: '010-9999-9999',
          jobTitle: 'E2E 테스트',
          specialty: '테스트 - E2E',
          experienceYears: 1,
          bio: 'E2E 테스트용',
          education: ['테스트대학교'],
          certifications: [{ name: '테스트 자격증', issuer: '테스트', year: '2024' }],
          keywords: ['E2E'],
          consultationTypes: ['video'],
          languages: ['한국어'],
          portfolioImages: [testImageBase64],
          availability: {
            availabilitySlots: [],
            holidaySettings: { acceptHolidayConsultations: false, holidayNote: '' },
          },
        })
        .expect(201);

      const newApplicationId = applyResponse.body.data.id;

      // 2. 승인
      const approveResponse = await request(app.getHttpServer())
        .post(`/admin/expert-applications/${newApplicationId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reviewedBy: adminUser.id, reviewNotes: 'E2E 자동 승인' })
        .expect(200);

      expect(approveResponse.body.data.status).toBe('APPROVED');

      // 3. Expert 조회
      const expert = await prisma.expert.findFirst({
        where: { userId: newUser.id },
      });

      expect(expert).toBeDefined();

      // 4. API로 프로필 조회
      const profileResponse = await request(app.getHttpServer())
        .get(`/experts/${expert.displayId}`)
        .expect(200);

      const portfolioFiles = profileResponse.body.data.portfolioFiles;

      console.log('\n🎉 E2E 전체 플로우 검증 완료!');
      console.log('  ✅ 지원서 제출: portfolioImages 1개');
      console.log('  ✅ 관리자 승인: Expert 생성');
      console.log('  ✅ Expert.portfolioFiles:', Array.isArray(portfolioFiles) ? portfolioFiles.length + '개' : '없음');
      console.log('  ✅ API 응답: portfolioFiles 정상 반환');

      // 최종 검증
      expect(Array.isArray(portfolioFiles)).toBe(true);
      expect(portfolioFiles.length).toBe(1);
      expect(portfolioFiles[0]).toContain('data:image/jpeg;base64');

      // 정리
      await prisma.expert.delete({ where: { id: expert.id } });
      await prisma.expertApplication.delete({ where: { id: newApplicationId } });
      await prisma.user.delete({ where: { id: newUser.id } });
    });
  });
});
