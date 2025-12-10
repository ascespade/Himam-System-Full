/**
 * Hooks Index
 * Centralized export for all custom hooks
 */

export { useApi, useMutation, type UseApiOptions, type UseApiResult, type UseMutationOptions, type UseMutationResult } from './use-api'
export { usePaginated, type UsePaginatedOptions, type UsePaginatedResult } from './use-paginated'
export { useInfiniteScroll, type UseInfiniteScrollOptions, type UseInfiniteScrollResult } from './use-infinite-scroll'
export { useDebounce } from './use-debounce'
export { useLocalStorage } from './use-local-storage'
export { usePermission, useAnyPermission, useAllPermissions } from './use-permission'
