import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AddressMapPicker } from './AddressMapPicker';

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
    } else {
      setCustomer('');
      setService('');
      setDate('');
      setTime('');
      setAddress('');
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">새 예약 추가</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">고객사</label>
          <input
            type="text"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="고객사 이름"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">서비스</label>
          <input
            type="text"
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="서비스 유형"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">시간</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">주소</label>
          <AddressMapPicker address={address} onAddressChange={setAddress} />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? '추가 중...' : '예약하기'}
      </button>
    </form>
  );
};
