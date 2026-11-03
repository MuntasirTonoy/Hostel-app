import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/i18n/client";
import { getI18n, getLocale } from "@/i18n/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description: t.meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The UI language comes from the `lang` cookie (LanguageToggle); Bangla by default.
  const locale = await getLocale();
  return (
    // next-themes sets the theme class on <html> before hydration.
    <html lang={locale} className={`${kohinoorBangla.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster richColors position="top-center" />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
