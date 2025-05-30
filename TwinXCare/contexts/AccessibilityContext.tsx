// AccessibilityContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AccessibilityMode = 'lightMode' | 'darkMode';
export type FontSizeOption = 'small' | 'medium' | 'large';

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

    return (
        <AccessibilityContext.Provider value={{ scheme, setScheme, fontSize, setFontSize }}>
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
