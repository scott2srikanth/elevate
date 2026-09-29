import { Image, Text } from "../i18n";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { CoachingAnalysis, imageKeys } from "../shared/analysis";
import { k } from "./kit";
export const studioImages = {
  reflection: require("../../assets/illustrations/reflection.png"),
  conversation: require("../../assets/illustrations/practice.png"),
  speaking: require("../../assets/illustrations/speaking.png"),
  posture: require("../../assets/illustrations/posture.png"),
  style: require("../../assets/illustrations/style.png"),
};
export type StudioImage = (typeof imageKeys)[number];
export function StudioBanner({
  image,
  title,
  subtitle,
}: {
  image: StudioImage;
  title: string;
  subtitle: string;
}) {
  const wide = useWindowDimensions().width >= 1000;
  return (
    <View style={[v.banner, wide && { flexDirection: "row" }]}>
      <Image
        source={studioImages[image]}
        accessibilityLabel={title}
        resizeMode="contain"
        style={[v.bannerImage, wide && { width: "42%", height: 250 }]}
      />
      <View style={{ padding: 20, gap: 8, flex: 1, justifyContent: "center" }}>
        <Text style={k.title}>{title}</Text>
        <Text style={k.body}>{subtitle}</Text>
      </View>
    </View>
  );
}
function DataChart({ chart }: { chart: CoachingAnalysis["charts"][number] }) {
  const [width, setWidth] = useState(300);
  const label = `${chart.title}. ${chart.basis.replaceAll("_", " ")}. ${chart.points.map((p) => `${p.label}: ${p.value} ${chart.unit}`).join("; ")}`;
  const plotWidth = Math.max(260, width);
  const x = (i: number) =>
    14 + (i * (plotWidth - 28)) / Math.max(1, chart.points.length - 1);
  const y = (n: number) => 144 - (n / chart.max) * 126;
  return (
    <View style={k.card}>
      <Text raw style={k.title}>
        {chart.title}
      </Text>
      <Text style={v.tag}>
        {chart.basis.replaceAll("_", " ").toUpperCase()} · {chart.unit}
      </Text>
      {chart.type === "bar" ? (
        <View accessible accessibilityLabel={label} style={{ gap: 15 }}>
          {chart.points.map((p, i) => (
            <View key={i} style={{ gap: 6 }}>
              <View style={v.between}>
                <Text raw style={[k.label, { flex: 1 }]}>
                  {p.label}
                </Text>
                <Text style={k.label}>
                  {p.value}{" "}
                  {chart.unit === "confidence / 5" ? "/ 5" : chart.unit}
                </Text>
              </View>
              <View style={v.track}>
                <View
                  style={[v.fill, { width: `${(p.value / chart.max) * 100}%` }]}
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <>
          <Text style={k.muted}>
            Scale: 0–{chart.max} {chart.unit} · earlier → later
          </Text>
          <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            <ScrollView horizontal contentContainerStyle={{ minWidth: "100%" }}>
              <View
                accessible
                accessibilityLabel={label}
                style={{ width: plotWidth, height: 220 }}
              >
                {[0, 0.5, 1].map((tick) => (
                  <View
                    key={tick}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: y(tick * chart.max),
                      height: 1,
                      backgroundColor: "#E5DFD3",
                    }}
                  />
                ))}
                {chart.points.map((p, i) => {
                  const next = chart.points[i + 1];
                  const dx = next ? x(i + 1) - x(i) : 0;
                  const dy = next ? y(next.value) - y(p.value) : 0;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  return (
                    <React.Fragment key={i}>
                      {next && (
                        <View
                          style={{
                            position: "absolute",
                            left: (x(i) + x(i + 1)) / 2 - length / 2,
                            top: (y(p.value) + y(next.value)) / 2,
                            width: length,
                            height: 2,
                            backgroundColor: "#526649",
                            transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                          }}
                        />
                      )}
                      <View
                        style={{
                          position: "absolute",
                          left: x(i) - 5,
                          top: y(p.value) - 4,
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: "#344333",
                        }}
                      />
                      <Text
                        style={{
                          position: "absolute",
                          top: y(p.value) - 21,
                          left: Math.min(
                            plotWidth - 30,
                            Math.max(0, x(i) - 15),
                          ),
                          fontSize: 11,
                          color: "#344333",
                        }}
                      >
                        {p.value}
                      </Text>
                    </React.Fragment>
                  );
                })}
                <View
                  style={{
                    position: "absolute",
                    top: 155,
                    left: 0,
                    right: 0,
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  {chart.points.map((p, i) => (
                    <Text
                      raw
                      key={i}
                      numberOfLines={3}
                      style={{
                        width: `${100 / chart.points.length}%`,
                        fontSize: 10,
                        color: "#56604F",
                        textAlign:
                          i === 0
                            ? "left"
                            : i === chart.points.length - 1
                              ? "right"
                              : "center",
                      }}
                    >
                      {p.label}
                    </Text>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </>
      )}
      <Text raw style={k.body}>
        {chart.explanation}
      </Text>
      <Text raw selectable style={k.muted}>
        {chart.points
          .map((p) => `${p.label}: ${p.value} ${chart.unit}`)
          .join(" · ")}
      </Text>
    </View>
  );
}
export function AnalysisView({ analysis }: { analysis: CoachingAnalysis }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={[k.card, { backgroundColor: "#E9F0E1" }]}>
        <Text style={v.tag}>YOUR COACHING ANALYSIS</Text>
        <Text raw accessibilityRole="header" style={k.title}>
          {analysis.title}
        </Text>
        <Text raw selectable style={k.body}>
          {analysis.summary}
        </Text>
      </View>
      {analysis.evidence.length > 0 && (
        <View style={k.card}>
          <Text style={k.label}>What this is based on</Text>
          {analysis.evidence.map((item, i) => (
            <Text raw key={i} selectable style={k.body}>
              • {item}
            </Text>
          ))}
        </View>
      )}
      <View style={v.columns}>
        {[
          { title: "Build on your strengths", items: analysis.strengths },
          { title: "Make room to grow", items: analysis.opportunities },
        ]
          .filter((group) => group.items.length)
          .map((group) => (
            <View key={group.title} style={[k.card, v.column]}>
              <Text style={k.title}>{group.title}</Text>
              {group.items.map((item, i) => (
                <Text raw key={i} style={k.body}>
                  • {item}
                </Text>
              ))}
            </View>
          ))}
      </View>
      {analysis.charts.map((chart, i) => (
        <DataChart key={i} chart={chart} />
      ))}
      {!analysis.charts.length && (
        <Text style={k.muted}>
          No numerical chart is available yet. Your guidance can still be useful
          without a score.
        </Text>
      )}
      <Text accessibilityRole="header" style={k.title}>
        See it. Try it. Make it yours.
      </Text>
      <Text style={k.muted}>
        Illustrative coaching examples. These are teaching images,
        not observations of you.
      </Text>
      <View style={v.columns}>
        {analysis.visualGuides.map((guide, i) => (
          <View key={i} style={[v.banner, v.column]}>
            <Image
              source={studioImages[guide.image]}
              accessibilityLabel={guide.title}
              resizeMode="contain"
              style={{ width: "100%", height: 280, backgroundColor: "#F4F2E9" }}
            />
            <View style={{ padding: 18, gap: 9 }}>
              <Text raw style={k.title}>
                {guide.title}
              </Text>
              <Text raw style={k.body}>
                {guide.caption}
              </Text>
              <Text style={k.label}>Try this</Text>
              <Text raw style={k.body}>
                {guide.tryThis}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View style={k.card}>
        <Text raw style={k.title}>
          {analysis.diagram.title}
        </Text>
        {analysis.diagram.steps.map((step, i) => (
          <View key={i} style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Image
                source={studioImages[step.image]}
                resizeMode="contain"
                accessibilityLabel={`Step ${i + 1}: ${step.title}`}
                style={{ width: 76, height: 76, borderRadius: 10 }}
              />
              <View style={{ flex: 1, gap: 5 }}>
                <Text raw style={k.label}>
                  {i + 1}. {step.title}
                </Text>
                <Text raw style={k.body}>
                  {step.detail}
                </Text>
              </View>
            </View>
            {i < analysis.diagram.steps.length - 1 && (
              <Text
                accessibilityElementsHidden
                style={{ color: "#526649", fontSize: 24, marginLeft: 30 }}
              >
                ↓
              </Text>
            )}
          </View>
        ))}
      </View>
      <View style={k.card}>
        <Text style={k.title}>Your real-world practice plan</Text>
        {analysis.actions.map((action, i) => (
          <View
            key={i}
            style={{
              gap: 8,
              borderTopWidth: 1,
              borderColor: "#E5DFD3",
              paddingTop: 14,
            }}
          >
            <Text raw style={k.label}>
              {i + 1}. {action.title}
            </Text>
            <Text raw style={v.tag}>
              {action.when}
            </Text>
            {action.steps.map((step, j) => (
              <Text raw key={j} style={k.body}>
                {j + 1}. {step}
              </Text>
            ))}
            <Text style={k.body}>
              Reflect afterward: <Text raw>{action.reflection}</Text>
            </Text>
          </View>
        ))}
      </View>
      {!!analysis.limitations.length && (
        <View style={k.card}>
          <Text style={k.label}>Keep in mind</Text>
          {analysis.limitations.map((item, i) => (
            <Text raw key={i} style={k.body}>
              • {item}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
const v = StyleSheet.create({
  banner: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5DFD3",
    marginBottom: 12,
  },
  bannerImage: { width: "100%", height: 190 },
  tag: {
    color: "#526649",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  columns: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  column: { flex: 1, flexBasis: 280, minWidth: 0 },
  between: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  track: {
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E8EDE3",
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: "#526649", borderRadius: 7 },
});
