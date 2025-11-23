import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

export default function RequireEscort() {
	const router = useRouter();
	const { theme } = useContext(ThemeContext);

	const [date, setDate] = useState('');
	const [time, setTime] = useState('');
	const [hospital, setHospital] = useState('');
	const [appointmentReason, setAppointmentReason] = useState('');
	const [medicalDetails, setMedicalDetails] = useState('');
	const [age, setAge] = useState('');
	const [contactPhone, setContactPhone] = useState('');
	const [additionalNotes, setAdditionalNotes] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!date.trim() || !time.trim() || !hospital.trim() || !appointmentReason.trim()) {
			Alert.alert('Please fill in the required fields: date, time, hospital, and appointment reason.');
			return;
		}

		setSubmitting(true);
		try {
			// store under collection path: escort -> request -> entries (auto-id)
			await addDoc(collection(db, 'escort', 'request', 'entries'), {
				userId: auth?.currentUser?.uid ?? 'guest',
				userEmail: auth?.currentUser?.email ?? 'guest',
				date,
				time,
				hospital,
				appointmentReason,
				medicalDetails,
				age: age ? Number(age) : null,
				contactPhone,
				additionalNotes,
				createdAt: serverTimestamp(),
				status: 'pending'
			});

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

			<Text style={[styles.label, { color: theme.text }]}>Date (YYYY-MM-DD)</Text>
			<TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="2025-11-10" value={date} onChangeText={setDate} />

			<Text style={[styles.label, { color: theme.text }]}>Time (HH:MM)</Text>
			<TextInput style={[styles.input, { borderColor: theme.primary, color: theme.text }]} placeholder="09:30" value={time} onChangeText={setTime} />

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
