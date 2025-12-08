import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Public routes that don't need auth
  const publicRoutes = ['/login', '/sign', '/api/whatsapp']
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    // If user is logged in and tries to access login, redirect to role-based dashboard
    if (user && request.nextUrl.pathname === '/login') {
       // Fetch role to redirect correctly
       const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

       const role = userData?.role || 'admin'
       // Redirect to role-based dashboard
       return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
    return response
  }

  // Protected Routes
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/settings')) {
      if (!user) {
          return NextResponse.redirect(new URL('/login', request.url))
      }

      // Role-Based Access Control
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error || !userData) {
          console.error('Error fetching user role:', error)
          // If we can't verify role, maybe let them through to a generic dashboard or error
          // For security, let's redirect to login if we can't verify
           return NextResponse.redirect(new URL('/login', request.url))
        }

        const role = userData.role
        const path = request.nextUrl.pathname

        // If accessing /dashboard without role, redirect to role-based dashboard
        if (path === '/dashboard' || path === '/dashboard/') {
          return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
        }

        // Admin only routes
        if (path.startsWith('/dashboard/admin') && role !== 'admin') {
           return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
        }

        // Doctor only routes
        if (path.startsWith('/dashboard/doctor') && role !== 'doctor' && role !== 'admin') {
           return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
        }

        // Reception only routes
        if (path.startsWith('/dashboard/reception') && role !== 'reception' && role !== 'admin') {
           return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
        }

        // Insurance only routes
        if (path.startsWith('/dashboard/insurance') && role !== 'insurance' && role !== 'admin') {
           return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
        }

      } catch (e) {
        console.error('Middleware error:', e)
        return NextResponse.redirect(new URL('/login', request.url))
      }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/login', '/sign'],
}
