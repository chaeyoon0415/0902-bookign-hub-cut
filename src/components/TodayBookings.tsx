import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, AlertCircle, PlusCircle, CalendarDays } from 'lucide-react';

interface Booking {
  id: number;
  customer: string;
  service: string;
  address: string;
  status: string;
  time: string;
}

const GRID_COLS = 'grid-cols-[25%_15%_15%_25%_20%]';

export const TodayBookings = ({ refreshKey, onAddClick }: { refreshKey: number; onAddClick: () => void }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayBookings = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('bookings')
        .select('id, customer, service, address, status, time')
        .eq('date', today)
        .order('time', { ascending: true });

      if (error) {
        console.error('Error fetching today bookings:', error);
      } else {
        setBookings(data || []);
      }
      setLoading(false);
    };

    fetchTodayBookings();
  }, [refreshKey]);

  const todayDate = new Date();
  const dateStr = todayDate.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.').slice(0, -1);
  const dayName = ['일', '월', '화', '수', '목', '금', '토'][todayDate.getDay()];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">오늘의 예약 현황</h3>
            <p className="text-sm text-slate-500 mt-0.5">오늘 등록된 예약 목록입니다.</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl border border-slate-200 transition-colors">
          {dateStr} ({dayName})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 px-6">
          <p className="text-sm">로딩 중...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 px-6">
          <p className="text-sm text-slate-600 mb-4">오늘 예정된 예약이 없어요.</p>
          <button
            onClick={onAddClick}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer mx-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ 예약 추가하기</span>
          </button>
        </div>
      ) : (
        <>
          {/* 헤더 */}
          <div className={`grid ${GRID_COLS} gap-0 bg-slate-50/80 border-b border-slate-200/80`}>
            <div className="px-6 py-4 text-left font-bold text-slate-700 text-base">시간</div>
            <div className="px-6 py-4 text-left font-bold text-slate-700 text-base">고객사</div>
            <div className="px-6 py-4 text-left font-bold text-slate-700 text-base">메모</div>
            <div className="px-6 py-4 text-left font-bold text-slate-700 text-base">주소</div>
            <div className="px-6 py-4 text-left font-bold text-slate-700 text-base">상태</div>
          </div>

          {/* 데이터 행 */}
          <div className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <div key={booking.id} className={`grid ${GRID_COLS} gap-0 hover:bg-slate-50/50 transition-colors`}>
                <div className="px-6 py-5 flex items-center text-slate-700 text-sm font-medium break-words whitespace-pre-wrap">
                  {booking.time}
                </div>
                <div className="px-6 py-5 flex items-center text-slate-600 text-base truncate">
                  {booking.customer}
                </div>
                <div className="px-6 py-5 flex items-center text-slate-600 text-base truncate">
                  {booking.service}
                </div>
                <div className="px-6 py-5 flex items-center text-slate-600 text-base truncate">
                  {booking.address || '-'}
                </div>
                <div className="px-6 py-5 flex items-center">
                  {booking.status === 'confirmed' ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-sm font-semibold whitespace-nowrap">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>확정</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-sm font-semibold whitespace-nowrap">
                      <AlertCircle className="w-4 h-4" />
                      <span>대기</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 하단 버튼 */}
          <div className="px-6 py-6">
            <button
              onClick={onAddClick}
              className="w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
              style={{ height: '56px' }}
            >
              <PlusCircle className="w-5 h-5" />
              <span>＋ 예약 추가하기</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
