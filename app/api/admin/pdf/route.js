import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import dbConnect from '@/lib/db';
import Laporan from '@/models/Laporan';
import fs from 'fs';
import path from 'path';

// --- HELPER: Tanggal Indo ---
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

// --- DATA MASTER CHECKLIST (SAMA) ---
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

// --- HELPER KHUSUS: AMBIL LOGO (LOKAL ATAU URL) ---
async function getLogoBase64() {
  // 1. Prioritas Utama: File Lokal di folder public
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

  // 2. Fallback: Ambil dari Wikimedia (Jika file lokal gagal/tidak ada)
  try {
    // URL Logo Sragen (Wikimedia PNG)
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

const formatDriveImg = (url) => {
  if (!url) return null;
  const idMatch = url.match(/\/d\/(.+?)\//);
  if (idMatch && idMatch[1]) return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
  return url;
};

// --- MAIN API HANDLER ---
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) return NextResponse.json({ error: 'Token wajib ada' }, { status: 400 });

    await dbConnect();
    const data = await Laporan.findOne({ token: token });

    if (!data) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });

    const isFasyankes = data.kategori_target === 'FASYANKES';
    const activeChecklist = isFasyankes ? MASTER_CHECKLIST_FASYANKES : MASTER_CHECKLIST_INDUSTRI;
    
    const dataMap = {};
    if (data.checklist && data.checklist.length > 0) {
      data.checklist.forEach(item => {
        const key = `${item.kategori}|${item.pertanyaan}`;
        dataMap[key] = item;
      });
    }

    const p = data.profil || {};
    const waktuPembuatan = data.created_at || data.createdAt; 
    const timeInfo = getIndoDate(data.tanggal_pengawasan, waktuPembuatan); 

    // --- 0. LOAD LOGO (ANTI GAGAL) ---
    const logoBase64 = await getLogoBase64(); 

    // --- 1. PRE-PROCESS GAMBAR (SIPA, DIAGRAM) ---
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
      } catch (e) {
        console.error("Gagal proses SIPA:", e);
      }
    }

    let diagramBase64 = null;
    if (isFasyankes && p.file_diagram) {
       diagramBase64 = await urlToBase64(formatDriveImg(p.file_diagram));
    }

    // --- 2. PRE-PROCESS PETA (GEOAPIFY API - DARI ENV) ---
    let mapBase64 = null;
    const GEOAPIFY_API_KEY = process.env.KEY_GEOAPIFY; 
    
    if (p.koordinat && GEOAPIFY_API_KEY) {
       try {
         const [lat, lon] = p.koordinat.split(',').map(s => s.trim());
         if(lat && lon) {
             const mapUrl = `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=300&center=lonlat:${lon},${lat}&zoom=17&marker=lonlat:${lon},${lat};color:%23ff0000;size:medium&apiKey=${GEOAPIFY_API_KEY}`;
             mapBase64 = await urlToBase64(mapUrl);
         }
       } catch (err) {
         console.error("Gagal ambil peta Geoapify:", err);
       }
    }

    // --- 3. PRE-PROCESS BUKTI FOTO LAPANGAN ---
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

    const val = (key1, key2) => {
        return p[key1] || p[key2] || '';
    };

    const timPengawas = data.tim_pengawas || [];

    // --- HTML CONTENT ---
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Berita Acara</title>
      <style>
        /* PAGE SETTING - MARGIN BAWAH KECIL */
        @page { size: A4; margin: 2cm 2cm 1cm 2cm; }
        
        body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; line-height: 1.2; }
        
        /* HEADER KOP SURAT (DENGAN LOGO) */
        .kop-table { width: 100%; border-bottom: 3px solid black; margin-bottom: 20px; padding-bottom: 10px; }
        .kop-table td { border: none !important; vertical-align: middle; }
        .kop-logo-cell { width: 15%; text-align: center; }
        .kop-text-cell { width: 85%; text-align: center; }
        
        .kop-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 2px; }
        
        .ba-body { text-align: justify; line-height: 1.5; margin-bottom: 15px; }
        
        /* STYLE HALAMAN 1 */
        .pplh-table { width: 100%; border: none; margin-bottom: 10px; }
        .pplh-table td { border: none !important; padding: 2px; vertical-align: top; }
        .pplh-label { width: 35%; }
        .pplh-sep { width: 2%; text-align: center; }
        .pplh-val { width: 63%; }

        /* STYLE HALAMAN 2 (TTD PPLH) */
        .ttd-section { margin-top: 20px; width: 100%; }
        .ttd-item { margin-bottom: 25px; page-break-inside: avoid; }
        .ttd-table { width: 100%; border: none; }
        .ttd-table td { border: none !important; padding: 4px; vertical-align: top; }
        .ttd-line { border-bottom: 1px dashed #000; width: 250px; height: 30px; display: inline-block; }

        /* --- STYLE KHUSUS FOOTER LAMPIRAN (NORMAL) --- */
        .lampiran-wrapper { width: 100%; border-collapse: collapse; border: none; }
        .lampiran-wrapper thead { display: table-header-group; }
        .lampiran-wrapper tfoot { display: table-footer-group; }
        .lampiran-wrapper tbody { display: table-row-group; }
        
        .lampiran-footer-content {
            border-top: 2px solid black;
            width: 100%;
            margin-top: 20px;
            padding-top: 5px;
            font-size: 10pt;
            font-weight: bold;
        }
        
        .footer-table { width: 100%; border: none; margin: 0; padding: 0; }
        .footer-table td { 
            border: none !important; 
            padding: 2px 0; 
            vertical-align: top;
        }

        /* STYLE STANDARD */
        .top-right-label { font-size: 10pt; margin-bottom: 20px; text-align: right; }
        .doc-title { text-align: center; margin-bottom: 5px; font-size: 12pt; font-weight: bold; }
        .doc-year { text-align: center; margin-bottom: 20px; font-size: 12pt; font-weight: bold; }
        .section-title { font-weight: bold; margin-top: 10px; margin-bottom: 5px; text-transform: uppercase; }

        .main-table { width: 100%; border: 2px solid #000; border-collapse: collapse; margin-bottom: 10px; }
        .main-table td { border: 1px solid #000 !important; padding: 4px; vertical-align: top; }
        
        .nested-table { width: 100%; margin: 0; border: none; }
        .nested-table td { border: 1px solid #000 !important; text-align: center; font-size: 10pt; }

        .check-table { width: 100%; border: 2px solid #000 !important; border-collapse: collapse; margin-top: 5px; font-size: 10pt; }
        .check-table th { border: 1px solid #000 !important; background-color: #e0e0e0 !important; -webkit-print-color-adjust: exact; text-align: center; font-weight: bold; padding: 8px; }
        .check-table td { border: 1px solid #000 !important; padding: 5px; vertical-align: middle; }
        .cat-row td { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; font-weight: bold; padding: 6px; border: 1px solid #000 !important; }
        .check-center { text-align: center; font-family: DejaVu Sans, sans-serif; font-size: 14pt; width: 50px; }
        
        .col-label { width: 35%; }
        .col-sep { width: 2%; text-align: center; }
        .col-val { width: 63%; }

        .photo-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; justify-content: flex-start; }
        .photo-item { width: 48%; border: 1px solid #000; padding: 5px; text-align: center; page-break-inside: avoid; margin-bottom: 10px; box-sizing: border-box; }
        .photo-item img { width: 100%; height: 200px; object-fit: contain; }
        .caption { font-size: 9pt; font-style: italic; margin-top: 5px; }
        .pdf-placeholder { width: 98%; border: 1px dashed #000; padding: 15px; text-align: center; background: #f9f9f9; margin-bottom: 10px; }
        
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
    
      <table class="kop-table">
        <tr>
          ${logoBase64 ? `
          <td class="kop-logo-cell">
            <img src="${logoBase64}" style="width: 80px; height: auto;" />
          </td>
          ` : ''}
          <td class="kop-text-cell">
            <div class="kop-title">BERITA ACARA</div>
            <div class="kop-title">PENGAWASAN KETAATAN LINGKUNGAN</div>
            <div class="kop-title">KABUPATEN SRAGEN</div>
          </td>
        </tr>
      </table>

      <div class="ba-body">
        Pada hari ini <b>${timeInfo.hari}</b> tanggal <b>${timeInfo.tgl}</b> bulan <b>${timeInfo.bln}</b> tahun <b>${timeInfo.thn}</b> pukul <b>${timeInfo.pukul}</b> Waktu Indonesia Bagian Barat (WIB), telah dilakukan pengawasan terhadap <b>${val('nama_usaha') || '.......'}</b> dengan hasil sebagai berikut:
      </div>

      <div class="ba-body" style="font-weight: bold;">
        A. Identitas Pejabat Pengawas Lingkungan Hidup
      </div>

      ${timPengawas.length > 0 ? timPengawas.map((petugas, idx) => `
        <div style="margin-bottom: 15px; padding-left: 15px; position: relative;">
          <div style="position: absolute; left: -15px; top: 0;">${idx + 1}.</div>
          <table class="pplh-table">
             <tr><td class="pplh-label">Nama</td><td class="pplh-sep">:</td><td class="pplh-val">${petugas.nama}</td></tr>
             <tr><td class="pplh-label">Nomor Induk Pegawai</td><td class="pplh-sep">:</td><td class="pplh-val">${petugas.nip}</td></tr>
             <tr><td class="pplh-label">Pangkat/Golongan</td><td class="pplh-sep">:</td><td class="pplh-val">${petugas.pangkat}</td></tr>
             <tr><td class="pplh-label">Jabatan</td><td class="pplh-sep">:</td><td class="pplh-val">${petugas.jabatan}</td></tr>
             <tr><td class="pplh-label">Nomor Pejabat Pengawas Lingkungan Hidup</td><td class="pplh-sep">:</td><td class="pplh-val">${petugas.no_telp || '-'}</td></tr>
             <tr><td class="pplh-label">Instansi</td><td class="pplh-sep">:</td><td class="pplh-val">${petugas.instansi || 'Dinas Lingkungan Hidup Kabupaten Sragen'}</td></tr>
          </table>
        </div>
      `).join('') : '<div style="color:red; font-style:italic;">(Belum ada petugas yang dipilih untuk laporan ini)</div>'}

      <div class="page-break"></div>

      <div class="ba-body" style="margin-top: 30px;">
        Demikian Berita Acara Pengawasan Ketaatan Industri / Fasyankes pada lokasi kegiatan <b>${val('nama_usaha') || '...........................'}</b> dibuat dengan sebenar-benarnya dan mengingat sumpah jabatan.
      </div>

      <div style="margin-top: 20px; margin-bottom: 20px; font-weight: bold;">
        Tim Pejabat Pengawas Lingkungan Hidup
      </div>

      <div class="ttd-section">
      ${timPengawas.map((p, i) => `
        <div class="ttd-item">
          <table class="ttd-table">
            <tr>
              <td style="width: 5%;">${i+1}.</td>
              <td style="width: 20%;">Nama</td>
              <td style="width: 2%;">:</td>
              <td style="width: 73%;">${p.nama}</td>
            </tr>
            <tr>
              <td></td>
              <td>Tanda tangan</td>
              <td>:</td>
              <td><div class="ttd-line"></div></td> 
            </tr>
          </table>
        </div>
      `).join('')}
      </div>

      <div class="page-break"></div>

      <table class="lampiran-wrapper">
        <thead><tr><td style="height: 0px;"></td></tr></thead>
        <tbody>
          <tr>
            <td>
              <div class="top-right-label">1 Lampiran Berita Acara</div>
              <div class="doc-title">Lampiran Berita Acara Pengawasan Penaatan Lingkungan Hidup Daerah Kab. Sragen</div>
              <div class="doc-year">Tahun ${timeInfo.thn}</div>

              <div class="section-title">I. PROFIL JENIS USAHA DAN/ATAU KEGIATAN</div>

              <table class="main-table">
                <tr><td class="col-label">Nama Jenis Usaha dan/atau Kegiatan</td><td class="col-sep">:</td><td class="col-val">${val('nama_usaha')}</td></tr>
                <tr><td class="col-label">Jenis Usaha dan/atau Kegiatan</td><td class="col-sep">:</td><td class="col-val">${data.kategori_target || ''}</td></tr>
                <tr><td class="col-label">Telepon/Fax</td><td class="col-sep">:</td><td class="col-val">${val('telepon')}</td></tr>
                <tr><td class="col-label">Lokasi Usaha dan/atau Kegiatan</td><td class="col-sep">:</td><td class="col-val">${val('lokasi_usaha')}</td></tr>
                
                <tr><td class="col-label">Koordinat Lokasi</td><td class="col-sep">:</td><td class="col-val">${val('koordinat') || '-'}</td></tr>
                <tr>
                  <td class="col-label">Peta Lokasi (Peta Digital)</td>
                  <td class="col-sep">:</td>
                  <td class="col-val">
                    ${mapBase64 ? 
                      `<img src="${mapBase64}" style="width: 100%; max-height: 250px; object-fit: cover; border: 1px solid #ccc; margin-top: 5px;" />` 
                      : 
                      '(Peta tidak tersedia. Pastikan koordinat terisi dan API Key valid)'
                    }
                  </td>
                </tr>

                <tr><td class="col-label">Holding Company</td><td class="col-sep">:</td><td class="col-val">${val('holding_company')}</td></tr>
                <tr><td class="col-label">Tahun Berdiri/beroperasi</td><td class="col-sep">:</td><td class="col-val">${val('tahun_operasi')}</td></tr>
                <tr><td class="col-label">Status Permodalan</td><td class="col-sep">:</td><td class="col-val">${val('status_permodalan')}</td></tr>
                
                <tr><td class="col-label">Luas Area Usaha</td><td class="col-sep">:</td><td class="col-val">${val('luas_area')} (m²)</td></tr>
                <tr><td class="col-label">Luas Bangunan Usaha</td><td class="col-sep">:</td><td class="col-val">${val('luas_bangunan')} (m²)</td></tr>
                
                <tr><td class="col-label">Lokasi Pembuangan Air Limbah</td><td class="col-sep">:</td><td class="col-val">${val('lokasi_buang_limbah')}</td></tr>
                <tr><td class="col-label">Pemanfaatan Kembali Air Limbah</td><td class="col-sep">:</td><td class="col-val">${val('pemanfaatan_air')}</td></tr>
                
                <tr><td class="col-label">Surat Izin SIPA (Lampirkan)</td><td class="col-sep">:</td><td class="col-val">${val('no_sipa') || 'Tidak Ada'}</td></tr>
                
                <tr><td class="col-label">Jumlah Penggunaan Air (m³/hari)</td><td class="col-sep">:</td><td class="col-val">${val('penggunaan_air')} (M³/hari)</td></tr>
                <tr><td class="col-label">Jumlah Jam Produksi / Hari</td><td class="col-sep">:</td><td class="col-val">${val('jam_produksi')} (Jam)</td></tr>
                <tr><td class="col-label">Jumlah Hari Kerja / Minggu</td><td class="col-sep">:</td><td class="col-val">${val('hari_kerja_minggu')} (hari/minggu)</td></tr>
                <tr><td class="col-label">Jumlah Hari Kerja / Tahun</td><td class="col-sep">:</td><td class="col-val">${val('hari_kerja_tahun')} (Hari)</td></tr>
                <tr><td class="col-label">Jumlah Karyawan</td><td class="col-sep">:</td><td class="col-val">${val('jumlah_karyawan')} (Orang)</td></tr>
                <tr><td class="col-label">Jam Shift Kerja/Hari</td><td class="col-sep">:</td><td class="col-val">${val('shift_kerja')} (shift kerja)</td></tr>
                
                ${isFasyankes ? `
                <tr><td class="col-label">Jumlah Tempat Tidur</td><td class="col-sep">:</td><td class="col-val">${val('jumlah_tempat_tidur')}</td></tr>
                ` : ''}

                ${!isFasyankes ? `
                <tr>
                  <td class="col-label">Kapasitas Produksi<br/>(tabung/hari/shif)</td>
                  <td class="col-sep">:</td>
                  <td style="padding: 0;">
                    <table class="nested-table">
                      <tr><td width="33%">Terpasang</td><td width="33%">Sesuai Izin</td><td width="33%">Riil</td></tr>
                      <tr>
                        <td>${p.kapasitas_terpasang || ''}<br/>(menit/bulan)</td>
                        <td>${p.kapasitas_izin || ''}<br/>(menit/bulan)</td>
                        <td>${p.kapasitas_riil || ''}<br/>(menit/tahun)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td class="col-label">Bahan Baku Utama</td><td class="col-sep">:</td><td class="col-val">${val('bahan_baku_utama')}</td></tr>
                <tr><td class="col-label">Bahan Baku Penolong</td><td class="col-sep">:</td><td class="col-val">${val('bahan_baku_penolong')}</td></tr>
                <tr><td class="col-label">Proses Produksi</td><td class="col-sep">:</td><td class="col-val">${val('proses_produksi')}</td></tr>
                <tr><td class="col-label">Prosentase Pemasaran Export</td><td class="col-sep">:</td><td class="col-val">${val('pemasaran_export')} %</td></tr>
                ` : ''}
              </table>

              <div style="page-break-before: always;"></div>

              <table class="main-table" style="margin-top: 20px;">
                ${!isFasyankes ? `
                <tr><td class="col-label">Prosentase Pemasaran Domestik</td><td class="col-sep">:</td><td class="col-val">${val('pemasaran_domestik')} %</td></tr>
                <tr><td class="col-label">Merek Dagang</td><td class="col-sep">:</td><td class="col-val">${val('merek_dagang')}</td></tr>
                ` : ''}
                
                ${isFasyankes ? `
                <tr><td class="col-label">Media Tempat Pembuangan Air Limbah</td><td class="col-sep">:</td><td class="col-val">${val('media_pembuangan_air')}</td></tr>
                ` : `
                <tr><td class="col-label">Bahan Bakar Yang Digunakan</td><td class="col-sep">:</td><td class="col-val">${val('bahan_bakar')}</td></tr>
                <tr><td class="col-label">Satuan Bahan Bakar</td><td class="col-sep">:</td><td class="col-val">${val('satuan_bahan_bakar')}</td></tr>
                <tr><td class="col-label">Jumlah Konsumsi Bahan Bakar/th</td><td class="col-sep">:</td><td class="col-val">${val('konsumsi_bb')}</td></tr>
                `}

                <tr><td class="col-label">Sistem Manajemen Lingkungan</td><td class="col-sep">:</td><td class="col-val">${val('sistem_manajemen')}</td></tr>
                <tr><td class="col-label">Dokumen Lingkungan</td><td class="col-sep">:</td><td class="col-val">${val('dokumen_lingkungan')}</td></tr>
                <tr><td class="col-label">Inspeksi Terakhir</td><td class="col-sep">:</td><td class="col-val">${p.inspeksi_terakhir ? new Date(p.inspeksi_terakhir).toLocaleDateString('id-ID') : ''}</td></tr>
              </table>

              <div style="margin: 15px 0; font-size: 10pt; font-style: italic; border: 1px solid #000; padding: 5px;">
                Setiap pelaku usaha harus memiliki Ruang Terbuka Hijau (RTH) sejumlah 10%-20% dari luas lahan usaha dan/atau kegiatan.<br/>
                <b>Realisasi RTH: ${val('rth_persen')} %</b>
              </div>

              <div style="page-break-before: always;"></div>

              <div class="section-title">II. RINGKASAN TEMUAN LAPANGAN</div>

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
                          <td class="check-center border" style="font-family: DejaVu Sans, sans-serif; font-size: 14pt; font-weight: bold;">
                            ${isCentangAda ? 'V' : ''}
                          </td>
                          <td class="check-center border" style="font-family: DejaVu Sans, sans-serif; font-size: 14pt; font-weight: bold;">
                            ${isCentangTidak ? 'V' : ''}
                          </td>
                          <td class="border">${dataItem?.keterangan || ''}</td>
                        </tr>
                        `;
                      }).join('');

                      return `
                        <tr class="cat-row">
                          <td colspan="4">${category.kategori}</td>
                        </tr>
                        ${listItems}
                      `;
                    }).join('')}
                  </tbody>
                </table>

              <div style="page-break-before: always;"></div>

              <div class="section-title">III. DOKUMENTASI LAMPIRAN</div>
              
              ${sipaBase64 ? `
                <div style="margin-bottom: 20px; page-break-inside: avoid;">
                   <b>Dokumen SIPA:</b><br/>
                   <div class="photo-item" style="width: 100%;">
                     <img src="${sipaBase64}" alt="SIPA" style="max-height: 400px; object-fit: contain;" />
                     <div class="caption">Bukti Dokumen SIPA</div>
                   </div>
                </div>
              ` : ''}

              ${sipaIsPdf ? `
                <div class="pdf-placeholder">
                   <b>Dokumen SIPA (PDF)</b><br/>
                   <i>Dokumen ini berupa file PDF dan telah dilampirkan secara utuh pada halaman paling akhir laporan ini.</i>
                </div>
              ` : ''}

              ${diagramBase64 ? `
                <div style="margin-bottom: 20px; page-break-inside: avoid;">
                   <b>Diagram Alir Proses:</b><br/>
                   <div class="photo-item" style="width: 100%;">
                     <img src="${diagramBase64}" alt="Diagram" style="max-height: 400px; object-fit: contain;" />
                     <div class="caption">Lampiran Diagram Alir</div>
                   </div>
                </div>
              ` : ''}
              
              <div class="photo-grid">
                ${data.checklist.map(item => {
                   const key = `${item.kategori}|${item.pertanyaan}`;
                   const imgBase64 = fotoChecklistMap[key]; 

                   if(imgBase64) {
                     return `
                       <div class="photo-item">
                         <img src="${imgBase64}" alt="Bukti" />
                         <div class="caption">Bukti: ${item.pertanyaan}</div>
                       </div>
                     `;
                   }
                   return '';
                }).join('')}
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td>
              <div class="lampiran-footer-content">
                <div style="font-weight: bold; margin-bottom: 5px;">Mengetahui:</div>
                <table class="footer-table">
                  <tr>
                    <td style="width: 50%;">Petugas Perusahaan : (.....................................................)</td>
                    <td style="width: 50%;">Tim Pengawas Penaatan LH : (.....................................................)</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>

    </body>
    </html>
    `;

    // --- SETUP PUPPETEER ---
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
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
      });
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

    // --- MERGE PDF SIPA (JIKA PDF) ---
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