import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Cek kredensial
    if (
      username === process.env.ADMIN_USERNAME && 
      password === process.env.ADMIN_PASSWORD
    ) {
      
      // PERBAIKAN DI SINI: Tambahkan 'await'
      const cookieStore = await cookies(); 
      
      cookieStore.set({
        name: 'admin_session',
        value: 'true',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Username atau Password Salah!' }, { status: 401 });

  } catch (error) {
    console.error("Login Error:", error); // Tambahkan log biar kelihatan di terminal
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}