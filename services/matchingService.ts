import { db } from '@/firebase/firebase';
import { sendLocalNotification, sendPushNotification } from '@/utils/notifications';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';

// Helper to parse "HH:MM" to minutes
const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

const getUserPushToken = async (userId: string) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return userDoc.data().pushToken;
        }
    } catch (e) {
        console.error('Error fetching user push token:', e);
    }
    return null;
};

const normalizeLocation = (value?: string) =>
    (value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

const locationsMatch = (first?: string, second?: string) => {
    const firstTokens = normalizeLocation(first);
    const secondTokens = normalizeLocation(second);

    if (firstTokens.length === 0 || secondTokens.length === 0) {
        return false;
    }

    const firstText = firstTokens.join(' ');
    const secondText = secondTokens.join(' ');

    if (firstText.includes(secondText) || secondText.includes(firstText)) {
        return true;
    }

    const secondSet = new Set(secondTokens);
    const sharedTokens = firstTokens.filter((token) => token.length > 2 && secondSet.has(token));
    return sharedTokens.length > 0;
};

const getRequestMatchLocation = (requestData: any) =>
    requestData.location || requestData.pickupLocation || requestData.hospital || '';

const getCoordinates = (data: any) => {
    const coords = data?.locationCoordinates || data?.deliveryLocation;
    const latitude = coords?.latitude ?? coords?.lat;
    const longitude = coords?.longitude ?? coords?.lon;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return null;
    }

    return { latitude, longitude };
};

const getDistanceKm = (
    first: { latitude: number; longitude: number },
    second: { latitude: number; longitude: number }
) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const latDistance = toRad(second.latitude - first.latitude);
    const lonDistance = toRad(second.longitude - first.longitude);
    const a =
        Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
        Math.cos(toRad(first.latitude)) *
        Math.cos(toRad(second.latitude)) *
        Math.sin(lonDistance / 2) *
        Math.sin(lonDistance / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
};

const getRangeMatch = (requestData: any, availData: any) => {
    const requestCoords = getCoordinates(requestData);
    const availabilityCoords = getCoordinates(availData);
    const radiusKm = Number(availData.serviceRadiusKm || availData.radiusKm || 0);

    if (!requestCoords || !availabilityCoords || radiusKm <= 0) {
        return null;
    }

    const distanceKm = getDistanceKm(requestCoords, availabilityCoords);
    return {
        distanceKm,
        radiusKm,
        inRange: distanceKm <= radiusKm,
    };
};

// Called when a Patient submits a Request
export const checkMatchForRequest = async (requestId: string, requestData: any) => {
    console.log('🔍 Checking match for Request:', requestId);
    console.log('📄 Request Data:', JSON.stringify(requestData, null, 2));

    const { date, time, endTime } = requestData;
    const requestLocation = getRequestMatchLocation(requestData);
    const reqStart = parseTime(time);
    const reqEnd = endTime ? parseTime(endTime) : reqStart + 60; // Default to 1 hour if missing

    if (isNaN(reqStart)) {
        console.error('❌ Invalid request time format:', time);
        return;
    }

    try {
        // 1. Query available escorts for the same date
        const q = query(
            collection(db, 'escort', 'availability', 'entries'),
            where('date', '==', date),
            where('status', '==', 'available')
        );

        const snapshot = await getDocs(q);
        console.log(`Found ${snapshot.size} potential availabilities for date ${date}`);
        let fallbackMatch: { availId: string; avail: any } | null = null;
        let textLocationFallback: { availId: string; avail: any } | null = null;

        for (const docSnap of snapshot.docs) {
            const avail = docSnap.data();
            const availId = docSnap.id;

            console.log(`🔎 Checking Availability ${availId}:`, JSON.stringify(avail));

            // 2. Check Time Overlap (Range Check)
            const availStart = parseTime(avail.fromTime);
            const availEnd = parseTime(avail.toTime);

            if (isNaN(availStart) || isNaN(availEnd)) {
                console.warn(`⚠️ Invalid time in availability ${availId}: ${avail.fromTime}-${avail.toTime}`);
                continue;
            }

            console.log(`   ⏰ Time check: Req(${reqStart}-${reqEnd}) vs Avail(${availStart}-${availEnd})`);

            // STRICT MATCH: Request must fit entirely within Availability
            if (reqStart >= availStart && reqEnd <= availEnd) {
                console.log(`   ✅ Time match found!`);

                const rangeMatch = getRangeMatch(requestData, avail);
                if (rangeMatch) {
                    console.log(`   📍 Distance check: ${rangeMatch.distanceKm.toFixed(2)}km within ${rangeMatch.radiusKm}km`);

                    if (rangeMatch.inRange) {
                        console.log(`   ✅ Radius match found!`);
                        await executeMatch(requestId, requestData, availId, avail, {
                            matchedByLocation: true,
                            matchDistanceKm: rangeMatch.distanceKm,
                            matchRadiusKm: rangeMatch.radiusKm,
                        });
                        return;
                    }

                    console.log(`   ❌ Outside volunteer radius.`);
                    fallbackMatch ??= { availId, avail };
                    continue;
                }

                console.log(`   🏥 Location check: "${requestLocation}" vs "${avail.location || ''}"`);

                if (locationsMatch(requestLocation, avail.location)) {
                    console.log(`   ✅ Location match found!`);
                    textLocationFallback ??= { availId, avail };
                    continue;
                }

                console.log(`   ⚠️ Time match found, but location/radius did not match.`);
                fallbackMatch ??= { availId, avail };
            } else {
                console.log(`   ❌ Time mismatch.`);
            }
        }

        if (textLocationFallback) {
            console.log('⚠️ No coordinate radius match found. Using text location fallback.');
            await executeMatch(requestId, requestData, textLocationFallback.availId, textLocationFallback.avail, {
                matchedByLocation: true,
            });
            return;
        }

        if (fallbackMatch) {
            console.log('⚠️ No radius/location match found. Using best time-only fallback.');
            await executeMatch(requestId, requestData, fallbackMatch.availId, fallbackMatch.avail, {
                matchedByLocation: false,
            });
            return;
        }

        console.log('❌ No suitable match found at this time.');

    } catch (error) {
        console.error('Error in checkMatchForRequest:', error);
    }
};

// Called when a Volunteer submits Availability
export const checkMatchForAvailability = async (availId: string, availData: any) => {
    console.log('🔍 Checking match for Availability:', availId);
    console.log('📄 Availability Data:', JSON.stringify(availData, null, 2));

    const { date, fromTime, toTime, location } = availData;
    const availStart = parseTime(fromTime);
    const availEnd = parseTime(toTime);

    if (isNaN(availStart) || isNaN(availEnd)) {
        console.error('❌ Invalid availability time format:', fromTime, toTime);
        return;
    }

    try {
        // 1. Query pending requests for the same date
        const q = query(
            collection(db, 'escort', 'request', 'entries'),
            where('date', '==', date),
            where('status', '==', 'pending')
        );

        const snapshot = await getDocs(q);
        console.log(`Found ${snapshot.size} pending requests for date ${date}`);
        let fallbackMatch: { reqId: string; req: any } | null = null;
        let textLocationFallback: { reqId: string; req: any } | null = null;

        for (const docSnap of snapshot.docs) {
            const req = docSnap.data();
            const reqId = docSnap.id;

            console.log(`🔎 Checking Request ${reqId}:`, JSON.stringify(req));

            // 2. Check Time
            const reqStart = parseTime(req.time);
            const reqEnd = req.endTime ? parseTime(req.endTime) : reqStart + 60; // Default 1h

            if (isNaN(reqStart)) {
                console.warn(`⚠️ Invalid time in request ${reqId}: ${req.time}`);
                continue;
            }

            console.log(`   ⏰ Time check: Req(${reqStart}-${reqEnd}) vs Avail(${availStart}-${availEnd})`);

            if (reqStart >= availStart && reqEnd <= availEnd) {
                console.log(`   ✅ Time match found!`);

                const rangeMatch = getRangeMatch(req, availData);
                if (rangeMatch) {
                    console.log(`   📍 Distance check: ${rangeMatch.distanceKm.toFixed(2)}km within ${rangeMatch.radiusKm}km`);

                    if (rangeMatch.inRange) {
                        console.log(`   ✅ Radius match found!`);
                        await executeMatch(reqId, req, availId, availData, {
                            matchedByLocation: true,
                            matchDistanceKm: rangeMatch.distanceKm,
                            matchRadiusKm: rangeMatch.radiusKm,
                        });
                        return;
                    }

                    console.log(`   ❌ Outside volunteer radius.`);
                    fallbackMatch ??= { reqId, req };
                    continue;
                }

                const requestLocation = getRequestMatchLocation(req);
                console.log(`   🏥 Location check: "${requestLocation}" vs "${location}"`);

                if (locationsMatch(requestLocation, location)) {
                    console.log(`   ✅ Location match found!`);
                    textLocationFallback ??= { reqId, req };
                    continue;
                }

                console.log(`   ⚠️ Time match found, but location/radius did not match.`);
                fallbackMatch ??= { reqId, req };
            } else {
                console.log(`   ❌ Time mismatch.`);
            }
        }

        if (textLocationFallback) {
            console.log('⚠️ No coordinate radius match found. Using text location fallback.');
            await executeMatch(textLocationFallback.reqId, textLocationFallback.req, availId, availData, {
                matchedByLocation: true,
            });
            return;
        }

        if (fallbackMatch) {
            console.log('⚠️ No radius/location match found. Using best time-only fallback.');
            await executeMatch(fallbackMatch.reqId, fallbackMatch.req, availId, availData, {
                matchedByLocation: false,
            });
            return;
        }

        console.log('❌ No suitable match found at this time.');

    } catch (error) {
        console.error('Error in checkMatchForAvailability:', error);
    }
};

type MatchMeta = {
    matchedByLocation?: boolean;
    matchDistanceKm?: number;
    matchRadiusKm?: number;
};

const executeMatch = async (reqId: string, reqData: any, availId: string, availData: any, matchMeta: MatchMeta = {}) => {
    console.log('🤝 EXECUTING MATCH!');

    try {
        // 1. Update Request Doc
        await updateDoc(doc(db, 'escort', 'request', 'entries', reqId), {
            status: 'matched',
            matchedAvailabilityId: availId,
            matchedProviderId: availData.providerId,
            matchedProviderName: availData.providerEmail, // Using email as name for now
            matchedByLocation: matchMeta.matchedByLocation ?? false,
            matchDistanceKm: matchMeta.matchDistanceKm ?? null,
            matchRadiusKm: matchMeta.matchRadiusKm ?? null,
        });

        // 2. Update Availability Doc
        await updateDoc(doc(db, 'escort', 'availability', 'entries', availId), {
            status: 'matched',
            matchedRequestId: reqId,
            matchedUserId: reqData.userId,
            matchedByLocation: matchMeta.matchedByLocation ?? false,
            matchDistanceKm: matchMeta.matchDistanceKm ?? null,
            matchRadiusKm: matchMeta.matchRadiusKm ?? null,
        });

        // 3. Notify Patient (Requestor)
        const patientToken = await getUserPushToken(reqData.userId);
        const patientMsg = `Good news! We found a volunteer escort for your appointment at ${reqData.hospital} on ${reqData.date}.`;

        if (patientToken) {
            console.log('📲 Sending push to Patient:', patientToken);
            await sendPushNotification(patientToken, 'Escort Matched! 🤝', patientMsg, { reqId, availId, screen: '/(tabs)/services' });
        } else {
            console.log('⚠️ No push token for patient');
        }
        // Also send local if the current user is the patient
        // (This might be redundant if we just rely on the UI, but good for feedback)
        // We can't easily know "who is the current user" inside this helper without passing it, 
        // but usually the person triggering the action gets the local notification.

        // 4. Notify Volunteer (Provider)
        const providerToken = await getUserPushToken(availData.providerId);
        const providerMsg = `You have been matched! Please escort a patient at ${reqData.hospital} on ${reqData.date} at ${reqData.time}.`;

        if (providerToken) {
            console.log('📲 Sending push to Volunteer:', providerToken);
            await sendPushNotification(providerToken, 'New Assignment! 🏥', providerMsg, { reqId, availId, screen: '/(tabs)/services' });
        } else {
            console.log('⚠️ No push token for volunteer');
        }

        // 5. Send Local Notification to the *current* user (whoever triggered this)
        // We don't know exactly who triggered it here, but we can send a generic success one 
        // or rely on the caller to show an alert. 
        // Actually, let's send a local notification here just to be sure the user sees "Match Found" immediately.
        await sendLocalNotification('Match Successful! 🤝', 'Both parties have been notified.');

    } catch (e) {
        console.error('❌ Error executing match:', e);
    }
};

/**
 * Transitions a match from 'matched' to 'confirmed' (locked-in).
 * Both parties must confirm before the status changes.
 */
export const lockInJob = async (reqId: string, availId: string, role: 'patient' | 'volunteer') => {
    console.log(`🔐 LOCKING IN JOB (By ${role}): Req ${reqId} + Avail ${availId}`);
    try {
        const reqRef = doc(db, 'escort', 'request', 'entries', reqId);
        const availRef = doc(db, 'escort', 'availability', 'entries', availId);

        const updateData: any = {};
        if (role === 'patient') updateData.patientConfirmed = true;
        else updateData.volunteerConfirmed = true;

        await updateDoc(reqRef, updateData);
        await updateDoc(availRef, updateData);

        const updatedReq = await getDoc(reqRef);
        const reqData = updatedReq.data();

        if (reqData?.patientConfirmed && reqData?.volunteerConfirmed) {
            await updateDoc(reqRef, { status: 'confirmed' });
            await updateDoc(availRef, { status: 'confirmed' });

            const patientToken = await getUserPushToken(reqData.userId);
            const providerToken = await getUserPushToken(reqData.matchedProviderId);
            const msg = `Introduction complete! Your match for ${reqData.date} is now officially CONFIRMED by both parties.`;

            if (patientToken) await sendPushNotification(patientToken, 'Job Fully Confirmed! ✅', msg);
            if (providerToken) await sendPushNotification(providerToken, 'Job Fully Confirmed! ✅', msg);
            await sendLocalNotification('Job Fully Confirmed! ✅', 'Both parties have agreed.');
        } else if (reqData) {
            // Notify the other party that one person has confirmed
            const otherToken = role === 'patient' ? await getUserPushToken(reqData.matchedProviderId) : await getUserPushToken(reqData.userId);
            const otherMsg = `${role === 'patient' ? 'The Patient' : 'The Volunteer'} has confirmed the match. Please confirm on your end to lock it in.`;
            if (otherToken) await sendPushNotification(otherToken, 'Match Confirmation Pending', otherMsg);
            await sendLocalNotification('Confirmation Sent', 'Waiting for the other party to confirm.');
        }
        return true;
    } catch (e) {
        console.error('❌ Error locking in job:', e);
        return false;
    }
};

/**
 * Marks a job as completed. Both parties must end the job before the status changes to gray 'completed'.
 */
export const finalizeEscortJob = async (reqId: string, availId: string, role: 'patient' | 'volunteer', rating?: number) => {
    console.log(`🏁 COMPLETING JOB (By ${role}): Req ${reqId} + Avail ${availId}`);
    try {
        const reqRef = doc(db, 'escort', 'request', 'entries', reqId);
        const availRef = doc(db, 'escort', 'availability', 'entries', availId);

        const updateData: any = {};
        if (role === 'patient') {
            updateData.patientCompleted = true;
            if (rating) updateData.volunteerRating = rating;
        } else {
            updateData.volunteerCompleted = true;
            if (rating) updateData.patientRating = rating;
        }

        await updateDoc(reqRef, updateData);
        await updateDoc(availRef, updateData);

        // Apply rating to the user profile immediately if provided
        if (rating) {
            const reqSnap = await getDoc(reqRef);
            const reqData = reqSnap.data();
            const targetId = role === 'patient' ? reqData?.matchedProviderId : reqData?.userId;

            if (targetId) {
                const userRef = doc(db, 'users', targetId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const ud = userSnap.data();
                    const curR = ud.rating || 0;
                    const curC = ud.ratingCount || 0;
                    const newCount = curC + 1;
                    const newAvg = (curR * curC + rating) / newCount;
                    await updateDoc(userRef, { rating: newAvg, ratingCount: newCount });
                }
            }
        }

        const updatedReq = await getDoc(reqRef);
        const reqData = updatedReq.data();

        if (reqData?.patientCompleted && reqData?.volunteerCompleted) {
            await updateDoc(reqRef, { status: 'completed' });
            await updateDoc(availRef, { status: 'completed' });
            await sendLocalNotification('Assignment Completed! 🏁', 'Job is now officially closed.');
        } else {
            await sendLocalNotification('Success', 'Your completion has been recorded. Waiting for counterpart.');
        }
        return true;
    } catch (e) {
        console.error('❌ Error completing job:', e);
    }
};

/**
 * Manually triggers the matching engine for all pending requests.
 * Useful for admins to force a re-check of connections.
 */
export const triggerManualMatching = async () => {
    console.log('🔄 Triggering Manual Matching...');
    try {
        const q = query(collection(db, 'escort', 'request', 'entries'), where('status', '==', 'pending'));
        const snapshot = await getDocs(q);
        console.log(`Found ${snapshot.size} pending requests to re-evaluate.`);

        let matchCount = 0;
        for (const docSnap of snapshot.docs) {
            await checkMatchForRequest(docSnap.id, docSnap.data());
            matchCount++;
        }
        await sendLocalNotification('Matching Engine finished', `Checked ${matchCount} pending requests.`);
        return matchCount;
    } catch (e) {
        console.error('Error in manual matching:', e);
        return 0;
    }
};
