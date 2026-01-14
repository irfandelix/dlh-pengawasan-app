import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import dbConnect from '@/lib/db';
import Laporan from '@/models/Laporan';
import fs from 'fs';
import path from 'path';

// ==========================================
// 1. HELPER FUNCTIONS
// ==========================================

// --- Helper: Format Tanggal Indonesia ---
const getIndoDate = (dateForDay, dateForTime) => {
  const d = dateForDay ? new Date(dateForDay) : new Date();
  
  let t;
  if (dateForTime) {
    t = new Date(dateForTime);
  } else {
    t = new Date();
    t.setHours(9, 0, 0); 
  }

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  
  return {
    hari: days[d.getDay()],
    tgl: d.getDate(),
    bln: months[d.getMonth()],
    thn: d.getFullYear(),
    pukul: t.toLocaleTimeString('id-ID', {
        hour: '2-digit', 
        minute:'2-digit', 
        timeZone: 'Asia/Jakarta'
    }).replace('.', ':')
  };
};

// --- Helper: Sorting Tim Pengawas (Kepala > Pangkat > Nama) ---
const sortTimPengawas = (tim) => {
  if (!tim || !Array.isArray(tim)) return [];

  return [...tim].sort((a, b) => {
    // 1. PRIORITAS UTAMA: JABATAN STRUKTURAL ("KEPALA")
    const isKepalaA = (a.jabatan || "").toLowerCase().includes("kepala");
    const isKepalaB = (b.jabatan || "").toLowerCase().includes("kepala");

    if (isKepalaA && !isKepalaB) return -1; // A naik
    if (!isKepalaA && isKepalaB) return 1;  // B naik

    // 2. PRIORITAS KEDUA: PANGKAT (SKOR)
    const getScore = (pangkatStr) => {
      if (!pangkatStr || pangkatStr.trim() === '-' || pangkatStr.trim() === '') return 0;

      // Regex fleksibel baca romawi (IV, III) dan huruf (a, b)
      const match = pangkatStr.match(/\b(IV|III|II|I)(?:\s*[\/.-]?\s*)([a-e])\b/i);
      if (!match) return 0;

      const romans = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4 };
      const letters = { 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5 };

      return (romans[match[1].toUpperCase()] * 10) + letters[match[2].toLowerCase()];
    };

    const scoreA = getScore(a.pangkat);
    const scoreB = getScore(b.pangkat);

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    // 3. PRIORITAS KETIGA: NAMA (A-Z)
    const namaA = a.nama || "";
    const namaB = b.nama || "";
    return namaA.localeCompare(namaB);
  });
};

// --- Helper: Ambil Logo (Lokal / Fallback URL) ---
async function getLogoBase64() {
  try {
    const filename = 'Seal_of_Sragen_Regency.png';
    const filePath = path.join(process.cwd(), 'public', filename);
    if (fs.existsSync(filePath)) {
       const fileBuffer = await fs.promises.readFile(filePath);
       return `data:image/png;base64,${fileBuffer.toString('base64')}`;
    }
  } catch (error) {
    console.error("Gagal baca logo lokal:", error);
  }

  // Fallback ke Wikimedia
  try {
    const fallbackUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Seal_of_Sragen_Regency.svg/238px-Seal_of_Sragen_Regency.svg.png";
    const res = await fetch(fallbackUrl);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
    }
  } catch (error) {
    console.error("Gagal download logo fallback:", error);
  }
  return null;
}

// --- Helper: Convert URL ke Base64 ---
async function urlToBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Gagal fetch gambar");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error("Gagal convert gambar:", error);
    return null;
  }
}

// --- Helper: Format URL Google Drive ---
const formatDriveImg = (url) => {
  if (!url) return null;
  const idMatch = url.match(/\/d\/(.+?)\//);
  if (idMatch && idMatch[1]) return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
  return url;
};

// ==========================================
// 2. DATA MASTER CHECKLIST
// ==========================================
const MASTER_CHECKLIST_INDUSTRI = [
  {
    kategori: "Dokumen Lingkungan",
    items: [
      "Dokumen AMDAL/DELH, UKL-UPL/DPLH, SPPL",
      "Persetujuan Lingkungan (Lampirkan berkasnya)",
      "Persetujuan Teknis (Lampirkan berkasnya)",
      "Pelaporan pelaksanaan AMDAL/DELH, UKL-UPL/DPLH, SPPL"
    ]
  },
  {
    kategori: "Pengecekan terhadap Limbah Cair",
    items: [
      "Sumber air limbah",
      "Kondisi fisik IPAL (permanen, kedap air)",
      "Kondisi kinerja IPAL (peralatan bekerja/tdk, rusak, pengoperasian baik/tdk)",
      "Skema/lay out IPAL",
      "Alat ukur debit air limbah",
      "Debit air limbah inlet dan outlet IPAL",
      "Saluran air limbah",
      "Data hasil uji kualitas air (Lampirkan hasilnya)",
      "Pengelolaan sludge IPAL"
    ]
  },
  {
    kategori: "Pengecekan terhadap Sumber-sumber Emisi Udara",
    items: [
      "Data hasil uji udara emisi (Lampirkan hasilnya)",
      "Data hasil uji udara ambien (Lampirkan hasilnya)",
      "Alat pengendali emisi",
      "Pengaduan masyarakat/gangguan kualitas udara yang terjadi",
      "Upaya pengendalian pencemaran udara",
      "Upaya pengendalian kebisingan, getaran, dan bau"
    ]
  },
  {
    kategori: "Pengecekan terhadap Limbah B3",
    items: [
      "Persetujuan Teknis Penyimpanan Sementara LB3 (Lampirkan berkasnya)",
      "Sumber LB3",
      "Jenis LB3",
      "Neraca LB3 (Lampirkan berkasnya)",
      "Logbook LB3 (Lampirkan berkasnya)",
      "Jumlah LB3",
      "Waktu penyimpanan LB3",
      "Pelaporan Limbah B3"
    ]
  },
  {
    kategori: "Capaian Kinerja Pengurangan Sampah Tahun 2025",
    items: [
      "Usaha dan/atau kegiatan yang memiliki jumlah pekerja sama dengan atau lebih dari 1000 orang wajib memiliki sarana pengolah sampah organik (minimal komposter)"
    ]
  },
  {
    kategori: "Pemanfaatan Sampah",
    items: [
      "Jenis Sampah yang dimanfaatkan kembali",
      "Jumlah Kemasan Botol Kaca/Beling (ton/bulan)",
      "Jumlah Kemasan Botol PET (ton/bulan)",
      "Jumlah Kemasan Botol Aluminium (ton/bulan)",
      "Jumlah Kemasan Cat (ton/bulan)",
      "Jumlah Ban (Mobil/Motor/Sepeda) (ton/bulan)",
      "Jumlah Lain-Lain (ton/bulan)",
      "Total Sampah yang Dimanfaatkan Kembali (ton/bulan)",
      "Jumlah Sampah yang Dimanfaatkan Kembali (ton/tahun)"
    ]
  },
  {
    kategori: "Pembatasan Timbulan Sampah",
    items: [
      "Larangan penggunaan bahan styrofoam serta bahan plastik sekali pakai (Lampirkan bukti dokumentasinya)",
      "Larangan penggunaan sedotan plastik (Lampirkan bukti dokumentasinya)",
      "Himbauan penggunaan kantong wadah atau kemasan yang ramah lingkungan (Lampirkan bukti dokumentasinya)",
      "Himbauan pemilahan sampah sekurang-kurangnya untuk tiga jenis sampah yaitu sampah organik (sisa makanan, sisa sayuran, daun, dll), plastik dan kertas (Lampirkan bukti dokumentasinya)",
      "Mendaur ulang sampah plastik, dan kertas yang dapat didaur ulang (Lampirkan bukti dokumentasinya)",
      "Menghidangkan makan minum dengan piring dan gelas (Lampirkan bukti dokumentasinya)",
      "Jumlah Sampah yang dibatasi (ton/hari)",
      "Jumlah Sampah yang dibatasi (ton/tahun)"
    ]
  }
];

const MASTER_CHECKLIST_FASYANKES = [
  {
    kategori: "Dokumen Lingkungan",
    items: [
      "Dokumen AMDAL/DELH, UKL-UPL/DPLH, SPPL",
      "Persetujuan Lingkungan (Lampirkan berkasnya)",
      "Persetujuan Teknis (Lampirkan berkasnya)",
      "Pelaporan Pelaksanaan AMDAL/DELH, UKL-UPL/DPLH, SPPL"
    ]
  },
  {
    kategori: "Pengecekan terhadap Limbah Cair",
    items: [
      "Sumber air limbah",
      "Kondisi fisik IPAL (permanen, kedap air)",
      "Kondisi kinerja IPAL (peralatan bekerja/tdk, rusak, pengoperasian baik / tdk)",
      "Skema/lay out IPAL",
      "Alat ukur debit air limbah",
      "Debit air limbah inlet dan outlet IPAL",
      "Saluran air limbah",
      "Data hasil uji kualitas air limbah (Lampirkan hasilnya)",
      "Pengelolaan sludge IPAL"
    ]
  },
  {
    kategori: "Pengecekan terhadap Limbah B3",
    items: [
      "Persetujuan Teknis Penyimpanan Sementara LB3 (Lampirkan berkasnya)",
      "Sumber LB3",
      "Jenis LB3",
      "Neraca LB3 (Lampirkan berkasnya)",
      "Logbook LB3 (Lampirkan berkasnya)",
      "Jumlah LB3",
      "Waktu penyimpanan LB3",
      "Pelaporan Limbah B3"
    ]
  },
  {
    kategori: "Capaian Kinerja Pengurangan Sampah Tahun 2025",
    items: [
      "Usaha dan/atau kegiatan yang memiliki jumlah pekerja sama dengan atau lebih dari 1000 orang wajib memiliki sarana pengolah sampah organik (minimal komposter)"
    ]
  },
  {
    kategori: "Pemanfaatan Sampah",
    items: [
      "Jenis Sampah yang dimanfaatkan kembali",
      "Jumlah Kemasan Botol Kaca/Beling (ton/bulan)",
      "Jumlah Kemasan Botol PET (ton/bulan)",
      "Jumlah Kemasan Botol Aluminium (ton/bulan)",
      "Jumlah Kemasan Cat (ton/bulan)",
      "Jumlah Ban (Mobil/Motor/Sepeda) (ton/bulan)",
      "Jumlah Lain-Lain (ton/bulan)",
      "Total Sampah yang Dimanfaatkan Kembali (ton/bulan)",
      "Jumlah Sampah yang Dimanfaatkan Kembali (ton/tahun)"
    ]
  },
  {
    kategori: "Pembatasan Timbulan Sampah",
    items: [
      "Larangan penggunaan bahan styrofoam serta bahan plastik sekali pakai (Lampirkan bukti dokumentasinya)",
      "Larangan penggunaan sedotan plastik (Lampirkan bukti dokumentasinya)",
      "Himbauan penggunaan kantong wadah atau kemasan yang ramah lingkungan (Lampirkan bukti dokumentasinya)",
      "Himbauan pemilahan sampah sekurang-kurangnya untuk tiga jenis sampah yaitu sampah organik (sisa makanan, sisa sayuran, daun, dll), plastik dan kertas (Lampirkan bukti dokumentasinya)",
      "Mendaur ulang sampah plastik, dan kertas yang dapat didaur ulang (Lampirkan bukti dokumentasinya)",
      "Menghidangkan makan minum dengan piring dan gelas (Lampirkan bukti dokumentasinya)",
      "Jumlah Sampah yang dibatasi (ton/hari)",
      "Jumlah Sampah yang dibatasi (ton/tahun)"
    ]
  }
];

// ==========================================
// 3. MAIN API HANDLER
// ==========================================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) return NextResponse.json({ error: 'Token wajib ada' }, { status: 400 });

    await dbConnect();
    const data = await Laporan.findOne({ token: token }).lean(); // Gunakan lean() utk performa

    if (!data) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });

    // --- Persiapan Data Variabel ---
    const isFasyankes = data.kategori_target === 'FASYANKES';
    const activeChecklist = isFasyankes ? MASTER_CHECKLIST_FASYANKES : MASTER_CHECKLIST_INDUSTRI;
    
    // Mapping Checklist
    const dataMap = {};
    if (data.checklist && data.checklist.length > 0) {
      data.checklist.forEach(item => {
        const key = `${item.kategori}|${item.pertanyaan}`;
        dataMap[key] = item;
      });
    }

    // Ambil sub-objek data
    const p = data.profil || {};
    const tek = data.aspek_teknis || {};
    const adm = data.fakta_administratif || [];
    const lap = data.fakta_lapangan || ''; // Textarea narasi

    const waktuPembuatan = data.created_at || data.createdAt; 
    const timeInfo = getIndoDate(data.tanggal_pengawasan, waktuPembuatan); 
    const logoBase64 = await getLogoBase64(); 
    const timPengawas = sortTimPengawas(data.tim_pengawas || []);

    // --- Pre-process Gambar (SIPA, Diagram, Peta, Foto) ---
    
    // 1. SIPA
    let sipaBase64 = null;
    let sipaIsPdf = false;
    let sipaBuffer = null;
    if (p.file_sipa) {
      const driveUrl = formatDriveImg(p.file_sipa);
      try {
        const res = await fetch(driveUrl);
        const ab = await res.arrayBuffer();
        const buffer = Buffer.from(ab);
        if (buffer.toString('utf-8', 0, 4) === '%PDF') {
          sipaIsPdf = true;
          sipaBuffer = buffer;
        } else {
          const contentType = res.headers.get('content-type') || 'image/jpeg';
          sipaBase64 = `data:${contentType};base64,${buffer.toString('base64')}`;
        }
      } catch (e) { console.error("Gagal proses SIPA:", e); }
    }

    // 2. Diagram (Fasyankes)
    let diagramBase64 = null;
    if (isFasyankes && p.file_diagram) {
       diagramBase64 = await urlToBase64(formatDriveImg(p.file_diagram));
    }

    // 3. Peta Lokasi (Geoapify)
    let mapBase64 = null;
    const GEOAPIFY_API_KEY = process.env.KEY_GEOAPIFY; 
    if (p.koordinat && GEOAPIFY_API_KEY) {
       try {
         const [lat, lon] = p.koordinat.split(',').map(s => s.trim());
         if(lat && lon) {
             const mapUrl = `https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=600&height=300&center=lonlat:${lon},${lat}&zoom=17&marker=lonlat:${lon},${lat};color:%23ff0000;size:medium&apiKey=${GEOAPIFY_API_KEY}`;
             mapBase64 = await urlToBase64(mapUrl);
         }
       } catch (err) { console.error("Gagal ambil peta Geoapify:", err); }
    }

    // 4. Foto Dokumentasi Checklist
    const fotoChecklistMap = {};
    await Promise.all(data.checklist.map(async (item) => {
        if (item.bukti_foto && item.bukti_foto.length > 0) {
            const url = formatDriveImg(item.bukti_foto[0]);
            const base64 = await urlToBase64(url);
            if (base64) {
                const key = `${item.kategori}|${item.pertanyaan}`;
                fotoChecklistMap[key] = base64;
            }
        }
    }));

    // Helper value profil agar tidak undefined
    const val = (key) => p[key] || '-';

    // Helper render sub-bagian teknis (Air, B3, Udara)
    const renderSubBagian = (judul, dataBagian, nomorRomawi) => {
        if (!dataBagian) return '';
        return `
        <div style="margin-top: 15px; page-break-inside: avoid;">
            <div style="font-weight: bold; margin-bottom: 5px;">${nomorRomawi}. ${judul}</div>
            <ol style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 5px;"><b>Sumber:</b><br/>${dataBagian.sumber || '-'}</li>
                <li style="margin-bottom: 5px;"><b>Status Perizinan:</b><br/>${dataBagian.status_izin || '-'}</li>
                <li style="margin-bottom: 5px;"><b>Status Ketaatan Terhadap Pemantauan Baku Mutu:</b><br/>${dataBagian.ketaatan_mutu || '-'}</li>
                <li style="margin-bottom: 5px;"><b>Status Ketaatan Terhadap Ketentuan Teknis:</b><br/>${dataBagian.ketaatan_teknis || '-'}</li>
                <li style="margin-bottom: 5px;"><b>Informasi Umum:</b><br/>${dataBagian.info_umum || '-'}</li>
            </ol>
        </div>`;
    };

    // ==========================================
    // 4. HTML CONTENT CONSTRUCTION
    // ==========================================
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Berita Acara Pengawasan</title>
      <style>
        @page { size: A4; margin: 2cm 2.5cm 2cm 2.5cm; }
        body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.3; color: #000; }
        .text-center { text-align: center; }
        .text-justify { text-align: justify; }
        .bold { font-weight: bold; }
        
        /* KOP SURAT */
        .kop-table { width: 100%; border-bottom: 3px solid black; margin-bottom: 20px; }
        .kop-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
        
        /* TABEL DATA UMUM (Tanpa Border) */
        .main-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .main-table td { vertical-align: top; padding: 3px 2px; }
        .col-label { width: 35%; }
        .col-sep { width: 2%; text-align: center; }
        .col-val { width: 63%; }

        /* TABEL NESTED (Untuk Kapasitas Produksi) */
        .nested-table { width: 100%; border-collapse: collapse; margin: 0; }
        .nested-table td { border: 1px solid #000; text-align: center; padding: 4px; font-size: 10pt; }

        /* TABEL ADMINISTRATIF (Dengan Border) */
        .border-table { width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 15px; }
        .border-table th, .border-table td { border: 1px solid black; padding: 5px; font-size: 10pt; vertical-align: top; }
        .border-table th { background-color: #f0f0f0; text-align: center; font-weight: bold; }

        /* TABEL CHECKLIST (Lampiran) */
        .check-table { width: 100%; border: 1px solid #000; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
        .check-table th { border: 1px solid #000; background-color: #e0e0e0; font-weight: bold; padding: 6px; }
        .check-table td { border: 1px solid #000; padding: 5px; vertical-align: middle; }
        .cat-row td { background-color: #f0f0f0; font-weight: bold; padding: 6px; border: 1px solid #000; }
        .check-center { text-align: center; font-family: DejaVu Sans, sans-serif; font-size: 14pt; font-weight: bold; }

        .section-title { font-weight: bold; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; }
        .page-break { page-break-before: always; }
        
        /* FOTO */
        .photo-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
        .photo-item { width: 48%; border: 1px solid #000; padding: 5px; text-align: center; margin-bottom: 10px; page-break-inside: avoid; }
        .photo-item img { width: 100%; max-height: 200px; object-fit: contain; }
        .caption { font-size: 9pt; font-style: italic; margin-top: 5px; }
      </style>
    </head>
    <body>

      <table class="kop-table">
        <tr>
          <td width="15%" class="text-center">
            ${logoBase64 ? `<img src="${logoBase64}" width="80" />` : ''}
          </td>
          <td width="85%" class="text-center">
            <div class="kop-title">BERITA ACARA</div>
            <div class="kop-title">PENGAWASAN KETAATAN LINGKUNGAN HIDUP</div>
            <div class="kop-title">KABUPATEN SRAGEN</div>
          </td>
        </tr>
      </table>

      <div class="text-justify" style="margin-bottom: 15px;">
        Pada hari ini <b>${timeInfo.hari}</b> tanggal <b>${timeInfo.tgl}</b> bulan <b>${timeInfo.bln}</b> tahun <b>${timeInfo.thn}</b>, telah dilakukan pengawasan lingkungan hidup terhadap usaha dan/atau kegiatan:
      </div>

      <table class="main-table">
        <tr><td class="col-label">Nama Usaha/Kegiatan</td><td class="col-sep">:</td><td><b>${val('nama_usaha')}</b></td></tr>
        <tr><td class="col-label">Alamat</td><td class="col-sep">:</td><td>${val('alamat_usaha')}</td></tr>
      </table>

      <div style="margin: 10px 0;">Oleh Pejabat Pengawas Lingkungan Hidup (PPLH):</div>

      <ol style="margin-top: 0; padding-left: 20px;">
        ${timPengawas.map(t => `
          <li style="margin-bottom: 5px;">
             <b>${t.nama}</b> (NIP: ${t.nip || '-'}), Pangkat: ${t.pangkat || '-'}, Jabatan: ${t.jabatan || '-'}
          </li>
        `).join('')}
      </ol>

      <div class="text-justify">
        Dari hasil pengawasan tersebut, ditemukan fakta-fakta sebagai berikut:
      </div>

      <div class="section-title">I. INFORMASI UMUM</div>
      
      <table class="main-table">
        <tr><td class="col-label">Bidang Usaha</td><td class="col-sep">:</td><td class="col-val">${val('bidang_usaha')}</td></tr>
        <tr><td class="col-label">NIB</td><td class="col-sep">:</td><td class="col-val">${val('nib')}</td></tr>
        <tr><td class="col-label">KBLI</td><td class="col-sep">:</td><td class="col-val">${val('kbli')}</td></tr>
        <tr><td class="col-label">Penanggung Jawab</td><td class="col-sep">:</td><td class="col-val">${val('penanggung_jawab')}</td></tr>
        <tr><td class="col-label">Jabatan</td><td class="col-sep">:</td><td class="col-val">${val('jabatan_pj')}</td></tr>
        <tr><td class="col-label">Tahun Operasi</td><td class="col-sep">:</td><td class="col-val">${val('tahun_operasi')}</td></tr>
        <tr><td class="col-label">Status Permodalan</td><td class="col-sep">:</td><td class="col-val">${val('status_permodalan')}</td></tr>
        <tr><td class="col-label">Luas Lahan/Bangunan</td><td class="col-sep">:</td><td class="col-val">${val('luas_lahan')}</td></tr>
        <tr><td class="col-label">Koordinat Lokasi</td><td class="col-sep">:</td><td class="col-val">${val('koordinat')}</td></tr>

        <tr>
             <td class="col-label">Peta Lokasi</td>
             <td class="col-sep">:</td>
             <td class="col-val">
               ${mapBase64 ? 
                 `<img src="${mapBase64}" style="width: 300px; height: auto; object-fit: cover; border: 1px solid #ccc; margin-top: 5px;" />` 
                 : '(Peta tidak tersedia)'
               }
             </td>
        </tr>

        ${!isFasyankes ? `
        <tr>
          <td class="col-label">Kapasitas Produksi<br/>(Satuan/hari/shift)</td>
          <td class="col-sep">:</td>
          <td style="padding: 0;">
            <table class="nested-table">
              <tr>
                 <td width="33%" style="background-color: #eee;">Terpasang</td>
                 <td width="33%" style="background-color: #eee;">Sesuai Izin</td>
                 <td width="33%" style="background-color: #eee;">Riil</td>
              </tr>
              <tr>
                <td>${p.kapasitas_terpasang || '-'}</td>
                <td>${p.kapasitas_izin || '-'}</td>
                <td>${p.kapasitas_riil || '-'}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td class="col-label">Bahan Baku Utama</td><td class="col-sep">:</td><td class="col-val">${val('bahan_baku_utama')}</td></tr>
        <tr><td class="col-label">Bahan Baku Penolong</td><td class="col-sep">:</td><td class="col-val">${val('bahan_baku_penolong')}</td></tr>
        <tr><td class="col-label">Proses Produksi</td><td class="col-sep">:</td><td class="col-val">${val('proses_produksi')}</td></tr>
        <tr><td class="col-label">Pemasaran Export</td><td class="col-sep">:</td><td class="col-val">${val('pemasaran_export')} %</td></tr>
        <tr><td class="col-label">Pemasaran Domestik</td><td class="col-sep">:</td><td class="col-val">${val('pemasaran_domestik')} %</td></tr>
        <tr><td class="col-label">Bahan Bakar</td><td class="col-sep">:</td><td class="col-val">${val('bahan_bakar')}</td></tr>
        ` : `
        <tr><td class="col-label">Jumlah Tempat Tidur</td><td class="col-sep">:</td><td class="col-val">${val('jumlah_tempat_tidur')}</td></tr>
        <tr><td class="col-label">Media Buang Limbah</td><td class="col-sep">:</td><td class="col-val">${val('media_pembuangan_air')}</td></tr>
        `}
        
        <tr><td class="col-label">Sumber Air</td><td class="col-sep">:</td><td class="col-val">${val('sumber_air')}</td></tr>
        <tr><td class="col-label">Sumber Listrik</td><td class="col-sep">:</td><td class="col-val">${val('sumber_listrik')}</td></tr>
      </table>

      <div class="section-title">II. FAKTA ADMINISTRATIF</div>
      <div class="text-justify">Perizinan lingkungan dan perizinan berusaha yang dimiliki:</div>
      
      <table class="border-table">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="30%">Nomor Dokumen</th>
                <th width="45%">Judul / Perihal</th>
                <th width="20%">Tanggal</th>
            </tr>
        </thead>
        <tbody>
            ${adm.length > 0 ? 
                adm.map((item, idx) => `
                <tr>
                    <td class="text-center">${idx + 1}</td>
                    <td>${item.nomor}</td>
                    <td>${item.judul}</td>
                    <td class="text-center">${item.tanggal}</td>
                </tr>
                `).join('') 
                : '<tr><td colspan="4" class="text-center">Tidak ada data administratif.</td></tr>'
            }
        </tbody>
      </table>

      <div class="section-title">III. FAKTA LAPANGAN</div>
      <div class="text-justify" style="white-space: pre-wrap;">${lap || 'Tidak ada catatan fakta lapangan.'}</div>

      <div class="section-title">IV. PEMERIKSAAN TEKNIS LINGKUNGAN</div>
      
      ${renderSubBagian('PENGENDALIAN PENCEMARAN AIR (AIR LIMBAH)', tek.air_limbah, 'A')}
      ${renderSubBagian('PENGELOLAAN LIMBAH B3', tek.limbah_b3, 'B')}
      
      ${tek.udara_emisi && tek.udara_emisi.is_ada === true ? 
        renderSubBagian('PENGENDALIAN PENCEMARAN UDARA', tek.udara_emisi, 'C') 
        : '' 
      }

      <div class="page-break"></div>
      
      <div class="text-justify" style="margin-top: 20px;">
        Demikian Berita Acara ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagaimana mestinya.
      </div>

      <table style="width: 100%; margin-top: 50px;">
        <tr>
            <td width="50%" class="text-center" style="vertical-align: top;">
                <b>Penanggung Jawab Usaha/Kegiatan</b>
                <br/><br/><br/><br/><br/>
                ( ........................................... )
            </td>
            <td width="50%" class="text-center" style="vertical-align: top;">
                <b>Pejabat Pengawas Lingkungan Hidup</b>
                <br/><br/>
                ${timPengawas.length > 0 ? timPengawas[0].nama : '...........................................'}
                <br/><br/><br/><br/>
                ( ........................................... )
            </td>
        </tr>
      </table>

      <div class="page-break"></div>
      <div class="section-title text-center" style="margin-bottom: 20px;">LAMPIRAN: CHECKLIST PENGAWASAN</div>
      
      <table class="check-table">
        <thead>
          <tr>
            <th width="40%">Aspek Yang Diawasi</th>
            <th width="8%">Ada</th>
            <th width="8%">Tidak</th>
            <th width="44%">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${activeChecklist.map(category => {
            const listItems = category.items.map(pertanyaan => {
              const key = `${category.kategori}|${pertanyaan}`;
              const dataItem = dataMap[key]; 
              const rawValue = (dataItem && dataItem.is_ada !== undefined) ? String(dataItem.is_ada) : "false";
              const isCentangAda = rawValue === "true" || rawValue === "1";
              const isCentangTidak = !isCentangAda;

              return `
              <tr>
                <td style="padding-left: 10px;">${pertanyaan}</td>
                <td class="check-center border">${isCentangAda ? 'V' : ''}</td>
                <td class="check-center border">${isCentangTidak ? 'V' : ''}</td>
                <td class="border">${dataItem?.keterangan || ''}</td>
              </tr>`;
            }).join('');
            return `<tr class="cat-row"><td colspan="4">${category.kategori}</td></tr>${listItems}`;
          }).join('')}
        </tbody>
      </table>

      <div class="page-break"></div>
      <div class="section-title">DOKUMENTASI / FOTO</div>
      
      <div class="photo-grid">
         ${data.checklist.map(item => {
             const key = `${item.kategori}|${item.pertanyaan}`;
             const imgBase64 = fotoChecklistMap[key]; 
             if(imgBase64) {
               return `
                 <div class="photo-item">
                   <img src="${imgBase64}" />
                   <div class="caption">${item.pertanyaan}</div>
                 </div>`;
             }
             return '';
         }).join('')}
      </div>

    </body>
    </html>
    `;

    // ==========================================
    // 5. GENERATE PDF WITH PUPPETEER
    // ==========================================
    let browser;
    if (process.env.NODE_ENV === 'production') {
      const chromium = await import('@sparticuz/chromium-min').then(mod => mod.default);
      const puppeteerCore = await import('puppeteer-core').then(mod => mod.default);
      chromium.setGraphicsMode = false;
      const executablePath = await chromium.executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar"
      );
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: executablePath,
        headless: chromium.headless,
      });
    } else {
      const puppeteer = await import('puppeteer').then(mod => mod.default);
      browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    }
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const reportPdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false, 
      margin: { top: '2cm', right: '2cm', bottom: '1cm', left: '2cm' }
    });
    await browser.close();

    // --- MERGE PDF SIPA (JIKA SIPA BERUPA FILE PDF) ---
    let finalPdfBuffer = reportPdfBuffer;
    if (sipaIsPdf && sipaBuffer) {
      const reportPdfDoc = await PDFDocument.load(reportPdfBuffer);
      const sipaPdfDoc = await PDFDocument.load(sipaBuffer);
      const sipaPages = await reportPdfDoc.copyPages(sipaPdfDoc, sipaPdfDoc.getPageIndices());
      sipaPages.forEach((page) => reportPdfDoc.addPage(page));
      finalPdfBuffer = await reportPdfDoc.save(); 
    }

    const bufferToSend = Buffer.from(finalPdfBuffer);
    return new NextResponse(bufferToSend, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Berita_Acara_${data.token}.pdf"`,
      },
    });

  } catch (error) {
    console.error("PDF Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}