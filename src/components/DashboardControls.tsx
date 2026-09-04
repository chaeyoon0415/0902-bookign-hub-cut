import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { decide } from '../lib/decide';
import { Loader2, AlertCircle } from 'lucide-react';

interface DashboardControlsProps {
  onJudgeComplete?: () => void;
}

export const DashboardControls = ({ onJudgeComplete }: DashboardControlsProps) => {
  const [autoJudge, setAutoJudge] = useState(true);
  const [judging, setJudging] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('auto-judge');
    if (saved !== null) {
      setAutoJudge(JSON.parse(saved));
    }
  }, []);

  const handleAutoJudgeToggle = () => {
    const newValue = !autoJudge;
    setAutoJudge(newValue);
    localStorage.setItem('auto-judge', JSON.stringify(newValue));
  };

  const handleJudgeAll = async () => {
    setJudging(true);
    setError('');

    try {
      const { data: bookings, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('decision', 'pending');

      if (fetchError || !bookings) {
        setError(fetchError?.message || '예약을 불러올 수 없습니다');
        setJudging(false);
        return;
      }

      if (bookings.length === 0) {
        setError('판정 대기 중인 예약이 없습니다');
        setJudging(false);
        return;
      }

      const { data: allBookings } = await supabase
        .from('bookings')
        .select('*');

      if (!allBookings) {
        setError('모든 예약을 불러올 수 없습니다');
        setJudging(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      let lastError = '';

      for (const booking of bookings) {
        try {
          const result = decide(booking, allBookings, autoJudge);

          const updateData: Record<string, any> = {
            decision: result.decision,
          };

          // confirmed_auto이면 status 변경
          if (result.decision === 'confirmed_auto') {
            updateData.status = 'confirmed';
          }

          const { error: updateError } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', booking.id);

          if (updateError) {
            errorCount++;
            lastError = updateError.message;
            console.error(`예약 ${booking.id} 저장 오류:`, updateError);
          } else {
            successCount++;
          }
        } catch (err) {
          errorCount++;
          lastError = err instanceof Error ? err.message : '알 수 없는 오류';
          console.error(`예약 ${booking.id} 판정 오류:`, err);
        }
      }

      if (errorCount > 0) {
        setError(`판정 완료: ${successCount}건 성공, ${errorCount}건 실패 (마지막 오류: ${lastError})`);
      } else {
        setError(`${successCount}건의 예약을 판정했습니다`);
      }

      onJudgeComplete?.();
    } finally {
      setJudging(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-6 space-y-4">
      {error && (
        <div className={`p-4 rounded-lg text-sm flex items-start gap-2 ${
          error.includes('실패') || error.includes('오류')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="break-words">{error}</span>
        </div>
      )}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-900">자동 판정</label>
        <button
          onClick={handleAutoJudgeToggle}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            autoJudge ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              autoJudge ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-xs text-slate-500">
          {autoJudge ? 'ON' : 'OFF'}
        </span>
      </div>

        <button
          onClick={handleJudgeAll}
          disabled={judging}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:bg-slate-300 cursor-pointer"
        >
          {judging ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>판정 중...</span>
            </>
          ) : (
            <span>전부 판정</span>
          )}
        </button>
      </div>
    </div>
  );
};
