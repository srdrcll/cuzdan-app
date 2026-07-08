export interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    color: string;
    creditLimit?: number | null;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string | null;
    category: string | null;
    date: string;
    accountName: string;
    toAccountName?: string | null;
  }>;
  monthlyData: Array<{
    month: string;
    income: number;
    expense: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
  }>;
  credits: Array<{
    id: string;
    name: string;
    remainingAmount: number;
    totalAmount: number;
    monthlyPayment: number;
    dueDate: string | null;
  }>;
  unreadNotifications: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
