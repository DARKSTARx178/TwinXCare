import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { db } from '@/firebase/firebase';
import { getThemeColors as getDefaultTheme } from '@/utils/theme';
import { doc, getDoc } from 'firebase/firestore';

const COLOR_OPTIONS = [
  '#ffffff', '#000000', '#4a90e2', '#f5f5f5', '#ff5252', '#00c853', '#ffd54f', '#9e9e9e', '#2196f3', '#e0e0e0'
];

const COLOR_KEYS = ['background', 'text', 'primary', 'unselected', 'unselectedTab', 'icon'];

const A11Y_PRESETS = [
  {
    name: 'Standard',
    description: 'Balanced for general use',
    icon: 'apps-outline',
    theme: {
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#1E293B',
      textDim: '#64748B',
      primary: '#81ade7',
      primaryGlow: 'rgba(129, 173, 231, 0.4)',
      accent: '#62b8ea',
      unselected: '#b1b1b1',
      unselectedTab: '#FFFFFF',
      icon: '#62b8ea',
      border: 'rgba(0, 0, 0, 0.05)',
      success: '#10b981',
      danger: '#ef4444',
      warning: '#f59e0b',
      fontSize: 18,
      shadow: { shadowColor: "transparent", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
      shadowSm: { shadowColor: "transparent", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 }
    },
  },
  {
    name: 'High Contrast',
    description: 'Maximum legibility',
    icon: 'contrast-outline',
    theme: {
      background: '#000000',
      surface: '#121212',
      text: '#ffff00',
      textDim: '#cccccc',
      primary: '#cc2936',
      primaryGlow: 'rgba(204, 41, 54, 0.4)',
      accent: '#ffffff',
      unselected: '#cccccc',
      unselectedTab: '#333333',
      icon: '#ffffff',
      border: 'rgba(255, 255, 255, 0.2)',
      success: '#00ff00',
      danger: '#ff0000',
      warning: '#ffaa00',
      fontSize: 18,
      shadow: { shadowColor: "transparent", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
      shadowSm: { shadowColor: "transparent", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 }
    },
  },
  {
    name: 'Eye Comfort',
    description: 'Reduced blue light strain',
    icon: 'sunny-outline',
    theme: {
      background: '#fffbf0',
      surface: '#fffdf9',
      text: '#3e2723',
      textDim: '#8d6e63',
      primary: '#d84315',
      primaryGlow: 'rgba(216, 67, 21, 0.4)',
      accent: '#fb8c00',
      unselected: '#a1887f',
      unselectedTab: '#efebe9',
      icon: '#8d6e63',
      border: 'rgba(62, 39, 35, 0.05)',
      success: '#2e7d32',
      danger: '#c62828',
      warning: '#ef6c00',
      fontSize: 18,
      shadow: { shadowColor: "transparent", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
      shadowSm: { shadowColor: "transparent", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 }
    },
  },
];

const SettingsScreen = () => {
  const [version, setVersion] = useState<string>('...');
  const [fontSize, setFontSizeState] = React.useState<'small' | 'medium' | 'large'>('medium');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { theme, setTheme } = useContext(ThemeContext);
  const colors = theme ?? getDefaultTheme();
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const docRef = doc(db, 'version', 'verProd');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const ver = Object.values(data)[0];
          if (typeof ver === 'string') setVersion(ver);
        }
      } catch (e) { }
    };
    fetchVersion();
  }, []);

  const labels = {
    header: lang === 'zh' ? '参数设置' : 'System Settings',
    appearance: lang === 'zh' ? '界面外观' : 'Appearance',
    language: lang === 'zh' ? '应用语言' : 'Language',
    textSize: lang === 'zh' ? '字体大小' : 'Typography',
    accessibility: lang === 'zh' ? '辅助功能' : 'Accessibility',
    advanced: lang === 'zh' ? '高级开发者选项' : 'Advanced Configuration',
  };

  const isPresetMatch = (presetTheme: any) =>
    COLOR_KEYS.every((k) => (colors as any)[k] === presetTheme[k]);

  const activePreset = A11Y_PRESETS.find((p) => isPresetMatch(p.theme));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.headerArea}>
        <View style={[styles.iconCircle, { backgroundColor: colors.unselectedTab }]}>
          <Ionicons name="settings-sharp" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.headerText, { color: colors.text }]}>{labels.header}</Text>
      </View>

      {/* Accessibility Presets */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{labels.accessibility}</Text>
        {A11Y_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.name}
            style={[
              styles.presetCard,
              {
                backgroundColor: colors.surface || colors.unselectedTab,
                borderColor: activePreset?.name === preset.name ? colors.primary : 'transparent',
                borderWidth: 2,
              },
            ]}
            onPress={() => setTheme(preset.theme)}
            activeOpacity={0.8}
          >
            <View style={[styles.presetIconWrap, { backgroundColor: preset.theme.primary + '15' }]}>
              <Ionicons name={preset.icon as any} size={24} color={preset.theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.presetName, { color: colors.text }]}>{preset.name}</Text>
              <Text style={[styles.presetDesc, { color: colors.text + '80' }]}>{preset.description}</Text>
            </View>
            {activePreset?.name === preset.name && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Core Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>

        <View style={[styles.controlCard, { backgroundColor: colors.unselectedTab }]}>
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <Ionicons name="language-outline" size={20} color={colors.text} />
              <Text style={[styles.controlLabel, { color: colors.text }]}>{labels.language}</Text>
            </View>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={lang}
                style={{ color: colors.text, width: 140 }}
                onValueChange={(v) => setLang(v)}
                mode="dropdown"
              >
                <Picker.Item label="English" value="en" />
                <Picker.Item label="简体中文" value="zh" />
              </Picker>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.text + '10' }]} />

          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <Ionicons name="text-outline" size={20} color={colors.text} />
              <Text style={[styles.controlLabel, { color: colors.text }]}>{labels.textSize}</Text>
            </View>
            <View style={styles.sizeToggle}>
              {['S', 'M', 'L'].map((s, idx) => {
                const val = idx === 0 ? 'small' : idx === 1 ? 'medium' : 'large';
                const active = fontSize === val;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setFontSizeState(val as any)}
                    style={[styles.sizeBtn, active && { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.surface }]}
                  >
                    <Text style={[styles.sizeBtnText, { color: active ? colors.primary : colors.text }]}>{s}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </View>
      </View>

      {/* Developer / Advanced */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>{labels.advanced}</Text>
          <Ionicons name={showAdvanced ? "chevron-up" : "chevron-down"} size={20} color={colors.text} />
        </TouchableOpacity>

        {showAdvanced && (
          <View style={[styles.advancedPanel, { backgroundColor: colors.unselectedTab }]}>
            <Text style={[styles.devNote, { color: colors.text + '70' }]}>
              Modify individual design tokens. Changes here bypass standard presets. Not stable.
            </Text>
            {COLOR_KEYS.map((key) => (
              <View key={key} style={styles.tokenRow}>
                <Text style={[styles.tokenName, { color: colors.text }]}>{key.toUpperCase()}</Text>
                <View style={styles.swatchGrid}>
                  {COLOR_OPTIONS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setTheme({ ...colors, [key]: c } as any)}
                      style={[styles.swatch, { backgroundColor: c, borderColor: (colors as any)[key] === c ? colors.text : 'transparent' }]}
                    />
                  ))}
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.surface }]}
              onPress={() => setTheme(getDefaultTheme())}
            >
              <Text style={[styles.resetBtnText, { color: colors.primary }]}>Restore Default Tokens</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.text + '50' }]}>
          TwinXCare alpha-{version} build
        </Text>
        <Text style={[styles.footerText, { color: colors.text + '30' }]}>
          © 2026 DeepMind Agency Core
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    marginTop: 80,
    marginBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: { fontSize: 28, fontWeight: '900' },
  subHeaderText: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 6, maxWidth: '80%' },
  section: { paddingHorizontal: 24, marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    marginBottom: 12,
  },
  presetIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetName: { fontSize: 16, fontWeight: '800' },
  presetDesc: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  controlCard: {
    borderRadius: 24,
    padding: 4,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  controlInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlLabel: { fontSize: 14, fontWeight: '700' },
  separator: { height: 1, marginHorizontal: 16 },
  pickerWrap: { height: 50, justifyContent: 'center' },
  sizeToggle: { flexDirection: 'row', gap: 4, backgroundColor: 'rgba(0,0,0,0.05)', padding: 4, borderRadius: 12 },
  sizeBtn: { width: 36, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sizeBtnText: { fontSize: 12, fontWeight: '900' },
  advancedToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  advancedPanel: { marginTop: 16, padding: 20, borderRadius: 24 },
  devNote: { fontSize: 11, fontWeight: '600', lineHeight: 16, marginBottom: 20 },
  tokenRow: { marginBottom: 16 },
  tokenName: { fontSize: 10, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  swatch: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5 },
  resetBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  resetBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
});

export default SettingsScreen;