import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppMark, CategoryDot, PrimaryButton, ProgressBar, SecondaryButton, UI } from "@/components/budgely-ui";
import { CATEGORY_COLORS, EXPENSE_CATEGORIES, formatMoney, formatMonth, monthKey, useBudget } from "@/lib/budget-store";

function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} /><View style={styles.sheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{title}</Text><Pressable onPress={onClose} hitSlop={12}><Ionicons name="close" size={22} color={UI.muted} /></Pressable></View>{children}</View></View>
    </Modal>
  );
}

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, budgets, setBudget } = useBudget();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Restaurants");
  const [amount, setAmount] = useState("");
  const month = new Date().toISOString().slice(0, 7);
  const monthTransactions = transactions.filter((item) => monthKey(item.date) === month && item.type === "expense");
  const totalBudget = budgets.reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = monthTransactions.reduce((sum, item) => sum + item.amount, 0);
  const totalRemaining = totalBudget - totalSpent;
  const completion = totalBudget ? totalSpent / totalBudget : 0;

  const rows = useMemo(() => EXPENSE_CATEGORIES.map((category) => {
    const budget = budgets.find((item) => item.category === category)?.amount ?? 0;
    const spent = monthTransactions.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0);
    return { category, budget, spent, remaining: budget - spent };
  }).filter((row) => row.budget > 0 || row.spent > 0), [budgets, monthTransactions]);

  const openEdit = (category: string, currentAmount: number) => {
    setSelectedCategory(category);
    setAmount(currentAmount ? String(currentAmount) : "");
    setModalVisible(true);
  };

  const save = () => {
    const parsed = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setBudget(selectedCategory, parsed);
    setModalVisible(false);
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + 10, paddingBottom: 110 }]}>
        <View style={styles.header}><View style={styles.brandRow}><AppMark small /><View><Text style={styles.brandName}>BUDGETS</Text><Text style={styles.brandTagline}>donnez un rôle à chaque euro</Text></View></View><Pressable onPress={() => openEdit("Restaurants", budgets.find((item) => item.category === "Restaurants")?.amount ?? 0)} style={styles.addCircle}><Ionicons name="add" size={21} color={UI.bg} /></Pressable></View>
        <Text style={styles.title}>Votre mois, cadré.</Text><Text style={styles.subtitle}>{formatMonth(new Date())} · enveloppes et respiration.</Text>

        <View style={styles.overviewCard}><View style={styles.overviewTop}><View><Text style={styles.overviewEyebrow}>BUDGET GLOBAL</Text><Text style={styles.overviewAmount}>{formatMoney(totalBudget)}</Text><Text style={styles.overviewCopy}>{totalRemaining >= 0 ? `${formatMoney(totalRemaining)} encore disponibles` : `${formatMoney(Math.abs(totalRemaining))} au-delà de vos enveloppes`}</Text></View><View style={styles.ring}><View style={styles.ringInner}><Text style={styles.ringValue}>{Math.round(completion * 100)}%</Text><Text style={styles.ringLabel}>utilisé</Text></View></View></View><ProgressBar value={completion} color={completion > 1 ? UI.coral : UI.lime} height={9} /></View>

        <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>ENVELOPPES</Text><Text style={styles.sectionTitle}>Chaque catégorie a son cap</Text></View>
        <View style={styles.listCard}>{rows.map((row) => { const color = CATEGORY_COLORS[row.category] ?? UI.violet; const ratio = row.budget ? row.spent / row.budget : 0; const over = ratio > 1; return <Pressable key={row.category} onPress={() => openEdit(row.category, row.budget)} style={styles.budgetRow}><View style={styles.budgetTop}><View style={styles.budgetNameWrap}><CategoryDot color={color} size={11} /><Text style={styles.budgetName}>{row.category}</Text></View><Text style={[styles.budgetRemaining, { color: over ? UI.coral : UI.lime }]}>{over ? `+${formatMoney(row.spent - row.budget)}` : formatMoney(row.remaining)} <Text style={styles.budgetRemainingHint}>{over ? "dépassé" : "restant"}</Text></Text></View><View style={styles.budgetMeta}><Text style={styles.budgetSpent}>{formatMoney(row.spent)} <Text style={styles.budgetOf}>sur {formatMoney(row.budget)}</Text></Text><Text style={styles.editLabel}>Modifier <Ionicons name="chevron-forward" size={11} color={UI.violet} /></Text></View><ProgressBar value={ratio} color={over ? UI.coral : color} height={7} /></Pressable>; })}</View>

        <View style={styles.tipCard}><View style={styles.tipIcon}><Ionicons name="bulb-outline" size={20} color={UI.yellow} /></View><View style={{ flex: 1 }}><Text style={styles.tipTitle}>Le bon réflexe</Text><Text style={styles.tipCopy}>{rows.some((row) => row.spent > row.budget) ? "Une enveloppe dépasse : regardez les détails dans Mouvements pour décider sans culpabiliser." : "Définissez un cap réaliste. Un budget est là pour vous éclairer, pas pour vous punir."}</Text></View></View>
        <SecondaryButton label="Ajouter une catégorie" icon="add-circle-outline" onPress={() => openEdit("Autre", 0)} />
      </ScrollView>

      <Sheet visible={modalVisible} title="Définir une enveloppe" onClose={() => setModalVisible(false)}>
        <Text style={styles.modalCopy}>Combien souhaitez-vous réserver chaque mois pour cette catégorie ?</Text>
        <Text style={styles.fieldLabel}>CATÉGORIE</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 3 }}>{EXPENSE_CATEGORIES.map((category) => <Pressable key={category} onPress={() => setSelectedCategory(category)} style={[styles.categoryChip, selectedCategory === category && { backgroundColor: `${CATEGORY_COLORS[category] ?? UI.violet}26`, borderColor: CATEGORY_COLORS[category] ?? UI.violet }]}><CategoryDot color={CATEGORY_COLORS[category] ?? UI.violet} size={7} /><Text style={styles.categoryChipText}>{category}</Text></Pressable>)}</ScrollView>
        <Text style={styles.fieldLabel}>MONTANT MENSUEL</Text><View style={styles.amountField}><TextInput value={amount} onChangeText={setAmount} placeholder="0,00" placeholderTextColor={UI.subtle} keyboardType="decimal-pad" style={styles.amountInput} /><Text style={styles.currency}>€</Text></View>
        <PrimaryButton label="Enregistrer le budget" icon="checkmark" onPress={save} style={{ marginTop: 22 }} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: UI.bg },
  content: { paddingHorizontal: 18, maxWidth: 760, width: "100%", alignSelf: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandName: { color: UI.text, fontWeight: "900", fontSize: 13, letterSpacing: 1.9 },
  brandTagline: { color: UI.subtle, fontSize: 10, marginTop: 2 },
  addCircle: { width: 40, height: 40, borderRadius: 15, backgroundColor: UI.lime, alignItems: "center", justifyContent: "center" },
  title: { color: UI.text, fontSize: 35, lineHeight: 38, fontWeight: "900", letterSpacing: -1.3 },
  subtitle: { color: UI.muted, fontSize: 14, marginTop: 5, marginBottom: 20 },
  overviewCard: { backgroundColor: UI.violetDeep, borderRadius: 24, padding: 19, marginBottom: 28, overflow: "hidden" },
  overviewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 19 },
  overviewEyebrow: { color: "#D8CBFF", fontSize: 9, letterSpacing: 1.3, fontWeight: "900" },
  overviewAmount: { color: UI.text, fontSize: 30, fontWeight: "900", marginTop: 8 },
  overviewCopy: { color: "#E0D6FF", fontSize: 12, marginTop: 3 },
  ring: { width: 83, height: 83, borderRadius: 42, borderWidth: 8, borderColor: UI.lime, borderRightColor: "#FFFFFF26", borderBottomColor: "#FFFFFF26", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-45deg" }] },
  ringInner: { alignItems: "center", transform: [{ rotate: "45deg" }] },
  ringValue: { color: UI.text, fontSize: 17, fontWeight: "900" },
  ringLabel: { color: "#D8CBFF", fontSize: 9, marginTop: 1 },
  sectionHeader: { marginBottom: 13 },
  sectionEyebrow: { color: UI.cyan, fontSize: 9, fontWeight: "900", letterSpacing: 1.6, marginBottom: 5 },
  sectionTitle: { color: UI.text, fontSize: 20, fontWeight: "900" },
  listCard: { backgroundColor: UI.surface, borderRadius: 21, borderWidth: 1, borderColor: UI.border, paddingHorizontal: 14, marginBottom: 14 },
  budgetRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#2A2A2D" },
  budgetTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  budgetNameWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  budgetName: { color: UI.text, fontSize: 14, fontWeight: "800" },
  budgetRemaining: { fontSize: 12, fontWeight: "900" },
  budgetRemainingHint: { color: UI.muted, fontSize: 10, fontWeight: "600" },
  budgetMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 9 },
  budgetSpent: { color: UI.text, fontSize: 11, fontWeight: "800" },
  budgetOf: { color: UI.subtle, fontWeight: "500" },
  editLabel: { color: UI.violet, fontSize: 10, fontWeight: "800" },
  tipCard: { flexDirection: "row", gap: 11, alignItems: "center", backgroundColor: "#FDE68A12", borderRadius: 18, padding: 14, marginBottom: 12 },
  tipIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#FDE68A1A", alignItems: "center", justifyContent: "center" },
  tipTitle: { color: UI.text, fontSize: 13, fontWeight: "800", marginBottom: 3 },
  tipCopy: { color: UI.muted, fontSize: 11, lineHeight: 16 },
  modalBackdrop: { flex: 1, backgroundColor: "#000000AA", justifyContent: "flex-end" },
  sheet: { backgroundColor: UI.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 30, maxHeight: "90%", borderTopWidth: 1, borderColor: UI.border },
  sheetHandle: { width: 40, height: 4, borderRadius: 3, backgroundColor: UI.border, alignSelf: "center", marginBottom: 16 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sheetTitle: { color: UI.text, fontSize: 20, fontWeight: "900" },
  modalCopy: { color: UI.muted, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  fieldLabel: { color: UI.subtle, fontSize: 9, letterSpacing: 1.4, fontWeight: "900", marginTop: 13, marginBottom: 7 },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: UI.border, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 8 },
  categoryChipText: { color: UI.text, fontSize: 11, fontWeight: "700" },
  amountField: { flexDirection: "row", alignItems: "center", backgroundColor: UI.bg, borderWidth: 1, borderColor: UI.border, borderRadius: 15, paddingHorizontal: 14 },
  amountInput: { flex: 1, color: UI.text, fontSize: 26, fontWeight: "900", paddingVertical: 11 },
  currency: { color: UI.violet, fontSize: 21, fontWeight: "900" },
});
