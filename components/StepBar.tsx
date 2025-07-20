import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getThemeColors } from '@/utils/theme';
import { useAccessibility } from '@/contexts/AccessibilityContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export type StepBarProps = {
  currentStep: number;
  style?: any;
};

const steps = [
  { icon: 'clipboard-list-outline' as const, label: 'Order' },
  { icon: 'credit-card-outline' as const, label: 'Payment' },
  { icon: 'truck' as const, label: 'Delivery' },
];

export default function StepBar({ currentStep, style }: StepBarProps) {
  const { scheme } = useAccessibility();
  //@ts-ignore
  const theme = getThemeColors(scheme);
  const isSmallScreen = SCREEN_WIDTH < 400;

  return (
    <View style={[styles.stepBar, { backgroundColor: theme.background, paddingTop: isSmallScreen ? 12 : 24, paddingBottom: isSmallScreen ? 4 : 12 }, style]}> 
      {steps.map((step, idx) => (
        <React.Fragment key={step.icon}>
          <MaterialCommunityIcons
            name={step.icon}
            size={isSmallScreen ? 28 : 36}
            color={idx === currentStep ? theme.primary : theme.unselected}
            style={{ opacity: idx === currentStep ? 1 : 0.5 }}
          />
          {idx < steps.length - 1 && (
            <View style={[styles.stepLine, { backgroundColor: theme.unselected, width: isSmallScreen ? 16 : 32, opacity: 0.5 }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 12,
  },
  stepLine: {
    height: 3,
    marginHorizontal: 4,
    borderRadius: 2,
  },
});
