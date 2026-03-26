import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Load a clean, modern font
const inter = Inter({ subsets: ["latin"] });

// Set up the default SEO metadata for the platform
export const metadata: Metadata = {
  title: "Golf Charity Platform",
  description: "Subscription engine, 5-score rolling logic, and monthly charity draws.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Add suppressHydrationWarning to HTML
    <html lang="en" suppressHydrationWarning> 
      {/* Add suppressHydrationWarning to BODY */}
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}