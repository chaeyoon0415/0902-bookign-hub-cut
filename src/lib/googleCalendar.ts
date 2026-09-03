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
    const accessToken = import.meta.env.VITE_GOOGLE_ACCESS_TOKEN;

    if (!accessToken) {
      console.warn('Google Calendar access token not found');
      return null;
    }

    // Create calendar event
    const startDateTime = `${event.date}T${event.time}:00`;
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
