import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Services() {
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
      // If Patient (Standard) or Admin -> Fetch Requests
      if (type === 'standard' || role === 'admin' || !type) {
        const q = query(collection(db, 'escort', 'request', 'entries'), where('userId', '==', uid));
        const snap = await getDocs(q);
        setMyRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }

      // If Escort or Admin -> Fetch Availabilities
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
    let color = theme.unselected;
    if (status === 'matched') color = '#10b981'; // green
    if (status === 'pending' || status === 'available') color = '#f59e0b'; // orange
    return (
      <View style={{ backgroundColor: color, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 }}>
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>{status}</Text>
      </View>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />}
    >
      <Text style={[styles.title, { color: theme.text, fontSize: textSize + 8 }]}>Escort Dashboard</Text>

      {/* ADMIN SECTION */}
      {userRole === 'admin' && (
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Admin Actions</Text>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.primary, alignItems: 'center' }]}
            onPress={() => router.push('/admin/admin_escort_match')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: textSize }}>Manage Matching</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PATIENT SECTION */}
      {((userType === 'standard') || (userRole === 'admin') || (!userType && !userRole)) && (
        <View style={{ marginBottom: 30 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>My Escort Requests</Text>

          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/escorts/require-escort')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: textSize }}>+ New Request</Text>
          </TouchableOpacity>

          {myRequests.length === 0 ? (
            <Text style={{ color: theme.unselected, fontStyle: 'italic' }}>No active requests.</Text>
          ) : (
            myRequests.map((req) => (
              <View key={req.id} style={[styles.card, { backgroundColor: theme.unselectedTab }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: textSize }}>{req.hospital}</Text>
                  <Text style={{ color: theme.text }}>{req.date}</Text>
                </View>
                <Text style={{ color: theme.text, marginTop: 4 }}>Time: {req.time}</Text>
                {renderStatusBadge(req.status)}
                {req.status === 'matched' && (
                  <Text style={{ color: theme.primary, marginTop: 8, fontWeight: 'bold' }}>
                    Matched with: {req.matchedProviderName || 'Volunteer'}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      )}

      {/* ESCORT SECTION */}
      {(userType === 'escort' || userRole === 'admin') && (
        <View style={{ marginBottom: 30 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>My Availability</Text>

          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/escorts/escort')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: textSize }}>+ Add Availability</Text>
          </TouchableOpacity>

          {myAvailabilities.length === 0 ? (
            <Text style={{ color: theme.unselected, fontStyle: 'italic' }}>No availability slots posted.</Text>
          ) : (
            myAvailabilities.map((avail) => (
              <View key={avail.id} style={[styles.card, { backgroundColor: theme.unselectedTab }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: textSize }}>{avail.location}</Text>
                  <Text style={{ color: theme.text }}>{avail.date}</Text>
                </View>
                <Text style={{ color: theme.text, marginTop: 4 }}>{avail.fromTime} - {avail.toTime}</Text>
                {renderStatusBadge(avail.status)}
                {avail.status === 'matched' && (
                  <Text style={{ color: theme.primary, marginTop: 8, fontWeight: 'bold' }}>
                    Matched! Check details.
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: 'bold', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  ctaButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  card: { padding: 16, borderRadius: 12, marginBottom: 12 },
});
