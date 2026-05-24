//under testing not stable yet



import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { addDoc, collection, getDocs, serverTimestamp, where, query } from 'firebase/firestore';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type CertOption = {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
};

type CertSubmission = {
  id: string;
  certTypeName: string;
  certificateLink: string;
  notes?: string;
  status: 'pending' | 'approved' | 'revoked';
  createdAt?: any;
  reviewedAt?: any;
  reviewedByEmail?: string;
};

const CERT_CATALOG_PATH = 'escort/certifications/catalog';
const CERT_SUBMISSIONS_PATH = 'escort/certifications/submissions';

const toTimestampMs = (value: any) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
};

const toDateLabel = (value: any) => {
  if (!value) return 'Pending timestamp';
  if (typeof value.toDate === 'function') return value.toDate().toLocaleString();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000).toLocaleString();
  return 'Pending timestamp';
};

export default function EscortCertifications() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);

  const [catalog, setCatalog] = useState<CertOption[]>([]);
  const [submissions, setSubmissions] = useState<CertSubmission[]>([]);
  const [selectedCertId, setSelectedCertId] = useState('');
  const [certificateLink, setCertificateLink] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setCatalog([]);
        setSubmissions([]);
        return;
      }

      const catalogSnap = await getDocs(collection(db, CERT_CATALOG_PATH));
      const catalogData = catalogSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((d) => d.active !== false)
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

      const submissionsSnap = await getDocs(query(collection(db, CERT_SUBMISSIONS_PATH), where('userId', '==', user.uid)));
      const submissionsData = submissionsSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt));

      setCatalog(catalogData as CertOption[]);
      setSubmissions(submissionsData as CertSubmission[]);

      if (!selectedCertId && catalogData.length) {
        setSelectedCertId(catalogData[0].id);
      }
    } catch (error) {
      console.error('Failed to load certifications:', error);
      Alert.alert('Error', 'Unable to load certification data right now.');
    } finally {
      setLoading(false);
    }
  }, [selectedCertId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const selectedCert = useMemo(
    () => catalog.find((item) => item.id === selectedCertId) ?? null,
    [catalog, selectedCertId]
  );

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Login Required', 'Please sign in before submitting a certification.');
      return;
    }

    if (!selectedCert) {
      Alert.alert('Missing Certification', 'Please select a certification type.');
      return;
    }

    const trimmedLink = certificateLink.trim();
    if (!trimmedLink) {
      Alert.alert('Missing Link', 'Please provide a certificate URL.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, CERT_SUBMISSIONS_PATH), {
        userId: user.uid,
        userEmail: user.email ?? 'unknown',
        certTypeId: selectedCert.id,
        certTypeName: selectedCert.name,
        certTypeDescription: selectedCert.description ?? '',
        certificateLink: trimmedLink,
        notes: notes.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCertificateLink('');
      setNotes('');
      Alert.alert('Submitted', 'Certification sent to admins for review.');
      await loadData();
    } catch (error) {
      console.error('Failed to submit certification:', error);
      Alert.alert('Error', 'Failed to submit certification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'approved') return { bg: '#ecfdf5', text: '#047857' };
    if (status === 'revoked') return { bg: '#fef2f2', text: '#b91c1c' };
    return { bg: '#fff7ed', text: '#9a3412' };
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 50 }}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}>
          <Ionicons name="ribbon-outline" size={30} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Certifications</Text>
        <Text style={[styles.subtitle, { color: theme.textDim }]}>Upload your certs for approval</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <Text style={[styles.cardTitle, { color: theme.text }]}>Submit</Text>

        <Text style={[styles.label, { color: theme.textDim }]}>Certification Type</Text>
        <View style={[styles.pickerWrap, { borderColor: theme.border, backgroundColor: '#F1F5F9' }]}>
          <Picker
            enabled={!submitting && catalog.length > 0}
            selectedValue={selectedCertId}
            onValueChange={(value) => setSelectedCertId(String(value))}
            style={{ color: theme.text }}
          >
            {catalog.length === 0 ? (
              <Picker.Item label="No certifications configured by admin" value="" />
            ) : (
              catalog.map((item) => (
                <Picker.Item key={item.id} label={item.name} value={item.id} />
              ))
            )}
          </Picker>
        </View>

        {selectedCert?.description ? (
          <Text style={[styles.helperText, { color: theme.textDim }]}>{selectedCert.description}</Text>
        ) : null}

        <Text style={[styles.label, { color: theme.textDim }]}>Certificate URL</Text>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="https://drive.google.com/..."
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          value={certificateLink}
          onChangeText={setCertificateLink}
        />

        <Text style={[styles.label, { color: theme.textDim }]}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput, { color: theme.text }]}
          placeholder="Certificate number, issuing body, expiry date..."
          placeholderTextColor="#94a3b8"
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || loading || catalog.length === 0}
          style={[
            styles.submitBtn,
            { borderColor: theme.primary, backgroundColor: theme.surface },
            (submitting || loading || catalog.length === 0) && { opacity: 0.6 },
          ]}
        >
          <Text style={[styles.submitText, { color: theme.primary }]}>{submitting ? 'Submitting...' : 'Submit for Review'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <Text style={[styles.cardTitle, { color: theme.text }]}>Submission History</Text>
        {loading ? (
          <Text style={{ color: theme.textDim }}>Loading submissions...</Text>
        ) : submissions.length === 0 ? (
          <Text style={{ color: theme.textDim }}>No certification submissions.</Text>
        ) : (
          submissions.map((item) => {
            const status = statusColor(item.status);
            return (
              <View key={item.id} style={[styles.historyItem, { borderColor: theme.border }]}> 
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyTitle, { color: theme.text }]}>{item.certTypeName || 'Certification'}</Text>
                  <View style={[styles.badge, { backgroundColor: status.bg }]}> 
                    <Text style={[styles.badgeText, { color: status.text }]}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.historyMeta, { color: theme.textDim }]}>Submitted: {toDateLabel(item.createdAt)}</Text>
                {item.reviewedAt ? (
                  <Text style={[styles.historyMeta, { color: theme.textDim }]}>Reviewed: {toDateLabel(item.reviewedAt)}</Text>
                ) : null}
                {item.reviewedByEmail ? (
                  <Text style={[styles.historyMeta, { color: theme.textDim }]}>Reviewer: {item.reviewedByEmail}</Text>
                ) : null}
                {!!item.certificateLink && (
                  <Text style={[styles.historyLink, { color: theme.primary }]} numberOfLines={1}>{item.certificateLink}</Text>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  header: {
    marginTop: 100,
    marginBottom: 24,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { marginTop: 4, fontSize: 13, fontWeight: '500', textAlign: 'center' },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  pickerWrap: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  notesInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 6,
    borderWidth: 2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '800',
  },
  historyItem: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  historyTitle: { fontSize: 14, fontWeight: '800', flex: 1 },
  historyMeta: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  historyLink: { fontSize: 12, fontWeight: '700', marginTop: 5 },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
