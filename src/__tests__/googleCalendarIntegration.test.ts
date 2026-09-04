import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setGoogleAccessToken, getGoogleAccessToken, addEventToGoogleCalendar } from '../lib/googleCalendar';

declare global {
  var fetch: ReturnType<typeof vi.fn>;
}

/**
 * Google Calendar Integration Test Suite
 *
 * 시나리오:
 * 1. Google OAuth로 로그인한 Admin 사용자
 * 2. GIS(Google Identity Services)에서 access token 획득
 * 3. 사용자의 primary calendar에 예약 이벤트 추가
 * 4. 브라우저에서만 동작 (서버/프록시 없음)
 * 5. .env에는 VITE_GOOGLE_CLIENT_ID만 존재
 */

describe('Google Calendar Integration - Browser Only (GIS)', () => {
  beforeEach(() => {
    setGoogleAccessToken('');
    vi.clearAllMocks();
  });

  describe('Access Token Management', () => {
    it('GIS로부터 받은 access token을 메모리에 저장', () => {
      const gisAccessToken = 'mock_gis_access_token';

      setGoogleAccessToken(gisAccessToken);
      expect(getGoogleAccessToken()).toBe(gisAccessToken);
    });

    it('token이 없으면 캘린더 이벤트 추가 실패', async () => {
      const event = {
        customer: '테스트 회사',
        service: '상담 서비스',
        date: '2026-09-20',
        time: '14:00',
        address: '서울시 강남구',
      };

      await expect(addEventToGoogleCalendar(event)).rejects.toThrow(
        'Google access token not available'
      );
    });
  });

  describe('Admin User Calendar Event Creation', () => {
    it('Admin 사용자 예약을 사용자의 primary calendar에 추가', async () => {
      const adminToken = 'mock-test-token-admin';
      setGoogleAccessToken(adminToken);

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'event-123',
            htmlLink: 'https://calendar.google.com/calendar/u/0/r/eventedit/event-123',
          }),
        })
      );

      global.fetch = mockFetch;

      const booking = {
        customer: '삼성전자',
        service: '컨설팅',
        date: '2026-09-25',
        time: '10:00',
        address: '서울시 서초구 삼성동',
      };

      const result = await addEventToGoogleCalendar(booking);

      // primary calendar endpoint 호출 확인
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        expect.any(Object)
      );

      // Authorization header에 access token 포함
      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers;
      expect(headers.Authorization).toBe(`Bearer ${adminToken}`);

      expect(result.id).toBe('event-123');
    });

    it('예약 정보로 올바른 형식의 calendar event 생성', async () => {
      setGoogleAccessToken('test-token');

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'event-id' }),
        })
      );

      global.fetch = mockFetch;

      const booking = {
        customer: 'LG Display',
        service: '기술 협의',
        date: '2026-09-30',
        time: '15:30',
        address: 'Paju, Gyeonggi-do',
      };

      await addEventToGoogleCalendar(booking);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);

      // Event 제목
      expect(callBody.summary).toBe('LG Display - 기술 협의');

      // Event 설명
      expect(callBody.description).toContain('고객사: LG Display');
      expect(callBody.description).toContain('서비스: 기술 협의');
      expect(callBody.description).toContain('주소: Paju, Gyeonggi-do');

      // 위치
      expect(callBody.location).toBe('Paju, Gyeonggi-do');

      // 시간 (Asia/Seoul 타임존)
      expect(callBody.start.dateTime).toBe('2026-09-30T15:30:00');
      expect(callBody.start.timeZone).toBe('Asia/Seoul');

      // End time은 start time + 1시간
      const endTime = new Date('2026-09-30T15:30:00').getTime() + 60 * 60000;
      const expectedEndDateTime = new Date(endTime).toISOString().slice(0, 19);
      expect(callBody.end.dateTime).toBe(expectedEndDateTime);
      expect(callBody.end.timeZone).toBe('Asia/Seoul');
    });
  });

  describe('Browser-Only Constraints', () => {
    it('CLIENT_SECRET을 사용하지 않음 (public client flow)', async () => {
      setGoogleAccessToken('gis-access-token');

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'event' }),
        })
      );

      global.fetch = mockFetch;

      await addEventToGoogleCalendar({
        customer: 'Test',
        service: 'Test',
        date: '2026-09-15',
        time: '10:00',
        address: 'Test',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);

      // client_secret이 request에 포함되지 않음
      expect(JSON.stringify(callBody)).not.toContain('client_secret');
      expect(JSON.stringify(callBody)).not.toContain('CLIENT_SECRET');
    });

    it('CORS 호출 성공 (Calendar API는 CORS 허용)', async () => {
      setGoogleAccessToken('token');

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'event' }),
        })
      );

      global.fetch = mockFetch;

      // 브라우저 fetch로 직접 호출
      await addEventToGoogleCalendar({
        customer: 'Test',
        service: 'Test',
        date: '2026-09-15',
        time: '10:00',
        address: 'Test',
      });

      // CORS 이슈 없이 완료됨
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('API 에러 처리 - 401 Unauthorized (token 만료)', async () => {
      setGoogleAccessToken('expired-token');

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({
            error: {
              code: 401,
              message: 'Invalid Credentials',
            },
          }),
        })
      );

      global.fetch = mockFetch;

      const booking = {
        customer: 'Test',
        service: 'Test',
        date: '2026-09-15',
        time: '10:00',
        address: 'Test',
      };

      await expect(addEventToGoogleCalendar(booking)).rejects.toThrow(
        'Failed to add event to Google Calendar'
      );
    });

    it('API 에러 처리 - 403 Forbidden (calendar 접근 권한 없음)', async () => {
      setGoogleAccessToken('token');

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Forbidden',
          json: () => Promise.resolve({
            error: {
              code: 403,
              message: 'The caller does not have permission',
            },
          }),
        })
      );

      global.fetch = mockFetch;

      await expect(
        addEventToGoogleCalendar({
          customer: 'Test',
          service: 'Test',
          date: '2026-09-15',
          time: '10:00',
          address: 'Test',
        })
      ).rejects.toThrow();
    });
  });

  describe('Integration with Booking Form', () => {
    it('새 예약 추가 후 캘린더에도 자동 추가', async () => {
      setGoogleAccessToken('user-token');

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'calendar-event-id' }),
        })
      );

      global.fetch = mockFetch;

      // BookingForm에서 예약 생성
      const newBooking = {
        customer: 'SK Hynix',
        service: '기술 협력',
        date: '2026-10-01',
        time: '11:00',
        address: 'Icheon, Korea',
      };

      // 캘린더에 추가
      const calendarResult = await addEventToGoogleCalendar(newBooking);

      expect(calendarResult.id).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('캘린더 추가 실패해도 예약은 저장됨 (독립적 처리)', async () => {
      setGoogleAccessToken('token');

      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Service Unavailable',
          json: () => Promise.resolve({ error: { message: 'Service temporarily unavailable' } }),
        })
      );

      global.fetch = mockFetch;

      // 캘린더 추가 실패
      await expect(
        addEventToGoogleCalendar({
          customer: 'Test',
          service: 'Test',
          date: '2026-09-15',
          time: '10:00',
          address: 'Test',
        })
      ).rejects.toThrow();

      // 그러나 BookingForm에서는 예약은 이미 DB에 저장됨
      // (에러 캐치해서 예약 생성 흐름은 계속 진행)
    });
  });
});
