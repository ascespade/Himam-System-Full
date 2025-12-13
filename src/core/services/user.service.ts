/**
 * User Service
 * Business logic for user management
 */

import { BaseService, ServiceException } from './base.service'
import { supabaseAdmin } from '@/lib'
import { logError } from '@/shared/utils/logger'
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from '@/core/validations/schemas'
import type { User } from '@/shared/types'

export class UserService extends BaseService {
  /**
   * Creates a new user (both auth and database record)
   */
  async createUser(input: CreateUserInput): Promise<User> {
    // Validate input
    const validated = createUserSchema.parse(input)
    const { name, email, phone, role, password } = validated

    // Check if user exists in auth.users
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
    const authUserExists = existingAuthUser?.users?.some((u: { email?: string }) => u.email === email)

    if (authUserExists) {
      throw new ServiceException('User with this email already exists', 'USER_EXISTS')
    }

    // Check if user exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw new ServiceException('User with this email already exists', 'USER_EXISTS')
    }

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone,
        role
      }
    })

    if (authError || !authUser?.user?.id) {
      logError('Failed to create authentication user', authError, { email })
      throw new ServiceException(
        `Failed to create authentication user: ${authError?.message || 'No user ID returned'}`,
        'AUTH_ERROR'
      )
    }

    // Wait for trigger to create public.users entry
    await new Promise(resolve => setTimeout(resolve, 500))

    // Update the public.users record
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        name,
        phone,
        role,
        email
      })
      .eq('id', authUser.user.id)
      .select()
      .single()

    if (updateError) {
      // Try to insert directly if update fails
      const { data: insertedUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id,
          name,
          email,
          phone,
          role,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        // Clean up auth user
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        logError('Error creating user record', insertError, { userId: authUser.user.id })
        throw new ServiceException('Failed to create user record', 'USER_CREATE_ERROR')
      }

      if (!insertedUser) {
        throw new ServiceException('Failed to create user record', 'USER_CREATE_ERROR')
      }

      return insertedUser as User
    }

    if (!updatedUser) {
      throw new ServiceException('Failed to update user record', 'USER_UPDATE_ERROR')
    }

    return updatedUser as User
  }

  /**
   * Updates a user
   */
  async updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    const validated = updateUserSchema.parse(input)

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(validated)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      logError('Error updating user', error, { userId, input: validated })
      throw new ServiceException('Failed to update user', 'USER_UPDATE_ERROR')
    }

    if (!user) {
      throw new ServiceException('User not found', 'NOT_FOUND')
    }

    return user as User
  }

  /**
   * Finds a user by ID
   */
  async findById(userId: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      logError('Error finding user by ID', error, { userId })
      throw new ServiceException('Failed to find user', 'USER_FETCH_ERROR')
    }

    return data
  }

  /**
   * Finds users by role
   */
  async findByRole(role: string, page = 1, limit = 50): Promise<{ data: User[]; total: number }> {
    const offset = (page - 1) * limit

    const { data, error, count } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })
      .eq('role', role)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logError('Error finding users by role', error, { role, page, limit })
      throw new ServiceException('Failed to find users by role', 'USER_FETCH_ERROR')
    }

    return {
      data: data || [],
      total: count || 0,
    }
  }
}

// Export singleton instance
export const userService = new UserService()
