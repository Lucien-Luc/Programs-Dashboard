import type { IStorage } from "../../../server/storage";
import {
  getPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  getActivities,
  getActivitiesByProgram,
  createActivity,
  updateActivity,
  deleteActivity,
  getTableConfig,
  updateTableConfig,
  getColumnHeaders,
  updateColumnHeader,
  getProgramSuggestions,
  createProgramSuggestion,
  updateProgramSuggestion,
  getAdminSettings,
  updateAdminSetting
} from "./firestore";
import type { 
  Program, 
  InsertProgram, 
  Activity, 
  InsertActivity,
  TableConfig,
  InsertTableConfig,
  AdminSettings,
  InsertAdminSettings,
  ProgramSuggestion,
  InsertProgramSuggestion,
  ColumnHeader,
  InsertColumnHeader,
  User,
  UpsertUser
} from "@shared/schema";

export class FirestoreStorage implements IStorage {
  // Programs
  async getPrograms(): Promise<Program[]> {
    return await getPrograms();
  }

  async getProgram(id: number): Promise<Program | undefined> {
    return await getProgram(id.toString());
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    return await createProgram(program);
  }

  async updateProgram(id: number, program: Partial<InsertProgram>): Promise<Program | undefined> {
    return await updateProgram(id.toString(), program);
  }

  async deleteProgram(id: number): Promise<boolean> {
    return await deleteProgram(id.toString());
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return await getActivities();
  }

  async getActivitiesByProgram(programId: number): Promise<Activity[]> {
    return await getActivitiesByProgram(programId.toString());
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    return await createActivity(activity);
  }

  async updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined> {
    return await updateActivity(id.toString(), activity);
  }

  async deleteActivity(id: number): Promise<boolean> {
    return await deleteActivity(id.toString());
  }

  // Table Configuration
  async getTableConfig(tableName: string): Promise<TableConfig | undefined> {
    return await getTableConfig(tableName);
  }

  async updateTableConfig(config: InsertTableConfig): Promise<TableConfig> {
    return await updateTableConfig(config);
  }

  // Column Headers
  async getColumnHeaders(tableName: string): Promise<ColumnHeader[]> {
    return await getColumnHeaders(tableName);
  }

  async updateColumnHeader(config: InsertColumnHeader): Promise<ColumnHeader> {
    return await updateColumnHeader(config);
  }

  // Program Suggestions
  async getProgramSuggestions(keyword?: string): Promise<ProgramSuggestion[]> {
    return await getProgramSuggestions(keyword);
  }

  async createProgramSuggestion(suggestion: InsertProgramSuggestion): Promise<ProgramSuggestion> {
    return await createProgramSuggestion(suggestion);
  }

  async updateProgramSuggestion(id: number, suggestion: Partial<InsertProgramSuggestion>): Promise<ProgramSuggestion | undefined> {
    return await updateProgramSuggestion(id.toString(), suggestion);
  }

  // Users (for compatibility - using simple admin auth for now)
  async getUser(id: string): Promise<User | undefined> {
    // Simple admin user for now
    if (id === "admin") {
      return {
        id: "admin",
        email: "admin@programs-tracker.com",
        firstName: "Admin",
        lastName: "User",
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // For now, return the admin user
    return {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Admin Settings
  async getAdminSettings(category?: string): Promise<AdminSettings[]> {
    return await getAdminSettings(category);
  }

  async updateAdminSetting(key: string, value: string, category: string): Promise<AdminSettings> {
    return await updateAdminSetting(key, value, category);
  }
}