import "./globals.css";
import type { ReactNode } from "react";
import LanguageToggle from "@/components/LanguageToggle";

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        <div className="fixed right-4 top-4 z-50">
          <LanguageToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
