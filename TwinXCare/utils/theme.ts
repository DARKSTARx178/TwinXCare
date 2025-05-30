import type { AccessibilityMode } from '@/contexts/AccessibilityContext';

export const getThemeColors = (mode: AccessibilityMode) => {
    switch (mode) {
        case 'lightMode':
            return {
                background: '#E6F2FF',
                text: '#222222',
                primary: '#4a90e2',
                unselected: '#CCCCCC',
                unselectedTab: '#BBBBBB',
                fontSize: 18,
            };
        case 'darkMode':
            return {
                background: '#252525',
                text: '#FFFFFF',
                primary: '#4a90e2',
                unselected: '#888888',
                unselectedTab: '#666666', 
                fontSize: 18,
            };
        default:
            return {
                background: '#FFFFFF',
                text: '#000000',
                primary: '#0000FF',
                unselected: '#CCCCCC',
                unselectedTab: '#BBBBBB',
                fontSize: 18,
            };
    }
};
