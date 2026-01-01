import mongoose from "mongoose";

// --- BAGIAN INI KEMUNGKINAN HILANG DI KODINGANMU SEBELUMNYA ---
const PplhSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  nip: { type: String, required: true },
  pangkat: { type: String, required: true },
  jabatan: { type: String, required: true },
  no_telp: { type: String, required: true },
  instansi: { type: String, default: "DLH Kab. Sragen" },
}, { timestamps: true });
// ---------------------------------------------------------------

// Pastikan export menggunakan variabel "PplhSchema" yang sudah didefinisikan di atas
export default mongoose.models.Pplh || mongoose.model("Pplh", PplhSchema);