import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HelpDocs() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const { fontSize } = useAccessibility();
  const textSize = getFontSizeValue(fontSize);
  const screenWidth = Dimensions.get('window').width;
  const responsiveText = (base: number) => Math.max((base + textSize - 16) * (screenWidth / 400), (base + textSize - 16) * 0.85);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primaryGlow }]}>
          <Ionicons name="help-circle-outline" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(28) }]}>Support Center</Text>
        <Text style={[styles.subtitle, { color: theme.textDim, fontSize: responsiveText(14) }]}>How can we assist you today?</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="planet-outline" size={22} color={theme.primary} style={{ marginRight: 10 }} />
            <Text style={[styles.sectionTitle, { color: theme.text, fontSize: responsiveText(18) }]}>Getting Started</Text>
          </View>
          <Text style={[styles.text, { color: theme.textDim, fontSize: responsiveText(14) }]}>
            Welcome to TwinXCare! Our platform is designed to provide seamless care coordination, medical equipment rentals, and professional caregiving services.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="map-outline" size={22} color={theme.primary} style={{ marginRight: 10 }} />
            <Text style={[styles.sectionTitle, { color: theme.text, fontSize: responsiveText(18) }]}>Navigation Guide</Text>
          </View>

          <View style={styles.navItem}>
            <Text style={[styles.navLabel, { color: theme.text, fontSize: responsiveText(15) }]}>🏠 Home</Text>
            <Text style={[styles.navText, { color: theme.textDim, fontSize: responsiveText(13) }]}>Quick access to all main features and history.</Text>
          </View>

          <View style={styles.navItem}>
            <Text style={[styles.navLabel, { color: theme.text, fontSize: responsiveText(15) }]}>🛠 Book Equipment</Text>
            <Text style={[styles.navText, { color: theme.textDim, fontSize: responsiveText(13) }]}>Browse and rent medical items available for order.</Text>
          </View>

          <View style={styles.navItem}>
            <Text style={[styles.navLabel, { color: theme.text, fontSize: responsiveText(15) }]}>🤝 Services</Text>
            <Text style={[styles.navText, { color: theme.textDim, fontSize: responsiveText(13) }]}>Request caregivers or tailored professional assistance.</Text>
          </View>

          <View style={styles.navItem}>
            <Text style={[styles.navLabel, { color: theme.text, fontSize: responsiveText(15) }]}>📋 My Rentals</Text>
            <Text style={[styles.navText, { color: theme.textDim, fontSize: responsiveText(13) }]}>Manage active bookings and return equipment.</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles-outline" size={22} color={theme.primary} style={{ marginRight: 10 }} />
            <Text style={[styles.sectionTitle, { color: theme.text, fontSize: responsiveText(18) }]}>Common Questions</Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={[styles.question, { color: theme.text, fontSize: responsiveText(15) }]}>How do I reset my password?</Text>
            <Text style={[styles.answer, { color: theme.textDim, fontSize: responsiveText(13) }]}>Navigate to your profile and select Change Password to update credentials.</Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={[styles.question, { color: theme.text, fontSize: responsiveText(15) }]}>How do I contact support?</Text>
            <Text style={[styles.answer, { color: theme.textDim, fontSize: responsiveText(13) }]}>Submit an assistance request via the Assistance page or use the floating help button.</Text>
          </View>

          <View style={[styles.faqItem, { borderBottomWidth: 0 }]}>
            <Text style={[styles.question, { color: theme.text, fontSize: responsiveText(15) }]}>What is Escort Mode?</Text>
            <Text style={[styles.answer, { color: theme.textDim, fontSize: responsiveText(13) }]}>A specialized view for volunteers to manage their availability and matches.</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
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
    marginTop: 100,
    marginBottom: 30,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontWeight: '800', textAlign: 'center' },
  subtitle: { fontWeight: '500', marginTop: 4, textAlign: 'center' },
  content: { paddingBottom: 20 },
  card: {
    padding: 24,
    borderRadius: 28,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontWeight: '800' },
  text: { lineHeight: 22, fontWeight: '500' },
  navItem: { marginBottom: 16 },
  navLabel: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
  navText: { fontSize: 13, fontWeight: '500' },
  faqItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  question: { fontWeight: '700', fontSize: 15, marginBottom: 6 },
  answer: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
});
