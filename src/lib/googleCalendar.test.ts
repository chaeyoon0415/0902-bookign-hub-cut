import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addEventToGoogleCalendar, setGoogleAccessToken, getGoogleAccessToken } from './googleCalendar';

describe('Google Calendar Integration', () => {
  beforeEach(() => {
    setGoogleAccessToken('');
  });

  it('should store and retrieve access token', () => {
    const token = 'test-token-12345';
    setGoogleAccessToken(token);
    expect(getGoogleAccessToken()).toBe(token);
  });

  it('should throw error when access token is not set', async () => {
    const event = {
      customer: 'Test Company',
      service: 'Test Service',
      date: '2026-09-10',
      time: '14:00',
      address: 'Test Address',
    };

    await expect(addEventToGoogleCalendar(event)).rejects.toThrow(
      'Google access token not available. Please login with Google first.'
    );
  });

  it('should construct calendar event with correct format', async () => {
    const token = 'test-access-token';
    setGoogleAccessToken(token);

    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'event-123' }),
      })
    );

    global.fetch = mockFetch;

    const event = {
      customer: 'ABC Corporation',
      service: 'Consulting',
      date: '2026-09-15',
      time: '10:30',
      address: 'Seoul, Korea',
    };

    await addEventToGoogleCalendar(event);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }),
      })
    );

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.summary).toBe('ABC Corporation - Consulting');
    expect(callBody.location).toBe('Seoul, Korea');
    expect(callBody.start.dateTime).toBe('2026-09-15T10:30:00');
    expect(callBody.start.timeZone).toBe('Asia/Seoul');
  });

  it('should handle API errors gracefully', async () => {
    const token = 'test-access-token';
    setGoogleAccessToken(token);

    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({
          error: { message: 'Invalid token' },
        }),
      })
    );

    global.fetch = mockFetch;

    const event = {
      customer: 'Test',
      service: 'Test',
      date: '2026-09-10',
      time: '10:00',
      address: 'Test',
    };

    await expect(addEventToGoogleCalendar(event)).rejects.toThrow(
      'Failed to add event to Google Calendar'
    );
  });
});
