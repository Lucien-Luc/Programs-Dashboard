import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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
import type { IStorage } from "./storage";

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
if (!serviceAccount.project_id) {
  // If no service account, use default initialization
  initializeApp();
} else {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = getFirestore();

// Helper function to convert Firestore timestamps to Date objects
const convertTimestamps = (data: any) => {
  const converted = { ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key] && typeof converted[key] === 'object' && converted[key]._seconds) {
      converted[key] = new Date(converted[key]._seconds * 1000);
    }
  });
  return converted;
};

export class FirestoreStorage implements IStorage {
  
  // Programs
  async getPrograms(): Promise<Program[]> {
    const snapshot = await db.collection('programs').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Program));
  }

  async getProgram(id: number): Promise<Program | undefined> {
    const doc = await db.collection('programs').doc(id.toString()).get();
    if (doc.exists) {
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as Program;
    }
    return undefined;
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const docRef = await db.collection('programs').add({
      ...program,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const doc = await docRef.get();
    return {
      id: docRef.id,
      ...convertTimestamps(doc.data())
    } as Program;
  }

  async updateProgram(id: number, program: Partial<InsertProgram>): Promise<Program | undefined> {
    const docRef = db.collection('programs').doc(id.toString());
    await docRef.update({
      ...program,
      updatedAt: new Date()
    });
    const doc = await docRef.get();
    if (doc.exists) {
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as Program;
    }
    return undefined;
  }

  async deleteProgram(id: number): Promise<boolean> {
    try {
      await db.collection('programs').doc(id.toString()).delete();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    const snapshot = await db.collection('activities').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Activity));
  }

  async getActivitiesByProgram(programId: number): Promise<Activity[]> {
    const snapshot = await db.collection('activities')
      .where('programId', '==', programId.toString())
      .get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as Activity));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const docRef = await db.collection('activities').add({
      ...activity,
      createdAt: new Date()
    });
    const doc = await docRef.get();
    return {
      id: docRef.id,
      ...convertTimestamps(doc.data())
    } as Activity;
  }

  async updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined> {
    const docRef = db.collection('activities').doc(id.toString());
    await docRef.update(activity);
    const doc = await docRef.get();
    if (doc.exists) {
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as Activity;
    }
    return undefined;
  }

  async deleteActivity(id: number): Promise<boolean> {
    try {
      await db.collection('activities').doc(id.toString()).delete();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Table Configuration
  async getTableConfig(tableName: string): Promise<TableConfig | undefined> {
    const snapshot = await db.collection('tableConfig')
      .where('tableName', '==', tableName)
      .get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as TableConfig;
    }
    return undefined;
  }

  async updateTableConfig(config: InsertTableConfig): Promise<TableConfig> {
    const existing = await this.getTableConfig(config.tableName);
    
    if (existing) {
      const docRef = db.collection('tableConfig').doc(existing.id);
      await docRef.update({
        ...config,
        updatedAt: new Date()
      });
      const doc = await docRef.get();
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as TableConfig;
    } else {
      const docRef = await db.collection('tableConfig').add(config);
      const doc = await docRef.get();
      return {
        id: docRef.id,
        ...convertTimestamps(doc.data())
      } as TableConfig;
    }
  }

  // Column Headers
  async getColumnHeaders(tableName: string): Promise<ColumnHeader[]> {
    const snapshot = await db.collection('columnHeaders')
      .where('tableName', '==', tableName)
      .get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as ColumnHeader));
  }

  async updateColumnHeader(config: InsertColumnHeader): Promise<ColumnHeader> {
    if (config.id) {
      const docRef = db.collection('columnHeaders').doc(config.id);
      await docRef.update({
        ...config,
        updatedAt: new Date()
      });
      const doc = await docRef.get();
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as ColumnHeader;
    } else {
      const docRef = await db.collection('columnHeaders').add(config);
      const doc = await docRef.get();
      return {
        id: docRef.id,
        ...convertTimestamps(doc.data())
      } as ColumnHeader;
    }
  }

  // Program Suggestions
  async getProgramSuggestions(keyword?: string): Promise<ProgramSuggestion[]> {
    let query = db.collection('programSuggestions');
    
    if (keyword) {
      // Simple keyword filtering - in production, consider using Algolia or similar
      query = query.where('keyword', '>=', keyword.toLowerCase());
    }
    
    const snapshot = await query.get();
    let suggestions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as ProgramSuggestion));
    
    // Client-side filtering for better keyword matching
    if (keyword) {
      suggestions = suggestions.filter(s => 
        s.keyword.toLowerCase().includes(keyword.toLowerCase()) ||
        s.name.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    
    return suggestions;
  }

  async createProgramSuggestion(suggestion: InsertProgramSuggestion): Promise<ProgramSuggestion> {
    const docRef = await db.collection('programSuggestions').add({
      ...suggestion,
      createdAt: new Date()
    });
    const doc = await docRef.get();
    return {
      id: docRef.id,
      ...convertTimestamps(doc.data())
    } as ProgramSuggestion;
  }

  async updateProgramSuggestion(id: number, suggestion: Partial<InsertProgramSuggestion>): Promise<ProgramSuggestion | undefined> {
    const docRef = db.collection('programSuggestions').doc(id.toString());
    await docRef.update(suggestion);
    const doc = await docRef.get();
    if (doc.exists) {
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as ProgramSuggestion;
    }
    return undefined;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const doc = await db.collection('users').doc(id).get();
    if (doc.exists) {
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as User;
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await db.collection('users')
      .where('username', '==', username)
      .get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as User;
    }
    return undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const docRef = db.collection('users').doc(userData.id);
    await docRef.set({
      ...userData,
      updatedAt: new Date()
    }, { merge: true });
    const doc = await docRef.get();
    return {
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as User;
  }

  // Admin Settings
  async getAdminSettings(category?: string): Promise<AdminSettings[]> {
    let query = db.collection('adminSettings');
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as AdminSettings));
  }

  async updateAdminSetting(key: string, value: string, category: string): Promise<AdminSettings> {
    const snapshot = await db.collection('adminSettings')
      .where('key', '==', key)
      .get();
    
    if (!snapshot.empty) {
      const docRef = db.collection('adminSettings').doc(snapshot.docs[0].id);
      await docRef.update({
        value,
        category,
        updatedAt: new Date()
      });
      const doc = await docRef.get();
      return {
        id: doc.id,
        ...convertTimestamps(doc.data())
      } as AdminSettings;
    } else {
      const docRef = await db.collection('adminSettings').add({
        key,
        value,
        category
      });
      const doc = await docRef.get();
      return {
        id: docRef.id,
        ...convertTimestamps(doc.data())
      } as AdminSettings;
    }
  }
}