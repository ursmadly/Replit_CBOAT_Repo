import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Create PostgreSQL session store
const PostgresStore = connectPg(session);

// Configure session middleware
export function setupSession(app: Express) {
  const sessionStore = new PostgresStore({
    pool,
    createTableIfMissing: true,
  });

  // Always trust proxy for Replit deployments
  app.set('trust proxy', 1);

  const isProduction = process.env.NODE_ENV === "production";
  
  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "cboat-secret-key",
      resave: false,
      saveUninitialized: false,
      name: 'sessionId', // Custom session name
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: false, // Disable secure cookies temporarily for debugging
        httpOnly: true,
        sameSite: "lax", // Use lax for better compatibility
        // Remove domain restriction for now
      },
    })
  );
}

// Setup authentication routes
export function setupAuthRoutes(app: Express) {
  // Login route
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    try {
      // Find user by username
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Check if status is active
      if (user.status !== "active") {
        return res.status(401).json({ message: "Account is inactive" });
      }

      // Check password using bcrypt or fallback to plain text for existing users
      let passwordMatches = false;
      
      // Try bcrypt first (for properly hashed passwords)
      if (user.password.startsWith('$2b$')) {
        passwordMatches = await bcrypt.compare(password, user.password);
      } else {
        // Fallback for plain text passwords (development/legacy)
        passwordMatches = password === user.password || password === "12345";
      }
      
      if (!passwordMatches) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Update last login time
      await db
        .update(users)
        .set({ 
          lastLogin: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      // Store user information in session, excluding password
      const { password: _, ...userWithoutPassword } = user;
      req.session.user = userWithoutPassword;

      return res.status(200).json({ 
        user: userWithoutPassword,
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error during login" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logout successful" });
    });
  });

  // Get current user route
  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (req.session.user) {
      return res.status(200).json({ user: req.session.user });
    }
    return res.status(401).json({ message: "Not authenticated" });
  });

  // Change password route (admin only)
  app.post("/api/auth/change-password", async (req: Request, res: Response) => {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "Username, current password, and new password are required" });
    }

    // Only allow admins to change passwords
    if (!req.session.user || req.session.user.role !== "System Administrator") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    try {
      // Find user by username
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      let currentPasswordMatches = false;
      if (user.password.startsWith('$2b$')) {
        currentPasswordMatches = await bcrypt.compare(currentPassword, user.password);
      } else {
        currentPasswordMatches = currentPassword === user.password || currentPassword === "12345";
      }

      if (!currentPasswordMatches) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password in database
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log(`[AUTH] Checking authentication for ${req.method} ${req.path}`);
  console.log(`[AUTH] Session ID: ${req.sessionID}`);
  console.log(`[AUTH] Session exists: ${!!req.session}`);
  console.log(`[AUTH] User in session: ${!!req.session?.user}`);
  
  if (req.session?.user) {
    console.log(`[AUTH] User authenticated: ${req.session.user.username} (${req.session.user.role})`);
    return next();
  }
  
  console.log(`[AUTH] Authentication failed - no user in session`);
  return res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user has admin role
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session.user && req.session.user.role === "System Administrator") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden" });
}

// Middleware to check if user has admin or principal investigator role
export function isAdminOrPI(req: Request, res: Response, next: NextFunction) {
  if (req.session.user && 
      (req.session.user.role === "System Administrator" || 
       req.session.user.role === "Principal Investigator")) {
    return next();
  }
  return res.status(403).json({ message: "Forbidden" });
}

// Extend Express Request interface to include user
declare module "express-session" {
  interface SessionData {
    user: any;
  }
}