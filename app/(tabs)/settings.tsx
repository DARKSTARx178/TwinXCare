import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { getFontSizeValue } from '@/utils/fontSizes';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import React, { useContext, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getThemeColors as getDefaultTheme } from '@/utils/theme';

const COLOR_OPTIONS = [
  '#ffffff', '#000000', '#4a90e2', '#f5f5f5', '#ff5252', '#00c853', '#ffd54f', '#9e9e9e', '#2196f3', '#e0e0e0'
];

const COLOR_KEYS = ['background','text','primary','unselected','unselectedTab','icon'];

// Accessibility color presets for different special needs
const A11Y_PRESETS = [
  {
    name: 'Standard',
    description: 'Default color scheme',
    theme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#81ade7ff',
      unselected: '#b1b1b1ff',
      unselectedTab: '#f3f6faff',
      icon: '#62b8eaff',
      fontSize: 18,
    },
  },
  {
    name: 'High Contrast',
    description: 'For low vision users',
    theme: {
      background: '#000000',
      text: '#ffff00',
      primary: '#cc2936',
      unselected: '#cccccc',
      unselectedTab: '#333333',
      icon: '#ffffff',
      fontSize: 18,
    },
  },
  {
    name: 'Dyslexia Friendly',
    description: 'Optimized for dyslexic users',
    theme: {
      background: '#fffacd',
      text: '#2c2c2c',
      primary: '#6c63ff',
      unselected: '#999999',
      unselectedTab: '#f0f0f0',
      icon: '#6c63ff',
      fontSize: 18,
    },
  },
  {
    name: 'Protanopia (Red-Blind)',
    description: 'For red color blindness',
    theme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#0173b2',
      unselected: '#999999',
      unselectedTab: '#f5f5f5',
      icon: '#0173b2',
      fontSize: 18,
    },
  },
  {
    name: 'Deuteranopia (Green-Blind)',
    description: 'For green color blindness',
    theme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#e1597a',
      unselected: '#999999',
      unselectedTab: '#f5f5f5',
      icon: '#cc2936',
      fontSize: 18,
    },
  },
  {
    name: 'Tritanopia (Blue-Blind)',
    description: 'For blue-yellow color blindness',
    theme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#f0ad4e',
      unselected: '#999999',
      unselectedTab: '#f5f5f5',
      icon: '#d58512',
      fontSize: 18,
    },
  },
];

const fontSizeOptions = [
  { label: 'Small', value: 'small' },
  { label: 'Normal', value: 'medium' },
  { label: 'Large', value: 'large' },
];

const SettingsScreen = () => {
  const [fontSize, setFontSize] = React.useState<'small' | 'medium' | 'large'>('medium');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { theme, setTheme } = useContext(ThemeContext);
  const colors = theme ?? getDefaultTheme();
  const fontSizeValue = getFontSizeValue(fontSize);
  const { lang, setLang } = useLanguage();

  const labels = {
    header: lang === 'zh' ? '设置' : 'Settings',
    appearance: lang === 'zh' ? '外观' : 'Appearance',
    light: lang === 'zh' ? '浅色' : 'Light',
    language: lang === 'zh' ? '语言' : 'Language',
    textSize: lang === 'zh' ? '文字大小' : 'Text Size',
    small: lang === 'zh' ? '小' : 'Small',
    medium: lang === 'zh' ? '中' : 'Normal',
    large: lang === 'zh' ? '大' : 'Large',
    appearanceNote: lang === 'zh' ? '仅支持浅色模式。' : 'Only light mode is supported.',
    accessibilityPresets: lang === 'zh' ? '无障碍预设' : 'Accessibility Presets',
    advanced: lang === 'zh' ? '高级' : 'Advanced',
    customColors: lang === 'zh' ? '自定义颜色' : 'Custom Colors',
    resetDefaults: lang === 'zh' ? '重置默认值' : 'Reset defaults',
  };

  // Determine active preset: match by color keys; default to 'Standard' if none match
  const presetKeys = ['background', 'text', 'primary', 'unselected', 'unselectedTab', 'icon'];
  const isPresetMatch = (presetTheme: any) => presetKeys.every((k) => (colors as any)[k] === presetTheme[k]);
  const activePreset = A11Y_PRESETS.find((p) => isPresetMatch(p.theme));
  const activePresetName = activePreset ? activePreset.name : A11Y_PRESETS[0].name;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.header, { color: colors.text, fontSize: fontSizeValue + 12 }]}>{labels.header}</Text>
      {/* Accessibility Presets */}
      <Text style={{ color: colors.text, fontSize: fontSizeValue, fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>{labels.accessibilityPresets}</Text>
      <Text style={[styles.sectionDescription, { color: colors.text, fontSize: (fontSizeValue - 2) }]}>{lang === 'zh' ? '为不同视觉需求的用户优化的配色方案' : 'Color schemes optimized for different visual needs'}</Text>

      {A11Y_PRESETS.map((preset) => (
        <TouchableOpacity
          key={preset.name}
          style={[
            styles.presetButton,
            {
              backgroundColor: colors.unselectedTab,
              borderWidth: 2,
              borderColor: activePresetName === preset.name ? colors.primary : 'transparent',
            },
          ]}
          onPress={() => setTheme(preset.theme)}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.presetName, { color: colors.text, fontSize: fontSizeValue }]}> 
              {preset.name}
            </Text>
            <Text style={[styles.presetDescription, { color: colors.text, fontSize: (fontSizeValue - 2) }]}>{preset.description}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.presetColorPreview, { backgroundColor: preset.theme.primary }]} />
            {activePresetName === preset.name && (
              <MaterialIcons name="check" size={18} color={colors.primary} style={{ marginLeft: 8 }} />
            )}
          </View>
        </TouchableOpacity>
      ))}

      {/* Language Picker */}
      <Text style={{ color: colors.text, fontSize: fontSizeValue, fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>{labels.language}</Text>
      <View style={styles.pickerRow}>
        <Picker
          selectedValue={lang}
          style={{ flex: 1, color: colors.text, backgroundColor: colors.unselectedTab }}
          onValueChange={(itemValue) => setLang(itemValue)}
          mode="dropdown"
        >
          <Picker.Item label="English" value="en" />
          <Picker.Item label="中文" value="zh" />
        </Picker>
      </View>

      {/* Text Size */}
      <Text style={{ color: colors.text, fontSize: fontSizeValue, fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>{labels.textSize}</Text>
      <View style={styles.row}>
        {fontSizeOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.optionButton,
              { backgroundColor: fontSize === opt.value ? colors.primary : colors.unselectedTab },
            ]}
            onPress={() => setFontSize(opt.value as 'small' | 'medium' | 'large')}
          >
            <Text style={[styles.optionText, { color: colors.text, fontSize: fontSizeValue }]}>{
              opt.value === 'small' ? labels.small :
              opt.value === 'medium' ? labels.medium :
              opt.value === 'large' ? labels.large : ''
            }</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Advanced Section */}
      <TouchableOpacity
        style={[styles.advancedHeader, { backgroundColor: colors.unselectedTab }]}
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <Text style={[styles.advancedTitle, { color: colors.text, fontSize: fontSizeValue }]}>
          {labels.advanced}
        </Text>
        <MaterialIcons 
          name={showAdvanced ? 'expand-less' : 'expand-more'} 
          size={fontSizeValue + 8} 
          color={colors.text} 
        />
      </TouchableOpacity>

      {showAdvanced && (
        <View style={{ marginTop: 16, marginBottom: 32 }}>
          {/* Color picker for theme customization */}
          <Text style={[styles.sectionTitle, { color: colors.unselected, fontSize: fontSizeValue }]}>
            {labels.customColors}
          </Text>

          {(COLOR_KEYS as string[]).map((key) => (
            <View key={key} style={{ marginBottom: 12 }}>
              <Text style={{ color: colors.text, marginBottom: 6, fontSize: fontSizeValue }}>{key}</Text>
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      const next = { ...colors, [key]: c } as any;
                      setTheme(next);
                    }}
                    style={[styles.swatch, { backgroundColor: c, borderColor: (colors as any)[key] === c ? '#000' : 'transparent' }]}
                  />
                ))}
              </View>
            </View>
          ))}

          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <TouchableOpacity
              onPress={() => {
                setTheme(getDefaultTheme());
              }}
              style={[styles.optionButton, { backgroundColor: colors.unselectedTab }]}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>{labels.resetDefaults}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    fontWeight: 'bold',
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  sectionDescription: {
    marginBottom: 12,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginRight: 8,
  },
  optionText: {
    fontWeight: 'bold',
  },
  subtext: {
    marginBottom: 32,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  presetName: {
    fontWeight: 'bold',
  },
  presetDescription: {
    marginTop: 4,
  },
  presetColorPreview: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginLeft: 12,
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginVertical: 16,
  },
  advancedTitle: {
    fontWeight: 'bold',
  },
  link: {
    marginBottom: 24,
    textAlign: 'center',
  },
  signOut: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SettingsScreen;