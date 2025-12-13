/**
 * User Service
 * Business logic for user management
 */

import { BaseService, ServiceException } from './base.service'
import { supabaseAdmin } from '@/lib'
import { logError } from '@/shared/utils/logger'
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from '@/core/validations/schemas'
import type { User } from '@/shared/types'
import { userRepository } from '@/infrastructure/supabase/repositories/user.repository'

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

    // Check if user exists in public.users using repository
    const existingUser = await userRepository.existsByEmail(email)

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

    try {
      // Try to update the public.users record (created by trigger)
      const updatedUser = await userRepository.update(authUser.user.id, {
        name,
        phone: phone || null,
        role,
        email,
      })

      return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        role: updatedUser.role,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at || undefined,
      } as User
    } catch (error) {
      // Try to insert directly if update fails (trigger might not have fired)
      try {
        const insertedUser = await userRepository.create({
          id: authUser.user.id,
          name,
          email,
          phone: phone || null,
          role,
        })

        return {
          id: insertedUser.id,
          name: insertedUser.name,
          email: insertedUser.email,
          phone: insertedUser.phone || '',
          role: insertedUser.role,
          created_at: insertedUser.created_at,
          updated_at: insertedUser.updated_at || undefined,
        } as User
      } catch (insertError) {
        // Clean up auth user
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        logError('Error creating user record', insertError, { userId: authUser.user.id })
        throw new ServiceException('Failed to create user record', 'USER_CREATE_ERROR')
      }
    }
  }

  /**
   * Updates a user
   */
  async updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    const validated = updateUserSchema.parse(input)

    try {
      const repoInput: {
        name?: string
        email?: string
        phone?: string | null
        role?: User['role']
      } = {}

      if (validated.name !== undefined) repoInput.name = validated.name
      if (validated.email !== undefined) repoInput.email = validated.email
      if (validated.phone !== undefined) repoInput.phone = validated.phone || null
      if (validated.role !== undefined) repoInput.role = validated.role

      const updatedUser = await userRepository.update(userId, repoInput)

      return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        role: updatedUser.role,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at || undefined,
      } as User
    } catch (error) {
      logError('Error updating user', error, { userId, input: validated })
      throw new ServiceException('Failed to update user', 'USER_UPDATE_ERROR')
    }
  }

  /**
   * Finds a user by ID
   */
  async findById(userId: string): Promise<User | null> {
    try {
      const repoUser = await userRepository.findById(userId)
      if (!repoUser) return null

      return {
        id: repoUser.id,
        name: repoUser.name,
        email: repoUser.email,
        phone: repoUser.phone || '',
        role: repoUser.role,
        created_at: repoUser.created_at,
        updated_at: repoUser.updated_at || undefined,
      } as User
    } catch (error) {
      logError('Error finding user by ID', error, { userId })
      throw new ServiceException('Failed to find user', 'USER_FETCH_ERROR')
    }
  }

  /**
   * Finds users by role
   */
  async findByRole(role: string, page = 1, limit = 50): Promise<{ data: User[]; total: number }> {
    try {
      const offset = (page - 1) * limit
      const result = await userRepository.search({
        role: role as User['role'],
        limit,
        offset,
      })

      const users: User[] = result.users.map((repoUser) => ({
        id: repoUser.id,
        name: repoUser.name,
        email: repoUser.email,
        phone: repoUser.phone || '',
        role: repoUser.role,
        created_at: repoUser.created_at,
        updated_at: repoUser.updated_at || undefined,
      } as User))

      return {
        data: users,
        total: result.total,
      }
    } catch (error) {
      logError('Error finding users by role', error, { role, page, limit })
      throw new ServiceException('Failed to find users by role', 'USER_FETCH_ERROR')
    }
  }
}

// Export singleton instance
export const userService = new UserService()
