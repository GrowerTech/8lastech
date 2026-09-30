import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "8LasTech — Build. Innovate. Elevate.",
  description:
    "8LasTech is a technology and digital solutions company building web applications, custom software, UI/UX design, and automation as a long-term technology partner for growing businesses.",
  keywords: [
    "8LasTech",
    "web application development",
    "custom software",
    "UI/UX design",
    "automation",
    "software company",
  ],
  icons: {
    icon: "/logo-icon-v2.png",
  },
  openGraph: {
    title: "8LasTech — Build. Innovate. Elevate.",
    description:
      "Technology and digital solutions company turning ideas into modern, scalable digital products.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
