const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

interface CalendarEvent {
  customer: string;
  service: string;
  date: string;
  time: string;
  address: string;
}

export const addEventToGoogleCalendar = async (event: CalendarEvent) => {
  try {
    const refreshToken = import.meta.env.VITE_GOOGLE_REFRESH_TOKEN;

    if (!refreshToken) {
      console.warn('Google Calendar refresh token not found');
      return null;
    }

    // Refresh access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to refresh Google access token');
    }

    const { access_token } = await tokenResponse.json();

    // Create calendar event
    const startDateTime = `${event.date}T${event.time}:00`;
    const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60000).toISOString();

    const eventBody = {
      summary: `${event.customer} - ${event.service}`,
      description: `고객사: ${event.customer}\n서비스: ${event.service}\n주소: ${event.address}`,
      location: event.address,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Seoul',
      },
      end: {
        dateTime: endDateTime.split('Z')[0],
        timeZone: 'Asia/Seoul',
      },
    };

    const calendarResponse = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(eventBody),
    });

    if (!calendarResponse.ok) {
      throw new Error('Failed to add event to Google Calendar');
    }

    const result = await calendarResponse.json();
    return result;
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    throw error;
  }
};
