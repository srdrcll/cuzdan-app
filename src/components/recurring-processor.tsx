"use client";

import { useEffect, useRef } from "react";
import { db } from "@/lib/offline-db";
import { v4 as uuidv4 } from "uuid";
import { addDays, addWeeks, addMonths, addYears, isBefore, isEqual, startOfDay, differenceInDays, format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export function RecurringProcessor() {
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    async function processRecurring() {
      try {
        const today = startOfDay(new Date());
        
        // Find all recurring transactions
        const recurring = await db.recurringTransactions.toArray();
        
        for (const req of recurring) {
          let nextDate = startOfDay(new Date(req.nextDate));
          let completed = req.completedInstallments || 0;
          const total = req.totalInstallments || 0;
          let shouldDelete = false;
          
          // While the nextDate is today or in the past
          while (isBefore(nextDate, today) || isEqual(nextDate, today)) {
            if (total > 0 && completed >= total) {
              shouldDelete = true;
              break;
            }

            // 1. Create the transaction
            const category = req.categoryId ? await db.categories.get(req.categoryId) : null;
            const transactionId = uuidv4();
            
            let description = req.title;
            if (total > 0) {
              completed += 1;
              description = `${req.title} (Taksit ${completed}/${total})`;
            }

            await db.transactions.add({
              id: transactionId,
              type: req.type,
              amount: req.amount,
              description,
              category: category ? category.name : null,
              accountId: req.accountId,
              toAccountId: null,
              date: nextDate,
              createdAt: new Date(),
            });
            
            // 2. Update the account balance
            const account = await db.accounts.get(req.accountId);
            if (account) {
              const newBalance =
                req.type === "income"
                  ? account.balance + req.amount
                  : account.balance - req.amount;
              await db.accounts.update(req.accountId, { balance: newBalance });
            }
            
            // 3. Advance the date
            if (req.frequency === "daily") {
              nextDate = addDays(nextDate, 1);
            } else if (req.frequency === "weekly") {
              nextDate = addWeeks(nextDate, 1);
            } else if (req.frequency === "biweekly") {
              nextDate = addWeeks(nextDate, 2);
            } else if (req.frequency === "monthly") {
              nextDate = addMonths(nextDate, 1);
            } else if (req.frequency === "quarterly") {
              nextDate = addMonths(nextDate, 3);
            } else if (req.frequency === "yearly") {
              nextDate = addYears(nextDate, 1);
            } else {
              break; // Safety break
            }

            if (total > 0 && completed >= total) {
              shouldDelete = true;
              break;
            }
          }
          
          // 4. Update the recurring transaction's nextDate and completed count in DB
          if (shouldDelete) {
            await db.recurringTransactions.delete(req.id);
          } else if (!isEqual(nextDate, startOfDay(new Date(req.nextDate))) || completed !== (req.completedInstallments || 0)) {
            await db.recurringTransactions.update(req.id, { 
              nextDate: nextDate,
              completedInstallments: completed
            });
          }
        }

        // Check for upcoming payments (due tomorrow)
        for (const req of recurring) {
          const nextDate = startOfDay(new Date(req.nextDate));
          const daysRemaining = differenceInDays(nextDate, today);
          
          if (daysRemaining === 1) {
            const nextDateStr = format(nextDate, "yyyy-MM-dd");
            const notiId = `upcoming-${req.id}-${nextDateStr}`;
            
            const existingNoti = await db.notifications.get(notiId);
            if (!existingNoti) {
              const title = "Yaklaşan Ödeme Hatırlatması";
              const message = `Yarın ${req.title} ödemeniz bulunuyor (${formatCurrency(req.amount)}).`;

              // 1. Save to local DB notifications
              await db.notifications.add({
                id: notiId,
                title,
                message,
                read: false,
                createdAt: new Date(),
              });

              // 2. Trigger native push notification
              try {
                const { LocalNotifications } = await import("@capacitor/local-notifications");
                const hasPerm = await LocalNotifications.checkPermissions();
                if (hasPerm.display === "granted") {
                  await LocalNotifications.schedule({
                    notifications: [
                      {
                        title,
                        body: message,
                        id: Math.floor(Math.random() * 100000),
                      },
                    ],
                  });
                }
              } catch (notiErr) {
                console.warn("LocalNotifications error in upcoming reminder:", notiErr);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to process recurring transactions:", error);
      }
    }

    processRecurring();
  }, []);

  return null; // This component doesn't render anything
}
