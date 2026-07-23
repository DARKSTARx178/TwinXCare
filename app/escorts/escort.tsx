import LocationAutocomplete, { SelectedLocation } from '@/components/LocationAutocomplete';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { checkMatchForAvailability, finalizeEscortJob, lockInJob, rejectMatch } from '@/services/matchingService';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 80;
const KNOB_SIZE = 60;
const HITTING_POINT = SLIDER_WIDTH - KNOB_SIZE - 20;

export default function EscortAvailability() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const { fontSize } = useAccessibility();
  const textSize = getFontSizeValue(fontSize);
  const { jobId, type } = useLocalSearchParams<{ jobId: string, type: 'request' | 'availability' }>();

  const [jobData, setJobData] = useState<any>(null);
  const [matchedRequestData, setMatchedRequestData] = useState<any>(null);
  const [matchedProviderData, setMatchedProviderData] = useState<any>(null);
  const [matchedProviderCerts, setMatchedProviderCerts] = useState<string[]>([]);

  const [date, setDate] = useState(new Date());
  const [fromTime, setFromTime] = useState(new Date());
  const [toTime, setToTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [location, setLocation] = useState('');
  const [locationCoordinates, setLocationCoordinates] = useState<SelectedLocation | null>(null);
  const [serviceRadiusKm, setServiceRadiusKm] = useState('5');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [mySlots, setMySlots] = useState<any[]>([]);

  const refreshMySlots = async () => {
    if (auth.currentUser) {
      const q = query(collection(db, 'escort', 'availability', 'entries'), where('providerId', '==', auth.currentUser.uid));
      const snap = await getDocs(q);
      setMySlots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
  };

  React.useEffect(() => {
    const fetchRating = async () => {
      if (auth.currentUser) {
        try {
          const uDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (uDoc.exists()) {
            const data = uDoc.data();
            setUserRating(data.rating ?? null);
            setRatingCount(data.ratingCount ?? 0);
          }

          await refreshMySlots();
        } catch (err) {
          console.error("Error fetching volunteer data:", err);
        }
      }
    };
    fetchRating();

    const fetchJob = async () => {
      if (!jobId || !type) return;
      try {
        const path = type === 'availability' ? 'escort/availability/entries' : 'escort/request/entries';
        const jDoc = await getDoc(doc(db, path, jobId));
        if (jDoc.exists()) {
          const data = jDoc.data();
          setJobData(data);

          if (type === 'availability' && data?.matchedRequestId) {
            const reqDoc = await getDoc(doc(db, 'escort', 'request', 'entries', data.matchedRequestId));
            if (reqDoc.exists()) {
              setMatchedRequestData(reqDoc.data());
            } else {
              setMatchedRequestData(null);
            }
          } else {
            setMatchedRequestData(null);
          }

          if (type === 'request' && data?.matchedProviderId) {
            const providerDoc = await getDoc(doc(db, 'users', data.matchedProviderId));
            setMatchedProviderData(providerDoc.exists() ? providerDoc.data() : null);

            const certSnap = await getDocs(
              query(
                collection(db, 'escort/certifications/submissions'),
                where('userId', '==', data.matchedProviderId),
                where('status', '==', 'approved')
              )
            );
            const certs = Array.from(
              new Set(
                certSnap.docs
                  .map((d) => String((d.data() as any).certTypeName || '').trim())
                  .filter(Boolean)
              )
            );
            setMatchedProviderCerts(certs);
          } else {
            setMatchedProviderData(null);
            setMatchedProviderCerts([]);
          }
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
      }
    };
    fetchJob();
  }, [jobId, type]);

  const translateX = useSharedValue(0);

  const [selectedRating, setSelectedRating] = useState(0);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectionDetails, setRejectionDetails] = useState<string>('');
  const rejectTranslateX = useSharedValue(0);
  const [rejectionSubmitting, setRejectionSubmitting] = useState(false);

  const rejectionOptions = [
    'Not certified',
    'Location too far',
    'Timing conflict',
    'Other',
  ];

  const onConfirm = async () => {
    if (!jobId || !jobData) return;
    const reqId = type === 'request' ? jobId : jobData.matchedRequestId;
    const availId = type === 'availability' ? jobId : jobData.matchedAvailabilityId;
    const myRole = type === 'request' ? 'patient' : 'volunteer';

    if (!reqId || !availId) {
      Alert.alert("Error", "Could not find linked companion for this job.");
      translateX.value = withSpring(0);
      return;
    }

    setJobData((prev: any) => ({ ...prev, [myRole === 'patient' ? 'patientConfirmed' : 'volunteerConfirmed']: true }));

    const success = await lockInJob(reqId, availId, myRole);
    if (success) {
      const path = type === 'availability' ? 'escort/availability/entries' : 'escort/request/entries';
      const jSnap = await getDoc(doc(db, path, jobId));
      if (jSnap.exists()) setJobData(jSnap.data());

      await refreshMySlots();
    } else {
      Alert.alert("Error", "Failed to confirm. Please try again.");
      setJobData((prev: any) => ({ ...prev, [myRole === 'patient' ? 'patientConfirmed' : 'volunteerConfirmed']: false }));
    }
    translateX.value = withSpring(0);
  };

  const onComplete = async () => {
    if (!jobId || !jobData) return;
    const reqId = type === 'request' ? jobId : jobData.matchedRequestId;
    const availId = type === 'availability' ? jobId : jobData.matchedAvailabilityId;
    const myRole = type === 'request' ? 'patient' : 'volunteer';

    if (myRole === 'patient' && selectedRating === 0) {
      Alert.alert("Rating Required", "Please select a rating before ending the job.");
      translateX.value = withSpring(0);
      return;
    }

    setJobData((prev: any) => ({ ...prev, [myRole === 'patient' ? 'patientCompleted' : 'volunteerCompleted']: true }));

    const success = await finalizeEscortJob(reqId, availId, myRole, selectedRating);
    if (success) {
      const path = type === 'availability' ? 'escort/availability/entries' : 'escort/request/entries';
      const jSnap = await getDoc(doc(db, path, jobId));
      if (jSnap.exists()) setJobData(jSnap.data());
    } else {
      Alert.alert("Error", "Failed to complete job.");
      setJobData((prev: any) => ({ ...prev, [myRole === 'patient' ? 'patientCompleted' : 'volunteerCompleted']: false }));
    }
    translateX.value = withSpring(0);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const nextX = event.translationX;
      if (nextX >= 0 && nextX <= HITTING_POINT) {
        translateX.value = nextX;
      }
    })
    .onEnd(() => {
      if (translateX.value > HITTING_POINT * 0.8) {
        translateX.value = withSpring(HITTING_POINT);
        if (jobData?.status === 'matched') runOnJS(onConfirm)();
        else if (jobData?.status === 'confirmed') runOnJS(onComplete)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const rejectPanGesture = Gesture.Pan()
    .onUpdate((event) => {
      const nextX = -event.translationX;
      if (nextX >= 0 && nextX <= HITTING_POINT) {
        rejectTranslateX.value = nextX;
      }
    })
    .onEnd(() => {
      if (rejectTranslateX.value > HITTING_POINT * 0.8) {
        rejectTranslateX.value = HITTING_POINT;
        runOnJS(onReject)();
      } else {
        rejectTranslateX.value = 0;
      }
    });

  const animatedTrackStyle = useAnimatedStyle(() => ({
    width: SLIDER_WIDTH,
    backgroundColor: interpolateColor(
      translateX.value,
      [0, HITTING_POINT],
      ['#e2e8f0', theme.primaryGlow]
    ),
  }));

  const animatedKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    backgroundColor: '#ffffff',
  }));

  const rejectTrackStyle = useAnimatedStyle(() => ({
    width: SLIDER_WIDTH,
    backgroundColor: interpolateColor(
      rejectTranslateX.value,
      [0, HITTING_POINT],
      ['#fde2e2', '#fecaca']
    ),
  }));

  const rejectKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rejectTranslateX.value }],
    backgroundColor: '#ffffff',
  }));

  const getCurrentUserDisplayName = async (): Promise<string> => {
    if (!auth.currentUser) return 'Unknown';
    try {
      const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userSnap.exists() ? userSnap.data() : {};
      return String(userData?.username || userData?.displayName || auth.currentUser.email || 'Unknown');
    } catch (error) {
      console.error('Error fetching current user name:', error);
      return auth.currentUser.email || 'Unknown';
    }
  };

  const onReject = async () => {
    if (!jobId || !jobData) return;
    if (!rejectionReason) {
      Alert.alert('Select Reason', 'Please select a reason for rejecting the match.');
      rejectTranslateX.value = 0;
      return;
    }

    const reqId = type === 'request' ? jobId : jobData.matchedRequestId;
    const availId = type === 'availability' ? jobId : jobData.matchedAvailabilityId;
    const myRole = type === 'request' ? 'patient' : 'volunteer';

    if (!reqId || !availId) {
      Alert.alert('Error', 'Could not find linked companion for this job.');
      rejectTranslateX.value = 0;
      return;
    }

    setRejectionSubmitting(true);
    try {
      const initiatorName = await getCurrentUserDisplayName();
      const details = rejectionReason === 'Other' ? rejectionDetails.trim() || 'No details provided' : null;
      const success = await rejectMatch(reqId, availId, myRole, rejectionReason, details, initiatorName);
      if (success) {
        Alert.alert('Match Rejected', 'Thank you. The match has been rejected and will be reprocessed.');
        const path = type === 'availability' ? 'escort/availability/entries' : 'escort/request/entries';
        const jSnap = await getDoc(doc(db, path, jobId));
        if (jSnap.exists()) setJobData(jSnap.data());
        await refreshMySlots();
        setRejectionReason('');
        setRejectionDetails('');
      } else {
        Alert.alert('Error', 'Failed to reject match. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting match:', error);
      Alert.alert('Error', 'Failed to reject match. Please try again later.');
    } finally {
      setRejectionSubmitting(false);
      rejectTranslateX.value = 0;
    }
  };

  const formatDate = (value: Date) => value.toISOString().split('T')[0];
  const formatTime = (value: Date) => value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please sign in first.');
      return;
    }

    const currentUid = auth.currentUser.uid;
    const userSnap = await getDoc(doc(db, 'users', currentUid));
    const userData = userSnap.exists() ? userSnap.data() : {};
    const role = String(userData.role || 'user');
    const userType = String(userData.userType || '');
    const canSubmitAvailability = role === 'admin' || userType === 'escort';
    if (!canSubmitAvailability) {
      Alert.alert('Not Allowed', 'Only escort volunteer accounts can submit availability. Patients should submit escort requests instead.');
      return;
    }

    if (!location) {
      Alert.alert('Location Required', 'Please select a location.');
      return;
    }

    const radiusKm = Math.max(Number(serviceRadiusKm) || 5, 0.5);
    const dateStr = formatDate(date);
    const fromStr = formatTime(fromTime);
    const toStr = formatTime(toTime);

    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'escort', 'availability', 'entries'), {
        providerId: auth.currentUser.uid,
        providerEmail: auth.currentUser.email ?? 'guest',
        date: dateStr,
        fromTime: fromStr,
        toTime: toStr,
        location,
        locationCoordinates: locationCoordinates ? {
          latitude: locationCoordinates.latitude,
          longitude: locationCoordinates.longitude,
        } : null,
        serviceRadiusKm: radiusKm,
        locationRadiusKm: radiusKm,
        maxPax: 1,
        contactPhone,
        notes: '',
        createdAt: serverTimestamp(),
        status: 'available',
        patientConfirmed: false,
        volunteerConfirmed: false,
        patientCompleted: false,
        volunteerCompleted: false,
      });

      const availData = {
        providerId: auth.currentUser.uid,
        providerEmail: auth.currentUser.email ?? 'guest',
        date: dateStr,
        fromTime: fromStr,
        toTime: toStr,
        location,
        locationCoordinates: locationCoordinates ? {
          latitude: locationCoordinates.latitude,
          longitude: locationCoordinates.longitude,
        } : null,
        serviceRadiusKm: radiusKm,
        locationRadiusKm: radiusKm,
        maxPax: 1,
        contactPhone,
        notes: '',
        status: 'available',
      };

      checkMatchForAvailability(docRef.id, availData);
      Alert.alert('Availability submitted', 'Thank you — your availability has been posted.');
      router.back();
    } catch (error) {
      console.error('Failed to submit availability:', error);
      Alert.alert('Error', 'Failed to submit availability. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}>
          <Ionicons name="calendar-outline" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text, fontSize: textSize + 8 }]}>Volunteer Availability</Text>
        {userRating !== null && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={[styles.ratingText, { color: theme.text, fontSize: textSize - 2 }]}>
              {userRating.toFixed(1)} ({ratingCount} reviews)
            </Text>
          </View>
        )}
        <Text style={[styles.subtitle, { color: theme.textDim, fontSize: textSize - 2 }]}>
          Offer escort services to patients
        </Text>
      </View>

      {jobId ? (
        <View style={{ paddingHorizontal: 20 }}>
          <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.cardHeading, { color: theme.text, fontSize: textSize + 2, marginBottom: 0 }]}>Assignment Overview</Text>
              <View style={[styles.statusBadge, {
                backgroundColor:
                  jobData?.status === 'confirmed' ? '#ecfdf5' :
                    jobData?.status === 'matched' ? '#fffbeb' :
                      (jobData?.status === 'available' || jobData?.status === 'pending') ? '#fef2f2' : '#f8fafc'
              }]}>
                <Text style={{
                  fontSize: textSize - 6, fontWeight: '800',
                  color:
                    jobData?.status === 'confirmed' ? '#10b981' :
                      jobData?.status === 'matched' ? '#f59e0b' :
                        (jobData?.status === 'available' || jobData?.status === 'pending') ? '#ef4444' : '#94a3b8'
                }}>
                  {jobData?.status?.toUpperCase() || 'UNKNOWN'}
                </Text>
              </View>
            </View>

            <View style={styles.detailBox}>
              <View style={[styles.detailRow, { marginBottom: 15 }]}>
                <Ionicons name="finger-print" size={20} color={theme.primary} />
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>REFERENCE ID</Text>
                  <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 3, fontFamily: 'Courier' }]}>{jobId}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location" size={20} color={theme.primary} />
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>LOCATION</Text>
                  <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 1 }]}>{jobData?.location || jobData?.hospital || 'N/A'}</Text>
                </View>
              </View>
              <View style={[styles.detailRow, { marginTop: 15 }]}>
                <Ionicons name="calendar" size={20} color={theme.primary} />
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>DATE & TIME</Text>
                  <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 1 }]}>
                    {jobData?.date} • {jobData?.fromTime || jobData?.time} - {jobData?.toTime || jobData?.endTime}
                  </Text>
                </View>
              </View>
              {jobData?.notes && (
                <View style={[styles.detailRow, { marginTop: 15 }]}>
                  <Ionicons name="document-text" size={20} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>NOTES</Text>
                    <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 1 }]}>{jobData?.notes}</Text>
                  </View>
                </View>
              )}
            </View>

            {type === 'availability' && jobData?.matchedRequestId && (
              <View style={[styles.detailBox, { marginTop: 16 }]}>
                <Text style={[styles.cardHeading, { color: theme.text, fontSize: textSize + 2, marginBottom: 14 }]}>Patient Details</Text>

                <View style={styles.detailRow}>
                  <Ionicons name="person" size={20} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>PATIENT</Text>
                    <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 1 }]}>
                      {matchedRequestData?.caregiverName || matchedRequestData?.patientName || matchedRequestData?.userEmail || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.detailRow, { marginTop: 12 }]}>
                  <Ionicons name="call" size={20} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>CONTACT PHONE</Text>
                    <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 1 }]}>
                      {matchedRequestData?.contactPhone || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.detailRow, { marginTop: 12 }]}>
                  <Ionicons name="warning" size={20} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>EMERGENCY CONTACT</Text>
                    <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 1 }]}>
                      {matchedRequestData?.emergencyContactPhone || 'N/A'}
                    </Text>
                  </View>
                </View>

                {matchedRequestData?.age !== undefined && matchedRequestData?.age !== null && (
                  <View style={[styles.detailRow, { marginTop: 12 }]}>
                    <Ionicons name="person-outline" size={20} color={theme.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>AGE</Text>
                      <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 1 }]}>
                        {String(matchedRequestData.age)}
                      </Text>
                    </View>
                  </View>
                )}

                {matchedRequestData?.requiredCertificationName && (
                  <View style={[styles.detailRow, { marginTop: 12 }]}>
                    <Ionicons name="ribbon" size={20} color={theme.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>REQUIRED CERTIFICATION</Text>
                      <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 1 }]}>
                        {matchedRequestData.requiredCertificationName}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={[styles.detailRow, { marginTop: 12 }]}>
                  <Ionicons name="medkit" size={20} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>MEDICAL DETAILS</Text>
                    <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 1 }]}>
                      {matchedRequestData?.medicalDetails || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.detailRow, { marginTop: 12 }]}>
                  <Ionicons name="chatbox-ellipses" size={20} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>APPOINTMENT INFO</Text>
                    <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 1 }]}>
                      {matchedRequestData?.appointmentInfo || matchedRequestData?.appointmentReason || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.detailRow, { marginTop: 12 }]}>
                  <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>INSTRUCTIONS</Text>
                    <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 1 }]}>
                      {matchedRequestData?.instructions || matchedRequestData?.additionalNotes || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {jobData?.status === 'matched' && (
              <View style={{ marginTop: 40 }}>
                {type === 'request' && (
                  <View style={[styles.detailBox, { marginBottom: 16 }]}>
                    <Text style={[styles.cardHeading, { color: theme.text, fontSize: textSize + 2, marginBottom: 14 }]}>Assigned Volunteer</Text>
                    <View style={styles.detailRow}>
                      <Ionicons name="person-circle" size={20} color={theme.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>VOLUNTEER</Text>
                        <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 1 }]}>
                          {jobData?.matchedProviderName || matchedProviderData?.username || matchedProviderData?.email || 'N/A'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.detailRow, { marginTop: 12 }]}>
                      <Ionicons name="star" size={20} color={theme.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>RATING</Text>
                        <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 1 }]}>
                          {typeof matchedProviderData?.rating === 'number'
                            ? `${matchedProviderData.rating.toFixed(1)} (${matchedProviderData?.ratingCount || 0} reviews)`
                            : 'No ratings yet'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.detailRow, { marginTop: 12 }]}>
                      <Ionicons name="ribbon" size={20} color={theme.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>APPROVED CERTIFICATIONS</Text>
                        <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 1 }]}>
                          {matchedProviderCerts.length ? matchedProviderCerts.join(', ') : 'No approved certifications'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {(type === 'request' ? jobData?.patientConfirmed : jobData?.volunteerConfirmed) ? (
                  <View style={styles.confirmedBox}>
                    <Ionicons name="time" size={32} color={theme.primary} />
                    <Text style={{ fontWeight: '800', color: theme.text, fontSize: textSize - 2, marginTop: 10 }}>WAITING FOR COUNTERPART</Text>
                    <Text style={{ fontSize: textSize - 3, color: theme.textDim, textAlign: 'center', marginTop: 5 }}>
                      You have confirmed. Status will update once the other person slides to agree.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5, textAlign: 'center', marginBottom: 20 }]}>Slide to Agree & Confirm Match</Text>
                    <View style={styles.sliderContainer}>
                      <Animated.View style={[styles.sliderTrack, animatedTrackStyle]}>
                        <Text style={[styles.sliderHint, { color: theme.textDim, fontSize: textSize - 2 }]}>Confirming...</Text>
                      </Animated.View>
                      <GestureDetector gesture={panGesture}>
                        <Animated.View style={[styles.sliderKnob, animatedKnobStyle]}>
                          <Ionicons name="arrow-forward" size={24} color="#000" />
                        </Animated.View>
                      </GestureDetector>
                    </View>

                    <View style={{ marginTop: 24, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: theme.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.border }}>
                      <Text style={[styles.label, { color: theme.text, fontSize: textSize - 3, marginBottom: 10 }]}>Reject Match</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                        {rejectionOptions.map((option) => (
                          <TouchableOpacity
                            key={option}
                            onPress={() => setRejectionReason(option)}
                            style={[
                              styles.reasonChip,
                              { backgroundColor: rejectionReason === option ? theme.primaryGlow : theme.unselectedTab, borderColor: rejectionReason === option ? theme.primary : theme.border },
                            ]}
                          >
                            <Text style={{ color: theme.text, fontSize: textSize - 4 }}>{option}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {rejectionReason === 'Other' && (
                        <TextInput
                          value={rejectionDetails}
                          onChangeText={setRejectionDetails}
                          placeholder="Enter rejection details"
                          placeholderTextColor={theme.textDim}
                          style={[styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.unselectedTab }]}
                          multiline
                          numberOfLines={3}
                        />
                      )}
                      <Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5, textAlign: 'center', marginTop: 12, marginBottom: 8 }]}>Slide to Reject Match</Text>
                      <View style={styles.sliderContainer}> 
                        <Animated.View style={[styles.sliderTrack, rejectTrackStyle]}>
                          <Text style={[styles.sliderHint, { color: theme.textDim, fontSize: textSize - 2 }]}>Rejecting...</Text>
                        </Animated.View>
                        <GestureDetector gesture={rejectPanGesture}>
                          <Animated.View style={[styles.sliderKnob, rejectKnobStyle]}>
                            <Ionicons name="arrow-back" size={24} color="#000" />
                          </Animated.View>
                        </GestureDetector>
                      </View>
                    </View>
                  </>
                )}
              </View>
            )}

            {jobData?.status === 'confirmed' && (
              <View style={{ marginTop: 40 }}>
                {(type === 'request' ? jobData?.patientCompleted : jobData?.volunteerCompleted) ? (
                  <View style={styles.confirmedBox}>
                    <Ionicons name="time" size={32} color={theme.primary} />
                    <Text style={{ fontWeight: '800', color: theme.text, fontSize: textSize - 2, marginTop: 10 }}>WAITING FOR COUNTERPART</Text>
                    <Text style={{ fontSize: textSize - 3, color: theme.textDim, textAlign: 'center', marginTop: 5 }}>
                      You have ended the job. Status will update once the other person confirms completion.
                    </Text>
                  </View>
                ) : (
                  <>
                    {type === 'request' && (
                      <>
                        <Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5, textAlign: 'center', marginBottom: 10 }]}>Rate your Experience</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 30 }}>
                          {[1, 2, 3, 4, 5].map(v => (
                            <TouchableOpacity key={v} onPress={() => setSelectedRating(v)}>
                              <Ionicons name={selectedRating >= v ? "star" : "star-outline"} size={32} color={selectedRating >= v ? "#f59e0b" : theme.textDim} />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}

                    <Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5, textAlign: 'center', marginBottom: 20 }]}>Slide to End Job</Text>
                    <View style={styles.sliderContainer}>
                      <Animated.View style={[styles.sliderTrack, animatedTrackStyle]}>
                        <Text style={[styles.sliderHint, { color: theme.textDim, fontSize: textSize - 2 }]}>Ending Job...</Text>
                      </Animated.View>
                      <GestureDetector gesture={panGesture}>
                        <Animated.View style={[styles.sliderKnob, animatedKnobStyle]}>
                          <Ionicons name="power" size={24} color="#000" />
                        </Animated.View>
                      </GestureDetector>
                    </View>
                  </>
                )}
              </View>
            )}

            {jobData?.status === 'completed' && (
              <View style={[styles.confirmedBox, { backgroundColor: '#f1f5f9' }]}>
                <Ionicons name="flag" size={40} color="#64748b" />
                <Text style={{ fontWeight: '800', color: '#334155', fontSize: textSize - 2, marginTop: 10 }}>ASSIGNMENT COMPLETED</Text>
                <Text style={{ fontSize: textSize - 3, color: '#64748b', textAlign: 'center', marginTop: 5 }}>
                  Thank you for using TwinXCare. This case is now closed.
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
            <Text style={[styles.cardHeading, { color: theme.text, fontSize: textSize + 2 }]}>Service Schedule</Text>

            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Escort Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[styles.datePicker, { backgroundColor: '#F1F5F9' }]}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.primary} style={{ marginRight: 10 }} />
                <Text style={[styles.dateText, { color: theme.text, fontSize: textSize - 1 }]}>{formatDate(date)}</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}

            <View style={[styles.formRow, { gap: 12 }]}>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Available From</Text>
                <TouchableOpacity
                  onPress={() => setShowFromPicker(true)}
                  style={[styles.timePicker, { backgroundColor: '#F1F5F9' }]}
                >
                  <Ionicons name="time-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.timeText, { color: theme.text, fontSize: textSize - 2 }]}>{formatTime(fromTime)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Available Until</Text>
                <TouchableOpacity
                  onPress={() => setShowToPicker(true)}
                  style={[styles.timePicker, { backgroundColor: '#F1F5F9' }]}
                >
                  <Ionicons name="time-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.timeText, { color: theme.text, fontSize: textSize - 2 }]}>{formatTime(toTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {showFromPicker && (
              <DateTimePicker
                value={fromTime}
                mode="time"
                is24Hour={true}
                display="default"
                minuteInterval={5}
                onChange={(event, selectedDate) => {
                  setShowFromPicker(false);
                  if (selectedDate) setFromTime(selectedDate);
                }}
              />
            )}

            {showToPicker && (
              <DateTimePicker
                value={toTime}
                mode="time"
                is24Hour={true}
                display="default"
                minuteInterval={5}
                onChange={(event, selectedDate) => {
                  setShowToPicker(false);
                  if (selectedDate) setToTime(selectedDate);
                }}
              />
            )}
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
            <Text style={[styles.cardHeading, { color: theme.text, fontSize: textSize + 2 }]}>Volunteer Details</Text>

            <View style={styles.inputWrapper}>
              <LocationAutocomplete
                label="Location"
                placeholder="Hospital, area, or facility"
                value={location}
                onChangeText={setLocation}
                onLocationSelected={setLocationCoordinates}
                disabled={submitting}
                theme={theme}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.inputWrapper, { flex: 1, marginRight: 12 }]}>
                <Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Max location radius travelled (KM)</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, fontSize: textSize - 1 }]}
                  placeholder="5"
                  value={serviceRadiusKm}
                  onChangeText={setServiceRadiusKm}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1.2 }]}>
                <Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Contact Phone</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, fontSize: textSize - 1 }]}
                  placeholder="Your active number"
                  placeholderTextColor="#94a3b8"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface },
                submitting && { opacity: 0.7, backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }
              ]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={[styles.submitText, { color: submitting ? '#94B3B8' : theme.primary, fontSize: textSize }]}>
                {submitting ? 'Registering...' : 'Register Availability'}
              </Text>
              {!submitting && <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
            <Text style={[styles.cardHeading, { color: theme.text, fontSize: textSize + 2, marginLeft: 10 }]}>Recent Slots</Text>
            {mySlots.length === 0 ? (
              <View style={[styles.emptyInline, { backgroundColor: theme.surface }]}>
                <Text style={{ color: theme.textDim, fontSize: textSize - 2 }}>No slots yet.</Text>
              </View>
            ) : (
              mySlots.map(slot => (
                <TouchableOpacity
                  key={slot.id}
                  style={[styles.smallCard, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
                  onPress={() => router.setParams({ jobId: slot.id, type: 'availability' })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.slotTitle, { color: theme.text, fontSize: textSize - 2 }]}>{slot.location || 'No Location'}</Text>
                    <Text style={[styles.slotSub, { color: theme.textDim, fontSize: textSize - 6, marginTop: 4 }]}>ID: {slot.id}</Text>
                    <Text style={[styles.slotSub, { color: theme.textDim, fontSize: textSize - 4 }]}>{slot.date} • {slot.fromTime}</Text>
                    {slot.notes ? <Text style={[styles.slotSub, { color: theme.textDim, fontSize: textSize - 4, fontStyle: 'italic' }]} numberOfLines={1}>{slot.notes}</Text> : null}
                  </View>
                  <View style={[styles.statusTag, {
                    backgroundColor:
                      slot.status === 'confirmed' ? '#ecfdf5' :
                        slot.status === 'matched' ? '#fffbeb' :
                          (slot.status === 'available' || slot.status === 'pending') ? '#fef2f2' : '#f8fafc'
                  }]}>
                    <Text style={{
                      fontSize: textSize - 7, fontWeight: '800',
                      color:
                        slot.status === 'confirmed' ? '#10b981' :
                          slot.status === 'matched' ? '#f59e0b' :
                            (slot.status === 'available' || slot.status === 'pending') ? '#ef4444' : '#94a3b8'
                    }}>
                      {slot.status.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  header: {
    marginTop: 100,
    marginBottom: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 14, fontWeight: '500', marginTop: 4, textAlign: 'center' },
  card: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 32,
    marginBottom: 20,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
  },
  timePicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  formRow: {
    flexDirection: 'row',
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 10,
  },
  submitText: {
    fontWeight: '800',
    fontSize: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailBox: {
    padding: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  sliderContainer: {
    height: 70,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  sliderTrack: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderKnob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: 30,
    backgroundColor: '#fff',
    position: 'absolute',
    left: 5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sliderHint: {
    fontSize: 14,
    fontWeight: '800',
    opacity: 0.5,
  },
  confirmedBox: {
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyInline: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  smallCard: {
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  slotSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reasonChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 110,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
});
