import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initRiskProfiles, initResourceProfiles } from "./initData";
import { initAdditionalVendors } from "./initVendors";
import { initEDCAuditData, initFormAuditData } from "./initAuditData";
import { initAllDomainData } from "./initDomainData";
import { initUsers } from "./initUsers";
import { ProfileType } from "@shared/schema";
import { storage } from "./storage";
import { setupSession, setupAuthRoutes } from "./auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup session middleware
setupSession(app);

// Setup authentication routes
setupAuthRoutes(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Initialize sample data
    initRiskProfiles().then(() => {
      // Log the profiles to check if they're being stored
      storage.getRiskProfilesByType(ProfileType.RISK).then(profiles => {
        console.log(`RISK profiles count: ${profiles.length}`);
        console.log(profiles);
      });
      
      storage.getRiskProfilesByType(ProfileType.QUALITY).then(profiles => {
        console.log(`QUALITY profiles count: ${profiles.length}`);
      });
      
      // Also initialize resource profiles for all personnel
      return initResourceProfiles();
    }).then(() => {
      // Log the resource profiles to check if they're being stored
      storage.getRiskProfilesByType(ProfileType.RESOURCE).then(profiles => {
        console.log(`RESOURCE profiles count: ${profiles.length}`);
      });
      
      // Initialize the additional vendors (at least 10)
      return initAdditionalVendors();
    }).then(() => {
      // Log the vendor count after initialization
      storage.getAllVendors().then(vendors => {
        console.log(`Total vendors in system: ${vendors.length}`);
        // Log all vendor names and types
        vendors.forEach(vendor => {
          console.log(`Vendor: ${vendor.name}, Type: ${vendor.type}`);
        });
      });
      
      // Initialize EDC Audit data
      return initEDCAuditData();
    }).then(() => {
      // Initialize Form Audit data
      return initFormAuditData();
    }).then(() => {
      // Initialize other domain data
      return initAllDomainData();
    }).then(() => {
      // Initialize user accounts
      return initUsers();
    }).catch(err => {
      console.error('Error initializing sample data:', err);
    });
  });
})();
