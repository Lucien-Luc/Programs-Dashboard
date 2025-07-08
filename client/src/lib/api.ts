// Client-side API functions that directly use Firestore
import type { Program, InsertProgram, Activity, InsertActivity } from "@shared/schema";
import {
  getPrograms as getFirestorePrograms,
  getProgram as getFirestoreProgram,
  createProgram as createFirestoreProgram,
  updateProgram as updateFirestoreProgram,
  deleteProgram as deleteFirestoreProgram,
  getActivities as getFirestoreActivities,
  getActivitiesByProgram as getFirestoreActivitiesByProgram,
  createActivity as createFirestoreActivity,
} from "./firestore";

// Programs
export const apiRequest = async (url: string, options?: RequestInit) => {
  // For Firestore integration, bypass server API and use Firestore directly
  if (url.startsWith("/api/programs")) {
    if (options?.method === "POST") {
      const program = JSON.parse(options.body as string);
      return await createFirestoreProgram(program);
    }
    if (options?.method === "PUT") {
      const programId = url.split("/")[3];
      const program = JSON.parse(options.body as string);
      return await updateFirestoreProgram(programId, program);
    }
    if (options?.method === "DELETE") {
      const programId = url.split("/")[3];
      return await deleteFirestoreProgram(programId);
    }
    return await getFirestorePrograms();
  }
  
  if (url.startsWith("/api/activities")) {
    if (options?.method === "POST") {
      const activity = JSON.parse(options.body as string);
      return await createFirestoreActivity(activity);
    }
    return await getFirestoreActivities();
  }
  
  // Handle additional Firestore endpoints
  if (url.startsWith("/api/column-headers")) {
    const { getColumnHeaders, updateColumnHeader } = await import("./firestore");
    if (options?.method === "POST") {
      const config = JSON.parse(options.body as string);
      return await updateColumnHeader(config);
    }
    const tableName = url.split("/")[3];
    return await getColumnHeaders(tableName);
  }

  if (url.startsWith("/api/table-config")) {
    const { getTableConfig, updateTableConfig } = await import("./firestore");
    if (options?.method === "POST") {
      const config = JSON.parse(options.body as string);
      return await updateTableConfig(config);
    }
    const tableName = url.split("/")[3];
    return await getTableConfig(tableName);
  }

  if (url.startsWith("/api/program-suggestions")) {
    const { getProgramSuggestions, createProgramSuggestion, updateProgramSuggestion } = await import("./firestore");
    if (options?.method === "POST") {
      const suggestion = JSON.parse(options.body as string);
      return await createProgramSuggestion(suggestion);
    }
    if (options?.method === "PUT") {
      const suggestionId = url.split("/")[3];
      const suggestion = JSON.parse(options.body as string);
      return await updateProgramSuggestion(suggestionId, suggestion);
    }
    const urlParams = new URLSearchParams(url.split("?")[1]);
    const keyword = urlParams.get("keyword") || undefined;
    return await getProgramSuggestions(keyword);
  }

  if (url.startsWith("/api/admin-settings")) {
    const { getAdminSettings, updateAdminSetting } = await import("./firestore");
    if (options?.method === "POST") {
      const { key, value, category } = JSON.parse(options.body as string);
      return await updateAdminSetting(key, value, category);
    }
    const urlParams = new URLSearchParams(url.split("?")[1]);
    const category = urlParams.get("category") || undefined;
    return await getAdminSettings(category);
  }
  
  // Fallback to regular fetch for other endpoints (like image uploads)
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
};

// Override the programs API to use Firestore
export const programsApi = {
  getAll: () => getFirestorePrograms(),
  getById: (id: string) => getFirestoreProgram(id),
  create: (program: InsertProgram) => createFirestoreProgram(program),
  update: (id: string, program: Partial<InsertProgram>) => updateFirestoreProgram(id, program),
  delete: (id: string) => deleteFirestoreProgram(id),
};

export const activitiesApi = {
  getAll: () => getFirestoreActivities(),
  getByProgram: (programId: string) => getFirestoreActivitiesByProgram(programId),
  create: (activity: InsertActivity) => createFirestoreActivity(activity),
};