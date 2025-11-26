import { AccessibilityMode } from '../contexts/AccessibilityContext';

export const getThemeColors = (scheme: AccessibilityMode = 'lightMode') => {
    const isDark = scheme === 'darkMode';
    return {
        background: isDark ? '#1a1a1a' : '#ffffff',
        text: isDark ? '#ffffff' : '#000000',
        primary: '#81ade7ff',
        unselected: '#b1b1b1ff',
        unselectedTab: isDark ? '#2c2c2c' : '#f3f6faff',
        icon: '#62b8eaff',
        fontSize: 18,
    };
};
