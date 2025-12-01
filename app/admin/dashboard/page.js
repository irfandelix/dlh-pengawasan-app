'use client';
import { useState, useEffect } from 'react';

// --- KONSTANTA JUMLAH TOTAL PERTANYAAN ---
const TOTAL_SOAL = 45;

// --- KOMPONEN KECIL UNTUK TOMBOL DOWNLOAD ---
function TombolDownloadPDF({ token }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/pdf?token=${token}`);
      if (!response.ok) throw new Error("Gagal generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Berita_Acara_${token}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Gagal mendownload PDF. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={isLoading}
      className={`px-3 py-1 rounded shadow-sm flex items-center gap-1 text-xs font-bold transition-all ${
        isLoading 
          ? 'bg-gray-400 text-white cursor-not-allowed' 
          : 'bg-red-600 hover:bg-red-700 text-white'
      }`}
    >
      {isLoading ? <span>⏳...</span> : <><span>📄</span> PDF</>}
    </button>
  );
}

// --- KOMPONEN UTAMA DASHBOARD ---
export default function AdminDashboard() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State Form
  const [namaUsaha, setNamaUsaha] = useState('');
  const [tipeTarget, setTipeTarget] = useState('INDUSTRI'); 

  // 1. SAAT HALAMAN DIBUKA: Ambil data dari MongoDB
  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/admin/token'); 
      const json = await res.json();
      if (json.success) {
        setTokens(json.data); 
      }
    } catch (err) {
      console.error("Gagal ambil data", err);
    }
  };

  // 2. SAAT TOMBOL GENERATE DITEKAN
  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nama_usaha: namaUsaha, 
          kategori_target: tipeTarget 
        })
      });
      
      const json = await res.json();
      if (json.success) {
        setNamaUsaha(''); 
        fetchTokens(); 
        alert(`SUKSES! Token Baru: ${json.data.token}`);
      } else {
        alert("Gagal: " + json.error);
      }
    } catch (err) {
      alert("Error jaringan / Database belum siap.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (token) => {
    const link = `${window.location.origin}/lapor/${token}`;
    navigator.clipboard.writeText(link);
    alert("Link tersalin!");
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/'; 
  };

  // --- FUNGSI HITUNG NILAI ---
  const hitungNilai = (checklistArray) => {
    if (!checklistArray || checklistArray.length === 0) return 0;
    const jumlahAda = checklistArray.filter(item => item.is_ada === true).length;
    
    // Rumus: (Jumlah Jawaban "Ada" dibagi 45 Soal) dikali 100
    const nilai = Math.round((jumlahAda / TOTAL_SOAL) * 100);
    
    // Penjagaan biar nilainya gak lebih dari 100
    return nilai > 100 ? 100 : nilai;
  };

  // --- FUNGSI LOGIKA WARNA & LABEL ---
  const getStatusNilai = (nilai) => {
    if (nilai >= 90) return { label: "SANGAT BAIK", style: "bg-green-100 text-green-700 border-green-200" };
    if (nilai >= 70) return { label: "BAIK", style: "bg-cyan-100 text-cyan-700 border-cyan-200" };
    if (nilai >= 50) return { label: "SEDANG", style: "bg-amber-100 text-amber-700 border-amber-200" };
    if (nilai >= 25) return { label: "KURANG", style: "bg-red-100 text-red-700 border-red-200" };
    return { label: "SANGAT KURANG", style: "bg-gray-800 text-white border-gray-600" };
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed font-sans"
      style={{ 
        backgroundImage: "url('/bg-pengawasan.webp')",
        boxShadow: "inset 0 0 0 1000px rgba(245, 245, 245, 0.85)" 
      }}
    >
      <nav className="bg-green-800 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-wide">Dashboard Admin LH</h1>
          </div>
          
          <button 
            onClick={handleLogout}
            className="text-sm bg-green-900 px-3 py-1 rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* FORM GENERATOR */}
        <div className="md:col-span-1">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 sticky top-24">
            <h2 className="text-lg font-bold mb-1 text-gray-800">Buat Pengawasan</h2>
            <form onSubmit={handleGenerate} className="space-y-5 mt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Target</label>
                <input 
                  type="text" 
                  value={namaUsaha}
                  onChange={(e) => setNamaUsaha(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  placeholder="Contoh: RSUD Gemolong"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipeTarget('INDUSTRI')}
                    className={`p-3 text-sm border rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      tipeTarget === 'INDUSTRI' 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span>🏭</span> INDUSTRI
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipeTarget('FASYANKES')}
                    className={`p-3 text-sm border rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      tipeTarget === 'FASYANKES' 
                      ? 'bg-teal-600 text-white border-teal-600 shadow-md' 
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span>🏥</span> FASYANKES
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 font-bold shadow-lg transition-all"
              >
                {loading ? 'Menyimpan ke Database...' : '✨ Generate Token'}
              </button>
            </form>
          </div>
        </div>

        {/* TABEL MONITORING */}
        <div className="md:col-span-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden min-h-[500px]">
            <div className="p-5 border-b border-gray-100 bg-white/50 flex justify-between items-center">
              <h2 className="font-bold text-gray-800 text-lg">Daftar Pengawasan</h2>
              <button onClick={fetchTokens} className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-md hover:bg-green-100">
                Refresh Data ⟳
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100/50 text-gray-500 uppercase font-semibold text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Token</th>
                    <th className="px-6 py-4">Target</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Kinerja</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* ▼▼▼ PERBAIKAN DI SINI: Menggunakan { ... return (...) } ▼▼▼ */}
                  {tokens.map((item) => {
                    const nilai = hitungNilai(item.checklist);
                    const statusNilai = getStatusNilai(nilai);

                    return (
                      <tr key={item._id} className="hover:bg-white/80 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100 whitespace-nowrap">
                            {item.token}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{item.profil?.nama_usaha || '-'}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {item.kategori_target === 'FASYANKES' ? '🏥 Fasyankes' : '🏭 Industri'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            item.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        
                        {/* KOLOM KINERJA */}
                        <td className="px-6 py-4 text-center">
                          {item.status === 'SUBMITTED' ? (
                            <div className={`inline-flex flex-col items-center justify-center px-3 py-1.5 rounded border shadow-sm ${statusNilai.style}`}>
                              <span className="text-lg font-black leading-none">{nilai}</span>
                              <span className="text-[9px] font-bold uppercase mt-0.5">{statusNilai.label}</span>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xl font-bold">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => copyLink(item.token)}
                            className="text-blue-600 hover:text-blue-800 border border-blue-200 px-2 py-1 rounded bg-blue-50 text-xs"
                          >
                            Copy Link
                          </button>
                          
                          {item.status === 'SUBMITTED' && (
                            <TombolDownloadPDF token={item.token} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {tokens.length === 0 && (
                     <tr><td colSpan="5" className="text-center p-8 text-gray-400">Database masih kosong...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}