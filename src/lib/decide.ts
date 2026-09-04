import { SLOTS, NEED, requiredSlots, occupied } from './slots';
import type { Slot } from './slots';

export interface DecideResult {
  decision: 'asking' | 'rejected' | 'review' | 'pending' | 'confirmed_auto' | 'confirmed_human';
  reason: string;
  candidate?: string;
  options?: string;
  trace: string[];
}

export interface Booking {
  id: number;
  kind?: string;
  date: string;
  time: string;
  customer: string;
  decision?: string | null;
  status?: string;
  slot_assigned?: string;
}

export const decide = (
  booking: Booking,
  allBookings: Booking[],
  autoOn: boolean
): DecideResult => {
  const trace: string[] = [];
  const wantedSlots = booking.time
    .split(',')
    .map((s) => s.trim() as Slot)
    .filter((s) => SLOTS.includes(s));

  // 1. 빈 칸 검사
  const missingFields: string[] = [];
  if (!booking.date) missingFields.push('날짜');
  if (wantedSlots.length === 0) missingFields.push('희망 슬롯');

  if (missingFields.length > 0) {
    trace.push(`1 빈 칸 검사: ${missingFields.join(', ')}`);
    return {
      decision: 'asking',
      reason: `빈 칸: ${missingFields.join(', ')}`,
      trace,
    };
  }
  trace.push('1 빈 칸 검사: 없음');

  // 2. 필요한 칸 계산
  const kind = booking.kind || '서울';
  const needCount = NEED[kind] || 1;
  const allRequiredSlots = requiredSlots(kind, wantedSlots);
  trace.push(
    `2 종류 ${kind} -> 필요한 칸 ${needCount}개 (희망 ${wantedSlots.join(', ')})`
  );

  // 3. 그 날짜의 점유 칸 확인
  const occupiedSlots = occupied(booking.date, allBookings);
  const occupiedStatus = SLOTS.map(
    (slot) => `${slot} ${occupiedSlots.has(slot) ? 'X' : 'O'}`
  ).join(', ');
  trace.push(`3 ${booking.date} 달력: ${occupiedStatus}`);

  // 4. 후보 찾기
  const candidates: Slot[][] = [];
  for (const requiredSet of allRequiredSlots) {
    const allAvailable = requiredSet.every((slot) => !occupiedSlots.has(slot));
    if (allAvailable) {
      candidates.push(requiredSet);
    }
  }

  const candidateStr = candidates.length > 0
    ? candidates.map((c) => c.join('+')).join(' / ')
    : '없음';
  trace.push(`4 희망 순서대로 필요한 칸이 전부 O인 후보: ${candidateStr}`);

  if (candidates.length === 0) {
    const availableSlots = SLOTS.filter((slot) => !occupiedSlots.has(slot));
    trace.push('결과: 거절 - 희망 슬롯 전부 찼음');
    return {
      decision: 'rejected',
      reason: '희망 슬롯 전부 찼음',
      options: availableSlots.join(','),
      trace,
    };
  }

  // 5. 같은 날짜의 pending 예약 비교
  const firstCandidate = candidates[0];
  const firstCandidateStr = firstCandidate.join(',');
  const sameDate = allBookings.filter(
    (b) => b.date === booking.date && b.decision === 'pending' && b.id !== booking.id
  );

  let conflictBooking: Booking | undefined;
  for (const other of sameDate) {
    const otherWanted = other.time
      .split(',')
      .map((s) => s.trim() as Slot)
      .filter((s) => SLOTS.includes(s));
    const otherKind = other.kind || '서울';
    const otherRequired = requiredSlots(otherKind, otherWanted);

    if (otherRequired.length === 1) {
      const otherCandidate = otherRequired[0];
      const hasOverlap = firstCandidate.some((slot) => otherCandidate.includes(slot));
      if (hasOverlap) {
        conflictBooking = other;
        break;
      }
    }
  }

  if (conflictBooking) {
    trace.push(
      `5 같은 날 대기 요청 비교: 겹치는 유일 후보 있음 (${conflictBooking.customer})`
    );
    trace.push(`결과: 리뷰 - 동점`);
    return {
      decision: 'review',
      reason: `동점 - ${conflictBooking.customer}도 같은 칸이 유일 후보`,
      options: `${booking.customer},${conflictBooking.customer}`,
      trace,
    };
  }
  trace.push('5 같은 날 대기 요청 비교: 겹치는 유일 후보 없음');

  // 6. 최종 결정
  if (autoOn) {
    trace.push(`결과: 확정-자동 - 빈 칸 ${firstCandidateStr} 확정`);
    return {
      decision: 'confirmed_auto',
      candidate: firstCandidateStr,
      reason: `빈 칸 ${firstCandidateStr} 확정`,
      trace,
    };
  } else {
    trace.push(`결과: 대기 - 후보 ${firstCandidateStr} 확정 버튼 대기`);
    return {
      decision: 'pending',
      candidate: firstCandidateStr,
      reason: `후보 ${firstCandidateStr} - 확정 버튼 대기`,
      trace,
    };
  }
};
