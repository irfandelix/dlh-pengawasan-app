import dbConnect from '@/lib/db';
import Laporan from '@/models/Laporan';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Konek Database
    await dbConnect();
    
    // 2. Baca data dari Admin Dashboard
    const { nama_usaha, kategori_target } = await request.json();

    // 3. Generate Token Unik (Format: IND-1234 atau FSY-1234)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = kategori_target === 'FASYANKES' ? 'FSY' : 'IND';
    const token = `${prefix}-${randomNum}`;

    // 4. Simpan ke MongoDB!
    const newLaporan = await Laporan.create({
      token: token,
      kategori_target: kategori_target,
      // Lingkup otomatis lengkap A-E
      lingkup: ["A", "B", "C", "D", "E"], 
      profil: {
        nama_usaha: nama_usaha
      }
    });

    return NextResponse.json({ success: true, data: newLaporan });

  } catch (error) {
    console.error("Error Database:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    // Ambil semua data token, urutkan dari yang terbaru
    const list = await Laporan.find({}).sort({ created_at: -1 });
    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}