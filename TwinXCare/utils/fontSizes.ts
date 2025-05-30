import { FontSizeOption } from '@/contexts/AccessibilityContext';

export const getFontSizeValue = (size: FontSizeOption): number => {
    switch (size) {
        case 'small':
            return 14;
        case 'medium':
            return 16;
        case 'large':
            return 20;
        default:
            return 16;
    }
};
