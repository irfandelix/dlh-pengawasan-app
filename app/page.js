'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/cek-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.toUpperCase() })
      });
      const json = await res.json();

      if (json.success) {
        localStorage.setItem('temp_login_data', JSON.stringify(json.data));
        router.push(`/lapor/${token.toUpperCase()}`);
      } else {
        alert("Gagal: " + json.message);
        setLoading(false);
      }
    } catch (err) {
      alert("Tidak bisa menghubungi server.");
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUser, password: adminPass })
      });
      const json = await res.json();

      if (json.success) {
        router.push('/admin/dashboard');
      } else {
        alert(json.message);
        setLoginLoading(false);
      }
    } catch (err) {
      alert("Error Login Server");
      setLoginLoading(false);
    }
  };

  return (
    // --- UPDATE DI SINI: MENGGUNAKAN BACKGROUND IMAGE ---
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ 
        // Ganti 'bg-depan.jpg' sesuai nama file yang kamu taruh di folder public
        backgroundImage: "url('/bg-pengawasan.webp')",
        // Overlay hitam transparan supaya tulisan tetap terbaca walau background rame
        boxShadow: "inset 0 0 0 1000px rgba(0,0,0,0.3)" 
      }}
    >
      
      {/* Kartu Utama (Diberi sedikit efek kaca/backdrop blur agar modern) */}
      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/50 relative">
        
        <div className="bg-green-700 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full translate-x-10 translate-y-10"></div>
          <h2 className="text-2xl font-bold text-white mb-1">Sistem Pengawasan</h2>
          <p className="text-green-100 text-sm font-medium">Lingkungan Hidup Kabupaten Sragen</p>
        </div>

        <div className="p-8">
          <div className="mb-6 text-center">
            <h3 className="text-gray-800 font-bold text-lg">Selamat Datang</h3>
            <p className="text-gray-600 text-sm mt-1">
              Silakan masukkan <span className="font-bold text-green-700">Kode Token</span> pengawasan.
            </p>
          </div>

          <form onSubmit={handleUserSubmit} className="space-y-5">
            <div>
              <label htmlFor="token" className="sr-only">Kode Token</label>
              <input
                id="token"
                type="text"
                required
                className="block w-full text-center px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-lg uppercase tracking-widest font-mono text-gray-900 placeholder-gray-400 bg-white"
                placeholder="CONTOH: IND-8821"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white transition-all ${
                loading || !token ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
              }`}
            >
              {loading ? 'Memproses...' : 'MULAI PENGISIAN FORM'}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-gray-500">© 2025 DLH Kab. Sragen</p>
          <button 
            onClick={() => setShowLogin(true)}
            className="text-xs text-green-700 hover:text-green-800 font-bold hover:underline"
          >
            Login Petugas →
          </button>
        </div>
      </div>

      {/* --- MODAL LOGIN ADMIN --- */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-fade-in border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Login Petugas DLH</h3>
              <button onClick={() => setShowLogin(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            </div>
            
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-2.5 border text-gray-900 bg-white"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input 
                  type="password" 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-2.5 border text-gray-900 bg-white"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loginLoading}
                className="w-full bg-green-700 text-white py-2.5 rounded-md hover:bg-green-800 font-bold shadow-md transition-all mt-2"
              >
                {loginLoading ? 'Verifikasi...' : 'Masuk Dashboard'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}