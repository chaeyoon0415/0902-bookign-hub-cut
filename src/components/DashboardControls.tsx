import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { decide } from '../lib/decide';
import { Loader2 } from 'lucide-react';

interface DashboardControlsProps {
  onJudgeComplete?: () => void;
}

export const DashboardControls = ({ onJudgeComplete }: DashboardControlsProps) => {
  const [autoJudge, setAutoJudge] = useState(true);
  const [judging, setJudging] = useState(false);

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

    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('decision', 'pending');

      if (error || !bookings) {
        setJudging(false);
        return;
      }

      for (const booking of bookings) {
        const { data: allBookings } = await supabase
          .from('bookings')
          .select('*');

        if (allBookings) {
          const result = decide(booking, allBookings, autoJudge);
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

      onJudgeComplete?.();
    } finally {
      setJudging(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-6 flex items-center gap-6">
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
  );
};
