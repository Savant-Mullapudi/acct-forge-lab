import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express, { type Express, type RequestHandler } from "express";
import type { Server } from "http";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [express] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "spa",
  });

  app.use(vite.middlewares);
  
  app.use(async (req, res, next) => {
    // Skip API routes
    if (req.url.startsWith('/api')) {
      return next();
    }
    
    const url = req.originalUrl;

    try {
      const clientPath = path.resolve(__dirname, "../client");
      const template = fs.readFileSync(
        path.resolve(clientPath, "index.html"),
        "utf-8"
      );
      const html = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  log("Vite dev server configured");
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../dist/public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  log(`Serving static files from ${distPath}`);
}
