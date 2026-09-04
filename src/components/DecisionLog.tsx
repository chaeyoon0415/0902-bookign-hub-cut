import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface LogEntry {
  id: number;
  customer: string;
  decision: string;
  trace: string;
  timestamp: number;
  expanded: boolean;
}

export const DecisionLog = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    // Realtime 구독
    const channel = supabase
      .channel('bookings-decision-log')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        payload => {
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new?.decision) {
            const newLog: LogEntry = {
              id: payload.new.id,
              customer: payload.new.customer,
              decision: payload.new.decision,
              trace: payload.new.trace || '',
              timestamp: Date.now(),
              expanded: false,
            };

            setLogs(prev => {
              const updated = [newLog, ...prev].slice(0, 12);
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getDecisionBadgeColor = (decision: string) => {
    switch (decision) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'confirmed_auto':
        return 'bg-emerald-100 text-emerald-800';
      case 'confirmed_human':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-500';
      case 'review':
        return 'bg-amber-100 text-amber-800';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'asking':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDecisionLabel = (decision: string) => {
    const labels: Record<string, string> = {
      pending: '대기',
      confirmed_auto: '확정-자동',
      confirmed_human: '확정-수동',
      review: '검토',
      rejected: '기각',
      asking: '질문',
    };
    return labels[decision] || decision;
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">판정 로그 (최근 12건)</h3>
      <div className="space-y-2">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">판정 기록이 없습니다.</p>
        ) : (
          logs.map(log => (
            <div key={log.id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString('ko-KR')}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {log.customer}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getDecisionBadgeColor(log.decision)}`}>
                    {getDecisionLabel(log.decision)}
                  </span>
                </div>
                {log.trace && (
                  <button
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                  >
                    {expandedId === log.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              {expandedId === log.id && log.trace && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600 space-y-1">
                  {log.trace.split('\n').map((line, idx) => (
                    <div key={idx} className="whitespace-pre-wrap break-words">
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
