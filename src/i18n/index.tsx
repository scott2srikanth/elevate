import React, { createContext, useContext, useEffect } from "react";
import {
  Text as NativeText,
  TextInput as NativeInput,
  Pressable as NativePressable,
  StyleSheet,
  Image as NativeImage,
  type ImageProps,
  Platform,
  type TextProps,
  type TextInputProps,
  type PressableProps,
} from "react-native";
import { translate, type Language } from "./translate";
export { translate, type Language } from "./translate";
const LanguageContext = createContext<Language>("en");
export function LanguageProvider({
  language,
  children,
}: {
  language: Language;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined")
      document.documentElement.lang = language;
  }, [language]);
  return (
    <LanguageContext.Provider value={language}>
      {children}
    </LanguageContext.Provider>
  );
}
export function useLanguage() {
  const language = useContext(LanguageContext);
  return { language, t: (s: string) => translate(s, language) };
}
/** Only presentation is translated. Input values and persisted domain keys stay untouched. */
export function Text({
  children,
  style,
  raw = false,
  ...props
}: TextProps & { raw?: boolean }) {
  const { language, t } = useLanguage();
  const flattened = StyleSheet.flatten(style) || {};
  const content = raw
    ? children
    : React.Children.map(children, (child) =>
        typeof child === "string" ? t(child) : child,
      );
  return (
    <NativeText
      {...props}
      accessibilityLabel={
        props.accessibilityLabel ? t(props.accessibilityLabel) : undefined
      }
      style={[
        style,
        language === "te" && {
          fontFamily: undefined,
          letterSpacing: 0,
          lineHeight: Math.max(
            flattened.lineHeight || 0,
            (flattened.fontSize || 14) * 1.65,
          ),
        },
      ]}
    >
      {content}
    </NativeText>
  );
}
export function TextInput(props: TextInputProps) {
  const { t } = useLanguage();
  return (
    <NativeInput
      {...props}
      accessibilityLabel={
        props.accessibilityLabel ? t(props.accessibilityLabel) : undefined
      }
      placeholder={props.placeholder ? t(props.placeholder) : undefined}
    />
  );
}
export function Pressable(props: PressableProps) {
  const { t } = useLanguage();
  return (
    <NativePressable
      {...props}
      accessibilityLabel={
        props.accessibilityLabel ? t(props.accessibilityLabel) : undefined
      }
    />
  );
}

export function Image(props: ImageProps) {
  const { t } = useLanguage();
  return (
    <NativeImage
      {...props}
      accessibilityLabel={
        props.accessibilityLabel ? t(props.accessibilityLabel) : undefined
      }
    />
  );
}
