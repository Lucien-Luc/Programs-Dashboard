import { type Program, type InsertProgram, type Activity, type InsertActivity, type TableConfig, type InsertTableConfig, type User, type InsertUser, type UpsertUser, type AdminSettings, type InsertAdminSettings, type ProgramSuggestion, type InsertProgramSuggestion, type ColumnHeader, type InsertColumnHeader } from "@shared/schema";

export interface IStorage {
  // Programs
  getPrograms(): Promise<Program[]>;
  getProgram(id: number): Promise<Program | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: number, program: Partial<InsertProgram>): Promise<Program | undefined>;
  deleteProgram(id: number): Promise<boolean>;

  // Activities
  getActivities(): Promise<Activity[]>;
  getActivitiesByProgram(programId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;

  // Table Configuration
  getTableConfig(tableName: string): Promise<TableConfig | undefined>;
  updateTableConfig(config: InsertTableConfig): Promise<TableConfig>;
  
  // Column Headers Management
  getColumnHeaders(tableName: string): Promise<ColumnHeader[]>;
  updateColumnHeader(config: InsertColumnHeader): Promise<ColumnHeader>;

  // Program Suggestions
  getProgramSuggestions(keyword?: string): Promise<ProgramSuggestion[]>;
  createProgramSuggestion(suggestion: InsertProgramSuggestion): Promise<ProgramSuggestion>;
  updateProgramSuggestion(id: number, suggestion: Partial<InsertProgramSuggestion>): Promise<ProgramSuggestion | undefined>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Admin Settings
  getAdminSettings(category?: string): Promise<AdminSettings[]>;
  updateAdminSetting(key: string, value: string, category: string): Promise<AdminSettings>;
}

export class MemStorage implements IStorage {
  private programs: Program[] = [];
  private activities: Activity[] = [];
  private tableConfigs: TableConfig[] = [];
  private users: User[] = [];
  private adminSettings: AdminSettings[] = [];
  private programSuggestions: ProgramSuggestion[] = [];
  private columnHeaders: ColumnHeader[] = [];
  private nextId = 1;

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Initialize with sample data
    this.programs = [
      {
        id: 1,
        name: "Community Development Initiative",
        status: "active",
        progress: 75,
        participants: 150,
        budgetAllocated: 500000,
        budgetUsed: 200000,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-12-15"),
        description: "Comprehensive community development program focusing on education and healthcare improvements.",
        color: "#4A90A4",
        icon: "bullseye",
        image: null,
        imageUrl: null,
        tags: ["education", "healthcare"],
        category: "community development",
        priority: "high",
        metadata: { coordinator: "Sarah Johnson", location: "Northern Region" },
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-06-01")
      }
    ];

    this.activities = [
      {
        id: 1,
        programId: 1,
        type: "Training Session",
        description: "Community health worker training",
        date: new Date("2024-06-15"),
        status: "completed",
        location: "Community Center A",
        participants: 25,
        coordinator: "Dr. Smith",
        notes: "Successful training session with high engagement",
        createdAt: new Date("2024-06-01"),
        updatedAt: new Date("2024-06-15")
      }
    ];

    this.users = [
      {
        id: 1,
        username: "admin",
        password: "admin123",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.adminSettings = [
      { id: 1, key: "dashboard_title", value: "BPN Program Management", category: "ui", createdAt: new Date(), updatedAt: new Date() },
      { id: 2, key: "welcome_message", value: "Good morning! Here's your program management overview.", category: "ui", createdAt: new Date(), updatedAt: new Date() },
      { id: 3, key: "default_theme", value: "default", category: "theme", createdAt: new Date(), updatedAt: new Date() },
      { id: 4, key: "show_timeline", value: "false", category: "ui", createdAt: new Date(), updatedAt: new Date() },
      { id: 5, key: "items_per_page", value: "5", category: "ui", createdAt: new Date(), updatedAt: new Date() }
    ];

    this.columnHeaders = [
      { id: 1, tableName: 'activities', columnKey: 'program', displayName: 'Program', isVisible: true, sortOrder: 0, width: '150px', alignment: 'left', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, tableName: 'activities', columnKey: 'activity_type', displayName: 'Activity Type', isVisible: true, sortOrder: 1, width: '150px', alignment: 'left', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, tableName: 'activities', columnKey: 'date', displayName: 'Date', isVisible: true, sortOrder: 2, width: '120px', alignment: 'left', createdAt: new Date(), updatedAt: new Date() },
      { id: 4, tableName: 'activities', columnKey: 'status', displayName: 'Status', isVisible: true, sortOrder: 3, width: '100px', alignment: 'center', createdAt: new Date(), updatedAt: new Date() },
      { id: 5, tableName: 'activities', columnKey: 'details', displayName: 'Details', isVisible: true, sortOrder: 4, width: '200px', alignment: 'left', createdAt: new Date(), updatedAt: new Date() },
      { id: 6, tableName: 'activities', columnKey: 'actions', displayName: 'Actions', isVisible: true, sortOrder: 5, width: '100px', alignment: 'center', createdAt: new Date(), updatedAt: new Date() }
    ];

    this.programSuggestions = [
      {
        id: 1,
        keyword: "education",
        name: "Basic Education Enhancement",
        description: "Improving literacy and numeracy skills in rural communities",
        tags: ["education", "literacy", "rural"],
        category: "education",
        priority: "high",
        defaultColor: "#4A90A4",
        defaultIcon: "bullseye",
        metadata: { sector: "education", target: "rural communities" },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.nextId = 10;
  }

  // Programs
  async getPrograms(): Promise<Program[]> {
    return [...this.programs];
  }

  async getProgram(id: number): Promise<Program | undefined> {
    return this.programs.find(p => p.id === id);
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const newProgram: Program = {
      ...program,
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.programs.push(newProgram);
    return newProgram;
  }

  async updateProgram(id: number, program: Partial<InsertProgram>): Promise<Program | undefined> {
    const index = this.programs.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    this.programs[index] = {
      ...this.programs[index],
      ...program,
      updatedAt: new Date()
    };
    return this.programs[index];
  }

  async deleteProgram(id: number): Promise<boolean> {
    const index = this.programs.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.programs.splice(index, 1);
    return true;
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return [...this.activities];
  }

  async getActivitiesByProgram(programId: number): Promise<Activity[]> {
    return this.activities.filter(a => a.programId === programId);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const newActivity: Activity = {
      ...activity,
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.activities.push(newActivity);
    return newActivity;
  }

  async updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined> {
    const index = this.activities.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    this.activities[index] = {
      ...this.activities[index],
      ...activity,
      updatedAt: new Date()
    };
    return this.activities[index];
  }

  async deleteActivity(id: number): Promise<boolean> {
    const index = this.activities.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    this.activities.splice(index, 1);
    return true;
  }

  // Table Configuration
  async getTableConfig(tableName: string): Promise<TableConfig | undefined> {
    return this.tableConfigs.find(tc => tc.tableName === tableName);
  }

  async updateTableConfig(config: InsertTableConfig): Promise<TableConfig> {
    const index = this.tableConfigs.findIndex(tc => tc.tableName === config.tableName);
    
    if (index === -1) {
      const newConfig: TableConfig = {
        ...config,
        id: this.nextId++,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.tableConfigs.push(newConfig);
      return newConfig;
    } else {
      this.tableConfigs[index] = {
        ...this.tableConfigs[index],
        ...config,
        updatedAt: new Date()
      };
      return this.tableConfigs[index];
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === parseInt(id));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingIndex = this.users.findIndex(u => u.username === userData.username);
    
    if (existingIndex === -1) {
      const newUser: User = {
        ...userData,
        id: this.nextId++,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.users.push(newUser);
      return newUser;
    } else {
      this.users[existingIndex] = {
        ...this.users[existingIndex],
        ...userData,
        updatedAt: new Date()
      };
      return this.users[existingIndex];
    }
  }

  // Admin Settings
  async getAdminSettings(category?: string): Promise<AdminSettings[]> {
    if (category) {
      return this.adminSettings.filter(s => s.category === category);
    }
    return [...this.adminSettings];
  }

  async updateAdminSetting(key: string, value: string, category: string): Promise<AdminSettings> {
    const index = this.adminSettings.findIndex(s => s.key === key);
    
    if (index === -1) {
      const newSetting: AdminSettings = {
        id: this.nextId++,
        key,
        value,
        category,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.adminSettings.push(newSetting);
      return newSetting;
    } else {
      this.adminSettings[index] = {
        ...this.adminSettings[index],
        value,
        updatedAt: new Date()
      };
      return this.adminSettings[index];
    }
  }

  // Column Headers Management
  async getColumnHeaders(tableName: string): Promise<ColumnHeader[]> {
    return this.columnHeaders.filter(ch => ch.tableName === tableName);
  }

  async updateColumnHeader(config: InsertColumnHeader): Promise<ColumnHeader> {
    const index = this.columnHeaders.findIndex(ch => 
      ch.tableName === config.tableName && ch.columnKey === config.columnKey
    );
    
    if (index === -1) {
      const newHeader: ColumnHeader = {
        ...config,
        id: this.nextId++,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.columnHeaders.push(newHeader);
      return newHeader;
    } else {
      this.columnHeaders[index] = {
        ...this.columnHeaders[index],
        ...config,
        updatedAt: new Date()
      };
      return this.columnHeaders[index];
    }
  }

  // Program Suggestions
  async getProgramSuggestions(keyword?: string): Promise<ProgramSuggestion[]> {
    if (keyword) {
      return this.programSuggestions.filter(ps => 
        ps.keyword.includes(keyword) || 
        ps.name.toLowerCase().includes(keyword.toLowerCase()) ||
        ps.tags.some(tag => tag.includes(keyword))
      );
    }
    return [...this.programSuggestions];
  }

  async createProgramSuggestion(suggestion: InsertProgramSuggestion): Promise<ProgramSuggestion> {
    const newSuggestion: ProgramSuggestion = {
      ...suggestion,
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.programSuggestions.push(newSuggestion);
    return newSuggestion;
  }

  async updateProgramSuggestion(id: number, suggestion: Partial<InsertProgramSuggestion>): Promise<ProgramSuggestion | undefined> {
    const index = this.programSuggestions.findIndex(ps => ps.id === id);
    if (index === -1) return undefined;
    
    this.programSuggestions[index] = {
      ...this.programSuggestions[index],
      ...suggestion,
      updatedAt: new Date()
    };
    return this.programSuggestions[index];
  }
}

export const storage = new MemStorage();