import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Laporan from "@/models/Laporan";

// Mencegah cache agar data selalu fresh saat user membuka link
export const dynamic = "force-dynamic";

// 1. GET: Dipakai saat Industri membuka Link (Mengambil Data berdasarkan Token)
export async function GET(req) {
  try {
    await dbConnect();
    
    // Ambil token dari URL (?token=IND-1234)
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, error: "Token wajib ada" }, { status: 400 });
    }

    // Cari Laporan di Database
    const laporan = await Laporan.findOne({ token });

    if (!laporan) {
      return NextResponse.json({ success: false, error: "Laporan tidak ditemukan / Token Salah" }, { status: 404 });
    }

    // Kirim data ke frontend industri
    return NextResponse.json({ success: true, data: laporan });

  } catch (error) {
    console.error("API Laporan Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. PUT: Dipakai saat Industri menekan tombol "Simpan / Submit"
export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // Data yang dikirim dari Frontend Industri
    const { token, checklist, profil, status } = body;

    if (!token) {
      return NextResponse.json({ error: "Token tidak ditemukan" }, { status: 400 });
    }

    // Update Data Laporan di Database
    const updatedLaporan = await Laporan.findOneAndUpdate(
      { token },
      { 
        $set: {
          checklist: checklist, // Simpan jawaban checklist
          profil: profil,       // Simpan data profil (alamat, telp, dll)
          status: status || 'DRAFT' // Update status (DRAFT / SUBMITTED)
        }
      },
      { new: true } // Return data terbaru setelah update
    );

    if (!updatedLaporan) {
      return NextResponse.json({ error: "Gagal update, token tidak valid" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedLaporan });

  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Tambahan: Handle POST juga ke fungsi PUT (jaga-jaga jika frontend pakai POST)
export async function POST(req) {
  return PUT(req);
}