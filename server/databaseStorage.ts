import {
  users,
  sessions,
  programs,
  activities,
  tableConfig,
  adminSettings,
  programSuggestions,
  columnHeaders,
  type User,
  type UpsertUser,
  type Program,
  type InsertProgram,
  type Activity,
  type InsertActivity,
  type TableConfig,
  type InsertTableConfig,
  type AdminSettings,
  type InsertAdminSettings,
  type ProgramSuggestion,
  type InsertProgramSuggestion,
  type ColumnHeader,
  type InsertColumnHeader,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Programs
  async getPrograms(): Promise<Program[]> {
    return await db.select().from(programs);
  }

  async getProgram(id: number): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    return program;
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const [newProgram] = await db
      .insert(programs)
      .values({
        ...program,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newProgram;
  }

  async updateProgram(id: number, program: Partial<InsertProgram>): Promise<Program | undefined> {
    const [updatedProgram] = await db
      .update(programs)
      .set({
        ...program,
        updatedAt: new Date(),
      })
      .where(eq(programs.id, id))
      .returning();
    return updatedProgram;
  }

  async deleteProgram(id: number): Promise<boolean> {
    const result = await db.delete(programs).where(eq(programs.id, id));
    return result.rowCount > 0;
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities);
  }

  async getActivitiesByProgram(programId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.programId, programId));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values({
        ...activity,
        createdAt: new Date(),
      })
      .returning();
    return newActivity;
  }

  async updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [updatedActivity] = await db
      .update(activities)
      .set(activity)
      .where(eq(activities.id, id))
      .returning();
    return updatedActivity;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return result.rowCount > 0;
  }

  // Table Configuration
  async getTableConfig(tableName: string): Promise<TableConfig | undefined> {
    const [config] = await db.select().from(tableConfig).where(eq(tableConfig.tableName, tableName));
    return config;
  }

  async updateTableConfig(config: InsertTableConfig): Promise<TableConfig> {
    const [existingConfig] = await db.select().from(tableConfig).where(eq(tableConfig.tableName, config.tableName));
    
    if (existingConfig) {
      const [updatedConfig] = await db
        .update(tableConfig)
        .set({
          ...config,
          updatedAt: new Date(),
        })
        .where(eq(tableConfig.tableName, config.tableName))
        .returning();
      return updatedConfig;
    } else {
      const [newConfig] = await db
        .insert(tableConfig)
        .values(config)
        .returning();
      return newConfig;
    }
  }

  // Column Headers Management
  async getColumnHeaders(tableName: string): Promise<ColumnHeader[]> {
    return await db.select().from(columnHeaders).where(eq(columnHeaders.tableName, tableName));
  }

  async updateColumnHeader(config: InsertColumnHeader): Promise<ColumnHeader> {
    if (config.id) {
      const [updatedHeader] = await db
        .update(columnHeaders)
        .set({
          ...config,
          updatedAt: new Date(),
        })
        .where(eq(columnHeaders.id, config.id))
        .returning();
      return updatedHeader;
    } else {
      const [newHeader] = await db
        .insert(columnHeaders)
        .values(config)
        .returning();
      return newHeader;
    }
  }

  // Program Suggestions
  async getProgramSuggestions(keyword?: string): Promise<ProgramSuggestion[]> {
    if (keyword) {
      // Simple keyword filter for now
      const allSuggestions = await db.select().from(programSuggestions);
      return allSuggestions.filter(s => 
        s.keyword.toLowerCase().includes(keyword.toLowerCase()) ||
        s.name.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    return await db.select().from(programSuggestions);
  }

  async createProgramSuggestion(suggestion: InsertProgramSuggestion): Promise<ProgramSuggestion> {
    const [newSuggestion] = await db
      .insert(programSuggestions)
      .values({
        ...suggestion,
        createdAt: new Date(),
      })
      .returning();
    return newSuggestion;
  }

  async updateProgramSuggestion(id: number, suggestion: Partial<InsertProgramSuggestion>): Promise<ProgramSuggestion | undefined> {
    const [updatedSuggestion] = await db
      .update(programSuggestions)
      .set(suggestion)
      .where(eq(programSuggestions.id, id))
      .returning();
    return updatedSuggestion;
  }

  // Users (Required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // For basic auth compatibility
    return undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Admin Settings
  async getAdminSettings(category?: string): Promise<AdminSettings[]> {
    if (category) {
      return await db.select().from(adminSettings).where(eq(adminSettings.category, category));
    }
    return await db.select().from(adminSettings);
  }

  async updateAdminSetting(key: string, value: string, category: string): Promise<AdminSettings> {
    const [existingSetting] = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    
    if (existingSetting) {
      const [updatedSetting] = await db
        .update(adminSettings)
        .set({
          value,
          category,
          updatedAt: new Date(),
        })
        .where(eq(adminSettings.key, key))
        .returning();
      return updatedSetting;
    } else {
      const [newSetting] = await db
        .insert(adminSettings)
        .values({
          key,
          value,
          category,
        })
        .returning();
      return newSetting;
    }
  }
}