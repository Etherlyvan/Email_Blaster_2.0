import { getToken } from 'next-auth/jwt'
import { NextRequest,  NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const isAuthenticated = !!token

  const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
  const isApiRoute = req.nextUrl.pathname.startsWith('/api')
  const isPublicRoute = req.nextUrl.pathname === '/'

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect unauthenticated users to login page
  if (!isAuthenticated && !isAuthPage && !isPublicRoute && !isApiRoute) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}