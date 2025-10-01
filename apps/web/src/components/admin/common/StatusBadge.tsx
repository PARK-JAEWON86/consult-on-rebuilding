type Status = 'PENDING' | 'APPROVED' | 'REJECTED'

interface StatusBadgeProps {
  status: Status
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    PENDING: {
      label: '검토 중',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
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
