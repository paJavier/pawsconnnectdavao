import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "PawsConnect Davao",
  description: "Report stray animals and connect with nearby responders.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-6xl p-4">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
