/// models/Laporan.js
import mongoose from 'mongoose';

const LaporanSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  
  // --- HEADER & TIM ---
  tanggal_pengawasan: { type: Date, required: true },
  tim_pengawas: [{
    nama: String,
    nip: String,
    pangkat: String,
    jabatan: String,
    no_telp: String, 
    instansi: String
  }],
  
  kategori_target: {
    type: String,
    enum: ['INDUSTRI', 'FASYANKES'], 
    default: 'INDUSTRI'
  },

  status: { type: String, enum: ['DRAFT', 'SUBMITTED'], default: 'DRAFT' },

  // --- BAGIAN I: PROFIL USAHA (HARUS SAMA PERSIS DENGAN KODE PDF) ---
  profil: {
    nama_usaha: String,
    jenis_kegiatan: String,
    telepon: String,
    koordinat: String,
    lokasi_usaha: String,
    holding_company: String,
    tahun_operasi: String,
    status_permodalan: String, // PMA/PMDN 
      
    // Fisik
    luas_area: String,     // Di PDF p.luas_lahan
    luas_bangunan: String,  // Di PDF p.luas_bangunan
    
    // Operasional Air
    lokasi_buang_limbah: String,
    pemanfaatan_air: String, // Sesuai PDF (bukan pemanfaatan_air_limbah)
    no_sipa: String,         // Sesuai PDF (bukan no_izin_sipa)
    file_sipa: String,    
    
    // Khusus Fasyankes
    jumlah_tempat_tidur: String,
    file_diagram: String,
    media_pembuangan_air: String,

    // Produksi & Operasional
    penggunaan_air: String,    // Sesuai PDF (bukan debit_air_harian)
    jam_produksi: String,      // Sesuai PDF
    hari_kerja_minggu: String,
    hari_kerja_tahun: String,
    jumlah_karyawan: String,
    shift_kerja: String,
    
    // --- KAPASITAS PRODUKSI (FLAT AGAR MUDAH DI PDF) ---
    // Jangan pakai object nested { terpasang: ... } agar cocok dengan route.js
    kapasitas_terpasang: String,
    kapasitas_izin: String,
    kapasitas_riil: String,

    // Bahan & Proses
    bahan_baku_utama: String,
    bahan_baku_penolong: String,
    proses_produksi: String,
    
    // Pemasaran (Nama variabel disesuaikan dengan PDF)
    pemasaran_export: String,   // Sesuai PDF (bukan persen_export)
    pemasaran_domestik: String, // Sesuai PDF (bukan persen_domestik)
    merek_dagang: String,       // Baru

    // Energi
    bahan_bakar: String,
    satuan_bahan_bakar: String,
    konsumsi_bb: String,        // Sesuai PDF (bukan konsumsi_bb_tahun)
    
    // Manajemen
    sistem_manajemen: String,   // Sesuai PDF (bukan sistem_manajemen_lingkungan)
    dokumen_lingkungan: String,
    inspeksi_terakhir: String,  // Sesuai PDF (bukan tgl_inspeksi_terakhir)
    rth_persen: String          // Sesuai PDF
  },

  // --- BAGIAN II: FAKTA ADMINISTRATIF (BARU) ---
  fakta_administratif: [
    {
      nomor: String,
      judul: String,
      tanggal: String
    }
  ],

  // --- BAGIAN III: FAKTA LAPANGAN (BARU) ---
  fakta_lapangan: { type: String },

  // --- BAGIAN IV: ASPEK TEKNIS (BARU) ---
  aspek_teknis: {
    air_limbah: {
      sumber: String,
      status_izin: String,
      ketaatan_mutu: String,
      ketaatan_teknis: String,
      info_umum: String,
      dokumentasi: [String]
    },
    limbah_b3: {
      sumber: String,
      status_izin: String,
      ketaatan_mutu: String,
      ketaatan_teknis: String,
      info_umum: String,
      dokumentasi: [String]
    },
    udara_emisi: {
      is_ada: { type: Boolean, default: false },
      sumber: String,
      status_izin: String,
      ketaatan_mutu: String,
      ketaatan_teknis: String,
      info_umum: String,
      dokumentasi: [String]
    }
  },

  // --- LAMPIRAN CHECKLIST (LAMA) ---
  checklist: [
    {
      kategori: String,
      pertanyaan: String,
      is_ada: Boolean,
      keterangan: String,
      bukti_foto: [String]
    }
  ],

  // Metadata
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.models.Laporan || mongoose.model('Laporan', LaporanSchema);