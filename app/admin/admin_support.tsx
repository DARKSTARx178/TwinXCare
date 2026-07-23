import { ThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebase/firebase';

type SupportType = 'feedback' | 'request' | 'rejection';
type StatusFilter = 'all' | 'active' | 'archived';
type TypeFilter = 'all' | SupportType;

type SupportItem = {
  id: string;
  type: SupportType;
  username: string;
  message: string;
  createdAtLabel: string;
  archived: boolean;
  rating?: number;
};

const formatTimestamp = (value: any) => {
  if (!value?.toDate) return 'Pending timestamp';
  return value.toDate().toLocaleString();
};

const isOlderThan30Days = (value: any) => {
  if (!value?.toDate) return false;
  const createdAt = value.toDate().getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - createdAt >= thirtyDaysMs;
};

export default function AdminSupport() {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const [items, setItems] = useState<SupportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const loadData = useCallback(async () => {
    try {
      const feedbackSnap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
      const requestSnap = await getDocs(query(collection(db, 'requests'), orderBy('createdAt', 'desc')));

      const autoArchiveTasks: Promise<void>[] = [];

      feedbackSnap.docs.forEach((d) => {
        const data = d.data() as any;
        if (!data.archived && isOlderThan30Days(data.createdAt)) {
          autoArchiveTasks.push(updateDoc(doc(db, 'feedback', d.id), { archived: true }));
        }
      });

      requestSnap.docs.forEach((d) => {
        const data = d.data() as any;
        if (!data.archived && isOlderThan30Days(data.createdAt)) {
          autoArchiveTasks.push(updateDoc(doc(db, 'requests', d.id), { archived: true }));
        }
      });

      if (autoArchiveTasks.length) {
        await Promise.all(autoArchiveTasks);
      }

      const feedbackItems = feedbackSnap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          type: 'feedback' as SupportType,
          username: data.username || 'Anonymous',
          message: data.message || '-',
          rating: data.rating,
          archived: !!data.archived || isOlderThan30Days(data.createdAt),
          createdAtLabel: formatTimestamp(data.createdAt),
        };
      });

      const requestItems = requestSnap.docs.map((d) => {
        const data = d.data() as any;
        const type = data.type === 'rejection' ? 'rejection' : 'request';
        return {
          id: d.id,
          type: type as SupportType,
          username: data.username || 'Anonymous',
          message: data.message || '-',
          archived: !!data.archived || isOlderThan30Days(data.createdAt),
          createdAtLabel: formatTimestamp(data.createdAt),
        };
      });

      setItems([...feedbackItems, ...requestItems]);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter === 'active' && item.archived) return false;
      if (statusFilter === 'archived' && !item.archived) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (!keyword) return true;
      return item.username.toLowerCase().includes(keyword) || item.message.toLowerCase().includes(keyword);
    });
  }, [items, search, statusFilter, typeFilter]);

  const handleArchiveToggle = async (item: SupportItem) => {
    try {
      const collectionName = item.type === 'feedback' ? 'feedback' : 'requests';
      await updateDoc(doc(db, collectionName, item.id), { archived: !item.archived });
      setItems((prev) => prev.map((entry) => (entry.id === item.id && entry.type === item.type ? { ...entry, archived: !entry.archived } : entry)));
    } catch (error) {
      console.error('Error updating archive status:', error);
      Alert.alert('Error', 'Failed to update archive status.');
    }
  };

  const handleDelete = async (item: SupportItem) => {
    Alert.alert('Delete Entry', 'This action is irreversible.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const collectionName = item.type === 'feedback' ? 'feedback' : 'requests';
            await deleteDoc(doc(db, collectionName, item.id));
            setItems((prev) => prev.filter((entry) => !(entry.id === item.id && entry.type === item.type)));
          } catch (error) {
            console.error('Error deleting entry:', error);
            Alert.alert('Error', 'Failed to delete entry.');
          }
        },
      },
    ]);
  };

  const counts = useMemo(() => ({
    feedback: items.filter((x) => x.type === 'feedback').length,
    request: items.filter((x) => x.type === 'request').length,
    shown: filteredItems.length,
  }), [items, filteredItems]);

  const renderCard = (item: SupportItem) => (
    <View
      key={`${item.type}-${item.id}`}
      style={[
        styles.card,
        {
          backgroundColor: item.archived ? '#fffbea' : theme.surface,
          borderColor: item.archived ? '#fef3c7' : theme.border,
        },
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.username, { color: theme.text }]}>{item.username}</Text>
        <Text style={[styles.time, { color: theme.textDim }]}>{item.createdAtLabel}</Text>
      </View>

      <View style={styles.typeRow}>
        <Text style={[styles.typeBadge, { color: item.type === 'feedback' ? theme.primary : item.type === 'request' ? '#10b981' : '#ef4444' }]}> 
          {item.type === 'feedback' ? 'Feedback' : item.type === 'request' ? 'Assistance' : 'Rejection'}
        </Text>
        {item.archived && <Text style={[styles.archivedBadge, { color: theme.textDim }]}>Archived</Text>}
      </View>

      {item.type === 'feedback' && typeof item.rating === 'number' && (
        <Text style={[styles.meta, { color: theme.primary }]}>Rating: {item.rating}/5</Text>
      )}

      <Text style={[styles.message, { color: theme.text }]}>{item.message}</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
          onPress={() => handleArchiveToggle(item)}
        >
          <Ionicons name={item.archived ? 'archive-outline' : 'archive'} size={16} color={theme.text} />
          <Text style={[styles.actionText, { color: theme.text }]}>{item.archived ? 'Unarchive' : 'Archive'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: '#fecaca', backgroundColor: '#fff1f2' }]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={16} color="#dc2626" />
          <Text style={[styles.actionText, { color: '#dc2626' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
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
        <Text style={[styles.title, { color: theme.text }]}>Inbox</Text>
        <Text style={[styles.subtitle, { color: theme.textDim }]}>Feedback and assistance requests</Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search by username or message"
        placeholderTextColor={theme.textDim}
        autoCorrect={false}
        autoCapitalize="none"
        style={[styles.searchInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
      />

      <View style={styles.filterWrap}>
        {(['active', 'archived', 'all'] as StatusFilter[]).map((value) => (
          <TouchableOpacity
            key={value}
            onPress={() => setStatusFilter(value)}
            style={[
              styles.filterBtn,
              { borderColor: theme.border, backgroundColor: statusFilter === value ? theme.primaryGlow : theme.surface },
            ]}
          >
            <Text style={[styles.filterText, { color: theme.text }]}>{value[0].toUpperCase() + value.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterWrap}>
        {(['all', 'feedback', 'request', 'rejection'] as TypeFilter[]).map((value) => (
          <TouchableOpacity
            key={value}
            onPress={() => setTypeFilter(value)}
            style={[
              styles.filterBtn,
              { borderColor: theme.border, backgroundColor: typeFilter === value ? theme.primaryGlow : theme.surface },
            ]}
          >
            <Text style={[styles.filterText, { color: theme.text }]}>
              {value === 'all'
                ? 'All Types'
                : value === 'feedback'
                ? 'Feedback'
                : value === 'request'
                ? 'Assistance'
                : 'Rejections'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 30 }} />
      ) : (
        <>
          <Text style={[styles.summary, { color: theme.textDim }]}>Shown {counts.shown} | Feedback {counts.feedback} | Assistance {counts.request}</Text>
          <View style={styles.section}>
            {filteredItems.length === 0 ? (
              <Text style={[styles.empty, { color: theme.textDim }]}>No entries match your search/filter.</Text>
            ) : (
              filteredItems.map((item) => renderCard(item))
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
  header: { alignItems: 'center', marginBottom: 16 },
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
  searchInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12 },
  filterWrap: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  filterBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  filterText: { fontSize: 12, fontWeight: '700' },
  summary: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  section: { marginBottom: 22 },
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
  typeRow: { flexDirection: 'row', marginTop: 8, gap: 10, alignItems: 'center' },
  typeBadge: { fontSize: 12, fontWeight: '700' },
  archivedBadge: { fontSize: 11, fontWeight: '700' },
  meta: { marginTop: 8, fontSize: 12, fontWeight: '700' },
  message: { marginTop: 8, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 12, fontWeight: '700' },
});
