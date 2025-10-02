type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFO_REQUESTED'

interface StatusBadgeProps {
  status: Status
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    PENDING: {
      label: '검토 중',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    ADDITIONAL_INFO_REQUESTED: {
      label: '정보 요청됨',
      className: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    APPROVED: {
      label: '승인됨',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    REJECTED: {
      label: '거절됨',
      className: 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const { label, className } = config[status]

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${className}`}>
      {label}
    </span>
  )
}
