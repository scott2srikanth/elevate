import { useContent } from "./src/ContentProvider";
import AdminEntry from "./src/components/AdminEntry";
import { LanguageProvider, translate } from "./src/i18n";
import { LaunchSplash } from "./src/components/LaunchSplash";
import { LanguagePicker } from "./src/components/LanguagePicker";
import { Pressable, Text, TextInput, Image } from "./src/i18n";
import { router, usePathname } from "expo-router";
import {
  adaptiveStage,
  stagePlan,
  practiceForTime,
  weeklySummary,
} from "./src/development";
import { useCloud } from "./src/useCloud";
import { Account } from "./src/components/Account";
import {
  CoachIllustration,
  PracticeScene,
} from "./src/components/CoachIllustration";
import { PracticeVideos } from "./src/components/PracticeVideos";
import { CoachAvatar, CoachSpot } from "./src/components/CoachAvatar";
import { CoachHub } from "./src/components/CoachHub";
import { StyleHub } from "./src/components/StyleHub";
import { Preferences } from "./src/components/CoachingTools";
import { setReminder } from "./src/dataTools";
import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  AREAS,
  Area,
  Exercise,
  State,
  addReflection,
  dayKey,
  exercises,
  initialState,
  occasionChecklist,
  recommend,
  streak,
  weeks,
} from "./src/coach";
import { loadState, saveState } from "./src/storage";
const C = {
  bg: "#F7F3EC",
  ink: "#344333",
  muted: "#56604F",
  line: "#E5DFD3",
  mint: "#E2E8D8",
  green: "#526649",
  white: "#FFFFFF",
  cream: "#EFE4D5",
  orange: "#A36343",
};
type IconName = React.ComponentProps<typeof Ionicons>["name"];
type Tab =
  "Today" | "My journey" | "Practice" | "My style" | "Profile" | "Coach";
const nav: { tab: Tab; icon: IconName }[] = [
  { tab: "Today", icon: "grid-outline" },
  { tab: "Practice", icon: "play-circle-outline" },
  { tab: "Coach", icon: "sparkles-outline" },
  { tab: "My style", icon: "shirt-outline" },
  { tab: "Profile", icon: "person-outline" },
];
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
function Icon({
  name,
  size = 22,
  color = C.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
function Label({ children }: { children: React.ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}
function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: C.ink }]}>{title}</Text>
      {icon && (
        <Icon name={icon} size={18} color={secondary ? C.ink : C.white} />
      )}
    </Pressable>
  );
}
function Chip({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[s.chip, selected && s.chipActive]}
    >
      <Text style={[s.chipText, selected && { color: C.ink }]}>{title}</Text>
    </Pressable>
  );
}
function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#919A94"
        multiline={multiline}
        maxLength={multiline ? 1200 : 120}
        style={[
          s.input,
          multiline && { minHeight: 100, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}
function Rating({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <View style={s.row}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Confidence ${n} of 5`}
            accessibilityState={{ selected: n === value }}
            key={n}
            onPress={() => onChange(n)}
            style={[
              s.rating,
              n === value && { backgroundColor: C.mint, borderColor: C.green },
            ]}
          >
            <Text style={s.body}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.between}>
        <Text style={s.small}>Still finding my feet</Text>
        <Text style={s.small}>Feeling confident</Text>
      </View>
    </View>
  );
}
function AppContent() {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const coachScroll = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const [coachOpen, setCoachOpen] = useState(false);
  const [state, setState] = useState<State>(initialState);
  const [loading, setLoading] = useState(true);
  const [introDone, setIntroDone] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const pathname = usePathname();
  const tabPaths: Record<Tab, string> = {
    Today: "/",
    "My journey": "/journey",
    Practice: "/practice",
    Coach: "/coach",
    "My style": "/style",
    Profile: "/profile",
  };
  const tab =
    (Object.keys(tabPaths) as Tab[]).find((t) => tabPaths[t] === pathname) ||
    "Today";
  const setTab = (next: Tab) => router.navigate(tabPaths[next] as "/");
  const cloud = useCloud(state, setState, !loading && !loadFailed);
  const [sheet, setSheet] = useState<
    "onboard" | "edit" | "exercise" | "occasion" | "garment" | "delete" | null
  >(null);
  const [active, setActive] = useState<Exercise>(exercises[0]);
  const [phase, setPhase] = useState(0);
  const [filter, setFilter] = useState<Area | "All">("All");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [goal, setGoal] = useState("Feel confident in professional situations");
  const [context, setContext] = useState("Smart casual");
  const [focus, setFocus] = useState<Area>("Executive presence");
  const [minutes, setMinutes] = useState(5);
  const [confidence, setConfidence] = useState(3);
  const [note, setNote] = useState("");
  const [next, setNext] = useState("");
  const [situation, setSituation] = useState("");
  const [eventTitle, setEventTitle] = useState("Client meeting");
  const [date, setDate] = useState(dayKey(new Date()));
  const [garment, setGarment] = useState("");
  const [category, setCategory] = useState("Tops");
  const [color, setColor] = useState("Navy");
  const [message, setMessage] = useState("");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  useEffect(() => {
    loadState()
      .then(setState)
      .catch(() => {
        setStorageError(
          "Your saved data could not be read. It has not been overwritten. Reload to retry, or reset it below.",
        );
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (loading || loadFailed) return;
    saveState(state)
      .then(() => setStorageError(""))
      .catch(() =>
        setStorageError(
          "Changes could not be saved on this device. Keep this app open and try saving again.",
        ),
      );
  }, [state, loading, loadFailed]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  const profile = state.profile;
  const rec = recommend(state);
  const currentWeek = adaptiveStage(state);
  const chosenWeek = selectedWeek ?? currentWeek;
  const openProfile = (edit = false) => {
    setName(profile?.name || "");
    setRole(profile?.role || "");
    setGoal(
      profile?.goal ||
        translate(
          "Feel confident in professional situations",
          state.preferences.language,
        ),
    );
    setFocus(profile?.focus || "Executive presence");
    setContext(profile?.context || "Smart casual");
    setMinutes(profile?.minutes || 5);
    setConfidence(profile?.confidence || 3);
    setSheet(edit ? "edit" : "onboard");
  };
  const openExercise = (original: Exercise) => {
    const exercise = practiceForTime(original, profile?.minutes || 5);
    if (!profile) {
      openProfile();
      return;
    }
    if (
      state.assignment &&
      !exercises.some((e) => e.id === state.assignment!.exerciseId)
    ) {
      setState((v) => ({ ...v, assignment: null }));
      setActive(exercise);
      setPhase(0);
      setSheet("exercise");
      return;
    }
    if (state.assignment && state.assignment.exerciseId !== exercise.id) {
      setMessage(
        "Finish your current real-world practice before starting another.",
      );
      setActive(
        exercises.find((e) => e.id === state.assignment!.exerciseId) ||
          exercises[0],
      );
      setPhase(2);
    } else {
      setActive(exercise);
      setPhase(state.assignment ? 2 : 0);
    }
    setNote("");
    setNext("");
    setSituation("");
    setConfidence(3);
    setSheet("exercise");
  };
  const saveProfile = () => {
    setState((v) => ({
      ...v,
      profile: {
        name: name.trim(),
        role: role.trim(),
        goal: goal.trim(),
        context,
        minutes,
        focus,
        confidence,
        startedAt: v.profile?.startedAt || new Date().toISOString(),
      },
    }));
    setSheet(null);
    setMessage(
      profile
        ? "Your coaching profile is updated."
        : "Your personal journey starts here.",
    );
  };
  const complete = () => {
    try {
      setState((v) =>
        addReflection(v, {
          id: uid(),
          exerciseId: active.id,
          at: new Date().toISOString(),
          confidence,
          note: note.trim(),
          next: next.trim(),
          situation: situation.trim(),
        }),
      );
      setSheet(null);
      setMessage("Reflection saved. Your next practice is ready.");
    } catch {
      setMessage("Rehearse first, then add your situation and reflection.");
    }
  };
  const Heading = ({
    eyebrow,
    title,
    subtitle,
  }: {
    eyebrow: string;
    title: string;
    subtitle: string;
  }) => (
    <View style={{ gap: 10, marginBottom: 28 }}>
      <Label>{eyebrow}</Label>
      <Text style={[s.pageTitle, !wide && { fontSize: 34 }]}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>
    </View>
  );
  const Section = ({
    title,
    action,
    onPress,
  }: {
    title: string;
    action?: string;
    onPress?: () => void;
  }) => (
    <View style={[s.between, { marginBottom: 16 }]}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action && (
        <Pressable accessibilityRole="button" onPress={onPress}>
          <Text style={s.link}>{action} ↗</Text>
        </Pressable>
      )}
    </View>
  );
  const ExerciseCard = ({ exercise }: { exercise: Exercise }) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => openExercise(exercise)}
      style={({ pressed }) => [
        s.card,
        { gap: 16, flex: 1, minWidth: 240, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={s.between}>
        <View style={s.iconBox}>
          <Icon name={exercise.icon as IconName} />
        </View>
        <Text style={s.small}>{exercise.minutes} MIN</Text>
      </View>
      <Text style={s.cardTitle}>{exercise.title}</Text>
      <Text style={s.bodyMuted}>{exercise.description}</Text>
      <View style={s.between}>
        <Text style={s.small}>{exercise.area}</Text>
        <Icon name="arrow-forward" size={19} />
      </View>
    </Pressable>
  );
  function Today() {
    return (
      <>
        <Heading
          eyebrow="A LITTLE PRACTICE. A LASTING DIFFERENCE."
          title={`Your next chapter${profile ? `, ${profile.name.split(" ")[0]}` : ""}.`}
          subtitle="Build a presence that feels authentically you."
        />
        {profile && weeklySummary(state).reviewDue && (
          <View style={[s.card, { marginBottom: 20, gap: 12 }]}>
            <Text style={s.cardTitle}>Make a little space to reflect.</Text>
            <Text style={s.bodyMuted}>
              Your weekly review is ready. Notice a win and choose your next
              commitment.
            </Text>
            <Button
              title="Open weekly review"
              secondary
              onPress={() => setTab("Coach")}
            />
          </View>
        )}
        {!profile && (
          <View
            style={[
              s.card,
              { backgroundColor: C.cream, marginBottom: 22, gap: 12 },
            ]}
          >
            <Text style={s.cardTitle}>A coach that grows with you.</Text>
            <Text style={s.bodyMuted}>
              Tell us where you are and where you want to go. Your profile,
              practice, and reflections stay together, with optional cloud
              backup.
            </Text>
            <Button
              title="Create my personal plan"
              onPress={() => openProfile()}
              icon="arrow-forward"
            />
          </View>
        )}
        <View style={[s.hero, { minHeight: wide ? 280 : 310 }]}>
          <View
            style={{
              flex: 1,
              gap: 17,
              zIndex: 1,
              maxWidth: wide ? "62%" : "100%",
            }}
          >
            <View style={s.row}>
              <View style={s.dot} />
              <Text style={s.heroLabel}>
                {state.assignment
                  ? "YOUR REAL-WORLD CHALLENGE"
                  : "YOUR FOCUS TODAY"}
              </Text>
            </View>
            <Text style={[s.heroTitle, { fontSize: wide ? 40 : 34 }]}>
              {state.assignment
                ? "Take it into\nthe real world."
                : profile?.focus === "Personal style"
                  ? "Feel prepared.\nShow up as you."
                  : profile?.focus === "Communication"
                    ? "Make your\nvoice connect."
                    : profile?.focus === "Etiquette"
                      ? "Feel at ease.\nConnect with care."
                      : "Small steps.\nStronger presence."}
            </Text>
            <Text style={[s.body, { color: "#476243", maxWidth: 390 }]}>
              {rec.exercise.description}
            </Text>
            <View style={[s.row, { flexWrap: "wrap", marginTop: 5 }]}>
              <CoachSpot
                id="today-practice"
                label="Your next practice"
                detail={rec.reason}
                priority={5}
              >
                <Button
                  title={
                    state.assignment
                      ? "Add my reflection"
                      : "Start today’s practice"
                  }
                  onPress={() => openExercise(rec.exercise)}
                  icon="arrow-forward"
                />
              </CoachSpot>
              <Text style={s.small}>
                {rec.exercise.minutes} min · Made for you
              </Text>
            </View>
          </View>
          <View
            style={
              wide
                ? { position: "absolute", right: 12, bottom: 18 }
                : { alignSelf: "center", marginTop: 20 }
            }
          >
            <CoachIllustration size={wide ? 240 : 185} />
          </View>
        </View>
        <View style={[s.row, { marginVertical: 22, gap: wide ? 18 : 8 }]}>
          {[
            {
              n: String(streak(state.reflections)),
              label: "day streak",
              icon: "flame-outline",
            },
            {
              n: String(state.reflections.length),
              label: "real-world practices",
              icon: "checkmark-circle-outline",
            },
            {
              n: profile ? `${currentWeek + 1} / 8` : "—",
              label: "your journey stage",
              icon: "trail-sign-outline",
            },
          ].map((m) => (
            <View key={m.label} style={[s.stat, { padding: wide ? 20 : 13 }]}>
              <Icon name={m.icon as IconName} size={20} color={C.green} />
              <Text style={s.statNumber}>{m.n}</Text>
              <Text style={[s.small, { fontSize: wide ? 12 : 10 }]}>
                {m.label}
              </Text>
            </View>
          ))}
        </View>
        <View
          style={[
            wide ? s.row : { gap: 24 },
            { alignItems: "stretch", gap: 24 },
          ]}
        >
          <View style={{ flex: 1.35 }}>
            <Section
              title="Your coaching path"
              action="View journey"
              onPress={() => setTab("My journey")}
            />
            <View style={[s.card, { gap: 20 }]}>
              <View style={s.between}>
                <Label>STAGE {currentWeek + 1} OF 8</Label>
                <View style={s.pill}>
                  <Text style={s.pillText}>
                    {stagePlan(state).complete
                      ? "Program complete"
                      : profile
                        ? "In progress"
                        : "Your starting point"}
                  </Text>
                </View>
              </View>
              <Text style={s.cardTitle}>{weeks[currentWeek].title}</Text>
              <Text style={s.bodyMuted}>
                {weeks[currentWeek].subtitle}. A few minutes at a time.
              </Text>
              {weeks[currentWeek].ids.map((id, i) => {
                const e = exercises.find((e) => e.id === id)!;
                const done = !stagePlan(state).remaining.includes(id);
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={id}
                    onPress={() => openExercise(e)}
                    style={[
                      s.row,
                      {
                        borderTopWidth: 1,
                        borderColor: C.line,
                        paddingTop: 17,
                      },
                    ]}
                  >
                    <View
                      style={[
                        s.stepCircle,
                        done && { backgroundColor: C.mint },
                      ]}
                    >
                      {done ? (
                        <Icon name="checkmark" size={18} />
                      ) : (
                        <Text style={s.small}>0{i + 1}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, gap: 5 }}>
                      <Text style={s.fieldLabel}>{e.title}</Text>
                      <Text style={s.small}>
                        {done
                          ? "Practiced in real life"
                          : `${e.minutes} min · Learn, practice, reflect`}
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size={17} />
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Section title="Something coming up?" />
            <Pressable
              accessibilityRole="button"
              onPress={() => setSheet("occasion")}
              style={[s.card, { backgroundColor: C.cream, flex: 1, gap: 20 }]}
            >
              <View style={[s.iconBox, { backgroundColor: "#E6DDCF" }]}>
                <Icon name="calendar-outline" />
              </View>
              <Text style={[s.cardTitle, { fontSize: 25 }]}>
                Walk in prepared.
              </Text>
              <Text style={s.bodyMuted}>
                A client meeting, a dinner, a big introduction. Let’s make a
                plan for your moment.
              </Text>
              <View style={[s.row, { marginTop: "auto" }]}>
                <Text style={s.link}>Prepare me</Text>
                <Icon name="arrow-forward" size={18} />
              </View>
            </Pressable>
          </View>
        </View>
        <View style={[s.row, { marginTop: 24, padding: 18, gap: 14 }]}>
          <Icon name="leaf-outline" size={25} color={C.green} />
          <Text style={[s.bodyMuted, { flex: 1, fontStyle: "italic" }]}>
            “Confidence grows through small promises you keep to yourself.”
          </Text>
        </View>
      </>
    );
  }
  function Journey() {
    return (
      <>
        <Heading
          eyebrow="YOUR PERSONAL DEVELOPMENT PROGRAM"
          title="Progress, with a purpose."
          subtitle="Eight stages of learning, showing up, and trying again."
        />
        <View style={[s.card, { marginBottom: 24, gap: 14 }]}>
          <Label>YOUR NORTH STAR</Label>
          <Text raw style={s.cardTitle}>
            {profile?.goal || "Build confidence in the moments that matter."}
          </Text>
          <Text style={s.bodyMuted}>
            {profile
              ? `${profile.minutes} minutes a day · ${profile.focus} · Started ${new Date(profile.startedAt).toLocaleDateString(state.preferences.language === "te" ? "te-IN" : "en-IN")}`
              : "Create your profile to start your own coaching path."}
          </Text>
          {!profile && (
            <Button title="Build my plan" onPress={() => openProfile()} />
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
        >
          {weeks.map((w, i) => (
            <Chip
              key={w.title}
              title={`Stage ${i + 1}`}
              selected={chosenWeek === i}
              onPress={() => setSelectedWeek(i)}
            />
          ))}
        </ScrollView>
        <Section title={weeks[chosenWeek].title} />
        <Text style={[s.bodyMuted, { marginBottom: 20 }]}>
          {weeks[chosenWeek].subtitle}. Revisit any stage at your own pace.
        </Text>
        <View style={[wide ? s.row : { gap: 16 }, { alignItems: "stretch" }]}>
          {weeks[chosenWeek].ids.map((id) => (
            <ExerciseCard
              key={id}
              exercise={exercises.find((e) => e.id === id)!}
            />
          ))}
        </View>
        <View style={{ marginTop: 32 }}>
          <Section title="The practice you’ve put in" />
          {AREAS.map((area) => {
            const count = state.reflections.filter(
              (r) =>
                exercises.find((e) => e.id === r.exerciseId)?.area === area,
            ).length;
            return (
              <View key={area} style={[s.card, { marginBottom: 12, gap: 12 }]}>
                <View style={s.between}>
                  <Text style={s.fieldLabel}>{area}</Text>
                  <Text style={s.small}>
                    {count} practices · {Math.min(count, 4)}/4 milestone
                  </Text>
                </View>
                <View style={s.track}>
                  <View
                    style={[
                      s.trackFill,
                      { width: `${Math.min(100, (count / 4) * 100)}%` },
                    ]}
                  />
                </View>
              </View>
            );
          })}
          <Text style={s.small}>
            Milestones count completed real-world reflections. They don’t
            measure your worth or appearance.
          </Text>
        </View>
        <View style={{ marginTop: 32 }}>
          <Section title="Your reflection journal" />
          {state.reflections.length === 0 ? (
            <View style={s.card}>
              <Text style={s.bodyMuted}>
                Your story will appear here after your first real-world
                practice.
              </Text>
            </View>
          ) : (
            state.reflections.map((r) => (
              <View key={r.id} style={[s.card, { marginBottom: 12, gap: 12 }]}>
                <Label>
                  {new Date(r.at).toLocaleDateString(
                    state.preferences.language === "te" ? "te-IN" : "en-IN",
                  )}{" "}
                  · CONFIDENCE {r.confidence}/5
                </Label>
                <Text style={s.cardTitle}>
                  {exercises.find((e) => e.id === r.exerciseId)?.title ||
                    r.exerciseId}
                </Text>
                <Text raw style={s.small}>
                  {r.situation}
                </Text>
                <Text raw style={s.body}>
                  {r.note}
                </Text>
                {!!r.next && (
                  <Text style={s.bodyMuted}>
                    Next time: <Text raw>{r.next}</Text>
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </>
    );
  }
  function Practice() {
    return (
      <>
        <Heading
          eyebrow="LEARN IT. TRY IT. LIVE IT."
          title="A little better, every day."
          subtitle="Short exercises. Real situations. Changes that stay with you."
        />
        <PracticeScene />
        <View
          style={[
            s.card,
            { backgroundColor: C.mint, marginBottom: 26, gap: 12 },
          ]}
        >
          <Label>
            {state.assignment
              ? "READY FOR REAL LIFE"
              : "YOUR COACH’S NEXT STEP"}
          </Label>
          <Text style={s.cardTitle}>{rec.exercise.title}</Text>
          <Text style={s.bodyMuted}>{rec.reason}</Text>
          {!!state.reflections[0]?.next && (
            <Text style={s.body}>
              You wanted to try: {state.reflections[0].next}
            </Text>
          )}
          <CoachSpot
            id="library-practice"
            label="Recommended practice"
            detail={rec.reason}
            priority={5}
          >
            <Button
              title={
                state.assignment
                  ? "Reflect on my practice"
                  : "Open recommended practice"
              }
              onPress={() => openExercise(rec.exercise)}
              icon="arrow-forward"
            />
          </CoachSpot>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
        >
          {(["All", ...AREAS] as const).map((a) => (
            <Chip
              title={a}
              key={a}
              selected={filter === a}
              onPress={() => setFilter(a)}
            />
          ))}
        </ScrollView>
        <View
          style={{
            flexDirection: wide ? "row" : "column",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {exercises
            .filter((e) => filter === "All" || e.area === filter)
            .map((e) => (
              <View key={e.id} style={{ width: wide ? "48%" : "100%" }}>
                <ExerciseCard exercise={e} />
              </View>
            ))}
        </View>
      </>
    );
  }
  function ProfileScreen() {
    return (
      <>
        <Heading
          eyebrow="THE PERSON AT THE CENTER OF IT ALL"
          title="Always, authentically you."
          subtitle="Your coach remembers what matters. You’re in control."
        />
        <View style={[s.card, { gap: 20 }]}>
          <View style={s.row}>
            <View style={s.avatar}>
              <Text raw style={{ fontSize: 24, color: C.ink }}>
                {profile?.name.charAt(0).toUpperCase() || "E"}
              </Text>
            </View>
            <View style={{ gap: 5, flex: 1 }}>
              <Text raw style={s.cardTitle}>
                {profile?.name || "Your personal profile"}
              </Text>
              <Text raw style={s.bodyMuted}>
                {profile?.role || "A new chapter starts here"}
              </Text>
            </View>
          </View>
          {profile && (
            <>
              <Text raw style={s.body}>
                {profile.goal}
              </Text>
              <View style={[s.row, { flexWrap: "wrap" }]}>
                <View style={s.pill}>
                  <Text style={s.pillText}>{profile.focus}</Text>
                </View>
                <View style={s.pill}>
                  <Text style={s.pillText}>{profile.minutes} min / day</Text>
                </View>
                <View style={s.pill}>
                  <Text style={s.pillText}>{profile.context}</Text>
                </View>
              </View>
            </>
          )}
          <CoachSpot
            id="profile-edit"
            label="Edit my profile"
            detail={
              "Update your goals and available time here. Your on-device coach uses these preferences to choose practices."
            }
            priority={5}
          >
            <Button
              title={profile ? "Edit my profile" : "Create my profile"}
              secondary
              onPress={() => openProfile(!!profile)}
            />
          </CoachSpot>
        </View>
        <View style={{ marginTop: 28 }}>
          <Section title="Your upcoming moments" />
          <Button
            title="Prepare for an occasion"
            onPress={() => setSheet("occasion")}
            icon="add"
          />
          {state.occasions.map((o) => (
            <View key={o.id} style={[s.card, { marginTop: 16, gap: 18 }]}>
              <View style={s.between}>
                <View style={{ flex: 1, gap: 5 }}>
                  <Text style={s.cardTitle}>{o.title}</Text>
                  <Text style={s.small}>
                    {o.date} · {o.checked.length}/9 preparation steps
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${o.title}`}
                  style={s.touch}
                  onPress={() =>
                    setState((v) => ({
                      ...v,
                      occasions: v.occasions.filter((x) => x.id !== o.id),
                    }))
                  }
                >
                  <Icon name="trash-outline" size={19} />
                </Pressable>
              </View>
              {occasionChecklist(o.title).map((group) => (
                <View key={group.time} style={{ gap: 12 }}>
                  <Label>{group.time}</Label>
                  {group.items.map((item) => (
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: o.checked.includes(item) }}
                      aria-checked={o.checked.includes(item)}
                      accessibilityLabel={item}
                      key={item}
                      onPress={() =>
                        setState((v) => ({
                          ...v,
                          occasions: v.occasions.map((x) =>
                            x.id === o.id
                              ? {
                                  ...x,
                                  checked: x.checked.includes(item)
                                    ? x.checked.filter((c) => c !== item)
                                    : [...x.checked, item],
                                }
                              : x,
                          ),
                        }))
                      }
                      style={[s.row, { alignItems: "flex-start" }]}
                    >
                      <Icon
                        name={
                          o.checked.includes(item)
                            ? "checkbox"
                            : "square-outline"
                        }
                        size={21}
                        color={C.green}
                      />
                      <Text
                        style={[
                          s.body,
                          { flex: 1 },
                          o.checked.includes(item) && {
                            textDecorationLine: "line-through",
                            color: C.muted,
                          },
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>
        <View style={{ marginTop: 28 }}>
          <View style={s.card}>
            <LanguagePicker
              value={state.preferences.language}
              onChange={(language) =>
                setState((v) => ({
                  ...v,
                  preferences: { ...v.preferences, language },
                }))
              }
            />
          </View>
          <Account cloud={cloud} state={state} />
          <AdminEntry />
          <Preferences state={state} update={setState} />
        </View>
        <View style={[s.card, { marginTop: 28, gap: 14 }]}>
          <Icon name="lock-closed-outline" />
          <Text style={s.cardTitle}>Personal means personal.</Text>
          <Text style={s.bodyMuted}>
            Your device vault is encrypted. Connected accounts sync reviewed
            wardrobe details; new photos are analysed on-device and discarded.
            Browser encryption cannot protect against someone using your
            unlocked browser.
          </Text>
          <Text style={s.bodyMuted}>
            AI Coach runs on your device. You control self-checks, coach
            memories, uploaded media, exports, and account deletion. Appearance
            and personality are never scored.
          </Text>
          <Button
            title="Delete my local data"
            secondary
            onPress={() => setSheet("delete")}
          />
        </View>
      </>
    );
  }
  const changeLanguage = (language: string) => {
    setState((v) => ({ ...v, preferences: { ...v.preferences, language } }));
    const defaultGoal = "Feel confident in professional situations";
    if (
      sheet === "onboard" &&
      [defaultGoal, translate(defaultGoal, "te")].includes(goal)
    )
      setGoal(translate(defaultGoal, language));
  };
  if (!introDone)
    return (
      <LanguageProvider language={state.preferences.language}>
        <LaunchSplash
          ready={!loading}
          onFinish={() => {
            setIntroDone(true);
            if (!state.profile && !loadFailed) openProfile();
          }}
        />
      </LanguageProvider>
    );
  return (
    <LanguageProvider language={state.preferences.language}>
      <CoachAvatar
        page={tab}
        summary={
          tab === "My style"
            ? `${state.wardrobe.length} pieces in your wardrobe. Add or review pieces to improve outfit suggestions.`
            : rec.reason
        }
        hidden={sheet !== null || !!storageError}
        onOpenChange={setCoachOpen}
        onReveal={(delta, animated) =>
          coachScroll.current?.scrollTo({
            y: Math.max(0, scrollOffset.current + delta),
            animated,
          })
        }
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar style="dark" />
          <View
            style={{ flex: 1, flexDirection: "row" }}
            accessibilityElementsHidden={sheet !== null}
            importantForAccessibility={sheet ? "no-hide-descendants" : "auto"}
            aria-hidden={sheet !== null}
          >
            {wide && (
              <View style={s.sidebar}>
                <View style={[s.row, { marginBottom: 50 }]}>
                  <View style={s.brandMark}>
                    <Image
                      source={require("./assets/icon.png")}
                      style={{ width: 44, height: 44 }}
                      resizeMode="contain"
                      accessibilityLabel="Elevate logo"
                    />
                  </View>
                  <Text style={s.logo}>
                    elevate<Text style={{ color: "#87A071" }}>.</Text>
                  </Text>
                </View>
                <Label>YOUR PERSONAL COACH</Label>
                <View style={{ gap: 8, marginTop: 22 }}>
                  {nav.map((n) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={n.tab}
                      accessibilityState={{
                        selected:
                          tab === n.tab ||
                          (tab === "My journey" && n.tab === "Practice"),
                      }}
                      key={n.tab}
                      onPress={() => setTab(n.tab)}
                      style={[
                        s.navItem,
                        (tab === n.tab ||
                          (tab === "My journey" && n.tab === "Practice")) && {
                          backgroundColor: C.mint,
                        },
                      ]}
                    >
                      <Icon
                        name={n.icon}
                        color={
                          tab === n.tab ||
                          (tab === "My journey" && n.tab === "Practice")
                            ? C.ink
                            : C.muted
                        }
                      />
                      <Text
                        style={[
                          s.navText,
                          (tab === n.tab ||
                            (tab === "My journey" && n.tab === "Practice")) && {
                            color: C.ink,
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {n.tab}
                      </Text>
                      {(tab === n.tab ||
                        (tab === "My journey" && n.tab === "Practice")) && (
                        <View style={[s.dot, { marginLeft: "auto" }]} />
                      )}
                    </Pressable>
                  ))}
                </View>
                <View
                  style={[
                    s.card,
                    {
                      marginTop: "auto",
                      backgroundColor: C.bg,
                      borderWidth: 0,
                      gap: 12,
                    },
                  ]}
                >
                  <Icon name="sparkles-outline" color={C.green} />
                  <Text style={s.fieldLabel}>Becoming, not perfect.</Text>
                  <Text style={s.small}>
                    Your own pace. Your own path. A little growth, every day.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setTab("Profile")}
                  accessibilityRole="button"
                  style={[s.row, { marginTop: 25 }]}
                >
                  <View style={[s.avatar, { width: 38, height: 38 }]}>
                    <Text raw style={s.body}>
                      {profile?.name[0]?.toUpperCase() || "Y"}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text raw style={s.fieldLabel}>
                      {profile?.name || "Your personal space"}
                    </Text>
                    <Text style={s.small}>Private · Your coaching space</Text>
                  </View>
                  <Icon name="chevron-forward" size={16} />
                </Pressable>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={[s.topbar, { paddingHorizontal: wide ? 42 : 22 }]}>
                {wide ? (
                  <Text style={s.small}>
                    MY SPACE /{" "}
                    <Text style={{ color: C.ink }}>{tab.toUpperCase()}</Text>
                  </Text>
                ) : (
                  <View style={s.row}>
                    <Image
                      source={require("./assets/icon.png")}
                      style={{ width: 40, height: 40 }}
                      resizeMode="contain"
                      accessibilityLabel="Elevate logo"
                    />
                    <Text style={[s.logo, { fontSize: 26 }]}>elevate.</Text>
                  </View>
                )}
                <View style={s.row}>
                  <Icon name="sunny-outline" size={18} color={C.green} />
                  <Text style={s.small}>
                    {new Date().toLocaleDateString(
                      state.preferences.language === "te" ? "te-IN" : "en-IN",
                      {
                        month: "short",
                        day: "numeric",
                        weekday: "short",
                      },
                    )}
                  </Text>
                </View>
              </View>
              {!!storageError && (
                <View
                  style={{ padding: 16, backgroundColor: "#FBE8D9", gap: 10 }}
                >
                  <Text accessibilityRole="alert" style={s.body}>
                    {storageError}
                  </Text>
                  <Button
                    secondary
                    title={
                      loadFailed
                        ? "Reset unreadable local data"
                        : "Retry saving"
                    }
                    onPress={() =>
                      loadFailed
                        ? setSheet("delete")
                        : setState((v) => ({ ...v }))
                    }
                  />
                </View>
              )}
              <ScrollView
                ref={coachScroll}
                onScroll={(e) => {
                  scrollOffset.current = e.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
                key={tab}
                contentContainerStyle={{
                  padding: wide ? 40 : 20,
                  paddingTop: wide ? 32 : 24,
                  paddingBottom: coachOpen ? 390 : 110,
                  maxWidth: 1250,
                  width: "100%",
                  alignSelf: "center",
                }}
              >
                {(tab === "Practice" || tab === "My journey") && (
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      marginBottom: 24,
                      backgroundColor: "#E9EEE4",
                      padding: 5,
                      borderRadius: 12,
                    }}
                  >
                    {(["Practice", "My journey"] as Tab[]).map((item) => (
                      <Pressable
                        key={item}
                        accessibilityRole="button"
                        accessibilityLabel={
                          item === "Practice" ? "Exercise library" : item
                        }
                        aria-pressed={tab === item}
                        onPress={() => setTab(item)}
                        style={{
                          flex: 1,
                          minHeight: 46,
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor:
                            tab === item ? "white" : "transparent",
                          borderRadius: 8,
                        }}
                      >
                        <Text style={s.fieldLabel}>
                          {item === "Practice"
                            ? "Exercise library"
                            : "My journey"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {tab === "Today" ? (
                  Today()
                ) : tab === "My journey" ? (
                  Journey()
                ) : tab === "Practice" ? (
                  Practice()
                ) : tab === "Coach" ? (
                  <CoachHub
                    state={state}
                    update={setState}
                    onPractice={openExercise}
                  />
                ) : tab === "My style" ? (
                  <StyleHub
                    state={state}
                    update={setState}
                    cloud={cloud}
                    onAdd={() => {
                      setGarment("");
                      setSheet("garment");
                    }}
                    onPractice={() =>
                      openExercise(exercises.find((e) => e.id === "wardrobe")!)
                    }
                  />
                ) : (
                  ProfileScreen()
                )}
              </ScrollView>
              {!wide && (
                <View style={s.bottomNav}>
                  {nav.map((n) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={n.tab}
                      accessibilityState={{
                        selected:
                          tab === n.tab ||
                          (tab === "My journey" && n.tab === "Practice"),
                      }}
                      key={n.tab}
                      onPress={() => setTab(n.tab)}
                      style={s.bottomItem}
                    >
                      <View
                        style={[
                          {
                            paddingHorizontal: 16,
                            paddingVertical: 5,
                            borderRadius: 20,
                          },
                          (tab === n.tab ||
                            (tab === "My journey" && n.tab === "Practice")) && {
                            backgroundColor: C.mint,
                          },
                        ]}
                      >
                        <Icon
                          name={n.icon}
                          size={22}
                          color={
                            tab === n.tab ||
                            (tab === "My journey" && n.tab === "Practice")
                              ? C.ink
                              : C.muted
                          }
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "500",
                          color:
                            tab === n.tab ||
                            (tab === "My journey" && n.tab === "Practice")
                              ? C.ink
                              : C.muted,
                        }}
                      >
                        {n.tab}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
          {!!message && (
            <View
              accessibilityRole="alert"
              style={[s.toast, { bottom: wide ? 24 : 85 }]}
            >
              <Icon name="checkmark-circle-outline" color="white" size={20} />
              <Text style={{ color: "white", flex: 1, lineHeight: 21 }}>
                {message}
              </Text>
            </View>
          )}
          {sheet !== null && (
            <Modal
              visible={sheet !== null}
              transparent
              animationType="fade"
              onRequestClose={() => setSheet(null)}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={s.overlay}
              >
                <View
                  style={[
                    s.modal,
                    {
                      maxHeight: sheet === "onboard" ? "100%" : "92%",
                      width: wide ? 580 : "100%",
                      ...(sheet === "onboard"
                        ? { flex: 1, borderRadius: wide ? 20 : 0 }
                        : {}),
                    },
                  ]}
                >
                  <View
                    style={[
                      s.between,
                      {
                        padding: 22,
                        borderBottomWidth: 1,
                        borderColor: C.line,
                      },
                    ]}
                  >
                    <Text style={s.fieldLabel}>
                      {sheet === "onboard"
                        ? "LET’S GET TO KNOW YOU"
                        : sheet === "edit"
                          ? "YOUR PERSONAL PROFILE"
                          : sheet === "exercise"
                            ? "YOUR PRACTICE STUDIO"
                            : sheet === "occasion"
                              ? "PREPARE ME"
                              : sheet === "garment"
                                ? "YOUR WARDROBE"
                                : "YOUR DATA"}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Close dialog"
                      style={s.touch}
                      onPress={() => setSheet(null)}
                    >
                      <Icon name="close" />
                    </Pressable>
                  </View>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ padding: 26, gap: 22 }}
                  >
                    {(sheet === "onboard" || sheet === "edit") && (
                      <>
                        <Text style={s.modalTitle}>
                          Your journey starts with you.
                        </Text>
                        <Text style={s.bodyMuted}>
                          A few details help shape your daily coaching. You can
                          change these whenever life changes.
                        </Text>
                        <LanguagePicker
                          value={state.preferences.language}
                          onChange={changeLanguage}
                        />
                        <Text style={s.small}>
                          Name and goal are required. Other details help
                          personalise your plan.
                        </Text>
                        <Field
                          label="What should we call you?"
                          value={name}
                          onChange={setName}
                          placeholder="Your first name"
                        />
                        <Field
                          label="Your role or everyday context"
                          value={role}
                          onChange={setRole}
                          placeholder="e.g. Educator, manager, student"
                        />
                        <Field
                          label="What would you like to work toward?"
                          value={goal}
                          onChange={setGoal}
                          multiline
                        />
                        <Text style={s.fieldLabel}>Your first focus</Text>
                        <View style={[s.row, { flexWrap: "wrap" }]}>
                          {AREAS.map((a) => (
                            <Chip
                              key={a}
                              title={a}
                              selected={focus === a}
                              onPress={() => setFocus(a)}
                            />
                          ))}
                        </View>
                        <Text style={s.fieldLabel}>Your usual environment</Text>
                        <View style={[s.row, { flexWrap: "wrap" }]}>
                          {["Casual", "Smart casual", "Formal", "Varies"].map(
                            (c) => (
                              <Chip
                                key={c}
                                title={c}
                                selected={context === c}
                                onPress={() => setContext(c)}
                              />
                            ),
                          )}
                        </View>
                        <Text style={s.fieldLabel}>
                          Time you can make for yourself
                        </Text>
                        <View style={s.row}>
                          {[3, 5, 10].map((n) => (
                            <Chip
                              key={n}
                              title={`${n} min / day`}
                              selected={minutes === n}
                              onPress={() => setMinutes(n)}
                            />
                          ))}
                        </View>
                        <Text style={s.fieldLabel}>
                          How confident do you feel today?
                        </Text>
                        <Rating value={confidence} onChange={setConfidence} />
                        <Text style={s.small}>
                          Saved in your device vault, and synced when you
                          connect a cloud account.
                        </Text>
                        <Button
                          title={
                            sheet === "edit"
                              ? "Save my profile"
                              : "Begin my journey"
                          }
                          onPress={saveProfile}
                          disabled={!name.trim() || !goal.trim() || loadFailed}
                          icon="arrow-forward"
                        />
                      </>
                    )}
                    {sheet === "exercise" && (
                      <>
                        <View style={s.row}>
                          {["Learn", "Rehearse", "Real life"].map((p, i) => (
                            <Pressable
                              accessibilityRole="tab"
                              accessibilityState={{
                                selected: phase === i,
                                disabled:
                                  i === 2 &&
                                  state.assignment?.exerciseId !== active.id,
                              }}
                              disabled={
                                i === 2 &&
                                state.assignment?.exerciseId !== active.id
                              }
                              onPress={() => setPhase(i)}
                              key={p}
                              style={[
                                s.pill,
                                {
                                  backgroundColor: phase === i ? C.mint : C.bg,
                                },
                              ]}
                            >
                              <Text style={s.pillText}>
                                {i + 1}. {p}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                        <Text style={s.modalTitle}>{active.title}</Text>
                        {phase === 0 ? (
                          <>
                            <Text style={s.body}>{active.lesson}</Text>
                            <PracticeVideos
                              key={active.id}
                              exerciseId={active.id}
                            />
                            <View
                              style={[
                                s.card,
                                { backgroundColor: C.cream, gap: 8 },
                              ]}
                            >
                              <Label>WHY THIS PRACTICE</Label>
                              <Text style={s.bodyMuted}>
                                {active.description}
                              </Text>
                            </View>
                            <Button
                              title="Got it. Let’s rehearse"
                              onPress={() => {
                                setState((v) => ({
                                  ...v,
                                  learned: [
                                    ...new Set([...v.learned, active.id]),
                                  ],
                                }));
                                setPhase(1);
                              }}
                              icon="arrow-forward"
                            />
                          </>
                        ) : phase === 1 ? (
                          <>
                            <Text style={s.bodyMuted}>
                              Take {active.minutes} minutes. Move through each
                              step at your own pace.
                            </Text>
                            {active.steps.map((step, i) => (
                              <View
                                style={[s.row, { alignItems: "flex-start" }]}
                                key={step}
                              >
                                <View style={s.stepCircle}>
                                  <Text style={s.body}>{i + 1}</Text>
                                </View>
                                <Text style={[s.body, { flex: 1 }]}>
                                  {step}
                                </Text>
                              </View>
                            ))}
                            <Button
                              title="I’ve rehearsed — set my challenge"
                              onPress={() => {
                                setState((v) => ({
                                  ...v,
                                  assignment:
                                    v.assignment?.exerciseId === active.id
                                      ? v.assignment
                                      : {
                                          exerciseId: active.id,
                                          rehearsedAt: new Date().toISOString(),
                                        },
                                }));
                                setPhase(2);
                              }}
                              icon="checkmark"
                            />
                          </>
                        ) : (
                          <>
                            <View
                              style={[
                                s.card,
                                { backgroundColor: C.mint, gap: 10 },
                              ]}
                            >
                              <Label>YOUR REAL-WORLD CHALLENGE</Label>
                              <Text style={s.body}>{active.challenge}</Text>
                            </View>
                            <Text style={s.bodyMuted}>
                              Come back after trying this in a real situation.
                              Your challenge stays saved until you reflect.
                            </Text>
                            <Field
                              label="Where did you try it?"
                              value={situation}
                              onChange={setSituation}
                              placeholder="e.g. Monday’s team meeting"
                            />
                            <Field
                              label="What happened? What did you notice?"
                              value={note}
                              onChange={setNote}
                              multiline
                              placeholder="One thing that worked, or something that felt difficult…"
                            />
                            <Text style={s.fieldLabel}>
                              How did that practice feel?
                            </Text>
                            <Rating
                              value={confidence}
                              onChange={setConfidence}
                            />
                            <Field
                              label="What would you try next time? (optional)"
                              value={next}
                              onChange={setNext}
                              placeholder="A small adjustment for next time"
                            />
                            <Button
                              title="Save reflection & keep growing"
                              onPress={complete}
                              disabled={!note.trim() || !situation.trim()}
                              icon="checkmark"
                            />
                            <Button
                              secondary
                              title="I’ll come back after trying it"
                              onPress={() => setSheet(null)}
                            />
                          </>
                        )}
                      </>
                    )}
                    {sheet === "occasion" && (
                      <>
                        <Text style={s.modalTitle}>
                          Your moment. Your plan.
                        </Text>
                        <Text style={s.bodyMuted}>
                          Turn an upcoming occasion into a simple preparation
                          checklist.
                        </Text>
                        <Text style={s.fieldLabel}>What’s coming up?</Text>
                        <View style={[s.row, { flexWrap: "wrap" }]}>
                          {[
                            "Client meeting",
                            "Job interview",
                            "Business dinner",
                            "Networking event",
                            "Presentation",
                          ].map((t) => (
                            <Chip
                              key={t}
                              title={t}
                              selected={eventTitle === t}
                              onPress={() => setEventTitle(t)}
                            />
                          ))}
                        </View>
                        <Field
                          label="Date (YYYY-MM-DD)"
                          value={date}
                          onChange={setDate}
                        />
                        <View
                          style={[
                            s.card,
                            { backgroundColor: C.cream, gap: 10 },
                          ]}
                        >
                          <Label>YOUR PREPARATION PLAN</Label>
                          <Text style={s.body}>
                            The day before → Before you leave → In the moment
                          </Text>
                          <Text style={s.small}>
                            Nine practical steps, saved to your profile.
                          </Text>
                        </View>
                        <Button
                          title="Create my preparation plan"
                          disabled={
                            !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
                            !Number.isFinite(Date.parse(date)) ||
                            new Date(date).toISOString().slice(0, 10) !==
                              date ||
                            loadFailed
                          }
                          onPress={() => {
                            setState((v) => ({
                              ...v,
                              occasions: [
                                {
                                  id: uid(),
                                  title: eventTitle,
                                  date,
                                  checked: [],
                                },
                                ...v.occasions,
                              ],
                            }));
                            setSheet(null);
                            setTab("Profile");
                            setMessage("Your preparation plan is ready.");
                          }}
                          icon="arrow-forward"
                        />
                      </>
                    )}
                    {sheet === "garment" && (
                      <>
                        <Text style={s.modalTitle}>An everyday favorite.</Text>
                        <Field
                          label="Piece name"
                          value={garment}
                          onChange={setGarment}
                          placeholder="e.g. White Oxford shirt"
                        />
                        <Text style={s.fieldLabel}>Category</Text>
                        <View style={[s.row, { flexWrap: "wrap" }]}>
                          {[
                            "Tops",
                            "Bottoms",
                            "Dresses",
                            "Shoes",
                            "Layers",
                            "Accessories",
                          ].map((c) => (
                            <Chip
                              key={c}
                              title={c}
                              selected={category === c}
                              onPress={() => setCategory(c)}
                            />
                          ))}
                        </View>
                        <Field
                          label="Color"
                          value={color}
                          onChange={setColor}
                        />
                        <Button
                          title="Add to my wardrobe"
                          disabled={
                            !garment.trim() || !color.trim() || loadFailed
                          }
                          onPress={() => {
                            setState((v) => ({
                              ...v,
                              wardrobe: [
                                ...v.wardrobe,
                                {
                                  id: uid(),
                                  name: garment.trim(),
                                  category,
                                  color: color.trim(),
                                },
                              ],
                            }));
                            setSheet(null);
                            setMessage("Added to your wardrobe.");
                          }}
                          icon="add"
                        />
                      </>
                    )}
                    {sheet === "delete" && (
                      <>
                        <Text style={s.modalTitle}>
                          Start with a clean slate?
                        </Text>
                        <Text style={s.body}>
                          This deletes your profile, wardrobe, preparation
                          plans, and reflection journal from this device. It
                          cannot be undone.
                        </Text>
                        <Button
                          title="Keep my data"
                          onPress={() => setSheet(null)}
                        />
                        <Button
                          secondary
                          title="Yes, delete all my local data"
                          onPress={async () => {
                            try {
                              const empty = initialState();
                              await cloud.disconnect();
                              await setReminder(false, 9, 0);
                              await saveState(empty);
                              setState(empty);
                              setLoadFailed(false);
                              setStorageError("");
                              setSheet(null);
                              setTab("Today");
                              setMessage("Your local data has been deleted.");
                            } catch {
                              setStorageError(
                                "Deletion failed. Your data may still be stored. Try again.",
                              );
                              setSheet(null);
                            }
                          }}
                        />
                      </>
                    )}
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
            </Modal>
          )}
        </SafeAreaView>
      </CoachAvatar>
    </LanguageProvider>
  );
}
export default function App() {
  useContent();
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
const serif =
  Platform.OS === "ios"
    ? "Georgia"
    : Platform.OS === "android"
      ? "serif"
      : "Georgia";
const s = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", gap: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sidebar: {
    width: 248,
    backgroundColor: "#FCFCF9",
    borderRightWidth: 1,
    borderColor: C.line,
    padding: 24,
    paddingTop: 35,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { fontFamily: serif, fontSize: 33, color: C.ink, letterSpacing: -1.5 },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.7,
    color: C.muted,
    lineHeight: 16,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 15,
    borderRadius: 10,
  },
  navText: { fontSize: 14, color: C.muted },
  topbar: {
    height: 76,
    borderBottomWidth: 1,
    borderColor: C.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTitle: {
    fontFamily: serif,
    fontSize: 43,
    color: C.ink,
    letterSpacing: -1.3,
  },
  subtitle: { fontSize: 15, color: C.muted, lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 25, color: C.ink },
  bodyMuted: { fontSize: 14, lineHeight: 23, color: C.muted },
  small: { fontSize: 12, color: C.muted, lineHeight: 19 },
  fieldLabel: { fontSize: 14, fontWeight: "500", color: C.ink, lineHeight: 20 },
  button: {
    backgroundColor: C.ink,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    alignSelf: "flex-start",
    minHeight: 48,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: C.line,
  },
  buttonText: { fontSize: 13, fontWeight: "600", color: C.white },
  hero: {
    backgroundColor: C.mint,
    borderRadius: 16,
    padding: 30,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.8,
    color: "#4A6747",
  },
  heroTitle: {
    fontFamily: serif,
    color: C.ink,
    letterSpacing: -0.7,
    lineHeight: 46,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#749564" },
  heroArt: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 280,
    height: 280,
    opacity: 0.65,
  },
  arch: {
    position: "absolute",
    width: 185,
    height: 330,
    borderTopLeftRadius: 130,
    borderTopRightRadius: 130,
    borderWidth: 1,
    borderColor: "#98B686",
    transform: [{ rotate: "-24deg" }],
  },
  artStar: { position: "absolute", right: 64, top: 110 },
  stat: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    gap: 8,
  },
  statNumber: { fontSize: 27, fontFamily: serif, color: C.ink },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: C.ink,
    letterSpacing: -0.3,
  },
  link: { fontSize: 12, fontWeight: "600", color: C.green },
  card: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 13,
    padding: 23,
  },
  cardTitle: {
    fontFamily: serif,
    fontSize: 23,
    lineHeight: 29,
    color: C.ink,
    letterSpacing: -0.4,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: C.bg,
    borderRadius: 6,
  },
  pillText: { fontSize: 10, fontWeight: "500", color: C.green, lineHeight: 16 },
  stepCircle: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FCFCF9",
    borderTopWidth: 1,
    borderColor: C.line,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  bottomItem: { flex: 1, alignItems: "center", gap: 3, minHeight: 48 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  chipActive: { backgroundColor: C.mint, borderColor: "#B6CDA5" },
  chipText: { fontSize: 12, color: C.muted },
  track: {
    height: 6,
    backgroundColor: C.bg,
    borderRadius: 4,
    overflow: "hidden",
  },
  trackFill: { height: 6, backgroundColor: "#91AC7D", borderRadius: 4 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(20,38,30,.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: { backgroundColor: C.bg, borderRadius: 20, overflow: "hidden" },
  modalTitle: {
    fontFamily: serif,
    fontSize: 31,
    color: C.ink,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  input: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: C.ink,
    minHeight: 49,
  },
  rating: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    backgroundColor: C.white,
  },
  touch: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    alignSelf: "center",
    maxWidth: 560,
    backgroundColor: C.ink,
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    zIndex: 20,
  },
});
