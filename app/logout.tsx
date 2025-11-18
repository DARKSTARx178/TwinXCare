import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebase/firebase';

const Logout: React.FC = () => {
  const router = useRouter();
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
    <View style={styles.container}>
      <Text style={styles.title}>Logout</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  button: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#d00',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default Logout;