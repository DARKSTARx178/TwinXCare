import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { FlatList as RNFlatList } from 'react-native';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { getThemeColors } from '@/utils/theme';
import { getFontSizeValue } from '@/utils/fontSizes';
import { useItemOverview } from '@/assets/itemOverview';
import { useRouter } from 'expo-router';

interface EquipmentItem {
  name: string;
  brand: string;
  stock: number;
  price: number;
  image: string;
  description?: string; 
}

export let aiExploreFilterControl = { setSearch: undefined as undefined | ((v: string) => void) };

export default function Explore() {
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const itemAvailability = useItemOverview(reloadKey);
  const allBrands = Array.from(new Set(itemAvailability.map((item: EquipmentItem) => item.brand))) as string[];
  const allItems = Array.from(new Set(itemAvailability.map((item: EquipmentItem) => item.name))) as string[];
  const { scheme, fontSize } = useAccessibility();
  //@ts-ignore
  const theme = getThemeColors(scheme);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'brand' | 'item' | 'price' | 'availability' | null>(null);
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
    aiExploreFilterControl.setSearch = setSearch;
    return () => {
      aiExploreFilterControl.setSearch = undefined;
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setReloadKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 600); 
  };

  if (itemAvailability.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <Text style={{ color: theme.text, fontSize: 20 }}>Loading equipment...</Text>
      </View>
    );
  }

  let filteredItems = itemAvailability.filter((item) =>
    (item.name + ' ' + item.brand).toLowerCase().includes(search.toLowerCase())
  );

  if (filter) {
    if (filter === 'brand' && filterValue) {
      const val = filterValue.toLowerCase().replace(/\s+/g, '');
      filteredItems = filteredItems.filter((i) => {
        const brandNorm = i.brand.toLowerCase().replace(/\s+/g, '');
        return (
          brandNorm === val ||
          brandNorm.startsWith(val) ||
          brandNorm.includes(val) ||
          val.startsWith(brandNorm)
        );
      });
    }
    if (filter === 'item' && filterValue) {
      const val = filterValue.toLowerCase().replace(/\s+/g, '');
      filteredItems = filteredItems.filter((i) => {
        const nameNorm = i.name.toLowerCase().replace(/\s+/g, '');
        return (
          nameNorm === val ||
          nameNorm.startsWith(val) ||
          nameNorm.includes(val) ||
          val.startsWith(nameNorm)
        );
      });
    }
    if (filter === 'price' && filterValue) filteredItems = filteredItems.filter((i) => i.price <= parseFloat(filterValue));
    if (filter === 'availability') filteredItems = filteredItems.filter((i) => i.stock > 0);
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
        <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>Equipment</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: '#fff', color: '#000', fontSize: responsiveText(textSize) }
          ]}
          placeholder="Search equipment..."
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
            {['brand', 'item', 'price', 'availability'].map((f) => (
              <TouchableOpacity
                key={f}
                style={styles.dropdownMenuItem}
                onPress={() => {
                  setFilter(f as any);
                  setShowFilterDropdown(false);
                  setShowValueDropdown(f === 'brand' || f === 'item');
                  setFilterValue('');
                }}
              >
                <Text style={{ color: theme.text, fontSize: responsiveText(textSize-2) }}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {/* Value dropdown for brand/item */}
        {showValueDropdown && filter === 'brand' && (
          <View style={styles.dropdownMenu}>
            <RNFlatList
              data={allBrands}
              keyExtractor={(b) => String(b)}
              renderItem={({ item: b }) => (
                <TouchableOpacity
                  style={styles.dropdownMenuItem}
                  onPress={() => {
                    setFilterValue(b);
                    setShowValueDropdown(false);
                  }}
                >
                  <Text style={{ color: theme.text, fontSize: responsiveText(textSize-2) }}>{b}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        {showValueDropdown && filter === 'item' && (
          <View style={styles.dropdownMenu}>
            <RNFlatList
              data={allItems}
              keyExtractor={(i) => String(i)}
              renderItem={({ item: i }) => (
                <TouchableOpacity
                  style={styles.dropdownMenuItem}
                  onPress={() => {
                    setFilterValue(i);
                    setShowValueDropdown(false);
                  }}
                >
                  <Text style={{ color: theme.text, fontSize: responsiveText(textSize-2) }}>{i}</Text>
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
        {/* Equipment grid */}
        <FlatList
          data={filteredItems}
          keyExtractor={(_, index) => index.toString()}
          numColumns={numColumns}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/rental/order',
                params: {
                  name: item.name,
                  brand: item.brand,
                  price: String(item.price),
                  stock: String(item.stock),
                  image: item.image,
                  description: item.description || ''
                }
              })}
              activeOpacity={0.8}
              style={[styles.gridItem, { borderColor: theme.primary, maxWidth: `${100 / numColumns}%` }]}
            >
              {/* Adjust image height to allow more space for text */}
              <Image source={{ uri: item.image }} style={[
                styles.gridImage,
                {
                  width: screenWidth / numColumns - 32,
                  height: (screenWidth / numColumns - 32) * 0.7,
                  marginBottom: 8
                }
              ]} />
              <Text style={[styles.gridText, { color: theme.text, fontSize: gridTextSize(textSize), maxWidth: '95%' }]} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
              <Text style={[styles.gridText, { color: theme.text, fontSize: gridTextSize(textSize-2), maxWidth: '95%' }]} numberOfLines={1} ellipsizeMode="tail">{item.brand}</Text>
              <Text style={[styles.gridText, { color: theme.text, fontSize: gridTextSize(textSize-4), maxWidth: '95%' }]} numberOfLines={1} ellipsizeMode="tail">${Math.max(1, Math.round(item.price * 0.18))}/day | Stock: {item.stock}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[styles.gridText, { color: theme.text, fontSize: gridTextSize(textSize) }]}>No results found.</Text>
          }
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
  filterBar: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginHorizontal: 2,
  },
  filterBtnActive: {
    backgroundColor: '#dbeafe',
  },
  filterValueRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    justifyContent: 'center',
  },
  filterValueBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#eee',
    margin: 2,
  },
  filterValueBtnActive: {
    backgroundColor: '#a5b4fc',
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
  modeBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: -8,
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#dbeafe',
    borderWidth: 1.5,
    borderColor: '#4a90e2',
  },
  caregiverCard: {
    marginTop: 24,
    padding: 28,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
