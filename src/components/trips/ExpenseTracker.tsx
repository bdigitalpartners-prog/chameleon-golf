"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Plus,
  ArrowRight,
  Loader2,
  Receipt,
  CreditCard,
  X,
} from "lucide-react";

type Participant = {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name?: string; email?: string; image?: string };
};

type Expense = {
  id: string;
  description: string;
  amount: string | number;
  category?: string;
  paidById: string;
  splitType: string;
  splitData?: any;
  paidBy: { id: string; name?: string; image?: string };
  createdAt: string;
};

type Settlement = {
  fromUserId: string;
  fromUserName?: string;
  toUserId: string;
  toUserName?: string;
  amount: number;
};

type SettlementResult = {
  balances: Record<string, number>;
  settlements: Settlement[];
  totalExpenses: number;
  perPersonAverage: number;
};

type ExpenseTrackerProps = {
  tripId: string;
  expenses: Expense[];
  participants: Participant[];
  onUpdate: () => void;
};

const CATEGORIES = [
  "Green Fees",
  "Lodging",
  "Transportation",
  "Food & Drink",
  "Equipment",
  "Other",
];

export function ExpenseTracker({
  tripId,
  expenses,
  participants,
  onUpdate,
}: ExpenseTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settlements, setSettlements] = useState<SettlementResult | null>(null);
  const [loadingSettlements, setLoadingSettlements] = useState(false);

  // Form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState("");
  const [category, setCategory] = useState("");
  const [splitType, setSplitType] = useState("equal");

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  const fetchSettlements = async () => {
    setLoadingSettlements(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/settlements`);
      if (res.ok) {
        const data = await res.json();
        setSettlements(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSettlements(false);
    }
  };

  useEffect(() => {
    if (expenses.length > 0) {
      fetchSettlements();
    }
  }, [expenses.length]);

  const handleAddExpense = async () => {
    if (!description.trim() || !amount || Number(amount) <= 0) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amount: Number(amount),
          paidById: paidById || undefined,
          category: category || undefined,
          splitType,
        }),
      });

      if (res.ok) {
        setDescription("");
        setAmount("");
        setPaidById("");
        setCategory("");
        setSplitType("equal");
        setShowForm(false);
        onUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: "var(--cg-bg-tertiary)",
    color: "var(--cg-text-primary)",
    border: "1px solid var(--cg-border)",
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="h-4 w-4" style={{ color: "var(--cg-accent)" }} />
            <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              Total
            </span>
          </div>
          <div className="text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
            ${totalExpenses.toFixed(2)}
          </div>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4" style={{ color: "var(--cg-accent)" }} />
            <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              Per Person
            </span>
          </div>
          <div className="text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
            ${settlements?.perPersonAverage?.toFixed(2) ?? (participants.length > 0 ? (totalExpenses / participants.length).toFixed(2) : "0.00")}
          </div>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4" style={{ color: "var(--cg-accent)" }} />
            <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              Expenses
            </span>
          </div>
          <div className="text-xl font-bold" style={{ color: "var(--cg-text-primary)" }}>
            {expenses.length}
          </div>
        </div>
      </div>

      {/* Add expense button or form */}
      {showForm ? (
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
              Add Expense
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="p-1 rounded-lg transition-colors"
              style={{ color: "var(--cg-text-muted)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Green fees at Troon North"
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                  Amount ($)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                >
                  <option value="">Select...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                  Paid By
                </label>
                <select
                  value={paidById}
                  onChange={(e) => setPaidById(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                >
                  <option value="">Me (default)</option>
                  {participants.map((p) => (
                    <option key={p.userId} value={p.userId}>
                      {p.user.name ?? p.user.email ?? p.userId}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--cg-text-secondary)" }}>
                  Split Type
                </label>
                <select
                  value={splitType}
                  onChange={(e) => setSplitType(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                >
                  <option value="equal">Split Equally</option>
                  <option value="custom">Custom Split</option>
                  <option value="percentage">By Percentage</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleAddExpense}
              disabled={submitting || !description.trim() || !amount || Number(amount) <= 0}
              className="w-full rounded-lg py-2 text-sm font-medium transition-all disabled:opacity-30"
              style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                "Add Expense"
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-medium transition-all"
          style={{
            backgroundColor: "var(--cg-bg-card)",
            border: "1px dashed var(--cg-border)",
            color: "var(--cg-text-muted)",
          }}
        >
          <Plus className="h-4 w-4" /> Add Expense
        </button>
      )}

      {/* Expense list */}
      {expenses.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--cg-border)" }}>
            <h3 className="font-display text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
              All Expenses
            </h3>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--cg-border)" }}>
            {expenses.map((expense) => (
              <div key={expense.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
                  >
                    {expense.paidBy.image ? (
                      <img
                        src={expense.paidBy.image}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <DollarSign className="h-3.5 w-3.5" style={{ color: "var(--cg-text-muted)" }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--cg-text-primary)" }}>
                      {expense.description}
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--cg-text-muted)" }}>
                      <span>Paid by {expense.paidBy.name ?? "Unknown"}</span>
                      {expense.category && (
                        <>
                          <span>|</span>
                          <span>{expense.category}</span>
                        </>
                      )}
                      <span>|</span>
                      <span>{expense.splitType}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold flex-shrink-0 ml-3" style={{ color: "var(--cg-text-primary)" }}>
                  ${Number(expense.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settlements */}
      {settlements && settlements.settlements.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <h3 className="font-display text-sm font-semibold mb-4" style={{ color: "var(--cg-text-primary)" }}>
            Settlements
          </h3>
          <p className="text-xs mb-3" style={{ color: "var(--cg-text-muted)" }}>
            Minimized payments to settle all debts:
          </p>
          <div className="space-y-2">
            {settlements.settlements.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg p-3"
                style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
              >
                <span className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                  {s.fromUserName ?? s.fromUserId}
                </span>
                <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: "var(--cg-accent)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--cg-text-primary)" }}>
                  {s.toUserName ?? s.toUserId}
                </span>
                <span className="ml-auto text-sm font-bold" style={{ color: "var(--cg-accent)" }}>
                  ${s.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for settlements when no expenses */}
      {expenses.length === 0 && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
        >
          <DollarSign className="mx-auto h-10 w-10" style={{ color: "var(--cg-text-muted)" }} />
          <h3 className="mt-3 font-display text-lg font-semibold" style={{ color: "var(--cg-text-primary)" }}>
            No expenses yet
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--cg-text-muted)" }}>
            Add expenses to track costs and calculate settlements
          </p>
        </div>
      )}
    </div>
  );
}
