import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">이용약관</h1>
          <p className="text-gray-600">최종 수정일: 2025년 9월 23일</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제1조 (목적)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              본 약관은 Consult-On(이하 "회사")이 제공하는 전문가 상담 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제2조 (정의)</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p><strong>1. "서비스"</strong>란 회사가 제공하는 온라인 전문가 상담 플랫폼을 의미합니다.</p>
              <p><strong>2. "이용자"</strong>란 본 약관에 따라 회사의 서비스를 받는 회원 및 비회원을 말합니다.</p>
              <p><strong>3. "회원"</strong>이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 회사의 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</p>
              <p><strong>4. "전문가"</strong>란 각 분야의 전문지식을 보유하고 회사의 심사를 통과하여 상담 서비스를 제공하는 자를 말합니다.</p>
              <p><strong>5. "상담"</strong>이란 회원과 전문가 간에 이루어지는 온라인 또는 오프라인 상담 서비스를 말합니다.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제3조 (약관의 효력 및 변경)</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>1. 본 약관은 회사가 제공하는 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</p>
              <p>2. 회사는 필요한 경우 관련법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며, 약관이 변경된 경우에는 지체없이 이를 공지합니다.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제4조 (회원가입)</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>1. 회원가입은 신청자가 온라인으로 회사에서 제공하는 소정의 양식에 개인정보를 기록하여 가입을 완료하는 것으로 성립됩니다.</p>
              <p>2. 회사는 다음 각 호에 해당하는 경우에 대해서는 회원가입을 거절하거나 사후에 회원자격을 상실시킬 수 있습니다:</p>
              <ul className="ml-4 space-y-1">
                <li>• 실명이 아니거나 타인의 명의를 이용한 경우</li>
                <li>• 허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</li>
                <li>• 미성년자가 법정대리인(부모 등)의 동의를 얻지 아니한 경우</li>
                <li>• 이용자의 귀책사유로 인하여 승인이 불가능하거나 기타 규정한 제반사항을 위반하며 신청하는 경우</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제5조 (서비스 이용)</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>1. 서비스 이용시간은 연중무휴 1일 24시간을 원칙으로 합니다. 다만, 서비스 점검 등의 필요로 회사가 정한 날이나 시간은 예외로 합니다.</p>
              <p>2. 회원은 서비스 이용료를 선결제하여야 서비스를 이용할 수 있습니다.</p>
              <p>3. 회사는 서비스를 일정범위로 분할하여 각 범위별로 이용가능시간을 별도로 지정할 수 있습니다.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제6조 (이용료 및 결제)</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사가 제공하는 서비스는 유료서비스와 무료서비스로 구분됩니다.</p>
              <p>2. 유료서비스의 이용료는 서비스별로 회사가 정하는 바에 따르며, 사전에 공지됩니다.</p>
              <p>3. 이용료의 결제는 신용카드, 계좌이체, 휴대폰 결제 등 회사가 제공하는 방법으로 할 수 있습니다.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제7조 (환불정책)</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>1. 서비스 이용 전: 결제 후 서비스 이용 전 취소 시 전액 환불됩니다.</p>
              <p>2. 서비스 이용 중: 이용한 시간에 비례하여 차감 후 환불됩니다.</p>
              <p>3. 전문가의 사유로 인한 취소: 전액 환불 및 추가 보상이 제공될 수 있습니다.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제8조 (개인정보보호)</h2>
            <p className="text-gray-700 leading-relaxed">
              회사는 관련법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다. 개인정보의 보호 및 사용에 대해서는 관련법령 및 회사의 개인정보처리방침이 적용됩니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제9조 (회사의 의무)</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 지속적이고 안정적으로 서비스를 제공하기 위하여 노력합니다.</p>
              <p>2. 회사는 이용자가 안전하게 서비스를 이용할 수 있도록 보안 시스템을 구축하며 개인정보 보호정책을 공시하고 준수합니다.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제10조 (회원의 의무)</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>회원은 다음 행위를 하여서는 안됩니다:</p>
              <ul className="ml-4 space-y-1">
                <li>• 신청 또는 변경 시 허위내용의 등록</li>
                <li>• 타인의 정보도용</li>
                <li>• 회사가 게시한 정보의 변경</li>
                <li>• 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                <li>• 회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                <li>• 회사와 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                <li>• 외설 또는 폭력적인 메시지, 화상, 음성 등을 공개 또는 게시하는 행위</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제11조 (서비스의 중단)</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</p>
              <p>2. 회사는 국가비상사태, 정전, 서비스 설비의 장애 또는 서비스 이용의 폭주 등으로 정상적인 서비스 이용에 지장이 있는 때에는 서비스의 전부 또는 일부를 제한하거나 정지할 수 있습니다.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제12조 (면책조항)</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
              <p>2. 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</p>
              <p>3. 회사는 전문가가 제공하는 상담 내용의 정확성, 신뢰성에 대해 보증하지 않으며, 상담 결과에 대한 책임을 지지 않습니다.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제13조 (분쟁해결)</h2>
            <div className="text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사와 회원은 서비스와 관련하여 발생한 분쟁을 원만하게 해결하기 위하여 필요한 모든 노력을 하여야 합니다.</p>
              <p>2. 제1항의 노력에도 불구하고 분쟁이 해결되지 아니하는 경우에는 민사소송법상의 관할법원에 소송을 제기할 수 있습니다.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">제14조 (준거법)</h2>
            <p className="text-gray-700 leading-relaxed">
              본 약관의 해석 및 회사와 회원 간의 분쟁에 대하여는 대한민국의 법을 적용합니다.
            </p>
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