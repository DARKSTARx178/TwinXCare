import { ThemeContext } from '@/contexts/ThemeContext';
import React, { useContext, useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

type Props = {
  message?: string;
};

export default function SplashScreen({ message }: Props) {
  const { theme } = useContext(ThemeContext);
  const scale = useRef(new Animated.Value(0.98)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const dotAnims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const logoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.03, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.98, duration: 700, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ])
    );

    const fade = Animated.timing(fadeIn, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true });

    const dotLoops = dotAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(anim, { toValue: 1, duration: 420, easing: Easing.out(Easing.circle), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 420, easing: Easing.in(Easing.circle), useNativeDriver: true }),
          Animated.delay(180),
        ])
      )
    );

    fade.start();
    logoLoop.start();
    dotLoops.forEach(d => d.start());

    return () => {
      logoLoop.stop();
      fade.stop();
      dotLoops.forEach(d => d.stop());
    };
  }, [scale, fadeIn, dotAnims]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale }], opacity: fadeIn }]}>
        <View style={[styles.logoCircle, { backgroundColor: theme.primaryGlow, borderWidth: 1, borderColor: theme.border }]}>
          <Image source={require('@/assets/images/logo_all-white.png')} style={[styles.logo, { tintColor: theme.primary }]} />
        </View>
      </Animated.View>

      <View style={styles.textContainer}>
        <Animated.Text style={[styles.title, { color: theme.text, opacity: fadeIn }]}>TwinXCare</Animated.Text>
        <Animated.Text style={[styles.message, { color: theme.textDim, opacity: fadeIn }]}>{message || 'Authenticating secure session...'}</Animated.Text>
      </View>

      <View style={styles.loaderWrap} pointerEvents="none">
        <View style={styles.dotsRow}>
          {dotAnims.map((a, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: theme.primary },
                {
                  opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
                  transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoWrap: {
    marginBottom: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    opacity: 0.7,
  },
  loaderWrap: {
    justifyContent: 'center',
    height: 48,
    width: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 5,
  },
});
