import type { AccessibilityMode } from '@/contexts/AccessibilityContext';

export const getThemeColors = (mode: AccessibilityMode) => {
    switch (mode) {
        case 'highContrast':
            return {
                background: '#000000',
                text: '#FFFFFF',
                primary: '#FF8800', // vivid orange for visibility
            };

        case 'lowVision':
            return {
                background: '#FFF8DC', // cornsilk (easy on the eyes)
                text: '#000000',
                primary: '#FFA07A', // light salmon (orange-ish)
            };

        case 'colorBlind':
            return {
                background: '#F0F8FF', // alice blue
                text: '#000000',
                primary: '#0077B6', // blue with good contrast
            };

        case 'default':
        default:
            return {
                background: '#E0F2FF', // pastel baby blue (👶💙)
                text: '#2E2E2E',
                primary: '#FFB347', // soft but readable orange 🍊
            };
    }
};
