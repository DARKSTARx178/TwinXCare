import { IconSymbol } from '@/components/ui/IconSymbol';
import { AccessibilityProvider, useAccessibility } from '@/contexts/AccessibilityContext';
import { auth, db } from '@/firebase/firebase';
import { getThemeColors } from '@/utils/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GoogleGenAI } from '@google/genai';
import Voice from '@react-native-voice/voice';
import { useFocusEffect } from '@react-navigation/native';
import { Tabs, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  PermissionsAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { aiExploreFilterControl } from './explore';

let { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// IMPORTANT: do NOT commit API keys in source. Use secure storage / env variables.
const ai = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY || 'REPLACE_WITH_KEY' });

const AIModeContext = createContext({ enabled: false, toggle: () => { } });
export const useAIMode = () => useContext(AIModeContext);

const AnimatedAIModeOverlay: React.FC<{
  visible: boolean;
  onAIClick: () => void;
  aiInput: string;
  setAiInput: (v: string) => void;
  aiResponse: string;
  setAiResponse: (v: string) => void;
  showAiInput: boolean;
  setShowAiInput: (v: boolean) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  slideAnim: Animated.Value;
  handleAskGemini: () => void;
}> = ({
  visible,
  onAIClick,
  aiInput,
  setAiInput,
  aiResponse,
  setAiResponse,
  showAiInput,
  setShowAiInput,
  loading,
  setLoading,
  slideAnim,
  handleAskGemini,
}) => {
    const insets = useSafeAreaInsets();
    const borderAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.timing(borderAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start();
    }, []);

    const borderColor = borderAnim.interpolate({
      inputRange: [0, 0.33, 0.66, 1],
      outputRange: [
        'rgba(123,97,255,0.8)',
        'rgba(0,180,255,0.8)',
        'rgba(255,60,80,0.8)',
        'rgba(123,97,255,0.8)',
      ],
    });

    const glintColor = borderAnim.interpolate({
      inputRange: [0, 0.33, 0.66, 1],
      outputRange: [
        'rgba(123,97,255,0.7)',
        'rgba(0,180,255,0.7)',
        'rgba(255,60,80,0.7)',
        'rgba(123,97,255,0.7)',
      ],
    });

    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, [visible]);

    const [listening, setListening] = useState(false);
    const aiInputRef = useRef(aiInput);
    useEffect(() => {
      aiInputRef.current = aiInput;
    }, [aiInput]);

    useEffect(() => {
      const onSpeechResults = (event: { value?: string[] }) => {
        if (event.value && event.value.length > 0) {
          const current = aiInputRef.current;
          setAiInput(current ? current + ' ' + event.value.join(' ') : event.value.join(' '));
        }
      };
      const onSpeechEnd = () => setListening(false);
      const onSpeechError = (err: any) => {
        console.warn('Voice error', err);
        setListening(false);
      };

      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechError = onSpeechError;

      return () => {
        Voice.onSpeechResults = null;
        Voice.onSpeechEnd = null;
        Voice.onSpeechError = null;
        Voice.destroy().then(Voice.removeAllListeners).catch(() => { });
      };
    }, [setAiInput]);

    const requestMicPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
            title: 'Microphone Permission',
            message: 'App needs access to your microphone to convert speech to text.',
            buttonPositive: 'OK',
          });
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
          console.warn('Permission error', err);
          return false;
        }
      }
      // iOS permission handled by Info.plist. The user can reject in Settings.
      return true;
    };

    const handleVoiceToText = async () => {
      if (listening) {
        try {
          await Voice.stop();
        } catch (e) { }
        setListening(false);
        return;
      }

      const ok = await requestMicPermission();
      if (!ok) {
        console.warn('Microphone permission not granted');
        return;
      }

      setListening(true);
      try {
        await Voice.start('en-US');
      } catch (e) {
        setListening(false);
        console.error('Voice start error', e);
      }
    };

    const [replyCollapsed, setReplyCollapsed] = useState(false);

    return (
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: insets.bottom,
          opacity: fadeAnim,
        }}
        // set to auto for debugging; switch back to 'box-none' if you want touches to pass through
        pointerEvents="auto"
      >
        <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFillObject, { borderWidth: 8, borderColor }]} />
        <Animated.View
          pointerEvents="auto"
          style={{
            position: 'absolute',
            top: 30 + insets.top,
            left: 30,
            width: 120,
            height: 60,
            borderRadius: 45,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Animated.View
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 45,
              backgroundColor: glintColor,
              opacity: 0.7,
            }}
          />
          <TouchableOpacity onPress={onAIClick} style={{ position: 'absolute', left: 69, top: 14, width: 36, height: 25, zIndex: 2 }}>
            <MaterialCommunityIcons name="keyboard" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleVoiceToText} style={{ position: 'absolute', left: 20, top: 14, width: 36, height: 25, justifyContent: 'flex-start', zIndex: 2 }}>
            <Ionicons name={listening ? 'mic' : 'mic-outline'} size={28} color={listening ? '#0ff' : '#fff'} />
          </TouchableOpacity>

          <Animated.View
            style={{
              position: 'absolute',
              left: 120,
              top: 0,
              height: 60,
              width: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 260] }),
              opacity: slideAnim,
              backgroundColor: 'rgba(123,97,255,0.15)',
              borderRadius: 45,
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 16] }),
              paddingRight: 12,
              overflow: 'hidden',
              zIndex: 1,
            }}
          >
            {showAiInput && (
              <>
                <TextInput
                  style={{
                    flex: 1,
                    color: '#fff',
                    fontSize: 16,
                    padding: 10,
                    marginRight: 8,
                    marginLeft: 15,
                    backgroundColor: 'transparent',
                  }}
                  placeholder="Ask Gemini..."
                  placeholderTextColor="#eee"
                  value={aiInput}
                  onChangeText={setAiInput}
                  editable={!loading}
                />
                <TouchableOpacity onPress={handleAskGemini} disabled={loading || !aiInput.trim()} style={{ zIndex: 2 }}>
                  <Ionicons name="send" size={24} color={loading ? '#aaa' : '#fff'} />
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </Animated.View>

        {aiResponse ? (
          <Animated.View
            style={{
              position: 'absolute',
              top: 100 + insets.top,
              left: 30,
              minWidth: 220,
              maxWidth: 380,
              backgroundColor: 'rgba(123,97,255,0.15)',
              borderRadius: 45,
              padding: replyCollapsed ? 8 : 16,
              zIndex: 100,
              maxHeight: replyCollapsed ? 48 : 220,
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setReplyCollapsed((c) => !c)}
              style={{ flexDirection: 'row', alignItems: 'center', zIndex: 2 }}
            >
              <Ionicons name={replyCollapsed ? 'chevron-down' : 'chevron-up'} size={22} color="#fff" style={{ marginRight: 8 }} />
            </TouchableOpacity>
            {!replyCollapsed && (
              <ScrollView>
                <Text style={{ color: '#fff', fontSize: 16 }}>{aiResponse}</Text>
              </ScrollView>
            )}
          </Animated.View>
        ) : null}
      </Animated.View>
    );
  };

// ---------------- TabLayout and RootLayout with AI commands & help button ----------------

function TabLayout({ onHeaderSwipe }: { onHeaderSwipe: () => void }) {
  const { scheme } = useAccessibility();
  //@ts-ignore
  const theme = getThemeColors(scheme);
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
            const data: any = userSnap.data();
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

  const panX = useRef(new Animated.Value(0)).current;
  const headerPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 20,
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 50) {
          onHeaderSwipe();
        }
        panX.setValue(0);
      },
      onPanResponderMove: Animated.event([null, { dx: panX }], { useNativeDriver: false }),
    })
  ).current;

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
            {...headerPanResponder.panHandlers}
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
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <IconSymbol name="house.fill" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>Home</Text> }} />
      <Tabs.Screen name="explore" options={{ title: 'Equipment', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="hospital-box" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>Equipment</Text> }} />
      <Tabs.Screen name="services" options={{ title: 'Services', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-heart" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>Services</Text> }} />
      <Tabs.Screen name="delivery" options={{ title: 'Delivery', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="car" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>Delivery</Text> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cog" size={32} color={color} />, tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>Settings</Text> }} />
    </Tabs>
  );
}

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  // Recalculate screen dims on orientation change so initial positions are correct on iOS
  useEffect(() => {
    const onChange = ({ window }: { window: { width: number; height: number } }) => {
      SCREEN_WIDTH = window.width;
      SCREEN_HEIGHT = window.height;
    };

    const subscription: any = (Dimensions as any).addEventListener ? (Dimensions as any).addEventListener('change', onChange) : null;

    if (!subscription) {
      Dimensions.addEventListener('change', onChange);
    }

    return () => {
      if (subscription && typeof subscription.remove === 'function') subscription.remove();
      else Dimensions.removeEventListener && Dimensions.removeEventListener('change', onChange as any);
    };
  }, []);

  // Initialize pan values using insets so button doesn't sit under notch/home indicator on iOS
  const initialX = SCREEN_WIDTH - 74 - (insets.right || 0);
  const initialY = (SCREEN_HEIGHT / 2 - 40) + (insets.top ? 0 : 0);
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const panValue = useRef({ x: initialX, y: initialY });
  const [debugCoords, setDebugCoords] = useState<{ x: number; y: number }>({ x: Math.round(initialX), y: Math.round(initialY) });
  // Ensure initial position is applied after insets/dimensions are available (important on iOS)
  useEffect(() => {
    const x = SCREEN_WIDTH - 74 - (insets.right || 0);
    const y = SCREEN_HEIGHT / 2 - 40;
    pan.setValue({ x, y });
    panValue.current = { x, y };
    // update debug coords when initial is set
    setDebugCoords({ x: Math.round(x), y: Math.round(y) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insets.left, insets.right, insets.top, insets.bottom]);

  // Add listeners to Animated values so we can display live coords for debugging
  useEffect(() => {
    const lx = pan.x.addListener(({ value }) => setDebugCoords((p) => ({ ...p, x: Math.round(value) })));
    const ly = pan.y.addListener(({ value }) => setDebugCoords((p) => ({ ...p, y: Math.round(value) })));
    return () => {
      pan.x.removeListener(lx);
      pan.y.removeListener(ly);
    };
  }, [pan.x, pan.y]);
  const [aiMode, setAIMode] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const toggleAIMode = useCallback(() => setAIMode((v) => !v), []);

  useEffect(() => {
    console.log('[RootLayout] aiMode=', aiMode);
  }, [aiMode]);

  const allowedRoutes = ['/profile', '/helpdocs', '/settings', '/explore', '/delivery', '/index'];

  const handleAICommand = useCallback(
    (responseTextOrRoute: string) => {
      const searchActionMatch = responseTextOrRoute.match?.(/ACTION:search:(.*)/i);
      if (searchActionMatch && typeof aiExploreFilterControl.setSearch === 'function') {
        aiExploreFilterControl.setSearch(searchActionMatch[1].trim());
      }
      if (typeof responseTextOrRoute === 'string' && responseTextOrRoute.startsWith('/') && allowedRoutes.includes(responseTextOrRoute)) {
        router.push(responseTextOrRoute as any);
        return;
      }
      const lower = responseTextOrRoute.toLowerCase();
      const routeKeywords = [
        { keywords: ['profile', 'user profile'], route: '/profile' },
        { keywords: ['helpdocs', 'help docs'], route: '/helpdocs' },
        { keywords: ['settings', 'app settings'], route: '/settings' },
        { keywords: ['explore', 'equipment'], route: '/explore' },
        { keywords: ['delivery'], route: '/delivery' },
        { keywords: ['home', 'index', 'main page'], route: '/index' },
      ];
      for (const { keywords, route } of routeKeywords) {
        for (const keyword of keywords) {
          if (lower.includes(`go to ${keyword}`) || lower.includes(`open ${keyword}`) || lower.includes(keyword)) {
            router.push(route as any);
            return;
          }
        }
      }
    },
    [router]
  );

  const handleAskGemini = async () => {
    setLoading(true);
    try {
      const systemPrompt = `You are an assistant for a medical equipment rental app. For equipment requests reply ACTION:search:{keywords}. For app navigation reply /route. If unrelated, reply NONE.`;
      const userMessage = `${systemPrompt}\n\nUser: ${aiInput}`;
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      });
      const text = res?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response';
      if (/^ACTION:search:/i.test(text) || text.trim() === 'NONE' || allowedRoutes.includes(text.trim())) {
        setAiResponse('');
      } else {
        setAiResponse(text);
      }
      handleAICommand(text);
    } catch (e: any) {
      console.error(e);
      setAiResponse('Error: ' + (e as Error).message);
    }
    setLoading(false);
  };

  const helpPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: panValue.current.x, y: panValue.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        // Remove offset first and then read the final animated values via stopAnimation
        pan.flattenOffset();
        // stopAnimation callbacks give us the final numeric values which are reliable
        pan.x.stopAnimation((finalX: number) => {
          pan.y.stopAnimation((finalY: number) => {
            let x = finalX ?? panValue.current.x;
            let y = finalY ?? panValue.current.y;
            console.log('[Help Button] onPanResponderRelease final coords', { finalX: x, finalY: y, insets, SCREEN_WIDTH, SCREEN_HEIGHT });
            // Respect safe area insets on iOS
            const leftLimit = 8 + (insets.left || 0);
            const rightLimit = SCREEN_WIDTH - 64 - (insets.right || 0);
            const topLimit = (insets.top || 0) + 24;
            const bottomLimit = SCREEN_HEIGHT - (insets.bottom || 0) - 80;
            if (x < leftLimit) x = leftLimit;
            if (x > rightLimit) x = rightLimit;
            if (y < topLimit) y = topLimit;
            if (y > bottomLimit) y = bottomLimit;
            // Update animated value to clamped values and store
            pan.setValue({ x, y });
            panValue.current = { x, y };
            // update debug coords after clamping
            setDebugCoords({ x: Math.round(x), y: Math.round(y) });
          });
        });
      },
    })
  ).current;

  const handleAIFloatingIslandClick = () => {
    setShowAiInput((prev) => {
      const next = !prev;
      Animated.timing(slideAnim, {
        toValue: next ? 1 : 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      if (!next) Keyboard.dismiss();
      return next;
    });
  };

  return (
    <AIModeContext.Provider value={{ enabled: aiMode, toggle: toggleAIMode }}>
      <AccessibilityProvider>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TabLayout onHeaderSwipe={toggleAIMode} />

          {aiMode && (
            <AnimatedAIModeOverlay
              visible={aiMode}
              onAIClick={handleAIFloatingIslandClick}
              aiInput={aiInput}
              setAiInput={setAiInput}
              aiResponse={aiResponse}
              setAiResponse={setAiResponse}
              showAiInput={showAiInput}
              setShowAiInput={setShowAiInput}
              loading={loading}
              setLoading={setLoading}
              slideAnim={slideAnim}
              handleAskGemini={handleAskGemini}
            />
          )}

          <Animated.View style={{ position: 'absolute', transform: [{ translateX: pan.x }, { translateY: pan.y }] }} {...helpPanResponder.panHandlers}>
            <TouchableOpacity
              onPress={() => router.push('/helpdocs')}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#7B61FF',
                borderRadius: 28,
                width: 56,
                height: 56,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Ionicons name="help" size={36} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

          {/* Dev-only debug overlay to help diagnose iOS layout issues */}
          {__DEV__ && (
            <View
              pointerEvents="none"
              style={{ position: 'absolute', top: insets.top + 8, right: insets.right + 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 8 }}
            >
              <Text style={{ color: '#fff', fontSize: 12 }}>Platform: {Platform.OS}</Text>
              <Text style={{ color: '#fff', fontSize: 12 }}>Screen: {Math.round(SCREEN_WIDTH)} x {Math.round(SCREEN_HEIGHT)}</Text>
              <Text style={{ color: '#fff', fontSize: 12 }}>Insets T/L/B/R: {insets.top}/{insets.left}/{insets.bottom}/{insets.right}</Text>
              <Text style={{ color: '#fff', fontSize: 12 }}>Help X/Y: {debugCoords.x}/{debugCoords.y}</Text>
            </View>
          )}

          {/* Debug toggle for AI mode - remove in production */}
          {__DEV__ && (
            <Animated.View style={{ position: 'absolute', left: 20, bottom: 120 }}>
              <TouchableOpacity
                onPress={() => { console.log('DEBUG: toggling AI mode'); toggleAIMode(); }}
                style={{ backgroundColor: '#ff7b61', padding: 8, borderRadius: 8 }}
              >
                <Text style={{ color: '#fff' }}>Toggle AI</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </AccessibilityProvider>
    </AIModeContext.Provider>
  );
}
