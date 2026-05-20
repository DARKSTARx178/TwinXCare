import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type CertCatalogItem = {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
};

type CertSubmission = {
  id: string;
  userEmail?: string;
  certTypeName?: string;
  certificateLink?: string;
  issueDate?: string;
  certNumber?: string;
  expiryDate?: string;
  photoUrl?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'revoked';
  createdAt?: any;
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

export default function AdminCertifications() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [catalog, setCatalog] = useState<CertCatalogItem[]>([]);
  const [submissions, setSubmissions] = useState<CertSubmission[]>([]);

  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [savingCatalog, setSavingCatalog] = useState(false);

  const loadData = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const role = userDoc.exists() ? String(userDoc.data().role || 'user') : 'user';
      if (role !== 'admin') {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);

      const [catalogSnap, submissionsSnap] = await Promise.all([
        getDocs(collection(db, CERT_CATALOG_PATH)),
        getDocs(collection(db, CERT_SUBMISSIONS_PATH)),
      ]);

      const catalogData = catalogSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

      const submissionsData = submissionsSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .sort((a, b) => {
          const aPending = a.status === 'pending' ? 0 : 1;
          const bPending = b.status === 'pending' ? 0 : 1;
          if (aPending !== bPending) return aPending - bPending;
          return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt);
        });

      setCatalog(catalogData as CertCatalogItem[]);
      setSubmissions(submissionsData as CertSubmission[]);
    } catch (error) {
      console.error('Failed to load certification admin data:', error);
      Alert.alert('Error', 'Unable to load certification admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const addCatalogItem = async () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert('Missing Name', 'Please enter a certification name.');
      return;
    }

    setSavingCatalog(true);
    try {
      await addDoc(collection(db, CERT_CATALOG_PATH), {
        name,
        description: newDescription.trim(),
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid ?? 'unknown',
        createdByEmail: auth.currentUser?.email ?? 'unknown',
      });
      setNewName('');
      setNewDescription('');
      await loadData();
    } catch (error) {
      console.error('Failed to create catalog item:', error);
      Alert.alert('Error', 'Unable to create certification item.');
    } finally {
      setSavingCatalog(false);
    }
  };

  const toggleCatalogActive = async (item: CertCatalogItem) => {
    try {
      await updateDoc(doc(db, CERT_CATALOG_PATH, item.id), {
        active: item.active === false,
        updatedAt: serverTimestamp(),
      });
      await loadData();
    } catch (error) {
      console.error('Failed to toggle catalog item:', error);
      Alert.alert('Error', 'Unable to update item status.');
    }
  };

  const removeCatalogItem = async (item: CertCatalogItem) => {
    Alert.alert('Delete Certification Type', `Delete "${item.name}" from catalog?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, CERT_CATALOG_PATH, item.id));
            await loadData();
          } catch (error) {
            console.error('Failed to delete catalog item:', error);
            Alert.alert('Error', 'Unable to delete item.');
          }
        },
      },
    ]);
  };

  const reviewSubmission = async (id: string, status: 'approved' | 'revoked') => {
    try {
      await updateDoc(doc(db, CERT_SUBMISSIONS_PATH, id), {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser?.uid ?? 'unknown',
        reviewedByEmail: auth.currentUser?.email ?? 'unknown',
        updatedAt: serverTimestamp(),
      });
      await loadData();
    } catch (error) {
      console.error('Failed to update submission:', error);
      Alert.alert('Error', 'Unable to review submission.');
    }
  };

  const counts = useMemo(() => ({
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    revoked: submissions.filter((s) => s.status === 'revoked').length,
  }), [submissions]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textDim }}>Loading...</Text>
      </View>
    );
  }

  if (!authorized) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background, paddingHorizontal: 24 }]}> 
        <Text style={[styles.deniedTitle, { color: theme.text }]}>Admin access required</Text>
        <Text style={[styles.deniedText, { color: theme.textDim }]}>This page is only available to admin accounts.</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backOnlyBtn, { borderColor: theme.primary }]}>
          <Text style={{ color: theme.primary, fontWeight: '800' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 50 }}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}> 
          <Ionicons name="ribbon" size={30} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Escort Certifications</Text>
        <Text style={[styles.subtitle, { color: theme.textDim }]}>Manage catalog items and review submissions</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#fff7ed' }]}>
          <Text style={styles.statNumber}>{counts.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#ecfdf5' }]}>
          <Text style={styles.statNumber}>{counts.approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fef2f2' }]}>
          <Text style={styles.statNumber}>{counts.revoked}</Text>
          <Text style={styles.statLabel}>Revoked</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <Text style={[styles.cardTitle, { color: theme.text }]}>Certification Catalog</Text>

        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Certification name (e.g. CPR)"
          placeholderTextColor="#94a3b8"
          value={newName}
          onChangeText={setNewName}
        />
        <TextInput
          style={[styles.input, styles.notesInput, { color: theme.text }]}
          placeholder="Description (optional)"
          placeholderTextColor="#94a3b8"
          value={newDescription}
          onChangeText={setNewDescription}
          multiline
        />

        <TouchableOpacity
          style={[styles.primaryBtn, { borderColor: theme.primary, backgroundColor: theme.surface }, savingCatalog && { opacity: 0.6 }]}
          onPress={addCatalogItem}
          disabled={savingCatalog}
        >
          <Text style={[styles.primaryBtnText, { color: theme.primary }]}>{savingCatalog ? 'Saving...' : 'Add Certification Type'}</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 12 }}>
          {catalog.length === 0 ? (
            <Text style={{ color: theme.textDim }}>No catalog items yet.</Text>
          ) : (
            catalog.map((item) => (
              <View key={item.id} style={[styles.catalogItem, { borderColor: theme.border }]}> 
                <View style={{ flex: 1 }}>
                  <Text style={[styles.catalogName, { color: theme.text }]}>{item.name}</Text>
                  {!!item.description && <Text style={[styles.catalogDesc, { color: theme.textDim }]}>{item.description}</Text>}
                  <Text style={[styles.catalogMeta, { color: item.active === false ? '#b91c1c' : '#047857' }]}>
                    {item.active === false ? 'Inactive' : 'Active'}
                  </Text>
                </View>
                <View style={styles.catalogActions}>
                  <TouchableOpacity onPress={() => toggleCatalogActive(item)} style={[styles.smallBtn, { borderColor: theme.primary }]}> 
                    <Text style={[styles.smallBtnText, { color: theme.primary }]}>{item.active === false ? 'Enable' : 'Disable'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeCatalogItem(item)} style={[styles.smallBtn, { borderColor: '#ef4444' }]}> 
                    <Text style={[styles.smallBtnText, { color: '#ef4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <Text style={[styles.cardTitle, { color: theme.text }]}>Review Submissions</Text>
        {submissions.length === 0 ? (
          <Text style={{ color: theme.textDim }}>No submissions found.</Text>
        ) : (
          submissions.map((item) => {
            const statusColor =
              item.status === 'approved' ? '#047857' : item.status === 'revoked' ? '#b91c1c' : '#9a3412';
            const statusBg =
              item.status === 'approved' ? '#ecfdf5' : item.status === 'revoked' ? '#fef2f2' : '#fff7ed';
            return (
              <View key={item.id} style={[styles.submissionItem, { borderColor: theme.border }]}> 
                <View style={styles.submissionHeader}>
                  <Text style={[styles.submissionTitle, { color: theme.text }]}>{item.certTypeName || 'Certification'}</Text>
                  <View style={[styles.badge, { backgroundColor: statusBg }]}> 
                    <Text style={[styles.badgeText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.metaText, { color: theme.textDim }]}>User: {item.userEmail || 'Unknown'}</Text>
                <Text style={[styles.metaText, { color: theme.textDim }]}>Submitted: {toDateLabel(item.createdAt)}</Text>
                {!!item.issueDate && <Text style={[styles.metaText, { color: theme.textDim }]}>Issue Date: {item.issueDate}</Text>}
                {!!item.certNumber && <Text style={[styles.metaText, { color: theme.textDim }]}>Cert ID/No: {item.certNumber}</Text>}
                {!!item.expiryDate && <Text style={[styles.metaText, { color: theme.textDim }]}>Expiry Date: {item.expiryDate}</Text>}
                {!!item.certificateLink && (
                  <Text style={[styles.linkText, { color: theme.primary }]} numberOfLines={1}>{item.certificateLink}</Text>
                )}
                {!!item.photoUrl && (
                  <Text style={[styles.linkText, { color: theme.primary }]} numberOfLines={1}>{item.photoUrl}</Text>
                )}
                {!!item.notes && <Text style={[styles.metaText, { color: theme.text }]}>{item.notes}</Text>}

                <View style={styles.reviewRow}>
                  <TouchableOpacity
                    style={[styles.reviewBtn, { borderColor: '#10b981' }]}
                    onPress={() => reviewSubmission(item.id, 'approved')}
                  >
                    <Text style={[styles.reviewText, { color: '#10b981' }]}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reviewBtn, { borderColor: '#ef4444' }]}
                    onPress={() => reviewSubmission(item.id, 'revoked')}
                  >
                    <Text style={[styles.reviewText, { color: '#ef4444' }]}>Revoke</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statNumber: { fontSize: 18, fontWeight: '900', color: '#111827' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' },
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
    minHeight: 64,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    borderWidth: 2,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  catalogItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catalogName: { fontSize: 14, fontWeight: '800' },
  catalogDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  catalogMeta: { fontSize: 11, fontWeight: '700', marginTop: 6 },
  catalogActions: { gap: 8 },
  smallBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  smallBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  submissionItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  submissionTitle: { fontSize: 14, fontWeight: '800', flex: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  metaText: { fontSize: 12, fontWeight: '500', marginBottom: 3 },
  linkText: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  reviewRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  reviewBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  reviewText: { fontSize: 12, fontWeight: '800' },
  deniedTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  deniedText: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: 16 },
  backOnlyBtn: {
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
