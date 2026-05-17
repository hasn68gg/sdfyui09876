import { Router } from "express";
import { db, eq, desc, count, sql, users, products, orders, walletTopupRequests, orderItems, banners, siteSettings, paymentMethods, wallets, walletTransactions } from "../db";
import { authMiddleware, adminOnly } from "../lib/auth";

const router = Router();
const adminAuth = [authMiddleware, adminOnly] as any[];

router.get("/admin/dashboard", ...adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, pendingOrders, deliveredOrders, pendingTopups, revenue, recentOrders] = await Promise.all([
      db.select({ count: count() }).from(users).where(eq(users.role, "USER")),
      db.select({ count: count() }).from(products).where(eq(products.isActive, true)),
      db.select({ count: count() }).from(orders),
      db.select({ count: count() }).from(orders).where(eq(orders.status, "PENDING")),
      db.select({ count: count() }).from(orders).where(eq(orders.status, "DELIVERED")),
      db.select({ count: count() }).from(walletTopupRequests).where(eq(walletTopupRequests.status, "PENDING")),
      db.select({ total: sql<number>`SUM(total_amount)` }).from(orders),
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10),
    ]);

    const recentWithUsers = await Promise.all(recentOrders.map(async o => {
      const user = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, o.userId)).limit(1);
      return { ...o, user: user[0] };
    }));

    res.json({
      stats: {
        totalUsers: Number(totalUsers[0]?.count ?? 0),
        totalProducts: Number(totalProducts[0]?.count ?? 0),
        totalOrders: Number(totalOrders[0]?.count ?? 0),
        pendingOrders: Number(pendingOrders[0]?.count ?? 0),
        deliveredOrders: Number(deliveredOrders[0]?.count ?? 0),
        pendingTopups: Number(pendingTopups[0]?.count ?? 0),
        totalRevenue: Number(revenue[0]?.total ?? 0),
      },
      recentOrders: recentWithUsers,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/users", ...adminAuth, async (req, res) => {
  try {
    const allUsers = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, isBanned: users.isBanned, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt));
    res.json({ users: allUsers });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/admin/users/:id", ...adminAuth, async (req, res) => {
  try {
    const [user] = await db.update(users).set({ ...req.body, updatedAt: new Date() }).where(eq(users.id, req.params.id)).returning();
    res.json({ user });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/wallet", ...adminAuth, async (req, res) => {
  try {
    const topups = await db.select().from(walletTopupRequests)
      .leftJoin(users, eq(walletTopupRequests.userId, users.id))
      .leftJoin(paymentMethods, eq(walletTopupRequests.paymentMethodId, paymentMethods.id))
      .orderBy(desc(walletTopupRequests.createdAt));
    res.json({ topups });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/admin/wallet/:id", ...adminAuth, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const topup = await db.select().from(walletTopupRequests).where(eq(walletTopupRequests.id, req.params.id)).limit(1);
    if (!topup[0]) { res.status(404).json({ error: "Not found" }); return; }

    await db.update(walletTopupRequests).set({ status, adminNote, updatedAt: new Date() }).where(eq(walletTopupRequests.id, req.params.id));

    if (status === "APPROVED") {
      const wallet = await db.select().from(wallets).where(eq(wallets.userId, topup[0].userId)).limit(1);
      if (wallet[0]) {
        await db.update(wallets).set({ balance: wallet[0].balance + topup[0].amount }).where(eq(wallets.id, wallet[0].id));
        await db.insert(walletTransactions).values({ walletId: wallet[0].id, amount: topup[0].amount, type: "TOPUP", description: "Wallet top-up approved" });
      }
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/banners", ...adminAuth, async (req, res) => {
  try {
    const rows = await db.select().from(banners).orderBy(banners.sortOrder);
    res.json({ banners: rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/admin/banners", ...adminAuth, async (req, res) => {
  try {
    const [banner] = await db.insert(banners).values(req.body).returning();
    res.json({ banner });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/admin/banners/:id", ...adminAuth, async (req, res) => {
  try {
    const [banner] = await db.update(banners).set({ ...req.body, updatedAt: new Date() }).where(eq(banners.id, req.params.id)).returning();
    res.json({ banner });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/admin/banners/:id", ...adminAuth, async (req, res) => {
  try {
    await db.delete(banners).where(eq(banners.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/admin/products/:id", ...adminAuth, async (req, res) => {
  try {
    const { isActive, stock, price, discountPrice } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (isActive !== undefined) updates.isActive = isActive;
    if (stock !== undefined) updates.stock = stock;
    if (price !== undefined) updates.price = price;
    if (discountPrice !== undefined) updates.discountPrice = discountPrice;
    const [product] = await db.update(products).set(updates).where(eq(products.id, req.params.id)).returning();
    res.json({ product });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/admin/products/:id", ...adminAuth, async (req, res) => {
  try {
    await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/settings", ...adminAuth, async (req, res) => {
  try {
    const settings = await db.select().from(siteSettings);
    const map: Record<string, string | null> = {};
    settings.forEach(s => { map[s.key] = s.value; });
    res.json({ settings: map });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/payment-methods", ...adminAuth, async (req, res) => {
  try {
    const methods = await db.select().from(paymentMethods).orderBy(paymentMethods.createdAt);
    res.json({ paymentMethods: methods });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/admin/payment-methods", ...adminAuth, async (req, res) => {
  try {
    const { nameAr, nameEn, accountInfo, logo, isActive = true, sortOrder = "0" } = req.body;
    if (!nameAr || !nameEn) { res.status(400).json({ error: "nameAr and nameEn are required" }); return; }
    const [method] = await db.insert(paymentMethods).values({ nameAr, nameEn, accountInfo, logo, isActive, sortOrder: String(sortOrder) }).returning();
    res.status(201).json({ paymentMethod: method });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/admin/payment-methods/:id", ...adminAuth, async (req, res) => {
  try {
    const { nameAr, nameEn, accountInfo, logo, isActive, sortOrder } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (nameAr !== undefined) updates.nameAr = nameAr;
    if (nameEn !== undefined) updates.nameEn = nameEn;
    if (accountInfo !== undefined) updates.accountInfo = accountInfo;
    if (logo !== undefined) updates.logo = logo;
    if (isActive !== undefined) updates.isActive = isActive;
    if (sortOrder !== undefined) updates.sortOrder = String(sortOrder);
    const [method] = await db.update(paymentMethods).set(updates).where(eq(paymentMethods.id, req.params.id)).returning();
    if (!method) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ paymentMethod: method });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/admin/payment-methods/:id", ...adminAuth, async (req, res) => {
  try {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/admin/settings", ...adminAuth, async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
      if (existing[0]) {
        await db.update(siteSettings).set({ value: String(value), updatedAt: new Date() }).where(eq(siteSettings.key, key));
      } else {
        await db.insert(siteSettings).values({ key, value: String(value) });
      }
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
