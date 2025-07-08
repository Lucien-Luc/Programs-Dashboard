import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // 'active', 'paused', 'completed', 'cancelled'
  progress: integer("progress").notNull().default(0), // 0-100
  participants: integer("participants").notNull().default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budgetAllocated: integer("budget_allocated").default(0),
  budgetUsed: integer("budget_used").default(0),
  color: text("color").notNull(),
  icon: text("icon"),
  image: text("image"), // program image filename/path - stored permanently
  imageUrl: text("image_url"), // external image URL
  imageData: text("image_data"), // Base64 encoded image data for database storage
  imageName: text("image_name"), // Original filename for reference
  imageType: text("image_type"), // MIME type (image/jpeg, image/png, etc.)
  tags: text("tags").array(), // for intelligent suggestions
  category: text("category"), // additional categorization
  priority: text("priority").default("medium"), // low, medium, high
  metadata: jsonb("metadata"), // flexible data storage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => programs.id),
  type: text("type").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  status: text("status").notNull(), // 'completed', 'in_progress', 'scheduled', 'pending', 'cancelled'
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tableConfig = pgTable("table_config", {
  id: serial("id").primaryKey(),
  tableName: text("table_name").notNull().unique(),
  columns: jsonb("columns").notNull(), // Array of column definitions
  data: jsonb("data").notNull(), // Array of row data
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // 'admin', 'user'
});

// Admin settings for UI/UX control
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  category: text("category").notNull(), // 'ui', 'theme', 'content', etc.
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Program suggestions and templates
export const programSuggestions = pgTable("program_suggestions", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  tags: text("tags").array(),
  category: text("category"),
  priority: text("priority").default("medium"),
  defaultColor: text("default_color"),
  defaultIcon: text("default_icon"),
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Column headers configuration - for customizing table headers in dashboard
export const columnHeaders = pgTable("column_headers", {
  id: serial("id").primaryKey(),
  tableName: text("table_name").notNull(), // 'activities', 'programs', etc.
  columnKey: text("column_key").notNull(), // 'program', 'activity_type', 'date', etc.
  displayName: text("display_name").notNull(), // What users see
  isVisible: boolean("is_visible").default(true),
  sortOrder: integer("sort_order").default(0),
  width: text("width").default("auto"), // 'auto', '150px', '20%'
  alignment: text("alignment").default("left"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Make icon optional since we're adding image support
  icon: z.string().optional(),
  // Add validation for new fields
  image: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  metadata: z.record(z.any()).optional(),
  // Handle date fields properly - accept both Date objects and ISO strings
  startDate: z.union([z.date(), z.string().datetime(), z.string().optional()]).optional(),
  endDate: z.union([z.date(), z.string().datetime(), z.string().optional()]).optional(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertTableConfigSchema = createInsertSchema(tableConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertProgramSuggestionSchema = createInsertSchema(programSuggestions).omit({
  id: true,
  createdAt: true,
});

export const insertColumnHeaderSchema = createInsertSchema(columnHeaders).omit({
  id: true,
  updatedAt: true,
});

// Firestore-compatible types (using string IDs)
export interface Program {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  participants: number;
  startDate: Date | null;
  endDate: Date | null;
  budgetAllocated: number | null;
  budgetUsed: number | null;
  color: string;
  icon: string | null;
  image: string | null;
  imageUrl: string | null;
  tags: string[] | null;
  category: string | null;
  priority: string | null;
  metadata: Record<string, any>;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Activity {
  id: string;
  programId: string | null;
  type: string;
  description: string | null;
  status: string;
  date: Date;
  details: string | null;
  createdAt: Date | null;
}

export interface TableConfig {
  id: string;
  tableName: string;
  columns: any;
  data: any;
  updatedAt: Date | null;
}

export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface AdminSettings {
  id: string;
  key: string;
  value: string;
  category: string;
  updatedAt: Date | null;
}

export interface ProgramSuggestion {
  id: string;
  keyword: string;
  name: string;
  type: string;
  description: string | null;
  tags: string[] | null;
  category: string | null;
  priority: string | null;
  defaultColor: string | null;
  defaultIcon: string | null;
  isActive: boolean | null;
  metadata: any;
  createdAt: Date | null;
}

export interface ColumnHeader {
  id: string;
  tableName: string;
  columnKey: string;
  displayName: string;
  isVisible: boolean | null;
  sortOrder: number | null;
  width: string | null;
  alignment: string | null;
  updatedAt: Date | null;
}

// Insert types (without id and timestamps)
export type InsertProgram = Omit<Program, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertActivity = Omit<Activity, 'id' | 'createdAt'>;
export type InsertTableConfig = Omit<TableConfig, 'id' | 'updatedAt'>;
export type InsertUser = Omit<User, 'createdAt' | 'updatedAt'>;
export type UpsertUser = InsertUser;
export type InsertAdminSettings = Omit<AdminSettings, 'id' | 'updatedAt'>;
export type InsertProgramSuggestion = Omit<ProgramSuggestion, 'id' | 'createdAt'>;
export type InsertColumnHeader = Omit<ColumnHeader, 'updatedAt'>;
