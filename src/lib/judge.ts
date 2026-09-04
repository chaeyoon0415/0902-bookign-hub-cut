export interface JudgeResult {
  route: 'ask' | 'book';
  message?: string;
}

export const judge = (data: {
  customer: string;
  kind: string;
  form: string;
  date: string;
  address: string;
  slotsWanted: string[];
}): JudgeResult => {
  const missingFields: string[] = [];

  if (!data.customer) missingFields.push('고객사');
  if (!data.kind) missingFields.push('종류');
  if (!data.form) missingFields.push('형태');
  if (!data.date) missingFields.push('날짜');
  if (data.slotsWanted.length === 0) missingFields.push('희망 슬롯');
  if (data.form === '외근' && !data.address) missingFields.push('위치');

  if (missingFields.length > 0) {
    return {
      route: 'ask',
      message: `빈 칸: ${missingFields.join(', ')}`,
    };
  }

  return {
    route: 'book',
  };
};
