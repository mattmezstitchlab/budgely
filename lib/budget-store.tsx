import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  category: string;
  label: string;
};

export type Budget = {
  category: string;
  amount: number;
};

export type BudgetData = {
  transactions: Transaction[];
  budgets: Budget[];
};

type BudgetContextValue = BudgetData & {
  hydrated: boolean;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, transaction: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (category: string, amount: number) => void;
  importCsv: (csv: string) => Promise<number>;
  exportCsv: () => string;
};

const STORAGE_KEY = "@budgely/budget-data-v1";

export const EXPENSE_CATEGORIES = [
  "Logement",
  "Restaurants",
  "Transport",
  "Courses",
  "Loisirs",
  "Abonnements",
  "Santé",
  "Autre",
];

export const INCOME_CATEGORIES = ["Salaire", "Freelance", "Remboursement", "Autre"];
export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const CATEGORY_COLORS: Record<string, string> = {
  Logement: "#9B8CFF",
  Restaurants: "#FF9BBA",
  Transport: "#67E8F9",
  Courses: "#FDE68A",
  Loisirs: "#B7F397",
  Abonnements: "#D0B2FF",
  Santé: "#FFB86B",
  Salaire: "#B7F397",
  Freelance: "#67E8F9",
  Remboursement: "#FDE68A",
  Autre: "#A7A7B3",
};

function monthDate(offset: number, day: number) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  date.setDate(day);
  return date.toISOString().slice(0, 10);
}

const initialData: BudgetData = {
  transactions: [
    { id: "demo-salary", type: "income", amount: 2850, date: monthDate(0, 1), category: "Salaire", label: "Salaire net" },
    { id: "demo-freelance", type: "income", amount: 420, date: monthDate(0, 8), category: "Freelance", label: "Mission design" },
    { id: "demo-rent", type: "expense", amount: 860, date: monthDate(0, 2), category: "Logement", label: "Loyer" },
    { id: "demo-market", type: "expense", amount: 284.6, date: monthDate(0, 5), category: "Courses", label: "Courses de la semaine" },
    { id: "demo-resto-1", type: "expense", amount: 96, date: monthDate(0, 7), category: "Restaurants", label: "Dîner à deux" },
    { id: "demo-transport", type: "expense", amount: 72, date: monthDate(0, 9), category: "Transport", label: "Pass Navigo" },
    { id: "demo-sub", type: "expense", amount: 39.9, date: monthDate(0, 11), category: "Abonnements", label: "Services en ligne" },
    { id: "demo-resto-2", type: "expense", amount: 88, date: monthDate(-1, 18), category: "Restaurants", label: "Déjeuner équipe" },
    { id: "demo-last-income", type: "income", amount: 2850, date: monthDate(-1, 1), category: "Salaire", label: "Salaire net" },
    { id: "demo-last-rent", type: "expense", amount: 860, date: monthDate(-1, 2), category: "Logement", label: "Loyer" },
    { id: "demo-last-market", type: "expense", amount: 230, date: monthDate(-1, 9), category: "Courses", label: "Courses" },
    { id: "demo-last-fun", type: "expense", amount: 130, date: monthDate(-1, 16), category: "Loisirs", label: "Concert" },
    { id: "demo-two-income", type: "income", amount: 2850, date: monthDate(-2, 1), category: "Salaire", label: "Salaire net" },
    { id: "demo-two-rent", type: "expense", amount: 860, date: monthDate(-2, 2), category: "Logement", label: "Loyer" },
    { id: "demo-two-resto", type: "expense", amount: 220, date: monthDate(-2, 14), category: "Restaurants", label: "Sorties" },
  ],
  budgets: [
    { category: "Logement", amount: 900 },
    { category: "Restaurants", amount: 180 },
    { category: "Transport", amount: 120 },
    { category: "Courses", amount: 340 },
    { category: "Loisirs", amount: 160 },
    { category: "Abonnements", amount: 65 },
    { category: "Santé", amount: 100 },
  ],
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeCsv(value: string | number) {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const next = csv[index + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ";" && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function parseAmount(value: string) {
  const normalized = value
    .replace(/\s/g, "")
    .replace(/€/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  return Number(normalized);
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BudgetData>(initialData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;
        try {
          const parsed = JSON.parse(value) as BudgetData;
          if (Array.isArray(parsed.transactions) && Array.isArray(parsed.budgets)) setData(parsed);
        } catch {
          // Un fichier local corrompu ne doit pas empêcher l’ouverture de l’application.
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  const addTransaction = useCallback((transaction: Omit<Transaction, "id">) => {
    setData((current) => ({ ...current, transactions: [{ ...transaction, id: makeId() }, ...current.transactions] }));
  }, []);

  const updateTransaction = useCallback((id: string, transaction: Omit<Transaction, "id">) => {
    setData((current) => ({
      ...current,
      transactions: current.transactions.map((item) => (item.id === id ? { ...transaction, id } : item)),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData((current) => ({ ...current, transactions: current.transactions.filter((item) => item.id !== id) }));
  }, []);

  const setBudget = useCallback((category: string, amount: number) => {
    setData((current) => {
      const exists = current.budgets.some((item) => item.category === category);
      return {
        ...current,
        budgets: exists
          ? current.budgets.map((item) => (item.category === category ? { ...item, amount } : item))
          : [...current.budgets, { category, amount }],
      };
    });
  }, []);

  const importCsv = useCallback(async (csv: string) => {
    const rows = parseCsvRows(csv);
    if (rows.length === 0) return 0;
    const firstCell = rows[0][0]?.toLowerCase() ?? "";
    const startAt = firstCell.includes("type") ? 1 : 0;
    const imported = rows.slice(startAt).flatMap((row) => {
      if (row.length < 5) return [];
      const type = row[0].toLowerCase().includes("reven") || row[0].toLowerCase().includes("income") ? "income" : "expense";
      const amount = parseAmount(row[1]);
      if (!Number.isFinite(amount) || amount <= 0 || !row[2]) return [];
      return [{ id: makeId(), type: type as TransactionType, amount, date: row[2], category: row[3] || "Autre", label: row[4] || "Import CSV" }];
    });
    if (imported.length > 0) setData((current) => ({ ...current, transactions: [...imported, ...current.transactions] }));
    return imported.length;
  }, []);

  const exportCsv = useCallback(() => {
    const header = "type;montant;date;catégorie;libellé";
    const lines = data.transactions.map((item) =>
      [item.type === "income" ? "revenu" : "dépense", item.amount.toFixed(2).replace(".", ","), item.date, item.category, item.label]
        .map(escapeCsv)
        .join(";"),
    );
    return [header, ...lines].join("\n");
  }, [data.transactions]);

  const value = useMemo(
    () => ({ ...data, hydrated, addTransaction, updateTransaction, deleteTransaction, setBudget, importCsv, exportCsv }),
    [data, hydrated, addTransaction, updateTransaction, deleteTransaction, setBudget, importCsv, exportCsv],
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const value = useContext(BudgetContext);
  if (!value) throw new Error("useBudget doit être utilisé dans BudgetProvider");
  return value;
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}

export function formatMoney(value: number, withDecimals = false) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: withDecimals ? 2 : 0,
    minimumFractionDigits: withDecimals ? 2 : 0,
  }).format(value);
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(`${date}T12:00:00`));
}

export function formatMonth(date = new Date()) {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
}
