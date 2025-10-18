'use client'

import React, { useEffect } from 'react'
import { FileCheck2, ShieldCheck } from 'lucide-react'

interface Step4TermsProps {
  agreeService: boolean
  onAgreeServiceChange: (value: boolean) => void
  agreePrivacy: boolean
  onAgreePrivacyChange: (value: boolean) => void
  onPrevious: () => void
  onNext: () => void
  canGoNext: boolean
}

export default function Step4Terms({
  agreeService,
  onAgreeServiceChange,
  agreePrivacy,
  onAgreePrivacyChange,
  onPrevious,
  onNext,
  canGoNext,
}: Step4TermsProps) {
  return (
    <div className="space-y-6">
      {/* 서비스 약관 */}
      <div className="rounded-lg border-2 border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <FileCheck2 className="w-4 h-4 mr-2" /> 서비스 이용약관
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto border border-gray-200">
          <div className="text-sm text-gray-700 leading-relaxed space-y-4">
            <div>
              <strong className="text-gray-900">제1조 (목적)</strong><br />
              본 약관은 Consult-On(이하 "회사")이 제공하는 전문가 상담 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </div>

            <div>
              <strong className="text-gray-900">제2조 (정의)</strong><br />
              1. "서비스"란 회사가 제공하는 온라인 전문가 상담 플랫폼을 의미합니다.<br />
              2. "이용자"란 본 약관에 따라 회사의 서비스를 받는 회원 및 비회원을 말합니다.<br />
              3. "전문가"란 각 분야의 전문지식을 보유하고 회사의 심사를 통과하여 상담 서비스를 제공하는 자를 말합니다.<br />
              4. "상담"이란 회원과 전문가 간에 이루어지는 온라인 상담 서비스를 말합니다.
            </div>

            <div>
              <strong className="text-gray-900">제4조 (회원가입)</strong><br />
              1. 회원가입은 신청자가 온라인으로 회사에서 제공하는 소정의 양식에 개인정보를 기록하여 가입을 완료하는 것으로 성립됩니다.<br />
              2. 회사는 허위정보 기재, 타인 명의 이용, 미성년자의 법정대리인 동의 누락 등의 경우 회원가입을 거절하거나 사후에 회원자격을 상실시킬 수 있습니다.
            </div>

            <div>
              <strong className="text-gray-900">제10조 (회원의 의무)</strong><br />
              회원은 다음 행위를 하여서는 안됩니다:<br />
              • 신청 또는 변경 시 허위내용의 등록<br />
              • 타인의 정보도용<br />
              • 회사가 게시한 정보의 변경<br />
              • 회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해<br />
              • 회사와 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위<br />
              • 외설 또는 폭력적인 메시지, 화상, 음성 등을 공개 또는 게시하는 행위
            </div>

            <div>
              <strong className="text-gray-900">제7조 (환불정책)</strong><br />
              1. 서비스 이용 전: 결제 후 서비스 이용 전 취소 시 전액 환불됩니다.<br />
              2. 서비스 이용 중: 이용한 시간에 비례하여 차감 후 환불됩니다.<br />
              3. 전문가의 사유로 인한 취소: 전액 환불 및 추가 보상이 제공될 수 있습니다.
            </div>

            <div>
              <strong className="text-gray-900">제9조 (회사의 의무)</strong><br />
              1. 회사는 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 지속적이고 안정적으로 서비스를 제공하기 위하여 노력합니다.<br />
              2. 회사는 이용자가 안전하게 서비스를 이용할 수 있도록 보안 시스템을 구축하며 개인정보 보호정책을 공시하고 준수합니다.
            </div>

            <div>
              <strong className="text-gray-900">제12조 (면책조항)</strong><br />
              1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.<br />
              2. 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.<br />
              3. 회사는 전문가가 제공하는 상담 내용의 정확성, 신뢰성에 대해 보증하지 않으며, 상담 결과에 대한 책임을 지지 않습니다.
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="agreeService"
            checked={agreeService}
            onChange={(e) => onAgreeServiceChange(e.target.checked)}
            className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="agreeService" className="text-sm text-gray-700 cursor-pointer flex-1">
            <span className="font-medium">
              서비스 이용약관에 동의합니다 <span className="text-red-500">*</span>
            </span>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:underline"
            >
              전체 내용 보기
            </a>
          </label>
        </div>
      </div>

      {/* 개인정보 처리방침 */}
      <div className="rounded-lg border-2 border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <ShieldCheck className="w-4 h-4 mr-2" /> 개인정보처리방침
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto border border-gray-200">
          <div className="text-sm text-gray-700 leading-relaxed space-y-4">
            <div>
              <strong className="text-gray-900">1. 개인정보의 처리목적</strong><br />
              Consult-On(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다:<br />
              • 회원제 서비스 이용에 따른 본인확인, 개인식별<br />
              • 전문가 상담 서비스 제공<br />
              • 결제 및 정산 서비스 제공<br />
              • 고객센터 운영<br />
              • 신규 서비스 개발 및 마케팅
            </div>

            <div>
              <strong className="text-gray-900">2. 개인정보의 처리 및 보유기간</strong><br />
              회사는 법령에 따른 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다:<br />
              • 회원정보: 회원탈퇴 후 즉시 삭제 (단, 관계법령에 따라 보존이 필요한 경우 해당 기간동안 보관)<br />
              • 결제정보: 결제 완료 후 5년<br />
              • 상담기록: 상담 종료 후 1년<br />
              • 접속기록: 3개월
            </div>

            <div>
              <strong className="text-gray-900">3. 처리하는 개인정보의 항목</strong><br />
              회사는 다음의 개인정보 항목을 처리하고 있습니다:<br />
              • 필수항목: 이름, 이메일주소, 휴대폰번호<br />
              • 선택항목: 성별, 연령대, 관심분야<br />
              • 자동수집항목: IP주소, 쿠키, 서비스 이용기록, 방문기록 등
            </div>

            <div>
              <strong className="text-gray-900">4. 개인정보의 제3자 제공</strong><br />
              회사는 정보주체의 동의, 법률의 특별한 규정 등이 있는 경우에만 개인정보를 제3자에게 제공합니다.<br />
              • 결제대행업체(토스페이먼츠, KG이니시스): 결제 및 정산 서비스<br />
              • 제공항목: 이름, 결제정보<br />
              • 보유 및 이용기간: 결제 완료 후 5년
            </div>

            <div>
              <strong className="text-gray-900">6. 정보주체의 권리·의무 및 행사방법</strong><br />
              정보주체는 회사에 대해 언제든지 다음의 권리를 행사할 수 있습니다:<br />
              • 개인정보 처리현황 통지요구<br />
              • 개인정보 처리정지 요구<br />
              • 개인정보의 수정·삭제 요구<br />
              • 손해배상 청구
            </div>

            <div>
              <strong className="text-gray-900">5. 개인정보처리의 위탁</strong><br />
              회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:<br />
              • 클라우드 서비스: Amazon Web Services (서버 호스팅 및 데이터 저장)
            </div>

            <div>
              <strong className="text-gray-900">7. 개인정보의 파기</strong><br />
              회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.<br />
              • 전자적 파일: 기록을 재생할 수 없는 기술적 방법 사용<br />
              • 종이 문서: 분쇄기로 분쇄하거나 소각
            </div>

            <div>
              <strong className="text-gray-900">8. 개인정보의 안전성 확보조치</strong><br />
              회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:<br />
              • 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육<br />
              • 기술적 조치: 접근권한 관리, 접근통제시스템 설치, 암호화, 보안프로그램 설치<br />
              • 물리적 조치: 전산실, 자료보관실 등의 접근통제
            </div>

            <div>
              <strong className="text-gray-900">9. 개인정보 보호책임자</strong><br />
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제를 위하여 개인정보 보호책임자를 지정하고 있습니다.<br />
              • 개인정보보호책임자: 박재원<br />
              • 이메일: consult.on.official@gmail.com
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="agreePrivacy"
            checked={agreePrivacy}
            onChange={(e) => onAgreePrivacyChange(e.target.checked)}
            className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="agreePrivacy" className="text-sm text-gray-700 cursor-pointer flex-1">
            <span className="font-medium">
              개인정보처리방침에 동의합니다 <span className="text-red-500">*</span>
            </span>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:underline"
            >
              전체 내용 보기
            </a>
          </label>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          이전
        </button>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`px-5 py-2 rounded-lg text-white font-medium ${canGoNext ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
        >
          다음
        </button>
      </div>
    </div>
  )
}
