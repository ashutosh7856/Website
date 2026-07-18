import type { User } from '@/types/user'
import { API_CONFIG } from './config'
import { getTrackedSource, isLeadCaptured, markLeadCaptured } from '@/lib/leadSource'
import { formatPredictorRemark, getPredictorSearch } from '@/lib/predictorIntent'

const baseUrl = API_CONFIG.baseUrl

export interface CaptureLeadPayload {
    phoneNumber: string
    firstName?: string
    lastName?: string
    email?: string
    source?: string // QUORA, INSTAGRAM, TWITTER, GOOGLE, DIRECT, ...
    interestedCourseName?: string
    interestedStates?: string[]
    interestedExamName?: string
    interestedCollegeName?: string
    remarks?: string
}

export async function captureLead(payload: CaptureLeadPayload) {
    try {
        const response = await fetch(`${baseUrl}${API_CONFIG.endpoints.captureLead}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to capture lead`)
        }

        const text = await response.text()
        try {
            return JSON.parse(text)
        } catch {
            return text
        }
    } catch (error) {
        console.error('Capture Lead Error:', error)
        throw (error)
    }
}

/**
 * Fire-and-forget lead capture on login.
 * Builds the payload from the logged-in user + the source tracked on first visit.
 * Deduped per phone number on this device — never throws, never blocks login.
 *
 * The backend upserts by phoneNumber, so pass `{ update: true }` to re-send the
 * lead with richer data (e.g. after onboarding fills in the course, or profile
 * completion fills in the name/email). `extra` fields override the user-derived
 * ones in the payload.
 */
export function captureLeadFromUser(
    user: Partial<User> | null,
    phone: string,
    opts?: { update?: boolean; extra?: Partial<CaptureLeadPayload> }
) {
    try {
        if (!phone) {
            console.warn('[ProCounsel] Lead capture skipped: no phone number')
            return
        }
        if (!opts?.update && isLeadCaptured(phone)) {
            console.log('[ProCounsel] Lead capture skipped: already captured for', phone)
            return
        }

        const { source, landingPage } = getTrackedSource()
        const predictorSearch = getPredictorSearch()

        const payload: CaptureLeadPayload = {
            phoneNumber: phone,
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            source,
            interestedCourseName: user?.interestedCourse || '',
            interestedStates: user?.userInterestedStateOfCounsellors || [],
            remarks: predictorSearch
                ? `Website login. Landing page: ${landingPage}. ${formatPredictorRemark(predictorSearch)}`
                : `Website login. Landing page: ${landingPage}`
        }

        // The exam they last ran a predictor for is a stronger signal of intent
        // than anything on the user record, but never overrides opts.extra below.
        if (predictorSearch) {
            payload.interestedExamName = predictorSearch.exam
        }

        // Richer data (from onboarding / profile completion) wins over store values
        if (opts?.extra) {
            const cleaned = Object.fromEntries(
                Object.entries(opts.extra).filter(
                    ([, value]) => value !== undefined && value !== null && value !== ''
                )
            ) as Partial<CaptureLeadPayload>
            Object.assign(payload, cleaned)
        }

        console.log(`[ProCounsel] ${opts?.update ? 'Updating' : 'Capturing'} lead:`, payload)

        captureLead(payload)
            .then((response) => {
                markLeadCaptured(phone)
                console.log('[ProCounsel] Lead capture response:', response)
            })
            .catch((err) => {
                // log loudly but never affect login
                console.error('[ProCounsel] Lead capture FAILED:', err)
            })
    } catch (err) {
        console.error('[ProCounsel] Lead capture error:', err)
    }
}
