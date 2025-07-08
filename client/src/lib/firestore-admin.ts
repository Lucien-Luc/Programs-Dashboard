import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'admin';
  createdAt: Date;
  lastLogin?: Date;
}

export interface AdminUserDocument extends Omit<AdminUser, 'createdAt' | 'lastLogin'> {
  hashedPassword: string;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
}

export class FirestoreAdminService {
  private static readonly ADMIN_COLLECTION = 'admin_users';

  static async hasAdminUser(): Promise<boolean> {
    try {
      const adminCollection = collection(db, this.ADMIN_COLLECTION);
      const querySnapshot = await getDocs(adminCollection);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking admin existence:', error);
      return false;
    }
  }

  static async createAdmin(adminData: AdminUserDocument): Promise<AdminUser> {
    try {
      // Check if any admin already exists
      const adminCollection = collection(db, this.ADMIN_COLLECTION);
      const existingAdmins = await getDocs(adminCollection);
      
      if (!existingAdmins.empty) {
        throw new Error('Admin user already exists. Only one admin is allowed.');
      }

      // Store admin data in Firestore
      await setDoc(doc(db, this.ADMIN_COLLECTION, adminData.id), adminData);
      
      // Return user data without password and convert timestamps
      const { hashedPassword, createdAt, lastLogin, ...userWithoutPassword } = adminData;
      return {
        ...userWithoutPassword,
        createdAt: createdAt.toDate(),
        lastLogin: lastLogin?.toDate()
      };
    } catch (error) {
      console.error('Error creating admin in Firestore:', error);
      throw error;
    }
  }

  static async validateAdmin(email: string): Promise<AdminUserDocument | null> {
    try {
      const adminCollection = collection(db, this.ADMIN_COLLECTION);
      const adminQuery = query(adminCollection, where('email', '==', email));
      const querySnapshot = await getDocs(adminQuery);

      if (querySnapshot.empty) {
        return null;
      }

      const adminDoc = querySnapshot.docs[0];
      return adminDoc.data() as AdminUserDocument;
    } catch (error) {
      console.error('Error validating admin:', error);
      return null;
    }
  }

  static async updateLastLogin(adminId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.ADMIN_COLLECTION, adminId), {
        lastLogin: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  static async getAdminById(id: string): Promise<AdminUser | null> {
    try {
      const adminDoc = await getDoc(doc(db, this.ADMIN_COLLECTION, id));
      if (!adminDoc.exists()) {
        return null;
      }
      
      const adminData = adminDoc.data() as AdminUserDocument;
      const { hashedPassword, createdAt, lastLogin, ...userWithoutPassword } = adminData;
      return {
        ...userWithoutPassword,
        createdAt: createdAt.toDate(),
        lastLogin: lastLogin?.toDate()
      };
    } catch (error) {
      console.error('Error getting admin:', error);
      return null;
    }
  }
}