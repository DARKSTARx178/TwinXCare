import { FontSizeOption } from '@/contexts/AccessibilityContext';

export const getFontSizeValue = (size: FontSizeOption): number => {
    switch (size) {
        case 'small':
            return 18;
        case 'medium':
            return 22;
        case 'large':
            return 28;
        default:
            return 20;
    }
};
