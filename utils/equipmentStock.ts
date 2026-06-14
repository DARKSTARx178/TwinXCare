export type EquipmentStockLocation = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  stock: number;
};

export const PICKUP_LOCATIONS: Omit<EquipmentStockLocation, 'stock'>[] = [
  {
    id: 'nuh',
    name: 'NUH Pickup Point',
    address: '5 Lower Kent Ridge Rd, Singapore 119074',
    latitude: 1.2966,
    longitude: 103.7764,
  },
  {
    id: 'sgh',
    name: 'SGH Pickup Point',
    address: 'Outram Rd, Singapore 169608',
    latitude: 1.2801,
    longitude: 103.8358,
  },
  {
    id: 'ttsh',
    name: 'TTSH Pickup Point',
    address: '11 Jln Tan Tock Seng, Singapore 308433',
    latitude: 1.3214,
    longitude: 103.8469,
  },
];

const getKnownPickup = (id: string) => PICKUP_LOCATIONS.find((location) => location.id === id);

export const normalizeEquipmentLocations = (data: any): EquipmentStockLocation[] => {
  const rawLocations = Array.isArray(data?.stockByLocation)
    ? data.stockByLocation
    : Array.isArray(data?.stockLocations)
      ? data.stockLocations
      : null;

  if (rawLocations) {
    return rawLocations.map((entry: any) => {
      const known = getKnownPickup(String(entry.id || entry.locationId || ''));
      return {
        id: String(entry.id || entry.locationId || known?.id || entry.name || 'warehouse'),
        name: String(entry.name || known?.name || 'Pickup Point'),
        address: String(entry.address || known?.address || entry.name || 'Pickup Point'),
        latitude: Number(entry.latitude ?? entry.lat ?? known?.latitude ?? 1.3521),
        longitude: Number(entry.longitude ?? entry.lon ?? known?.longitude ?? 103.8198),
        stock: Number(entry.stock || 0),
      };
    });
  }

  if (data?.locationStock && typeof data.locationStock === 'object') {
    return Object.entries(data.locationStock).map(([id, stock]) => {
      const known = getKnownPickup(id);
      return {
        id,
        name: known?.name || id,
        address: known?.address || id,
        latitude: known?.latitude ?? 1.3521,
        longitude: known?.longitude ?? 103.8198,
        stock: Number(stock || 0),
      };
    });
  }

  const fallback = PICKUP_LOCATIONS[0];
  return [{
    ...fallback,
    stock: Number(data?.stock || 0),
  }];
};

export const getTotalEquipmentStock = (locations: EquipmentStockLocation[]) =>
  locations.reduce((total, location) => total + Number(location.stock || 0), 0);

export const updateLocationStock = (
  data: any,
  locationId: string,
  quantity: number
) => {
  const locations = normalizeEquipmentLocations(data);
  const target = locations.find((location) => location.id === locationId);

  if (!target) {
    throw new Error('Selected pickup location was not found.');
  }

  if (target.stock < quantity) {
    throw new Error(`${target.name} does not have enough stock.`);
  }

  const updatedLocations = locations.map((location) => (
    location.id === locationId
      ? { ...location, stock: location.stock - quantity }
      : location
  ));

  return {
    stockByLocation: updatedLocations,
    stock: getTotalEquipmentStock(updatedLocations),
  };
};
