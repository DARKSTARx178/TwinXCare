import { ThemeContext } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useContext } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebase/firebase';

const Logout: React.FC = () => {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const handleLogout = async () => {
    try {
      // Sign out from Firebase Auth
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
    Alert.alert('Success', 'User logged out successfully!');
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Logout</Text>
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleLogout}>
        <Text style={[styles.buttonText, { color: '#fff' }]}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  button: {
    width: '100%',
    maxWidth: 350,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default Logout;