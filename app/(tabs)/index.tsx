import OrderHistoryWidget from '@/components/OrderHistoryWidget';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { auth } from '@/firebase/firebase';
import { getFontSizeValue } from '@/utils/fontSizes';
import { homeTranslations } from '@/utils/translations';
import { useRouter } from 'expo-router';
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
  const { lang } = useLanguage();
  const t = homeTranslations[lang];

  useEffect(() => {
    const checkUser = () => {
      const currentUser = auth.currentUser;
      setUser(currentUser);
    };

    checkUser();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start', paddingBottom: 40 }}>
      <Image source={require('@/assets/images/logo_all-white.png')} style={{ height: 130, marginTop: 0, marginBottom: - 10, width: screenWidth - 295 }} resizeMode='stretch' />
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
      <Text>    </Text>
      <Text></Text>
      {/* Temporary: Notifications test button for quick access during development */}
      <TouchableOpacity onPress={() => router.push('/notifs/notifs' as any)} style={[styles.tempNotifButton, { backgroundColor: theme.primary, width: screenWidth - 40 }]}>
        <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: '#fff' }]}>temporary: notifs test</Text>
      </TouchableOpacity>

      {/* Order History Widget */}
      <OrderHistoryWidget />
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
