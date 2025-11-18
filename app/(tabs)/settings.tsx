import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { getFontSizeValue } from '@/utils/fontSizes';
import { Picker } from '@react-native-picker/picker';
import React, { useContext } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getThemeColors as getDefaultTheme } from '@/utils/theme';

const COLOR_OPTIONS = [
  '#ffffff', '#000000', '#4a90e2', '#f5f5f5', '#ff5252', '#00c853', '#ffd54f', '#9e9e9e', '#2196f3', '#e0e0e0'
];

const COLOR_KEYS = ['background','text','primary','unselected','unselectedTab','icon'];

const fontSizeOptions = [
  { label: 'Small', value: 'small' },
  { label: 'Normal', value: 'medium' },
  { label: 'Large', value: 'large' },
];

const SettingsScreen = () => {
  const [fontSize, setFontSize] = React.useState<'small' | 'medium' | 'large'>('medium');
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
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.header, { color: colors.text, fontSize: fontSizeValue + 12 }]}>{labels.header}</Text>

      {/* Appearance (only light mode) */}
      <Text style={[styles.sectionTitle, { color: colors.unselected, fontSize: fontSizeValue }]}>{labels.appearance}</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: colors.primary }]}
          activeOpacity={1}
        >
          <Text style={[styles.optionText, { color: colors.text, fontSize: fontSizeValue }]}> 
            {labels.light}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Color picker for theme customization */}
      <Text style={[styles.sectionTitle, { color: colors.unselected, fontSize: fontSizeValue }]}>Theme Colors</Text>

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

      <View style={{ flexDirection: 'row', marginBottom: 18 }}>
        <TouchableOpacity
          onPress={() => {
            setTheme(getDefaultTheme());
          }}
          style={[styles.optionButton, { backgroundColor: colors.unselectedTab }]}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>Reset defaults</Text>
        </TouchableOpacity>
      </View>

      {/* Language Picker */}
      <Text style={[styles.sectionTitle, { color: colors.unselected, fontSize: fontSizeValue }]}>{labels.language}</Text>
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
      <Text style={[styles.sectionTitle, { color: colors.unselected, fontSize: fontSizeValue }]}>{labels.textSize}</Text>
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
      <Text style={[styles.subtext, { color: colors.unselected, fontSize: fontSizeValue }]}>{labels.appearanceNote}</Text>
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