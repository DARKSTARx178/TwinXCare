import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
} from 'react';

type SchemeType = 'default' | 'highContrast' | 'lowVision' | 'colorBlind';
export type AccessibilityMode = SchemeType;

interface AccessibilityContextType {
    scheme: SchemeType;
    setScheme: (s: SchemeType) => void;
}

const defaultContext: AccessibilityContextType = {
    scheme: 'default',
    setScheme: () => { },
};

export const AccessibilityContext = createContext<AccessibilityContextType>(defaultContext);

interface AccessibilityProviderProps {
    children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
    const [scheme, setScheme] = useState<SchemeType>('default');

    return (
        <AccessibilityContext.Provider value={{ scheme, setScheme }}>
            {children}
        </AccessibilityContext.Provider>
    );
};

export const useAccessibility = () => useContext(AccessibilityContext);
  