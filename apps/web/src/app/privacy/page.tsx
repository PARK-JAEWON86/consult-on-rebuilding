import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">개인정보처리방침</h1>
          <p className="text-gray-600">최종 수정일: 2025년 9월 23일</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. 개인정보의 처리목적</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>Consult-On(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
              <ul className="ml-4 space-y-2">
                <li><strong>가. 서비스 제공</strong>
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>• 회원제 서비스 이용에 따른 본인확인, 개인식별</li>
                    <li>• 전문가 상담 서비스 제공</li>
                    <li>• 결제 및 정산 서비스 제공</li>
                    <li>• 고객센터 운영</li>
                  </ul>
                </li>
                <li><strong>나. 마케팅 및 광고에의 활용</strong>
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>• 신규 서비스(제품) 개발 및 특화</li>
                    <li>• 이벤트 및 광고성 정보 제공 및 참여기회 제공</li>
                    <li>• 서비스의 유효성 확인</li>
                    <li>• 접속빈도 파악 또는 회원의 서비스 이용에 대한 통계</li>
                  </ul>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. 개인정보의 처리 및 보유기간</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
              <p>② 구체적인 개인정보 처리 및 보유 기간은 다음과 같습니다.</p>
              <ul className="ml-4 space-y-2">
                <li><strong>회원정보</strong>: 회원탈퇴 후 즉시 삭제 (단, 관계법령에 따라 보존이 필요한 경우 해당 기간동안 보관)</li>
                <li><strong>결제정보</strong>: 결제 완료 후 5년</li>
                <li><strong>상담기록</strong>: 상담 종료 후 1년</li>
                <li><strong>접속기록</strong>: 3개월</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. 처리하는 개인정보의 항목</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>① 회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
              <ul className="ml-4 space-y-2">
                <li><strong>필수항목</strong>: 이름, 이메일주소, 휴대폰번호</li>
                <li><strong>선택항목</strong>: 성별, 연령대, 관심분야</li>
                <li><strong>자동수집항목</strong>: IP주소, 쿠키, MAC주소, 서비스 이용기록, 방문기록, 불량 이용기록 등</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. 개인정보의 제3자 제공</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>① 회사는 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
              <p>② 회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다.</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>결제대행업체</strong></p>
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• 제공받는 자: 토스페이먼츠, KG이니시스</li>
                  <li>• 제공목적: 결제 및 정산 서비스</li>
                  <li>• 제공항목: 이름, 결제정보</li>
                  <li>• 보유 및 이용기간: 결제 완료 후 5년</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. 개인정보처리의 위탁</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>클라우드 서비스</strong></p>
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• 위탁받는 자: Amazon Web Services</li>
                  <li>• 위탁하는 업무의 내용: 서버 호스팅 및 데이터 저장</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p><strong>고객센터 운영</strong></p>
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• 위탁받는 자: 자사 운영</li>
                  <li>• 위탁하는 업무의 내용: 고객 문의 응답 및 상담</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. 정보주체의 권리·의무 및 행사방법</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
              <ul className="ml-4 space-y-1">
                <li>• 개인정보 처리현황 통지요구</li>
                <li>• 개인정보 처리정지 요구</li>
                <li>• 개인정보의 수정·삭제 요구</li>
                <li>• 손해배상 청구</li>
              </ul>
              <p>② 제1항에 따른 권리 행사는 회사에 대해 「개인정보 보호법」 시행령 제41조제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. 개인정보의 파기</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
              <p>② 개인정보 파기의 절차 및 방법은 다음과 같습니다.</p>
              <ul className="ml-4 space-y-2">
                <li><strong>파기절차</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</li>
                  </ul>
                </li>
                <li><strong>파기방법</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
                    <li>• 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
                  </ul>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. 개인정보의 안전성 확보조치</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
              <ul className="ml-4 space-y-1">
                <li>• 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
                <li>• 기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                <li>• 물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. 개인정보 보호책임자</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>① 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p><strong>개인정보 보호책임자</strong></p>
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• 성명: Consult-On 개인정보보호팀</li>
                  <li>• 이메일: privacy@consult-on.co.kr</li>
                  <li>• 전화: 1588-0000</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. 개인정보 처리방침의 변경</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>① 이 개인정보처리방침은 2025년 9월 23일부터 적용됩니다.</p>
              <p>② 이전의 개인정보처리방침은 아래에서 확인하실 수 있습니다.</p>
              <ul className="ml-4 space-y-1">
                <li>• 2025년 9월 23일 ~ 현재: 현재 방침</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. 쿠키의 사용</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>① 회사는 서비스 제공을 위해 쿠키를 사용합니다.</p>
              <p>② 쿠키의 사용 목적:</p>
              <ul className="ml-4 space-y-1">
                <li>• 로그인 상태 유지</li>
                <li>• 개인화된 서비스 제공</li>
                <li>• 웹사이트 분석 및 개선</li>
              </ul>
              <p>③ 쿠키 설치·운영 및 거부: 웹브라우저 상단의 도구 &gt; 인터넷 옵션 &gt; 개인정보 메뉴의 옵션 설정을 통해 쿠키 저장을 거부할 수 있습니다.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. 아동의 개인정보 보호</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>① 회사는 만 14세 미만 아동의 개인정보 수집 시 법정대리인의 동의를 받고 있습니다.</p>
              <p>② 법정대리인은 아동의 개인정보에 대한 열람, 정정·삭제, 처리정지를 요구할 수 있습니다.</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← 로그인으로 돌아가기
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              홈으로 가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}