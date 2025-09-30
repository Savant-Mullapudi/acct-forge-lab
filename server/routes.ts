import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertOrderSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware setup
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Order routes
  app.post("/api/orders", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId,
      });

      // Generate order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create order
      const order = await storage.createOrder({
        ...orderData,
        id: orderId,
      });

      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ 
        message: "Failed to create order",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const order = await storage.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify order belongs to user
      if (order.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.get("/api/orders", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getOrdersByUserId(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Stripe payment routes (to be implemented with Stripe integration)
  app.post("/api/payments/create-intent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // TODO: Implement Stripe payment intent creation
      res.status(501).json({ message: "Stripe integration pending" });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  app.post("/api/payments/confirm", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // TODO: Implement Stripe payment confirmation
      res.status(501).json({ message: "Stripe integration pending" });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Payment method routes
  app.get("/api/payment-methods", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const paymentMethods = await storage.getPaymentMethodsByUserId(userId);
      res.json(paymentMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  app.delete("/api/payment-methods/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deletePaymentMethod(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ message: "Failed to delete payment method" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
