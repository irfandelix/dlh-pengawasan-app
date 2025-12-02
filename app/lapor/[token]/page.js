'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// ==========================================
// 1. DATA MASTER CHECKLIST: INDUSTRI (45 Soal)
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

// ==========================================
// 2. DATA MASTER CHECKLIST: FASYANKES (39 Soal)
// ==========================================
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

export default function FormLaporanPage() {
  const params = useParams(); 
  const router = useRouter();
  const token = params.token;

  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeChecklist, setActiveChecklist] = useState([]); // State untuk menyimpan List Pertanyaan
  
  const [formData, setFormData] = useState({
    token: token,
    profil: {},
    checklist: []
  });

  // --- LOGIC 1: FETCH DATA AWAL ---
  useEffect(() => {
    const fetchInitialData = async () => {
       try {
         // Kita gunakan endpoint GET by Token yang sudah dibuat di route
         // Ganti endpoint ini sesuai route backend kamu (misal: /api/lapor/[token] atau /api/cek-token)
         // Asumsi pakai: /api/admin/pdf (karena route ini punya GET by token yg lengkap) 
         // ATAU kalau kamu punya route khusus untuk cek token user, pakai itu.
         // Disini saya pakai logika fetch yang ada di kode kamu sebelumnya: /api/cek-token
         
         const res = await fetch('/api/cek-token', { // Pastikan route ini ada dan mengembalikan kategori_target
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ token })
         });
         const json = await res.json();
         
         if(json.success) {
            // 1. SET LIST PERTANYAAN BERDASARKAN KATEGORI
            if (json.data.kategori_target === 'FASYANKES' || json.data.kategori === 'FASYANKES') {
                setActiveChecklist(MASTER_CHECKLIST_FASYANKES);
            } else {
                setActiveChecklist(MASTER_CHECKLIST_INDUSTRI);
            }

            // 2. SET DATA FORM (Draft atau Baru)
            const draft = localStorage.getItem(`draft_${token}`);
            if (draft) {
               const parsedDraft = JSON.parse(draft);
               setFormData(prev => ({ 
                 ...parsedDraft, 
                 profil: { 
                   ...parsedDraft.profil, 
                   nama_usaha: json.data.nama_usaha,
                   kategori: json.data.kategori_target || json.data.kategori // Pastikan field match DB
                 } 
               }));
            } else {
               setFormData(prev => ({
                 ...prev,
                 profil: { 
                   ...prev.profil, 
                   nama_usaha: json.data.nama_usaha,
                   kategori: json.data.kategori_target || json.data.kategori
                 }
               }));
            }
         } else {
            alert("Token tidak valid atau sudah digunakan!");
            router.push('/');
         }
       } catch (err) {
         console.error(err);
         alert("Gagal mengambil data server.");
       }
    };

    if(token) fetchInitialData();
  }, [token, router]);

  // --- LOGIC 2: AUTO SAVE ---
  useEffect(() => {
    if (token && formData.token) {
      localStorage.setItem(`draft_${token}`, JSON.stringify(formData));
    }
  }, [formData, token]);

  // --- LOGIC 3: HANDLERS ---
  const handleProfilChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      profil: { ...prev.profil, [name]: value }
    }));
  };

  const handleChecklistChange = (kategori, pertanyaan, field, value) => {
    setFormData(prev => {
      const existingIndex = prev.checklist.findIndex(
        item => item.kategori === kategori && item.pertanyaan === pertanyaan
      );

      let newChecklist = [...prev.checklist];

      if (existingIndex > -1) {
        newChecklist[existingIndex] = {
          ...newChecklist[existingIndex],
          [field]: value
        };
      } else {
        newChecklist.push({
          kategori,
          pertanyaan,
          [field]: value,
          is_ada: field === 'is_ada' ? value : false
        });
      }
      return { ...prev, checklist: newChecklist };
    });
  };

  const getChecklistValue = (kategori, pertanyaan, field) => {
    const item = formData.checklist.find(
      i => i.kategori === kategori && i.pertanyaan === pertanyaan
    );
    if (!item) return "";
    return item[field];
  };

  // --- LOGIC 4: UPLOAD ---
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleFileUpload = async (e, context, extraParam) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert(`File terlalu besar! Maksimal 5MB.\nFile Anda: ${(file.size/1024/1024).toFixed(2)} MB`);
      e.target.value = "";
      return;
    }

    const btnLabel = e.target.parentElement.querySelector('span') || e.target.parentElement;
    const originalText = btnLabel.innerText;
    btnLabel.innerText = "⏳ Uploading...";

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      });
      const json = await res.json();

      if (json.success) {
        if (context === 'SIPA') {
          setFormData(prev => ({
            ...prev,
            profil: { ...prev.profil, file_sipa: json.file_url }
          }));
          alert("Berkas SIPA Berhasil Diupload!");
        // --- [BARU] LOGIC UNTUK UPLOAD DIAGRAM ALIR ---
        } else if (context === 'DIAGRAM') {
          setFormData(prev => ({
            ...prev,
            profil: { ...prev.profil, file_diagram: json.file_url }
          }));
          alert("Diagram Alir Berhasil Diupload!");
        // ----------------------------------------------
        } else if (context === 'CHECKLIST') {
          handleChecklistChange(extraParam.kategori, extraParam.pertanyaan, 'bukti_foto', [json.file_url]);
          alert("Bukti Foto Berhasil Diupload!");
        }
        btnLabel.innerText = "✅ File Tersimpan";
      } else {
        alert("Gagal Upload: " + json.error);
        btnLabel.innerText = originalText;
        e.target.value = "";
      }
    } catch (err) {
      console.error(err);
      alert("Error jaringan saat upload.");
      btnLabel.innerText = originalText;
      e.target.value = "";
    }
  };

  // --- LOGIC 5: SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Mencegah reload halaman
    
    if(!confirm("KIRIM LAPORAN SEKARANG?\n\nPastikan data sudah benar. Data tidak dapat diubah setelah dikirim.")) return;
    
    setIsSubmitting(true);
    
    try {
      // PENTING: Ambil data checklist terbaru dari State formData
      // Convert Object Map menjadi Array agar bisa disimpan di MongoDB
      const checklistArray = Object.values(formData.checklist || {}); 
      
      // Jika checklistArray kosong (karena user mungkin belum isi apa-apa tapi langsung submit)
      // Kita harus tetap kirim array kosong atau data yang ada
      
      const payload = {
        token: token,
        profil: formData.profil,
        checklist: formData.checklist, // Kirim checklist yang sudah berbentuk Array (karena handleChecklistChange sudah menyimpannya sebagai array)
        status: 'SUBMITTED'
      };

      const res = await fetch('/api/laporan', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (json.success) {
        alert("✅ TERIMA KASIH! Laporan berhasil disimpan ke Database.");
        localStorage.removeItem(`draft_${token}`);
        router.push('/sukses');
      } else {
        alert("Gagal kirim: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper untuk cek kategori saat render
  const isFasyankes = formData.profil.kategori === 'FASYANKES';

  return (
    <div 
      className="min-h-screen py-10 px-4 font-sans bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ 
        backgroundImage: "url('/bg-pengawasan.webp')",
        boxShadow: "inset 0 0 0 1000px rgba(245, 245, 245, 0.9)" 
      }}
    >
      <div className="max-w-5xl mx-auto bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl overflow-hidden border border-white/50">
        
        {/* HEADER */}
        <div className="bg-green-700 p-6 text-white">
          <h1 className="text-2xl font-bold">Formulir Pengawasan Lingkungan 2025</h1>
          <p className="opacity-90 mt-1 text-sm">
            Token: <span className="font-mono bg-green-800 px-2 py-1 rounded">{token}</span> 
            <span className="ml-2 bg-white text-green-800 px-2 py-0.5 rounded text-xs font-bold">
              {formData.profil.kategori || 'LOADING...'}
            </span>
          </p>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
          <button 
            onClick={() => setActiveTab(1)}
            className={`flex-1 py-4 font-semibold text-sm transition-colors ${activeTab === 1 ? 'border-b-4 border-green-600 text-green-700 bg-white' : 'text-gray-500 hover:text-green-600'}`}
          >
            I. PROFIL USAHA
          </button>
          <button 
            onClick={() => setActiveTab(2)}
            className={`flex-1 py-4 font-semibold text-sm transition-colors ${activeTab === 2 ? 'border-b-4 border-green-600 text-green-700 bg-white' : 'text-gray-500 hover:text-green-600'}`}
          >
            II. CHECKLIST KETAATAN
          </button>
        </div>

        <div className="p-8">
          
          {/* --- TAB 1: PROFIL USAHA --- */}
          {activeTab === 1 && (
            <div className="space-y-8 animate-fade-in">
              
              {/* A. IDENTITAS PERUSAHAAN */}
              <div>
                <h3 className="text-lg font-bold text-green-800 border-b-2 border-green-100 pb-2 mb-4">A. Identitas Perusahaan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label-text">Nama Jenis Usaha / Kegiatan</label>
                    <input type="text" name="nama_usaha" value={formData.profil.nama_usaha || ''} onChange={handleProfilChange} className="input-field bg-gray-200 cursor-not-allowed" readOnly />
                  </div>
                  <div>
                    <label className="label-text">Telepon / Fax</label>
                    <input type="text" name="telepon" value={formData.profil.telepon || ''} onChange={handleProfilChange} className="input-field" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label-text">Lokasi Usaha dan/atau Kegiatan</label>
                    <textarea name="lokasi_usaha" value={formData.profil.lokasi_usaha || ''} onChange={handleProfilChange} rows="2" className="input-field" placeholder="Alamat lengkap..."></textarea>
                  </div>
                  <div>
                    <label className="label-text">Holding Company</label>
                    <input type="text" name="holding_company" value={formData.profil.holding_company || ''} onChange={handleProfilChange} className="input-field" />
                  </div>
                  <div>
                    <label className="label-text">Tahun Berdiri / Beroperasi</label>
                    <input type="number" name="tahun_operasi" value={formData.profil.tahun_operasi || ''} onChange={handleProfilChange} className="input-field" placeholder="Tahun (Contoh: 2010)" />
                  </div>
                  <div>
                    <label className="label-text">Status Permodalan</label>
                    <select name="status_permodalan" value={formData.profil.status_permodalan || ''} onChange={handleProfilChange} className="input-field">
                      <option value="">- Pilih Status -</option>
                      <option value="PMDN">PMDN (Penanaman Modal Dalam Negeri)</option>
                      <option value="PMA">PMA (Penanaman Modal Asing)</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Luas Area Usaha (m²)</label>
                    <input type="number" name="luas_area" value={formData.profil.luas_area || ''} onChange={handleProfilChange} className="input-field" placeholder="0" />
                  </div>
                  <div>
                    <label className="label-text">Luas Bangunan (m²)</label>
                    <input type="number" name="luas_bangunan" value={formData.profil.luas_bangunan || ''} onChange={handleProfilChange} className="input-field" placeholder="0" />
                  </div>
                </div>
              </div>

              {/* B. OPERASIONAL & AIR */}
              <div>
                <h3 className="text-lg font-bold text-green-800 border-b-2 border-green-100 pb-2 mb-4">B. Operasional & Penggunaan Air</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label-text">Lokasi Pembuangan Air Limbah</label>
                    <input type="text" name="lokasi_buang_limbah" value={formData.profil.lokasi_buang_limbah || ''} onChange={handleProfilChange} className="input-field" placeholder="Sungai / Saluran Kota" />
                  </div>
                  <div>
                    <label className="label-text">Pemanfaatan Kembali Air Limbah</label>
                    <input type="text" name="pemanfaatan_air" value={formData.profil.pemanfaatan_air || ''} onChange={handleProfilChange} className="input-field" placeholder="Ada/Tidak (Jelaskan)" />
                  </div>
                  
                  {/* SIPA dengan Upload */}
                  <div className="md:col-span-2 bg-blue-50 p-4 rounded-md border border-blue-100">
                    <label className="label-text text-blue-800">Surat Izin Pemanfaatan Air Tanah (SIPA)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <input type="text" name="no_sipa" value={formData.profil.no_sipa || ''} onChange={handleProfilChange} className="input-field" placeholder="Nomor SIPA" />
                        <div className="flex flex-col justify-center">
                          <label className="cursor-pointer bg-white border border-blue-300 text-blue-700 px-4 py-2 rounded hover:bg-blue-50 text-sm font-medium text-center shadow-sm transition-all hover:shadow-md">
                             <span>{formData.profil.file_sipa ? "✅ Berkas Terupload (Ganti?)" : "📂 Upload Scan SIPA (PDF)"}</span>
                             <input 
                               type="file" 
                               accept="application/pdf,image/*"
                               className="hidden"
                               onChange={(e) => handleFileUpload(e, 'SIPA')}
                             />
                          </label>
                          <p className="text-xs text-gray-400 mt-1 text-center">Maksimal 5MB</p>
                        </div>
                    </div>
                  </div>

                  <div>
                    <label className="label-text">Penggunaan Air (m³/hari)</label>
                    <input type="number" name="penggunaan_air" value={formData.profil.penggunaan_air || ''} onChange={handleProfilChange} className="input-field" step="0.01" />
                  </div>
                  <div>
                    <label className="label-text">Jam Kerja / Hari</label>
                    <input type="number" name="jam_kerja" value={formData.profil.jam_kerja || ''} onChange={handleProfilChange} className="input-field" />
                  </div>
                  <div>
                    <label className="label-text">Hari Kerja / Minggu</label>
                    <input type="number" name="hari_kerja_minggu" value={formData.profil.hari_kerja_minggu || ''} onChange={handleProfilChange} className="input-field" />
                  </div>
                  <div>
                    <label className="label-text">Hari Kerja / Tahun</label>
                    <input type="number" name="hari_kerja_tahun" value={formData.profil.hari_kerja_tahun || ''} onChange={handleProfilChange} className="input-field" />
                  </div>
                  <div>
                    <label className="label-text">Jumlah Karyawan (Orang)</label>
                    <input type="number" name="jumlah_karyawan" value={formData.profil.jumlah_karyawan || ''} onChange={handleProfilChange} className="input-field" />
                  </div>
                  <div>
                    <label className="label-text">Shift Kerja / Hari</label>
                    <input type="number" name="shift_kerja" value={formData.profil.shift_kerja || ''} onChange={handleProfilChange} className="input-field" />
                  </div>
                  
                  {/* FIELD KHUSUS FASYANKES */}
                  {isFasyankes && (
                    <div className="bg-yellow-50 p-4 border border-yellow-200 rounded md:col-span-2">
                        <label className="label-text text-yellow-800">Jumlah Tempat Tidur (Khusus Fasyankes)</label>
                        <input type="number" name="jumlah_tempat_tidur" value={formData.profil.jumlah_tempat_tidur || ''} onChange={handleProfilChange} className="input-field mt-1" />
                    </div>
                  )}

                </div>
              </div>

              {/* C. PRODUKSI (HANYA MUNCUL JIKA BUKAN FASYANKES/INDUSTRI) */}
              {!isFasyankes && (
              <div>
                <h3 className="text-lg font-bold text-green-800 border-b-2 border-green-100 pb-2 mb-4">C. Kapasitas & Proses Produksi</h3>
                
                {/* Tabel Kapasitas Produksi */}
                <div className="overflow-x-auto mb-6">
                  <label className="label-text mb-2">Kapasitas Produksi</label>
                  <table className="min-w-full text-sm border border-gray-300 bg-white shadow-sm rounded-lg overflow-hidden">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="border border-gray-300 p-3 text-left font-bold text-gray-900">Terpasang</th>
                        <th className="border border-gray-300 p-3 text-left font-bold text-gray-900">Sesuai Izin</th>
                        <th className="border border-gray-300 p-3 text-left font-bold text-gray-900">Riil (Per Tahun)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2">
                          <input type="text" name="kapasitas_terpasang" value={formData.profil.kapasitas_terpasang || ''} onChange={handleProfilChange} className="w-full p-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" placeholder="Ketik..." />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input type="text" name="kapasitas_izin" value={formData.profil.kapasitas_izin || ''} onChange={handleProfilChange} className="w-full p-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" placeholder="Ketik..." />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input type="text" name="kapasitas_riil" value={formData.profil.kapasitas_riil || ''} onChange={handleProfilChange} className="w-full p-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" placeholder="Ketik..." />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label-text">Bahan Baku Utama</label>
                    <input type="text" name="bahan_baku_utama" value={formData.profil.bahan_baku_utama || ''} onChange={handleProfilChange} className="input-field" />
                  </div>
                  <div>
                    <label className="label-text">Bahan Baku Penolong</label>
                    <input type="text" name="bahan_baku_penolong" value={formData.profil.bahan_baku_penolong || ''} onChange={handleProfilChange} className="input-field" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label-text">Proses Produksi</label>
                    <textarea name="proses_produksi" value={formData.profil.proses_produksi || ''} onChange={handleProfilChange} rows="3" className="input-field" placeholder="Jelaskan alur singkat produksi..."></textarea>
                  </div>
                  <div>
                    <label className="label-text">Pemasaran Export (%)</label>
                    <input type="number" name="pemasaran_export" value={formData.profil.pemasaran_export || ''} onChange={handleProfilChange} className="input-field" placeholder="0 - 100" />
                  </div>
                  <div>
                    <label className="label-text">Pemasaran Domestik (%)</label>
                    <input type="number" name="pemasaran_domestik" value={formData.profil.pemasaran_domestik || ''} onChange={handleProfilChange} className="input-field" placeholder="0 - 100" />
                  </div>
                  <div>
                    <label className="label-text">Merek Dagang</label>
                    <input type="text" name="merek_dagang" value={formData.profil.merek_dagang || ''} onChange={handleProfilChange} className="input-field" />
                  </div>
                </div>
              </div>
              )}

              {/* D. ENERGI & LINGKUNGAN */}
              <div>
                <h3 className="text-lg font-bold text-green-800 border-b-2 border-green-100 pb-2 mb-4">D. Energi & Manajemen Lingkungan</h3>
                
                {/* --- LOGIKA 1: JIKA INDUSTRI (TAMPILKAN BAHAN BAKAR) --- */}
                {!isFasyankes && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="label-text">Bahan Bakar Digunakan</label>
                      <input type="text" name="bahan_bakar" value={formData.profil.bahan_bakar || ''} onChange={handleProfilChange} className="input-field" placeholder="Solar / Gas / Batubara" />
                    </div>
                    <div>
                      <label className="label-text">Satuan</label>
                      <input type="text" name="satuan_bahan_bakar" value={formData.profil.satuan_bahan_bakar || ''} onChange={handleProfilChange} className="input-field" placeholder="Liter / Ton" />
                    </div>
                    <div>
                      <label className="label-text">Konsumsi / Tahun</label>
                      <input type="number" name="konsumsi_bb" value={formData.profil.konsumsi_bb || ''} onChange={handleProfilChange} className="input-field" />
                    </div>
                  </div>
                )}

                {/* --- LOGIKA 2: JIKA FASYANKES (TAMPILKAN DIAGRAM & MEDIA PEMBUANGAN) --- */}
                {isFasyankes && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Upload Diagram Alir */}
                    <div className="md:col-span-2 bg-yellow-50 p-4 rounded-md border border-yellow-100">
                      <label className="label-text text-yellow-800">Diagram Alir Proses (Lampirkan Berkas)</label>
                      <div className="flex flex-col mt-2">
                        <label className="cursor-pointer bg-white border border-yellow-300 text-yellow-700 px-4 py-2 rounded hover:bg-yellow-100 text-sm font-medium text-center shadow-sm transition-all hover:shadow-md">
                           <span>{formData.profil.file_diagram ? "✅ Berkas Terupload (Ganti?)" : "📂 Upload Diagram Alir (PDF/Image)"}</span>
                           {/* ▼▼▼ TEMPEL KODINGANMU DI SINI (GANTIKAN INPUT LAMA) ▼▼▼ */}
                           <input 
                             type="file" 
                             accept="image/png, image/jpeg, image/jpg" // Wajib gambar agar muncul di PDF
                             className="hidden"
                             onChange={(e) => handleFileUpload(e, 'DIAGRAM')} 
                           />
                           {/* ▲▲▲ SAMPAI SINI ▲▲▲ */}
                        </label>
                        <p className="text-xs text-gray-400 mt-1 text-center">Maksimal 5MB</p>
                      </div>
                    </div>

                    {/* Media Pembuangan Air Limbah */}
                    <div className="md:col-span-2">
                      <label className="label-text">Media Tempat Pembuangan Air Limbah</label>
                      <input type="text" name="media_pembuangan_air" value={formData.profil.media_pembuangan_air || ''} onChange={handleProfilChange} className="input-field" placeholder="Contoh: Sungai Bengawan Solo / IPAL Komunal" />
                    </div>
                  </div>
                )}

                {/* --- BAGIAN UMUM (TAMPIL DI KEDUANYA) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="label-text">Sistem Manajemen Lingkungan</label>
                    <input type="text" name="sistem_manajemen" value={formData.profil.sistem_manajemen || ''} onChange={handleProfilChange} className="input-field" placeholder="ISO 14001 / Belum Ada" />
                  </div>
                  <div>
                    <label className="label-text">Dokumen Lingkungan Dimiliki</label>
                    <select name="dokumen_lingkungan" value={formData.profil.dokumen_lingkungan || ''} onChange={handleProfilChange} className="input-field">
                      <option value="">- Pilih Dokumen -</option>
                      <option value="AMDAL">AMDAL / DELH</option>
                      <option value="UKL-UPL">UKL-UPL / DPLH</option>
                      <option value="SPPL">SPPL</option>
                      <option value="Belum Ada">Belum Ada</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Inspeksi Terakhir (Tanggal)</label>
                    <input type="date" name="inspeksi_terakhir" value={formData.profil.inspeksi_terakhir || ''} onChange={handleProfilChange} className="input-field" />
                  </div>
                  <div>
                    <label className="label-text">Ruang Terbuka Hijau (RTH)</label>
                    <div className="flex items-center gap-2">
                        <input type="number" name="rth_persen" value={formData.profil.rth_persen || ''} onChange={handleProfilChange} className="input-field" placeholder="10 - 20" />
                        <span className="font-bold text-gray-600">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">* Wajib 10% - 20% dari luas lahan.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-10">
                <button onClick={() => setActiveTab(2)} className="btn-primary flex items-center gap-2 shadow-lg">
                  Lanjut ke Checklist Temuan &rarr;
                </button>
              </div>
            </div>
          )}

          {/* --- TAB 2: CHECKLIST (DINAMIS) --- */}
          {activeTab === 2 && (
            <div className="space-y-8 animate-fade-in">
              
              {/* LOOPING CHECKLIST SESUAI KATEGORI (Industri / Fasyankes) */}
              {activeChecklist.map((group, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden mb-6 shadow-sm border-gray-200">
                  <div className="bg-green-50 px-4 py-3 border-b border-green-100">
                    <h3 className="font-bold text-green-900">{group.kategori}</h3>
                  </div>
                  
                  <div className="divide-y divide-gray-100 bg-white">
                    {group.items.map((pertanyaan, pIdx) => {
                      const isAda = getChecklistValue(group.kategori, pertanyaan, 'is_ada');
                      const ket = getChecklistValue(group.kategori, pertanyaan, 'keterangan');
                      const bukti = getChecklistValue(group.kategori, pertanyaan, 'bukti_foto');

                      return (
                        <div key={pIdx} className="p-4 hover:bg-gray-50 grid grid-cols-1 md:grid-cols-12 gap-4 items-start transition-colors">
                          <div className="md:col-span-5 text-sm font-medium text-gray-800 pt-2">
                            {pertanyaan}
                          </div>
                          
                          {/* CHECKBOX */}
                          <div className="md:col-span-2 flex items-center space-x-4 pt-1">
                            <label className="flex items-center space-x-2 cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={isAda === true} 
                                onChange={(e) => handleChecklistChange(group.kategori, pertanyaan, 'is_ada', e.target.checked)}
                                className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer" 
                              />
                              <span className="text-sm font-medium text-gray-700">Ada / Sesuai</span>
                            </label>
                          </div>

                          {/* KETERANGAN & UPLOAD */}
                          <div className="md:col-span-5">
                            <textarea 
                              className="w-full text-sm text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 p-2 bg-white" 
                              rows="2"
                              placeholder="Tulis keterangan kondisi lapangan..."
                              value={ket || ''}
                              onChange={(e) => handleChecklistChange(group.kategori, pertanyaan, 'keterangan', e.target.value)}
                            ></textarea>
                            
                            <div className="mt-2 text-xs flex justify-between items-center">
                              <label className="cursor-pointer text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium hover:underline">
                                <span>{bukti && bukti.length > 0 ? "✅ Foto Terupload (Tambah?)" : "📎 Upload Bukti Foto (Max 5MB)"}</span>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  className="hidden" 
                                  onChange={(e) => handleFileUpload(e, 'CHECKLIST', {kategori: group.kategori, pertanyaan: pertanyaan})}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-6 border-t mt-8">
                <button onClick={() => setActiveTab(1)} className="text-gray-600 hover:text-gray-900 flex items-center gap-2 font-medium">
                  &larr; Kembali Edit Profil
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-xl'}`}
                >
                  {loading ? 'Mengirim Data...' : 'KIRIM LAPORAN SEKARANG'}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .label-text { 
          display: block; 
          font-size: 0.875rem; 
          font-weight: 600; 
          color: #111827; 
          margin-bottom: 0.25rem; 
        }
        
        .input-field { 
          display: block; 
          width: 100%; 
          border-radius: 0.375rem; 
          border: 1px solid #6b7280; 
          padding: 0.6rem; 
          font-size: 0.875rem; 
          color: #000000; 
          background-color: #ffffff; 
        }

        .input-field::placeholder {
          color: #6b7280; 
          opacity: 1;
        }

        .input-field:focus { 
          outline: none; 
          border-color: #16a34a; 
          box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2); 
        }

        .btn-primary { 
          background-color: #16a34a; 
          color: white; 
          padding: 0.75rem 2rem; 
          border-radius: 0.375rem; 
          font-weight: 600; 
          transition: background-color 0.2s; 
        }
        
        .btn-primary:hover { 
          background-color: #15803d; 
        }
      `}</style>
    </div>
  );
}