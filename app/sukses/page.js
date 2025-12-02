'use client';
import Link from 'next/link';

export default function SuksesPage() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 font-sans bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ 
        backgroundImage: "url('/bg-pengawasan.webp')",
        // Overlay putih transparan (0.9) agar teks tetap terbaca jelas di atas gambar
        boxShadow: "inset 0 0 0 1000px rgba(245, 245, 245, 0.9)" 
      }}
    >
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-2xl text-center max-w-md w-full border border-white/50 transform transition-all hover:scale-105 duration-300">
        
        {/* Icon Centang Besar dengan Animasi */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-extrabold text-green-800 mb-2 tracking-tight">Laporan Terkirim!</h1>
        <div className="h-1 w-20 bg-green-500 mx-auto mb-4 rounded-full"></div>
        
        <p className="text-gray-600 mb-8 text-sm leading-relaxed font-medium">
          Terima kasih telah melengkapi data pengawasan lingkungan hidup. Data Anda telah tersimpan aman di sistem <span className="font-bold text-green-700">Dinas Lingkungan Hidup Kab. Sragen</span>.
        </p>

        <Link 
          href="/"
          className="block w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3.5 rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          &larr; Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}