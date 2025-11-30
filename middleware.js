import { NextResponse } from 'next/server';

export function middleware(request) {
  // Ambil cookie 'admin_session'
  const adminSession = request.cookies.get('admin_session');
  
  // Cek apakah user sedang mencoba akses halaman admin?
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Jika TIDAK ADA cookie session, tendang ke halaman login (Home)
    if (!adminSession) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Tentukan halaman mana saja yang diproteksi
export const config = {
  matcher: '/admin/:path*', // Semua yang diawali /admin/... kena proteksi
};