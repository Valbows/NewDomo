/**
 * User Service Implementation
 * 
 * Handles user management operations including user creation,
 * retrieval, updates, and deletion using Supabase admin API.
 */

import { supabase } from '@/lib/supabase';
import { getErrorMessage, logError } from '@/lib/errors';
import type { 
  IUserService, 
  User, 
  UserCreationResult
} from './types';

export class UserService implements IUserService {
  private getSupabase() {
    return supabase;
  }

  /**
   * Create a test user for development and testing purposes
   * @returns Promise resolving to user creation result
   */
  async createTestUser(): Promise<UserCreationResult> {
    try {
      const supabase = this.getSupabase();
      // Create the test user using Supabase's admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'password123',
        email_confirm: true,
      });

      if (error) {
        logError(error, 'Error creating test user');
        return {
          success: false,
          error: getErrorMessage(error)
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Test user creation failed - no user returned'
        };
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        isAuthenticated: false, // Test user is created but not signed in
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at
      };

      return {
        success: true,
        user
      };

    } catch (error: unknown) {
      logError(error, 'Test user creation service error');
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Get a user by their ID
   * @param id - User ID to retrieve
   * @returns Promise resolving to user retrieval result
   */
  async getUserById(id: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase.auth.admin.getUserById(id);

      if (error) {
        logError(error, `Error retrieving user ${id}`);
        return {
          success: false,
          error: getErrorMessage(error)
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        isAuthenticated: false, // We can't determine auth state from admin API
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at
      };

      return {
        success: true,
        user
      };

    } catch (error: unknown) {
      logError(error, `Get user by ID service error: ${id}`);
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Update a user's information
   * @param id - User ID to update
   * @param updates - Partial user data to update
   * @returns Promise resolving to user update result
   */
  async updateUser(id: string, updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Prepare update data for Supabase admin API
      const updateData: any = {};
      
      if (updates.email) {
        updateData.email = updates.email;
      }

      // Note: isAuthenticated is not a field we can update via admin API
      // It's determined by session state

      const supabase = this.getSupabase();
      const { data, error } = await supabase.auth.admin.updateUserById(id, updateData);

      if (error) {
        logError(error, `Error updating user ${id}`);
        return {
          success: false,
          error: getErrorMessage(error)
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'User update failed - no user returned'
        };
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        isAuthenticated: false, // We can't determine auth state from admin API
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at
      };

      return {
        success: true,
        user
      };

    } catch (error: unknown) {
      logError(error, `Update user service error: ${id}`);
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Delete a user by their ID
   * @param id - User ID to delete
   * @returns Promise resolving to deletion result
   */
  async deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = this.getSupabase();
      const { error } = await supabase.auth.admin.deleteUser(id);

      if (error) {
        logError(error, `Error deleting user ${id}`);
        return {
          success: false,
          error: getErrorMessage(error)
        };
      }

      return { success: true };

    } catch (error: unknown) {
      logError(error, `Delete user service error: ${id}`);
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }
}

// Export singleton instance
export const userService = new UserService();