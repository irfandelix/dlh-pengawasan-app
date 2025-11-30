import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import dbConnect from '@/lib/db';
import Laporan from '@/models/Laporan';

// --- DATA MASTER CHECKLIST (SAMA SEPERTI SEBELUMNYA) ---
const MASTER_CHECKLIST = [
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
      "Usaha dan/atau kegiatan yang memiliki jumlah pekerja sama dengan atau lebih dari 1000 orang wajib memiliki sarana pengolah sampah organik (minimal komposter)",
      "Pemanfaatan Sampah",
      "Jenis Sampah yang dimanfaatkan kembali"
    ]
  }
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) return NextResponse.json({ error: 'Token wajib ada' }, { status: 400 });

    await dbConnect();
    const data = await Laporan.findOne({ token: token });

    if (!data) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });

    // --- HELPERS ---
    const formatDriveImg = (url) => {
      if (!url) return null;
      const idMatch = url.match(/\/d\/(.+?)\//);
      if (idMatch && idMatch[1]) return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
      return url;
    };

    const p = data.profil || {};
    
    // --- LOGIC DETEKSI TIPE FILE SIPA (PDF vs IMAGE) ---
    let sipaIsPdf = false;
    let sipaBuffer = null;
    let sipaImgUrl = null;

    if (p.file_sipa) {
      const driveUrl = formatDriveImg(p.file_sipa);
      try {
        const res = await fetch(driveUrl);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.toString('utf-8', 0, 4) === '%PDF') {
          sipaIsPdf = true;
          sipaBuffer = buffer; 
        } else {
          sipaImgUrl = driveUrl; 
        }
      } catch (e) {
        console.error("Gagal fetch SIPA:", e);
        sipaImgUrl = formatDriveImg(p.file_sipa);
      }
    }

    // --- MAPPING DATA CHECKLIST ---
    const dataMap = {};
    if (data.checklist && data.checklist.length > 0) {
      data.checklist.forEach(item => {
        const key = `${item.kategori}|${item.pertanyaan}`;
        dataMap[key] = item;
      });
    }

    // --- HTML CONTENT ---
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Berita Acara Pengawasan</title>
      <style>
        @page { size: A4; margin: 1.5cm 2cm 3.5cm 2cm; }
        body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; line-height: 1.2; }
        .top-right-label { font-size: 10pt; margin-bottom: 20px; text-align: right; }
        .doc-title { text-align: center; margin-bottom: 5px; font-size: 12pt; font-weight: bold; }
        .doc-year { text-align: center; margin-bottom: 20px; font-size: 12pt; font-weight: bold; }
        .section-title { font-weight: bold; margin-top: 10px; margin-bottom: 5px; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; }
        td, th { vertical-align: top; padding: 3px; }
        tr { page-break-inside: avoid; }
        .main-table { border: 1px solid #000; margin-bottom: 10px; width: 100%; font-size: 11pt; }
        .main-table td { border: 1px solid #000; }
        .col-label { width: 35%; }
        .col-sep { width: 2%; text-align: center; }
        .col-val { width: 63%; }
        .nested-table { width: 100%; border-collapse: collapse; margin: 0; }
        .nested-table td { border: 1px solid #000; text-align: center; font-size: 10pt; padding: 4px; }
        .nested-table tr:first-child td { border-top: none; }
        .nested-table tr:last-child td { border-bottom: none; }
        .nested-table td:first-child { border-left: none; }
        .nested-table td:last-child { border-right: none; }
        .check-table { width: 100%; border: 1px solid #000; margin-top: 5px; font-size: 10pt; }
        .check-table th, .check-table td { border: 1px solid #000; padding: 4px; vertical-align: middle; }
        .check-table thead th { background-color: #ffffff; text-align: center; font-weight: bold; border-bottom: 2px solid #000; }
        .cat-row td { background-color: #f2f2f2; font-weight: bold; padding: 5px; border-top: 2px solid #000; border-bottom: 1px solid #000; }
        .check-center { text-align: center; font-size: 12pt; font-family: DejaVu Sans, sans-serif; }
        .footer-signature { position: fixed; bottom: -2.5cm; left: 0; right: 0; height: 2.5cm; font-size: 7pt; font-weight: bold; background-color: white; z-index: 1000; }
        .sig-line { border-top: 2px solid #000; margin-bottom: 5px; width: 100%; }
        .sig-table { width: 100%; border: none; font-size: 7pt; font-weight: bold; }
        .sig-table td { border: none; vertical-align: top; padding: 2px 0; }
        .photo-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
        .photo-item { width: 48%; border: 1px solid #000; padding: 5px; text-align: center; page-break-inside: avoid; }
        .photo-item img { max-width: 100%; max-height: 200px; object-fit: contain; }
        .caption { font-size: 9pt; font-style: italic; margin-top: 5px; }
        .pdf-placeholder { width: 98%; border: 1px dashed #000; padding: 15px; text-align: center; background: #f9f9f9; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="top-right-label">1 Lampiran Berita Acara</div>
      <div class="doc-title">Lampiran Berita Acara Pengawasan Penaatan Lingkungan Hidup Daerah Kab. Sragen</div>
      <div class="doc-year">Tahun 2025</div>
      
      ${htmlContentBody(p, data, dataMap, sipaImgUrl, sipaIsPdf, MASTER_CHECKLIST, formatDriveImg)}
      
    </body>
    </html>
    `;

    const footerTemplate = `
      <div style="font-family: 'Times New Roman', serif; font-size: 8px; width: 100%; margin: 0 2cm; padding-bottom: 5px;">
        <div style="border-top: 2px solid black; width: 100%; margin-bottom: 2px;"></div>
        <div style="font-weight: bold; margin-bottom: 5px;">Mengetahui:</div>
        <div style="display: flex; justify-content: space-between; width: 100%; font-weight: bold;">
          <span>Petugas Perusahaan : (...........................................................................)</span>
          <span>Tim Pengawas Penaatan LH : (...........................................................................)</span>
        </div>
      </div>
    `;

    // --- SETUP PUPPETEER HYBRID FINAL ---
    let browser;
    
    if (process.env.NODE_ENV === 'production') {
      // --- MODE VERCEL (Production) ---
      const chromium = await import('@sparticuz/chromium-min').then(mod => mod.default);
      const puppeteerCore = await import('puppeteer-core').then(mod => mod.default);

      // KONFIGURASI PENTING UNTUK VERCEL:
      // Kita arahkan ke URL remote agar tidak error "directory not found"
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
      // --- MODE LOCAL (Development) ---
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
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: footerTemplate,
      margin: { top: '1.5cm', right: '2cm', bottom: '3.5cm', left: '2cm' }
    });

    await browser.close();

    // --- MERGE PDF LOGIC ---
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

// --- HELPER FUNCTION UNTUK BODY HTML (Supaya rapi) ---
function htmlContentBody(p, data, dataMap, sipaImgUrl, sipaIsPdf, MASTER_CHECKLIST, formatDriveImg) {
    return `
      <div class="section-title">I. PROFIL JENIS USAHA DAN/ATAU KEGIATAN</div>

      <table class="main-table">
        <tr><td class="col-label">Nama Jenis Usaha dan/atau Kegiatan</td><td class="col-sep">:</td><td class="col-val">${p.nama_usaha || ''}</td></tr>
        <tr><td class="col-label">Jenis Usaha dan/atau Kegiatan</td><td class="col-sep">:</td><td class="col-val">${data.kategori_target || ''}</td></tr>
        <tr><td class="col-label">Telepon/Fax</td><td class="col-sep">:</td><td class="col-val">${p.telepon || ''}</td></tr>
        <tr><td class="col-label">Lokasi Usaha dan/atau Kegiatan</td><td class="col-sep">:</td><td class="col-val">${p.lokasi_usaha || ''}</td></tr>
        <tr><td class="col-label">Holding Company</td><td class="col-sep">:</td><td class="col-val">${p.holding_company || ''}</td></tr>
        <tr><td class="col-label">Tahun Berdiri/beroperasi</td><td class="col-sep">:</td><td class="col-val">${p.tahun_operasi || ''}</td></tr>
        <tr><td class="col-label">Status Permodalan</td><td class="col-sep">:</td><td class="col-val">${p.status_permodalan || ''}</td></tr>
        <tr><td class="col-label">Luas Area Usaha</td><td class="col-sep">:</td><td class="col-val">${p.luas_area_m2 || p.luas_area || ''} (m²)</td></tr>
        <tr><td class="col-label">Luas Bangunan Usaha</td><td class="col-sep">:</td><td class="col-val">${p.luas_bangunan_m2 || p.luas_bangunan || ''} (m²)</td></tr>
        <tr><td class="col-label">Lokasi Pembuangan Air Limbah</td><td class="col-sep">:</td><td class="col-val">${p.lokasi_buang_limbah || ''}</td></tr>
        <tr><td class="col-label">Pemanfaatan Kembali Air Limbah</td><td class="col-sep">:</td><td class="col-val">${p.pemanfaatan_air_limbah || p.pemanfaatan_air || ''}</td></tr>
        <tr><td class="col-label">Surat Izin SIPA (Lampirkan)</td><td class="col-sep">:</td><td class="col-val">${p.no_izin_sipa || p.no_sipa || 'Tidak Ada'}</td></tr>
        <tr><td class="col-label">Jumlah Penggunaan Air (m³/hari)</td><td class="col-sep">:</td><td class="col-val">${p.debit_air_harian || p.penggunaan_air || ''} (M³/hari)</td></tr>
        <tr><td class="col-label">Jumlah Jam Produksi / Hari</td><td class="col-sep">:</td><td class="col-val">${p.jam_produksi_hari || p.jam_produksi || ''} (Jam)</td></tr>
        <tr><td class="col-label">Jumlah Hari Kerja / Minggu</td><td class="col-sep">:</td><td class="col-val">${p.hari_kerja_minggu || ''} (hari/minggu)</td></tr>
        <tr><td class="col-label">Jumlah Hari Kerja / Tahun</td><td class="col-sep">:</td><td class="col-val">${p.hari_kerja_tahun || ''} (Hari)</td></tr>
        <tr><td class="col-label">Jumlah Karyawan</td><td class="col-sep">:</td><td class="col-val">${p.jumlah_karyawan || ''} (Orang)</td></tr>
        <tr><td class="col-label">Jam Shift Kerja/Hari</td><td class="col-sep">:</td><td class="col-val">${p.shift_kerja || ''} (shift kerja)</td></tr>
        
        <tr>
          <td class="col-label">Kapasitas Produksi<br/>(tabung/hari/shif)</td>
          <td class="col-sep">:</td>
          <td style="padding: 0;">
            <table class="nested-table">
              <tr><td width="33%">Terpasang</td><td width="33%">Sesuai Izin</td><td width="33%">Riil</td></tr>
              <tr>
                <td>${p.kapasitas_produksi?.terpasang || p.kapasitas_terpasang || ''}<br/>(menit/bulan)</td>
                <td>${p.kapasitas_produksi?.sesuai_izin || p.kapasitas_izin || ''}<br/>(menit/bulan)</td>
                <td>${p.kapasitas_produksi?.riil || p.kapasitas_riil || ''}<br/>(menit/tahun)</td>
              </tr>
            </table>
          </td>
        </tr>

        <tr><td class="col-label">Bahan Baku Utama</td><td class="col-sep">:</td><td class="col-val">${p.bahan_baku_utama || ''}</td></tr>
        <tr><td class="col-label">Bahan Baku Penolong</td><td class="col-sep">:</td><td class="col-val">${p.bahan_baku_penolong || ''}</td></tr>
        <tr><td class="col-label">Proses Produksi</td><td class="col-sep">:</td><td class="col-val">${p.proses_produksi || ''}</td></tr>
        <tr><td class="col-label">Prosentase Pemasaran Export</td><td class="col-sep">:</td><td class="col-val">${p.persen_export || p.pemasaran_export || ''}</td></tr>
      </table>

      <div style="page-break-before: always;"></div>

      <table class="main-table" style="margin-top: 20px;">
        <tr><td class="col-label">Prosentase Pemasaran Domestik</td><td class="col-sep">:</td><td class="col-val">${p.persen_domestik || p.pemasaran_domestik || ''}</td></tr>
        <tr><td class="col-label">Merek Dagang</td><td class="col-sep">:</td><td class="col-val">${p.merek_dagang || ''}</td></tr>
        <tr><td class="col-label">Bahan Bakar Yang Digunakan</td><td class="col-sep">:</td><td class="col-val">${p.bahan_bakar || ''}</td></tr>
        <tr><td class="col-label">Satuan Bahan Bakar</td><td class="col-sep">:</td><td class="col-val">${p.satuan_bahan_bakar || ''}</td></tr>
        <tr><td class="col-label">Jumlah Konsumsi Bahan Bakar/th</td><td class="col-sep">:</td><td class="col-val">${p.konsumsi_bb_tahun || p.konsumsi_bb || ''}</td></tr>
        <tr><td class="col-label">Sistem Manajemen Lingkungan</td><td class="col-sep">:</td><td class="col-val">${p.sistem_manajemen_lingkungan || p.sistem_manajemen || ''}</td></tr>
        <tr><td class="col-label">Dokumen Lingkungan</td><td class="col-sep">:</td><td class="col-val">${p.dokumen_lingkungan || ''}</td></tr>
        <tr><td class="col-label">Inspeksi Terakhir</td><td class="col-sep">:</td><td class="col-val">${p.tgl_inspeksi_terakhir || p.inspeksi_terakhir ? new Date(p.tgl_inspeksi_terakhir || p.inspeksi_terakhir).toLocaleDateString('id-ID') : ''}</td></tr>
      </table>

      <div style="margin: 15px 0; font-size: 10pt; font-style: italic; border: 1px solid #000; padding: 5px;">
        Setiap pelaku usaha harus memiliki Ruang Terbuka Hijau (RTH) sejumlah 10%-20% dari luas lahan usaha dan/atau kegiatan.<br/>
        <b>Realisasi RTH: ${p.ruang_terbuka_hijau_persen || p.rth_persen || '0'} %</b>
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
          ${MASTER_CHECKLIST.map(category => {
            const listItems = category.items.map(pertanyaan => {
              const key = `${category.kategori}|${pertanyaan}`;
              const dataItem = dataMap[key]; 

              return `
              <tr>
                <td style="padding-left: 10px;">${pertanyaan}</td>
                <td class="check-center border">${dataItem?.is_ada === true ? '✔' : ''}</td>
                <td class="check-center border">${dataItem?.is_ada === false ? '✔' : ''}</td>
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
      
      ${sipaImgUrl ? `
        <div style="margin-bottom: 20px;">
           <b>Dokumen SIPA:</b><br/>
           <div class="photo-item">
             <img src="${sipaImgUrl}" alt="SIPA" />
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
      
      <div class="photo-grid">
        ${data.checklist.map(item => {
           if(item.bukti_foto && item.bukti_foto.length > 0) {
             const imgUrl = formatDriveImg(item.bukti_foto[0]);
             return `
               <div class="photo-item">
                 <img src="${imgUrl}" alt="Bukti" />
                 <div class="caption">Bukti: ${item.pertanyaan}</div>
               </div>
             `;
           }
           return '';
        }).join('')}
      </div>
    `;
}