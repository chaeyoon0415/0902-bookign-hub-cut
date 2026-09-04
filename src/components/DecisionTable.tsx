import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { decide, type Booking } from '../lib/decide';
import { Loader2, Inbox, ChevronDown, ChevronUp } from 'lucide-react';

interface BookingDisplay extends Booking {
  reason?: string;
  options?: string;
  candidate?: string;
  trace?: string;
  service?: string;
}

export const DecisionTable = ({
  refreshKey,
  onDecisionChange,
}: {
  refreshKey: number;
  onDecisionChange: () => void;
}) => {
  const [bookings, setBookings] = useState<BookingDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .or('decision.in.(pending,review,rejected,asking),decision.is.null');

      if (error) {
        console.error('Error fetching bookings:', error);
      } else {
        const bookingsData = (data || []) as BookingDisplay[];

        // decision이 없는 예약에 대해 자동 판정 수행
        for (const booking of bookingsData) {
          if (!booking.decision) {
            const result = decide(booking, bookingsData, false);
            const traceStr = result.trace.join('\n');

            await supabase
              .from('bookings')
              .update({
                decision: result.decision,
                reason: result.reason,
                candidate: result.candidate,
                options: result.options,
                trace: traceStr,
              })
              .eq('id', booking.id);
          }
        }

        setBookings(bookingsData);
      }
      setLoading(false);
    };

    fetchBookings();
  }, [refreshKey]);

  const getDecisionBadgeColor = (decision?: string | null) => {
    switch (decision) {
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'confirmed_auto':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'confirmed_human':
        return 'bg-emerald-50 text-emerald-800 border-2 border-emerald-500';
      case 'review':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'asking':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case null:
      case undefined:
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getDecisionLabel = (decision?: string | null) => {
    switch (decision) {
      case 'pending':
        return '대기';
      case 'confirmed_auto':
        return '확정-자동';
      case 'confirmed_human':
        return '확정-수동';
      case 'review':
        return '검토';
      case 'rejected':
        return '거절';
      case 'asking':
        return '질문';
      case null:
      case undefined:
        return '대기';
      default:
        return decision || '-';
    }
  };

  const handleConfirm = async (bookingId: number, candidate?: string) => {
    if (!candidate) return;

    const { error } = await supabase
      .from('bookings')
      .update({
        decision: 'confirmed_human',
        slot_assigned: candidate,
      })
      .eq('id', bookingId);

    if (!error) {
      onDecisionChange();
    }
  };

  const handleReviewDecision = async (bookingId: number, winnerCustomer: string) => {
    const currentBooking = bookings.find((b) => b.id === bookingId);
    if (!currentBooking) return;

    const loserCustomer =
      currentBooking.options
        ?.split(',')
        .find((c) => c.trim() !== winnerCustomer.trim()) || '';

    const loserBooking = bookings.find(
      (b) => b.customer === loserCustomer && b.decision === 'review'
    );

    if (currentBooking.customer === winnerCustomer) {
      await supabase
        .from('bookings')
        .update({
          decision: 'confirmed_human',
        })
        .eq('id', bookingId);
    } else {
      await supabase
        .from('bookings')
        .update({
          decision: 'pending',
        })
        .eq('id', bookingId);
    }

    if (loserBooking) {
      if (loserBooking.customer === winnerCustomer) {
        await supabase
          .from('bookings')
          .update({
            decision: 'confirmed_human',
          })
          .eq('id', loserBooking.id);
      } else {
        await supabase
          .from('bookings')
          .update({
            decision: 'pending',
          })
          .eq('id', loserBooking.id);
      }
    }

    onDecisionChange();
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-sm font-medium">예약 정보를 불러오는 중...</span>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-16 text-center flex flex-col items-center justify-center gap-4">
        <Inbox className="w-12 h-12 text-slate-300" />
        <div className="space-y-2">
          <p className="text-lg font-semibold text-slate-900">모든 예약이 확정되었어요!</p>
          <p className="text-base text-slate-600">미확정 예약이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-5 sm:p-6 w-full space-y-3 transition-shadow hover:shadow-md"
        >
          {/* 카드 첫 줄: [고객사명] [decision 배지]                       [과정 보기] */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-base font-bold text-slate-900">{booking.customer}</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getDecisionBadgeColor(
                  booking.decision
                )}`}
              >
                {getDecisionLabel(booking.decision)}
              </span>
            </div>

            {booking.trace && (
              <button
                onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <span>과정 보기</span>
                {expandedId === booking.id ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* 둘째 줄: reason */}
          {booking.reason && (
            <p className="text-sm text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
              {booking.reason}
            </p>
          )}

          {/* pending + candidate가 있으면 reason 아래에 '확정' 버튼 */}
          {booking.decision === 'pending' && booking.candidate && (
            <div className="pt-1">
              <button
                onClick={() => handleConfirm(booking.id, booking.candidate)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                확정
              </button>
            </div>
          )}

          {/* review는 options를 목록으로 보여주고 각 고객사 옆에 '이 쪽으로 확정' 버튼 */}
          {booking.decision === 'review' && booking.options && (
            <div className="pt-2 space-y-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500">후보 옵션 목록:</p>
              <div className="flex flex-col gap-2">
                {booking.options.split(',').map((customerStr) => {
                  const trimmed = customerStr.trim();
                  if (!trimmed) return null;
                  return (
                    <div
                      key={trimmed}
                      className="flex items-center justify-between bg-amber-50/70 border border-amber-200/80 p-3 rounded-lg text-xs gap-3"
                    >
                      <span className="font-semibold text-slate-800">{trimmed}</span>
                      <button
                        onClick={() => handleReviewDecision(booking.id, trimmed)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap shadow-sm cursor-pointer"
                      >
                        이 쪽으로 확정
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 과정 보기 접이식 영역 (trace) */}
          {expandedId === booking.id && booking.trace && (
            <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/80 p-4 rounded-lg space-y-2">
              <p className="text-xs font-bold text-slate-700">판정 과정:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
                {booking.trace
                  .split('\n')
                  .filter((line) => line.trim() !== '')
                  .map((line, idx) => (
                    <li key={idx} className="leading-relaxed break-words">
                      {line}
                    </li>
                  ))}
              </ol>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
