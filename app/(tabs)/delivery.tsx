import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { homeTranslations } from '@/utils/translations';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
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
  const { lang } = useLanguage();
  const t = homeTranslations[lang];
  const { theme } = useContext(ThemeContext);
  const { fontSize } = useAccessibility();
  const textSize = getFontSizeValue(fontSize);

  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState<'all' | 'orders' | 'bookings' | 'processing' | 'pending' | 'confirmed'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const fetchUserHistory = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
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
      if (filterValue === 'orders') return entry.type === 'order';
      if (filterValue === 'bookings') return entry.type === 'booking';
      const status = String(entry.status || '').toLowerCase();
      if (filterValue === 'processing') return status.includes('processing');
      if (filterValue === 'pending') return status.includes('pending');
      if (filterValue === 'confirmed') return status.includes('confirmed');
      return true;
    })
    .filter((entry) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const ref = String(entry.transactionId || '');
      const name = entry.type === 'order' ? String(entry.name || '') : String(entry.title || '');
      const details = entry.type === 'order'
        ? `${entry.deliveryAddress || ''} ${entry.warehouseLocationName || ''} ${entry.warehouseLocationAddress || ''}`
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
      <View style={styles.headerArea}>
        <Text style={[styles.screenTitle, { color: theme.text, fontSize: textSize + 16 }]}>{t.delivery}</Text>
        <Text style={[styles.screenSubtitle, { color: theme.textDim, fontSize: textSize - 3 }]}>
          {t.equipmentDeliveryStatus}
        </Text>

        <View style={[styles.searchBox, { backgroundColor: theme.unselectedTab }]}>
          <Ionicons name="search" size={20} color={theme.textDim} />
          <TextInput
            style={[styles.searchInput, { color: theme.text, fontSize: textSize - 1 }]}
            placeholder={t.searchOrdersBookingsReference}
            placeholderTextColor={theme.textDim + '80'}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            style={[styles.searchFilterBtn, { borderColor: theme.primary, backgroundColor: theme.surface }]}
            onPress={() => setShowFilterMenu((v) => !v)}
          >
            <Ionicons name="options-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {showFilterMenu && (
          <View style={[styles.filterMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {[
              ['all', 'All Active'],
              ['orders', 'Orders'],
              ['bookings', 'Bookings'],
              ['processing', 'Processing'],
              ['pending', 'Pending'],
              ['confirmed', 'Confirmed'],
            ].map(([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[styles.filterOption, filterValue === value && { backgroundColor: theme.primaryGlow }]}
                onPress={() => {
                  setFilterValue(value as typeof filterValue);
                  setShowFilterMenu(false);
                }}
              >
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: textSize - 4 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {latest ? (
        <View style={[styles.heroCard, { backgroundColor: theme.surface, borderWidth: 2, borderColor: theme.primary }]}>
          <View style={styles.heroHeader}>
            <Text style={[styles.heroType, { color: theme.primary, fontSize: textSize - 6 }]}>
              {latest.type === 'order' ? 'LATEST ORDER' : 'LATEST BOOKING'}
            </Text>
            <View style={[styles.pulseDot, { backgroundColor: theme.primary }]} />
          </View>

          <Text style={[styles.heroTitle, { color: theme.text, fontSize: textSize + 6 }]}>
            {latest.type === 'order' ? latest.name : latest.title}
          </Text>

          <View style={styles.heroGrid}>
            <View style={styles.heroItem}>
              <Text style={[styles.heroLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>STATUS</Text>
              <Text style={[styles.heroValue, { color: theme.primary, fontSize: textSize - 1 }]}>
                {latest.status || (latest.type === 'order' ? 'Processing' : 'Confirmed')}
              </Text>
            </View>
            <View style={styles.heroItem}>
              <Text style={[styles.heroLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>DATE</Text>
              <Text style={[styles.heroValue, { color: theme.text, fontSize: textSize - 1 }]}>
                {latest.type === 'order' ? formatDate(latest.orderTime).split(',')[0] : formatDate(latest.bookingDate).split(',')[0]}
              </Text>
            </View>
          </View>

          {latest.type === 'order' && latest.deliveryEta && (
            <View style={[styles.etaBanner, { backgroundColor: theme.primaryGlow }]}>
              <Ionicons name="time" size={18} color={theme.primary} />
              <Text style={[styles.etaText, { color: theme.primary, fontSize: textSize - 3 }]}>
                Delivery ETA: {latest.deliveryEta}
              </Text>
            </View>
          )}

          {latest.type === 'order' && latest.warehouseLocationName && (
            <View style={[styles.etaBanner, { backgroundColor: '#f8fafc' }]}>
              <Ionicons name="business-outline" size={18} color={theme.primary} />
              <Text style={[styles.etaText, { color: theme.text, fontSize: textSize - 3 }]}>
                From: {latest.warehouseLocationName}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.heroCard, { backgroundColor: theme.surface, padding: 40, alignItems: 'center', borderWidth: 2, borderColor: theme.border }]}>
          <Ionicons name="basket-outline" size={48} color={theme.textDim} style={{ opacity: 0.2 }} />
          <Text style={[styles.emptyHeroText, { color: theme.textDim, fontSize: textSize - 2 }]}>No active deliveries.</Text>
        </View>
      )}

      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={[styles.historyTitle, { color: theme.text, fontSize: textSize + 4 }]}>Timeline</Text>
          <View style={[styles.countBadge, { backgroundColor: '#F1F5F9' }]}>
            <Text style={[styles.countText, { fontSize: textSize - 4 }]}>{visibleHistory.length}</Text>
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
                  <Text style={[styles.timelineName, { color: theme.text, fontSize: textSize - 2 }]}>
                    {isOrder ? `${entry.name} (x${entry.quantity})` : entry.title}
                  </Text>
                  <Text style={[styles.timelineDate, { color: theme.textDim, fontSize: textSize - 4 }]}>
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
                      <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>Reference</Text>
                      <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 3 }]}>{isOrder ? entry.transactionId : 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>Total</Text>
                      <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 3 }]}>{isOrder ? `$${entry.totalPrice}` : 'Prepaid/Included'}</Text>
                    </View>
                  </View>

                  <View style={styles.descriptionBox}>
                    <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>{isOrder ? 'Delivery Address' : 'Slot Details'}</Text>
                    <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 3 }]}>
                      {isOrder ? entry.deliveryAddress : `${entry.timeSlot || 'Anytime'} • ${entry.description || 'No notes'}`}
                    </Text>
                  </View>

                  {isOrder && entry.warehouseLocationName && (
                    <View style={styles.descriptionBox}>
                      <Text style={[styles.detailLabel, { color: theme.textDim, fontSize: textSize - 6 }]}>Warehouse Location</Text>
                      <Text style={[styles.detailValue, { color: theme.text, fontSize: textSize - 3 }]}>
                        {entry.warehouseLocationName}{entry.warehouseLocationAddress ? ` • ${entry.warehouseLocationAddress}` : ''}
                      </Text>
                    </View>
                  )}

                  <View style={[styles.statusRow, { backgroundColor: '#f8fafc' }]}>
                    <Text style={[styles.statusLabel, { color: theme.textDim, fontSize: textSize - 5 }]}>Final Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: theme.primaryGlow }]}>
                      <Text style={[styles.statusText, { color: theme.primary, fontSize: textSize - 6 }]}>{entry.status || 'Confirmed'}</Text>
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
            <Text style={[styles.emptyHeroText, { color: theme.textDim, fontSize: textSize - 2, marginTop: 8 }]}>No active deliveries.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerArea: { marginTop: 80, marginBottom: 20, paddingHorizontal: 20 },
  screenTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 13, fontWeight: '600', marginTop: 4, marginBottom: 24 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
    borderRadius: 18,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  searchFilterBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  filterMenu: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 8,
    marginBottom: 14,
  },
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
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
