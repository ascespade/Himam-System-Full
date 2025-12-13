/**
 * User Repository Interface
 * Contract for user data access operations
 */

export interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: 'admin' | 'doctor' | 'patient' | 'staff' | 'reception' | 'guardian' | 'supervisor'
  created_at: string
  updated_at: string | null
}

export interface CreateUserInput {
  id?: string
  name: string
  email: string
  phone?: string | null
  role: User['role']
}

export interface UpdateUserInput {
  name?: string
  email?: string
  phone?: string | null
  role?: User['role']
}

export interface UserSearchFilters {
  search?: string
  role?: User['role']
  limit?: number
  offset?: number
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByPhone(phone: string): Promise<User | null>
  search(filters: UserSearchFilters): Promise<{ users: User[]; total: number }>
  create(input: CreateUserInput): Promise<User>
  update(id: string, input: UpdateUserInput): Promise<User>
  delete(id: string): Promise<void>
  existsByEmail(email: string): Promise<boolean>
}
