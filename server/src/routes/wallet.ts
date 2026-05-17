import { Router } from "express";
import { db, eq, desc, wallets, walletTransactions, walletTopupRequests, paymentMethods, siteSettings } from "../db";
import { authMiddleware, adminOnly } from "../lib/auth";

const router = Router();

router.get("/wallet", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const [wallet, transactions, topupRequests, setting] = await Promise.all([
      db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1),
      db.select().from(walletTransactions).leftJoin(wallets, eq(walletTransactions.walletId, wallets.id))
        .where(eq(wallets.userId, userId)).orderBy(desc(walletTransactions.createdAt)).limit(20),
      db.select().from(walletTopupRequests).leftJoin(paymentMethods, eq(walletTopupRequests.paymentMethodId, paymentMethods.id))
        .where(eq(walletTopupRequests.userId, userId)).orderBy(desc(walletTopupRequests.createdAt)).limit(10),
      db.select().from(siteSettings).where(eq(siteSettings.key, "walletEnabled")).limit(1),
    ]);
    res.json({ wallet: wallet[0] || null, transactions, topupRequests, walletEnabled: setting[0]?.value === "true" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/wallet/topup", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { paymentMethodId, amount, transactionRef } = req.body;
    const [topup] = await db.insert(walletTopupRequests).values({ userId, paymentMethodId, amount, transactionRef }).returning();
    res.json({ topup });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/payment-methods", async (req, res) => {
  try {
    const methods = await db.select().from(paymentMethods).where(eq(paymentMethods.isActive, true));
    res.json({ paymentMethods: methods });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
