import { pgTable, text, varchar, timestamp, integer, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for authentication (updated for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency").notNull().default("usd"),
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  
  // Customer details
  email: varchar("email").notNull(),
  fullName: varchar("full_name").notNull(),
  
  // Address
  addressLine1: varchar("address_line1").notNull(),
  addressLine2: varchar("address_line2"),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zipCode: varchar("zip_code").notNull(),
  country: varchar("country").notNull(),
  
  // Flags
  isResearcher: boolean("is_researcher").default(false),
  agreeToTerms: boolean("agree_to_terms").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  email: z.string().email(),
  amount: z.number().positive(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms"
  }),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Payment methods table (for saved cards, if needed)
export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  stripePaymentMethodId: varchar("stripe_payment_method_id").notNull(),
  last4: varchar("last4").notNull(),
  brand: varchar("brand").notNull(),
  expiryMonth: integer("expiry_month").notNull(),
  expiryYear: integer("expiry_year").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({ 
  id: true, 
  createdAt: true 
});

export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
