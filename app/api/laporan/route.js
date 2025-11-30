import dbConnect from '@/lib/db';
import Laporan from '@/models/Laporan';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();

    const updatedLaporan = await Laporan.findOneAndUpdate(
      { token: data.token },
      { 
        profil: data.profil,
        checklist: data.checklist,
        status: 'SUBMITTED',
        waktu_submit: new Date(),
      },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedLaporan });

  } catch (error) {
    console.error("Submit Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}