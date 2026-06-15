import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export type AccountType = "bank" | "cash" | "upi" | "investment";
export type TransactionKind = "income" | "expense" | "transfer" | "allocation";

export type BankAccount = {
  id: string;
  name: "HDFC" | "IDFC" | "Union" | "Cash" | "UPI";
  type: AccountType;
  balance: number;
  monthlyFlow: number;
  health: "excellent" | "stable" | "watch";
};

export type Transaction = {
  id: string;
  kind: TransactionKind;
  source: string;
  category: string;
  amount: number;
  occurredAt: string;
  business: boolean;
};
