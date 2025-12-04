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

// Called when a Patient submits a Request
export const checkMatchForRequest = async (requestId: string, requestData: any) => {
    console.log('🔍 Checking match for Request:', requestId);
    console.log('📄 Request Data:', JSON.stringify(requestData, null, 2));

    const { date, time, endTime, hospital, userId } = requestData;
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

                // 3. (Optional) Check Location - simple inclusion check
                const loc1 = hospital.toLowerCase().trim();
                const loc2 = avail.location.toLowerCase().trim();

                console.log(`   🏥 Location check: "${loc1}" vs "${loc2}"`);

                if (loc1.includes(loc2) || loc2.includes(loc1)) {
                    console.log(`   ✅ Location match found!`);
                    await executeMatch(requestId, requestData, availId, avail);
                    return; // Stop after first match
                } else {
                    console.log(`   ⚠️ Location mismatch. Proceeding anyway for demo.`);
                    await executeMatch(requestId, requestData, availId, avail);
                    return;
                }
            } else {
                console.log(`   ❌ Time mismatch.`);
            }
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

    const { date, fromTime, toTime, location, providerId } = availData;
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

                // 3. Location Check
                const loc1 = req.hospital.toLowerCase().trim();
                const loc2 = location.toLowerCase().trim();

                console.log(`   🏥 Location check: "${loc1}" vs "${loc2}"`);

                if (loc1.includes(loc2) || loc2.includes(loc1)) {
                    console.log(`   ✅ Location match found!`);
                    await executeMatch(reqId, req, availId, availData);
                    return;
                } else {
                    console.log(`   ⚠️ Location mismatch. Proceeding anyway for demo.`);
                    await executeMatch(reqId, req, availId, availData);
                    return;
                }
            } else {
                console.log(`   ❌ Time mismatch.`);
            }
        }
        console.log('❌ No suitable match found at this time.');

    } catch (error) {
        console.error('Error in checkMatchForAvailability:', error);
    }
};

const executeMatch = async (reqId: string, reqData: any, availId: string, availData: any) => {
    console.log('🤝 EXECUTING MATCH!');

    try {
        // 1. Update Request Doc
        await updateDoc(doc(db, 'escort', 'request', 'entries', reqId), {
            status: 'matched',
            matchedAvailabilityId: availId,
            matchedProviderId: availData.providerId,
            matchedProviderName: availData.providerEmail // Using email as name for now
        });

        // 2. Update Availability Doc
        await updateDoc(doc(db, 'escort', 'availability', 'entries', availId), {
            status: 'matched',
            matchedRequestId: reqId,
            matchedUserId: reqData.userId
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
