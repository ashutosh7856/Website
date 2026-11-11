import type { PatchUser } from '@/types'
import {API_CONFIG} from './config'

const baseUrl = API_CONFIG.baseUrl


export async function  sendOtp(phone:string) {
    try{
        const response = await fetch(`${baseUrl}/api/auth/generateOtp?phoneNumber=${phone}`, {
            method:'POST',
            headers:{
                Accept:'application/json'
            }
        })

        if(!response.ok){
            throw new Error(`HTTP ${response.status}: Failed to send otp`)
        }


        const data = await response.text()
        console.log('Send otp response:', data)

        return data

    }catch(error){
        console.error('Send OTP Error:', error)
        throw(error)
    }
    
}

export async function verifyOtp(phone: string, otp: string) {
    try {
        const response = await fetch(`${baseUrl}/api/auth/verifyAndUserSignup?phoneNumber=${phone}&otp=${otp}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: OTP verification failed`)
        }

        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text()
            console.log('Text response:', textResponse)
            
            // Handle text responses (could be success or error messages)
            if (textResponse.toLowerCase().includes('success') || textResponse.toLowerCase().includes('verified')) {
                return {
                    type: 'success',
                    message: textResponse
                }
            }
            
            throw new Error('Server returned error: ' + textResponse)
        }

        const data = await response.json()
        console.log('Verify OTP Response:', data)
        return data

    } catch (error) {
        console.error('Verify OTP Error:', error)
        throw error
    }
}

export async function sendEmailOtp(email: string) {
  try {
    const payload = { email: email };
    const response = await fetch(`${baseUrl}/api/auth/send-mail`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: Failed to send email OTP. Server says: ${errorText}`);
    }
    
    const responseText = await response.text();
    try {
      return JSON.parse(responseText);
    } catch {
      console.log(responseText);
      return { success: true, message: responseText };
    }

  } catch (error) {
    console.error('Send Email OTP Error:', error);
    throw (error);
  }
}

export async function verifyEmailOtp(email: string, otp: string) {
  try {
    const payload = { email: email, otp: otp };
    const response = await fetch(`${baseUrl}/api/auth/verify-mail`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: Email OTP verification failed. Server says: ${errorText}`);
    }
    
    const responseText = await response.text();
    try {
      return JSON.parse(responseText);
    } catch {
      console.log(responseText);
      return { success: true, message: responseText };
    }

  } catch (error) {
    console.error('Verify Email OTP Error:', error);
    throw error;
  }
}

export async function counsellorSignup(payload: Record<string, unknown>) {
  try {
    const token = localStorage.getItem('jwt');
    const response = await fetch(`${baseUrl}/api/auth/counsellorSignup`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: Signup failed. Server says: ${errorText}`);
    }
    
    const responseText = await response.text();
    try {
      return JSON.parse(responseText);
    } catch {
      return { success: true, message: responseText };
    }

  } catch (error) {
    console.error('Counselor Signup Error:', error);
    throw error;
  }
}


export async function getSates(){
    try{
        const response = await fetch(`${baseUrl}/api/courseAndState/all-states`, {
            headers:{
               Accept:'application/json' 
            }
        })

        if(!response.ok){
            throw new Error(`HTTP error ${response.status} : Failed to fetch states`)
        }

        const data = await response.json()

        return data
    }catch(error){
        console.error(error)
        throw(error)
    }
}

export async function getCoursesOnborading(){
    try{
        const response = await fetch(`${baseUrl}/api/courseAndState/all-courses`,
            {
                headers:{
                    Accept:'application/json'
                }
            }
        )

        if(!response.ok){
            throw new Error(`HTTP error ${response.status} : ${response.statusText} : Failed to fetch courses`)
        }

        const data = await response.json()

        return data 
    }catch(error){
        console.error(error)
        throw(error)
    }
}

export async function updateUser(id:string | null, payload:PatchUser, token:string | null){
    try{
        const response = await fetch(`${baseUrl}/api/user/${id}`, {
            method:'PATCH',
            headers:{
                Accept:'application/json',
                'Content-Type':'application/json',
                Authorization:`Bearer ${token}`
            },
            body:JSON.stringify(payload)
        })

        if(!response.ok){
            throw new Error(`${response.statusText} : failed to update user`)
        }
        const data= await response.json()
        return data 
    }catch(err){
        console.error(err)
        throw(err)
    }
}


export async function checkUrl(phone:string , token:string){

    try{
        const response = await fetch(`${baseUrl}/api/auth/isUserDetailsNull?userId=${phone}`, {
        headers:{
            Accept:'application/json',
            Authorization:`Bearer ${token}`
        }
    })

    if(!response.ok){
        console.error(`❌ checkUrl failed: ${response.status} ${response.statusText}`);
        throw new Error(`${response.statusText}: ${response.status}`)
    }
    const res = await response.json()
    console.log('✅ checkUrl response:', res);
    return res
    }catch(error){
        console.error('❌ checkUrl error:', error)
        throw(error)
    }
}
/**
 * School-student signup (the fifth role, alongside user / counsellor /
 * proBuddy / admin).
 *
 * Call this ONLY after `verifyOtp` succeeded for a phone that has not finished
 * normal user onboarding — the backend refuses to convert a completed user, a
 * counsellor or a ProBuddy. Later logins go back through `verifyOtp`, which
 * then answers `role: "schoolStudent"`; this endpoint is never called twice.
 *
 * Like proBuddySignup, the backend answers HTTP 200 even for business errors
 * (a thrown exception is a 400), and puts the verdict in the body — so success
 * is decided by `role` + `jwtToken`, never by `response.ok`.
 */
export type SchoolStudentSignupPayload = {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  school: string;
  className: string;
};

export type SchoolStudentSignupResponse = {
  role?: string;
  isUser?: boolean | string;
  userId?: string;
  jwtToken?: string;
  firebaseCustomToken?: string;
  message?: string;
  statusCode?: string;
};

export async function schoolStudentSignup(
  payload: SchoolStudentSignupPayload
): Promise<SchoolStudentSignupResponse> {
  try {
    const response = await fetch(`${baseUrl}/api/auth/schoolStudentSignup`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    let data: SchoolStudentSignupResponse | null = null;
    try {
      data = JSON.parse(raw) as SchoolStudentSignupResponse;
    } catch {
      data = null;
    }

    if (!data || typeof data !== 'object') {
      throw new Error(raw?.trim() || `HTTP ${response.status}: School student signup failed`);
    }

    const isSchoolStudent = String(data.role ?? '').trim().toLowerCase() === 'schoolstudent';
    if (!isSchoolStudent || !data.jwtToken) {
      throw new Error(data.message?.trim() || `HTTP ${response.status}: School student signup failed`);
    }

    return data;
  } catch (error) {
    console.error('School Student Signup Error:', error);
    throw error;
  }
}
