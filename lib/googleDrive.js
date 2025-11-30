import { google } from 'googleapis';
import { Readable } from 'stream';

export async function uploadToDrive(fileObject, folderId) {
  try {
    // 1. Cek Apakah Kunci Rahasia Sudah Ada?
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
      throw new Error("KREDENSIAL OAUTH BELUM LENGKAP DI .ENV.LOCAL");
    }

    // 2. Inisialisasi OAuth Client (Di dalam fungsi agar data terbaru selalu terambil)
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground" // Redirect URI
    );

    // Set Token
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 3. Convert Buffer ke Stream
    const bufferStream = new Readable();
    bufferStream.push(Buffer.from(fileObject.buffer));
    bufferStream.push(null);

    console.log("🚀 Sedang mengupload ke Drive:", fileObject.name);

    // 4. Proses Upload ke Google
    const response = await drive.files.create({
      requestBody: {
        name: fileObject.name,
        parents: [folderId], // Masuk ke folder target
      },
      media: {
        mimeType: fileObject.mimeType,
        body: bufferStream,
      },
      fields: 'id, webViewLink, webContentLink',
    });

    console.log("✅ Upload Berhasil! ID:", response.data.id);

    // 5. Set Permission jadi Public (Agar bisa dilihat di PDF nanti)
    try {
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permError) {
      console.warn("⚠️ Warning Permission (Bukan Error Fatal):", permError.message);
    }

    return response.data; // Kembalikan ID dan Link

  } catch (error) {
    // LOG ERROR LENGKAP KE TERMINAL
    console.error('❌ GAGAL UPLOAD KE GOOGLE DRIVE:');
    console.error('Pesan Error:', error.message);
    if (error.response && error.response.data) {
      console.error('Detail Google:', JSON.stringify(error.response.data, null, 2));
    }
    
    throw new Error(error.message); // Lempar error agar API route tahu
  }
}