'use client'

import { CheckCircle2, Clock, Circle } from 'lucide-react'

type ApplicationStage =
  | 'SUBMITTED'
  | 'DOCUMENT_REVIEW'
  | 'UNDER_REVIEW'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'REJECTED'

interface TimelineStep {
  stage: ApplicationStage
  label: string
  description: string
  estimatedDays: number
  status: 'completed' | 'current' | 'pending'
}

interface ApplicationTimelineProps {
  currentStage: ApplicationStage
  submittedAt: Date
}

export default function ApplicationTimeline({
  currentStage,
  submittedAt,
}: ApplicationTimelineProps) {
  const getStepStatus = (stepStage: ApplicationStage): 'completed' | 'current' | 'pending' => {
    const stageOrder: ApplicationStage[] = [
      'SUBMITTED',
      'DOCUMENT_REVIEW',
      'UNDER_REVIEW',
      'APPROVAL_PENDING',
    ]

    const currentIndex = stageOrder.indexOf(currentStage)
    const stepIndex = stageOrder.indexOf(stepStage)

    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'current'
    return 'pending'
  }

  const steps: TimelineStep[] = [
    {
      stage: 'SUBMITTED',
      label: '접수 완료',
      description: '신청서가 성공적으로 제출되었습니다',
      estimatedDays: 0,
      status: getStepStatus('SUBMITTED'),
    },
    {
      stage: 'DOCUMENT_REVIEW',
      label: '서류 검토',
      description: '제출하신 서류를 확인하고 있습니다',
      estimatedDays: 1,
      status: getStepStatus('DOCUMENT_REVIEW'),
    },
    {
      stage: 'UNDER_REVIEW',
      label: '심사 진행',
      description: '전문가 자격을 심사하고 있습니다',
      estimatedDays: 2,
      status: getStepStatus('UNDER_REVIEW'),
    },
    {
      stage: 'APPROVAL_PENDING',
      label: '최종 승인 대기',
      description: '최종 승인 단계입니다',
      estimatedDays: 1,
      status: getStepStatus('APPROVAL_PENDING'),
    },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
      <h2 className="text-xl font-bold text-gray-900 mb-5">진행 상황</h2>
      <div className="relative">
        {/* 타임라인 라인 */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200" />

        {/* 각 단계 */}
        {steps.map((step, index) => (
          <div key={step.stage} className="relative flex gap-4 mb-6 last:mb-0">
            {/* 아이콘 */}
            <div
              className={`
              relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all
              ${step.status === 'completed' ? 'bg-green-500' : ''}
              ${step.status === 'current' ? 'bg-blue-500 animate-pulse' : ''}
              ${step.status === 'pending' ? 'bg-gray-300' : ''}
            `}
            >
              {step.status === 'completed' && (
                <CheckCircle2 className="w-6 h-6 text-white" />
              )}
              {step.status === 'current' && (
                <Clock className="w-6 h-6 text-white" />
              )}
              {step.status === 'pending' && (
                <Circle className="w-6 h-6 text-gray-500" />
              )}
            </div>

            {/* 내용 */}
            <div className="flex-1 pt-1">
              <h3
                className={`font-semibold mb-1 ${
                  step.status === 'current' ? 'text-blue-600' : 'text-gray-900'
                }`}
              >
                {step.label}
              </h3>
              <p className="text-sm text-gray-600 mb-1.5">{step.description}</p>
              {step.status === 'current' && (
                <p className="text-xs text-blue-600 font-medium">
                  예상 소요: {step.estimatedDays}영업일
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
