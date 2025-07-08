import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";
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
  InsertColumnHeader
} from "@shared/schema";

// Helper function to convert Firestore timestamps to Date objects
const convertTimestamps = (data: any) => {
  const converted = { ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  return converted;
};

// Programs
export const getPrograms = async (): Promise<Program[]> => {
  const querySnapshot = await getDocs(collection(db, "programs"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  } as Program));
};

export const getProgram = async (id: string): Promise<Program | undefined> => {
  const docRef = doc(db, "programs", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data())
    } as Program;
  }
  return undefined;
};

export const createProgram = async (program: InsertProgram): Promise<Program> => {
  const docRef = await addDoc(collection(db, "programs"), {
    ...program,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  const docSnap = await getDoc(docRef);
  return {
    id: docRef.id,
    ...convertTimestamps(docSnap.data())
  } as Program;
};

export const updateProgram = async (id: string, program: Partial<InsertProgram>): Promise<Program | undefined> => {
  const docRef = doc(db, "programs", id);
  await updateDoc(docRef, {
    ...program,
    updatedAt: serverTimestamp()
  });
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data())
    } as Program;
  }
  return undefined;
};

export const deleteProgram = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "programs", id));
    return true;
  } catch (error) {
    return false;
  }
};

// Activities
export const getActivities = async (): Promise<Activity[]> => {
  const querySnapshot = await getDocs(collection(db, "activities"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  } as Activity));
};

export const getActivitiesByProgram = async (programId: string): Promise<Activity[]> => {
  const q = query(collection(db, "activities"), where("programId", "==", programId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  } as Activity));
};

export const createActivity = async (activity: InsertActivity): Promise<Activity> => {
  const docRef = await addDoc(collection(db, "activities"), {
    ...activity,
    createdAt: serverTimestamp()
  });
  const docSnap = await getDoc(docRef);
  return {
    id: docRef.id,
    ...convertTimestamps(docSnap.data())
  } as Activity;
};

export const updateActivity = async (id: string, activity: Partial<InsertActivity>): Promise<Activity | undefined> => {
  const docRef = doc(db, "activities", id);
  await updateDoc(docRef, activity);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data())
    } as Activity;
  }
  return undefined;
};

export const deleteActivity = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "activities", id));
    return true;
  } catch (error) {
    return false;
  }
};

// Table Configuration
export const getTableConfig = async (tableName: string): Promise<TableConfig | undefined> => {
  const q = query(collection(db, "tableConfig"), where("tableName", "==", tableName));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...convertTimestamps(doc.data())
    } as TableConfig;
  }
  return undefined;
};

export const updateTableConfig = async (config: InsertTableConfig): Promise<TableConfig> => {
  const existing = await getTableConfig(config.tableName);
  
  if (existing) {
    const docRef = doc(db, "tableConfig", existing.id);
    await updateDoc(docRef, {
      ...config,
      updatedAt: serverTimestamp()
    });
    const docSnap = await getDoc(docRef);
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data())
    } as TableConfig;
  } else {
    const docRef = await addDoc(collection(db, "tableConfig"), config);
    const docSnap = await getDoc(docRef);
    return {
      id: docRef.id,
      ...convertTimestamps(docSnap.data())
    } as TableConfig;
  }
};

// Column Headers
export const getColumnHeaders = async (tableName: string): Promise<ColumnHeader[]> => {
  const q = query(collection(db, "columnHeaders"), where("tableName", "==", tableName));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  } as ColumnHeader));
};

export const updateColumnHeader = async (config: InsertColumnHeader): Promise<ColumnHeader> => {
  if (config.id) {
    const docRef = doc(db, "columnHeaders", config.id);
    await updateDoc(docRef, {
      ...config,
      updatedAt: serverTimestamp()
    });
    const docSnap = await getDoc(docRef);
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data())
    } as ColumnHeader;
  } else {
    const docRef = await addDoc(collection(db, "columnHeaders"), config);
    const docSnap = await getDoc(docRef);
    return {
      id: docRef.id,
      ...convertTimestamps(docSnap.data())
    } as ColumnHeader;
  }
};

// Program Suggestions
export const getProgramSuggestions = async (keyword?: string): Promise<ProgramSuggestion[]> => {
  let q = query(collection(db, "programSuggestions"));
  
  if (keyword) {
    // Note: For production, consider using Algolia or similar for better text search
    q = query(collection(db, "programSuggestions"), where("keyword", ">=", keyword.toLowerCase()));
  }
  
  const querySnapshot = await getDocs(q);
  let suggestions = querySnapshot.docs.map(doc => ({
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
};

export const createProgramSuggestion = async (suggestion: InsertProgramSuggestion): Promise<ProgramSuggestion> => {
  const docRef = await addDoc(collection(db, "programSuggestions"), {
    ...suggestion,
    createdAt: serverTimestamp()
  });
  const docSnap = await getDoc(docRef);
  return {
    id: docRef.id,
    ...convertTimestamps(docSnap.data())
  } as ProgramSuggestion;
};

export const updateProgramSuggestion = async (id: string, suggestion: Partial<InsertProgramSuggestion>): Promise<ProgramSuggestion | undefined> => {
  const docRef = doc(db, "programSuggestions", id);
  await updateDoc(docRef, suggestion);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data())
    } as ProgramSuggestion;
  }
  return undefined;
};

// Admin Settings
export const getAdminSettings = async (category?: string): Promise<AdminSettings[]> => {
  let q = query(collection(db, "adminSettings"));
  
  if (category) {
    q = query(collection(db, "adminSettings"), where("category", "==", category));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  } as AdminSettings));
};

export const updateAdminSetting = async (key: string, value: string, category: string): Promise<AdminSettings> => {
  const q = query(collection(db, "adminSettings"), where("key", "==", key));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const docRef = doc(db, "adminSettings", querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      value,
      category,
      updatedAt: serverTimestamp()
    });
    const docSnap = await getDoc(docRef);
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data())
    } as AdminSettings;
  } else {
    const docRef = await addDoc(collection(db, "adminSettings"), {
      key,
      value,
      category
    });
    const docSnap = await getDoc(docRef);
    return {
      id: docRef.id,
      ...convertTimestamps(docSnap.data())
    } as AdminSettings;
  }
};