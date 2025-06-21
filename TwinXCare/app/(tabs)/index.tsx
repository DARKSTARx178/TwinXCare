import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { useNavigation } from 'expo-router';

export default function HomeScreen() {
  const { scheme, fontSize } = useAccessibility();
  const theme = getThemeColors(scheme);
  const textSize = getFontSizeValue(fontSize);
  const navigation = useNavigation<any>();
  const screenWidth = Dimensions.get('window').width;
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);

  // Mock order history for home page
  const orderHistory = [
    { id: '1', name: 'Oxygen Concentrator', date: '2025-06-21', status: 'Delivered', amount: 120, ongoing: true, quantity: 2 },
    { id: '2', name: 'Wheelchair', date: '2025-06-18', status: 'Delivered', amount: 60, ongoing: false, quantity: 1 },
    { id: '3', name: 'Hospital Bed', date: '2025-06-15', status: 'Returned', amount: 200, ongoing: false, quantity: 1 },
  ];

  // Handler for renew: go to renew page with renewal params
  const handleRenew = (order) => {
    navigation.navigate('renew', {
      ...order,
      stock: order.stock || 1, // fallback for mock data
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start', paddingBottom: 40 }}>
      <Text style={[styles.logo, { fontSize: responsiveText(textSize + 10), color: theme.text }]}>
        Home
      </Text>

      <View style={styles.row}>
        <TouchableOpacity onPress={() => navigation.navigate('explore')} style={[styles.card, { backgroundColor: theme.unselectedTab, width: screenWidth / 2 - 30 }]}>
          <Icon name="stethoscope" size={30} color={theme.text} />
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize), color: theme.text }]}>Book Equipment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: theme.unselectedTab, width: screenWidth / 2 - 30 }]}>
          <Icon name="handshake-o" size={30} color={theme.text} />
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize), color: theme.text }]}>Request a Caregiver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, { backgroundColor: theme.unselectedTab, width: screenWidth - 40 }]}>
          <Icon name="plus-square" size={30} color={theme.text} />
          <Text style={[styles.cardText, { fontSize: responsiveText(textSize), color: theme.text }]}>Require Assistance</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('myrentals')} style={[styles.fullButton, { backgroundColor: theme.primary, width: screenWidth - 40 }]}>
        <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: '#fff' }]}>My Rentals</Text>
      </TouchableOpacity>

      <Text style={[styles.welcome, { fontSize: responsiveText(textSize + 6), color: theme.text }]}>Welcome</Text>

      <View style={styles.row}>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, width: screenWidth / 2 - 20 }]}> {/* Responsive */}
          <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: '#fff' }]}>Create an Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, width: screenWidth / 2 - 20 }]}> {/* Responsive */}
          <Text style={[styles.buttonText, { fontSize: responsiveText(textSize), color: '#fff' }]}>Are you a Caregiver?</Text>
        </TouchableOpacity>
      </View>
      {/* Order History Section */}
      <Text style={{ color: theme.text, fontSize: responsiveText(textSize + 4), fontWeight: 'bold', marginTop: 32, marginBottom: 8 }}>Order History</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%', paddingLeft: 10 }}>
        {orderHistory.map(order => (
          <View key={order.id} style={{
            backgroundColor: theme.unselectedTab,
            borderRadius: 12,
            padding: 16,
            marginRight: 16,
            minWidth: 180,
            maxWidth: 220,
            alignItems: 'flex-start',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
            position: 'relative',
          }}>
            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: responsiveText(textSize) }}>{order.name}</Text>
            <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>Date: {order.date}</Text>
            <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>Status: {order.status}</Text>
            <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>Amount: ${order.amount}</Text>
            <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>Quantity: {order.quantity}</Text>
            {order.ongoing && (
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: theme.primary,
                  borderRadius: 16,
                  paddingVertical: 4,
                  paddingHorizontal: 12,
                  zIndex: 10,
                }}
                onPress={() => handleRenew(order)}
              >
                <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: responsiveText(textSize - 2) }}>Renew</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logo: {
    fontWeight: 'bold',
    marginVertical: 20,
  },
  logoPart: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  card: {
    padding: 20,
    margin: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullButton: {
    padding: 18,
    borderRadius: 12,
    marginVertical: 16,
    alignItems: 'center',
  },
  cardText: {
    marginTop: 10,
    textAlign: 'center',
  },
  welcome: {
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    margin: 10,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
