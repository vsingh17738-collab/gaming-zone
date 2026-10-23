import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { getBusinessSettings } from "@/lib/data";
import { getOptionalUser } from "@/lib/auth";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Shri Shaam Tent House | Weddings & Events in Pithampur", template: "%s | Shri Shaam Tent House" },
  description: "Premium tent arrangements, wedding decoration, event setup and water supply in Pithampur and nearby areas. Plan your celebration with Shri Shaam Tent House.",
  keywords: ["tent house Pithampur", "wedding decoration Pithampur", "event setup", "Shri Shaam Tent House"],
  openGraph: { title: "Shri Shaam Tent House", description: "Thoughtful settings for life's biggest moments.", images: ["/images/hero-wedding.jpg"], type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#4d1f27" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [settings, user] = await Promise.all([getBusinessSettings(), getOptionalUser()]);
  return (
    <html lang="en">
      <body>
        <Header settings={settings} user={user} />
        <main>{children}</main>
        <Footer settings={settings} />
        <WhatsAppButton number={settings.whatsappNumber} />
      </body>
    </html>
  );
}
