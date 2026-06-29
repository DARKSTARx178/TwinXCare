import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemeContext } from '@/contexts/ThemeContext';
import { auth, db } from '@/firebase/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Tabs, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useContext, useState } from 'react';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { homeTranslations } from '@/utils/translations';
import { useLanguage } from '@/contexts/LanguageContext';

function TabLayout({ onHeaderSwipe }: { onHeaderSwipe?: () => void }) {
  const { lang } = useLanguage();
  const t = homeTranslations[lang];
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<string | null>(null);


  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchUsername = async () => {
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && isActive) {
            const data = userSnap.data();
            setProfileUser(data.username || user.email || null);
          }
        }
      };

      fetchUsername();
      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => (
          <View
            style={{
              height: 95,
              backgroundColor: theme.background,
              justifyContent: 'flex-end',
              flexDirection: 'row',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', padding: 10, flex: 1 }}>
              <TouchableOpacity
                onPress={() => router.push('/profile')}
                style={{
                  borderRadius: 50,
                  overflow: 'hidden',
                  width: 50,
                  height: 50,
                  backgroundColor: profileUser ? theme.primary : '#ccc',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 15,
                  marginTop: 25,
                }}
              >
                {profileUser ? (
                  <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: 28 }}>
                    {typeof profileUser === 'string' && profileUser.length > 0
                      ? profileUser.includes('@')
                        ? profileUser.split('@')[0].charAt(0).toUpperCase()
                        : profileUser.charAt(0).toUpperCase()
                      : '?'}
                  </Text>
                ) : (
                  <Image source={require('@/assets/images/noprofile.jpg')} style={{ width: 36, height: 36, borderRadius: 18 }} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ),
        headerShadowVisible: false,
        headerTitle: '',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.unselected,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 100 : 105,
          paddingBottom: Platform.OS === 'ios' ? 25 : 30,
          paddingTop: Platform.OS === 'ios' ? 15 : 10,
          backgroundColor: theme.background,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.home, tabBarIcon: ({ color }) => <IconSymbol name="house.fill" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>{t.home}</Text> }} />
      <Tabs.Screen name="explore" options={{ title: t.equipment, tabBarIcon: ({ color }) => <MaterialCommunityIcons name="hospital-box" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>{t.equipment}</Text> }} />
      <Tabs.Screen name="services" options={{ title: t.escort, tabBarIcon: ({ color }) => <MaterialCommunityIcons name="car-side" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>{t.escort}</Text> }} />
      <Tabs.Screen name="delivery" options={{ title: t.delivery, tabBarIcon: ({ color }) => <MaterialCommunityIcons name="car" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>{t.delivery}</Text> }} />
      <Tabs.Screen name="settings" options={{ title: t.settings, tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cog" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>{t.settings}</Text> }} />
    </Tabs>
  );
}

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TabLayout />
    </View>
  );
}
