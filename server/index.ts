import express, { type Express } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

console.log("Starting server...");

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  try {
    console.log("Registering routes...");
    // Register API routes
    const server = await registerRoutes(app);
    console.log("Routes registered successfully");
    
    // Error handling middleware
    app.use((err: any, _req: any, res: any, _next: any) => {
      console.error("Server error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Setup Vite for development or serve static files for production
    if (app.get("env") === "development") {
      console.log("Setting up Vite...");
      await setupVite(app, server);
    } else {
      console.log("Serving static files...");
      serveStatic(app);
    }

    const PORT = parseInt(process.env.PORT || "5000", 10);
    
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Fatal error starting server:", error);
    process.exit(1);
  }
})();
