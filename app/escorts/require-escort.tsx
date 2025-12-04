import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { checkMatchForRequest } from '@/services/matchingService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

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
			Alert.alert('Please fill in the required fields: hospital and appointment reason.');
			return;
		}

		setSubmitting(true);
		try {
			// store under collection path: escort -> request -> entries (auto-id)
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

			console.log('✅ Request added with ID:', docRef.id);

			// Check for immediate match
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

			Alert.alert('Request submitted', 'Your escort request has been saved. We will contact you if there are updates.');
			router.back();
		} catch (error) {
			console.error('Failed to submit escort request:', error);
			Alert.alert('Error', 'Failed to submit escort request. Please try again later.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
			<Text style={[styles.title, { color: theme.text }]}>Request Medical Escort</Text>

			<Text style={[styles.label, { color: theme.text }]}>Date</Text>
			<TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { borderColor: theme.primary, justifyContent: 'center' }]}>
				<Text style={{ color: theme.text }}>{formatDate(date)}</Text>
			</TouchableOpacity>
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

			<Text style={[styles.label, { color: theme.text }]}>Start Time</Text>
			<TouchableOpacity onPress={() => setShowTimePicker(true)} style={[styles.input, { borderColor: theme.primary, justifyContent: 'center' }]}>
				<Text style={{ color: theme.text }}>{formatTime(time)}</Text>
			</TouchableOpacity>
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

			<Text style={[styles.label, { color: theme.text }]}>Estimated End Time</Text>
			<TouchableOpacity onPress={() => setShowEndTimePicker(true)} style={[styles.input, { borderColor: theme.primary, justifyContent: 'center' }]}>
				<Text style={{ color: theme.text }}>{formatTime(endTime)}</Text>
			</TouchableOpacity>
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

			<Text style={[styles.label, { color: theme.text }]}>Hospital / Clinic</Text>
			<TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Hospital name" value={hospital} onChangeText={setHospital} />

			<Text style={[styles.label, { color: theme.text }]}>Appointment reason</Text>
			<TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="What is the appointment for?" value={appointmentReason} onChangeText={setAppointmentReason} />

			<Text style={[styles.label, { color: theme.text }]}>Medical details / notes</Text>
			<TextInput style={[styles.input, { minHeight: 80, borderColor: theme.primary, color: theme.text }]} placeholder="Medical details, mobility restrictions, medications..." value={medicalDetails} onChangeText={setMedicalDetails} multiline />

			<Text style={[styles.label, { color: theme.text }]}>Age</Text>
			<TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="e.g. 72" value={age} onChangeText={setAge} keyboardType="numeric" />

			<Text style={[styles.label, { color: theme.text }]}>Contact phone</Text>
			<TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="Phone number" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />

			<Text style={[styles.label, { color: theme.text }]}>Additional notes</Text>
			<TextInput style={[styles.input, { minHeight: 60, borderColor: theme.primary, color: theme.text }]} placeholder="Any other info" value={additionalNotes} onChangeText={setAdditionalNotes} multiline />

			<TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.primary }, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
				<Text style={[styles.submitText, { color: '#fff' }]}>{submitting ? 'Submitting...' : 'Submit Escort Request'}</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flexGrow: 1, padding: 20 },
	center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
	label: { fontSize: 14, marginTop: 10, marginBottom: 6 },
	input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
	submitButton: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', marginTop: 18, marginBottom: 40 },
	submitText: { fontWeight: '700', fontSize: 16 },
	loginBtn: { marginTop: 18, backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
	loginBtnText: { color: '#fff', fontWeight: '700' },
	helpText: { marginTop: 8, color: '#444' }
});
