import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'cpdhub_secret_key_123');

async function verifyTokenEdge(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('cpdhub_token')?.value;
  const { pathname } = req.nextUrl;

  // Protect sensitive routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/courses') || pathname.startsWith('/certificates')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const session = await verifyTokenEdge(token);

    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Role-based protection for /admin
    if (pathname.startsWith('/admin') && session.role !== 'Admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth')) {
    if (token) {
      const session = await verifyTokenEdge(token);
      if (session) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/courses/:path*', '/certificates/:path*', '/auth/:path*'],
};
