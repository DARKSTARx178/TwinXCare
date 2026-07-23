import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type AccessibilityMode = 'lightMode' | 'darkMode';
export type FontSizeOption = 'small' | 'medium' | 'large';
const FONT_SIZE_STORAGE_KEY = 'accessibilityFontSize';

interface AccessibilityContextType {
    scheme: AccessibilityMode;
    setScheme: (mode: AccessibilityMode) => void;
    fontSize: FontSizeOption;
    setFontSize: (size: FontSizeOption) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
    const [scheme, setScheme] = useState<AccessibilityMode>('lightMode');
    const [fontSize, setFontSize] = useState<FontSizeOption>('medium');

    useEffect(() => {
        const loadFontSize = async () => {
            try {
                const savedSize = await AsyncStorage.getItem(FONT_SIZE_STORAGE_KEY);
                if (savedSize === 'small' || savedSize === 'medium' || savedSize === 'large') {
                    setFontSize(savedSize);
                }
            } catch (error) {
                console.warn('Error loading font size:', error);
            }
        };

        loadFontSize();
    }, []);

    const updateFontSize = async (size: FontSizeOption) => {
        setFontSize(size);
        try {
            await AsyncStorage.setItem(FONT_SIZE_STORAGE_KEY, size);
        } catch (error) {
            console.warn('Error saving font size:', error);
        }
    };

    return (
        <AccessibilityContext.Provider value={{ scheme, setScheme, fontSize, setFontSize: updateFontSize }}>
            {children}
        </AccessibilityContext.Provider>
    );
};

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within AccessibilityProvider');
    }
    return context;
};
