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
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start', paddingBottom: 40, paddingHorizontal: 20 }}>
      <Image source={require('@/assets/images/logo_all-white.png')} style={{ height: 120, marginTop: 40, marginBottom: 10, width: 140 }} resizeMode='contain' />

      <View style={styles.headerContainer}>
        <Text style={[styles.title, { fontSize: responsiveText(textSize + 14), color: theme.text }]}>{t.home}</Text>
        <Text style={[styles.subtitle, { fontSize: responsiveText(textSize - 2), color: theme.textDim }]}>Premium Care Services</Text>
      </View>

      <View style={styles.row}>
        <TouchableOpacity onPress={() => router.push('/explore')} style={[styles.card, { backgroundColor: theme.surface, width: screenWidth / 2 - 30, borderWidth: 1, borderColor: theme.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primaryGlow }]}>
            <MaterialCommunityIcons name="hospital-box" size={32} color={theme.primary} />
          </View>
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize - 2), color: theme.text, fontWeight: '600' }]}>{t.bookEquipment}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/services')} style={[styles.card, { backgroundColor: theme.surface, width: screenWidth / 2 - 30, borderWidth: 1, borderColor: theme.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primaryGlow }]}>
            <MaterialCommunityIcons name="car-side" size={32} color={theme.primary} />
          </View>
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize - 2), color: theme.text, fontWeight: '600' }]}>{t.services}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity onPress={() => router.push('/assistance')} style={[styles.card, { backgroundColor: theme.surface, width: screenWidth - 40, flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 25, borderWidth: 1, borderColor: theme.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primaryGlow, marginRight: 20 }]}>
            <MaterialCommunityIcons name="hand-heart" size={32} color={theme.primary} />
          </View>
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize), color: theme.text, fontWeight: '600', marginTop: 0 }]}>Assistance</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textDim} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => router.push('../bookings' as any)}
        style={[styles.fullButton, { backgroundColor: theme.surface, borderWidth: 2, borderColor: theme.primary, width: screenWidth - 40 }]}
      >
        <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: theme.primary }]}>{t.myRentals}</Text>
      </TouchableOpacity>

      {!user ? (
        <View style={styles.authSection}>
          <Text style={[styles.welcome, { fontSize: responsiveText(textSize + 4), color: theme.text }]}>{t.welcome}</Text>
          <View style={styles.row}>
            <TouchableOpacity onPress={() => router.push('/register' as any)} style={[styles.outlineButton, { borderColor: theme.primary, width: screenWidth / 2 - 30 }]}>
              <Text style={[styles.outlineButtonText, { fontSize: responsiveText(textSize - 2), color: theme.primary }]}>{t.createAccount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/login' as any)}
              style={[styles.button, { backgroundColor: theme.surface, borderWidth: 2, borderColor: theme.primary, width: screenWidth / 2 - 30 }]}
            >
              <Text style={[styles.buttonText, { fontSize: responsiveText(textSize - 2), color: theme.primary }]}>{t.login}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => router.push('/feedback' as any)}
            style={[styles.button, { backgroundColor: theme.surface, borderWidth: 2, borderColor: theme.primary, width: screenWidth - 40, marginTop: 20 }]}
          >
            <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: theme.primary }]}>{t.submitFeedback}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ width: screenWidth - 40, marginTop: 30 }}>
        <OrderHistoryWidget />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '500',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    marginVertical: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  card: {
    padding: 24,
    margin: 8,
    borderRadius: 24,
    alignItems: 'center',
  },
  iconContainer: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  fullButton: {
    padding: 18,
    borderRadius: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  cardText: {
    marginTop: 8,
    textAlign: 'center',
  },
  authSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(129, 173, 231, 0.05)',
    padding: 25,
    borderRadius: 30,
  },
  welcome: {
    fontWeight: '700',
    marginBottom: 15,
  },
  button: {
    padding: 16,
    borderRadius: 14,
    margin: 8,
    alignItems: 'center',
  },
  outlineButton: {
    padding: 14,
    borderRadius: 14,
    margin: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  outlineButtonText: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
