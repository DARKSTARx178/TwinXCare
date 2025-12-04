import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import app from '@/firebase/firebase'; // adjust path if needed
import { getFontSizeValue } from '@/utils/fontSizes';
import { useRouter } from 'expo-router';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, RefreshControl, FlatList as RNFlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface EquipmentItem {
  docId: string;       // add this
  name: string;
  brand: string;
  stock: number;
  price: number;
  image: string;
  description?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  brand?: string;
  duration: string;
  company: string;
  price: number;
  image: string;
  description?: string;
  schedule?: any[];
}


export let aiExploreFilterControl = { setSearch: undefined as undefined | ((v: string) => void) };

export default function Explore() {
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [itemAvailability, setItemAvailability] = useState<EquipmentItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]); // Added services state
  const [viewMode, setViewMode] = useState<'equipment' | 'services'>('equipment'); // Toggle state

  const { scheme, fontSize } = useAccessibility();
  const { theme } = useContext(ThemeContext);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'brand' | 'item' | 'price' | 'availability' | 'company' | null>(null);
  const [filterValue, setFilterValue] = useState<string>('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showValueDropdown, setShowValueDropdown] = useState(false);
  const textSize = getFontSizeValue(fontSize);
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const responsiveText = (base: number) => Math.max(base * (screenWidth / 400), base * 0.85);
  const numColumns = screenWidth < 950 ? 2 : 3;
  const gridTextSize = (base: number) => Math.max(base * (screenWidth / 400), base * 0.8);

  const db = getFirestore(app);

  useEffect(() => {
    aiExploreFilterControl.setSearch = setSearch;
    if (viewMode === 'equipment') {
      fetchEquipment();
    } else {
      fetchServices();
    }
    return () => {
      aiExploreFilterControl.setSearch = undefined;
    };
  }, [reloadKey, viewMode]);

  const fetchEquipment = async () => {
    try {
      const colRef = collection(db, 'equipment');
      const snapshot = await getDocs(colRef);
      const items: EquipmentItem[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        items.push({
          docId: doc.id,
          name: data.name || 'Unnamed',
          brand: data.brand || 'Unknown',
          price: data.price || 0,
          stock: data.stock || 0,
          description: data.description || '',
          image: convertGoogleDriveLink(data.image),
        });
      });
      setItemAvailability(items);
    } catch (err) {
      console.error('Error fetching equipment:', err);
    }
  };

  const fetchServices = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'services'));
      const items: ServiceItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          brand: data.brand,
          duration: data.duration,
          company: data.company,
          price: Number(data.price),
          image: convertGoogleDriveLink(data.image || ''),
          description: data.description || '',
          schedule: data.schedule || [],
        };
      });
      setServices(items);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const convertGoogleDriveLink = (link: string) => {
    if (!link) return '';
    const match = link.match(/\/d\/(.*?)\//);
    if (match && match[1]) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    return link;
  };

  const getNextAvailability = (schedule?: any[]) => {
    if (!schedule || schedule.length === 0) return 'No slots';
    const sorted = schedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const next = sorted[0];
    return `${next.date} ${next.from}-${next.to}`;
  };

  const getNextPax = (schedule?: any[]) => {
    if (!schedule || schedule.length === 0) return '-';
    const sorted = schedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted[0].pax || '-';
  };

  const allBrands = Array.from(new Set(itemAvailability.map((item) => item.brand))) as string[];
  const allItems = Array.from(new Set(itemAvailability.map((item) => item.name))) as string[];
  const allCompanies = Array.from(new Set(services.map(s => s.company)));

  const onRefresh = () => {
    setRefreshing(true);
    setReloadKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 600);
  };

  let filteredItems: any[] = viewMode === 'equipment' ? itemAvailability : services;

  filteredItems = filteredItems.filter((item) =>
    (item.name + ' ' + (item.brand || item.company || '')).toLowerCase().includes(search.toLowerCase())
  );

  if (filter) {
    if (filter === 'brand' && filterValue && viewMode === 'equipment') {
      const val = filterValue.toLowerCase().replace(/\s+/g, '');
      filteredItems = filteredItems.filter((i) => i.brand?.toLowerCase().replace(/\s+/g, '').includes(val));
    }
    if (filter === 'company' && filterValue && viewMode === 'services') {
      filteredItems = filteredItems.filter(s => s.company?.toLowerCase() === filterValue.toLowerCase());
    }
    if (filter === 'item' && filterValue) {
      const val = filterValue.toLowerCase().replace(/\s+/g, '');
      filteredItems = filteredItems.filter((i) => i.name.toLowerCase().replace(/\s+/g, '').includes(val));
    }
    if (filter === 'price' && filterValue) filteredItems = filteredItems.filter((i) => i.price <= parseFloat(filterValue));
    if (filter === 'availability' && viewMode === 'equipment') filteredItems = filteredItems.filter((i) => i.stock > 0);
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
        <Text style={[styles.title, { color: theme.text, fontSize: responsiveText(textSize + 8) }]}>Explore</Text>

        {/* Toggle Switch */}
        <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: theme.unselectedTab, borderRadius: 12, padding: 4 }}>
          <TouchableOpacity
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: viewMode === 'equipment' ? theme.primary : 'transparent' }}
            onPress={() => { setViewMode('equipment'); setFilter(null); }}
          >
            <Text style={{ fontWeight: 'bold', color: viewMode === 'equipment' ? '#fff' : theme.text }}>Equipment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: viewMode === 'services' ? theme.primary : 'transparent' }}
            onPress={() => { setViewMode('services'); setFilter(null); }}
          >
            <Text style={{ fontWeight: 'bold', color: viewMode === 'services' ? '#fff' : theme.text }}>Services</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.background, color: theme.text, fontSize: responsiveText(textSize) }
          ]}
          placeholder={`Search ${viewMode}...`}
          placeholderTextColor={theme.unselected}
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
            <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>
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
              <Text style={{ color: theme.primary, fontSize: responsiveText(textSize - 2) }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {showFilterDropdown && (
          <View style={styles.dropdownMenu}>
            {(viewMode === 'equipment' ? ['brand', 'item', 'price', 'availability'] : ['company', 'price']).map((f) => (
              <TouchableOpacity
                key={f}
                style={styles.dropdownMenuItem}
                onPress={() => {
                  setFilter(f as any);
                  setShowFilterDropdown(false);
                  setShowValueDropdown(f === 'brand' || f === 'item' || f === 'company');
                  setFilterValue('');
                }}
              >
                <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Value dropdowns */}
        {showValueDropdown && (
          <View style={styles.dropdownMenu}>
            <RNFlatList
              data={filter === 'brand' ? allBrands : filter === 'company' ? allCompanies : allItems}
              keyExtractor={(i) => String(i)}
              renderItem={({ item: i }) => (
                <TouchableOpacity
                  style={styles.dropdownMenuItem}
                  onPress={() => {
                    setFilterValue(i);
                    setShowValueDropdown(false);
                  }}
                >
                  <Text style={{ color: theme.text, fontSize: responsiveText(textSize - 2) }}>{i}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {filter === 'price' && (
          <TextInput
            style={[styles.input, { backgroundColor: '#fff', color: '#000', fontSize: responsiveText(textSize - 2), marginBottom: 10 }]}
            placeholder="Max price..."
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={filterValue}
            onChangeText={setFilterValue}
          />
        )}

        {/* Grid */}
        <FlatList
          data={filteredItems}
          keyExtractor={(_, index) => index.toString()}
          numColumns={numColumns}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                if (viewMode === 'equipment') {
                  router.push({
                    pathname: '/rental/order',
                    params: {
                      docId: item.docId,
                      name: item.name,
                      brand: item.brand,
                      price: String(item.price),
                      stock: String(item.stock),
                      image: item.image,
                      description: item.description || ''
                    }
                  });
                } else {
                  const params = {
                    ...item,
                    docId: item.id,
                    price: String(item.price),
                    schedule: item.schedule ? JSON.stringify(item.schedule) : undefined
                  };
                  router.push({ pathname: '/rental/booking', params });
                }
              }}
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

              {viewMode === 'equipment' ? (
                <>
                  <Text style={[styles.gridText, { color: theme.text, fontSize: gridTextSize(textSize - 2), maxWidth: '95%' }]} numberOfLines={1} ellipsizeMode="tail">{item.brand}</Text>
                  <Text style={[styles.gridText, { color: theme.text, fontSize: gridTextSize(textSize - 4), maxWidth: '95%' }]} numberOfLines={1} ellipsizeMode="tail">${item.price}/day | Stock: {item.stock}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.gridText, { color: theme.text, fontSize: gridTextSize(textSize - 4), maxWidth: '95%' }]} numberOfLines={1}>Next: {getNextAvailability(item.schedule)}</Text>
                  <Text style={[styles.gridText, { color: theme.text, fontSize: gridTextSize(textSize - 4), maxWidth: '95%' }]} numberOfLines={1}>${item.price}/hr | Pax: {getNextPax(item.schedule)}</Text>
                </>
              )}
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
    borderColor: '#aaa',
    borderWidth: 1,
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
    borderColor: '#aaa',
    borderWidth: 1,
    borderRadius: 8,
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