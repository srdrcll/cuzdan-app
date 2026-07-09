import { db } from "./offline-db";
import { v4 as uuidv4 } from "uuid";
import { addMonths } from "date-fns";

export async function handleOfflineRequest(urlStr: string, init?: RequestInit) {
  const dummyBase = "http://localhost";
  const url = new URL(urlStr, dummyBase);
  const path = url.pathname;
  const searchParams = url.searchParams;
  const method = init?.method?.toUpperCase() || "GET";

  let body: any = null;
  if (init?.body && typeof init.body === "string") {
    try {
      body = JSON.parse(init.body);
    } catch (e) {
      console.warn("Failed to parse body JSON", e);
    }
  }

  // ----------------------------------------------------
  // ROUTE: /api/dashboard
  // ----------------------------------------------------
  if (path === "/api/dashboard") {
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    
    const now = new Date();
    const targetMonth = monthParam ? parseInt(monthParam) : now.getMonth() + 1; // 1-12
    const targetYear = yearParam ? parseInt(yearParam) : now.getFullYear();

    const accounts = await db.accounts.toArray();
    
    // Compute total balance (cumulative, including credit cards)
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Filter transactions for target month
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const allTx = await db.transactions.toArray();
    const monthTx = allTx.filter((t) => {
      const d = new Date(t.date);
      return d >= startOfMonth && d <= endOfMonth;
    });

    const totalIncome = monthTx
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthTx
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown
    const categoryMap = new Map<string, number>();
    monthTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        if (t.category) {
          categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
        }
      });
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));

    // 6 Months bar chart data
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(targetYear, targetMonth - 1 - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const subTx = allTx.filter((t) => {
        const txD = new Date(t.date);
        return txD >= mStart && txD <= mEnd;
      });

      const inc = subTx.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
      const exp = subTx.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

      const mName = d.toLocaleDateString("tr-TR", { month: "short" });
      monthlyData.push({
        month: mName,
        income: inc,
        expense: exp,
      });
    }

    // Join account names for recent transactions
    const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
    const recentTransactionsRaw = allTx
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    const recentTransactions = recentTransactionsRaw.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      category: t.category,
      date: t.date,
      accountName: accountMap.get(t.accountId) ?? "Bilinmeyen",
      toAccountName: t.toAccountId ? (accountMap.get(t.toAccountId) ?? "Bilinmeyen") : null,
    }));

    // Credits (Loans) logic
    const dbCredits = await db.credits.toArray();
    const credits = dbCredits.map((c) => ({
      id: c.id,
      name: c.name,
      totalAmount: c.totalAmount,
      remainingAmount: c.remainingAmount,
      monthlyPayment: c.monthlyPayment,
      dueDate: c.dueDate,
    }));

    // Calculate Monthly Savings Rate
    const monthlySavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((monthlySavings / totalIncome) * 100) : 0;

    // Reconstruct Net Worth history for the last 6 months
    const netWorthData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(targetYear, targetMonth - 1 - i, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const mockBalances = new Map(accounts.map(a => [a.id, a.balance]));
      const mockLoans = new Map(dbCredits.map(c => [c.id, c.remainingAmount]));

      const futureTx = allTx.filter(t => new Date(t.date) > mEnd);
      for (const tx of futureTx) {
        if (tx.type === "income") {
          mockBalances.set(tx.accountId, (mockBalances.get(tx.accountId) || 0) - tx.amount);
        } else if (tx.type === "expense") {
          mockBalances.set(tx.accountId, (mockBalances.get(tx.accountId) || 0) + tx.amount);
          
          if (tx.description && tx.description.endsWith(" Ödemesi")) {
            const creditName = tx.description.replace(" Ödemesi", "");
            const matchingCredit = dbCredits.find(c => c.name === creditName);
            if (matchingCredit) {
              mockLoans.set(matchingCredit.id, (mockLoans.get(matchingCredit.id) || 0) + tx.amount);
            }
          }
        } else if (tx.type === "transfer" && tx.toAccountId) {
          mockBalances.set(tx.accountId, (mockBalances.get(tx.accountId) || 0) + tx.amount);
          mockBalances.set(tx.toAccountId, (mockBalances.get(tx.toAccountId) || 0) - tx.amount);
        }
      }

      let totalAssets = 0;
      for (const acc of accounts) {
        if (new Date(acc.createdAt) <= mEnd) {
          totalAssets += mockBalances.get(acc.id) || 0;
        }
      }

      let totalLiabilities = 0;
      for (const c of dbCredits) {
        if (new Date(c.createdAt) <= mEnd) {
          totalLiabilities += mockLoans.get(c.id) || 0;
        }
      }

      const mName = d.toLocaleDateString("tr-TR", { month: "short" });
      netWorthData.push({
        month: mName,
        netWorth: totalAssets - totalLiabilities,
      });
    }

    const unreadNotifications = await db.notifications.where("read").equals(0).count();

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      savingsRate,
      accounts,
      recentTransactions,
      monthlyData,
      netWorthData,
      categoryBreakdown,
      credits,
      unreadNotifications,
    };
  }

  // ----------------------------------------------------
  // ROUTE: /api/accounts
  // ----------------------------------------------------
  if (path === "/api/accounts") {
    if (method === "GET") {
      return await db.accounts.toArray();
    }
    
    if (method === "POST") {
      const id = body.id || uuidv4();
      const newAccount = {
        id,
        name: body.name,
        type: body.type,
        balance: body.balance !== undefined ? Number(body.balance) : 0,
        color: body.color || "#3b82f6",
        creditLimit: body.creditLimit ? Number(body.creditLimit) : null,
        statementDay: body.statementDay ? Number(body.statementDay) : null,
        dueDay: body.dueDay ? Number(body.dueDay) : null,
        minPaymentPct: body.minPaymentPct ? Number(body.minPaymentPct) : null,
        createdAt: new Date(),
      };
      await db.accounts.add(newAccount);
      return newAccount;
    }

    if (method === "DELETE") {
      const id = searchParams.get("id");
      if (id) {
        await db.accounts.delete(id);
        // Cascade delete transactions belonging to this account
        await db.transactions.where("accountId").equals(id).delete();
        await db.transactions.where("toAccountId").equals(id).delete();
        return { success: true };
      }
      throw new Error("Account ID is missing");
    }
  }

  // ----------------------------------------------------
  // ROUTE: /api/categories
  // ----------------------------------------------------
  if (path === "/api/categories") {
    if (method === "GET") {
      return await db.categories.toArray();
    }

    if (method === "POST") {
      const id = body.id || uuidv4();
      const newCategory = {
        id,
        name: body.name,
        type: body.type,
        createdAt: new Date(),
      };
      await db.categories.add(newCategory);
      return newCategory;
    }

    if (method === "DELETE") {
      const id = searchParams.get("id");
      if (id) {
        await db.categories.delete(id);
        return { success: true };
      }
      throw new Error("Category ID is missing");
    }
  }

  // ----------------------------------------------------
  // ROUTE: /api/transactions
  // ----------------------------------------------------
  if (path === "/api/transactions") {
    if (method === "GET") {
      const limit = searchParams.get("limit");
      const search = searchParams.get("search");
      const month = searchParams.get("month");
      const year = searchParams.get("year");
      const accountId = searchParams.get("accountId");
      const category = searchParams.get("category");

      let txList = await db.transactions.toArray();

      if (search) {
        const query = search.toLowerCase();
        txList = txList.filter((t) => 
          (t.description && t.description.toLowerCase().includes(query)) || 
          (t.category && t.category.toLowerCase().includes(query))
        );
      }

      if (accountId) {
        txList = txList.filter((t) => t.accountId === accountId || t.toAccountId === accountId);
      }

      if (category) {
        txList = txList.filter((t) => t.category === category);
      }

      if (month && year) {
        const targetMonth = parseInt(month);
        const targetYear = parseInt(year);
        const start = new Date(targetYear, targetMonth - 1, 1);
        const end = new Date(targetYear, targetMonth, 0, 23, 59, 59);
        txList = txList.filter((t) => {
          const d = new Date(t.date);
          return d >= start && d <= end;
        });
      }

      txList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (limit) {
        txList = txList.slice(0, parseInt(limit));
      }

      const accounts = await db.accounts.toArray();
      const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

      return txList.map((t) => ({
        ...t,
        accountName: accountMap.get(t.accountId) ?? "Bilinmeyen",
        toAccountName: t.toAccountId ? (accountMap.get(t.toAccountId) ?? "Bilinmeyen") : null,
      }));
    }

    if (method === "POST") {
      const { type, accountId, amount, description, category, date, toAccountId, isInstallment, totalInstallments } = body;
      const parsedAmount = Number(amount);
      const parsedDate = date ? new Date(date) : new Date();

      if (type === "transfer") {
        if (!toAccountId) throw new Error("Hedef hesap gerekli.");
        if (accountId === toAccountId) throw new Error("Aynı hesaba transfer yapılamaz");

        const fromAcc = await db.accounts.get(accountId);
        const toAcc = await db.accounts.get(toAccountId);
        if (!fromAcc || !toAcc) throw new Error("Hesap bulunamadı");

        const expenseId = uuidv4();
        const incomeId = uuidv4();

        // 1. Expense transaction (from sender)
        await db.transactions.add({
          id: expenseId,
          type: "expense",
          amount: parsedAmount,
          description: description || `${toAcc.name} hesabına transfer`,
          category: "Transfer",
          accountId,
          toAccountId,
          linkedTransactionId: incomeId,
          date: parsedDate,
          createdAt: new Date(),
        });

        // 2. Income transaction (to receiver)
        await db.transactions.add({
          id: incomeId,
          type: "income",
          amount: parsedAmount,
          description: description || `${fromAcc.name} hesabından transfer`,
          category: "Transfer",
          accountId: toAccountId,
          toAccountId: accountId,
          linkedTransactionId: expenseId,
          date: parsedDate,
          createdAt: new Date(),
        });

        // 3. Update account balances
        await db.accounts.update(accountId, { balance: fromAcc.balance - parsedAmount });
        await db.accounts.update(toAccountId, { balance: toAcc.balance + parsedAmount });

        return { success: true };
      } else {
        // Income or Expense
        const acc = await db.accounts.get(accountId);
        if (!acc) throw new Error("Hesap bulunamadı");

        const isInst = !!isInstallment;
        const total = isInst ? (Number(totalInstallments) || 2) : 1;
        const txAmount = isInst ? Number((parsedAmount / total).toFixed(2)) : parsedAmount;

        const txId = uuidv4();
        const newTx = {
          id: txId,
          type,
          amount: txAmount,
          description: isInst ? `${description || "Taksitli Harcama"} (Taksit 1/${total})` : (description || null),
          category: category || null,
          accountId,
          toAccountId: null,
          date: parsedDate,
          createdAt: new Date(),
        };

        await db.transactions.add(newTx);

        // Update balance
        const newBalance = type === "income" ? acc.balance + txAmount : acc.balance - txAmount;
        await db.accounts.update(accountId, { balance: newBalance });

        // If it's an installment, add recurring plan for remaining installments
        if (isInst) {
          let dbCategory = null;
          if (category) {
            dbCategory = await db.categories.where("name").equalsIgnoreCase(category).first();
          }
          await db.recurringTransactions.add({
            id: uuidv4(),
            title: description || "Taksitli Harcama",
            amount: txAmount,
            type: "expense",
            categoryId: dbCategory ? dbCategory.id : null,
            accountId,
            frequency: "monthly",
            nextDate: addMonths(parsedDate, 1),
            totalInstallments: total,
            completedInstallments: 1,
            createdAt: new Date(),
          });
        }

        // Trigger limit notification warning if card utilization exceeds 90% (Sprint 2 / Sprint 4 rule)
        if (type === "expense" && acc.type === "credit_card" && acc.creditLimit) {
          const usage = Math.abs(newBalance);
          if (usage >= acc.creditLimit * 0.9) {
            await db.notifications.add({
              id: uuidv4(),
              title: "Kredi kartı limiti uyarısı",
              message: `${acc.name} kartınız limitin %90'ına ulaştı.`,
              read: false,
              createdAt: new Date(),
            });
          }
        }

        // Trigger budget breach notification if limit is exceeded (Sprint 11)
        if (type === "expense" && category) {
          try {
            const txDate = new Date(parsedDate);
            const year = txDate.getFullYear();
            const month = String(txDate.getMonth() + 1).padStart(2, "0");
            const monthYear = `${year}-${month}`;

            const budget = await db.categoryBudgets
              .where("[categoryName+monthYear]")
              .equals([category, monthYear])
              .first();

            if (budget) {
              const start = new Date(year, txDate.getMonth(), 1);
              const end = new Date(year, txDate.getMonth() + 1, 0, 23, 59, 59);

              const txs = await db.transactions
                .where("category")
                .equals(category)
                .toArray();

              const totalSpent = txs
                .filter((t) => {
                  const d = new Date(t.date);
                  return t.type === "expense" && d >= start && d <= end;
                })
                .reduce((sum, t) => sum + t.amount, 0);

              if (totalSpent > budget.limitAmount) {
                // 1. Send native push notification
                try {
                  const { LocalNotifications } = await import("@capacitor/local-notifications");
                  const hasPerm = await LocalNotifications.checkPermissions();
                  if (hasPerm.display === "granted") {
                    await LocalNotifications.schedule({
                      notifications: [
                        {
                          title: "Bütçe Aşımı Uyarısı",
                          body: `Uyarı: ${category} bütçenizi aştınız!`,
                          id: Math.floor(Math.random() * 100000),
                        },
                      ],
                    });
                  }
                } catch (notiErr) {
                  console.warn("LocalNotifications error:", notiErr);
                }

                // 2. Also save to db.notifications
                await db.notifications.add({
                  id: uuidv4(),
                  title: "Bütçe Aşımı Uyarısı",
                  message: `Uyarı: ${category} bütçenizi aştınız!`,
                  read: false,
                  createdAt: new Date(),
                });
              }
            }
          } catch (budgetErr) {
            console.error("Budget notification check error:", budgetErr);
          }
        }

        return newTx;
      }
    }

    if (method === "PATCH") {
      if (body.action === "bulk-edit") {
        const { ids, category } = body;
        if (!ids || !Array.isArray(ids)) throw new Error("ids listesi gerekli");
        for (const id of ids) {
          await db.transactions.update(id, { category });
        }
        return { success: true };
      }
    }

    if (method === "DELETE") {
      const idsParam = searchParams.get("ids");
      const ids = idsParam ? idsParam.split(",") : body.ids;
      if (!ids || !Array.isArray(ids)) throw new Error("ids listesi gerekli");

      for (const id of ids) {
        const tx = await db.transactions.get(id);
        if (tx) {
          if (tx.type === "transfer") {
            const fromAcc = await db.accounts.get(tx.accountId);
            if (fromAcc) {
              await db.accounts.update(tx.accountId, { balance: fromAcc.balance + tx.amount });
            }
            if (tx.linkedTransactionId) {
              const linked = await db.transactions.get(tx.linkedTransactionId);
              if (linked) {
                const toAcc = await db.accounts.get(linked.accountId);
                if (toAcc) {
                  await db.accounts.update(linked.accountId, { balance: toAcc.balance - linked.amount });
                }
                await db.transactions.delete(tx.linkedTransactionId);
              }
            }
          } else {
            const acc = await db.accounts.get(tx.accountId);
            if (acc) {
              const newBalance = tx.type === "income" ? acc.balance - tx.amount : acc.balance + tx.amount;
              await db.accounts.update(tx.accountId, { balance: newBalance });
            }
          }
          await db.transactions.delete(tx.id);
        }
      }
      return { success: true };
    }
  }

  // ----------------------------------------------------
  // ROUTE: /api/budgets
  // ----------------------------------------------------
  if (path === "/api/budgets") {
    if (method === "GET") {
      const monthYear = searchParams.get("month_year");
      if (!monthYear) throw new Error("month_year is required");

      const budgets = await db.categoryBudgets.where("monthYear").equals(monthYear).toArray();

      const [yearStr, monthStr] = monthYear.split("-");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);

      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      const txs = await db.transactions.toArray();
      const monthExpenses = txs.filter((t) => {
        const d = new Date(t.date);
        return t.type === "expense" && d >= start && d <= end;
      });

      const spentMap = new Map<string, number>();
      monthExpenses.forEach((t) => {
        if (t.category) {
          spentMap.set(t.category, (spentMap.get(t.category) || 0) + t.amount);
        }
      });

      return budgets.map((b) => ({
        ...b,
        spentAmount: spentMap.get(b.categoryName) || 0,
      }));
    }

    if (method === "POST") {
      const { categoryName, limitAmount, monthYear } = body;
      const parsedLimit = Number(limitAmount);
      const id = uuidv4();

      const newBudget = {
        id,
        categoryName,
        limitAmount: parsedLimit,
        monthYear,
        createdAt: new Date(),
      };

      await db.categoryBudgets.add(newBudget);
      return newBudget;
    }

    if (method === "DELETE") {
      const id = searchParams.get("id");
      if (id) {
        await db.categoryBudgets.delete(id);
        return { success: true };
      }
      throw new Error("Budget ID is missing");
    }
  }

  // ----------------------------------------------------
  // ROUTE: /api/credits
  // ----------------------------------------------------
  if (path === "/api/credits") {
    if (method === "GET") {
      return await db.credits.toArray();
    }

    if (method === "POST") {
      if (body.action === "pay") {
        const { id, amount, accountId } = body;
        const parsedAmount = Number(amount);
        
        const credit = await db.credits.get(id);
        if (!credit) throw new Error("Kredi bulunamadı");
        
        const account = await db.accounts.get(accountId);
        if (!account) throw new Error("Hesap bulunamadı");
        
        const transactionId = uuidv4();
        await db.transactions.add({
          id: transactionId,
          type: "expense",
          amount: parsedAmount,
          description: `${credit.name} Ödemesi`,
          category: "Diğer",
          accountId,
          toAccountId: null,
          date: new Date(),
          createdAt: new Date(),
        });
        
        const newBalance = account.balance - parsedAmount;
        await db.accounts.update(accountId, { balance: newBalance });
        
        const newRemaining = Math.max(0, credit.remainingAmount - parsedAmount);
        await db.credits.update(id, { remainingAmount: newRemaining });
        
        return { ...credit, remainingAmount: newRemaining };
      } else {
        const id = uuidv4();
        const newCredit = {
          id,
          name: body.name,
          totalAmount: Number(body.totalAmount),
          remainingAmount: Number(body.totalAmount),
          interestRate: Number(body.interestRate) || 0,
          monthlyPayment: Number(body.monthlyPayment) || 0,
          dueDate: body.dueDate || null,
          createdAt: new Date(),
        };
        await db.credits.add(newCredit);
        return newCredit;
      }
    }
  }

  // ----------------------------------------------------
  // ROUTE: /api/notifications
  // ----------------------------------------------------
  if (path === "/api/notifications") {
    if (method === "GET") {
      const notificationsList = await db.notifications.toArray();
      notificationsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return notificationsList;
    }

    if (method === "POST") {
      const unread = await db.notifications.where("read").equals(0).toArray();
      for (const n of unread) {
        await db.notifications.update(n.id, { read: true });
      }
      return { success: true };
    }
  }

  throw new Error(`Route not found: ${path} [${method}]`);
}
