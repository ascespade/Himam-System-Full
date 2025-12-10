/**
 * Permission Hook
 * React hook for checking user permissions
 */

import { useMemo } from 'react'
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/core/security/permissions'
import type { UserRole } from '@/core/api/middleware'

// ============================================================================
// usePermission Hook
// ============================================================================

/**
 * Checks if the current user has a specific permission
 * @param userRole - The user's role
 * @param permission - The permission to check
 * @returns boolean indicating if user has permission
 */
export function usePermission(userRole: UserRole | null, permission: string): boolean {
  return useMemo(() => {
    if (!userRole) return false
    return hasPermission(userRole, permission)
  }, [userRole, permission])
}

/**
 * Checks if the current user has any of the specified permissions
 * @param userRole - The user's role
 * @param permissions - Array of permissions to check
 * @returns boolean indicating if user has any permission
 */
export function useAnyPermission(userRole: UserRole | null, permissions: string[]): boolean {
  return useMemo(() => {
    if (!userRole) return false
    return hasAnyPermission(userRole, permissions)
  }, [userRole, permissions])
}

/**
 * Checks if the current user has all of the specified permissions
 * @param userRole - The user's role
 * @param permissions - Array of permissions to check
 * @returns boolean indicating if user has all permissions
 */
export function useAllPermissions(userRole: UserRole | null, permissions: string[]): boolean {
  return useMemo(() => {
    if (!userRole) return false
    return hasAllPermissions(userRole, permissions)
  }, [userRole, permissions])
}
