import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Laporan from '@/models/Laporan';

// Mencegah cache data lama
export const dynamic = 'force-dynamic';

// 1. GET: AMBIL DATA
export async function GET() {
  try {
    await dbConnect();
    const data = await Laporan.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: data });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data" }, { status: 500 });
  }
}

// 2. POST: GENERATE TOKEN BARU (FIX INVALID DATE)
export async function POST(request) {
  try {
    const body = await request.json();
    await dbConnect();

    // --- 🛠️ LOGIKA PERBAIKAN TANGGAL (PENTING) ---
    // Default ke hari ini jika kosong
    let tglValid = new Date(); 
    
    // Jika user mengirim data tanggal, kita cek dulu valid atau tidak
    if (body.tanggal_pengawasan) {
        const parsedDate = new Date(body.tanggal_pengawasan);
        // Jika valid (bukan Invalid Date), pakai tanggal dari user
        if (!isNaN(parsedDate.getTime())) {
            tglValid = parsedDate;
        }
    }
    // ------------------------------------------------

    // Generate Token
    const prefix = body.kategori === 'FASYANKES' ? 'FSY' : 'IND';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const tokenBaru = `${prefix}-${randomNum}`;

    const laporanBaru = await Laporan.create({
      token: tokenBaru,
      kategori_target: body.kategori, 
      
      // ✅ GUNAKAN TANGGAL YANG SUDAH DIVALIDASI
      tanggal_pengawasan: tglValid,
      
      // Pastikan array tidak undefined
      tim_pengawas: body.tim_pengawas || [], 

      profil: {
        nama_usaha: body.nama_target 
      },
      
      status: 'DRAFT',
      checklist: [] 
    });

    return NextResponse.json({ 
      success: true, 
      token: tokenBaru,
      data: laporanBaru 
    });

  } catch (error) {
    console.error("Create Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}