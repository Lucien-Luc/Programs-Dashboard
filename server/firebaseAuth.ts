import bcrypt from 'bcryptjs';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'admin';
  createdAt: Date;
  lastLogin?: Date;
}

export class AdminAuthService {
  static async createAdmin(email: string, password: string, username: string): Promise<AdminUser> {
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);
      const adminId = `admin_${Date.now()}`;

      // Create admin data
      const adminData = {
        id: adminId,
        email,
        username,
        role: 'admin' as const,
        hashedPassword,
        createdAt: new Date(),
      };

      // This will be handled by the client-side Firestore service
      // For now, we'll use a simple storage mechanism
      global.adminUser = adminData;

      // Return user data without password
      const { hashedPassword: _, ...userWithoutPassword } = adminData;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }

  static async validateAdmin(email: string, password: string): Promise<AdminUser | null> {
    try {
      const adminData = global.adminUser;
      if (!adminData || adminData.email !== email) {
        return null;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, adminData.hashedPassword);
      if (!isPasswordValid) {
        return null;
      }

      // Update last login
      adminData.lastLogin = new Date();

      // Return user data without password
      const { hashedPassword: _, ...userWithoutPassword } = adminData;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error validating admin:', error);
      return null;
    }
  }

  static async getAdminById(id: string): Promise<AdminUser | null> {
    try {
      const adminData = global.adminUser;
      if (!adminData || adminData.id !== id) {
        return null;
      }

      const { hashedPassword: _, ...userWithoutPassword } = adminData;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error getting admin:', error);
      return null;
    }
  }

  static async hasAdminUser(): Promise<boolean> {
    try {
      return !!global.adminUser;
    } catch (error) {
      console.error('Error checking admin existence:', error);
      return false;
    }
  }
}