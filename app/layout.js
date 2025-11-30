import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Aplikasi Pengawasan LH",
  description: "Aplikasi Pengawasan Lingkungan Hidup Kabupaten Sragen",
  // Opsional: Biar icon tab (favicon) berubah juga, pastikan file favicon.ico ada di folder /public
  icons: {
    icon: '/magnifying-glass.png', // Simpan file logo kecil di folder public
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
