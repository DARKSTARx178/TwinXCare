import { getActiveLanguage, useLanguage } from '@/contexts/LanguageContext';
import { translateText } from '@/utils/translations';
import React from 'react';
import {
  Alert as NativeAlert,
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';

const localizeChildren = (children: React.ReactNode, lang: 'en' | 'zh'): React.ReactNode =>
  React.Children.map(children, (child) =>
    typeof child === 'string' ? translateText(child, lang) : child,
  );

export const Text = React.forwardRef<React.ElementRef<typeof NativeText>, TextProps>(
  ({ children, ...props }, ref) => {
    const { lang } = useLanguage();
    return (
      <NativeText ref={ref} {...props}>
        {localizeChildren(children, lang)}
      </NativeText>
    );
  },
);
Text.displayName = 'LocalizedText';

export const TextInput = React.forwardRef<React.ElementRef<typeof NativeTextInput>, TextInputProps>(
  ({ placeholder, accessibilityLabel, ...props }, ref) => {
    const { lang } = useLanguage();
    return (
      <NativeTextInput
        ref={ref}
        placeholder={placeholder ? translateText(placeholder, lang) : placeholder}
        accessibilityLabel={
          accessibilityLabel ? translateText(accessibilityLabel, lang) : accessibilityLabel
        }
        {...props}
      />
    );
  },
);
TextInput.displayName = 'LocalizedTextInput';

export const Alert = {
  ...NativeAlert,
  alert(
    title: string,
    message?: string,
    buttons?: Parameters<typeof NativeAlert.alert>[2],
    options?: Parameters<typeof NativeAlert.alert>[3],
  ) {
    const lang = getActiveLanguage();
    const localizedButtons = buttons?.map((button) => ({
      ...button,
      text: button.text ? translateText(button.text, lang) : button.text,
    }));
    return NativeAlert.alert(
      translateText(title, lang),
      message ? translateText(message, lang) : message,
      localizedButtons,
      options,
    );
  },
  prompt(
    title: string,
    message?: string,
    callbackOrButtons?: Parameters<typeof NativeAlert.prompt>[2],
    type?: Parameters<typeof NativeAlert.prompt>[3],
    defaultValue?: Parameters<typeof NativeAlert.prompt>[4],
    keyboardType?: Parameters<typeof NativeAlert.prompt>[5],
  ) {
    const lang = getActiveLanguage();
    return NativeAlert.prompt(
      translateText(title, lang),
      message ? translateText(message, lang) : message,
      callbackOrButtons,
      type,
      defaultValue,
      keyboardType,
    );
  },
};
