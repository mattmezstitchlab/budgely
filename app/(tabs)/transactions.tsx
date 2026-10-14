import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppMark, CategoryDot, PrimaryButton, SecondaryButton, UI } from "@/components/budgely-ui";
import { ALL_CATEGORIES, CATEGORY_COLORS, EXPENSE_CATEGORIES, formatMoney, formatShortDate, INCOME_CATEGORIES, type Transaction, type TransactionType, useBudget } from "@/lib/budget-store";

const today = () => new Date().toISOString().slice(0, 10);

type Draft = { type: TransactionType; amount: string; date: string; category: string; label: string };
const emptyDraft: Draft = { type: "expense", amount: "", date: today(), category: "Restaurants", label: "" };

function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{title}</Text><Pressable onPress={onClose} hitSlop={12}><Ionicons name="close" size={22} color={UI.muted} /></Pressable></View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function TransactionRow({ item, onEdit, onDelete }: { item: Transaction; onEdit: () => void; onDelete: () => void }) {
  const color = CATEGORY_COLORS[item.category] ?? UI.violet;
  const isIncome = item.type === "income";
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: `${color}1C` }]}><Ionicons name={isIncome ? "arrow-down" : "arrow-up"} size={16} color={color} /></View>
      <View style={{ flex: 1 }}><Text style={styles.rowLabel}>{item.label || item.category}</Text><View style={styles.rowMeta}><CategoryDot color={color} size={6} /><Text style={styles.rowMetaText}>{item.category}</Text><Text style={styles.rowMetaText}>·</Text><Text style={styles.rowMetaText}>{formatShortDate(item.date)}</Text></View></View>
      <View style={styles.rowRight}><Text style={[styles.rowAmount, { color: isIncome ? UI.lime : UI.text }]}>{isIncome ? "+" : "−"} {formatMoney(item.amount, true)}</Text><View style={styles.rowActions}><Pressable onPress={onEdit} hitSlop={8}><Ionicons name="create-outline" size={15} color={UI.muted} /></Pressable><Pressable onPress={onDelete} hitSlop={8}><Ionicons name="trash-outline" size={15} color={UI.muted} /></Pressable></View></View>
    </View>
  );
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, addTransaction, updateTransaction, deleteTransaction, importCsv, exportCsv } = useBudget();
  const [filter, setFilter] = useState<"all" | TransactionType>("all");
  const [formVisible, setFormVisible] = useState(false);
  const [csvVisible, setCsvVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [csvText, setCsvText] = useState("");
  const [csvNotice, setCsvNotice] = useState("");

  const visibleTransactions = transactions.filter((item) => filter === "all" || item.type === filter);
  const totalIncome = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);

  const openNew = (type: TransactionType = "expense") => {
    setEditingId(null);
    setDraft({ ...emptyDraft, type, category: type === "expense" ? "Restaurants" : "Salaire" });
    setFormVisible(true);
  };

  const openEdit = (item: Transaction) => {
    setEditingId(item.id);
    setDraft({ type: item.type, amount: String(item.amount), date: item.date, category: item.category, label: item.label });
    setFormVisible(true);
  };

  const saveTransaction = () => {
    const amount = Number(draft.amount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0 || !draft.date) return;
    const transaction = { type: draft.type, amount, date: draft.date, category: draft.category, label: draft.label.trim() || draft.category };
    if (editingId) updateTransaction(editingId, transaction);
    else addTransaction(transaction);
    setFormVisible(false);
  };

  const handleExport = async () => {
    const csv = exportCsv();
    const browser = globalThis as unknown as { document?: Document; URL?: { createObjectURL: (blob: Blob) => string; revokeObjectURL: (url: string) => void } };
    if (Platform.OS === "web" && browser.document && browser.URL) {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = browser.URL.createObjectURL(blob);
      const anchor = browser.document.createElement("a");
      anchor.href = url;
      anchor.download = "budgely-transactions.csv";
      anchor.click();
      browser.URL.revokeObjectURL(url);
    } else {
      await Share.share({ title: "Export Budgely", message: csv });
    }
  };

  const chooseFile = () => {
    const browser = globalThis as unknown as { document?: Document; FileReader?: typeof FileReader };
    if (Platform.OS !== "web" || !browser.document || !browser.FileReader) return;
    const input = browser.document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new browser.FileReader!();
      reader.onload = () => setCsvText(String(reader.result ?? ""));
      reader.readAsText(file);
    };
    input.click();
  };

  const handleImport = async () => {
    const count = await importCsv(csvText);
    setCsvNotice(count ? `${count} mouvement${count > 1 ? "s" : ""} importé${count > 1 ? "s" : ""}.` : "Aucun mouvement reconnu dans ce CSV.");
    if (count) setCsvText("");
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + 10, paddingBottom: 110 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><View style={styles.brandRow}><AppMark small /><View><Text style={styles.brandName}>MOUVEMENTS</Text><Text style={styles.brandTagline}>chaque euro a son histoire</Text></View></View><Pressable onPress={() => openNew()} style={styles.addCircle}><Ionicons name="add" size={21} color={UI.bg} /></Pressable></View>
        <Text style={styles.title}>Tout est là.</Text><Text style={styles.subtitle}>Ajoutez, ajustez, avancez.</Text>

        <View style={styles.summaryCard}><View><Text style={styles.summaryLabel}>TOTAL ENTRÉ</Text><Text style={[styles.summaryValue, { color: UI.lime }]}>{formatMoney(totalIncome)}</Text></View><View style={styles.summaryDivider} /><View><Text style={styles.summaryLabel}>TOTAL SORTI</Text><Text style={styles.summaryValue}>{formatMoney(totalExpense)}</Text></View></View>

        <View style={styles.toolbar}><View style={styles.filters}>{(["all", "expense", "income"] as const).map((value) => <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filter, filter === value && styles.filterActive]}><Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{value === "all" ? "Tous" : value === "expense" ? "Dépenses" : "Revenus"}</Text></Pressable>)}</View><View style={styles.csvActions}><Pressable onPress={() => setCsvVisible(true)} hitSlop={8}><Ionicons name="cloud-upload-outline" size={19} color={UI.text} /></Pressable><Pressable onPress={handleExport} hitSlop={8}><Ionicons name="download-outline" size={19} color={UI.text} /></Pressable></View></View>

        <View style={styles.listCard}>{visibleTransactions.length ? visibleTransactions.map((item) => <TransactionRow key={item.id} item={item} onEdit={() => openEdit(item)} onDelete={() => deleteTransaction(item.id)} />) : <View style={styles.empty}><Ionicons name="file-tray-outline" size={26} color={UI.subtle} /><Text style={styles.emptyTitle}>Aucun mouvement</Text><Text style={styles.emptyCopy}>Commencez par ajouter une dépense ou un revenu.</Text><PrimaryButton label="Ajouter maintenant" icon="add" onPress={() => openNew()} style={{ marginTop: 8 }} /></View>}</View>
      </ScrollView>

      <Sheet visible={formVisible} title={editingId ? "Modifier le mouvement" : "Nouveau mouvement"} onClose={() => setFormVisible(false)}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
          <View style={styles.typeSwitch}><Pressable onPress={() => setDraft((current) => ({ ...current, type: "expense", category: "Restaurants" }))} style={[styles.typeOption, draft.type === "expense" && styles.typeOptionActive]}><Ionicons name="arrow-up" size={16} color={draft.type === "expense" ? UI.coral : UI.muted} /><Text style={[styles.typeOptionText, draft.type === "expense" && { color: UI.text }]}>Dépense</Text></Pressable><Pressable onPress={() => setDraft((current) => ({ ...current, type: "income", category: "Salaire" }))} style={[styles.typeOption, draft.type === "income" && styles.typeOptionActive]}><Ionicons name="arrow-down" size={16} color={draft.type === "income" ? UI.lime : UI.muted} /><Text style={[styles.typeOptionText, draft.type === "income" && { color: UI.text }]}>Revenu</Text></Pressable></View>
          <Text style={styles.fieldLabel}>MONTANT</Text><View style={styles.amountField}><TextInput value={draft.amount} onChangeText={(amount) => setDraft((current) => ({ ...current, amount }))} placeholder="0,00" placeholderTextColor={UI.subtle} keyboardType="decimal-pad" style={styles.amountInput} /><Text style={styles.currency}>€</Text></View>
          <Text style={styles.fieldLabel}>LIBELLÉ</Text><TextInput value={draft.label} onChangeText={(label) => setDraft((current) => ({ ...current, label }))} placeholder="Ex. dîner avec Camille" placeholderTextColor={UI.subtle} style={styles.input} />
          <Text style={styles.fieldLabel}>DATE</Text><TextInput value={draft.date} onChangeText={(date) => setDraft((current) => ({ ...current, date }))} placeholder="AAAA-MM-JJ" placeholderTextColor={UI.subtle} style={styles.input} />
          <Text style={styles.fieldLabel}>CATÉGORIE</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>{(draft.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((category) => <Pressable key={category} onPress={() => setDraft((current) => ({ ...current, category }))} style={[styles.categoryChip, draft.category === category && { backgroundColor: `${CATEGORY_COLORS[category] ?? UI.violet}26`, borderColor: CATEGORY_COLORS[category] ?? UI.violet }]}><CategoryDot color={CATEGORY_COLORS[category] ?? UI.violet} size={7} /><Text style={styles.categoryChipText}>{category}</Text></Pressable>)}</ScrollView>
          <PrimaryButton label={editingId ? "Enregistrer" : "Ajouter le mouvement"} icon="checkmark" onPress={saveTransaction} style={{ marginTop: 22 }} />
        </ScrollView>
      </Sheet>

      <Sheet visible={csvVisible} title="Importer un CSV" onClose={() => setCsvVisible(false)}>
        <Text style={styles.modalCopy}>Format accepté : <Text style={{ color: UI.text, fontWeight: "800" }}>type;montant;date;catégorie;libellé</Text>. Vous pouvez coller le contenu ou choisir un fichier.</Text>
        {Platform.OS === "web" ? <SecondaryButton label="Choisir un fichier CSV" icon="document-attach-outline" onPress={chooseFile} style={{ marginBottom: 12 }} /> : null}
        <TextInput value={csvText} onChangeText={setCsvText} multiline numberOfLines={8} placeholder="revenu;2850;2026-10-01;Salaire;Salaire net" placeholderTextColor={UI.subtle} style={[styles.input, styles.csvInput]} textAlignVertical="top" />
        {csvNotice ? <Text style={styles.csvNotice}>{csvNotice}</Text> : null}
        <PrimaryButton label="Importer les mouvements" icon="cloud-upload-outline" onPress={handleImport} style={{ marginTop: 12 }} />
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
  summaryCard: { flexDirection: "row", alignItems: "center", gap: 20, backgroundColor: UI.surface, borderWidth: 1, borderColor: UI.border, borderRadius: 20, padding: 16, marginBottom: 22 },
  summaryLabel: { color: UI.subtle, fontWeight: "900", fontSize: 9, letterSpacing: 1.2, marginBottom: 5 },
  summaryValue: { color: UI.text, fontSize: 21, fontWeight: "900" },
  summaryDivider: { height: 34, width: 1, backgroundColor: UI.border },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 13 },
  filters: { flexDirection: "row", gap: 6, backgroundColor: UI.surface, borderRadius: 12, padding: 4 },
  filter: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9 },
  filterActive: { backgroundColor: UI.surfaceRaised },
  filterText: { color: UI.subtle, fontSize: 11, fontWeight: "800" },
  filterTextActive: { color: UI.text },
  csvActions: { flexDirection: "row", gap: 16, paddingRight: 3 },
  listCard: { backgroundColor: UI.surface, borderRadius: 20, borderWidth: 1, borderColor: UI.border, paddingHorizontal: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#2A2A2D" },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowLabel: { color: UI.text, fontSize: 13, fontWeight: "800" },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  rowMetaText: { color: UI.muted, fontSize: 10 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  rowAmount: { fontSize: 12, fontWeight: "900" },
  rowActions: { flexDirection: "row", gap: 11 },
  empty: { alignItems: "center", paddingVertical: 35 },
  emptyTitle: { color: UI.text, fontSize: 15, fontWeight: "800", marginTop: 10 },
  emptyCopy: { color: UI.muted, fontSize: 12, textAlign: "center", marginTop: 4, marginBottom: 12 },
  modalBackdrop: { flex: 1, backgroundColor: "#000000AA", justifyContent: "flex-end" },
  sheet: { backgroundColor: UI.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, maxHeight: "92%", borderTopWidth: 1, borderColor: UI.border },
  sheetHandle: { width: 40, height: 4, borderRadius: 3, backgroundColor: UI.border, alignSelf: "center", marginBottom: 16 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  sheetTitle: { color: UI.text, fontSize: 20, fontWeight: "900" },
  typeSwitch: { flexDirection: "row", gap: 8, marginBottom: 20 },
  typeOption: { flex: 1, minHeight: 45, borderRadius: 14, borderWidth: 1, borderColor: UI.border, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  typeOptionActive: { backgroundColor: UI.surfaceRaised, borderColor: UI.violet },
  typeOptionText: { color: UI.muted, fontSize: 13, fontWeight: "800" },
  fieldLabel: { color: UI.subtle, fontSize: 9, letterSpacing: 1.4, fontWeight: "900", marginTop: 13, marginBottom: 7 },
  amountField: { flexDirection: "row", alignItems: "center", backgroundColor: UI.bg, borderWidth: 1, borderColor: UI.border, borderRadius: 15, paddingHorizontal: 14 },
  amountInput: { flex: 1, color: UI.text, fontSize: 26, fontWeight: "900", paddingVertical: 11 },
  currency: { color: UI.violet, fontSize: 21, fontWeight: "900" },
  input: { color: UI.text, backgroundColor: UI.bg, borderWidth: 1, borderColor: UI.border, borderRadius: 15, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: UI.border, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 8 },
  categoryChipText: { color: UI.text, fontSize: 11, fontWeight: "700" },
  modalCopy: { color: UI.muted, fontSize: 13, lineHeight: 19, marginBottom: 14 },
  csvInput: { minHeight: 150, lineHeight: 19 },
  csvNotice: { color: UI.lime, fontSize: 12, fontWeight: "700", marginTop: 10 },
});
