import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Get token from Authorization header or cookies
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || req.cookies.get('auth_token')?.value;

  // If accessing login page
  if (req.nextUrl.pathname === '/login') {
    // If already has token, redirect to dashboard
    if (token) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // For all other pages, check if user has token
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // TODO: Optionally verify token with API here
  // For now, we trust that the client-side will handle invalid tokens

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/company/:path*',
    '/crawler/:path*',
    '/leads/:path*',
    '/profile/:path*',
    '/requirements/:path*',
    '/scheduler/:path*',
  ],
};
