import { ThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebase/firebase';

type SupportItem = {
  id: string;
  username: string;
  message: string;
  createdAtLabel: string;
  rating?: number;
};

const formatTimestamp = (value: any) => {
  if (!value?.toDate) return 'Pending timestamp';
  return value.toDate().toLocaleString();
};

export default function AdminSupport() {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const [feedback, setFeedback] = useState<SupportItem[]>([]);
  const [requests, setRequests] = useState<SupportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const feedbackSnap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
      const requestSnap = await getDocs(query(collection(db, 'requests'), orderBy('createdAt', 'desc')));

      setFeedback(
        feedbackSnap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            username: data.username || 'Anonymous',
            message: data.message || '-',
            rating: data.rating,
            createdAtLabel: formatTimestamp(data.createdAt),
          };
        })
      );

      setRequests(
        requestSnap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            username: data.username || 'Anonymous',
            message: data.message || '-',
            createdAtLabel: formatTimestamp(data.createdAt),
          };
        })
      );
    } catch (error) {
      console.error('Error loading support data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderCard = (item: SupportItem, type: 'feedback' | 'request') => (
    <View key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
      <View style={styles.row}>
        <Text style={[styles.username, { color: theme.text }]}>{item.username}</Text>
        <Text style={[styles.time, { color: theme.textDim }]}>{item.createdAtLabel}</Text>
      </View>
      {type === 'feedback' && typeof item.rating === 'number' && (
        <Text style={[styles.meta, { color: theme.primary }]}>Rating: {item.rating}/5</Text>
      )}
      <Text style={[styles.message, { color: theme.text }]}>{item.message}</Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}>
          <Ionicons name="mail-open-outline" size={30} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Support Inbox</Text>
        <Text style={[styles.subtitle, { color: theme.textDim }]}>Feedback and assistance requests from users</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 30 }} />
      ) : (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Feedback ({feedback.length})</Text>
            {feedback.length === 0 ? (
              <Text style={[styles.empty, { color: theme.textDim }]}>No feedback submitted yet.</Text>
            ) : (
              feedback.map((item) => renderCard(item, 'feedback'))
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Assistance Requests ({requests.length})</Text>
            {requests.length === 0 ? (
              <Text style={[styles.empty, { color: theme.textDim }]}>No assistance requests submitted yet.</Text>
            ) : (
              requests.map((item) => renderCard(item, 'request'))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 70, paddingBottom: 40 },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  header: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { marginTop: 4, fontSize: 14, fontWeight: '500', textAlign: 'center' },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  empty: { fontSize: 13, fontWeight: '500' },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  username: { fontSize: 14, fontWeight: '700', flex: 1 },
  time: { fontSize: 11, fontWeight: '500' },
  meta: { marginTop: 8, fontSize: 12, fontWeight: '700' },
  message: { marginTop: 8, fontSize: 13, lineHeight: 19, fontWeight: '500' },
});
