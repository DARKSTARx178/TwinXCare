import { ThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
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
      await signOut(auth);
      Alert.alert('Signed Out', 'You have been successfully logged out.');
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: '#fef2f2' }]}>
          <Ionicons name="log-out-outline" size={32} color="#ef4444" />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Security Sign-out</Text>
        <Text style={[styles.subtitle, { color: theme.textDim }]}>
          Are you sure you want to end your current session?
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Ionicons name="shield-checkmark-outline" size={48} color={theme.primary} style={{ marginBottom: 20 }} />
        <Text style={[styles.cardTitle, { color: theme.text }]}>Safe & Secure</Text>
        <Text style={[styles.cardSubtitle, { color: theme.textDim }]}>
          Logging out will clear your active session. You'll need to sign back in to access your data.
        </Text>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: '#ef4444' }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutBtnText}>Confirm Logout</Text>
          <Ionicons name="log-out" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.6}
        >
          <Text style={[styles.cancelBtnText, { color: theme.textDim }]}>Stay Logged In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 14, fontWeight: '500', marginTop: 4, textAlign: 'center', maxWidth: '80%' },
  card: {
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  logoutBtn: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
  },
  cancelBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
});

export default Logout;