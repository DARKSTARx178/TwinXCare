import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/splash');
    }, 100); // slight delay so the router is fully ready

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View>
      <Text>Redirecting...</Text>
    </View>
  );
}
