import { CoachSpot } from "./CoachAvatar";
import React, { useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Pressable, Text, TextInput } from "../i18n";
import type { State, Garment } from "../coach";
import type { Cloud } from "../useCloud";
import { MediaStudio } from "./Studio";
import { Outfit } from "./CoachingTools";
import { Action, Choice, k } from "./kit";
import { garmentCategories } from "../shared/garment";
export function StyleHub({
  state,
  update,
  cloud,
  onAdd,
  onPractice,
}: {
  state: State;
  update: React.Dispatch<React.SetStateAction<State>>;
  cloud: Cloud;
  onAdd: () => void;
  onPractice: () => void;
}) {
  const [view, setView] = useState("Outfits");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [removed, setRemoved] = useState<Garment | null>(null);
  const wide = useWindowDimensions().width >= 1100;
  const pieces = state.wardrobe.filter(
    (g) =>
      (filter === "All" || g.category === filter) &&
      `${g.name} ${g.color}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <View style={{ gap: 22 }}>
      <View style={u.heading}>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={u.eyebrow}>YOUR EVERYDAY WARDROBE</Text>
          <Text accessibilityRole="header" style={u.title}>
            My style
          </Text>
          <Text style={k.body}>Make more of what you own.</Text>
        </View>
        <CoachSpot
          id="style-add"
          label="Add a wardrobe piece"
          detail="Use this button to enter a piece manually, without taking a photo."
          priority={40}
        >
          <Action title="Add a wardrobe piece" onPress={onAdd} />
        </CoachSpot>
      </View>
      <View style={u.tabs}>
        {["Outfits", "Wardrobe", "Photo check"].map((tab) => (
          <CoachSpot
            key={tab}
            id={`style-${tab}`}
            label={tab}
            priority={
              tab === (state.wardrobe.length ? "Outfits" : "Photo check")
                ? 5
                : 20
            }
            detail={
              tab === "Outfits"
                ? "Choose an occasion here to see combinations from the pieces you own. Recommendations use your reviewed details and occasion preferences."
                : tab === "Wardrobe"
                  ? `You have ${state.wardrobe.length} saved pieces. Open Wardrobe to search, filter or remove an item; Undo restores the last removal.`
                  : "Tap Photo check to analyse one garment locally. Review the type and colour before saving. Your photo is never uploaded."
            }
            style={{ flex: 1 }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tab}
              accessibilityState={{ selected: view === tab }}
              aria-pressed={view === tab}
              onPress={() => setView(tab)}
              style={[u.tab, view === tab && u.active]}
            >
              <Text style={[u.tabLabel, view === tab && { color: "#fff" }]}>
                {tab}
              </Text>
            </Pressable>
          </CoachSpot>
        ))}
      </View>
      {view === "Outfits" && (
        <>
          {state.wardrobe.length ? (
            <Outfit state={state} />
          ) : (
            <View style={u.hero}>
              <Text style={u.heroEyebrow}>START WITH YOUR FAVOURITES</Text>
              <Text accessibilityRole="header" style={u.heroTitle}>
                A few pieces. More possibilities.
              </Text>
              <Text style={u.heroBody}>
                Add a top, a bottom and shoes — or a dress and shoes. Your
                outfit suggestions will start here.
              </Text>
              <Action
                title="Start with a photo"
                onPress={() => setView("Photo check")}
                secondary
              />
            </View>
          )}
          <View style={{ flexDirection: wide ? "row" : "column", gap: 14 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Browse my wardrobe"
              onPress={() => setView("Wardrobe")}
              style={u.actionCard}
            >
              <Text style={u.eyebrow}>YOUR COLLECTION</Text>
              <Text style={u.cardTitle}>
                {state.wardrobe.length} saved pieces
              </Text>
              <Text style={k.body}>
                Find, filter and organise the clothes you own.
              </Text>
              <Text style={u.link}>Browse wardrobe →</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Check a garment photo"
              onPress={() => setView("Photo check")}
              style={u.actionCard}
            >
              <Text style={u.eyebrow}>ADD WITH A PHOTO</Text>
              <Text style={u.cardTitle}>Less typing. Your final say.</Text>
              <Text style={k.body}>
                Review suggested garment details before saving.
              </Text>
              <Text style={u.link}>Open photo check →</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Practise building an outfit"
            onPress={onPractice}
            style={u.practice}
          >
            <Text style={k.label}>Build confidence with what you wear</Text>
            <Text style={u.link}>Try a 6-minute practice →</Text>
          </Pressable>
        </>
      )}
      {view === "Photo check" && (
        <MediaStudio state={state} update={update} cloud={cloud} wardrobe />
      )}
      {view === "Wardrobe" && (
        <>
          <View style={{ gap: 12 }}>
            <Text accessibilityRole="header" style={u.cardTitle}>
              Your collection
            </Text>
            <TextInput
              accessibilityLabel="Search wardrobe"
              placeholder="Search by name or colour"
              value={query}
              onChangeText={setQuery}
              style={k.input}
            />
            <View style={k.row}>
              {["All", ...garmentCategories].map((c) => (
                <Choice
                  key={c}
                  title={c}
                  selected={filter === c}
                  onPress={() => setFilter(c)}
                />
              ))}
            </View>
            <Text style={k.muted}>
              {pieces.length} of {state.wardrobe.length} pieces
            </Text>
          </View>
          {removed && (
            <View style={u.undo}>
              <Text style={k.body}>Piece removed.</Text>
              <Action
                title="Undo removal"
                secondary
                onPress={() => {
                  const piece = removed;
                  update((s) =>
                    s.wardrobe.some((g) => g.id === piece.id)
                      ? s
                      : { ...s, wardrobe: [...s.wardrobe, piece] },
                  );
                  setRemoved(null);
                }}
              />
            </View>
          )}
          {!pieces.length && (
            <View style={u.empty}>
              <Text style={u.cardTitle}>
                {state.wardrobe.length
                  ? "No matching pieces"
                  : "Room for your favourites"}
              </Text>
              <Text style={k.body}>
                {state.wardrobe.length
                  ? "Try another name, colour or category."
                  : "Use Add a wardrobe piece or Photo check to begin."}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
            {pieces.map((g) => (
              <View
                key={g.id}
                style={[u.piece, { width: wide ? "48%" : "100%" }]}
              >
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={u.eyebrow}>{g.category}</Text>
                  <Text raw style={u.cardTitle}>
                    {g.name}
                  </Text>
                  <Text raw style={k.body}>
                    {g.color}
                  </Text>
                  {g.garmentAnalysis?.confirmed && (
                    <Text style={k.muted}>
                      {g.garmentAnalysis.formality === "Any"
                        ? "Reviewed by you"
                        : `${g.garmentAnalysis.formality} · Reviewed by you`}
                    </Text>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${g.name}`}
                  style={u.remove}
                  onPress={() => {
                    setRemoved(g);
                    update((s) => ({
                      ...s,
                      wardrobe: s.wardrobe.filter((p) => p.id !== g.id),
                    }));
                  }}
                >
                  <Text style={k.muted}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
const u = StyleSheet.create({
  heading: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 20,
  },
  title: { fontSize: 32, lineHeight: 40, fontWeight: "700", color: "#283C32" },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: "700",
    color: "#61705B",
  },
  tabs: {
    flexDirection: "row",
    padding: 5,
    gap: 4,
    backgroundColor: "#EBEEE6",
    borderRadius: 14,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    padding: 8,
  },
  tabLabel: { fontSize: 13, fontWeight: "600", color: "#435540" },
  active: { backgroundColor: "#344C3D" },
  hero: { padding: 26, gap: 18, backgroundColor: "#344C3D", borderRadius: 22 },
  heroEyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: "#E1E9D5",
  },
  heroTitle: { fontSize: 27, lineHeight: 35, fontWeight: "700", color: "#fff" },
  heroBody: { fontSize: 15, lineHeight: 24, color: "#EDF1E7", maxWidth: 560 },
  actionCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5DC",
    padding: 23,
    gap: 12,
    borderRadius: 18,
  },
  cardTitle: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "600",
    color: "#283C32",
  },
  link: { fontSize: 13, lineHeight: 20, fontWeight: "600", color: "#344C3D" },
  practice: {
    borderTopWidth: 1,
    borderColor: "#DDE2D7",
    paddingVertical: 20,
    minHeight: 60,
    gap: 8,
  },
  empty: { padding: 26, gap: 8, borderRadius: 18, backgroundColor: "#F0F1E9" },
  piece: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5DFD3",
    backgroundColor: "#fff",
    flexDirection: "row",
    gap: 10,
  },
  remove: {
    minHeight: 48,
    minWidth: 62,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  undo: {
    backgroundColor: "#E7EDDF",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
});
