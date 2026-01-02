"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 

export default function DashboardAdmin() {
  const router = useRouter(); 

  // --- STATE UTAMA ---
  const [namaTarget, setNamaTarget] = useState("");
  const [kategori, setKategori] = useState("INDUSTRI");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // --- STATE PPLH (PETUGAS) ---
  const [listPplh, setListPplh] = useState([]); 
  const [selectedPplhIds, setSelectedPplhIds] = useState([]); 
  const [showModal, setShowModal] = useState(false);
  
  // --- STATE DATA LAPORAN (KANAN) ---
  const [laporanList, setLaporanList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // --- STATE FORM PPLH (TAMBAH/EDIT) ---
  const [formPplh, setFormPplh] = useState({
    nama: "", nip: "", pangkat: "", jabatan: "", no_telp: "", instansi: "DLH Kab. Sragen"
  });
  const [editId, setEditId] = useState(null);

  // =========================================
  // 0. HELPER SORTING (PANGKAT TERTINGGI DI ATAS)
  // =========================================
  const sortPplh = (data) => {
    if (!data || !Array.isArray(data)) return [];

    return [...data].sort((a, b) => {
      const getScore = (pangkatStr) => {
        if (!pangkatStr) return 0;
        // Regex deteksi Romawi (I-IV) dan Huruf (a-e). Contoh: "Pembina (IV/a)"
        const match = pangkatStr.match(/\b(IV|III|II|I)\s*\/\s*([a-e])\b/i);
        
        if (!match) return 0; // Jika tidak ada format golongan, skor 0 (paling bawah)

        const romans = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4 };
        const letters = { 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5 };

        const romawiScore = romans[match[1].toUpperCase()] || 0;
        const hurufScore = letters[match[2].toLowerCase()] || 0;

        // Rumus Skor: Romawi * 10 + Huruf
        // IV/a (41) > III/d (34) > III/a (31)
        return (romawiScore * 10) + hurufScore;
      };

      // Descending (Score Besar di Atas)
      return getScore(b.pangkat) - getScore(a.pangkat);
    });
  };

  // =========================================
  // 1. FUNGSI LOGOUT
  // =========================================
  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      router.push("/"); 
    }
  };

  // =========================================
  // 2. FETCH DATA
  // =========================================
  
  const fetchPplh = async () => {
    try {
      const res = await fetch("/api/admin/pplh");
      if (res.ok) {
        const rawData = await res.json();
        // 🔥 TERAPKAN SORTING DI SINI 🔥
        const sortedData = sortPplh(rawData);
        setListPplh(sortedData);
      }
    } catch (err) {
      console.error("Gagal load PPLH:", err);
    }
  };

  const fetchLaporan = async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/admin/token");
      const result = await res.json();
      if (result.success) {
        setLaporanList(result.data);
      }
    } catch (err) {
      console.error("Gagal load Laporan:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPplh();
    fetchLaporan();
  }, []);

  // =========================================
  // 3. LOGIC HITUNG SKOR
  // =========================================
  const hitungSkor = (item) => {
    const TOTAL_SOAL = item.kategori_target === 'FASYANKES' ? 39 : 45;
    const checklist = item.checklist || [];
    const jumlahAda = checklist.filter(c => 
      c.is_ada === true || c.is_ada === "true" || c.is_ada === "1" || c.is_ada === 1
    ).length;

    const skor = Math.round((jumlahAda / TOTAL_SOAL) * 100);

    let label = "";
    let colorClass = "";

    if (skor >= 90) {
      label = "Sangat Baik";
      colorClass = "bg-green-100 text-green-700 border-green-200";
    } else if (skor >= 75) {
      label = "Baik";
      colorClass = "bg-blue-100 text-blue-700 border-blue-200";
    } else if (skor >= 50) {
      label = "Cukup";
      colorClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
    } else {
      label = "Kurang";
      colorClass = "bg-red-100 text-red-700 border-red-200";
    }

    return { skor, label, colorClass };
  };

  // =========================================
  // 4. LOGIC GENERATE TOKEN & CRUD
  // =========================================
  
  const handleGenerateToken = async () => {
    if (!namaTarget || selectedPplhIds.length === 0) {
      alert("Nama Target dan Minimal 1 Petugas PPLH wajib dipilih!");
      return;
    }

    setLoading(true);
    // Tim PPLH yang dikirim akan otomatis terurut karena listPplh sudah disortir
    // Tapi kita sort ulang untuk memastikan urutan di database benar-benar rapi
    const timTerpilihRaw = listPplh.filter(p => selectedPplhIds.includes(p._id));
    const timTerpilihSorted = sortPplh(timTerpilihRaw);

    try {
      const res = await fetch("/api/admin/token", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_target: namaTarget,
          kategori: kategori,
          tanggal_pengawasan: tanggal,
          tim_pengawas: timTerpilihSorted 
        })
      });
      
      const result = await res.json();
      if (result.success) {
        setNamaTarget("");
        setSelectedPplhIds([]);
        fetchLaporan();
        alert("Sukses! Token: " + result.token);
      } else {
        alert("Gagal: " + (result.error || "Terjadi kesalahan"));
      }
    } catch (err) {
      console.error(err);
      alert("Error sistem saat generate token");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSimpanPplh = async (e) => {
    e.preventDefault();
    const method = editId ? "PUT" : "POST";
    const body = editId ? { ...formPplh, _id: editId } : formPplh;

    await fetch("/api/admin/pplh", {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setFormPplh({ nama: "", nip: "", pangkat: "", jabatan: "", no_telp: "", instansi: "DLH Kab. Sragen" });
    setEditId(null);
    fetchPplh(); 
  };

  const handleHapusPplh = async (id) => {
    if (confirm("Yakin hapus data PPLH ini?")) {
      await fetch(`/api/admin/pplh?id=${id}`, { method: "DELETE" });
      fetchPplh();
    }
  };

  const handleEditClick = (item) => {
    setFormPplh(item);
    setEditId(item._id);
  };

  const toggleSelectPplh = (id) => {
    if (selectedPplhIds.includes(id)) {
      setSelectedPplhIds(selectedPplhIds.filter(x => x !== id));
    } else {
      setSelectedPplhIds([...selectedPplhIds, id]);
    }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/lapor/${token}`;
    navigator.clipboard.writeText(url);
    alert("Link tersalin: " + url);
  };

  return (
    <div 
      className="min-h-screen font-sans bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ 
        backgroundImage: "url('/bg-pengawasan.webp')",
        boxShadow: "inset 0 0 0 2000px rgba(245, 245, 245, 0.9)" 
      }}
    >
      <div className="bg-green-800 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold">Dashboard Admin LH</h1>
        
        <button 
          onClick={handleLogout}
          className="bg-green-900 hover:bg-green-700 px-4 py-1 rounded text-sm font-bold transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* KOLOM KIRI: FORM */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-24">
              <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Buat Pengawasan</h2>

              <div className="mb-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Target</label>
                <input 
                  className="w-full bg-white text-gray-900 border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  placeholder="Contoh: RSUD Gemolong"
                  value={namaTarget}
                  onChange={e => setNamaTarget(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Pengawasan</label>
                <input 
                  type="date"
                  className="w-full bg-white text-gray-900 border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                />
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={() => setKategori("INDUSTRI")} className={`flex-1 py-2 rounded-lg font-bold border text-xs transition ${kategori==="INDUSTRI" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-300"}`}>
                  🏭 INDUSTRI
                </button>
                <button onClick={() => setKategori("FASYANKES")} className={`flex-1 py-2 rounded-lg font-bold border text-xs transition ${kategori==="FASYANKES" ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-500 border-gray-300"}`}>
                  🏥 FASYANKES
                </button>
              </div>

              <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-gray-700 text-xs">Tim PPLH:</label>
                  <button onClick={() => setShowModal(true)} className="text-[10px] bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-full font-bold transition">+ Kelola Data</button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scroll">
                  {listPplh.length === 0 ? <p className="text-[10px] text-gray-400 italic text-center">Belum ada data.</p> : 
                    listPplh.map(p => (
                      <label key={p._id} className={`flex items-center p-1.5 rounded border cursor-pointer transition ${selectedPplhIds.includes(p._id) ? "bg-green-100 border-green-500" : "bg-white border-gray-200"}`}>
                        <input type="checkbox" className="w-3.5 h-3.5 text-green-600 mr-2 accent-green-600" checked={selectedPplhIds.includes(p._id)} onChange={() => toggleSelectPplh(p._id)} />
                        <div className="truncate">
                          <div className="font-bold text-xs text-gray-800">{p.nama}</div>
                          {/* Menampilkan Pangkat agar user yakin urutannya benar */}
                          <div className="text-[10px] text-gray-500">{p.pangkat}</div>
                        </div>
                      </label>
                    ))
                  }
                </div>
                <p className="text-[10px] text-right mt-1 text-gray-500 font-bold">{selectedPplhIds.length} Dipilih</p>
              </div>

              <button onClick={handleGenerateToken} disabled={loading} className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50 text-sm">
                {loading ? "Memproses..." : "✨ Generate Token"}
              </button>
            </div>
          </div>

          {/* KOLOM KANAN: TABEL */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                <h2 className="font-bold text-lg text-gray-800">Daftar Pengawasan</h2>
                <button onClick={fetchLaporan} className="text-xs bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-100 text-gray-600">🔄 Refresh Data</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                    <tr>
                      <th className="px-4 py-3">Token</th>
                      <th className="px-4 py-3">Target</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Kinerja (Skor)</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingList ? (
                      <tr><td colSpan="5" className="p-6 text-center text-gray-500">Memuat data...</td></tr>
                    ) : laporanList.length === 0 ? (
                      <tr><td colSpan="5" className="p-6 text-center text-gray-500 italic">Belum ada data pengawasan.</td></tr>
                    ) : (
                      laporanList.map((item) => {
                        const { skor, label, colorClass } = hitungSkor(item);

                        return (
                          <tr key={item._id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 font-mono font-bold text-green-700 bg-green-50 rounded w-max">{item.token}</td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-800">{item.profil?.nama_usaha || "-"}</div>
                              <div className="text-xs text-gray-500">{item.kategori_target}</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.status === 'SUBMITTED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {item.status || 'DRAFT'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.status === 'SUBMITTED' ? (
                                <div className={`inline-block border rounded px-2 py-1 text-center ${colorClass}`}>
                                  <div className="text-lg font-bold leading-none">{skor}%</div>
                                  <div className="text-[9px] uppercase font-bold">{label}</div>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400 italic">Belum selesai</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => copyLink(item.token)} className="text-xs border border-blue-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition">Copy Link</button>
                                {item.status === 'SUBMITTED' && (
                                  <a href={`/api/admin/pdf?token=${item.token}`} target="_blank" className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 font-bold flex items-center gap-1">📄 PDF</a>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PPLH */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">📂 Kelola Database PPLH</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 text-2xl font-bold">&times;</button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-1/3 p-5 border-r bg-gray-50 overflow-y-auto">
                <h4 className="font-bold text-blue-800 mb-4 text-sm uppercase tracking-wide border-b pb-2">{editId ? "✏️ Edit Petugas" : "➕ Tambah Baru"}</h4>
                <form onSubmit={handleSimpanPplh} className="space-y-3">
                  <input className="w-full bg-white text-gray-900 border p-2 rounded text-sm focus:border-blue-500 outline-none" placeholder="Nama" value={formPplh.nama} onChange={e=>setFormPplh({...formPplh, nama: e.target.value})} required />
                  <input className="w-full bg-white text-gray-900 border p-2 rounded text-sm focus:border-blue-500 outline-none" placeholder="NIP" value={formPplh.nip} onChange={e=>setFormPplh({...formPplh, nip: e.target.value})} required />
                  
                  {/* INPUT PANGKAT PENTING UNTUK SORTING */}
                  <input className="w-full bg-white text-gray-900 border p-2 rounded text-sm focus:border-blue-500 outline-none" placeholder="Pangkat (Contoh: Pembina (IV/a))" value={formPplh.pangkat} onChange={e=>setFormPplh({...formPplh, pangkat: e.target.value})} required />
                  
                  <input className="w-full bg-white text-gray-900 border p-2 rounded text-sm focus:border-blue-500 outline-none" placeholder="Jabatan" value={formPplh.jabatan} onChange={e=>setFormPplh({...formPplh, jabatan: e.target.value})} required />
                  <input className="w-full bg-white text-gray-900 border p-2 rounded text-sm focus:border-blue-500 outline-none" placeholder="No HP" value={formPplh.no_telp} onChange={e=>setFormPplh({...formPplh, no_telp: e.target.value})} required />
                  
                  <div className="flex gap-2 pt-4">
                    {editId && <button type="button" onClick={() => {setEditId(null); setFormPplh({nama:"", nip:"", pangkat:"", jabatan:"", no_telp:"", instansi:"DLH Kab. Sragen"})}} className="flex-1 bg-gray-200 py-2 rounded text-sm font-bold text-gray-700">Batal</button>}
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded text-sm font-bold hover:bg-blue-700">Simpan</button>
                  </div>
                </form>
              </div>
              <div className="w-full md:w-2/3 p-0 overflow-y-auto bg-white">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 border-b">Nama / NIP</th>
                      <th className="p-3 border-b">Pangkat & Jabatan</th>
                      <th className="p-3 border-b text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {listPplh.map(p => (
                      <tr key={p._id} className="hover:bg-blue-50 transition group">
                        <td className="p-3">
                          <div className="font-bold text-gray-800">{p.nama}</div>
                          <div className="text-xs text-gray-500">{p.nip}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-xs font-bold text-blue-700">{p.pangkat}</div>
                          <div className="text-gray-600">{p.jabatan}</div>
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleEditClick(p)} className="text-blue-600">✏️</button> 
                          <button onClick={() => handleHapusPplh(p._id)} className="text-red-600 ml-2">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}