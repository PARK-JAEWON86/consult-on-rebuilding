const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function insertPortfolioAndSocialData() {
  try {
    console.log('🔄 Adding portfolio files and social links data for experts...');

    // 모든 활성화된 전문가 조회
    const experts = await prisma.expert.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        displayId: true,
        portfolioFiles: true,
        socialLinks: true
      }
    });

    console.log(`📊 Found ${experts.length} active experts`);

    // 포트폴리오 파일 템플릿들
    const portfolioFileTemplates = [
      [
        {
          id: 'pf_001',
          name: '프로젝트 포트폴리오.pdf',
          url: '/uploads/portfolio/project-portfolio-01.pdf',
          type: 'application/pdf',
          size: 2048576,
          uploadedAt: new Date().toISOString()
        },
        {
          id: 'pf_002',
          name: '경력 증명서.pdf',
          url: '/uploads/portfolio/career-certificate-01.pdf',
          type: 'application/pdf',
          size: 1024000,
          uploadedAt: new Date().toISOString()
        }
      ],
      [
        {
          id: 'pf_003',
          name: '사업 계획서.pptx',
          url: '/uploads/portfolio/business-plan-01.pptx',
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          size: 4096000,
          uploadedAt: new Date().toISOString()
        },
        {
          id: 'pf_004',
          name: '프로젝트 리뷰.docx',
          url: '/uploads/portfolio/project-review-01.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 512000,
          uploadedAt: new Date().toISOString()
        },
        {
          id: 'pf_005',
          name: '성과 보고서.pdf',
          url: '/uploads/portfolio/performance-report-01.pdf',
          type: 'application/pdf',
          size: 1536000,
          uploadedAt: new Date().toISOString()
        }
      ],
      [
        {
          id: 'pf_006',
          name: '기술 자격증.jpg',
          url: '/uploads/portfolio/tech-certificate-01.jpg',
          type: 'image/jpeg',
          size: 768000,
          uploadedAt: new Date().toISOString()
        }
      ],
      [
        {
          id: 'pf_007',
          name: '컨설팅 사례집.pdf',
          url: '/uploads/portfolio/consulting-cases-01.pdf',
          type: 'application/pdf',
          size: 3072000,
          uploadedAt: new Date().toISOString()
        },
        {
          id: 'pf_008',
          name: '고객 추천서.pdf',
          url: '/uploads/portfolio/client-recommendation-01.pdf',
          type: 'application/pdf',
          size: 896000,
          uploadedAt: new Date().toISOString()
        },
        {
          id: 'pf_009',
          name: '워크샵 자료.pptx',
          url: '/uploads/portfolio/workshop-materials-01.pptx',
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          size: 5120000,
          uploadedAt: new Date().toISOString()
        }
      ],
      [] // 일부 전문가는 포트폴리오 파일이 없을 수도 있음
    ];

    // 소셜 링크 템플릿들
    const socialLinksTemplates = [
      {
        linkedin: 'https://linkedin.com/in/john-consultant',
        github: 'https://github.com/johnconsultant',
        twitter: 'https://twitter.com/johnconsult',
        instagram: '',
        facebook: '',
        youtube: ''
      },
      {
        linkedin: 'https://linkedin.com/in/tech-expert-kim',
        github: 'https://github.com/techexpert',
        twitter: '',
        instagram: 'https://instagram.com/techexpert_kim',
        facebook: 'https://facebook.com/techexpert.kim',
        youtube: ''
      },
      {
        linkedin: 'https://linkedin.com/in/business-advisor',
        github: '',
        twitter: 'https://twitter.com/bizadvisor',
        instagram: '',
        facebook: '',
        youtube: 'https://youtube.com/@businessadvisor'
      },
      {
        linkedin: 'https://linkedin.com/in/design-consultant',
        github: 'https://github.com/designconsultant',
        twitter: '',
        instagram: 'https://instagram.com/design_consultant',
        facebook: '',
        youtube: 'https://youtube.com/@designconsultant'
      },
      {
        linkedin: '',
        github: '',
        twitter: '',
        instagram: '',
        facebook: '',
        youtube: ''
      }, // 일부 전문가는 소셜 링크가 없을 수도 있음
      {
        linkedin: 'https://linkedin.com/in/marketing-pro',
        github: '',
        twitter: 'https://twitter.com/marketingpro',
        instagram: 'https://instagram.com/marketing_pro',
        facebook: 'https://facebook.com/marketingpro',
        youtube: 'https://youtube.com/@marketingpro'
      }
    ];

    let totalUpdated = 0;

    for (const expert of experts) {
      // 이미 포트폴리오 파일이나 소셜 링크가 설정되어 있는지 확인
      const hasPortfolioFiles = expert.portfolioFiles &&
        (Array.isArray(expert.portfolioFiles) ? expert.portfolioFiles.length > 0 :
         typeof expert.portfolioFiles === 'string' ? expert.portfolioFiles !== '[]' : false);

      const hasSocialLinks = expert.socialLinks &&
        (typeof expert.socialLinks === 'object' && Object.keys(expert.socialLinks).length > 0);

      if (hasPortfolioFiles && hasSocialLinks) {
        console.log(`⏭️  Expert ${expert.name} (ID: ${expert.id}) already has portfolio and social data`);
        continue;
      }

      // 전문가별로 랜덤한 템플릿 선택
      const portfolioTemplateIndex = expert.id % portfolioFileTemplates.length;
      const socialTemplateIndex = expert.id % socialLinksTemplates.length;

      const selectedPortfolioFiles = portfolioFileTemplates[portfolioTemplateIndex];
      const selectedSocialLinks = socialLinksTemplates[socialTemplateIndex];

      console.log(`📁 Adding data for ${expert.name}: ${selectedPortfolioFiles.length} files, ${Object.values(selectedSocialLinks).filter(v => v).length} social links`);

      try {
        await prisma.expert.update({
          where: { id: expert.id },
          data: {
            portfolioFiles: selectedPortfolioFiles,
            socialLinks: selectedSocialLinks
          }
        });
        totalUpdated++;
        console.log(`✅ Updated data for ${expert.name}`);
      } catch (error) {
        console.error(`❌ Failed to update Expert ${expert.id}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Portfolio and social data insertion completed!`);
    console.log(`👥 Total experts updated: ${totalUpdated}`);
    console.log(`👥 Experts already had data: ${experts.length - totalUpdated}`);

    // 결과 확인 - 몇 개 전문가 샘플 출력
    console.log(`\n📋 Sample data:`)
    const sampleExperts = await prisma.expert.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        portfolioFiles: true,
        socialLinks: true
      }
    });

    sampleExperts.forEach(expert => {
      const portfolioCount = Array.isArray(expert.portfolioFiles) ? expert.portfolioFiles.length : 0;
      const socialLinksCount = expert.socialLinks ? Object.values(expert.socialLinks).filter(v => v).length : 0;

      console.log(`\n👤 ${expert.name} (ID: ${expert.id}):`);
      console.log(`   📁 Portfolio files: ${portfolioCount}`);
      console.log(`   🔗 Social links: ${socialLinksCount}`);

      if (portfolioCount > 0) {
        console.log(`   Files: ${expert.portfolioFiles.map(f => f.name).join(', ')}`);
      }

      if (socialLinksCount > 0) {
        const activeSocialLinks = Object.entries(expert.socialLinks)
          .filter(([key, value]) => value)
          .map(([key, value]) => key);
        console.log(`   Social: ${activeSocialLinks.join(', ')}`);
      }
    });

  } catch (error) {
    console.error('❌ Error during portfolio and social data insertion:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  insertPortfolioAndSocialData()
    .then(() => {
      console.log('\n✨ All experts portfolio and social data insertion completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Portfolio and social data insertion failed:', error);
      process.exit(1);
    });
}

module.exports = { insertPortfolioAndSocialData };