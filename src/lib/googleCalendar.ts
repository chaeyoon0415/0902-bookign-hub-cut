const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

interface CalendarEvent {
  customer: string;
  service: string;
  date: string;
  time: string;
  address: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

let accessToken: string | null = null;
let tokenClient: any = null;
let tokenResolve: ((token: string) => void) | null = null;

export const initializeGoogleTokenClient = () => {
  if (!window.google?.accounts?.oauth2) {
    console.warn('Google Identity Services not loaded');
    return;
  }

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/calendar',
    callback: (tokenResponse: any) => {
      console.log('Token callback received:', tokenResponse);
      if (tokenResponse.access_token) {
        const token = tokenResponse.access_token;
        accessToken = token;
        console.log('Google Calendar access token obtained:', token.substring(0, 20) + '...');
        if (tokenResolve) {
          tokenResolve(token);
          tokenResolve = null;
        }
      }
    },
  });
  console.log('Google Token Client initialized');
};

export const requestGoogleCalendarAccess = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      initializeGoogleTokenClient();
    }

    if (!tokenClient) {
      reject(new Error('Google token client not available'));
      return;
    }

    // 이미 토큰이 있으면 바로 반환
    if (accessToken) {
      console.log('Using cached access token');
      resolve(accessToken);
      return;
    }

    // 토큰 응답을 기다릴 resolve 함수 설정
    tokenResolve = resolve;

    try {
      console.log('Requesting access token...');
      // prompt: 'consent' - 항상 동의 화면 표시
      tokenClient.requestAccessToken({ prompt: 'consent' });

      // 타임아웃 설정 (10초)
      setTimeout(() => {
        if (tokenResolve) {
          tokenResolve = null;
          reject(new Error('Timeout waiting for access token - user may have cancelled'));
        }
      }, 10000);
    } catch (error) {
      console.error('Error requesting access token:', error);
      reject(error);
    }
  });
};

export const setGoogleAccessToken = (token: string) => {
  accessToken = token;
};

export const getGoogleAccessToken = (): string | null => accessToken;

export const addEventToGoogleCalendar = async (event: CalendarEvent) => {
  try {
    if (!accessToken) {
      throw new Error('Google access token not available. Please login with Google first.');
    }

    // 슬롯을 시간으로 변환 (첫 번째 슬롯만 사용)
    const slotMap: Record<string, string> = {
      '오전': '10:00',
      '오후-1': '13:00',
      '오후-2': '15:00',
    };

    const firstSlot = event.time.split(',')[0].trim();
    const timeHHMM = slotMap[firstSlot] || '10:00';

    const startDateTime = `${event.date}T${timeHHMM}`;
    const endTime = new Date(new Date(startDateTime).getTime() + 60 * 60000);
    const endDateTime = endTime.toISOString().slice(0, 19);

    const eventBody = {
      summary: `${event.customer} - ${event.service}`,
      description: `고객사: ${event.customer}\n서비스: ${event.service}\n주소: ${event.address}`,
      location: event.address,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Seoul',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Seoul',
      },
    };

    const calendarResponse = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(eventBody),
    });

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json();
      throw new Error(`Failed to add event to Google Calendar: ${errorData.error?.message || calendarResponse.statusText}`);
    }

    const result = await calendarResponse.json();
    console.log('Event added to Google Calendar:', result);
    return result;
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    throw error;
  }
};
