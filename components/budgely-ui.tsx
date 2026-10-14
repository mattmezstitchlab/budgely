import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View, type PressableProps } from "react-native";

export const UI = {
  bg: "#101011",
  surface: "#19191B",
  surfaceRaised: "#222225",
  border: "#303034",
  text: "#F6F5F2",
  muted: "#99989F",
  subtle: "#67666D",
  violet: "#B78BFF",
  violetDeep: "#7A55E8",
  cyan: "#67E8F9",
  lime: "#B7F397",
  yellow: "#FDE68A",
  coral: "#FF9BBA",
  orange: "#FFB86B",
  danger: "#FF8E9E",
};

export function SectionHeading({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={12} style={({ pressed }) => [styles.textAction, pressed && { opacity: 0.65 }]}>
          <Text style={styles.textActionLabel}>{action}</Text>
          <Ionicons name="arrow-forward" size={15} color={UI.violet} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function PrimaryButton({ icon, label, onPress, style, ...props }: PressableProps & { icon?: keyof typeof Ionicons.glyphMap; label: string }) {
  const resolvedStyle = typeof style === "function" ? undefined : style;
  return (
    <Pressable {...props} onPress={onPress} style={({ pressed }) => [styles.primaryButton, resolvedStyle, pressed && styles.pressed]}>
      {icon ? <Ionicons name={icon} size={18} color={UI.bg} /> : null}
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ icon, label, onPress, style, ...props }: PressableProps & { icon?: keyof typeof Ionicons.glyphMap; label: string }) {
  const resolvedStyle = typeof style === "function" ? undefined : style;
  return (
    <Pressable {...props} onPress={onPress} style={({ pressed }) => [styles.secondaryButton, resolvedStyle, pressed && styles.pressed]}>
      {icon ? <Ionicons name={icon} size={17} color={UI.text} /> : null}
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function CategoryDot({ color, size = 10 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

export function ProgressBar({ value, color = UI.violet, height = 7 }: { value: number; color?: string; height?: number }) {
  return (
    <View style={[styles.progressTrack, { height }]}>
      <View style={[styles.progressFill, { width: `${Math.min(Math.max(value, 0), 1) * 100}%`, backgroundColor: color, height }]} />
    </View>
  );
}

export function AppMark({ small = false }: { small?: boolean }) {
  const size = small ? 28 : 40;
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: small ? 8 : 11 }]}>
      <View style={[styles.markInner, { width: size * 0.42, height: size * 0.42 }]} />
    </View>
  );
}

export const styles = StyleSheet.create({
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 14 },
  eyebrow: { color: UI.violet, fontSize: 10, fontWeight: "800", letterSpacing: 1.7, marginBottom: 5 },
  sectionTitle: { color: UI.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  textAction: { flexDirection: "row", alignItems: "center", gap: 4, paddingBottom: 2 },
  textActionLabel: { color: UI.violet, fontSize: 12, fontWeight: "800" },
  primaryButton: { minHeight: 48, paddingHorizontal: 18, borderRadius: 16, backgroundColor: UI.lime, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryButtonText: { color: UI.bg, fontSize: 14, fontWeight: "900" },
  secondaryButton: { minHeight: 48, paddingHorizontal: 16, borderRadius: 16, backgroundColor: UI.surfaceRaised, borderWidth: 1, borderColor: UI.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryButtonText: { color: UI.text, fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  progressTrack: { backgroundColor: "#36353B", borderRadius: 99, overflow: "hidden" },
  progressFill: { borderRadius: 99 },
  mark: { backgroundColor: UI.violet, alignItems: "center", justifyContent: "center" },
  markInner: { backgroundColor: UI.bg, borderRadius: 3, transform: [{ rotate: "45deg" }] },
});
