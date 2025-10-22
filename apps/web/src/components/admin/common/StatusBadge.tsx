type CurrentStage = 'SUBMITTED' | 'DOCUMENT_REVIEW' | 'UNDER_REVIEW' | 'APPROVAL_PENDING' | 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFO_REQUESTED'

interface StatusBadgeProps {
  currentStage: CurrentStage
}

export default function StatusBadge({ currentStage }: StatusBadgeProps) {
  const stageConfig = {
    SUBMITTED: {
      label: '접수 완료',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    DOCUMENT_REVIEW: {
      label: '서류 검토',
      className: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    UNDER_REVIEW: {
      label: '심사 진행',
      className: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    APPROVAL_PENDING: {
      label: '최종 승인 대기',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    APPROVED: {
      label: '승인됨',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    REJECTED: {
      label: '거절됨',
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    ADDITIONAL_INFO_REQUESTED: {
      label: '정보 요청됨',
      className: 'bg-orange-100 text-orange-800 border-orange-200'
    }
  }

  const { label, className } = stageConfig[currentStage]

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${className}`}>
      {label}
    </span>
  )
}
