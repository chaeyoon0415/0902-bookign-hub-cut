export const SLOTS = ['오전', '오후-1', '오후-2'] as const;
export type Slot = typeof SLOTS[number];

export const NEED: Record<string, number> = {
  '서울': 1,
  '내부': 1,
  '경기': 2,
  '지방': 3,
};

export const requiredSlots = (kind: string, wanted: Slot[]): Slot[][] => {
  if (!wanted || wanted.length === 0) return [];

  const needCount = NEED[kind] || 1;

  if (needCount === 1) {
    return wanted.map(slot => [slot]);
  }

  if (needCount === 2) {
    const adjacentMap: Record<Slot, Slot[]> = {
      '오전': ['오전', '오후-1'],
      '오후-1': ['오전', '오후-1', '오후-2'],
      '오후-2': ['오후-1', '오후-2'],
    };
    return wanted.map(slot => adjacentMap[slot] || []);
  }

  if (needCount === 3) {
    return wanted.map(() => [...SLOTS]);
  }

  return [];
};

export const occupied = (
  date: string,
  bookings: Array<{
    date: string;
    decision?: string | null;
    slot_assigned?: string;
  }>
): Set<Slot> => {
  const occupiedSlots = new Set<Slot>();

  bookings.forEach((booking) => {
    if (
      booking.date === date &&
      (booking.decision === 'confirmed_auto' || booking.decision === 'confirmed_human') &&
      booking.slot_assigned
    ) {
      booking.slot_assigned.split(',').forEach((slot) => {
        const trimmedSlot = slot.trim() as Slot;
        if (SLOTS.includes(trimmedSlot)) {
          occupiedSlots.add(trimmedSlot);
        }
      });
    }
  });

  return occupiedSlots;
};
