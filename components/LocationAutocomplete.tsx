import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export type SelectedLocation = {
    address: string;
    latitude: number;
    longitude: number;
};

type GeoapifyResult = {
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    lat?: number;
    lon?: number;
    properties?: {
        formatted?: string;
        address_line1?: string;
        address_line2?: string;
        lat?: number;
        lon?: number;
    };
    geometry?: {
        coordinates?: [number, number];
    };
};

type Props = {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    onLocationSelected?: (location: SelectedLocation | null) => void;
    placeholder?: string;
    disabled?: boolean;
    theme: any;
};

const autocompleteUrl = process.env.EXPO_PUBLIC_GEOAPIFY_AUTOCOMPLETE_URL?.trim();
const configuredApiKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY?.trim();

function getApiKeyFromUrl() {
    const match = autocompleteUrl?.match(/[?&]apiKey=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

function appendParam(url: string, key: string, value: string) {
    if (new RegExp(`[?&]${key}=`).test(url)) {
        return url;
    }

    return `${url}${url.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(value)}`;
}

function buildAutocompleteUrl(text: string) {
    const encodedText = encodeURIComponent(text);

    if (autocompleteUrl) {
        let url = autocompleteUrl
            .replace('{text}', encodedText)
            .replace('ADDRESS_TEXT', encodedText)
            .replace(/([?&]text=)[^&]*/, `$1${encodedText}`);

        if (!/[?&]text=/.test(url)) {
            url = `${url}${url.includes('?') ? '&' : '?'}text=${encodedText}`;
        }

        url = appendParam(url, 'format', 'json');
        url = appendParam(url, 'limit', '5');
        return url;
    }

    if (!configuredApiKey) {
        return '';
    }

    return `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodedText}&filter=countrycode:sg&format=json&limit=5&apiKey=${encodeURIComponent(configuredApiKey)}`;
}

function getAddress(result: GeoapifyResult) {
    const data = result.properties || result;
    return data.formatted || [data.address_line1, data.address_line2].filter(Boolean).join(', ');
}

function getCoordinates(result: GeoapifyResult) {
    const data = result.properties || result;
    const longitude = data.lon ?? result.geometry?.coordinates?.[0];
    const latitude = data.lat ?? result.geometry?.coordinates?.[1];

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return null;
    }

    return { latitude, longitude };
}

export default function LocationAutocomplete({
    label,
    value,
    onChangeText,
    onLocationSelected,
    placeholder = 'Search address',
    disabled = false,
    theme,
}: Props) {
    const [suggestions, setSuggestions] = useState<GeoapifyResult[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
    const [loading, setLoading] = useState(false);
    const apiKey = configuredApiKey || getApiKeyFromUrl();
    const hasGeoapifyConfig = Boolean(autocompleteUrl || configuredApiKey);

    useEffect(() => {
        if (!hasGeoapifyConfig || disabled || value.trim().length < 3) {
            setSuggestions([]);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            try {
                setLoading(true);
                const response = await fetch(buildAutocompleteUrl(value), { signal: controller.signal });
                const data = await response.json();
                setSuggestions(data.results || data.features || []);
            } catch (error: any) {
                if (error?.name !== 'AbortError') {
                    console.warn('Geoapify autocomplete failed:', error);
                }
            } finally {
                setLoading(false);
            }
        }, 450);

        return () => {
            controller.abort();
            clearTimeout(timeout);
        };
    }, [disabled, hasGeoapifyConfig, value]);

    const mapUrl = useMemo(() => {
        if (!apiKey || !selectedLocation) {
            return '';
        }

        const lon = selectedLocation.longitude;
        const lat = selectedLocation.latitude;
        const marker = encodeURIComponent(`lonlat:${lon},${lat};color:#2563eb;size:medium`);
        return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=640&height=260&center=lonlat:${lon},${lat}&zoom=15&marker=${marker}&apiKey=${encodeURIComponent(apiKey)}`;
    }, [apiKey, selectedLocation]);

    const handleTextChange = (text: string) => {
        onChangeText(text);
        setSelectedLocation(null);
        onLocationSelected?.(null);
    };

    const selectSuggestion = (result: GeoapifyResult) => {
        const address = getAddress(result);
        const coords = getCoordinates(result);

        if (!address || !coords) {
            return;
        }

        const location = { address, ...coords };
        onChangeText(address);
        setSelectedLocation(location);
        setSuggestions([]);
        onLocationSelected?.(location);
    };

    return (
        <View style={styles.wrapper}>
            <Text style={[styles.label, { color: theme.textDim }]}>{label}</Text>
            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                <Ionicons name="location-outline" size={20} color={theme.textDim} style={styles.inputIcon} />
                <TextInput
                    placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                    value={value}
                    onChangeText={handleTextChange}
                    style={[styles.input, { color: theme.text }]}
                    multiline
                    editable={!disabled}
                />
                {loading && <ActivityIndicator size="small" color={theme.primary} />}
            </View>

            {!hasGeoapifyConfig && (
                <Text style={[styles.hintText, { color: theme.textDim }]}>
                    Add EXPO_PUBLIC_GEOAPIFY_AUTOCOMPLETE_URL or EXPO_PUBLIC_GEOAPIFY_API_KEY in .env.local.
                </Text>
            )}

            {suggestions.length > 0 && (
                <View style={[styles.suggestions, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {suggestions.map((item, index) => {
                        const address = getAddress(item);
                        if (!address) return null;

                        return (
                            <TouchableOpacity
                                key={`${address}-${index}`}
                                style={[styles.suggestionItem, index > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}
                                onPress={() => selectSuggestion(item)}
                            >
                                <Ionicons name="navigate-outline" size={16} color={theme.primary} />
                                <Text style={[styles.suggestionText, { color: theme.text }]} numberOfLines={2}>{address}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {mapUrl && (
                <View style={[styles.mapPreview, { borderColor: theme.border }]}>
                    <Image source={{ uri: mapUrl }} style={styles.mapImage} />
                    <View style={styles.mapBadge}>
                        <Ionicons name="pin" size={13} color="#fff" />
                        <Text style={styles.mapBadgeText}>Selected location</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F1F5F9',
    },
    inputIcon: {
        marginRight: 10,
        marginTop: 2,
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        minHeight: 42,
    },
    hintText: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
    },
    suggestions: {
        borderWidth: 1,
        borderRadius: 16,
        marginTop: 8,
        overflow: 'hidden',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    suggestionText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
    },
    mapPreview: {
        marginTop: 12,
        height: 132,
        overflow: 'hidden',
        borderRadius: 16,
        borderWidth: 1,
        backgroundColor: '#E2E8F0',
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    mapBadge: {
        position: 'absolute',
        left: 10,
        bottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 999,
    },
    mapBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },
});
