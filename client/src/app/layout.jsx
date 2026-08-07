import "./globals.css";
import Providers from "@/src/components/Providers";

export const metadata = {
  title: {
    default: "DairyTech",
    template: "%s | DairyTech",
  },
  description:
    "Modern Dairy Management System for milk suppliers, customer management, billing, and payments.",
  applicationName: "DairyTech",
  keywords: [
    "Dairy",
    "Milk Management",
    "Billing",
    "Customers",
    "Payments",
    "Next.js",
  ],
  authors: [{ name: "DairyTech" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DairyTech",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#176b5b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}