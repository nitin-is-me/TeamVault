import type { Metadata } from "next";
import "./globals.css";

import SearchModal from '@/components/SearchModal';

export const metadata: Metadata = {
  title: "TeamVault | The Knowledge Hub for Modern Teams",
  description: "Centralize your project documentation, API specs, and team knowledge in one beautifully organized, secure workspace.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <SearchModal />
      </body>
    </html>
  );
}
