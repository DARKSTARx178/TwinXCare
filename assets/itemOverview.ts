import { useEffect, useState } from 'react';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTmjIQicrO1-wWHpcDF5mtWnDzUMkNTywck7c6urmKmSpyCD7Jj-veUMB1R6NGC5ozX8ie1yHBS4IJ9/pub?gid=0&single=true&output=csv';

export type ItemOverview = {
    name: string;
    brand: string;
    stock: number;
    price: number;
    image: string;
    description: string;
    name_zh?: string;
    description_zh?: string;
};

export function useItemOverview(reloadKey?: number) {
    const [items, setItems] = useState<ItemOverview[]>([]);
    useEffect(() => {
        let cancelled = false;
        async function fetchData() {
            try {
                const res = await fetch(SHEET_CSV_URL + (reloadKey ? `&cachebust=${reloadKey}` : ''));
                const csv = await res.text();
                const [headerLine, ...rows] = csv.split('\n').filter(Boolean);
                const headers = headerLine.split(',').map(h => h.trim());
                const data: ItemOverview[] = rows.map(row => {
                    const cols = row.split(',');
                    return {
                        name: cols[0]?.trim() || '',
                        brand: cols[1]?.trim() || '',
                        stock: Number(cols[2]?.trim() || 0),
                        price: Number(cols[3]?.trim() || 0),
                        image: cols[4]?.trim() || '',
                        description: cols[5]?.trim() || '',
                        name_zh: cols[6]?.trim() || '',
                        description_zh: cols[7]?.trim() || '',
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