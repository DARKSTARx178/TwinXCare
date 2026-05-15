import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  Dimensions,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function DeliveryPage() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const textSize = getFontSizeValue('medium');
  const screenWidth = Dimensions.get('window').width;

  const [user, setUser] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [entryFilter, setEntryFilter] = useState<'all' | 'orders' | 'bookings'>('all');

  const fetchUserHistory = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setUser(currentUser);
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      const combined = [
        ...(data.history || []).map((h: any) => ({ ...h, type: 'order' })),
        ...(data.booking || []).map((b: any) => ({ ...b, type: 'booking' })),
      ];
      combined.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
      setOrderHistory(combined);
    }
  };

  useEffect(() => {
    fetchUserHistory();
  }, []);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserHistory();
    setRefreshing(false);
  }, []);

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newSet = new Set(expandedOrders);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setExpandedOrders(newSet);
  };

  const visibleHistory = orderHistory
    .filter((entry) => {
      const status = String(entry.status || '').toLowerCase();
      return !(status.includes('completed') || status.includes('delivered'));
    })
    .filter((entry) => {
      if (entryFilter === 'orders') return entry.type === 'order';
      if (entryFilter === 'bookings') return entry.type === 'booking';
      return true;
    })
    .filter((entry) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const ref = String(entry.transactionId || '');
      const name = entry.type === 'order' ? String(entry.name || '') : String(entry.title || '');
      const details = entry.type === 'order'
        ? String(entry.deliveryAddress || '')
        : `${entry.timeSlot || ''} ${entry.description || ''}`;
      return `${name} ${ref} ${details}`.toLowerCase().includes(q);
    });

  const latest = visibleHistory.length > 0 ? visibleHistory[0] : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)')}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}>
          <Ionicons name="receipt-outline" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Delivery Tracker</Text>
        <Text style={[styles.subtitle, { color: theme.textDim }]}>
          Real-time updates on your equipment delivery status
        </Text>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBox, { backgroundColor: theme.unselectedTab }]}>
          <Ionicons name="search" size={18} color={theme.textDim} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search orders, bookings, reference..."
            placeholderTextColor={theme.textDim}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { borderColor: theme.primary, borderWidth: 1.5, backgroundColor: theme.surface }]}
          onPress={() =>
            setEntryFilter((prev) =>
              prev === 'all' ? 'orders' : prev === 'orders' ? 'bookings' : 'all'
            )
          }
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={18} color={theme.primary} />
          <Text style={[styles.filterBtnText, { color: theme.primary }]}>
            {entryFilter === 'all' ? 'All' : entryFilter === 'orders' ? 'Orders' : 'Bookings'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hero section: Latest Activity */}
      {latest ? (
        <View style={[styles.heroCard, { backgroundColor: theme.surface, borderWidth: 2, borderColor: theme.primary }]}>
          <View style={styles.heroHeader}>
            <Text style={[styles.heroType, { color: theme.primary }]}>
              {latest.type === 'order' ? 'LATEST ORDER' : 'LATEST BOOKING'}
            </Text>
            <View style={[styles.pulseDot, { backgroundColor: theme.primary }]} />
          </View>

          <Text style={[styles.heroTitle, { color: theme.text }]}>
            {latest.type === 'order' ? latest.name : latest.title}
          </Text>

          <View style={styles.heroGrid}>
            <View style={styles.heroItem}>
              <Text style={[styles.heroLabel, { color: theme.textDim }]}>STATUS</Text>
              <Text style={[styles.heroValue, { color: theme.primary }]}>
                {latest.status || (latest.type === 'order' ? 'Processing' : 'Confirmed')}
              </Text>
            </View>
            <View style={styles.heroItem}>
              <Text style={[styles.heroLabel, { color: theme.textDim }]}>DATE</Text>
              <Text style={[styles.heroValue, { color: theme.text }]}>
                {latest.type === 'order' ? formatDate(latest.orderTime).split(',')[0] : formatDate(latest.bookingDate).split(',')[0]}
              </Text>
            </View>
          </View>

          {latest.type === 'order' && latest.deliveryEta && (
            <View style={[styles.etaBanner, { backgroundColor: theme.primaryGlow }]}>
              <Ionicons name="time" size={18} color={theme.primary} />
              <Text style={[styles.etaText, { color: theme.primary }]}>
                Delivery ETA: {latest.deliveryEta}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.heroCard, { backgroundColor: theme.surface, padding: 40, alignItems: 'center', borderWidth: 2, borderColor: theme.border }]}>
          <Ionicons name="basket-outline" size={48} color={theme.textDim} style={{ opacity: 0.2 }} />
          <Text style={[styles.emptyHeroText, { color: theme.textDim }]}>No active deliveries found.</Text>
        </View>
      )}

      {/* Timeline section */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={[styles.historyTitle, { color: theme.text }]}>Timeline</Text>
          <View style={[styles.countBadge, { backgroundColor: '#F1F5F9' }]}>
            <Text style={styles.countText}>{visibleHistory.length}</Text>
          </View>
        </View>

        {visibleHistory.map((entry, idx) => {
          const expanded = expandedOrders.has(idx);
          const isOrder = entry.type === 'order';
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.9}
              onPress={() => toggleExpand(idx)}
              style={[styles.timelineCard, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
            >
              <View style={styles.timelineMain}>
                <View style={[styles.timelineIcon, { backgroundColor: isOrder ? '#eff6ff' : '#f5f3ff' }]}>
                  <Ionicons
                    name={isOrder ? "cube-outline" : "calendar-outline"}
                    size={20}
                    color={isOrder ? "#3b82f6" : "#8b5cf6"}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.timelineName, { color: theme.text }]}>
                    {isOrder ? `${entry.name} (x${entry.quantity})` : entry.title}
                  </Text>
                  <Text style={[styles.timelineDate, { color: theme.textDim }]}>
                    {isOrder ? formatDate(entry.orderTime) : formatDate(entry.bookingDate)}
                  </Text>
                </View>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.textDim}
                />
              </View>

              {expanded && (
                <View style={[styles.expandedContent, { borderTopColor: '#f1f5f9' }]}>
                  <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: theme.textDim }]}>Reference</Text>
                      <Text style={[styles.detailValue, { color: theme.text }]}>{isOrder ? entry.transactionId : 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: theme.textDim }]}>Total</Text>
                      <Text style={[styles.detailValue, { color: theme.text }]}>{isOrder ? `$${entry.totalPrice}` : 'Prepaid/Included'}</Text>
                    </View>
                  </View>

                  <View style={styles.descriptionBox}>
                    <Text style={[styles.detailLabel, { color: theme.textDim }]}>{isOrder ? 'Delivery Address' : 'Slot Details'}</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {isOrder ? entry.deliveryAddress : `${entry.timeSlot || 'Anytime'} • ${entry.description || 'No notes'}`}
                    </Text>
                  </View>

                  <View style={[styles.statusRow, { backgroundColor: '#f8fafc' }]}>
                    <Text style={[styles.statusLabel, { color: theme.textDim }]}>Final Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: theme.primaryGlow }]}>
                      <Text style={[styles.statusText, { color: theme.primary }]}>{entry.status || 'Confirmed'}</Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        {visibleHistory.length === 0 && (
          <View style={[styles.timelineCard, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }]}>
            <Ionicons name="hourglass-outline" size={32} color={theme.textDim} style={{ opacity: 0.4 }} />
            <Text style={[styles.emptyHeroText, { color: theme.textDim, marginTop: 8 }]}>No active results for current search/filter.</Text>
          </View>
        )}
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
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 4, textAlign: 'center', maxWidth: '85%' },
  searchSection: {
    marginHorizontal: 20,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  filterBtn: {
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  heroCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 32,
    marginBottom: 32,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroType: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 20,
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 20,
  },
  heroItem: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 8,
  },
  etaText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyHeroText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  historySection: {
    paddingHorizontal: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  timelineCard: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
  },
  timelineMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  detailGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  descriptionBox: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  }
});
