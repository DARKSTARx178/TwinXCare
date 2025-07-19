import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { FlatList as RNFlatList } from 'react-native';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { useServiceList } from '@/hooks/useServiceList';
import { useRouter } from 'expo-router';



export interface ServiceItem {
  name: string;
  specialty: string;
  experience: string;
  price: number;
  image: string;
  description?: string;
}

const Services: React.FC = () => {
  // ...existing code...
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const serviceList = useServiceList(reloadKey);
  const allSpecialties = Array.from(new Set(serviceList.map((item: ServiceItem) => item.specialty))) as string[];
  const { scheme, fontSize } = useAccessibility();
  //@ts-ignore
  const theme = getThemeColors(scheme);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'specialty' | 'price' | null>(null);
  const [filterValue, setFilterValue] = useState<string>('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showValueDropdown, setShowValueDropdown] = useState(false);
  const textSize = getFontSizeValue(fontSize);
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);
  const numColumns = screenWidth < 950 ? 2 : 3;
  const gridTextSize = (base: number) => Math.max(base * (screenWidth / 400), base * 0.8);

  useEffect(() => {
    // No AI search setter for now
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setReloadKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 600);
  };

  if (serviceList.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <Text style={{ color: theme.text, fontSize: 20 }}>Loading services...</Text>
      </View>
    );
  }

  let filteredItems = serviceList.filter((item) =>
    (item.name + ' ' + item.specialty).toLowerCase().includes(search.toLowerCase())
  );

  if (filter) {
    if (filter === 'specialty' && filterValue) {
      const val = filterValue.toLowerCase().replace(/\s+/g, '');
      filteredItems = filteredItems.filter((i) => {
        const specNorm = i.specialty.toLowerCase().replace(/\s+/g, '');
        return (
          specNorm === val ||
          specNorm.startsWith(val) ||
          specNorm.includes(val) ||
          val.startsWith(specNorm)
        );
      });
    }
    if (filter === 'price' && filterValue) filteredItems = filteredItems.filter((i) => i.price <= parseFloat(filterValue));
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.primary]}
          tintColor={theme.primary}
        />
      }
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}> 
        <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>Services</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: '#fff', color: '#000', fontSize: responsiveText(textSize) }
          ]}
          placeholder="Search services..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
        {/* Filter dropdown */}
        <View style={styles.dropdownRow}>
          <TouchableOpacity
            style={[styles.dropdownBtn, filter && styles.dropdownBtnActive]}
            onPress={() => {
              setShowFilterDropdown(!showFilterDropdown);
              setShowValueDropdown(false);
            }}
          >
            <Text style={{ color: theme.text, fontSize: responsiveText(textSize-2) }}>
              {filter ? filter.charAt(0).toUpperCase() + filter.slice(1) : 'Filter By'}
            </Text>
          </TouchableOpacity>
          {filter && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                setFilter(null);
                setFilterValue('');
                setShowValueDropdown(false);
              }}
            >
              <Text style={{ color: theme.primary, fontSize: responsiveText(textSize-2) }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {showFilterDropdown && (
          <View style={styles.dropdownMenu}>
            {['specialty', 'price'].map((f) => (
              <TouchableOpacity
                key={f}
                style={styles.dropdownMenuItem}
                onPress={() => {
                  setFilter(f as any);
                  setShowFilterDropdown(false);
                  setShowValueDropdown(f === 'specialty');
                  setFilterValue('');
                }}
              >
                <Text style={{ color: theme.text, fontSize: responsiveText(textSize-2) }}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {showValueDropdown && filter === 'specialty' && (
          <View style={styles.dropdownMenu}>
            <RNFlatList
              data={allSpecialties}
              keyExtractor={(s) => String(s)}
              renderItem={({ item: s }) => (
                <TouchableOpacity
                  style={styles.dropdownMenuItem}
                  onPress={() => {
                    setFilterValue(s);
                    setShowValueDropdown(false);
                  }}
                >
                  <Text style={{ color: theme.text, fontSize: responsiveText(textSize-2) }}>{s}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        {filter === 'price' && (
          <TextInput
            style={[styles.input, { backgroundColor: '#fff', color: '#000', fontSize: responsiveText(textSize-2), marginBottom: 10 }]}
            placeholder="Max price..."
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={filterValue}
            onChangeText={setFilterValue}
          />
        )}
        {/* Service grid */}
        <FlatList
          data={filteredItems}
          keyExtractor={(_, index) => index.toString()}
          numColumns={numColumns}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/rental/booking',
                params: {
                  name: item.name,
                  specialty: item.specialty,
                  experience: item.experience,
                  price: String(item.price),
                  image: item.image,
                  description: item.description || ''
                }
              })}
              activeOpacity={0.8}
              style={[styles.gridItem, { borderColor: theme.primary, maxWidth: `${100 / numColumns}%` }]}
            >
              <Image source={{ uri: item.image }} style={[
                styles.gridImage,
                {
                  width: screenWidth / numColumns - 32,
                  height: (screenWidth / numColumns - 32) * 0.7,
                  marginBottom: 8
                }
              ]} />
              <Text style={[styles.gridText, { color: theme.text, fontSize: gridTextSize(textSize), maxWidth: '95%' }]} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
              <Text style={[styles.gridText, { color: theme.text, fontSize: gridTextSize(textSize-2), maxWidth: '95%' }]} numberOfLines={1} ellipsizeMode="tail">{item.specialty}</Text>
              <Text style={[styles.gridText, { color: theme.text, fontSize: gridTextSize(textSize-4), maxWidth: '95%' }]} numberOfLines={1} ellipsizeMode="tail">{item.experience} | ${item.price}/hr</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <Text style={[styles.gridText, { color: theme.text, fontSize: gridTextSize(textSize) }]}>No results found.</Text>
          )}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  input: {
    height: 45,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  item: {
    paddingVertical: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dropdownBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  dropdownBtnActive: {
    backgroundColor: '#dbeafe',
  },
  clearBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    maxHeight: 180,
    alignSelf: 'stretch',
  },
  dropdownMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 0.85,
    margin: 6,
    borderWidth: 2,
    borderColor: '#4a90e2',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    elevation: 2,
    overflow: 'hidden',
  },
  gridImage: {
    marginBottom: 12,
    borderRadius: 18,
    resizeMode: 'cover',
  },
  gridText: {
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default Services;
