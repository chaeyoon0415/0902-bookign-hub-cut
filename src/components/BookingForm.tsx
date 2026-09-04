import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { addEventToGoogleCalendar, requestGoogleCalendarAccess } from '../lib/googleCalendar';
import { AddressMapPicker } from './AddressMapPicker';
import { PlusCircle, Building2, Calendar, AlertCircle, Loader2 } from 'lucide-react';

interface BookingFormProps {
  onSuccess: () => void;
}

const SLOT_OPTIONS = [
  { id: 'morning', label: '오전 10-12' },
  { id: 'afternoon1', label: '오후-1 13-15' },
  { id: 'afternoon2', label: '오후-2 15-17' },
];

export const BookingForm = ({ onSuccess }: BookingFormProps) => {
  const [customer, setCustomer] = useState('');
  const [kind, setKind] = useState('');
  const [form, setForm] = useState('');
  const [memo, setMemo] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSlotToggle = (slotId: string) => {
    setSelectedSlots((prev) => {
      const isSelected = prev.includes(slotId);
      if (isSelected) {
        return prev.filter((s) => s !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  };


  const getSlotLabel = (slotId: string) => {
    const slot = SLOT_OPTIONS.find((s) => s.id === slotId);
    return slot?.label || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 필드 유효성 검사
    const missingFields: string[] = [];
    if (!customer) missingFields.push('고객사');
    if (!kind) missingFields.push('종류');
    if (!form) missingFields.push('형태');
    if (!date) missingFields.push('날짜');
    if (selectedSlots.length === 0) missingFields.push('희망 슬롯');
    if (form === '외근' && !address) missingFields.push('위치');

    if (missingFields.length > 0) {
      setError(`빈 칸: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      const slotsWantedString = selectedSlots.map(getSlotLabel).join(',');

      console.log('Inserting booking:', {
        customer,
        kind,
        service: memo,
        address,
        date,
        time: slotsWantedString,
      });

      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert([
          {
            customer,
            service: memo,
            address,
            date,
            time: slotsWantedString,
            status: 'pending',
            decision: 'pending',
            via: 'form',
          },
        ]);

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        setError(`저장 실패: ${insertError.message}`);
        setLoading(false);
        return;
      }

      console.log('Booking inserted successfully:', data);

      // Google Calendar는 optional이므로 실패해도 계속 진행
      try {
        await requestGoogleCalendarAccess();
        await addEventToGoogleCalendar({
          customer,
          service: memo,
          date,
          time: '',
          address,
        });
        console.log('Google Calendar에 예약이 추가되었습니다');
      } catch (calendarError) {
        console.warn('Google Calendar 추가 실패 (예약은 저장됨):', calendarError);
      }

      // 성공
      setCustomer('');
      setKind('');
      setForm('');
      setMemo('');
      setAddress('');
      setDate('');
      setSelectedSlots([]);
      onSuccess();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(`예약 추가 중 오류 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
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
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">종류</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
          >
            <option value="">선택하세요</option>
            <option value="서울">서울</option>
            <option value="경기">경기</option>
            <option value="지방">지방</option>
            <option value="내부">내부</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">형태</label>
          <select
            value={form}
            onChange={(e) => setForm(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
          >
            <option value="">선택하세요</option>
            <option value="외근">외근</option>
            <option value="온라인">온라인</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">메모</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white"
            placeholder="예: 미팅, 기획 회의"
          />
        </div>

        <div className={form === '외근' ? '' : 'opacity-50 pointer-events-none'}>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
            위치 {form === '외근' && <span className="text-red-500">*</span>}
          </label>
          <AddressMapPicker address={address} onAddressChange={setAddress} />
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
      </div>

      <div className="mb-6">
        <label className="block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">희망 슬롯 (체크 순서가 우선순위)</label>
        <div className="space-y-2">
          {SLOT_OPTIONS.map((slot) => {
            const slotOrder = selectedSlots.indexOf(slot.id) + 1;
            const isSelected = selectedSlots.includes(slot.id);
            return (
              <label key={slot.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSlotToggle(slot.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-sm text-gray-700">{slot.label}</span>
                {isSelected && (
                  <span className="ml-auto inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">
                    {slotOrder}
                  </span>
                )}
              </label>
            );
          })}
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

