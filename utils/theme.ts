import { AccessibilityMode } from '../contexts/AccessibilityContext';

export const getThemeColors = (scheme: AccessibilityMode = 'lightMode') => {
    const isDark = scheme === 'darkMode';
    return {
        background: isDark ? '#1a1a1a' : '#F8FAFC',
        surface: isDark ? '#2c2c2c' : '#FFFFFF',
        text: isDark ? '#ffffff' : '#1E293B',
        textDim: isDark ? '#b1b1b1' : '#64748B',
        primary: '#81ade7',
        primaryGlow: 'rgba(129, 173, 231, 0.4)',
        accent: '#62b8ea',
        unselected: '#b1b1b1',
        unselectedTab: isDark ? '#2c2c2c' : '#FFFFFF',
        icon: '#62b8ea',
        border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        fontSize: 18,
        shadow: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 2,
        },
        shadowSm: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.03,
            shadowRadius: 8,
            elevation: 1,
        }
    };
};
