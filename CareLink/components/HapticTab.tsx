export function HapticTab({ children, onPress, accessibilityState }: HapticTabProps) {
  const focused = accessibilityState.selected;

  return (
    <View style={styles.tabWrapper}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'transparent' }} // Explicitly set ripple color to transparent
        style={({ pressed }) => [
          styles.tab,
          { opacity: pressed ? 0.9 : 1 }, // Optional: Add a pressed effect
          focused && styles.focusedTab,
        ]}
        android_disableSound={true}
      >
        <View>{children}</View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabWrapper: {
    overflow: 'hidden', // Ensures no ripple effect leaks outside the bounds
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusedTab: {
    // Add focused styles here if needed
  },
});
