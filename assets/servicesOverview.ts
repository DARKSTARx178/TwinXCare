import { useEffect, useState } from 'react';

const CAREGIVER_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTmjIQicrO1-wWHpcDF5mtWnDzUMkNTywck7c6urmKmSpyCD7Jj-veUMB1R6NGC5ozX8ie1yHBS4IJ9/pub?gid=1208047198&single=true&output=csv'; 

export type CaregiverItem = {
  name: string;
  specialty: string;
  experience: string;
  price: number;
  image: string;
  description: string;
};

export function useCaregiverList(reloadKey?: number) {
  const [items, setItems] = useState<CaregiverItem[]>([]);
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await fetch(CAREGIVER_CSV_URL + (reloadKey ? `&cachebust=${reloadKey}` : ''));
        const csv = await res.text();
        const [headerLine, ...rows] = csv.split('\n').filter(Boolean);
        const headers = headerLine.split(',').map(h => h.trim());
        const data: CaregiverItem[] = rows.map(row => {
          const cols = row.split(',');
          return {
            name: cols[0]?.trim() || '',
            specialty: cols[1]?.trim() || '',
            experience: cols[2]?.trim() || '',
            price: Number(cols[3]?.trim() || 0),
            image: cols[4]?.trim() || '',
            description: cols[5]?.trim() || '',
          };
        });
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) setItems([]);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [reloadKey]);
  return items;
}
