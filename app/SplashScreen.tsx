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
        <Image source={require('@/assets/images/logo_all-white.png')} style={[styles.logo, { tintColor: theme.primary }]} />
      </Animated.View>

      <Animated.Text style={[styles.title, { color: theme.text, opacity: fadeIn }]}>{message || 'Done'}</Animated.Text>

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
                  transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
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
    width: 180,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 180,
    height: 90,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 18,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 8,
  },
});
