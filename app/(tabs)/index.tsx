import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppMark, CategoryDot, PrimaryButton, ProgressBar, SectionHeading, SecondaryButton, UI } from "@/components/budgely-ui";
import { CATEGORY_COLORS, EXPENSE_CATEGORIES, formatMoney, formatMonth, monthKey, useBudget } from "@/lib/budget-store";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(key: string) {
  const date = new Date(`${key}-01T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date).replace(".", "");
}

function TrendChart({ transactions }: { transactions: ReturnType<typeof useBudget>["transactions"] }) {
  const points = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 5 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (4 - index), 1);
      const key = date.toISOString().slice(0, 7);
      const income = transactions.filter((item) => item.type === "income" && monthKey(item.date) === key).reduce((sum, item) => sum + item.amount, 0);
      const expense = transactions.filter((item) => item.type === "expense" && monthKey(item.date) === key).reduce((sum, item) => sum + item.amount, 0);
      return { key, income, expense };
    });
  }, [transactions]);

  const max = Math.max(...points.flatMap((point) => [point.income, point.expense]), 1);
  const width = 320;
  const height = 144;
  const chartLeft = 10;
  const chartTop = 12;
  const chartWidth = width - 20;
  const chartHeight = height - 24;
  const toPoint = (value: number, index: number) => `${chartLeft + (index * chartWidth) / (points.length - 1)},${chartTop + chartHeight - (value / max) * chartHeight}`;
  const incomePath = points.map((point, index) => toPoint(point.income, index)).join(" ");
  const expensePath = points.map((point, index) => toPoint(point.expense, index)).join(" ");

  return (
    <View style={styles.trendCard}>
      <View style={styles.trendTopline}>
        <View>
          <Text style={styles.cardEyebrow}>ÉVOLUTION</Text>
          <Text style={styles.cardTitle}>Revenus & dépenses</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: UI.lime }]} /><Text style={styles.legendText}>Revenus</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: UI.violet }]} /><Text style={styles.legendText}>Dépenses</Text></View>
        </View>
      </View>
      <View style={{ marginTop: 14 }}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          {[0, 1, 2, 3].map((line) => <Line key={line} x1="8" x2={width - 8} y1={14 + line * 38} y2={14 + line * 38} stroke="#303034" strokeWidth="1" />)}
          <Path d={`M ${incomePath}`} fill="none" stroke={UI.lime} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <Path d={`M ${expensePath}`} fill="none" stroke={UI.violet} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point, index) => <Circle key={`income-${point.key}`} cx={chartLeft + (index * chartWidth) / (points.length - 1)} cy={chartTop + chartHeight - (point.income / max) * chartHeight} r="4" fill={UI.lime} stroke={UI.bg} strokeWidth="2" />)}
          {points.map((point, index) => <Circle key={`expense-${point.key}`} cx={chartLeft + (index * chartWidth) / (points.length - 1)} cy={chartTop + chartHeight - (point.expense / max) * chartHeight} r="4" fill={UI.violet} stroke={UI.bg} strokeWidth="2" />)}
        </Svg>
        <View style={styles.chartLabels}>{points.map((point) => <Text key={point.key} style={styles.chartLabel}>{monthLabel(point.key)}</Text>)}</View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { transactions, budgets, exportCsv } = useBudget();
  const month = currentMonth();
  const currentTransactions = transactions.filter((item) => monthKey(item.date) === month);
  const income = currentTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expense = currentTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expense;
  const totalBudget = budgets.reduce((sum, item) => sum + item.amount, 0);
  const spentByCategory = EXPENSE_CATEGORIES.map((category) => ({
    category,
    spent: currentTransactions.filter((item) => item.type === "expense" && item.category === category).reduce((sum, item) => sum + item.amount, 0),
    budget: budgets.find((item) => item.category === category)?.amount ?? 0,
  })).filter((item) => item.spent > 0 || item.budget > 0);
  const spentTotal = spentByCategory.reduce((sum, item) => sum + item.spent, 0);
  const overBudget = spentByCategory.find((item) => item.budget > 0 && item.spent > item.budget);
  const overPercent = overBudget ? Math.round(((overBudget.spent - overBudget.budget) / overBudget.budget) * 100) : 0;
  const displayMonth = formatMonth(new Date(`${month}-01T12:00:00`));
  const recent = currentTransactions.filter((item) => item.type === "expense").slice(0, 3);

  const handleExport = () => {
    const csv = exportCsv();
    const web = globalThis as unknown as { document?: Document; URL?: typeof URL };
    if (web.document && web.URL) {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = web.URL.createObjectURL(blob);
      const anchor = web.document.createElement("a");
      anchor.href = url;
      anchor.download = "budgely-transactions.csv";
      anchor.click();
      web.URL.revokeObjectURL(url);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + 10, paddingBottom: 110 }]}>
        <View style={styles.header}>
          <View style={styles.brandRow}><AppMark small /><View><Text style={styles.brandName}>BUDGELY</Text><Text style={styles.brandTagline}>votre budget, en clair</Text></View></View>
          <Pressable onPress={handleExport} style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.7 }]}><Ionicons name="download-outline" size={16} color={UI.text} /><Text style={styles.headerButtonText}>CSV</Text></Pressable>
        </View>

        <View style={styles.hero}><Text style={styles.heroEyebrow}>{displayMonth.toUpperCase()}</Text><Text style={styles.heroTitle}>Votre argent.{"\n"}<Text style={{ color: UI.violet }}>Plus simple.</Text></Text><Text style={styles.heroCopy}>Un regard calme sur ce qui entre, ce qui sort et ce qui reste.</Text></View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceGlow} />
          <View style={styles.balanceHeader}><Text style={styles.balanceLabel}>SOLDE DISPONIBLE</Text><View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>CE MOIS</Text></View></View>
          <Text style={styles.balanceAmount}>{formatMoney(balance)}</Text>
          <Text style={styles.balanceHint}>{balance >= 0 ? "Vous êtes dans le vert." : "On garde le cap ensemble."}</Text>
          <View style={styles.balanceStats}><View><Text style={styles.statLabel}>REVENUS</Text><Text style={styles.statValue}>{formatMoney(income)}</Text></View><View style={styles.statDivider} /><View><Text style={styles.statLabel}>DÉPENSES</Text><Text style={styles.statValue}>{formatMoney(expense)}</Text></View><View style={styles.balanceIcon}><Ionicons name="sparkles" size={17} color={UI.bg} /></View></View>
        </View>

        <View style={styles.actionsRow}><PrimaryButton label="Ajouter" icon="add" onPress={() => router.push("/transactions")} style={{ flex: 1 }} /><SecondaryButton label="Mes budgets" icon="pie-chart-outline" onPress={() => router.push("/budgets")} style={{ flex: 1 }} /></View>

        <View style={styles.sectionBlock}><SectionHeading eyebrow="À RETENIR" title="Votre mois en un coup d’œil" />
          <View style={styles.insightCard}><View style={styles.insightIcon}><Ionicons name={overBudget ? "alert-circle-outline" : "checkmark-circle-outline"} size={21} color={overBudget ? UI.yellow : UI.lime} /></View><View style={{ flex: 1 }}><Text style={styles.insightTitle}>{overBudget ? `${overBudget.category} dépasse le budget de ${overPercent} %` : "Vous tenez vos budgets"}</Text><Text style={styles.insightCopy}>{overBudget ? "Un petit ajustement maintenant et le mois reste sous contrôle." : `Il vous reste ${formatMoney(Math.max(totalBudget - spentTotal, 0))} de marge sur vos enveloppes.`}</Text></View><Ionicons name="chevron-forward" size={18} color={UI.subtle} /></View>
          <View style={styles.miniMetrics}><View style={styles.metricCard}><Text style={styles.metricLabel}>BUDGET UTILISÉ</Text><Text style={styles.metricValue}>{totalBudget ? Math.round((spentTotal / totalBudget) * 100) : 0}<Text style={styles.metricUnit}>%</Text></Text><ProgressBar value={totalBudget ? spentTotal / totalBudget : 0} color={overBudget ? UI.yellow : UI.violet} /></View><View style={styles.metricCard}><Text style={styles.metricLabel}>TRANSACTIONS</Text><Text style={styles.metricValue}>{currentTransactions.length}</Text><Text style={styles.metricSub}>ce mois-ci</Text></View></View>
        </View>

        <View style={styles.sectionBlock}><SectionHeading eyebrow="RÉPARTITION" title="Où part votre argent ?" action="Tout voir" onAction={() => router.push("/budgets")} />
          <View style={styles.categoryCard}>{spentByCategory.slice(0, 5).map((item) => { const color = CATEGORY_COLORS[item.category] ?? UI.violet; return <View key={item.category} style={styles.categoryRow}><View style={styles.categoryMain}><CategoryDot color={color} /><Text style={styles.categoryName}>{item.category}</Text><Text style={styles.categoryAmount}>{formatMoney(item.spent)}</Text></View><View style={styles.categoryBarLine}><ProgressBar value={spentTotal ? item.spent / Math.max(spentTotal, 1) : 0} color={color} height={5} /><Text style={styles.categoryPercent}>{spentTotal ? Math.round((item.spent / spentTotal) * 100) : 0}%</Text></View></View>; })}</View>
        </View>

        <TrendChart transactions={transactions} />

        <View style={styles.sectionBlock}><SectionHeading eyebrow="DERNIERS MOUVEMENTS" title="Rien ne vous échappe" action="Voir tout" onAction={() => router.push("/transactions")} />
          <View style={styles.recentCard}>{recent.length ? recent.map((item) => <View key={item.id} style={styles.recentRow}><View style={[styles.recentIcon, { backgroundColor: `${CATEGORY_COLORS[item.category] ?? UI.violet}22` }]}><Ionicons name="arrow-up" size={15} color={CATEGORY_COLORS[item.category] ?? UI.violet} /></View><View style={{ flex: 1 }}><Text style={styles.recentLabel}>{item.label}</Text><Text style={styles.recentMeta}>{item.category} · {new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(`${item.date}T12:00:00`))}</Text></View><Text style={styles.recentAmount}>− {formatMoney(item.amount, true)}</Text></View>) : <Text style={styles.emptyText}>Ajoutez votre premier mouvement pour commencer.</Text>}</View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: UI.bg },
  content: { paddingHorizontal: 18, maxWidth: 760, width: "100%", alignSelf: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandName: { color: UI.text, fontWeight: "900", fontSize: 13, letterSpacing: 2.2 },
  brandTagline: { color: UI.subtle, fontSize: 10, marginTop: 2 },
  headerButton: { flexDirection: "row", gap: 5, alignItems: "center", borderWidth: 1, borderColor: UI.border, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 },
  headerButtonText: { color: UI.text, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  hero: { marginBottom: 22 },
  heroEyebrow: { color: UI.cyan, fontSize: 10, fontWeight: "900", letterSpacing: 2.2, marginBottom: 9 },
  heroTitle: { color: UI.text, fontSize: 38, lineHeight: 40, fontWeight: "900", letterSpacing: -1.8 },
  heroCopy: { color: UI.muted, fontSize: 14, lineHeight: 20, marginTop: 11, maxWidth: 300 },
  balanceCard: { backgroundColor: UI.violetDeep, borderRadius: 26, padding: 21, overflow: "hidden", minHeight: 188, marginBottom: 14 },
  balanceGlow: { position: "absolute", width: 190, height: 190, borderRadius: 95, backgroundColor: "#B78BFF", opacity: 0.35, right: -64, top: -92 },
  balanceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balanceLabel: { color: "#E7DFFF", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#6845C7", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: UI.lime },
  liveText: { color: "#E6DFFF", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  balanceAmount: { color: "#FFFFFF", fontSize: 38, fontWeight: "900", letterSpacing: -1.5, marginTop: 10 },
  balanceHint: { color: "#E3D9FF", fontSize: 12, marginTop: 1 },
  balanceStats: { flexDirection: "row", alignItems: "flex-end", gap: 19, marginTop: 22 },
  statLabel: { color: "#D8CBFF", fontSize: 9, letterSpacing: 1.1, fontWeight: "900", marginBottom: 4 },
  statValue: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  statDivider: { width: 1, height: 26, backgroundColor: "#A68BFF66" },
  balanceIcon: { marginLeft: "auto", backgroundColor: UI.lime, width: 32, height: 32, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  sectionBlock: { marginBottom: 27 },
  insightCard: { backgroundColor: UI.surface, borderRadius: 19, borderWidth: 1, borderColor: UI.border, padding: 14, flexDirection: "row", alignItems: "center", gap: 11 },
  insightIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#FDE68A18", justifyContent: "center", alignItems: "center" },
  insightTitle: { color: UI.text, fontSize: 14, fontWeight: "800", marginBottom: 3 },
  insightCopy: { color: UI.muted, fontSize: 12, lineHeight: 17 },
  miniMetrics: { flexDirection: "row", gap: 10, marginTop: 10 },
  metricCard: { flex: 1, backgroundColor: UI.surface, borderRadius: 18, borderWidth: 1, borderColor: UI.border, padding: 14 },
  metricLabel: { color: UI.subtle, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  metricValue: { color: UI.text, fontSize: 25, fontWeight: "900", marginTop: 7 },
  metricUnit: { color: UI.violet, fontSize: 14 },
  metricSub: { color: UI.muted, fontSize: 12, marginTop: 3 },
  categoryCard: { backgroundColor: UI.surface, borderRadius: 20, borderWidth: 1, borderColor: UI.border, paddingHorizontal: 15, paddingVertical: 5 },
  categoryRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#2A2A2D" },
  categoryMain: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryName: { color: UI.text, flex: 1, fontSize: 13, fontWeight: "700" },
  categoryAmount: { color: UI.text, fontSize: 13, fontWeight: "800" },
  categoryBarLine: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8, paddingLeft: 18 },
  categoryPercent: { color: UI.muted, width: 28, fontSize: 10, textAlign: "right" },
  trendCard: { backgroundColor: UI.surface, borderRadius: 22, borderWidth: 1, borderColor: UI.border, padding: 16, marginBottom: 27 },
  trendTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardEyebrow: { color: UI.cyan, fontSize: 9, fontWeight: "900", letterSpacing: 1.4, marginBottom: 5 },
  cardTitle: { color: UI.text, fontSize: 17, fontWeight: "800" },
  legendRow: { gap: 7, alignItems: "flex-end" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendLine: { width: 12, height: 3, borderRadius: 2 },
  legendText: { color: UI.muted, fontSize: 9 },
  chartLabels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 3, marginTop: -2 },
  chartLabel: { color: UI.subtle, fontSize: 10, textTransform: "capitalize" },
  recentCard: { backgroundColor: UI.surface, borderRadius: 20, borderWidth: 1, borderColor: UI.border, paddingHorizontal: 14 },
  recentRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#2A2A2D" },
  recentIcon: { width: 34, height: 34, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  recentLabel: { color: UI.text, fontSize: 13, fontWeight: "800" },
  recentMeta: { color: UI.muted, fontSize: 11, marginTop: 3 },
  recentAmount: { color: UI.text, fontSize: 13, fontWeight: "900" },
  emptyText: { color: UI.muted, fontSize: 13, paddingVertical: 22, textAlign: "center" },
});
