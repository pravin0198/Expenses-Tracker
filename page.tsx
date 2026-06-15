"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Coins,
  Download,
  Gem,
  Moon,
  Plus,
  ReceiptText,
  Search,
  Sun,
  Target,
  Trash2,
  WalletCards
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { cn, formatInr } from "@/lib/utils";

type AccountName = "HDFC Bank" | "IDFC Bank" | "Union Bank" | "Canara Bank" | "Post Bank" | "Cash";
type IncomeSource = "Phoenix Business" | "College Workshops" | "Freelancing" | "Medical Payment";
type ExpenseCategory =
  | "Groceries"
  | "Shopping"
  | "Traveling"
  | "Petrol"
  | "Outside Food"
  | "School"
  | "Gifts & Relatives"
  | "Fixed Expenses"
  | "Miscellaneous";
type SavingsBucket = "Bank Savings" | "Gold" | "Mutual Funds" | "Stock" | "Insurance";
type EntryType = "income" | "expense" | "saving";

type Entry = {
  id: string;
  type: EntryType;
  account: AccountName;
  amount: number;
  category: IncomeSource | ExpenseCategory | SavingsBucket;
  note: string;
  date: string;
};

type EMIPayment = {
  id: string;
  name: string;
  amount: number;
  totalAmount: number;
  totalMonths: number;
  paidAmount: number;
  nextDueDate: string;
  account: AccountName;
};

type Debt = {
  id: string;
  name: string;
  amount: number;
  initialAmount?: number;
  type: "borrowed" | "lent";
  account?: AccountName;
  dueDate: string;
  note: string;
  settled: boolean;
  payments?: {
    id: string;
    amount: number;
    date: string;
    account: AccountName;
  }[];
};

type FixedExpense = {
  id: string;
  name: string;
  amount: number;
  account: AccountName;
  status: "paid" | "unpaid";
  dueDate: string;
  createdAtMonth?: string;
  paidMonths?: string[];
};

type Asset = {
  id: string;
  name: string;
  type: "Gold" | "Mutual Funds" | "Fixed Deposit" | "Real Estate" | "Stock" | "Insurance" | "Cash" | "Other";
  value: number;
  date: string;
  note: string;
};

const accounts: { name: AccountName; openingBalance: number; color: string }[] = [
  { name: "HDFC Bank", openingBalance: 0, color: "#14b8a6" },
  { name: "IDFC Bank", openingBalance: 0, color: "#f59e0b" },
  { name: "Union Bank", openingBalance: 0, color: "#60a5fa" },
  { name: "Canara Bank", openingBalance: 0, color: "#06b6d4" },
  { name: "Post Bank", openingBalance: 0, color: "#f43f5e" },
  { name: "Cash", openingBalance: 0, color: "#10b981" }
];

const incomeSources: IncomeSource[] = ["Phoenix Business", "College Workshops", "Freelancing", "Medical Payment"];
const expenseCategories: ExpenseCategory[] = [
  "Groceries",
  "Shopping",
  "Traveling",
  "Petrol",
  "Outside Food",
  "School",
  "Gifts & Relatives",
  "Fixed Expenses",
  "Miscellaneous"
];
const savingsBuckets: SavingsBucket[] = ["Bank Savings", "Gold", "Mutual Funds", "Stock", "Insurance"];

const starterEntries: Entry[] = [];
const starterEMIs: EMIPayment[] = [];
const starterDebts: Debt[] = [];
const starterFixedExpenses: FixedExpense[] = [];
const starterAssets: Asset[] = [];

const emptyForm = {
  type: "expense" as EntryType,
  account: "HDFC Bank" as AccountName,
  amount: "",
  category: "Groceries" as IncomeSource | ExpenseCategory | SavingsBucket,
  note: "",
  date: "2026-06-15"
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme !== "light";

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-2">
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch checked={isDark} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
      <Moon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function categoryOptions(type: EntryType) {
  if (type === "income") return incomeSources;
  if (type === "saving") return savingsBuckets;
  return expenseCategories;
}

function formatMonthName(monthStr: string) {
  if (!monthStr || monthStr === "All") return "All Months";
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getUnpaidPastMonths(fe: FixedExpense, currentMonth: string): string[] {
  if (!currentMonth || currentMonth === "All") return [];
  
  const startMonthStr = fe.createdAtMonth || "2026-06";
  if (startMonthStr >= currentMonth) return [];

  const unpaid: string[] = [];
  let iterMonth = startMonthStr;
  
  let safetyCounter = 0;
  while (iterMonth < currentMonth && safetyCounter < 24) {
    safetyCounter++;
    const isPaid = fe.paidMonths ? fe.paidMonths.includes(iterMonth) : (iterMonth === "2026-06" && fe.status === "paid");
    if (!isPaid) {
      unpaid.push(iterMonth);
    }
    
    const [year, month] = iterMonth.split("-").map(Number);
    const nextDate = new Date(year, month, 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
    iterMonth = `${nextYear}-${nextMonth}`;
  }
  return unpaid;
}

function getDueDateForMonth(dueDateStr: string, monthStr: string): string {
  if (!monthStr || monthStr === "All") {
    monthStr = new Date().toISOString().slice(0, 7);
  }
  
  let day = 1;
  if (dueDateStr.includes("-")) {
    const parts = dueDateStr.split("-");
    if (parts.length === 3) {
      day = Number(parts[2]);
    }
  } else {
    const match = dueDateStr.match(/\d+/);
    if (match) {
      day = Number(match[0]);
    }
  }
  
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>(starterEntries);
  const [emis, setEmis] = useState<EMIPayment[]>(starterEMIs);
  const [debts, setDebts] = useState<Debt[]>(starterDebts);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(starterFixedExpenses);
  const [assets, setAssets] = useState<Asset[]>(starterAssets);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7);
  });
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // EMI interactive form states
  const [emiName, setEmiName] = useState("");
  const [emiTotalAmount, setEmiTotalAmount] = useState<string>("");
  const [emiTotalMonths, setEmiTotalMonths] = useState<string>("");
  const [emiPaidAmount, setEmiPaidAmount] = useState<string>("0");
  const [emiAccount, setEmiAccount] = useState<AccountName>("HDFC Bank");
  const [emiDueDate, setEmiDueDate] = useState(() => new Date().toISOString().slice(0, 10));

  // P2P Debt settling states
  const [settlingDebtId, setSettlingDebtId] = useState<string | null>(null);
  const [settleDebtAmount, setSettleDebtAmount] = useState<string>("");
  const [settleDebtAccount, setSettleDebtAccount] = useState<AccountName>("HDFC Bank");

  const emiCalculatedDetails = useMemo(() => {
    const totalAmount = Number(emiTotalAmount) || 0;
    const totalMonths = Number(emiTotalMonths) || 0;
    const paidAmount = Number(emiPaidAmount) || 0;

    if (totalAmount <= 0 || totalMonths <= 0) {
      return {
        monthlyEmi: 0,
        paidAmount: 0,
        remainingAmount: 0,
        remainingMonths: 0,
        paidMonths: 0
      };
    }

    const monthlyEmi = Math.round(totalAmount / totalMonths);
    const roundedPaidAmount = Math.min(totalAmount, Math.max(0, paidAmount));
    const remainingAmount = Math.max(0, totalAmount - roundedPaidAmount);
    const remainingMonths = monthlyEmi > 0 ? Math.max(0, Math.round(remainingAmount / monthlyEmi)) : 0;
    const paidMonths = totalMonths - remainingMonths;

    return {
      monthlyEmi,
      paidAmount: roundedPaidAmount,
      remainingAmount,
      remainingMonths,
      paidMonths
    };
  }, [emiTotalAmount, emiTotalMonths, emiPaidAmount]);

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    entries.forEach((entry) => {
      if (entry.date) {
        monthsSet.add(entry.date.slice(0, 7));
      }
    });
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    monthsSet.add(currentMonthStr);
    return Array.from(monthsSet).sort().reverse();
  }, [entries]);

  useEffect(() => {
    // Clear dummy data for first-time transition to real-world usage
    const isWiped = window.localStorage.getItem("bhosale-expenses-wiped-v2");
    if (!isWiped) {
      window.localStorage.removeItem("phoenix-expense-entries");
      window.localStorage.removeItem("phoenix-expense-emis");
      window.localStorage.removeItem("phoenix-expense-debts");
      window.localStorage.removeItem("phoenix-expense-fixed");
      window.localStorage.removeItem("phoenix-expense-assets");
      window.localStorage.setItem("bhosale-expenses-wiped-v2", "true");
      setEntries([]);
      setEmis([]);
      setDebts([]);
      setFixedExpenses([]);
      setAssets([]);
      return;
    }

    const storedEntries = window.localStorage.getItem("phoenix-expense-entries");
    if (storedEntries) setEntries(JSON.parse(storedEntries));

    const storedEmis = window.localStorage.getItem("phoenix-expense-emis");
    if (storedEmis) {
      try {
        const parsed = JSON.parse(storedEmis);
        const upgraded = parsed.map((emi: any) => ({
          ...emi,
          totalAmount: emi.totalAmount !== undefined ? emi.totalAmount : (emi.amount * emi.totalMonths),
          paidAmount: emi.paidAmount !== undefined ? emi.paidAmount : (emi.amount * (emi.paidMonths || 0))
        }));
        setEmis(upgraded);
      } catch (e) {
        console.error("Failed to parse EMIs:", e);
      }
    }

    const storedDebts = window.localStorage.getItem("phoenix-expense-debts");
    if (storedDebts) setDebts(JSON.parse(storedDebts));

    const storedFixed = window.localStorage.getItem("phoenix-expense-fixed");
    if (storedFixed) {
      try {
        const parsed = JSON.parse(storedFixed);
        const upgraded = parsed.map((fe: any) => ({
          ...fe,
          createdAtMonth: fe.createdAtMonth || "2026-06",
          paidMonths: fe.paidMonths || (fe.status === "paid" ? ["2026-06"] : [])
        }));
        setFixedExpenses(upgraded);
      } catch (e) {
        console.error("Failed to parse Fixed Expenses:", e);
      }
    }

    const storedAssets = window.localStorage.getItem("phoenix-expense-assets");
    if (storedAssets) setAssets(JSON.parse(storedAssets));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("phoenix-expense-entries", JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    window.localStorage.setItem("phoenix-expense-emis", JSON.stringify(emis));
  }, [emis]);

  useEffect(() => {
    window.localStorage.setItem("phoenix-expense-debts", JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    window.localStorage.setItem("phoenix-expense-fixed", JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);

  useEffect(() => {
    window.localStorage.setItem("phoenix-expense-assets", JSON.stringify(assets));
  }, [assets]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const handlePayFixedExpense = (feId: string, monthStr: string) => {
    const fe = fixedExpenses.find(item => item.id === feId);
    if (!fe) return;

    setFixedExpenses(prev =>
      prev.map(item =>
        item.id === feId
          ? {
              ...item,
              status: monthStr === (selectedMonth === "All" ? new Date().toISOString().slice(0, 7) : selectedMonth) ? "paid" : item.status,
              paidMonths: [...(item.paidMonths || []), monthStr]
            }
          : item
      )
    );

    const newEntry: Entry = {
      id: crypto.randomUUID(),
      type: "expense",
      account: fe.account,
      amount: fe.amount,
      category: "Fixed Expenses",
      note: `Paid ${fe.name} (${formatMonthName(monthStr)})`,
      date: new Date().toISOString().slice(0, 10)
    };
    
    setEntries(prev => [newEntry, ...prev]);
    showToast(`Paid ${fe.name} for ${formatMonthName(monthStr)} from ${fe.account}`);
  };

  const totals = useMemo(() => {
    const allIncome = entries.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + entry.amount, 0);
    const allExpense = entries.filter((entry) => entry.type === "expense").reduce((sum, entry) => sum + entry.amount, 0);
    const allSaving = entries.filter((entry) => entry.type === "saving").reduce((sum, entry) => sum + entry.amount, 0);
    const openingBalance = accounts.reduce((sum, account) => sum + account.openingBalance, 0);
    const currentBalance = openingBalance + allIncome - allExpense - allSaving;

    const monthlyEntries = selectedMonth === "All"
      ? entries
      : entries.filter((entry) => entry.date.startsWith(selectedMonth));

    const income = monthlyEntries.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + entry.amount, 0);
    const expense = monthlyEntries.filter((entry) => entry.type === "expense").reduce((sum, entry) => sum + entry.amount, 0);
    const saving = monthlyEntries.filter((entry) => entry.type === "saving").reduce((sum, entry) => sum + entry.amount, 0);

    return { income, expense, saving, currentBalance };
  }, [entries, selectedMonth]);

  const accountBalances = useMemo(
    () =>
      accounts.map((account) => {
        const balance = entries.reduce((sum, entry) => {
          if (entry.account !== account.name) return sum;
          if (entry.type === "income") return sum + entry.amount;
          return sum - entry.amount;
        }, account.openingBalance);
        return { ...account, balance };
      }),
    [entries]
  );

  const categorySpend = useMemo(
    () => {
      const monthlyEntries = selectedMonth === "All"
        ? entries
        : entries.filter((entry) => entry.date.startsWith(selectedMonth));

      return expenseCategories.map((category) => ({
        category,
        amount: monthlyEntries
          .filter((entry) => entry.type === "expense" && entry.category === category)
          .reduce((sum, entry) => sum + entry.amount, 0)
      }));
    },
    [entries, selectedMonth]
  );

  const incomeChart = useMemo(
    () => {
      const monthlyEntries = selectedMonth === "All"
        ? entries
        : entries.filter((entry) => entry.date.startsWith(selectedMonth));

      return incomeSources.map((source) => ({
        source: source.replace("Phoenix ", "").replace("College ", ""),
        amount: monthlyEntries
          .filter((entry) => entry.type === "income" && entry.category === source)
          .reduce((sum, entry) => sum + entry.amount, 0)
      }));
    },
    [entries, selectedMonth]
  );

  const filteredEntries = entries.filter((entry) => {
    const matchesMonth = selectedMonth === "All" || entry.date.startsWith(selectedMonth);
    const matchesSearch = `${entry.type} ${entry.account} ${entry.category} ${entry.note}`.toLowerCase().includes(search.toLowerCase());
    return matchesMonth && matchesSearch;
  });

  const addEntry = () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      showToast("Amount barobar taka.");
      return;
    }

    const entry: Entry = {
      id: crypto.randomUUID(),
      type: form.type,
      account: form.account,
      amount,
      category: form.category,
      note: form.note || "No note",
      date: form.date
    };

    setEntries((current) => [entry, ...current]);

    // Automatically log Asset if saving type is for an asset category
    if (form.type === "saving" && ["Gold", "Mutual Funds", "Stock", "Insurance"].includes(form.category)) {
      const newAsset: Asset = {
        id: crypto.randomUUID(),
        name: form.note && form.note.trim() !== "" ? form.note : `${form.category} Asset`,
        type: form.category as any,
        value: amount,
        date: form.date,
        note: `Linked to ledger transaction via ${form.account}`
      };
      setAssets((current) => [...current, newAsset]);
    }

    setForm({ ...emptyForm, type: form.type, account: form.account, date: form.date });
    showToast("Entry add zali.");
  };

  const deleteEntry = (id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    showToast("Entry delete zali.");
  };

  const resetDemo = () => {
    setEntries(starterEntries);
    setEmis(starterEMIs);
    setDebts(starterDebts);
    setFixedExpenses(starterFixedExpenses);
    setAssets(starterAssets);
    showToast("Application clear zale.");
  };

  const exportReport = () => {
    const rows = [
      ["Type", "Account", "Category", "Amount", "Note", "Date"],
      ...entries.map((entry) => [entry.type, entry.account, entry.category, entry.amount, entry.note, entry.date])
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "phoenix-daily-expenses.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Report download zala.");
  };

  const savingsPercent = totals.income > 0 ? Math.round((totals.saving / totals.income) * 100) : 0;

  return (
    <main className="min-h-screen bg-background premium-grid">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Daily Money Tracker</p>
              <h1 className="text-lg font-semibold tracking-normal md:text-xl">Bhosale Family Expenses</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={exportReport} className="hidden sm:inline-flex">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-border bg-card/20 p-1 rounded-lg gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-md transition-all flex-shrink-0 whitespace-nowrap",
              activeTab === "dashboard"
                ? "bg-background shadow text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("emis_debts")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-md transition-all flex-shrink-0 whitespace-nowrap",
              activeTab === "emis_debts"
                ? "bg-background shadow text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            EMIs & Debts
          </button>
          <button
            onClick={() => setActiveTab("fixed_expenses")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-md transition-all flex-shrink-0 whitespace-nowrap",
              activeTab === "fixed_expenses"
                ? "bg-background shadow text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            Fixed Expenses
          </button>
          <button
            onClick={() => setActiveTab("savings")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-md transition-all flex-shrink-0 whitespace-nowrap",
              activeTab === "savings"
                ? "bg-background shadow text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            Savings & Assets
          </button>
        </div>

        {activeTab === "dashboard" && (
          <>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-card/45 backdrop-blur-md border border-border/50 rounded-xl p-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
            <p className="text-xs text-muted-foreground">
              {selectedMonth === "All" ? "Showing all-time overview" : `Showing overview for ${formatMonthName(selectedMonth)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Select Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer min-w-[140px]"
            >
              <option value="All">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthName(m)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="glass">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="mt-2 text-2xl font-semibold">{formatInr(totals.currentBalance)}</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Income</p>
              <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-emerald-500">
                <ArrowUpRight className="h-5 w-5" />
                {formatInr(totals.income)}
              </p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-orange-500">
                <ArrowDownRight className="h-5 w-5" />
                {formatInr(totals.expense)}
              </p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-5 flex flex-col justify-between h-full min-h-[110px]">
              <div>
                <p className="text-sm text-muted-foreground">Savings</p>
                <p className="mt-1 text-2xl font-semibold">{formatInr(totals.saving)}</p>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                  <span>Savings Rate</span>
                  <span className="font-semibold text-foreground">{savingsPercent}%</span>
                </div>
                <Progress value={Math.min(savingsPercent, 100)} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Add Daily Entry</CardTitle>
              <CardDescription>Income, expense, kiwa savings entry add kara.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(["expense", "income", "saving"] as EntryType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        type,
                        category: categoryOptions(type)[0]
                      }))
                    }
                    className={cn(
                      "rounded-lg border border-border px-3 py-2 text-sm font-medium capitalize transition hover:border-primary",
                      form.type === type && "border-primary bg-primary/10 text-primary"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <label className="grid gap-2 text-sm">
                Bank Account
                <select
                  value={form.account}
                  onChange={(event) => setForm((current) => ({ ...current, account: event.target.value as AccountName }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                >
                  {accounts.map((account) => (
                    <option key={account.name}>{account.name}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                Category
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value as IncomeSource | ExpenseCategory | SavingsBucket
                    }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                >
                  {categoryOptions(form.type).map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 grid-cols-2">
                <label className="grid gap-2 text-sm">
                  Amount
                  <input
                    value={form.amount}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    inputMode="numeric"
                    placeholder="₹ 500"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm">
                Note
                <input
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  placeholder="Example: Dinner, petrol, market, client payment"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                />
              </label>

              <div className="flex gap-2">
                <Button onClick={addEntry} className="flex-1">
                  <Plus className="h-4 w-4" />
                  Add Entry
                </Button>
                <Button variant="outline" onClick={resetDemo}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Accounts & Cash</CardTitle>
                <CardDescription>HDFC, IDFC, Union, Canara, Post, and Cash balances live update hotat.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {accountBalances.map((account) => (
                  <div key={account.name} className="rounded-lg border border-border bg-background/60 p-4">
                    <div className="flex items-center justify-between">
                      <Banknote className="h-5 w-5" style={{ color: account.color }} />
                      <span className="text-xs text-muted-foreground">Current</span>
                    </div>
                    <p className="mt-4 font-medium">{account.name}</p>
                    <p className="mt-1 text-xl font-semibold">{formatInr(account.balance)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Smart Suggestions</CardTitle>
                <CardDescription>Tujhya daily tracking sathi useful checks.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-background/60 p-4">
                  <Target className="h-5 w-5 text-emerald-500" />
                  <p className="mt-3 font-medium">Savings Goal</p>
                  <p className="mt-1 text-sm text-muted-foreground">Income cha at least 20% savings madhe thev.</p>
                </div>
                <div className="rounded-lg border border-border bg-background/60 p-4">
                  <ReceiptText className="h-5 w-5 text-orange-500" />
                  <p className="mt-3 font-medium">Expense Limit</p>
                  <p className="mt-1 text-sm text-muted-foreground">Outside food ani shopping weekly review kar.</p>
                </div>
                <div className="rounded-lg border border-border bg-background/60 p-4">
                  <BriefcaseBusiness className="h-5 w-5 text-sky-500" />
                  <p className="mt-3 font-medium">Income Split</p>
                  <p className="mt-1 text-sm text-muted-foreground">Phoenix, workshops, freelancing separate track hotil.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Category wise kharcha.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categorySpend} margin={{ bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="category" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 9 }} 
                    angle={-25} 
                    textAnchor="end" 
                    interval={0}
                  />
                  <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} tick={{ fontSize: 9 }} width={40} />
                  <Tooltip formatter={(value: number) => formatInr(value)} />
                  <Bar dataKey="amount" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Income Sources</CardTitle>
              <CardDescription>Phoenix, workshops, freelancing split.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={incomeChart} dataKey="amount" nameKey="source" innerRadius={48} outerRadius={78} paddingAngle={4}>
                    {["#14b8a6", "#f59e0b", "#60a5fa"].map((color) => (
                      <Cell key={color} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatInr(value)} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        <Card className="glass">
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>All Entries</CardTitle>
              <CardDescription>Search, review, delete entries.</CardDescription>
            </div>
            <label className="flex w-full max-w-sm items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search category, bank, note"
                className="w-full bg-transparent outline-none"
              />
            </label>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="grid gap-3 rounded-lg border border-border bg-background/60 p-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "rounded-md p-2",
                        entry.type === "income" && "bg-emerald-500/10 text-emerald-500",
                        entry.type === "expense" && "bg-orange-500/10 text-orange-500",
                        entry.type === "saving" && "bg-sky-500/10 text-sky-500"
                      )}
                    >
                      {entry.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : entry.type === "saving" ? <Target className="h-4 w-4" /> : <CircleDollarSign className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{entry.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.account} • {entry.note} • {entry.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    <p className={cn("font-semibold", entry.type === "income" ? "text-emerald-500" : "text-foreground")}>
                      {entry.type === "income" ? "+" : "-"}{formatInr(entry.amount)}
                    </p>
                    <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)} aria-label={`Delete ${entry.category}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </>
        )}

        {/* ======================================================== */}
        {/* FIXED EXPENSES TAB */}
        {/* ======================================================== */}
        {activeTab === "fixed_expenses" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/45 backdrop-blur-md border border-border/50 rounded-xl p-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Fixed Expenses</h2>
                <p className="text-xs text-muted-foreground">Manage your recurring fixed monthly expenses and track payments.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const resetMonth = selectedMonth === "All" ? new Date().toISOString().slice(0, 7) : selectedMonth;
                  setFixedExpenses(prev =>
                    prev.map(fe => ({
                      ...fe,
                      status: "unpaid",
                      paidMonths: fe.paidMonths ? fe.paidMonths.filter(m => m !== resetMonth) : []
                    }))
                  );
                  showToast(`All fixed expenses reset to unpaid for ${formatMonthName(resetMonth)}.`);
                }}
              >
                Reset for New Month
              </Button>
            </div>

            <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
              {/* Form Card */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Add Fixed Expense</CardTitle>
                  <CardDescription>Setup a new recurring monthly fixed expense.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="grid gap-2 text-sm">
                    Expense Name
                    <input
                      id="fe-name"
                      placeholder="e.g. House Rent, WiFi Bill"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    Amount (₹)
                    <input
                      id="fe-amount"
                      type="number"
                      placeholder="₹ 5000"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    Pay From Account
                    <select
                      id="fe-account"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.name} value={acc.name}>{acc.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm">
                    Due Date (Day of Month)
                    <input
                      id="fe-duedate"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="e.g. 5"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                    />
                  </label>


                  <Button
                    onClick={() => {
                      const nameEl = document.getElementById("fe-name") as HTMLInputElement;
                      const amountEl = document.getElementById("fe-amount") as HTMLInputElement;
                      const accountEl = document.getElementById("fe-account") as HTMLSelectElement;
                      const dueDateEl = document.getElementById("fe-duedate") as HTMLInputElement;

                      const name = nameEl?.value;
                      const amount = Number(amountEl?.value);
                      const account = accountEl?.value as AccountName;
                      const dueDate = dueDateEl?.value ? `Every ${dueDateEl.value}` : "Monthly";

                      if (!name || !amount || amount <= 0) {
                        showToast("Please enter valid name and amount.");
                        return;
                      }

                      const newFE: FixedExpense = {
                        id: crypto.randomUUID(),
                        name,
                        amount,
                        account,
                        status: "unpaid",
                        dueDate,
                        createdAtMonth: selectedMonth === "All" ? new Date().toISOString().slice(0, 7) : selectedMonth,
                        paidMonths: []
                      };

                      setFixedExpenses(prev => [...prev, newFE]);
                      if (nameEl) nameEl.value = "";
                      if (amountEl) amountEl.value = "";
                      if (dueDateEl) dueDateEl.value = "";
                      showToast("Fixed expense added.");
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Fixed Expense
                  </Button>
                </CardContent>
              </Card>

              {/* List Card */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Monthly Fixed Expenses Checklist</CardTitle>
                  <CardDescription>Track what's paid and unpaid. Resets automatically on the 1st of every month.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fixedExpenses.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">No fixed expenses added yet.</p>
                    ) : (
                      fixedExpenses.map((fe) => {
                        const currentRealMonth = new Date().toISOString().slice(0, 7);
                        const targetMonth = selectedMonth === "All" ? currentRealMonth : selectedMonth;
                        const isPaidInCurrentMonth = fe.paidMonths ? fe.paidMonths.includes(targetMonth) : fe.status === "paid";
                        const unpaidPastMonths = getUnpaidPastMonths(fe, targetMonth);

                        return (
                          <div key={fe.id} className="flex flex-col p-4 border border-border rounded-lg bg-background/40 gap-3">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
                              <div>
                                <h3 className="font-semibold text-sm sm:text-base">{fe.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                  Account: <span className="font-medium text-foreground">{fe.account}</span> • Due: {getDueDateForMonth(fe.dueDate, targetMonth)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                <span className="font-bold text-sm sm:text-base">{formatInr(fe.amount)}</span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-xs font-semibold uppercase",
                                  isPaidInCurrentMonth ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                                )}>
                                  {isPaidInCurrentMonth ? "paid" : "unpaid"}
                                </span>
                                <div className="flex gap-2">
                                  {!isPaidInCurrentMonth && (
                                    <Button
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white py-1 px-3 h-8 text-xs font-medium"
                                      onClick={() => handlePayFixedExpense(fe.id, targetMonth)}
                                    >
                                      Pay Now
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => {
                                      setFixedExpenses(prev => prev.filter(item => item.id !== fe.id));
                                      showToast("Fixed expense deleted.");
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Unpaid Past Dues Alert Row */}
                            {unpaidPastMonths.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-border/40 space-y-2">
                                <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider block">
                                  Missed Payments (Dues from past months):
                                </span>
                                <div className="grid gap-2">
                                  {unpaidPastMonths.map((m) => (
                                    <div
                                      key={m}
                                      className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs w-full"
                                    >
                                      <span className="text-rose-500 font-medium flex items-center gap-1.5 animate-pulse">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                        Due from last month ({formatMonthName(m)})
                                      </span>
                                      <Button
                                        size="sm"
                                        className="h-7 text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 font-medium"
                                        onClick={() => handlePayFixedExpense(fe.id, m)}
                                      >
                                        Pay {formatMonthName(m).split(" ")[0]}
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SAVINGS & ASSETS TAB */}
        {/* ======================================================== */}
        {activeTab === "savings" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/45 backdrop-blur-md border border-border/50 rounded-xl p-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Savings & Assets</h2>
                <p className="text-xs text-muted-foreground">Manage your liquid cash balances and track your valuables like Gold and FDs.</p>
              </div>
            </div>

            {/* Net Worth Summary Stats Grid */}
            {(() => {
              const totalCash = accountBalances.reduce((sum, acc) => sum + acc.balance, 0);
              const totalAssets = assets.reduce((sum, ast) => sum + ast.value, 0);
              const netWorth = totalCash + totalAssets;

              return (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <Card className="glass relative overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs font-medium uppercase tracking-wider">Total Liquid Cash</CardDescription>
                      <CardTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
                        <Banknote className="h-6 w-6 shrink-0" />
                        {formatInr(totalCash)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[11px] text-muted-foreground">Cash in bank accounts and cash in hand.</p>
                    </CardContent>
                  </Card>

                  <Card className="glass relative overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs font-medium uppercase tracking-wider">Total Assets Value</CardDescription>
                      <CardTitle className="text-2xl font-bold flex items-center gap-2 text-amber-600 dark:text-amber-500">
                        <Coins className="h-6 w-6 shrink-0 animate-pulse" />
                        {formatInr(totalAssets)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[11px] text-muted-foreground">Gold, mutual funds, FDs, and other valuables.</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-accent bg-accent/10 relative overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs font-medium uppercase tracking-wider text-accent-foreground/80">Net Worth</CardDescription>
                      <CardTitle className="text-3xl font-extrabold flex items-center gap-2 text-accent">
                        <Gem className="h-7 w-7 shrink-0" />
                        {formatInr(netWorth)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[11px] text-accent-foreground/70">Liquid Cash + Logged Assets valuation.</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
              {/* Add Asset Form Card */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Add Asset / Valuable</CardTitle>
                  <CardDescription>Setup a new valuable or investment record.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="grid gap-2 text-sm">
                    Asset / Investment Name
                    <input
                      id="asset-name"
                      type="text"
                      placeholder="e.g. Gold Coins, SIP Fund"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    Asset Type
                    <select
                      id="asset-type"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                    >
                      <option value="Gold">Gold</option>
                      <option value="Mutual Funds">Mutual Funds</option>
                      <option value="Fixed Deposit">Fixed Deposit</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Stock">Stock</option>
                      <option value="Insurance">Insurance</option>
                      <option value="Cash">Cash</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm">
                    Current Valuation (₹)
                    <input
                      id="asset-value"
                      type="number"
                      placeholder="e.g. 75000"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    Acquisition / Valuation Date
                    <input
                      id="asset-date"
                      type="date"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    Pay From Account (Payment Mode)
                    <select
                      id="asset-account"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                    >
                      <option value="None">None (Don't deduct from cash)</option>
                      {accounts.map((acc) => (
                        <option key={acc.name} value={acc.name}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm">
                    Note / Description
                    <input
                      id="asset-note"
                      type="text"
                      placeholder="e.g. Purchased from Tanishq"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                    />
                  </label>

                  <Button
                    onClick={() => {
                      const nameEl = document.getElementById("asset-name") as HTMLInputElement;
                      const typeEl = document.getElementById("asset-type") as HTMLSelectElement;
                      const valueEl = document.getElementById("asset-value") as HTMLInputElement;
                      const dateEl = document.getElementById("asset-date") as HTMLInputElement;
                      const accountEl = document.getElementById("asset-account") as HTMLSelectElement;
                      const noteEl = document.getElementById("asset-note") as HTMLInputElement;

                      const name = nameEl?.value;
                      const type = typeEl?.value as any;
                      const value = Number(valueEl?.value);
                      const date = dateEl?.value || new Date().toISOString().slice(0, 10);
                      const accountVal = accountEl?.value || "None";
                      const note = noteEl?.value || "";

                      if (!name || !value || value <= 0) {
                        showToast("Please enter valid name and value.");
                        return;
                      }

                      const newAsset: Asset = {
                        id: crypto.randomUUID(),
                        name,
                        type,
                        value,
                        date,
                        note
                      };

                      setAssets(prev => [...prev, newAsset]);

                      if (accountVal !== "None") {
                        let transactionCategory: SavingsBucket = "Bank Savings";
                        if (type === "Gold") transactionCategory = "Gold";
                        else if (type === "Mutual Funds") transactionCategory = "Mutual Funds";
                        else if (type === "Stock") transactionCategory = "Stock";
                        else if (type === "Insurance") transactionCategory = "Insurance";

                        const newEntry: Entry = {
                          id: crypto.randomUUID(),
                          type: "saving",
                          account: accountVal as AccountName,
                          amount: value,
                          category: transactionCategory,
                          note: `Asset Purchase: ${name} (${note})`,
                          date: date
                        };
                        setEntries(prev => [newEntry, ...prev]);
                      }

                      if (nameEl) nameEl.value = "";
                      if (valueEl) valueEl.value = "";
                      if (noteEl) noteEl.value = "";
                      if (accountEl) accountEl.value = "None";
                      showToast(`${name} added to assets.`);
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Asset Record
                  </Button>
                </CardContent>
              </Card>

              {/* Breakdown Grid */}
              <div className="space-y-6">
                {/* Bank wise breakdown */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Cash & Bank Balances</CardTitle>
                    <CardDescription>Real-time cash holding across accounts.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {accountBalances.map((acc) => {
                        const totalCash = accountBalances.reduce((sum, a) => sum + a.balance, 0);
                        const percentage = totalCash > 0 ? Math.max(0, Math.min(100, (acc.balance / totalCash) * 100)) : 0;
                        return (
                          <div key={acc.name} className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-semibold flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: acc.color }} />
                                {acc.name}
                              </span>
                              <span className="font-bold">{formatInr(acc.balance)}</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Logged Assets list */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Valuables & Assets Ledger</CardTitle>
                    <CardDescription>Track other assets (Gold, Mutual Funds, FDs, etc.).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {assets.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">No assets registered yet.</p>
                      ) : (
                        assets.map((ast) => (
                          <div key={ast.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border rounded-lg bg-background/40 gap-3">
                            <div>
                              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                                {ast.name}
                                <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded font-medium uppercase",
                                  ast.type === "Gold" ? "bg-amber-500/10 text-amber-500" :
                                  ast.type === "Mutual Funds" ? "bg-emerald-500/10 text-emerald-500" :
                                  ast.type === "Fixed Deposit" ? "bg-blue-500/10 text-blue-500" :
                                  ast.type === "Real Estate" ? "bg-indigo-500/10 text-indigo-500" :
                                  ast.type === "Stock" ? "bg-cyan-500/10 text-cyan-500" :
                                  ast.type === "Insurance" ? "bg-rose-500/10 text-rose-500" :
                                  ast.type === "Cash" ? "bg-green-500/10 text-green-500" :
                                  "bg-muted text-muted-foreground"
                                )}>
                                  {ast.type}
                                </span>
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Date: <span className="font-medium text-foreground">{ast.date}</span> {ast.note && `• Note: ${ast.note}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                              <span className="font-bold text-sm sm:text-base">{formatInr(ast.value)}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  setAssets(prev => prev.filter(item => item.id !== ast.id));
                                  showToast(`${ast.name} removed from assets.`);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* EMIS & DEBTS TAB */}
        {/* ======================================================== */}
        {activeTab === "emis_debts" && (
          <div className="space-y-6">
            <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
              {/* Add EMI Form */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Add New EMI</CardTitle>
                  <CardDescription>Track recurring loans or monthly installments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="grid gap-2 text-sm">
                    EMI Name
                    <input
                      value={emiName}
                      onChange={(e) => setEmiName(e.target.value)}
                      placeholder="e.g. Car Loan, iPhone EMI"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                    />
                  </label>

                  <div className="grid gap-3 grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      Total Loan Amount (₹)
                      <input
                        type="number"
                        value={emiTotalAmount}
                        onChange={(e) => setEmiTotalAmount(e.target.value)}
                        placeholder="e.g. 150000"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                      />
                    </label>
                    <label className="grid gap-2 text-sm">
                      Total Months
                      <input
                        type="number"
                        value={emiTotalMonths}
                        onChange={(e) => setEmiTotalMonths(e.target.value)}
                        placeholder="e.g. 12"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      Already Paid Amount (₹)
                      <input
                        type="number"
                        value={emiPaidAmount}
                        onChange={(e) => setEmiPaidAmount(e.target.value)}
                        placeholder="e.g. 6000"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                      />
                    </label>
                    <label className="grid gap-2 text-sm">
                      Account Link
                      <select
                        value={emiAccount}
                        onChange={(e) => setEmiAccount(e.target.value as AccountName)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                      >
                        {accounts.map((acc) => (
                          <option key={acc.name} value={acc.name}>{acc.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="grid gap-2 text-sm">
                    Next Due Date
                    <input
                      type="date"
                      value={emiDueDate}
                      onChange={(e) => setEmiDueDate(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                    />
                  </label>

                  {emiCalculatedDetails.monthlyEmi > 0 && (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-2 text-sm">
                      <div className="flex justify-between items-center font-semibold">
                        <span className="text-muted-foreground">Monthly EMI Amount:</span>
                        <span className="text-primary text-base font-bold">{formatInr(emiCalculatedDetails.monthlyEmi)}/mo</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground border-t border-border/20 pt-1">
                        <span>Total Loan Amount:</span>
                        <span className="font-medium text-foreground">{formatInr(Number(emiTotalAmount) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Paid So Far:</span>
                        <span className="font-medium text-emerald-500">
                          {formatInr(emiCalculatedDetails.paidAmount)} ({emiCalculatedDetails.paidMonths} months paid)
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Remaining Due Amount:</span>
                        <span className="font-medium text-orange-500">
                          {formatInr(emiCalculatedDetails.remainingAmount)} ({emiCalculatedDetails.remainingMonths} months left)
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      if (!emiName) {
                        showToast("Please enter a valid EMI name.");
                        return;
                      }
                      const principal = Number(emiTotalAmount);
                      const months = Number(emiTotalMonths);
                      if (!principal || principal <= 0 || !months || months <= 0) {
                        showToast("Please enter valid loan amount and months.");
                        return;
                      }

                      const newEMI: EMIPayment = {
                        id: crypto.randomUUID(),
                        name: emiName,
                        amount: emiCalculatedDetails.monthlyEmi,
                        totalAmount: principal,
                        totalMonths: months,
                        paidAmount: emiCalculatedDetails.paidAmount,
                        nextDueDate: emiDueDate || new Date().toISOString().slice(0, 10),
                        account: emiAccount
                      };

                      setEmis(prev => [...prev, newEMI]);
                      
                      // Reset form states
                      setEmiName("");
                      setEmiTotalAmount("");
                      setEmiTotalMonths("");
                      setEmiPaidAmount("0");
                      setEmiDueDate(new Date().toISOString().slice(0, 10));
                      
                      showToast("EMI tracker created.");
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add EMI Tracker
                  </Button>
                </CardContent>
              </Card>

              {/* EMI Progress List */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Active EMIs</CardTitle>
                  <CardDescription>Track remaining payments and auto-log payments.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {emis.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">No active EMIs.</p>
                    ) : (
                      emis.map((emi) => {
                        const monthlyEmi = emi.amount;
                        const totalAmount = emi.totalAmount;
                        const paidAmount = emi.paidAmount;
                        const remainingAmount = Math.max(0, totalAmount - paidAmount);
                        const remainingMonths = monthlyEmi > 0 ? Math.max(0, Math.round(remainingAmount / monthlyEmi)) : 0;
                        const paidMonths = emi.totalMonths - remainingMonths;
                        const percent = Math.round((paidAmount / totalAmount) * 100);

                        return (
                          <div key={emi.id} className="p-4 border border-border rounded-lg bg-background/40 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-sm sm:text-base">{emi.name}</h3>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Account: <span className="font-medium text-foreground">{emi.account}</span> • Next Due: {emi.nextDueDate}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-sm sm:text-base">{formatInr(monthlyEmi)}/mo</span>
                                <p className="text-xs text-muted-foreground">{paidMonths} / {emi.totalMonths} paid</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 py-1.5 px-2 border-y border-border/20 text-[11px] bg-background/20 rounded-sm">
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Total Loan</span>
                                <span className="font-semibold">{formatInr(totalAmount)}</span>
                              </div>
                              <div className="text-center">
                                <span className="text-muted-foreground block text-[10px]">Paid So Far</span>
                                <span className="font-semibold text-emerald-500">{formatInr(paidAmount)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground block text-[10px]">Remaining</span>
                                <span className="font-semibold text-orange-500">{formatInr(remainingAmount)}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1.5 py-1">
                              <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground">
                                <span>Payment Progress</span>
                                <span className="text-foreground font-semibold">{percent}%</span>
                              </div>
                              <Progress value={percent} className="h-2 w-full" />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border/10">
                              <span className="text-xs text-muted-foreground font-medium">
                                {remainingMonths} months left
                              </span>
                              <div className="flex gap-2">
                                {paidAmount < totalAmount && (
                                  <Button
                                    size="sm"
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs font-semibold px-3 py-1.5"
                                    onClick={() => {
                                      setEmis(prev =>
                                        prev.map(item =>
                                          item.id === emi.id
                                            ? { ...item, paidAmount: Math.min(item.totalAmount, item.paidAmount + item.amount) }
                                            : item
                                        )
                                      );
                                      const nextInstallmentNum = paidMonths + 1;
                                      const newEntry: Entry = {
                                        id: crypto.randomUUID(),
                                        type: "expense",
                                        account: emi.account,
                                        amount: emi.amount,
                                        category: "Fixed Expenses",
                                        note: `EMI: ${emi.name} (${nextInstallmentNum}/${emi.totalMonths})`,
                                        date: new Date().toISOString().slice(0, 10)
                                      };
                                      setEntries(prev => [newEntry, ...prev]);
                                      showToast(`EMI payment registered from ${emi.account}`);
                                    }}
                                  >
                                    Pay Installment
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setEmis(prev => prev.filter(item => item.id !== emi.id));
                                    showToast("EMI deleted.");
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Debts Section */}
            <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
              {/* Add Debt Form */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Add Debt / Loan</CardTitle>
                  <CardDescription>Track money borrowed from or lent to others.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="grid gap-2 text-sm">
                    Person Name
                    <input
                      id="debt-person"
                      placeholder="e.g. Rohan, Amit"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                    />
                  </label>

                  <div className="grid gap-3 grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      Amount (₹)
                      <input
                        id="debt-amount"
                        type="number"
                        placeholder="₹ 5000"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                      />
                    </label>
                    <label className="grid gap-2 text-sm">
                      Type
                      <select
                        id="debt-type"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                      >
                        <option value="borrowed">Borrowed (I owe them)</option>
                        <option value="lent">Lent (They owe me)</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-3 grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      Account Link
                      <select
                        id="debt-account"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                      >
                        {accounts.map((acc) => (
                          <option key={acc.name} value={acc.name}>{acc.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm">
                      Due Date
                      <input
                        id="debt-duedate"
                        type="date"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                      />
                    </label>
                  </div>

                  <label className="grid gap-2 text-sm">
                    Note (Optional)
                    <input
                      id="debt-note"
                      placeholder="Reason / Details"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-primary text-sm"
                    />
                  </label>

                  <Button
                    onClick={() => {
                      const nameEl = document.getElementById("debt-person") as HTMLInputElement;
                      const amountEl = document.getElementById("debt-amount") as HTMLInputElement;
                      const typeEl = document.getElementById("debt-type") as HTMLSelectElement;
                      const accountEl = document.getElementById("debt-account") as HTMLSelectElement;
                      const dueDateEl = document.getElementById("debt-duedate") as HTMLInputElement;
                      const noteEl = document.getElementById("debt-note") as HTMLInputElement;

                      const name = nameEl?.value;
                      const amount = Number(amountEl?.value);
                      const type = typeEl?.value as "borrowed" | "lent";
                      const account = accountEl?.value as AccountName;
                      const dueDate = dueDateEl?.value || new Date().toISOString().slice(0, 10);
                      const note = noteEl?.value || "";

                      if (!name || !amount || amount <= 0) {
                        showToast("Please enter valid name and amount.");
                        return;
                      }

                      const newDebt: Debt = {
                        id: crypto.randomUUID(),
                        name,
                        amount,
                        initialAmount: amount,
                        type,
                        account,
                        dueDate,
                        note,
                        settled: false,
                        payments: []
                      };

                      setDebts(prev => [...prev, newDebt]);
                      if (nameEl) nameEl.value = "";
                      if (amountEl) amountEl.value = "";
                      if (dueDateEl) dueDateEl.value = "";
                      if (noteEl) noteEl.value = "";
                      showToast("Debt logged successfully.");
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Log Debt
                  </Button>
                </CardContent>
              </Card>

              {/* Debt List Card */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Debts & Loans Ledger</CardTitle>
                  <CardDescription>Track active and settled borrowings.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {debts.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">No active debts.</p>
                    ) : (
                      debts.map((d) => (
                        <div key={d.id} className={cn(
                          "flex flex-col p-4 border rounded-lg gap-3 bg-background/40 transition-all",
                          d.settled ? "opacity-65 border-border" : d.type === "borrowed" ? "border-orange-500/35" : "border-emerald-500/35"
                        )}>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                                {d.name}
                                <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded font-medium uppercase",
                                  d.settled ? "bg-muted text-muted-foreground" : d.type === "borrowed" ? "bg-orange-500/10 text-orange-500" : "bg-emerald-500/10 text-emerald-500"
                                )}>
                                  {d.settled ? "Settled" : d.type === "borrowed" ? "I Owe Them" : "They Owe Me"}
                                </span>
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Account: <span className="font-medium text-foreground">{d.account || "N/A"}</span> • Due: {d.dueDate} {d.note && `• Note: ${d.note}`}
                              </p>
                              {d.payments && d.payments.length > 0 && (
                                <div className="mt-2 pl-2 border-l-2 border-primary/35 space-y-1">
                                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                    Settlement Payments:
                                  </span>
                                  <div className="space-y-1">
                                    {d.payments.map((p) => (
                                      <div key={p.id} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                                        <span>
                                          {p.date}: {d.type === "borrowed" ? "Paid" : "Received"} <strong>{formatInr(p.amount)}</strong> via <span className="text-foreground/80 font-medium">{p.account}</span>
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                              <div className="text-right flex flex-col items-end">
                                <span className={cn(
                                  "font-bold text-sm sm:text-base",
                                  d.settled ? "text-muted-foreground" : d.type === "borrowed" ? "text-orange-500" : "text-emerald-500"
                                )}>
                                  {formatInr(d.amount)}
                                </span>
                                {d.initialAmount !== undefined && d.initialAmount > d.amount && (
                                  <span className="text-[10px] text-muted-foreground">
                                    Remaining of {formatInr(d.initialAmount)}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {!d.settled && settlingDebtId !== d.id && (
                                  <Button
                                    size="sm"
                                    className={cn(
                                      "py-1 px-3 h-8 text-xs text-white font-medium",
                                      d.type === "borrowed" ? "bg-orange-600 hover:bg-orange-700" : "bg-emerald-600 hover:bg-emerald-700"
                                    )}
                                    onClick={() => {
                                      setSettlingDebtId(d.id);
                                      setSettleDebtAmount(String(d.amount));
                                      setSettleDebtAccount(d.account || "HDFC Bank");
                                    }}
                                  >
                                    Settle
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setDebts(prev => prev.filter(item => item.id !== d.id));
                                    showToast("Debt record removed.");
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Settle/Pay Sub-Form */}
                          {settlingDebtId === d.id && (
                            <div className="p-3 border border-primary/20 bg-primary/5 rounded-lg space-y-3">
                              <span className="text-xs font-semibold text-primary block">
                                Settle / Pay Loan Balance
                              </span>
                              <div className="grid gap-3 grid-cols-2">
                                <label className="grid gap-1.5 text-xs">
                                  Amount to Settle (₹)
                                  <input
                                    type="number"
                                    value={settleDebtAmount}
                                    onChange={(e) => setSettleDebtAmount(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 outline-none focus:border-primary text-xs"
                                  />
                                </label>
                                <label className="grid gap-1.5 text-xs">
                                  Payment Mode (Account)
                                  <select
                                    value={settleDebtAccount}
                                    onChange={(e) => setSettleDebtAccount(e.target.value as AccountName)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 outline-none focus:border-primary text-xs"
                                  >
                                    {accounts.map((acc) => (
                                      <option key={acc.name} value={acc.name}>{acc.name}</option>
                                    ))}
                                  </select>
                                </label>
                              </div>

                              <div className="flex justify-end gap-2 text-xs">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs px-3"
                                  onClick={() => setSettlingDebtId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs px-3 bg-primary text-primary-foreground hover:bg-primary/95"
                                  onClick={() => {
                                    const amt = Number(settleDebtAmount);
                                    if (!amt || amt <= 0) {
                                      showToast("Please enter a valid settlement amount.");
                                      return;
                                    }
                                    
                                    const amountToSubtract = Math.min(d.amount, amt);
                                    const newAmount = Math.max(0, d.amount - amountToSubtract);
                                    const fullySettled = newAmount <= 0;

                                    const paymentRecord = {
                                      id: crypto.randomUUID(),
                                      amount: amountToSubtract,
                                      date: new Date().toISOString().slice(0, 10),
                                      account: settleDebtAccount
                                    };

                                    setDebts(prev =>
                                      prev.map(item =>
                                        item.id === d.id
                                          ? {
                                              ...item,
                                              amount: newAmount,
                                              initialAmount: item.initialAmount || item.amount,
                                              settled: fullySettled,
                                              payments: [...(item.payments || []), paymentRecord]
                                            }
                                          : item
                                      )
                                    );

                                    // Add transaction ledger entry
                                    const newEntry: Entry = {
                                      id: crypto.randomUUID(),
                                      type: d.type === "borrowed" ? "expense" : "income",
                                      account: settleDebtAccount,
                                      amount: amountToSubtract,
                                      category: d.type === "borrowed" ? "Miscellaneous" : "Freelancing",
                                      note: d.type === "borrowed"
                                        ? `Paid ${formatInr(amountToSubtract)} to ${d.name} (Debt Settlement)`
                                        : `Received ${formatInr(amountToSubtract)} from ${d.name} (Loan Settlement)`,
                                      date: new Date().toISOString().slice(0, 10)
                                    };
                                    setEntries(prev => [newEntry, ...prev]);

                                    setSettlingDebtId(null);
                                    showToast(fullySettled ? "Debt fully settled!" : `Paid ${formatInr(amountToSubtract)} off debt.`);
                                  }}
                                >
                                  Confirm
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-background/95 p-4 text-sm shadow-card-dark backdrop-blur-xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          {toast}
        </div>
      )}
    </main>
  );
}
