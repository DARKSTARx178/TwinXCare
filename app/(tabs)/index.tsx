import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { homeTranslations } from '@/utils/translations';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function HomeScreen() {
  const { scheme, fontSize } = useAccessibility();
  const { theme } = useContext(ThemeContext);
  const textSize = getFontSizeValue(fontSize);
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);

  const [user, setUser] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const { lang } = useLanguage();
  const t = homeTranslations[lang];

  useEffect(() => {
    const fetchUserHistory = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setUser(null);
        setOrderHistory([]);
        return;
      }
      setUser(currentUser);

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setOrderHistory(data.history || []);
        } else {
          setOrderHistory([]);
        }
      } catch (err) {
        console.error('Error fetching order history:', err);
        setOrderHistory([]);
      }
    };

    fetchUserHistory();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start', paddingBottom: 40 }}>
      <Image source={require('@/assets/images/logo_all-white.png')} style={{ width: 120, height: 60, marginTop: 0, marginBottom: 5 }} />
      <Text style={[styles.logo, { fontSize: responsiveText(textSize + 10), color: theme.text }]}>{t.home}</Text>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => router.push('/explore')} style={[styles.card, { backgroundColor: theme.unselectedTab, width: screenWidth / 2 - 30 }]}>
          <MaterialCommunityIcons name="hospital-box" size={32} color={theme.icon} />
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize), color: theme.text }]}>{t.bookEquipment}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/services')} style={[styles.card, { backgroundColor: theme.unselectedTab, width: screenWidth / 2 - 30 }]}>
          <MaterialCommunityIcons name="account-heart" size={32} color={theme.icon} />
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize), color: theme.text }]}>{t.services}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity onPress={() => router.push('/assistance')} style={[styles.card, { backgroundColor: theme.unselectedTab, width: screenWidth - 40 }]}>
          <MaterialCommunityIcons name="hand-heart" size={32} color={theme.icon} />
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize), color: theme.text }]}>Assistance</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('../bookings' as any)} style={[styles.fullButton, { backgroundColor: theme.primary, width: screenWidth - 40 }]}>
        <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: '#fff' }]}>{t.myRentals}</Text>
      </TouchableOpacity>

      {!user ? (
        <>
          <Text style={[styles.welcome, { fontSize: responsiveText(textSize + 6), color: theme.text }]}>{t.welcome}</Text>
          <View style={styles.row}>
            <TouchableOpacity onPress={() => router.push('/register' as any)} style={[styles.button, { backgroundColor: theme.primary, width: screenWidth / 2 - 20 }]}>
              <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: '#fff' }]}>{t.createAccount}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/login' as any)} style={[styles.button, { backgroundColor: theme.primary, width: screenWidth / 2 - 20 }]}>
              <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: '#fff' }]}>{t.login}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.row}>
          <TouchableOpacity onPress={() => router.push('/feedback' as any)} style={[styles.button, { backgroundColor: theme.primary, width: screenWidth - 40 }]}>
            <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: '#fff' }]}>{t.submitFeedback}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Temporary: Notifications test button for quick access during development */}
      <TouchableOpacity onPress={() => router.push('/notifs/notifs' as any)} style={[styles.tempNotifButton, { backgroundColor: theme.primary, width: screenWidth - 40 }]}>
        <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: '#fff' }]}>Notifications Test</Text>
      </TouchableOpacity>

      {/* Order History Section */}
      <Text style={{ color: theme.text, fontSize: responsiveText(textSize + 4), fontWeight: 'bold', marginTop: 32, marginBottom: 8 }}>{t.orderHistory}</Text>
      {!user ? (
        <Text style={{ color: theme.unselected, fontSize: textSize }}>{t.signInToSeeHistory}</Text>
      ) : orderHistory.length === 0 ? (
        <Text style={{ color: theme.unselected, fontSize: textSize }}>{t.noOrders}</Text>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%', paddingLeft: 10 }}>
            {orderHistory.slice(0, 3).map((order, idx) => (
              <View key={idx} style={{
                backgroundColor: theme.unselectedTab,
                borderRadius: 12,
                padding: 16,
                marginRight: 16,
                minWidth: 180,
                maxWidth: 220,
                alignItems: 'flex-start',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
                position: 'relative',
              }}>
                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: responsiveText(textSize) }}>{order.name}</Text>
                <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>{t.amount}: ${order.totalPrice}</Text>
                {order.rentalStart && order.rentalEnd && (
                  <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>{t.rental}: {order.rentalStart} - {order.rentalEnd}</Text>
                )}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={() => router.push('/delivery')} style={{ marginTop: 12, alignSelf: 'flex-end', marginRight: 24 }}>
            <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: textSize }}>{t.seeFullHistory}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logo: {
    fontWeight: 'bold',
    marginVertical: 20,
  },
  logoPart: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  card: {
    padding: 20,
    margin: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullButton: {
    padding: 18,
    borderRadius: 12,
    marginVertical: 16,
    alignItems: 'center',
  },
  cardText: {
    marginTop: 10,
    textAlign: 'center',
  },
  welcome: {
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    margin: 10,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  tempNotifButton: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 12,
    alignItems: 'center',
  },
});
