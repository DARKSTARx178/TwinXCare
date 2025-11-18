import { db } from '@/firebase/firebase';

import { arrayUnion, doc, getDoc, setDoc } from 'firebase/firestore';

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
  address?: string;
  latitude?: number;
  longitude?: number;
};

export async function getOrderHistory(): Promise<OrderHistoryItem[]> {
  try {
    const uid = await SecureStore.getItemAsync('uid');
    if (!uid) return [];
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists() && userDoc.data()?.history) {
      return userDoc.data().history;
    }
    return [];
  } catch (e) {
    console.warn('Error fetching order history:', e);
    return [];
  }
}

export async function addOrderToHistory(order: OrderHistoryItem): Promise<void> {
  try {
    const uid = await SecureStore.getItemAsync('uid');
    if (!uid) return;
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, { history: arrayUnion(order) }, { merge: true });
  } catch (e) {
    console.warn('Error saving order to history:', e);
  }
}
