import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import app from '@/firebase/firebase';
import { EquipmentStockLocation, getNearestStockLocation, getTotalEquipmentStock, normalizeEquipmentLocations } from '@/utils/equipmentStock';
import { homeTranslations } from '@/utils/translations';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface EquipmentItem {
  docId: string;
  name: string;
  brand: string;
  stock: number;
  stockLocations: EquipmentStockLocation[];
  price: number;
  image: string;
  description?: string;
}

type UserLocation = {
  latitude: number;
  longitude: number;
};

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

export default function Explore() {
  const { lang } = useLanguage();
  const t = homeTranslations[lang];

  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [itemAvailability, setItemAvailability] = useState<EquipmentItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [viewMode, setViewMode] = useState<'equipment' | 'services'>('equipment');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLabel, setLocationLabel] = useState(t.showingTotalStock);

  const { theme } = useContext(ThemeContext);
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const numColumns = screenWidth < 768 ? 2 : 3;
  const itemWidth = (screenWidth - 52) / numColumns;

  const db = getFirestore(app);

  const convertGoogleDriveLink = useCallback((link: string) => {
    if (!link) return 'https://images.unsplash.com/photo-1576091160550-217359f49f4c?auto=format&fit=crop&q=80&w=200';
    const match = link.match(/\/d\/(.*?)\//);
    if (match && match[1]) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    return link;
  }, []);

  const fetchEquipment = useCallback(async () => {
    try {
      const colRef = collection(db, 'equipment');
      const snapshot = await getDocs(colRef);
      const items: EquipmentItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const stockLocations = normalizeEquipmentLocations(data);
        return {
          docId: doc.id,
          name: data.name || 'Unnamed Gear',
          brand: data.brand || 'Premium',
          price: data.price || 0,
          stock: getTotalEquipmentStock(stockLocations),
          stockLocations,
          description: data.description || '',
          image: convertGoogleDriveLink(data.image),
        };
      });
      setItemAvailability(items);
    } catch (err) { console.error(err); }
  }, [convertGoogleDriveLink, db]);

  const fetchServices = useCallback(async () => {
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
    } catch (err) { console.error(err); }
  }, [convertGoogleDriveLink, db]);

  useEffect(() => {
    if (viewMode === 'equipment') fetchEquipment();
    else fetchServices();
  }, [fetchEquipment, fetchServices, reloadKey, viewMode]);

  useEffect(() => {
    let mounted = true;

    const loadUserLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          if (mounted) setLocationLabel(t.showingTotalStock);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!mounted) return;
        setUserLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        setLocationLabel(t.showingStockNearestWarehouse);
      } catch (error) {
        console.warn(t.locationLookupFailed, error);
        if (mounted) setLocationLabel(t.showingTotalStock);
      }
    };

    loadUserLocation();

    return () => { mounted = false; };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setReloadKey(k => k + 1);
    setTimeout(() => setRefreshing(false), 800);
  };

  const getDisplayedEquipmentStock = (item: EquipmentItem) => {
    const nearestLocation = getNearestStockLocation(item.stockLocations, userLocation);
    return userLocation && nearestLocation ? Number(nearestLocation.stock || 0) : Number(item.stock || 0);
  };

  const getDisplayedWarehouseName = (item: EquipmentItem) => {
    if (!userLocation) return t.allWarehouses;
    return getNearestStockLocation(item.stockLocations, userLocation)?.name || t.nearestWarehouse;
  };

  let filteredItems: any[] = viewMode === 'equipment' ? itemAvailability : services;
  filteredItems = filteredItems.filter((item) =>
    (item.name + ' ' + (item.brand || item.company || '')).toLowerCase().includes(search.toLowerCase())
  );

  filteredItems = filteredItems.filter((item) => {
    if (viewMode === 'equipment') {
      const displayedStock = getDisplayedEquipmentStock(item);
      if (filterValue === 'in-stock') return displayedStock > 0;
      if (filterValue === 'out-of-stock') return displayedStock <= 0;
      return true;
    }
    if (filterValue === 'has-schedule') return Array.isArray(item.schedule) && item.schedule.length > 0;
    return true;
  });

  if (filterValue === 'price-low') {
    filteredItems = [...filteredItems].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  } else if (filterValue === 'price-high') {
    filteredItems = [...filteredItems].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  }

  const renderItem = ({ item }: { item: any }) => {
    const isEquipment = viewMode === 'equipment';
    const displayedStock = isEquipment ? getDisplayedEquipmentStock(item) : 0;
    const displayedWarehouseName = isEquipment ? getDisplayedWarehouseName(item) : '';
    return (
      <TouchableOpacity
        onPress={() => {
          if (isEquipment) {
            router.push({
              pathname: '/rental/order',
              params: {
                ...item,
                price: String(item.price),
                stock: String(item.stock),
                stockLocations: JSON.stringify(item.stockLocations),
              }
            });
          } else {
            router.push({
              pathname: '/rental/booking',
              params: { ...item, docId: item.id, price: String(item.price), schedule: item.schedule ? JSON.stringify(item.schedule) : undefined }
            });
          }
        }}
        activeOpacity={0.9}
        style={[styles.gridCard, { width: itemWidth, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
      >
        <View style={styles.imageWrap}>
          <Image source={{ uri: item.image }} style={styles.cardImage} />
          <View style={[styles.priceTag, { backgroundColor: theme.primary }]}>
            <Text style={styles.priceText}>${item.price}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.itemBrand, { color: theme.textDim }]} numberOfLines={1}>
            {isEquipment ? item.brand : item.company}
          </Text>
          <View style={styles.cardFooter}>
            <Ionicons name={isEquipment ? "cube-outline" : "time-outline"} size={12} color={theme.primary} />
            <Text style={[styles.footerText, { color: theme.primary }]}>
              {isEquipment ? `${displayedStock} in stock` : item.duration}
            </Text>
          </View>
          {isEquipment && (
            <Text style={[styles.locationStockText, { color: theme.textDim }]} numberOfLines={1}>
              {displayedWarehouseName}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={filteredItems}
        keyExtractor={(i) => i.docId || i.id}
        numColumns={numColumns}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <Text style={[styles.screenTitle, { color: theme.text }]}>{t.equipment}</Text>
            <Text style={[styles.screenSubtitle, { color: theme.textDim }]}>
              {t.exploreDesc}
            </Text>

            <View style={[styles.searchBox, { backgroundColor: theme.unselectedTab }]}>
              <Ionicons name="search" size={20} color={theme.textDim} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={t.searchPlaceholder}
                placeholderTextColor={theme.textDim + '80'}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <View style={[styles.tabContainer, { backgroundColor: theme.unselectedTab }]}>
              <TouchableOpacity
                style={[styles.tab, viewMode === 'equipment' && { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]}
                onPress={() => { setViewMode('equipment'); setFilterValue('all'); setShowFilterMenu(false); }}
              >
                <Ionicons name="medkit-outline" size={18} color={viewMode === 'equipment' ? theme.primary : theme.text} />
                <Text style={[styles.tabText, { color: viewMode === 'equipment' ? theme.primary : theme.text }]}>{t.equipment}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, viewMode === 'services' && { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.surface }]}
                onPress={() => { setViewMode('services'); setFilterValue('all'); setShowFilterMenu(false); }}
              >
                <Ionicons name="sparkles-outline" size={18} color={viewMode === 'services' ? theme.primary : theme.text} />
                <Text style={[styles.tabText, { color: viewMode === 'services' ? theme.primary : theme.text }]}>{t.services}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultsCount, { color: theme.text }]}>
                  {filteredItems.length} {viewMode} 
                </Text>
                {viewMode === 'equipment' && (
                  <Text style={[styles.locationHint, { color: theme.textDim }]}>{locationLabel}</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.filterBtn, { borderColor: theme.primary, borderWidth: 1.5, backgroundColor: theme.surface }]}
                onPress={() => setShowFilterMenu((v) => !v)}
              >
                <Ionicons name="options-outline" size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>
            {showFilterMenu && (
              <View style={[styles.filterMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {(viewMode === 'equipment'
                  ? [
                    ['all', 'All Equipment'],
                    ['in-stock', 'In Stock'],
                    ['out-of-stock', 'Out of Stock'],
                    ['price-low', 'Price Low to High'],
                    ['price-high', 'Price High to Low'],
                  ]
                  : [
                    ['all', 'All Services'],
                    ['has-schedule', 'Has Schedule'],
                    ['price-low', 'Price Low to High'],
                    ['price-high', 'Price High to Low'],
                  ]).map(([value, label]) => (
                    <TouchableOpacity
                      key={value}
                      style={[styles.filterOption, filterValue === value && { backgroundColor: theme.primaryGlow }]}
                      onPress={() => {
                        setFilterValue(value);
                        setShowFilterMenu(false);
                      }}
                    >
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 12 }}>{label}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="search-outline" size={64} color={theme.textDim} style={{ opacity: 0.2 }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t.noItemsMatch}</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textDim }]}>{t.tryGeneralTerms}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  headerArea: { marginTop: 80, marginBottom: 20 },
  screenTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 13, fontWeight: '600', marginTop: 4, marginBottom: 24 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
    borderRadius: 18,
    marginBottom: 20,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600' },
  tabContainer: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  tabText: { fontSize: 14, fontWeight: '800' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  resultsCount: { fontSize: 13, fontWeight: '800' },
  locationHint: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  filterBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  filterMenu: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 8,
    marginBottom: 14,
  },
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  gridCard: {
    margin: 6,
    borderRadius: 28,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.1,
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  priceTag: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priceText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  cardContent: { padding: 16 },
  itemName: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  itemBrand: { fontSize: 11, fontWeight: '600', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  locationStockText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyWrap: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginTop: 8, opacity: 0.6 },
});
