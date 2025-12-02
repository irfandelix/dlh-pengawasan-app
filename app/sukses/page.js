'use client';
import Link from 'next/link';

export default function SuksesPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md w-full border border-green-100">
        
        {/* Icon Centang Besar */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Laporan Berhasil Terkirim!</h1>
        <p className="text-gray-600 mb-8 text-sm leading-relaxed">
          Terima kasih telah melengkapi data pengawasan lingkungan hidup. Data Anda telah tersimpan aman di sistem Dinas Lingkungan Hidup Kab. Sragen.
        </p>

        <Link 
          href="/"
          className="block w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-all shadow-md transform hover:-translate-y-1"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}