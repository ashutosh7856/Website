import { API_CONFIG } from './config';
import type { Appointment , AppointmentDetails} from '@/types/appointment';

const { baseUrl } = API_CONFIG;

export async function getUserAppointments(userId: string, token: string): Promise<Appointment[]> {
  try {
    const response = await fetch(`${baseUrl}/api/user/getUserAllAppointments?userId=${userId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: Failed to fetch appointments. Details: ${errorBody}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Get User Appointments Error:', error);
    throw error;
  }
}

export async function getUpcomingAppointments(userId: string, token: string): Promise<Appointment[]> {
  try {
    const response = await fetch(`${baseUrl}/api/user/getUpcomingAppointments?userId=${userId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: Failed to fetch upcoming appointments. Details: ${errorBody}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get Upcoming Appointments Error:', error);
    throw error;
  }
}

interface CancelPayload {
  userId: string;
  appointmentId: string;
  receiverFcmToken: string | null;
  reason: string;
}

export async function cancelAppointment(payload: CancelPayload, token: string): Promise<unknown> {
  try {
    const response = await fetch(`${baseUrl}/api/user/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.message || 'Failed to cancel appointment.');
    }

    return await response.json();
  } catch (error) {
    console.error('Cancel Appointment Error:', error);
    throw error;
  }
}

interface ReschedulePayload {
  userId: string;
  appointmentId: string;
  newDate: string;
  newStartTime: string;
  oldDate: string;
  oldStartTime: string;
  receiverFcmToken: string | null;
}

export async function rescheduleAppointment(payload: ReschedulePayload, token: string): Promise<unknown> {
  try {
    const response = await fetch(`${baseUrl}/api/user/reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.message || 'Failed to reschedule appointment.');
    }

    return await response.json();
  } catch (error) {
    console.error('Reschedule Appointment Error:', error);
    throw error;
  }
}

export async function getAppointmentById(userId: string, appointmentId: string, token: string): Promise<AppointmentDetails> {
  try {
    const response = await fetch(`${baseUrl}/api/user/getAppointmentById?userId=${userId}&appointmentId=${appointmentId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.message || `Failed to fetch appointment details.`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Get Appointment By ID Error:', error);
    throw error;
  }
}