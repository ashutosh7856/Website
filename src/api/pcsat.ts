import { API_CONFIG } from './config';

export type PcsatRegistrationData = {
  studentName: string;
  contactNumber: string;
  email: string;
  gender: 'MALE' | 'FEMALE';
  category: 'SC' | 'ST' | 'GEN' | 'OBC';
};

export type PcsatRegistrationPayload = PcsatRegistrationData & {
  userId: string;
};

export type RegistrationStatusResponse = {
  registered: boolean;
  formId: string | null;
  paid: boolean;
};

export async function checkRegistrationStatus(
  userId: string
): Promise<RegistrationStatusResponse> {
  const response = await fetch(
    `${API_CONFIG.baseUrl}/api/pcsat/registration/hasRegistered?userId=${userId}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to check registration status');
  }

  return response.json();
}

export async function createRegistration(
  data: PcsatRegistrationPayload
): Promise<unknown> {
  const token = localStorage.getItem('jwt');

  const response = await fetch(
    `${API_CONFIG.baseUrl}/api/pcsat/registration/createRegistration`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || 'Failed to create registration');
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json();
}

export async function markFormAsPaid(
  userId: string
): Promise<unknown> {
  const response = await fetch(
    `${API_CONFIG.baseUrl}/api/pcsat/registration/markPaid?userId=${userId}`,
    {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json'
      },
      body: ''
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update payment status');
  }

  return response.json();
}