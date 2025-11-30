import { NextResponse } from 'next/server';
import { uploadToDrive } from '@/lib/googleDrive'; 

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: "Tidak ada file yang dikirim" }, { status: 400 });
    }

    // Ubah file jadi Buffer (format yang bisa dibaca Node.js)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileData = {
      name: file.name,
      mimeType: file.type,
      buffer: buffer
    };

    // Upload ke Google Drive
    // Pastikan GOOGLE_DRIVE_FOLDER_ID ada di .env.local
    const result = await uploadToDrive(fileData, process.env.GOOGLE_DRIVE_FOLDER_ID);

    return NextResponse.json({ 
      success: true, 
      file_url: result.webViewLink, 
      file_id: result.id 
    });

  } catch (error) {
    console.error("Upload Error:", error); // Cek terminal VS Code kalau ada error 500 nanti
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}