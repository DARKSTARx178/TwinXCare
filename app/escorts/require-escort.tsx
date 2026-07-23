import LocationAutocomplete, { SelectedLocation } from '@/components/LocationAutocomplete';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { checkMatchForRequest } from '@/services/matchingService';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const CERT_CATALOG_PATH = 'escort/certifications/catalog';
const HOSPITAL_CATALOG_PATH = 'escort/hospitals/catalog';

const DEFAULT_HOSPITALS = [
	{ id: 'singapore-general-hospital', name: "Singapore General Hospital" },
	{ id: 'national-university-hospital', name: 'National University Hospital' },
	{ id: 'tan-tock-seng-hospital', name: 'Tan Tock Seng Hospital' },
	{ id: 'changi-general-hospital', name: 'Changi General Hospital' },
	{ id: 'khoo-teck-puat-hospital', name: 'Khoo Teck Puat Hospital' },
	{ id: 'nanyang-polyclinic', name: 'Nanyang Polyclinic' },
	{ id: 'alexandra-hospital', name: 'Alexandra Hospital' },
	{ id: 'kkwomens-hospital', name: "KK Women's and Children's Hospital" },
	{ id: 'sengkang-general-hospital', name: 'Sengkang General Hospital' },
	{ id: 'ng-teng-fong-general-hospital', name: 'Ng Teng Fong General Hospital' },
];

type HospitalItem = {
	id: string;
	name: string;
	address?: string;
	active?: boolean;
};

export default function RequireEscort() {
	const router = useRouter();
	const { theme } = useContext(ThemeContext);
	const { fontSize } = useAccessibility();
	const textSize = getFontSizeValue(fontSize);

	const [date, setDate] = useState(new Date());
	const [time, setTime] = useState(new Date());
	const [endTime, setEndTime] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);
	const [showEndTimePicker, setShowEndTimePicker] = useState(false);

	const [hospitalCatalog, setHospitalCatalog] = useState<HospitalItem[]>([]);
	const [selectedHospitalId, setSelectedHospitalId] = useState('');
	const [pickupLocation, setPickupLocation] = useState('');
	const [pickupCoordinates, setPickupCoordinates] = useState<SelectedLocation | null>(null);
	const [appointmentInfo, setAppointmentInfo] = useState('');
	const [medicalDetails, setMedicalDetails] = useState('');
	const [age, setAge] = useState('');
	const [contactPhone, setContactPhone] = useState('');
	const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
	const [certCatalog, setCertCatalog] = useState<{ id: string; name: string; description?: string; active?: boolean }[]>([]);
	const [selectedCertId, setSelectedCertId] = useState('');
	const [instructions, setInstructions] = useState('');
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		const loadCatalog = async () => {
			try {
				const snap = await getDocs(collection(db, CERT_CATALOG_PATH));
				const items = snap.docs
					.map((d) => ({ id: d.id, ...(d.data() as any) }))
					.filter((item) => item.active !== false)
					.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
				setCertCatalog(items);
				if (items.length) {
					setSelectedCertId(items[0].id);
				}
			} catch (error) {
				console.error('Failed to load escort certification catalog:', error);
			}
		};

		const loadHospitals = async () => {
			try {
				const snap = await getDocs(collection(db, HOSPITAL_CATALOG_PATH));
				const items = snap.docs
					.map((d) => ({ id: d.id, ...(d.data() as any) }))
					.filter((item) => item.active !== false)
					.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
				const catalog = items.length ? items : DEFAULT_HOSPITALS;
				setHospitalCatalog(catalog);
				if (catalog.length) {
					setSelectedHospitalId(catalog[0].id);
				}
			} catch (error) {
				console.error('Failed to load hospital catalog:', error);
				setHospitalCatalog(DEFAULT_HOSPITALS);
				setSelectedHospitalId(DEFAULT_HOSPITALS[0].id);
			}
		};

		loadCatalog();
		loadHospitals();
	}, []);

	// Helpers
	const formatDate = (d: Date) => d.toISOString().split('T')[0];
	const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

	const selectedHospital = hospitalCatalog.find((item) => item.id === selectedHospitalId);

	const handleSubmit = async () => {
		const dateStr = formatDate(date);
		const timeStr = formatTime(time);
		const endTimeStr = formatTime(endTime);

		if (!selectedHospital?.name || !appointmentInfo.trim()) {
			Alert.alert('Incomplete Form', 'Please select a hospital/clinic and provide appointment information.');
			return;
		}

		const currentUid = auth?.currentUser?.uid;
		if (!currentUid) {
			Alert.alert('Login Required', 'Please sign in first.');
			return;
		}

		const userSnap = await getDoc(doc(db, 'users', currentUid));
		const userData = userSnap.exists() ? userSnap.data() : {};
		const role = String(userData.role || 'user');
		const userType = String(userData.userType || '');
		const canSubmitRequest = role === 'admin' || userType === 'standard' || !userType;
		if (!canSubmitRequest) {
			Alert.alert('Not Allowed', 'Only patient accounts can submit escort requests. Escort volunteers should submit availability instead.');
			return;
		}

		const selectedCert = certCatalog.find((item) => item.id === selectedCertId);
		const certName = selectedCert?.name || '';
		const hospitalName = selectedHospital?.name || '';

		setSubmitting(true);
		try {
			const docRef = await addDoc(collection(db, 'escort', 'request', 'entries'), {
				userId: auth?.currentUser?.uid ?? 'guest',
				userEmail: auth?.currentUser?.email ?? 'guest',
				date: dateStr,
				time: timeStr,
				endTime: endTimeStr,
				hospital: hospitalName,
				location: pickupLocation.trim(),
				locationCoordinates: pickupCoordinates ? {
					latitude: pickupCoordinates.latitude,
					longitude: pickupCoordinates.longitude,
				} : null,
				appointmentInfo,
				appointmentReason: appointmentInfo,
				medicalDetails,
				age: age ? Number(age) : null,
				contactPhone,
				emergencyContactPhone,
				requiredCertificationId: selectedCert?.id || null,
				requiredCertificationName: certName || null,
				volunteerRequirements: certName || '',
				instructions,
				additionalNotes: instructions,
				createdAt: serverTimestamp(),
				status: 'pending'
			});

			const requestData = {
				userId: auth?.currentUser?.uid ?? 'guest',
				userEmail: auth?.currentUser?.email ?? 'guest',
				date: dateStr,
				time: timeStr,
				endTime: endTimeStr,
				hospital: hospitalName,
				location: pickupLocation.trim(),
				locationCoordinates: pickupCoordinates ? {
					latitude: pickupCoordinates.latitude,
					longitude: pickupCoordinates.longitude,
				} : null,
				appointmentInfo,
				appointmentReason: appointmentInfo,
				medicalDetails,
				age: age ? Number(age) : null,
				contactPhone,
				emergencyContactPhone,
				requiredCertificationId: selectedCert?.id || null,
				requiredCertificationName: certName || null,
				volunteerRequirements: certName || '',
				instructions,
				additionalNotes: instructions,
				status: 'pending'
			};

			checkMatchForRequest(docRef.id, requestData);

			Alert.alert('Request Sent', 'Your medical escort request has been submitted successfully.');
			router.back();
		} catch (error) {
			console.error('Failed to submit escort request:', error);
			Alert.alert('Error', 'Unable to process your request at this time. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1, backgroundColor: theme.background }}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
		>
			<ScrollView
				style={{ flex: 1, backgroundColor: theme.background }}
				contentContainerStyle={{ paddingBottom: 60 }}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
			<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
				<Ionicons name="arrow-back" size={28} color={theme.text} />
			</TouchableOpacity>

			<View style={styles.header}>
				<View style={[styles.iconCircle, { backgroundColor: '#fdf2f2' }]}>
					<Ionicons name="medical-outline" size={32} color="#ef4444" />
				</View>
				<Text style={[styles.title, { color: theme.text, fontSize: textSize + 8 }]}>Request Escort</Text>
				<Text style={[styles.subtitle, { color: theme.textDim, fontSize: textSize - 2 }]}>
					Request a volunteer to assist you for your medical appointments
				</Text>
			</View>

			<View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
				<Text style={[styles.cardHeading, { color: theme.text, fontSize: textSize + 2 }]}>Time & Schedule</Text>

				<View style={styles.inputWrapper}>
					<Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Appointment Date</Text>
					<TouchableOpacity
						onPress={() => setShowDatePicker(true)}
						style={[styles.datePicker, { backgroundColor: '#F1F5F9' }]}
					>
						<Ionicons name="calendar-outline" size={20} color={theme.primary} style={{ marginRight: 10 }} />
						<Text style={[styles.dateText, { color: theme.text, fontSize: textSize - 1 }]}>{formatDate(date)}</Text>
					</TouchableOpacity>
				</View>

				<View style={[styles.formRow, { gap: 12 }]}>
					<View style={styles.inputWrapper}>
						<Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Starts At</Text>
						<TouchableOpacity
							onPress={() => setShowTimePicker(true)}
							style={[styles.timePicker, { backgroundColor: '#F1F5F9' }]}
						>
							<Ionicons name="time-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
							<Text style={[styles.timeText, { color: theme.text, fontSize: textSize - 2 }]}>{formatTime(time)}</Text>
						</TouchableOpacity>
					</View>
					<View style={styles.inputWrapper}>
						<Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Estimated End</Text>
						<TouchableOpacity
							onPress={() => setShowEndTimePicker(true)}
							style={[styles.timePicker, { backgroundColor: '#F1F5F9' }]}
						>
							<Ionicons name="time-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
							<Text style={[styles.timeText, { color: theme.text, fontSize: textSize - 2 }]}>{formatTime(endTime)}</Text>
						</TouchableOpacity>
					</View>
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
				{showTimePicker && (
					<DateTimePicker
						value={time}
						mode="time"
						is24Hour={true}
						display="default"
						minuteInterval={5}
						onChange={(event, selectedDate) => {
							setShowTimePicker(false);
							if (selectedDate) setTime(selectedDate);
						}}
					/>
				)}
				{showEndTimePicker && (
					<DateTimePicker
						value={endTime}
						mode="time"
						is24Hour={true}
						display="default"
						minuteInterval={5}
						onChange={(event, selectedDate) => {
							setShowEndTimePicker(false);
							if (selectedDate) setEndTime(selectedDate);
						}}
					/>
				)}
			</View>

			<View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
				<Text style={[styles.cardHeading, { color: theme.text, fontSize: textSize + 2 }]}>Patient & Appointment Info</Text>

				<View style={styles.inputWrapper}>
					<Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Hospital / Clinic</Text>
			<View style={[styles.pickerWrap, { borderColor: theme.border }]}> 
				<Picker
					selectedValue={selectedHospitalId}
					onValueChange={(value) => setSelectedHospitalId(String(value))}
					style={{ color: theme.text, fontSize: textSize - 1 }}
				>
					{hospitalCatalog.length === 0 ? (
						<Picker.Item label="Loading hospitals..." value="" />
					) : (
						hospitalCatalog.map((item) => (
							<Picker.Item key={item.id} label={item.name} value={item.id} />
						))
					)}
				</Picker>
			</View>
				</View>
				<View style={styles.inputWrapper}>
					<LocationAutocomplete
						label="Pickup / Preferred Location"
						placeholder="Block, area, MRT, or pickup point"
						value={pickupLocation}
						onChangeText={setPickupLocation}
						onLocationSelected={setPickupCoordinates}
						disabled={submitting}
						theme={theme}
					/>
				</View>

				<View style={styles.inputWrapper}>
					<Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Appointment Info</Text>
					<TextInput
						style={[styles.input, { color: theme.text, fontSize: textSize - 1 }]}
						placeholder="e.g. back pain, joint pain"
						placeholderTextColor="#94a3b8"
						value={appointmentInfo}
						onChangeText={setAppointmentInfo}
					/>
				</View>

				<View style={styles.formRow}>
					<View style={[styles.inputWrapper, { flex: 1, marginRight: 12 }]}>
						<Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Patient Age</Text>
						<TextInput
							style={[styles.input, { color: theme.text, fontSize: textSize - 1 }]}
							placeholder="70"
							value={age}
							onChangeText={setAge}
							keyboardType="numeric"
						/>
					</View>
					<View style={[styles.inputWrapper, { flex: 2 }]}>
						<Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Contact Phone</Text>
						<TextInput
							style={[styles.input, { color: theme.text, fontSize: textSize - 1 }]}
							placeholder="Mobile number"
							placeholderTextColor="#94a3b8"
							value={contactPhone}
							onChangeText={setContactPhone}
							keyboardType="phone-pad"
						/>
					</View>
				</View>

				<View style={styles.inputWrapper}>
					<Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Emergency Contact Number</Text>
					<TextInput
						style={[styles.input, { color: theme.text, fontSize: textSize - 1 }]}
						placeholder="Emergency contact number"
						placeholderTextColor="#94a3b8"
						value={emergencyContactPhone}
						onChangeText={setEmergencyContactPhone}
						keyboardType="phone-pad"
					/>
				</View>

				<View style={styles.inputWrapper}>
					<Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Medical Details / Notes / Constraints</Text>
					<TextInput
						style={[styles.input, { color: theme.text, fontSize: textSize - 1, minHeight: 80, textAlignVertical: 'top' }]}
						placeholder="Mobility constraints, medications, etc."
						placeholderTextColor="#94a3b8"
						value={medicalDetails}
						onChangeText={setMedicalDetails}
						multiline
					/>
				</View>

				<View style={styles.inputWrapper}>
					<Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Required Certification</Text>
					<View style={[styles.pickerWrap, { borderColor: theme.border }]}>
						<Picker
							enabled={!submitting && certCatalog.length > 0}
							selectedValue={selectedCertId}
							onValueChange={(value) => setSelectedCertId(String(value))}
							style={{ color: theme.text, fontSize: textSize - 1 }}
						>
							{certCatalog.length === 0 ? (
								<Picker.Item label="No certification types configured by admin" value="" />
							) : (
								certCatalog.map((item) => (
									<Picker.Item key={item.id} label={item.name} value={item.id} />
								))
							)}
						</Picker>
					</View>
					{selectedCertId ? (
						<Text style={[styles.helperText, { color: theme.textDim, fontSize: textSize - 4 }]}>
							{certCatalog.find((item) => item.id === selectedCertId)?.description || 'Selected certification will be shared with volunteers.'}
						</Text>
					) : null}
				</View>

				<View style={styles.inputWrapper}>
					<Text style={[styles.label, { color: theme.textDim, fontSize: textSize - 5 }]}>Instructions</Text>
					<TextInput
						style={[styles.input, { color: theme.text, fontSize: textSize - 1, minHeight: 60, textAlignVertical: 'top' }]}
						placeholder="Anything else we should know?"
						placeholderTextColor="#94a3b8"
						value={instructions}
						onChangeText={setInstructions}
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
					<Text style={[styles.submitText, { color: submitting ? '#94B3B8' : theme.primary, fontSize: textSize }]}>
						{submitting ? 'Processing...' : 'Submit Request'}
					</Text>
					{!submitting && <Ionicons name="send-outline" size={18} color={theme.primary} style={{ marginLeft: 8 }} />}
				</TouchableOpacity>
			</View>
		</ScrollView>
	</KeyboardAvoidingView>
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
	subtitle: { fontSize: 14, fontWeight: '500', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
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
	pickerWrap: {
		backgroundColor: '#F1F5F9',
		borderRadius: 16,
		borderWidth: 1,
		overflow: 'hidden',
	},
	helperText: {
		marginTop: 8,
		fontSize: 12,
		fontWeight: '500',
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
});
