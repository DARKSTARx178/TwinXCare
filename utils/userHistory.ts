import * as SecureStore from 'expo-secure-store';

export type OrderHistoryItem = {
  id: string;
  name: string;
  brand?: string;
  date: string;
  status: string;
  amount: number;
  quantity: number;
  mode: 'buy' | 'rent';
  rentalStart?: string;
  rentalEnd?: string;
  image?: string;
  transactionId?: string;
  deliveryEta?: string;
};

export async function getOrderHistory(username: string): Promise<OrderHistoryItem[]> {
  const key = `orders_${username}`;
  const data = await SecureStore.getItemAsync(key);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function addOrderHistory(username: string, order: OrderHistoryItem): Promise<void> {
  const key = `orders_${username}`;
  const history = await getOrderHistory(username);
  history.unshift(order); // newest first
  await SecureStore.setItemAsync(key, JSON.stringify(history));
}
