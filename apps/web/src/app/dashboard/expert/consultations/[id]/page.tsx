"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale/ko";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  User,
  Video,
  MessageCircle,
  Phone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
} from "lucide-react";
import { convertIdToConsultationNumber } from '@/utils/consultationNumber';

type DetailItem = {
  id: number;
  consultationNumber?: string; // 바코드 형식 상담번호
  date: string;
  customer: string;
  topic: string;
  amount: number;
  status: "completed" | "scheduled" | "canceled";
  specialty?: string; // 상담 분야
  method?: "chat" | "video" | "voice" | "call";
  duration?: number;
  summary?: string;
  notes?: string;
  issue?: {
    type: "refund" | "quality" | "other";
    reason: string;
    createdAt: string;
    status: "open" | "resolved" | "rejected";
  };
};

function formatCredits(amount: number) {
  return `${amount.toLocaleString()} 크레딧`;
}

function getMethodLabel(method?: string) {
  if (!method) return "-";
  if (method === "video") return "화상 상담";
  if (method === "chat") return "채팅 상담";
  if (method === "voice" || method === "call") return "음성 상담";
  return method;
}

function hasCustomerLeftReview(customerName: string, expertId: number = 1) {
  return false;
}

function getCustomerReview(customerName: string, expertId: number = 1) {
  return null;
}

export default function ExpertConsultationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [items, setItems] = useState<DetailItem[]>([]);

  useEffect(() => {
    const loadConsultations = async () => {
      try {
        const response = await fetch('/api/consultations');
        const result = await response.json();
        if (result.success) {
          const consultationData = result.data.items || [];
          setItems(consultationData.map((it: any) => ({
            id: it.id,
            consultationNumber: it.consultationNumber,
            date: it.date,
            customer: it.customer,
            topic: it.topic,
            amount: it.amount,
            status: it.status,
            specialty: it.specialty,
            method: it.method,
            duration: it.duration,
            summary: it.summary,
            notes: it.notes,
          })));
        }
      } catch (error) {
        console.error('상담 기록 로드 실패:', error);
        // API 실패시 더미 데이터 사용
        const dummyData: DetailItem[] = [
          {
            id: 1,
            consultationNumber: convertIdToConsultationNumber(1, '2025-09-18T10:00:00Z', '심리상담'),
            date: '2025-09-18T10:00:00Z',
            customer: '김고객',
            topic: '스트레스 관리 상담',
            amount: 500,
            status: 'completed',
            specialty: '심리상담',
            method: 'video',
            duration: 60,
            summary: '고객은 현재 높은 수준의 업무 스트레스를 경험하고 있으며, 이로 인한 수면 장애를 호소함. 인지행동치료 기법을 적용하여 스트레스 관리 전략을 제시함.',
            notes: '고객과의 후속 상담을 2주 후로 예약. 명상 앱 다운로드 및 운동 일지 작성을 권장함.'
          },
          {
            id: 2,
            consultationNumber: convertIdToConsultationNumber(2, '2025-09-19T14:00:00Z', '법률상담'),
            date: '2025-09-19T14:00:00Z',
            customer: '박고객',
            topic: '부동산 계약 관련 상담',
            amount: 750,
            status: 'completed',
            specialty: '법률상담',
            method: 'chat',
            duration: 90,
            summary: '부동산 매매계약서의 특약사항 검토 및 중도금 대출 조건에 대한 법적 자문 제공.',
            notes: '계약서 수정사항 전달 완료. 은행 대출 상담 예약 안내함.'
          }
        ];
        setItems(dummyData);
      }
    };

    loadConsultations();
  }, []);

  const updateById = async (id: number, updates: Partial<DetailItem>) => {
    try {
      const response = await fetch('/api/consultations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
      const result = await response.json();
      if (result.success) {
        setItems(prev => prev.map(item =>
          item.id === id ? { ...item, ...updates } : item
        ));
      }
    } catch (error) {
      console.error('상담 업데이트 실패:', error);
    }
  };

  const id = Number(params?.id);

  const customerHasReview = useMemo(() => {
    const consultation = items.find(c => c.id === id);
    if (!consultation) return false;
    return hasCustomerLeftReview(consultation.customer);
  }, [id, items]);

  const customerReview = useMemo(() => {
    const consultation = items.find(c => c.id === id);
    if (!consultation) return null;
    return getCustomerReview(consultation.customer);
  }, [id, items]);

  const record: DetailItem | undefined = useMemo(() => {
    return items.find((it) => it.id === id);
  }, [items, id]);

  if (!record) {
    return (
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-700 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> 뒤로가기
        </button>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-600">
          해당 상담 내역을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const StatusBadge = () => {
    const base =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    if (record.status === "completed")
      return (
        <span className={`${base} bg-green-100 text-green-800`}>완료</span>
      );
    if (record.status === "scheduled")
      return (
        <span className={`${base} bg-blue-100 text-blue-800`}>예약됨</span>
      );
    return <span className={`${base} bg-gray-100 text-gray-800`}>취소됨</span>;
  };

  const MethodIcon = () => {
    if (record.method === "video")
      return <Video className="h-4 w-4 mr-2 text-gray-400" />;
    if (record.method === "chat")
      return <MessageCircle className="h-4 w-4 mr-2 text-gray-400" />;
    if (record.method === "voice" || record.method === "call")
      return <Phone className="h-4 w-4 mr-2 text-gray-400" />;
    return <FileText className="h-4 w-4 mr-2 text-gray-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center text-gray-700 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> 뒤로가기
      </button>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">상담 상세</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded border">
                {record.consultationNumber || `#${record.id}`}
              </div>
              {record.specialty && (
                <span className="text-sm text-gray-600">{record.specialty}</span>
              )}
            </div>
          </div>
          <StatusBadge />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="p-6 border-b md:border-b-0 md:border-r">
            <div className="text-xs text-gray-500 mb-1">고객</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-900">
                <User className="h-4 w-4 mr-2 text-gray-400" />{" "}
                {record.customer}
                {customerHasReview && (
                  <div className="ml-2 flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="ml-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      리뷰 작성함
                    </span>
                  </div>
                )}
              </div>
              {customerHasReview && (
                <div className="inline-flex items-center px-2 py-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
                  <Star className="h-3 w-3 mr-1" />
                  리뷰 있음
                </div>
              )}
            </div>
          </div>
          <div className="p-6 border-b">
            <div className="text-xs text-gray-500 mb-1">상담 일자</div>
            <div className="flex items-center text-gray-900">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              {format(new Date(record.date), "PPP p", { locale: ko })}
            </div>
          </div>
          <div className="p-6 border-b md:border-b-0 md:border-r">
            <div className="text-xs text-gray-500 mb-1">상담 방법</div>
            <div className="flex items-center text-gray-900">
              <MethodIcon /> {getMethodLabel(record.method)}
            </div>
          </div>
          <div className="p-6 border-b">
            <div className="text-xs text-gray-500 mb-1">상담 시간</div>
            <div className="text-gray-900">
              {record.duration ? `${record.duration}분` : "-"}
            </div>
          </div>
          <div className="p-6 border-b md:border-b-0 md:border-r">
            <div className="text-xs text-gray-500 mb-1">정산 크레딧</div>
            <div className="flex items-center text-gray-900">
              <CreditCard className="h-4 w-4 mr-2 text-gray-400" />{" "}
              {formatCredits(record.amount)}
            </div>
          </div>
          <div className="p-6 border-b md:border-b-0 md:border-r">
            <div className="text-xs text-gray-500 mb-1">상담번호</div>
            <div className="font-mono text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200 text-blue-800">
              {record.consultationNumber || `#${record.id}`}
            </div>
          </div>
          <div className="p-6">
            <div className="text-xs text-gray-500 mb-1">상담 주제</div>
            <div className="flex items-center text-gray-900">
              <FileText className="h-4 w-4 mr-2 text-gray-400" />{" "}
              {record.topic}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          상담 요약
        </h2>
        <div className="text-sm text-gray-700 whitespace-pre-line">
          {record.summary || "상담 요약 정보가 아직 등록되지 않았습니다."}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">전문가 노트</h2>
          <button
            onClick={() => {
              const area = document.getElementById(
                "expert-notes"
              ) as HTMLTextAreaElement | null;
              const next = area?.value ?? "";
              updateById(id, { notes: next });
              alert("노트가 저장되었습니다.");
            }}
            className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            저장
          </button>
        </div>
        <textarea
          id="expert-notes"
          defaultValue={record.notes ?? ""}
          placeholder="상담 중 메모, 후속조치, 고객과의 합의사항 등을 기록하세요"
          className="w-full min-h-32 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">환불/이슈</h2>
          <div className="flex gap-2">
            {record.issue?.type === "refund" &&
            record.issue.status === "open" ? (
              <>
                <button
                  onClick={() => {
                    updateById(id, {
                      issue: {
                        ...(record.issue as any),
                        status: "resolved",
                      },
                    });
                    alert("환불이 승인되었습니다.");
                  }}
                  className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm text-green-700 border-green-300 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> 환불 승인
                </button>
                <button
                  onClick={() => {
                    const reason = prompt("거절 사유를 입력해주세요.") ?? "";
                    updateById(id, {
                      issue: {
                        ...(record.issue as any),
                        status: "rejected",
                        reason: reason || (record.issue?.reason ?? ""),
                      },
                    });
                    alert("환불이 거절되었습니다.");
                  }}
                  className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm text-red-700 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" /> 환불 거절
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  const reason = prompt("이슈 내용을 입력해주세요.");
                  if (!reason) return;
                  updateById(id, {
                    issue: {
                      type: "quality",
                      reason,
                      createdAt: new Date().toISOString(),
                      status: "open",
                    },
                  });
                  alert("이슈가 등록되었습니다.");
                }}
                className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                <AlertTriangle className="h-4 w-4 mr-1" /> 이슈 등록
              </button>
            )}
          </div>
        </div>

        {record.issue && (
          <div className="mt-4 border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-900">등록된 이슈</div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  record.issue.status === "open"
                    ? "bg-amber-100 text-amber-800"
                    : record.issue.status === "resolved"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {record.issue.status}
              </span>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-line mb-2">
              {record.issue.reason}
            </div>
            <div className="text-xs text-gray-500">
              등록일:{" "}
              {format(new Date(record.issue.createdAt), "PPP p", {
                locale: ko,
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}