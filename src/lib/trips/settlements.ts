/**
 * Expense Settlement Calculator
 *
 * Takes an array of expenses (each with who paid and how to split),
 * computes net balances, and returns minimized settlement transactions
 * (who owes whom and how much).
 */

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  paidByName?: string;
  splitType: "equal" | "custom" | "percentage";
  /** For equal splits: array of participant userIds; for custom: { userId: amount }; for percentage: { userId: percent } */
  splitData?: {
    participantIds?: string[];
    customAmounts?: Record<string, number>;
    percentages?: Record<string, number>;
  };
  /** All participant IDs in the trip (used when splitData is not provided for equal splits) */
  allParticipantIds?: string[];
}

export interface Settlement {
  fromUserId: string;
  fromUserName?: string;
  toUserId: string;
  toUserName?: string;
  amount: number;
}

export interface SettlementResult {
  balances: Record<string, number>;
  settlements: Settlement[];
  totalExpenses: number;
  perPersonAverage: number;
}

/**
 * Calculate how each expense should be split among participants.
 * Returns a map of userId -> amount owed for this expense.
 */
function splitExpense(expense: Expense): Record<string, number> {
  const splits: Record<string, number> = {};
  const { amount, splitType, splitData, allParticipantIds } = expense;

  if (splitType === "custom" && splitData?.customAmounts) {
    // Custom amounts specified per user
    for (const [userId, customAmount] of Object.entries(
      splitData.customAmounts
    )) {
      splits[userId] = customAmount;
    }
  } else if (splitType === "percentage" && splitData?.percentages) {
    // Percentage-based split
    for (const [userId, percentage] of Object.entries(splitData.percentages)) {
      splits[userId] = Math.round((amount * percentage) / 100 * 100) / 100;
    }
  } else {
    // Equal split (default)
    const participants =
      splitData?.participantIds ?? allParticipantIds ?? [expense.paidById];
    if (participants.length === 0) {
      splits[expense.paidById] = amount;
    } else {
      const perPerson = Math.round((amount / participants.length) * 100) / 100;
      for (const userId of participants) {
        splits[userId] = perPerson;
      }

      // Handle rounding remainder: assign to payer
      const totalSplit = Object.values(splits).reduce((a, b) => a + b, 0);
      const remainder = Math.round((amount - totalSplit) * 100) / 100;
      if (remainder !== 0) {
        splits[expense.paidById] =
          (splits[expense.paidById] ?? 0) + remainder;
      }
    }
  }

  return splits;
}

/**
 * Calculate net balances from all expenses.
 * Positive = is owed money, Negative = owes money.
 */
function calculateBalances(expenses: Expense[]): Record<string, number> {
  const balances: Record<string, number> = {};

  for (const expense of expenses) {
    const splits = splitExpense(expense);

    // The payer paid the full amount, so they are owed that
    balances[expense.paidById] =
      (balances[expense.paidById] ?? 0) + expense.amount;

    // Each person owes their split
    for (const [userId, owedAmount] of Object.entries(splits)) {
      balances[userId] = (balances[userId] ?? 0) - owedAmount;
    }
  }

  // Round all balances to 2 decimal places
  for (const userId of Object.keys(balances)) {
    balances[userId] = Math.round(balances[userId] * 100) / 100;
  }

  return balances;
}

/**
 * Minimize the number of settlement transactions using a greedy algorithm.
 * This pairs the person who owes the most with the person owed the most,
 * settling the minimum of their balances each iteration.
 */
function minimizeSettlements(
  balances: Record<string, number>,
  nameMap?: Record<string, string>
): Settlement[] {
  const settlements: Settlement[] = [];

  // Separate into debtors (negative balance) and creditors (positive balance)
  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  for (const [userId, balance] of Object.entries(balances)) {
    if (balance < -0.01) {
      debtors.push({ userId, amount: Math.abs(balance) });
    } else if (balance > 0.01) {
      creditors.push({ userId, amount: balance });
    }
  }

  // Sort both arrays descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settleAmount =
      Math.round(Math.min(debtor.amount, creditor.amount) * 100) / 100;

    if (settleAmount > 0.01) {
      settlements.push({
        fromUserId: debtor.userId,
        fromUserName: nameMap?.[debtor.userId],
        toUserId: creditor.userId,
        toUserName: nameMap?.[creditor.userId],
        amount: settleAmount,
      });
    }

    debtor.amount = Math.round((debtor.amount - settleAmount) * 100) / 100;
    creditor.amount = Math.round((creditor.amount - settleAmount) * 100) / 100;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return settlements;
}

/**
 * Main function: calculate settlements from a list of expenses.
 */
export function calculateSettlements(
  expenses: Expense[],
  nameMap?: Record<string, string>
): SettlementResult {
  if (expenses.length === 0) {
    return {
      balances: {},
      settlements: [],
      totalExpenses: 0,
      perPersonAverage: 0,
    };
  }

  const balances = calculateBalances(expenses);
  const settlements = minimizeSettlements(balances, nameMap);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const uniqueParticipants = new Set<string>();
  for (const expense of expenses) {
    uniqueParticipants.add(expense.paidById);
    const splits = splitExpense(expense);
    for (const userId of Object.keys(splits)) {
      uniqueParticipants.add(userId);
    }
  }

  const perPersonAverage =
    uniqueParticipants.size > 0
      ? Math.round((totalExpenses / uniqueParticipants.size) * 100) / 100
      : 0;

  return {
    balances,
    settlements,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    perPersonAverage,
  };
}
