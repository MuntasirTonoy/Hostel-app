import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_NAME } from "@/lib/site";
import "./globals.css";

// Kohinoor Bangla (Indian Type Foundry), Medium only: lighter weights use it as-is and
// bolder weights are synthesized by the browser.
const kohinoorBangla = localFont({
  variable: "--font-kohinoor-bangla",
  src: "../fonts/kohinoor-bangla-medium.ttf",
  weight: "500",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: "হোস্টেলের মাসিক মিল, জমা, খরচ, বকেয়া ও ফেরতের স্বয়ংক্রিয় হিসাব।",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // next-themes sets the theme class on <html> before hydration.
    <html lang="bn" className={`${kohinoorBangla.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
