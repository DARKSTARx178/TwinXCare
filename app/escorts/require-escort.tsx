import { db } from '@/firebase/firebase';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

export default function RequireEscort() {
	const router = useRouter();

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
			await addDoc(collection(db, 'escortRequests'), {
				userId: 'guest',
				userEmail: 'guest',
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
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>Request Medical Escort</Text>

			<Text style={styles.label}>Date (YYYY-MM-DD)</Text>
			<TextInput style={styles.input} placeholder="2025-11-10" value={date} onChangeText={setDate} />

			<Text style={styles.label}>Time (HH:MM)</Text>
			<TextInput style={styles.input} placeholder="09:30" value={time} onChangeText={setTime} />

			<Text style={styles.label}>Hospital / Clinic</Text>
			<TextInput style={styles.input} placeholder="Hospital name" value={hospital} onChangeText={setHospital} />

			<Text style={styles.label}>Appointment reason</Text>
			<TextInput style={styles.input} placeholder="What is the appointment for?" value={appointmentReason} onChangeText={setAppointmentReason} />

			<Text style={styles.label}>Medical details / notes</Text>
			<TextInput style={[styles.input, { minHeight: 80 }]} placeholder="Medical details, mobility restrictions, medications..." value={medicalDetails} onChangeText={setMedicalDetails} multiline />

			<Text style={styles.label}>Age</Text>
			<TextInput style={styles.input} placeholder="e.g. 72" value={age} onChangeText={setAge} keyboardType="numeric" />

			<Text style={styles.label}>Contact phone</Text>
			<TextInput style={styles.input} placeholder="Phone number" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />

			<Text style={styles.label}>Additional notes</Text>
			<TextInput style={[styles.input, { minHeight: 60 }]} placeholder="Any other info" value={additionalNotes} onChangeText={setAdditionalNotes} multiline />

			<TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
				<Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Escort Request'}</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
	center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	title: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#111' },
	label: { fontSize: 14, marginTop: 10, marginBottom: 6, color: '#333' },
	input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
	submitButton: { backgroundColor: '#2563eb', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', marginTop: 18, marginBottom: 40 },
	submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
	loginBtn: { marginTop: 18, backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
	loginBtnText: { color: '#fff', fontWeight: '700' },
	helpText: { marginTop: 8, color: '#444' }
});
