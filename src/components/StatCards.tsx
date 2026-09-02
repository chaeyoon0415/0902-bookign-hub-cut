import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, CheckCircle2, TrendingUp } from 'lucide-react';

interface Booking {
  date: string;
  status: string;
}

export const StatCards = ({ refreshKey }: { refreshKey: number }) => {
  const [todayCount, setTodayCount] = useState(0);
  const [confirmRate, setConfirmRate] = useState(0);
  const [weekCount, setWeekCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('date, status');

      if (error) {
        console.error('Error fetching bookings for stats:', error);
        return;
      }

      const bookings = (data || []) as Booking[];
      const today = new Date().toISOString().split('T')[0];

      // 오늘 예약 수
      const today_count = bookings.filter(b => b.date === today).length;
      setTodayCount(today_count);

      // 확정률
      const total = bookings.length;
      const confirmed = bookings.filter(b => b.status === 'confirmed').length;
      const rate = total > 0 ? (confirmed / total * 100).toFixed(1) : '0.0';
      setConfirmRate(parseFloat(rate));

      // 이번 주 총 건수 (일-토)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - dayOfWeek);
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);

      const sundayStr = sunday.toISOString().split('T')[0];
      const saturdayStr = saturday.toISOString().split('T')[0];

      const week_count = bookings.filter(b => b.date >= sundayStr && b.date <= saturdayStr).length;
      setWeekCount(week_count);
    };

    fetchStats();
  }, [refreshKey]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {/* 오늘 예약 */}
      <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">오늘 예약</span>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-gray-900">{todayCount}</div>
          <span className="text-xs text-gray-500 font-medium">건</span>
        </div>
      </div>

      {/* 확정률 */}
      <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">확정률</span>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <div className="text-3xl font-bold text-gray-900">{confirmRate}</div>
          <span className="text-xl font-bold text-gray-700">%</span>
        </div>
      </div>

      {/* 이번 주 총 건수 */}
      <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">이번 주 총 건수</span>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-gray-900">{weekCount}</div>
          <span className="text-xs text-gray-500 font-medium">건 (월~금)</span>
        </div>
      </div>
    </div>
  );
};

