import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { checkMatchForRequest } from '@/services/matchingService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RequireEscort() {
	const router = useRouter();
	const { theme } = useContext(ThemeContext);

	const [date, setDate] = useState(new Date());
	const [time, setTime] = useState(new Date());
	const [endTime, setEndTime] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);
	const [showEndTimePicker, setShowEndTimePicker] = useState(false);

	const [hospital, setHospital] = useState('');
	const [appointmentReason, setAppointmentReason] = useState('');
	const [medicalDetails, setMedicalDetails] = useState('');
	const [age, setAge] = useState('');
	const [contactPhone, setContactPhone] = useState('');
	const [additionalNotes, setAdditionalNotes] = useState('');
	const [submitting, setSubmitting] = useState(false);

	// Helpers
	const formatDate = (d: Date) => d.toISOString().split('T')[0];
	const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

	const handleSubmit = async () => {
		const dateStr = formatDate(date);
		const timeStr = formatTime(time);
		const endTimeStr = formatTime(endTime);

		if (!hospital.trim() || !appointmentReason.trim()) {
			Alert.alert('Incomplete Form', 'Please indicate the hospital and reason for the appointment.');
			return;
		}

		setSubmitting(true);
		try {
			const docRef = await addDoc(collection(db, 'escort', 'request', 'entries'), {
				userId: auth?.currentUser?.uid ?? 'guest',
				userEmail: auth?.currentUser?.email ?? 'guest',
				date: dateStr,
				time: timeStr,
				endTime: endTimeStr,
				hospital,
				appointmentReason,
				medicalDetails,
				age: age ? Number(age) : null,
				contactPhone,
				additionalNotes,
				createdAt: serverTimestamp(),
				status: 'pending'
			});

			const requestData = {
				userId: auth?.currentUser?.uid ?? 'guest',
				userEmail: auth?.currentUser?.email ?? 'guest',
				date: dateStr,
				time: timeStr,
				endTime: endTimeStr,
				hospital,
				appointmentReason,
				medicalDetails,
				age: age ? Number(age) : null,
				contactPhone,
				additionalNotes,
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
		<ScrollView
			style={{ flex: 1, backgroundColor: theme.background }}
			contentContainerStyle={{ paddingBottom: 60 }}
			showsVerticalScrollIndicator={false}
		>
			<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
				<Ionicons name="arrow-back" size={28} color={theme.text} />
			</TouchableOpacity>

			<View style={styles.header}>
				<View style={[styles.iconCircle, { backgroundColor: '#fdf2f2' }]}>
					<Ionicons name="medical-outline" size={32} color="#ef4444" />
				</View>
				<Text style={[styles.title, { color: theme.text }]}>Request Escort</Text>
				<Text style={[styles.subtitle, { color: theme.textDim }]}>
					Professional assistance for your medical appointments
				</Text>
			</View>

			<View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
				<Text style={[styles.cardHeading, { color: theme.text }]}>Timing & Schedule</Text>

				<View style={styles.inputWrapper}>
					<Text style={[styles.label, { color: theme.textDim }]}>Appointment Date</Text>
					<TouchableOpacity
						onPress={() => setShowDatePicker(true)}
						style={[styles.datePicker, { backgroundColor: '#F1F5F9' }]}
					>
						<Ionicons name="calendar-outline" size={20} color={theme.primary} style={{ marginRight: 10 }} />
						<Text style={[styles.dateText, { color: theme.text }]}>{formatDate(date)}</Text>
					</TouchableOpacity>
				</View>

				<View style={[styles.formRow, { gap: 12 }]}>
					<View style={styles.inputWrapper}>
						<Text style={[styles.label, { color: theme.textDim }]}>Starts At</Text>
						<TouchableOpacity
							onPress={() => setShowTimePicker(true)}
							style={[styles.timePicker, { backgroundColor: '#F1F5F9' }]}
						>
							<Ionicons name="time-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
							<Text style={[styles.timeText, { color: theme.text }]}>{formatTime(time)}</Text>
						</TouchableOpacity>
					</View>
					<View style={styles.inputWrapper}>
						<Text style={[styles.label, { color: theme.textDim }]}>Estimated End</Text>
						<TouchableOpacity
							onPress={() => setShowEndTimePicker(true)}
							style={[styles.timePicker, { backgroundColor: '#F1F5F9' }]}
						>
							<Ionicons name="time-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
							<Text style={[styles.timeText, { color: theme.text }]}>{formatTime(endTime)}</Text>
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
				<Text style={[styles.cardHeading, { color: theme.text }]}>Patient & Appointment Info</Text>

				<View style={styles.inputWrapper}>
					<Text style={[styles.label, { color: theme.textDim }]}>Hospital / Clinic</Text>
					<TextInput
						style={[styles.input, { color: theme.text }]}
						placeholder="Name of health facility"
						placeholderTextColor="#94a3b8"
						value={hospital}
						onChangeText={setHospital}
					/>
				</View>

				<View style={styles.inputWrapper}>
					<Text style={[styles.label, { color: theme.textDim }]}>Reason for Appointment</Text>
					<TextInput
						style={[styles.input, { color: theme.text }]}
						placeholder="e.g. Regular checkup, Dialysis"
						placeholderTextColor="#94a3b8"
						value={appointmentReason}
						onChangeText={setAppointmentReason}
					/>
				</View>

				<View style={styles.formRow}>
					<View style={[styles.inputWrapper, { flex: 1, marginRight: 12 }]}>
						<Text style={[styles.label, { color: theme.textDim }]}>Patient Age</Text>
						<TextInput
							style={[styles.input, { color: theme.text }]}
							placeholder="70"
							value={age}
							onChangeText={setAge}
							keyboardType="numeric"
						/>
					</View>
					<View style={[styles.inputWrapper, { flex: 2 }]}>
						<Text style={[styles.label, { color: theme.textDim }]}>Contact Phone</Text>
						<TextInput
							style={[styles.input, { color: theme.text }]}
							placeholder="Mobile number"
							placeholderTextColor="#94a3b8"
							value={contactPhone}
							onChangeText={setContactPhone}
							keyboardType="phone-pad"
						/>
					</View>
				</View>

				<View style={styles.inputWrapper}>
					<Text style={[styles.label, { color: theme.textDim }]}>Medical Details</Text>
					<TextInput
						style={[styles.input, { color: theme.text, minHeight: 80, textAlignVertical: 'top' }]}
						placeholder="Mobility constraints, medications, etc."
						placeholderTextColor="#94a3b8"
						value={medicalDetails}
						onChangeText={setMedicalDetails}
						multiline
					/>
				</View>

				<View style={styles.inputWrapper}>
					<Text style={[styles.label, { color: theme.textDim }]}>Additional Instructions</Text>
					<TextInput
						style={[styles.input, { color: theme.text, minHeight: 60, textAlignVertical: 'top' }]}
						placeholder="Anything else we should know?"
						placeholderTextColor="#94a3b8"
						value={additionalNotes}
						onChangeText={setAdditionalNotes}
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
						{submitting ? 'Processing...' : 'Submit Request'}
					</Text>
					{!submitting && <Ionicons name="send-outline" size={18} color={theme.primary} style={{ marginLeft: 8 }} />}
				</TouchableOpacity>
			</View>
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
