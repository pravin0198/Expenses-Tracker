import type { BankAccount, Transaction } from "@/lib/supabase";

export const accounts: BankAccount[] = [
  { id: "hdfc", name: "HDFC", type: "bank", balance: 248500, monthlyFlow: 18.4, health: "excellent" },
  { id: "idfc", name: "IDFC", type: "bank", balance: 146250, monthlyFlow: 7.2, health: "stable" },
  { id: "union", name: "Union", type: "bank", balance: 82300, monthlyFlow: -2.1, health: "watch" },
  { id: "cash", name: "Cash", type: "cash", balance: 18600, monthlyFlow: -8.5, health: "stable" },
  { id: "upi", name: "UPI", type: "upi", balance: 39450, monthlyFlow: 12.8, health: "excellent" }
];

export const incomeStreams = [
  { name: "Phoenix Business", amount: 285000, change: 24, color: "#14b8a6" },
  { name: "College Workshops", amount: 96000, change: 12, color: "#f6c85f" },
  { name: "Freelancing", amount: 74000, change: -4, color: "#f97316" }
];

export const expenses = [
  { category: "Business Ops", personal: 0, business: 78000 },
  { category: "Education", personal: 18500, business: 12000 },
  { category: "Food", personal: 23600, business: 8600 },
  { category: "Travel", personal: 16400, business: 24500 },
  { category: "Tools", personal: 4200, business: 31800 },
  { category: "Lifestyle", personal: 29600, business: 0 }
];

export const monthlyPerformance = [
  { month: "Jan", income: 310000, expenses: 172000, savings: 82000, netWorth: 960000 },
  { month: "Feb", income: 345000, expenses: 181000, savings: 96000, netWorth: 1035000 },
  { month: "Mar", income: 328000, expenses: 176000, savings: 88000, netWorth: 1095000 },
  { month: "Apr", income: 402000, expenses: 214000, savings: 122000, netWorth: 1198000 },
  { month: "May", income: 438000, expenses: 226000, savings: 134000, netWorth: 1308000 },
  { month: "Jun", income: 455000, expenses: 238000, savings: 146000, netWorth: 1426000 }
];

export const savingsAllocation = [
  { bucket: "Emergency Fund", target: 500000, current: 382000, allocation: 42000 },
  { bucket: "Tax Reserve", target: 300000, current: 211000, allocation: 55000 },
  { bucket: "Growth Capital", target: 750000, current: 468000, allocation: 74000 },
  { bucket: "Travel & Life", target: 200000, current: 118000, allocation: 18000 }
];

export const goals = [
  { name: "12-month runway", current: 382000, target: 500000, due: "Sep 2026" },
  { name: "Phoenix studio setup", current: 468000, target: 750000, due: "Dec 2026" },
  { name: "Index fund milestone", current: 310000, target: 500000, due: "Mar 2027" }
];

export const portfolio = [
  { asset: "Index Funds", value: 310000, allocation: 42, returnPct: 13.8 },
  { asset: "Indian Equities", value: 185000, allocation: 25, returnPct: 18.2 },
  { asset: "Debt Funds", value: 124000, allocation: 17, returnPct: 7.1 },
  { asset: "Gold", value: 72000, allocation: 10, returnPct: 10.4 },
  { asset: "Cash Reserve", value: 46000, allocation: 6, returnPct: 3.5 }
];

export const recentTransactions: Transaction[] = [
  { id: "t1", kind: "income", source: "Phoenix Business", category: "Retainer", amount: 125000, occurredAt: "Today", business: true },
  { id: "t2", kind: "expense", source: "HDFC", category: "Business Ops", amount: -18500, occurredAt: "Today", business: true },
  { id: "t3", kind: "income", source: "College Workshops", category: "Workshop", amount: 48000, occurredAt: "Yesterday", business: true },
  { id: "t4", kind: "allocation", source: "IDFC", category: "Tax Reserve", amount: -35000, occurredAt: "Jun 12", business: true },
  { id: "t5", kind: "expense", source: "UPI", category: "Food", amount: -1850, occurredAt: "Jun 12", business: false }
];

export const insights = [
  "Business income is up 24% month over month, but operating costs crossed the 27% guardrail.",
  "Tax reserve is underfunded by Rs 89k for projected June quarter liability.",
  "You can move Rs 42k from idle HDFC balance into emergency fund without affecting working capital.",
  "Workshop revenue has the best margin profile this month at 78% contribution."
];
