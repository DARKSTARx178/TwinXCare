import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { checkMatchForAvailability, lockInJob } from '@/services/matchingService';
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
  const { jobId, type } = useLocalSearchParams<{ jobId: string, type: 'request' | 'availability' }>();

  const [jobData, setJobData] = useState<any>(null);
  const [loadingJob, setLoadingJob] = useState(!!jobId);

  const [date, setDate] = useState(new Date());
  const [fromTime, setFromTime] = useState(new Date());
  const [toTime, setToTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [location, setLocation] = useState('');
  const [maxPax, setMaxPax] = useState('1');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
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

          // Also fetch my slots
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
          setJobData(jDoc.data());
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
      } finally {
        setLoadingJob(false);
      }
    };
    fetchJob();
  }, [jobId, type]);

  // Reanimated Slider State
  const translateX = useSharedValue(0);

  const [selectedRating, setSelectedRating] = useState(0);

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

    // Optimistic Update
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

    if (selectedRating === 0) {
      Alert.alert("Rating Required", "Please select a rating before ending the job.");
      translateX.value = withSpring(0);
      return;
    }

    // Optimistic Update
    setJobData((prev: any) => ({ ...prev, [myRole === 'patient' ? 'patientCompleted' : 'volunteerCompleted']: true }));

    const success = await completeJob(reqId, availId, myRole, selectedRating);
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

  const animatedKnobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const animatedTrackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(translateX.value, [0, HITTING_POINT], [theme.primaryGlow, '#10b981'])
  }));

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const handleSubmit = async () => {
    const dateStr = formatDate(date);
    const fromStr = formatTime(fromTime);
    const toStr = formatTime(toTime);

    if (!location.trim()) {
      Alert.alert('Please fill required fields', 'Location is required.');
      return;
    }

    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'escort', 'availability', 'entries'), {
        providerId: auth?.currentUser?.uid ?? 'guest',
        providerEmail: auth?.currentUser?.email ?? 'guest',
        date: dateStr,
        fromTime: fromStr,
        toTime: toStr,
        location,
        maxPax: Number(maxPax) || 1,
        contactPhone,
        notes,
        createdAt: serverTimestamp(),
        status: 'available'
      });

      const availData = {
        providerId: auth?.currentUser?.uid ?? 'guest',
        providerEmail: auth?.currentUser?.email ?? 'guest',
        date: dateStr,
        fromTime: fromStr,
        toTime: toStr,
        location,
        maxPax: Number(maxPax) || 1,
        contactPhone,
        notes,
        status: 'available'
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
        <Text style={[styles.title, { color: theme.text }]}>Volunteer Availability</Text>
        {userRating !== null && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={[styles.ratingText, { color: theme.text }]}>
              {userRating.toFixed(1)} ({ratingCount} reviews)
            </Text>
          </View>
        )}
        <Text style={[styles.subtitle, { color: theme.textDim }]}>
          Offer your assistance to patients in need
        </Text>
      </View>

      {jobId ? (
        // JOB DETAILS VIEW
        <View style={{ paddingHorizontal: 20 }}>
          <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.cardHeading, { color: theme.text, marginBottom: 0 }]}>Assignment Overview</Text>
              <View style={[styles.statusBadge, {
                backgroundColor:
                  jobData?.status === 'confirmed' ? '#ecfdf5' :
                    jobData?.status === 'matched' ? '#fffbeb' :
                      (jobData?.status === 'available' || jobData?.status === 'pending') ? '#fef2f2' : '#f8fafc'
              }]}>
                <Text style={{
                  fontSize: 10, fontWeight: '800',
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
              <View style={styles.detailRow}>
                <Ionicons name="location" size={20} color={theme.primary} />
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textDim }]}>LOCATION</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{jobData?.location || jobData?.hospital || 'N/A'}</Text>
                </View>
              </View>
              <View style={[styles.detailRow, { marginTop: 15 }]}>
                <Ionicons name="calendar" size={20} color={theme.primary} />
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textDim }]}>DATE & TIME</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {jobData?.date} • {jobData?.fromTime || jobData?.time} - {jobData?.toTime || jobData?.endTime}
                  </Text>
                </View>
              </View>
              {jobData?.notes && (
                <View style={[styles.detailRow, { marginTop: 15 }]}>
                  <Ionicons name="document-text" size={20} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: theme.textDim }]}>NOTES</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{jobData?.notes}</Text>
                  </View>
                </View>
              )}
            </View>

            {jobData?.status === 'matched' && (
              <View style={{ marginTop: 40 }}>
                {(type === 'request' ? jobData?.patientConfirmed : jobData?.volunteerConfirmed) ? (
                  <View style={styles.confirmedBox}>
                    <Ionicons name="time" size={32} color={theme.primary} />
                    <Text style={{ fontWeight: '800', color: theme.text, marginTop: 10 }}>WAITING FOR COUNTERPART</Text>
                    <Text style={{ fontSize: 13, color: theme.textDim, textAlign: 'center', marginTop: 5 }}>
                      You have confirmed. Status will update once the other person slides to agree.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.label, { color: theme.textDim, textAlign: 'center', marginBottom: 20 }]}>Slide to Agree & Confirm Match</Text>
                    <View style={styles.sliderContainer}>
                      <Animated.View style={[styles.sliderTrack, animatedTrackStyle]}>
                        <Text style={[styles.sliderHint, { color: theme.textDim }]}>Confirming...</Text>
                      </Animated.View>
                      <GestureDetector gesture={panGesture}>
                        <Animated.View style={[styles.sliderKnob, animatedKnobStyle]}>
                          <Ionicons name="arrow-forward" size={24} color="#000" />
                        </Animated.View>
                      </GestureDetector>
                    </View>
                  </>
                )}
              </View>
            )}

            {jobData?.status === 'confirmed' && (
              <View style={{ marginTop: 40 }}>
                {(type === 'request' ? jobData?.patientCompleted : jobData?.volunteerCompleted) ? (
                  <View style={styles.confirmedBox}>
                    <Ionicons name="hourglass" size={32} color={theme.primary} />
                    <Text style={{ fontWeight: '800', color: theme.text, marginTop: 10 }}>COMPLETION RECORDED</Text>
                    <Text style={{ fontSize: 13, color: theme.textDim, textAlign: 'center', marginTop: 5 }}>
                      Job will close once both parties finish.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.label, { color: theme.textDim, textAlign: 'center', marginBottom: 10 }]}>Rate your Experience</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 30 }}>
                      {[1, 2, 3, 4, 5].map(v => (
                        <TouchableOpacity key={v} onPress={() => setSelectedRating(v)}>
                          <Ionicons name={selectedRating >= v ? "star" : "star-outline"} size={32} color={selectedRating >= v ? "#f59e0b" : theme.textDim} />
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.label, { color: theme.textDim, textAlign: 'center', marginBottom: 20 }]}>Slide to End Job</Text>
                    <View style={styles.sliderContainer}>
                      <Animated.View style={[styles.sliderTrack, animatedTrackStyle]}>
                        <Text style={[styles.sliderHint, { color: theme.textDim }]}>Ending Job...</Text>
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
                <Text style={{ fontWeight: '800', color: '#334155', marginTop: 10 }}>ASSIGNMENT COMPLETED</Text>
                <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 5 }}>
                  Thank you for using TwinXCare. This case is now closed.
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        // STANDARD FORM VIEW
        <>
          <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
            <Text style={[styles.cardHeading, { color: theme.text }]}>Service Schedule</Text>

            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: theme.textDim }]}>Escort Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[styles.datePicker, { backgroundColor: '#F1F5F9' }]}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.primary} style={{ marginRight: 10 }} />
                <Text style={[styles.dateText, { color: theme.text }]}>{formatDate(date)}</Text>
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
                <Text style={[styles.label, { color: theme.textDim }]}>Available From</Text>
                <TouchableOpacity
                  onPress={() => setShowFromPicker(true)}
                  style={[styles.timePicker, { backgroundColor: '#F1F5F9' }]}
                >
                  <Ionicons name="time-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.timeText, { color: theme.text }]}>{formatTime(fromTime)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: theme.textDim }]}>Available Until</Text>
                <TouchableOpacity
                  onPress={() => setShowToPicker(true)}
                  style={[styles.timePicker, { backgroundColor: '#F1F5F9' }]}
                >
                  <Ionicons name="time-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.timeText, { color: theme.text }]}>{formatTime(toTime)}</Text>
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
            <Text style={[styles.cardHeading, { color: theme.text }]}>Assignment Details</Text>

            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: theme.textDim }]}>Preferred Location</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Hospital, area, or facility"
                placeholderTextColor="#94a3b8"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.inputWrapper, { flex: 1, marginRight: 12 }]}>
                <Text style={[styles.label, { color: theme.textDim }]}>Capacity (Pax)</Text>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="1"
                  value={maxPax}
                  onChangeText={setMaxPax}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 2 }]}>
                <Text style={[styles.label, { color: theme.textDim }]}>Contact Phone</Text>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Your active number"
                  placeholderTextColor="#94a3b8"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: theme.textDim }]}>Additional Notes</Text>
              <TextInput
                style={[styles.input, { color: theme.text, minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Constraints or references..."
                placeholderTextColor="#94a3b8"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
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
              <Text style={[styles.submitText, { color: submitting ? '#94B3B8' : theme.primary }]}>
                {submitting ? 'Registering...' : 'Register Availability'}
              </Text>
              {!submitting && <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          </View>

          {/* MY SLOTS SECTION */}
          <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
            <Text style={[styles.cardHeading, { color: theme.text, marginLeft: 10 }]}>My Recent Slots</Text>
            {mySlots.length === 0 ? (
              <View style={[styles.emptyInline, { backgroundColor: theme.surface }]}>
                <Text style={{ color: theme.textDim }}>No slots posted yet.</Text>
              </View>
            ) : (
              mySlots.map(slot => (
                <TouchableOpacity
                  key={slot.id}
                  style={[styles.smallCard, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
                  onPress={() => router.setParams({ jobId: slot.id, type: 'availability' })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.slotTitle, { color: theme.text }]}>{slot.location}</Text>
                    <Text style={[styles.slotSub, { color: theme.textDim }]}>{slot.date} • {slot.fromTime}</Text>
                  </View>
                  <View style={[styles.statusTag, {
                    backgroundColor:
                      slot.status === 'confirmed' ? '#ecfdf5' :
                        slot.status === 'matched' ? '#fffbeb' :
                          (slot.status === 'available' || slot.status === 'pending') ? '#fef2f2' : '#f8fafc'
                  }]}>
                    <Text style={{
                      fontSize: 9, fontWeight: '800',
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
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  }
});
