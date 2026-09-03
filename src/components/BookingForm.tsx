import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { addEventToGoogleCalendar } from '../lib/googleCalendar';
import { AddressMapPicker } from './AddressMapPicker';
import { PlusCircle, Building2, Briefcase, Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface BookingFormProps {
  onSuccess: () => void;
}

export const BookingForm = ({ onSuccess }: BookingFormProps) => {
  const [customer, setCustomer] = useState('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customer || !service || !date || !time || !address) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('bookings')
        .insert([
          {
            customer,
            service,
            date,
            time,
            address,
            status: 'pending',
            via: 'form',
          },
        ]);

      if (insertError) {
        setError(`예약 추가 실패: ${insertError.message}`);
        console.error('Error inserting booking:', insertError);
        setLoading(false);
        return;
      }

      // Google Calendar에 이벤트 추가
      try {
        await addEventToGoogleCalendar({
          customer,
          service,
          date,
          time,
          address,
        });
      } catch (calendarError) {
        console.warn('Google Calendar 추가 실패 (예약은 저장됨):', calendarError);
      }

      setCustomer('');
      setService('');
      setDate('');
      setTime('');
      setAddress('');
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200/80 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <PlusCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">새 예약 추가</h2>
          <p className="text-xs text-gray-500">신규 예약에 필요한 정보를 입력하세요</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">고객사</label>
          <div className="relative">
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
              placeholder="고객사 이름 입력"
            />
            <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">서비스</label>
          <div className="relative">
            <input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
              placeholder="서비스 유형 입력"
            />
            <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">날짜</label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
            />
            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">시간</label>
          <div className="relative">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
            />
            <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">주소</label>
          <AddressMapPicker address={address} onAddressChange={setAddress} />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>추가 중...</span>
          </>
        ) : (
          <>
            <PlusCircle className="w-5 h-5" />
            <span>+ 예약 추가하기</span>
          </>
        )}
      </button>
    </form>
  );
};

