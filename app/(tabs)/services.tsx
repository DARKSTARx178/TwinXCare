import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { triggerManualMatching } from '@/services/matchingService';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { homeTranslations } from '@/utils/translations';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Services() {
  const { lang } = useLanguage();
  const t = homeTranslations[lang];
  const { theme } = useContext(ThemeContext);
  const { fontSize } = useAccessibility();
  const textSize = getFontSizeValue(fontSize);
  const router = useRouter();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myAvailabilities, setMyAvailabilities] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUserId(u.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            const data: any = userDoc.data();
            setUserRole(data.role ?? null);
            setUserType(data.userType ?? null);
            setUserRating(data.rating ?? null);
            setRatingCount(data.ratingCount ?? 0);
            fetchUserData(u.uid, data.role, data.userType);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setUserRole(null);
        setUserType(null);
        setUserId(null);
        setMyRequests([]);
        setMyAvailabilities([]);
      }
    });
    return () => unsub();
  }, []);

  const fetchUserData = async (uid: string, role: string, type: string) => {
    try {
      if (type === 'standard' || role === 'admin' || !type) {
        const q = query(collection(db, 'escort', 'request', 'entries'), where('userId', '==', uid));
        const snap = await getDocs(q);
        setMyRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }

      if (type === 'escort' || role === 'admin') {
        const q = query(collection(db, 'escort', 'availability', 'entries'), where('providerId', '==', uid));
        const snap = await getDocs(q);
        setMyAvailabilities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (userId) fetchUserData(userId, userRole || '', userType || '');
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderStatusBadge = (status: string) => {
    let color = '#94a3b8'; 
    let bgColor = '#f8fafc';

    const s = status.toLowerCase();

    if (s === 'pending' || s === 'available') {
      color = '#ef4444'; bgColor = '#fef2f2'; 
    } else if (s === 'matched') {
      color = '#f59e0b'; bgColor = '#fffbeb'; 
    } else if (s === 'confirmed') {
      color = '#10b981'; bgColor = '#ecfdf5'; 
    } else if (s === 'completed') {
      color = '#94a3b8'; bgColor = '#f8fafc'; 
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusText, { color }]}>{status.toUpperCase()}</Text>
      </View>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />}
    >
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}>
          <Ionicons name="shield-outline" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{t.escort}</Text>
        <Text style={[styles.subtitle, { color: theme.textDim }]}>
          {(userRole === 'admin' || userType === 'escort')
            ? t.escort
            : t.requestEscort}
        </Text>
      </View>

      {userRole === 'admin' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.adminOnly}</Text>
            <Ionicons name="lock-closed-outline" size={16} color={theme.primary} />
          </View>
          <TouchableOpacity
            style={[styles.adminCard, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]}
            onPress={async () => {
              const count = await triggerManualMatching();
              Alert.alert('Matching Complete', `Re evaluated ${count} requests.`);
              onRefresh();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-circle-outline" size={24} color={theme.primary} />
            <Text style={[styles.adminCardText, { color: theme.primary }]}>{t.reload}</Text>
            <Ionicons name="play" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>
      )}

      {((userType === 'standard') || (userRole === 'admin') || (!userType && !userRole)) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.requests}</Text>
            <TouchableOpacity onPress={() => router.push('/escorts/require-escort')}>
              <View style={[styles.addButton, { borderColor: theme.primary, borderWidth: 1.5, backgroundColor: theme.surface }]}>
                <Ionicons name="add" size={20} color={theme.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {myRequests.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
              <Ionicons name="document-text-outline" size={40} color={theme.textDim} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyText, { color: theme.textDim }]}>No active requests found.</Text>
            </View>
          ) : (
            myRequests.map((req) => (
              <TouchableOpacity
                key={req.id}
                style={[styles.itemCard, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/escorts/escort', params: { jobId: req.id, type: 'request' } })}
              >
                <View style={styles.cardInfo}>
                  <Text style={[styles.hospitalName, { color: theme.text }]}>{req.hospital}</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={14} color={theme.textDim} />
                    <Text style={[styles.detailText, { color: theme.textDim }]}>{req.date} at {req.time}</Text>
                  </View>
                </View>
                {renderStatusBadge(req.status)}
                {req.status === 'matched' && (
                  <View style={[styles.matchInfo, { backgroundColor: theme.primaryGlow }]}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                    <Text style={[styles.matchText, { color: theme.primary }]}>
                      Volunteer Assigned
                    </Text>
                  </View>
                )}
                {req.status === 'confirmed' && (
                  <View style={[styles.matchInfo, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="lock-closed" size={16} color="#059669" />
                    <Text style={[styles.matchText, { color: '#059669' }]}>Job Confirmed & Locked</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* ESCORT SECTION */}
      {(userType === 'escort' || userRole === 'admin') && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Volunteering Slots</Text>
              {userRating !== null && (
                <View style={styles.inlineRating}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.inlineRatingText}>{userRating.toFixed(1)}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => router.push('/escorts/escort')}>
              <View style={[styles.addButton, { borderColor: theme.primary, borderWidth: 1.5, backgroundColor: theme.surface }]}>
                <Ionicons name="add" size={20} color={theme.primary} />
              </View>
            </TouchableOpacity>
          </View>

          {myAvailabilities.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
              <Ionicons name="calendar-clear-outline" size={40} color={theme.textDim} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyText, { color: theme.textDim }]}>No slots specified.</Text>
            </View>
          ) : (
            myAvailabilities.map((avail) => (
              <TouchableOpacity
                key={avail.id}
                style={[styles.itemCard, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/escorts/escort', params: { jobId: avail.id, type: 'availability' } })}
              >
                <View style={styles.cardInfo}>
                  <Text style={[styles.hospitalName, { color: theme.text }]}>{avail.location}</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={14} color={theme.textDim} />
                    <Text style={[styles.detailText, { color: theme.textDim }]}>{avail.date} • {avail.fromTime} - {avail.toTime}</Text>
                  </View>
                </View>
                {renderStatusBadge(avail.status)}
                {avail.status === 'matched' && (
                  <View style={[styles.matchInfo, { backgroundColor: theme.primaryGlow }]}>
                    <Ionicons name="heart" size={16} color={theme.primary} />
                    <Text style={[styles.matchText, { color: theme.primary }]}>Patient assigned</Text>
                  </View>
                )}
                {avail.status === 'confirmed' && (
                  <View style={[styles.matchInfo, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="lock-closed" size={16} color="#059669" />
                    <Text style={[styles.matchText, { color: '#059669' }]}>Job Confirmed & Locked</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 80,
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
  subtitle: { fontSize: 14, fontWeight: '500', marginTop: 4, textAlign: 'center', maxWidth: '85%' },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    gap: 16,
  },
  adminCardText: {
    flex: 1,
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  itemCard: {
    padding: 20,
    borderRadius: 28,
    marginBottom: 12,
  },
  cardInfo: {
    marginBottom: 12,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  matchInfo: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 40,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  inlineRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  inlineRatingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f59e0b',
  },
});
