import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Clock, CheckCircle2, AlertCircle, Loader2, Inbox } from 'lucide-react';

interface Booking {
  id: number;
  customer: string;
  service: string;
  date: string;
  time: string;
  address: string;
  status: string;
}

export const BookingTable = ({ refreshKey }: { refreshKey: number }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*');

      if (error) {
        console.error('Error fetching bookings:', error);
      } else {
        setBookings(data || []);
      }
      setLoading(false);
    };

    fetchBookings();
  }, [refreshKey]);

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'confirmed' : 'pending';
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
    } else {
      setBookings(bookings.map(b =>
        b.id === id ? { ...b, status: newStatus } : b
      ));
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200/80 rounded-xl p-12 text-center text-gray-500 shadow-sm flex flex-col items-center justify-center gap-3">
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
          <p className="text-lg font-semibold text-slate-900">오늘도 좋은 하루예요!</p>
          <p className="text-base text-slate-600">아직 등록된 예약이 없어요.</p>
          <p className="text-sm text-slate-500">지금 바로 새로운 예약을 추가해보세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200/80 text-xs uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4 font-semibold">고객사</th>
              <th className="py-3.5 px-4 font-semibold">서비스</th>
              <th className="py-3.5 px-4 font-semibold">날짜</th>
              <th className="py-3.5 px-4 font-semibold">시간</th>
              <th className="py-3.5 px-4 font-semibold">주소</th>
              <th className="py-3.5 px-4 font-semibold text-center">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-gray-900">{booking.customer}</td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                    {booking.service}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">{booking.date}</td>
                <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {booking.time}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  {booking.address ? (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(booking.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium hover:underline group transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="truncate max-w-xs">{booking.address}</span>
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => toggleStatus(booking.id, booking.status)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                      booking.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100 shadow-2xs'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100 shadow-2xs'
                    }`}
                  >
                    {booking.status === 'pending' ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span>대기</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>확정</span>
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

