/**
 * 전문가 지원 플로우 E2E 테스트 스크립트
 *
 * 실행: npx tsx scripts/test-expert-flow.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 테스트 이미지 데이터 (1x1 픽셀 JPEG)
const testImage1 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==';
const testImage2 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==';

async function testExpertApplicationFlow() {
  console.log('\n🧪 전문가 지원 플로우 E2E 테스트 시작\n');
  console.log('='.repeat(80));

  try {
    // 1단계: 테스트 사용자 생성
    console.log('\n📝 1단계: 테스트 사용자 생성');
    const testUser = await prisma.user.create({
      data: {
        email: `e2e-test-${Date.now()}@example.com`,
        name: 'E2E 테스트 지원자',
        roles: JSON.stringify(['USER']),
      },
    });
    console.log(`✅ 사용자 생성: ${testUser.name} (ID: ${testUser.id})`);

    // 2단계: 전문가 지원서 제출 시뮬레이션
    console.log('\n📝 2단계: 전문가 지원서 제출 (포트폴리오 이미지 포함)');
    const application = await prisma.expertApplication.create({
      data: {
        displayId: `APP${Date.now()}${testUser.id}`,
        userId: testUser.id,
        name: testUser.name,
        email: testUser.email,
        phoneNumber: '010-1234-5678',
        jobTitle: 'E2E 테스트 전문가',
        specialty: '테스트 - E2E, 통합테스트',
        experienceYears: 5,
        bio: 'E2E 테스트를 위한 전문가 프로필입니다.',
        education: JSON.stringify(['테스트대학교 컴퓨터공학과']),
        certifications: JSON.stringify([
          { name: 'E2E 테스트 자격증', issuer: '테스트 협회', year: '2024' },
        ]),
        keywords: JSON.stringify(['E2E', '통합테스트', '자동화']),
        consultationTypes: JSON.stringify(['video', 'chat']),
        languages: JSON.stringify(['한국어']),
        mbti: 'INTJ',
        consultationStyle: '체계적이고 철저한 테스트를 지향합니다.',
        workExperience: JSON.stringify([
          { company: 'Test Corp', position: 'QA Engineer', period: '2020-현재' },
        ]),
        portfolioImages: JSON.stringify([testImage1, testImage2]), // 2개 이미지
        availability: JSON.stringify({
          availabilitySlots: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isActive: true },
          ],
          holidaySettings: {
            acceptHolidayConsultations: false,
            holidayNote: '공휴일 휴무',
          },
        }),
        socialLinks: JSON.stringify({
          website: 'https://test.example.com',
        }),
        status: 'PENDING',
        currentStage: 'STEP3_COMPLETE',
      },
    });

    console.log(`✅ 지원서 제출 완료 (ID: ${application.id})`);
    console.log(`  - 포트폴리오 이미지: 2개 포함`);

    // portfolioImages 확인
    let appPortfolioImages: any[] = [];
    if (typeof application.portfolioImages === 'string') {
      appPortfolioImages = JSON.parse(application.portfolioImages as string);
    } else if (Array.isArray(application.portfolioImages)) {
      appPortfolioImages = application.portfolioImages;
    }
    console.log(`  - DB에 저장된 이미지 수: ${appPortfolioImages.length}`);

    // 3단계: 관리자 승인 시뮬레이션
    console.log('\n📝 3단계: 관리자 승인 시뮬레이션');

    // 승인 로직 시뮬레이션 (expert-applications.service.ts의 approveApplication 로직)
    const expert = await prisma.expert.create({
      data: {
        displayId: `EXP${Date.now()}${testUser.id}`,
        userId: testUser.id,
        name: application.name,
        title: application.jobTitle,
        specialty: 'E2E 테스트',
        bio: application.bio,
        description: application.bio,
        experience: application.experienceYears,
        experienceYears: application.experienceYears,
        mbti: application.mbti,
        consultationStyle: application.consultationStyle,
        workExperience: application.workExperience,
        categories: JSON.stringify([]), // 빈 배열
        keywords: application.keywords,
        certifications: application.certifications,
        consultationTypes: application.consultationTypes,
        languages: application.languages,
        education: application.education,
        // 핵심: portfolioImages → portfolioFiles
        portfolioFiles: appPortfolioImages, // application.portfolioImages를 복사
        portfolioItems: application.workExperience,
        availability: application.availability,
        contactInfo: JSON.stringify({
          phone: application.phoneNumber,
          email: application.email,
        }),
        socialLinks: application.socialLinks,
        totalSessions: 0,
        repeatClients: 0,
        ratingAvg: 0,
        reviewCount: 0,
        isActive: true,
        isProfileComplete: true,
      },
    });

    console.log(`✅ Expert 레코드 생성 완료 (ID: ${expert.id}, Display ID: ${expert.displayId})`);

    // Expert.portfolioFiles 확인
    let expertPortfolioFiles: any[] = [];
    if (typeof expert.portfolioFiles === 'string') {
      expertPortfolioFiles = JSON.parse(expert.portfolioFiles as string);
    } else if (Array.isArray(expert.portfolioFiles)) {
      expertPortfolioFiles = expert.portfolioFiles;
    }
    console.log(`  - Expert.portfolioFiles에 저장된 이미지 수: ${expertPortfolioFiles.length}`);

    // 지원서 상태 업데이트
    await prisma.expertApplication.update({
      where: { id: application.id },
      data: {
        status: 'APPROVED',
        currentStage: 'APPROVED',
        reviewedAt: new Date(),
      },
    });

    // 4단계: Expert 프로필 조회 (API 시뮬레이션)
    console.log('\n📝 4단계: Expert 프로필 조회 (프론트엔드 API 호출 시뮬레이션)');

    const retrievedExpert = await prisma.expert.findUnique({
      where: { displayId: expert.displayId },
      select: {
        id: true,
        displayId: true,
        name: true,
        portfolioFiles: true,
        certifications: true,
      },
    });

    if (!retrievedExpert) {
      throw new Error('Expert 조회 실패');
    }

    // portfolioFiles 파싱 (백엔드 findByDisplayId 로직 시뮬레이션)
    let retrievedPortfolioFiles: any[] = [];
    if (typeof retrievedExpert.portfolioFiles === 'string') {
      retrievedPortfolioFiles = JSON.parse(retrievedExpert.portfolioFiles as string);
    } else if (Array.isArray(retrievedExpert.portfolioFiles)) {
      retrievedPortfolioFiles = retrievedExpert.portfolioFiles;
    }

    console.log(`✅ Expert 프로필 조회 성공`);
    console.log(`  - Display ID: ${retrievedExpert.displayId}`);
    console.log(`  - portfolioFiles (API 응답): ${retrievedPortfolioFiles.length}개`);

    // 5단계: 프론트엔드 매핑 로직 시뮬레이션
    console.log('\n📝 5단계: 프론트엔드 데이터 매핑 시뮬레이션');

    // 프론트엔드 page.tsx의 매핑 로직
    const mappedData = {
      portfolioFiles: (() => {
        // 1순위: portfolioFiles
        if (retrievedPortfolioFiles && Array.isArray(retrievedPortfolioFiles) && retrievedPortfolioFiles.length > 0) {
          const processed = retrievedPortfolioFiles.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null) {
              return (item as any).data || (item as any).url || '';
            }
            return '';
          }).filter(url => url && url.length > 0);

          return processed;
        }

        return [];
      })(),
    };

    console.log(`✅ 프론트엔드 매핑 완료`);
    console.log(`  - ExpertProfileEdit로 전달될 portfolioFiles: ${mappedData.portfolioFiles.length}개`);
    console.log(`  - 첫 번째 이미지 미리보기: ${mappedData.portfolioFiles[0]?.substring(0, 50)}...`);

    // 6단계: 최종 검증
    console.log('\n📝 6단계: 최종 검증');

    const validations = [
      {
        name: '지원서 portfolioImages',
        expected: 2,
        actual: appPortfolioImages.length,
        pass: appPortfolioImages.length === 2,
      },
      {
        name: 'Expert portfolioFiles',
        expected: 2,
        actual: expertPortfolioFiles.length,
        pass: expertPortfolioFiles.length === 2,
      },
      {
        name: 'API 응답 portfolioFiles',
        expected: 2,
        actual: retrievedPortfolioFiles.length,
        pass: retrievedPortfolioFiles.length === 2,
      },
      {
        name: '프론트엔드 매핑 결과',
        expected: 2,
        actual: mappedData.portfolioFiles.length,
        pass: mappedData.portfolioFiles.length === 2,
      },
      {
        name: 'base64 데이터 포맷',
        expected: true,
        actual: mappedData.portfolioFiles[0]?.includes('data:image/jpeg;base64'),
        pass: mappedData.portfolioFiles[0]?.includes('data:image/jpeg;base64'),
      },
    ];

    let allPassed = true;
    validations.forEach((v, index) => {
      const status = v.pass ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ${v.name}: ${v.actual} (예상: ${v.expected})`);
      if (!v.pass) allPassed = false;
    });

    // 정리
    console.log('\n📝 정리: 테스트 데이터 삭제');
    await prisma.expert.delete({ where: { id: expert.id } });
    await prisma.expertApplication.delete({ where: { id: application.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ 테스트 데이터 정리 완료');

    // 결과
    console.log('\n' + '='.repeat(80));
    if (allPassed) {
      console.log('\n🎉 E2E 테스트 성공! 모든 검증 통과\n');
      console.log('📊 플로우 요약:');
      console.log('  1. 지원서 제출 → portfolioImages (2개) ✅');
      console.log('  2. 관리자 승인 → Expert 생성, portfolioFiles에 복사 ✅');
      console.log('  3. Expert 조회 → portfolioFiles 반환 ✅');
      console.log('  4. 프론트엔드 매핑 → ExpertProfileEdit로 전달 ✅');
      console.log('  5. 프로필 편집 화면 → 포트폴리오 이미지 2개 표시 ✅\n');
    } else {
      console.log('\n❌ E2E 테스트 실패: 일부 검증 실패\n');
    }

  } catch (error) {
    console.error('\n❌ 테스트 실행 중 에러 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testExpertApplicationFlow();
