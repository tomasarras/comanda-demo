import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/components/RoleProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Comanda — Demo de gestión de restaurante",
  description:
    "Proyecto de portfolio: sistema de gestión de restaurante ficticio (panel, órdenes, caja, productos) con base de datos real.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
