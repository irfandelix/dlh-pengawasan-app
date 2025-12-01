import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Laporan from '@/models/Laporan';

// 1. GET: UNTUK MENGAMBIL DATA DARI MONGODB KE DASHBOARD
export async function GET() {
  try {
    await dbConnect();
    
    // Ambil semua data, urutkan dari yang terbaru (created_at: -1)
    const data = await Laporan.find({}).sort({ created_at: -1 });

    return NextResponse.json({ 
      success: true, 
      data: data 
    });

  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data" }, { status: 500 });
  }
}

// 2. POST: UNTUK GENERATE TOKEN BARU (YANG SUDAH ADA SEBELUMNYA)
export async function POST(request) {
  try {
    const body = await request.json();
    await dbConnect();

    // Generate Token Acak (Contoh: IND-1234 atau FSY-5678)
    const prefix = body.kategori_target === 'FASYANKES' ? 'FSY' : 'IND';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const tokenBaru = `${prefix}-${randomNum}`;

    // Simpan ke Database
    const laporanBaru = await Laporan.create({
      token: tokenBaru,
      kategori_target: body.kategori_target,
      profil: {
        nama_usaha: body.nama_usaha
      },
      status: 'DRAFT',
      checklist: [] // Checklist kosong dulu
    });

    return NextResponse.json({ 
      success: true, 
      data: laporanBaru 
    });

  } catch (error) {
    console.error("Create Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}