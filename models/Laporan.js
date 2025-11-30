/// models/Laporan.js
import mongoose from 'mongoose';

const LaporanSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  
  // --- TAMBAHAN BARU ---
  kategori_target: {
    type: String,
    enum: ['INDUSTRI', 'FASYANKES'], // Pembeda Utama
    default: 'INDUSTRI'
  },
  
  // Lingkup kita buat default SELALU LENGKAP (A-E)
  lingkup: {
    type: [String], 
    default: ["A", "B", "C", "D", "E"] 
  }, 

  status: { type: String, enum: ['DRAFT', 'SUBMITTED'], default: 'DRAFT' },

  // --- BAGIAN I: PROFIL USAHA (Sesuai PDF Hal 1-2) ---
  profil: {
    nama_usaha: String,
    jenis_kegiatan: String,
    telepon: String,
    lokasi_usaha: String,
    holding_company: String,
    tahun_operasi: String,
    status_permodalan: String, // PMA/PMDN
    
    // Luas & Fisik
    luas_area_m2: Number,
    luas_bangunan_m2: Number,
    
    // Operasional Air
    lokasi_buang_limbah: String,
    pemanfaatan_air_limbah: String,
    no_izin_sipa: String, // Input Text
    file_sipa: String,    // URL Upload
    
    // Produksi
    debit_air_harian: Number, // m3/hari
    jam_produksi_hari: Number,
    hari_kerja_minggu: Number,
    hari_kerja_tahun: Number,
    jumlah_karyawan: Number,
    shift_kerja: Number,
    
    // Kapasitas (Array karena ada 3 kolom di PDF: Terpasang, Izin, Riil)
    kapasitas_produksi: {
      terpasang: String,
      sesuai_izin: String,
      riil: String
    },

    // Bahan & Proses
    bahan_baku_utama: String,
    bahan_baku_penolong: String,
    proses_produksi: String, // Deskripsi
    persen_export: Number,
    persen_domestik: Number,

    // Energi & Manajemen (PDF Hal 2)
    bahan_bakar: String, // Jenis
    satuan_bahan_bakar: String,
    konsumsi_bb_tahun: Number,
    sistem_manajemen_lingkungan: String, // Ada/Tidak/Sebutkan
    dokumen_lingkungan: String, // AMDAL/UKL-UPL
    tgl_inspeksi_terakhir: Date,
    ruang_terbuka_hijau_persen: Number
  },

  // --- BAGIAN II: CHECKLIST TEMUAN (Sesuai Tabel PDF Hal 3-5) ---
  // Disimpan dalam bentuk Array agar dinamis
  checklist: [
    {
      kategori: String,     // Misal: "Pencemaran Air"
      pertanyaan: String,   // Misal: "Kondisi Fisik IPAL"
      is_ada: Boolean,      // Kolom "Ada/Tidak" atau "Sesuai/Tidak"
      keterangan: String,   // Kolom Keterangan
      bukti_foto: [String]  // URL Foto (Array, jaga-jaga kalau fotonya > 1)
    }
  ],

  // --- BAGIAN III: HASIL UJI (Khusus Tabel Hal 3 Bawah) ---
  uji_udara: {
    no_param: Number,
    co2: Number,
    co: Number,
    o2: Number,
    humidity: Number,
    dew_point: Number,
    temperatur: Number
  },

  // Metadata
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  waktu_submit: Date,
  koordinat_submit: {
    lat: Number,
    lng: Number
  }
});

// Cek if model already exists to prevent overwrite error in Next.js hot reload
export default mongoose.models.Laporan || mongoose.model('Laporan', LaporanSchema);