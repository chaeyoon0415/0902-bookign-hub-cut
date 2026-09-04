import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Booking {
  id: number;
  customer: string;
  date: string;
  kind?: string;
  form?: string;
  service: string;
  decision?: string;
  reason?: string;
  options?: string;
}

interface StatusColumn {
  id: string;
  label: string;
  bgColor: string;
  bookings: Booking[];
}

export const StatusBoard = () => {
  const [columns, setColumns] = useState<StatusColumn[]>([
    { id: 'pending', label: '대기', bgColor: 'bg-gray-50', bookings: [] },
    { id: 'confirmed_auto', label: '확정-자동', bgColor: 'bg-emerald-50', bookings: [] },
    { id: 'confirmed_human', label: '확정-수동', bgColor: 'bg-emerald-50', bookings: [] },
    { id: 'review', label: '검토', bgColor: 'bg-amber-50', bookings: [] },
    { id: 'rejected', label: '기각', bgColor: 'bg-red-50', bookings: [] },
    { id: 'asking', label: '질문', bgColor: 'bg-blue-50', bookings: [] },
  ]);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*');

      if (!error && data) {
        const grouped: Record<string, Booking[]> = {
          pending: [],
          confirmed_auto: [],
          confirmed_human: [],
          review: [],
          rejected: [],
          asking: [],
        };

        data.forEach(b => {
          const status = b.decision || 'pending';
          if (grouped[status]) {
            grouped[status].push(b);
          }
        });

        setColumns(prev =>
          prev.map(col => ({
            ...col,
            bookings: grouped[col.id] || [],
          }))
        );
      }
    };

    fetchBookings();

    const channel = supabase
      .channel('bookings-status-board')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">상태 보드</h3>
      <div className="grid grid-cols-6 gap-3">
        {columns.map(col => (
          <div key={col.id} className={`${col.bgColor} rounded-lg p-3 min-h-96`}>
            <div className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">
              {col.label}
              <span className="ml-1 text-xs font-normal text-slate-500">
                ({col.bookings.length})
              </span>
            </div>
            <div className="space-y-2">
              {col.bookings.map(booking => (
                <div
                  key={booking.id}
                  className="bg-white rounded border border-slate-200 p-2 text-xs hover:shadow-sm transition-shadow"
                >
                  <p className="font-semibold text-slate-900 truncate">
                    {booking.customer}
                  </p>
                  <p className="text-slate-600 truncate">
                    {booking.date}
                  </p>
                  {(booking.kind || booking.form) && (
                    <p className="text-slate-500 text-xs truncate">
                      {booking.kind} {booking.form && `/ ${booking.form}`}
                    </p>
                  )}
                  <p className="text-slate-600 truncate mt-1">
                    {booking.service}
                  </p>
                  {col.id === 'review' && booking.options && (
                    <p className="text-slate-500 text-xs mt-1 truncate">
                      {booking.options}
                    </p>
                  )}
                  {booking.reason && col.id !== 'review' && (
                    <p className="text-slate-600 text-xs mt-1 line-clamp-1">
                      {booking.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
