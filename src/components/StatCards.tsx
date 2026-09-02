import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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

      // 이번 주 총 건수 (월-금)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);

      const mondayStr = monday.toISOString().split('T')[0];
      const fridayStr = friday.toISOString().split('T')[0];

      const week_count = bookings.filter(b => b.date >= mondayStr && b.date <= fridayStr).length;
      setWeekCount(week_count);
    };

    fetchStats();
  }, [refreshKey]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-4xl font-bold text-blue-600">{todayCount}</div>
        <div className="text-sm text-gray-600 mt-2">오늘 예약</div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-4xl font-bold text-purple-600">{confirmRate}%</div>
        <div className="text-sm text-gray-600 mt-2">확정률</div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-4xl font-bold text-green-600">{weekCount}</div>
        <div className="text-sm text-gray-600 mt-2">이번 주 총 건수</div>
      </div>
    </div>
  );
};
