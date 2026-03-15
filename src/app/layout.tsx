import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Nav } from "@/components/ui/Nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Microblog",
    template: "%s | Microblog",
  },
  description: "A minimal microblog — read, write, and share your thoughts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Nav />
        {children}
      </body>
    </html>
  );
}

