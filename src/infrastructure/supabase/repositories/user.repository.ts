/**
 * User Repository Implementation
 * Supabase-based implementation of user data access operations
 */

import { supabaseAdmin } from '@/lib'
import type {
  IUserRepository,
  User,
  CreateUserInput,
  UpdateUserInput,
  UserSearchFilters,
} from '../../../core/interfaces/repositories/user.repository.interface'
import { DatabaseError } from '../../../core/errors'

const USER_SELECT_FIELDS = 'id, name, email, phone, role, created_at, updated_at'

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(USER_SELECT_FIELDS)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch user', { error, id })
    }

    return this.mapToEntity(data)
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(USER_SELECT_FIELDS)
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch user by email', { error, email })
    }

    return this.mapToEntity(data)
  }

  async findByPhone(phone: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(USER_SELECT_FIELDS)
      .eq('phone', phone)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError('Failed to fetch user by phone', { error, phone })
    }

    return this.mapToEntity(data)
  }

  async search(filters: UserSearchFilters): Promise<{ users: User[]; total: number }> {
    let query = supabaseAdmin
      .from('users')
      .select(USER_SELECT_FIELDS, { count: 'exact' })

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }

    if (filters.role) {
      query = query.eq('role', filters.role)
    }

    query = query.order('created_at', { ascending: false })

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      throw new DatabaseError('Failed to search users', { error, filters })
    }

    return {
      users: (data || []).map((row) => this.mapToEntity(row)),
      total: count || 0,
    }
  }

  async create(input: CreateUserInput): Promise<User> {
    const insertData: Record<string, unknown> = {
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      role: input.role,
    }

    if (input.id) {
      insertData.id = input.id
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(insertData)
      .select(USER_SELECT_FIELDS)
      .single()

    if (error) {
      throw new DatabaseError('Failed to create user', { error, input })
    }

    if (!data) {
      throw new DatabaseError('Failed to create user - no data returned', { input })
    }

    return this.mapToEntity(data)
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.name !== undefined) updateData.name = input.name
    if (input.email !== undefined) updateData.email = input.email
    if (input.phone !== undefined) updateData.phone = input.phone
    if (input.role !== undefined) updateData.role = input.role

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(USER_SELECT_FIELDS)
      .single()

    if (error) {
      throw new DatabaseError('Failed to update user', { error, id, input })
    }

    if (!data) {
      throw new DatabaseError('User not found', { id })
    }

    return this.mapToEntity(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      throw new DatabaseError('Failed to delete user', { error, id })
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return false
      throw new DatabaseError('Failed to check user existence', { error, email })
    }

    return !!data
  }

  private mapToEntity(row: unknown): User {
    const data = row as Record<string, unknown>
    return {
      id: data.id as string,
      name: data.name as string,
      email: data.email as string,
      phone: (data.phone as string | null) || null,
      role: data.role as User['role'],
      created_at: data.created_at as string,
      updated_at: (data.updated_at as string | null) || null,
    }
  }
}

export const userRepository = new UserRepository()
