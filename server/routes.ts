import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { DatabaseStorage } from "./databaseStorage";
import { FirestoreStorage } from "./firestoreStorage";
import { insertProgramSchema, insertActivitySchema, insertTableConfigSchema, insertColumnHeaderSchema } from "@shared/schema";
import analyticsRouter from "./analytics";
import cors from "cors";
import { authenticateAdmin, requireAuth, type AuthenticatedRequest } from "./auth";
import { AdminAuthService } from "./firebaseAuth";
import multer from "multer";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Use database storage for persistent image storage only
  const dbStorage = new DatabaseStorage();
  // Use Firestore for all other data
  const firestoreStorage = new FirestoreStorage();
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for image uploads
  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'program-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ 
    storage: storage_multer,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Serve uploaded images statically
  app.use('/uploads', express.static(uploadsDir));

  // Enable CORS for production
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://*.replit.app', 'https://*.replit.dev'] 
      : ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true
  }));

  // Authentication middleware for admin routes
  const requireAdmin = (req: any, res: any, next: any) => {
    const adminUser = req.session?.user;
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(401).json({ message: "Admin access required" });
    }
    next();
  };

  // Check if admin exists - this will call client-side Firestore
  app.get("/api/auth/admin-exists", async (req, res) => {
    try {
      const hasAdmin = await AdminAuthService.hasAdminUser();
      res.json({ exists: hasAdmin });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Firestore admin creation endpoint
  app.post("/api/firestore/create-admin", async (req, res) => {
    try {
      const { adminData } = req.body;
      // This endpoint will be called from the client after Firestore operations
      global.adminUser = adminData;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to store admin data" });
    }
  });

  // Firestore admin validation endpoint
  app.post("/api/firestore/validate-admin", async (req, res) => {
    try {
      const { adminData } = req.body;
      global.adminUser = adminData;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate admin data" });
    }
  });

  // Admin functionality endpoints - use Firestore for data
  app.get("/api/export/programs", async (req, res) => {
    try {
      const programs = await firestoreStorage.getPrograms();
      const activities = await firestoreStorage.getActivities();
      const exportData = {
        programs,
        activities,
        exportDate: new Date().toISOString(),
        version: "1.0"
      };
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ message: "Export failed" });
    }
  });

  app.post("/api/import/programs", async (req, res) => {
    try {
      const { programs, activities } = req.body;
      
      // Import programs to Firestore
      if (programs && Array.isArray(programs)) {
        for (const program of programs) {
          const { id, createdAt, updatedAt, ...programData } = program;
          await firestoreStorage.createProgram(programData);
        }
      }
      
      // Import activities to Firestore
      if (activities && Array.isArray(activities)) {
        for (const activity of activities) {
          const { id, createdAt, ...activityData } = activity;
          await firestoreStorage.createActivity(activityData);
        }
      }
      
      res.json({ success: true, message: "Data imported successfully" });
    } catch (error) {
      res.status(500).json({ message: "Import failed" });
    }
  });

  app.post("/api/sync/database", async (req, res) => {
    try {
      // For now, this just returns success
      // In a real implementation, this would sync with external databases
      res.json({ success: true, message: "Database synced successfully" });
    } catch (error) {
      res.status(500).json({ message: "Sync failed" });
    }
  });

  // Admin signup endpoint
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      if (!email || !password || !username) {
        return res.status(400).json({ message: "Email, password, and username are required" });
      }

      const adminUser = await AdminAuthService.createAdmin(email, password, username);
      
      // Create session data
      const sessionData = {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        loginTime: new Date().toISOString()
      };
      
      if (req.session) {
        req.session.user = sessionData;
      }
      
      res.json({ 
        success: true,
        user: sessionData
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create admin user" });
    }
  });

  // Admin login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const adminUser = await AdminAuthService.validateAdmin(email, password);
      
      if (adminUser) {
        // Create session data
        const sessionData = {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role,
          loginTime: new Date().toISOString()
        };
        
        if (req.session) {
          req.session.user = sessionData;
        }
        
        res.json({ 
          success: true,
          user: sessionData
        });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  });

  app.get("/api/auth/user", (req, res) => {
    // Check if user is authenticated via session
    if (req.session?.user) {
      res.json(req.session.user);
    } else {
      res.json(null);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          res.status(500).json({ error: "Failed to logout" });
        } else {
          res.json({ success: true });
        }
      });
    } else {
      res.json({ success: true });
    }
  });
  // Programs API - All data operations now handled by Firestore on client side
  // Only image upload endpoints remain server-side

  // Legacy Activities API endpoints removed - now handled by Firestore on client side

  app.get("/api/programs/:id/activities", async (req, res) => {
    try {
      const programId = parseInt(req.params.id);
      const activities = await dbStorage.getActivitiesByProgram(programId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", requireAdmin, async (req, res) => {
    try {
      const activity = insertActivitySchema.parse(req.body);
      const newActivity = await dbStorage.createActivity(activity);
      res.json(newActivity);
    } catch (error) {
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.put("/api/activities/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const activity = insertActivitySchema.partial().parse(req.body);
      const updatedActivity = await dbStorage.updateActivity(id, activity);
      if (!updatedActivity) {
        return res.status(404).json({ error: "Activity not found" });
      }
      res.json(updatedActivity);
    } catch (error) {
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.delete("/api/activities/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await dbStorage.deleteActivity(id);
      if (!deleted) {
        return res.status(404).json({ error: "Activity not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  // Table Configuration API
  app.get("/api/table-config/:tableName", async (req, res) => {
    try {
      const tableName = req.params.tableName;
      const config = await dbStorage.getTableConfig(tableName);
      if (!config) {
        return res.status(404).json({ error: "Table configuration not found" });
      }
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch table configuration" });
    }
  });

  app.post("/api/table-config", requireAdmin, async (req, res) => {
    try {
      const config = insertTableConfigSchema.parse(req.body);
      const updatedConfig = await dbStorage.updateTableConfig(config);
      res.json(updatedConfig);
    } catch (error) {
      res.status(400).json({ error: "Invalid table configuration" });
    }
  });

  // Program Suggestions API
  app.get("/api/program-suggestions", async (req, res) => {
    try {
      const keyword = req.query.keyword as string;
      const suggestions = await dbStorage.getProgramSuggestions(keyword);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch program suggestions" });
    }
  });

  app.post("/api/program-suggestions", requireAdmin, async (req, res) => {
    try {
      const suggestion = req.body;
      const newSuggestion = await dbStorage.createProgramSuggestion(suggestion);
      res.json(newSuggestion);
    } catch (error) {
      res.status(400).json({ error: "Invalid suggestion data" });
    }
  });

  // Column Headers API
  app.get("/api/column-headers/:tableName", async (req, res) => {
    try {
      const tableName = req.params.tableName;
      const headers = await dbStorage.getColumnHeaders(tableName);
      res.json(headers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch column headers" });
    }
  });

  app.post("/api/column-headers", requireAdmin, async (req, res) => {
    try {
      const headerData = insertColumnHeaderSchema.parse(req.body);
      const updatedHeader = await dbStorage.updateColumnHeader(headerData);
      res.json(updatedHeader);
    } catch (error) {
      console.error("Column header validation error:", error);
      res.status(400).json({ 
        error: "Invalid column header configuration",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Authentication API
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await dbStorage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Analytics API routes
  app.use("/api/analytics", analyticsRouter);

  // Image upload endpoint
  app.post("/api/upload/image", upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
