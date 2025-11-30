import dbConnect from '@/lib/db';
import Laporan from '@/models/Laporan';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await dbConnect();
    const { token } = await request.json();

    // Cari Token
    const laporan = await Laporan.findOne({ token: token });

    if (!laporan) {
      return NextResponse.json({ success: false, message: 'Token tidak ditemukan!' }, { status: 404 });
    }

    if (laporan.status === 'SUBMITTED') {
      return NextResponse.json({ success: false, message: 'Laporan sudah dikirim.' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        token: laporan.token,
        nama_usaha: laporan.profil?.nama_usaha,
        kategori: laporan.kategori_target
      } 
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}