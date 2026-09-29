import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  Animated,
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Pressable, Text } from "../i18n";
type Rect = { x: number; y: number; width: number; height: number };
type Target = {
  id: string;
  label: string;
  detail: string;
  priority: number;
  measure: (done: (rect: Rect) => void) => void;
};
const Registry = createContext<(target: Target) => () => void>(() => () => {});
export function CoachSpot({
  id,
  label,
  detail,
  priority = 50,
  children,
  style,
}: {
  id: string;
  label: string;
  detail: string;
  priority?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const register = useContext(Registry),
    ref = useRef<View>(null);
  useEffect(
    () =>
      register({
        id,
        label,
        detail,
        priority,
        measure: (done) =>
          ref.current?.measureInWindow((x, y, width, height) =>
            done({ x, y, width, height }),
          ),
      }),
    [register, id, label, detail, priority],
  );
  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}
function Face() {
  return (
    <Image
      accessible={false}
      source={require("../../assets/coach-avatar.png")}
      resizeMode="cover"
      style={s.avatar}
    />
  );
}
export function CoachAvatar({
  children,
  page,
  summary,
  hidden,
  onReveal,
  onOpenChange,
}: {
  children: React.ReactNode;
  page: string;
  summary: string;
  hidden: boolean;
  onReveal: (delta: number, animated: boolean) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const targets = useRef(new Map<string, Target>()),
    root = useRef<View>(null);
  const register = useCallback((t: Target) => {
    targets.current.set(t.id, t);
    return () => {
      if (targets.current.get(t.id) === t) targets.current.delete(t.id);
    };
  }, []);
  const { width, height } = useWindowDimensions();
  const [open, setOpen] = useState(false),
    [index, setIndex] = useState(0),
    [tip, setTip] = useState<Target | null>(null),
    [rect, setRect] = useState<Rect | null>(null),
    [count, setCount] = useState(0);
  const [motionOff, setMotionOff] = useState(false),
    [systemMotion, setSystemMotion] = useState(true),
    [keyboard, setKeyboard] = useState(false),
    [left, setLeft] = useState(false),
    [cardHeight, setCardHeight] = useState(240);
  const [position] = useState(() => new Animated.ValueXY({ x: 20, y: 120 }));
  const reduced = motionOff || systemMotion;
  const bottom = width >= 1000 ? 24 : 100;
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setSystemMotion(v);
      })
      .catch(() => {});
    const r = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setSystemMotion,
    );
    const a = Keyboard.addListener("keyboardDidShow", () => setKeyboard(true));
    const b = Keyboard.addListener("keyboardDidHide", () => setKeyboard(false));
    return () => {
      alive = false;
      r.remove();
      a.remove();
      b.remove();
    };
  }, []);
  const [guidePage, setGuidePage] = useState(page);
  if (guidePage !== page) {
    setGuidePage(page);
    setIndex(0);
    setRect(null);
    setTip(null);
  }
  useEffect(() => {
    onOpenChange(open && !hidden && !keyboard);
  }, [open, hidden, keyboard, onOpenChange]);
  useEffect(() => {
    if (!open || hidden || keyboard) return;
    let active = true;
    const update = () => {
      const list = [...targets.current.values()].sort(
        (a, b) => a.priority - b.priority || a.id.localeCompare(b.id),
      );
      setCount(list.length);
      const target = list[index % Math.max(1, list.length)];
      setTip(target || null);
      if (!target) {
        setRect(null);
        return;
      }
      target.measure((r) =>
        root.current?.measureInWindow((ox, oy) => {
          if (!active) return;
          const next = { ...r, x: r.x - ox, y: r.y - oy };
          setRect((old) =>
            old &&
            Object.keys(next).every(
              (k) => Math.abs(old[k as keyof Rect] - next[k as keyof Rect]) < 1,
            )
              ? old
              : next,
          );
        }),
      );
    };
    update();
    const timer = setInterval(update, 180);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [open, hidden, keyboard, page, index]);
  const visible =
    !!rect &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.y >= 64 &&
    rect.y + rect.height + 82 < height - bottom - cardHeight &&
    rect.x >= 0 &&
    rect.x + rect.width <= width + 1;
  const destination = useMemo(
    () => ({
      x: Math.max(
        8,
        Math.min(width - 68, (rect?.x || 0) + (rect?.width || 0) / 2 - 28),
      ),
      y: Math.max(65, (rect?.y || 80) + (rect?.height || 0) + 6),
    }),
    [rect, width],
  );
  useEffect(() => {
    position.stopAnimation();
    const animation = Animated.timing(position, {
      toValue: destination,
      duration: reduced ? 0 : 320,
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [destination, position, reduced]);
  function reveal() {
    if (rect) onReveal(rect.y - 130, !reduced);
  }
  return (
    <Registry.Provider value={register}>
      <View ref={root} style={{ flex: 1 }}>
        {children}
        {!hidden && !keyboard && (
          <View
            pointerEvents="box-none"
            style={[StyleSheet.absoluteFill, { zIndex: 40 }]}
          >
            {open && visible && rect && (
              <>
                <View
                  pointerEvents="none"
                  testID="coach-target-highlight"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[
                    s.ring,
                    {
                      left: rect.x - 4,
                      top: rect.y - 4,
                      width: rect.width + 8,
                      height: rect.height + 8,
                    },
                  ]}
                />
                <Animated.View
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[
                    s.pointer,
                    { transform: position.getTranslateTransform() },
                  ]}
                >
                  <Text style={s.arrow}>↑</Text>
                  <Face />
                </Animated.View>
              </>
            )}
            {open ? (
              <View
                onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
                style={[
                  s.bubble,
                  {
                    bottom,
                    width: Math.min(350, width - 32),
                    ...(left ? { left: 16 } : { right: 16 }),
                  },
                ]}
              >
                <View style={s.row}>
                  <Face />
                  <View style={{ flex: 1 }}>
                    <Text style={s.title}>Your AI coach</Text>
                    <Text style={s.small}>On-device guidance</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close coach guidance"
                    onPress={() => setOpen(false)}
                    style={s.iconButton}
                  >
                    <Text style={s.label}>×</Text>
                  </Pressable>
                </View>
                <Text accessibilityLiveRegion="polite" style={s.body}>
                  {tip?.detail || summary}
                </Text>
                {tip && (
                  <Text style={s.label}>
                    {visible ? "Tap the outlined control:" : "Next control:"}{" "}
                    {tip.label}
                  </Text>
                )}
                <View style={s.row}>
                  {tip && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Show me where to click"
                      onPress={reveal}
                      style={s.primary}
                    >
                      <Text style={s.white}>Show me</Text>
                    </Pressable>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Next coach tip"
                    disabled={count < 2}
                    onPress={() => {
                      setRect(null);
                      setIndex((v) => (v + 1) % Math.max(1, count));
                    }}
                    style={s.iconButton}
                  >
                    <Text style={s.label}>
                      Next tip {count ? `${(index % count) + 1}/${count}` : ""}
                    </Text>
                  </Pressable>
                </View>
                <View style={s.row}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Move coach to other side"
                    onPress={() => setLeft((v) => !v)}
                    style={s.setting}
                  >
                    <Text style={s.small}>Move coach</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityLabel="Reduce coach motion"
                    accessibilityState={{ checked: reduced }}
                    aria-checked={reduced}
                    onPress={() => setMotionOff((v) => !v)}
                    disabled={systemMotion}
                    style={s.setting}
                  >
                    <Text style={s.small}>
                      {reduced ? "Motion reduced" : "Reduce motion"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open floating AI coach"
                onPress={() => setOpen(true)}
                style={[
                  s.launcher,
                  { bottom, ...(left ? { left: 16 } : { right: 16 }) },
                ]}
              >
                <Face />
                <Text style={s.white}>Guide me</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Registry.Provider>
  );
}
const s = StyleSheet.create({
  avatar: {
    width: 48,
    height: 52,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#E7EDDA",
    alignItems: "center",
  },
  launcher: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#344C3D",
    padding: 8,
    paddingRight: 18,
    borderRadius: 32,
    elevation: 5,
  },
  bubble: {
    position: "absolute",
    backgroundColor: "#FFFDF7",
    padding: 16,
    borderWidth: 1,
    borderColor: "#BBC9AE",
    borderRadius: 20,
    gap: 10,
    elevation: 8,
    boxShadow: "0 5px 22px rgba(30,50,30,0.15)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#283C32" },
  small: { fontSize: 12, lineHeight: 18, color: "#56604F" },
  body: { fontSize: 14, lineHeight: 21, color: "#344438" },
  label: { fontSize: 13, fontWeight: "600", color: "#344C3D" },
  iconButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  setting: { minHeight: 44, justifyContent: "center" },
  primary: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "#344C3D",
    borderRadius: 10,
  },
  white: { color: "#fff", fontWeight: "600", fontSize: 13 },
  ring: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#718C42",
    borderRadius: 14,
  },
  pointer: { position: "absolute", left: 0, top: 0, alignItems: "center" },
  arrow: { fontSize: 25, lineHeight: 25, color: "#48602E", fontWeight: "700" },
});
