import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { InsertUser, User, InsertOrder, Order, InsertPaymentMethod, PaymentMethod } from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Storage interface
export interface IStorage {
  // Users (Replit Auth required methods)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: string): Promise<Order | undefined>;
  getOrdersByUserId(userId: string): Promise<Order[]>;
  updateOrderStatus(orderId: string, status: string, stripePaymentIntentId?: string): Promise<Order | undefined>;
  
  // Payment Methods
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  getPaymentMethodsByUserId(userId: string): Promise<PaymentMethod[]>;
  deletePaymentMethod(id: string): Promise<void>;
  setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void>;
}

// PostgreSQL Storage Implementation
export class PgStorage implements IStorage {
  // Users (Replit Auth required methods)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(schema.users)
      .values(userData)
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Orders
  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(schema.orders).values(order).returning();
    return created;
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return order;
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId))
      .orderBy(desc(schema.orders.createdAt));
  }

  async updateOrderStatus(
    orderId: string, 
    status: string, 
    stripePaymentIntentId?: string
  ): Promise<Order | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (stripePaymentIntentId) {
      updateData.stripePaymentIntentId = stripePaymentIntentId;
    }
    
    const [updated] = await db
      .update(schema.orders)
      .set(updateData)
      .where(eq(schema.orders.id, orderId))
      .returning();
    return updated;
  }

  // Payment Methods
  async createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const [created] = await db.insert(schema.paymentMethods).values(paymentMethod).returning();
    return created;
  }

  async getPaymentMethodsByUserId(userId: string): Promise<PaymentMethod[]> {
    return await db
      .select()
      .from(schema.paymentMethods)
      .where(eq(schema.paymentMethods.userId, userId))
      .orderBy(desc(schema.paymentMethods.createdAt));
  }

  async deletePaymentMethod(id: string): Promise<void> {
    await db.delete(schema.paymentMethods).where(eq(schema.paymentMethods.id, id));
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    // First, unset all default payment methods for this user
    await db
      .update(schema.paymentMethods)
      .set({ isDefault: false })
      .where(eq(schema.paymentMethods.userId, userId));

    // Then set the specified payment method as default
    await db
      .update(schema.paymentMethods)
      .set({ isDefault: true })
      .where(and(
        eq(schema.paymentMethods.id, paymentMethodId),
        eq(schema.paymentMethods.userId, userId)
      ));
  }
}

// Export storage instance
export const storage = new PgStorage();
