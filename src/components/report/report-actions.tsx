"use client";

import { Download, History, Loader2, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { periodLabel, periodSlug } from "@/lib/months";
import type { PeriodRef } from "@/types/accounting";

export function ReportActions({
  targetId,
  fileName,
  basePath,
  periods,
  current,
}: {
  targetId: string;
  fileName: string;
  basePath: string;
  periods: PeriodRef[];
  current: { month: number; year: number };
}) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  async function downloadPdf() {
    const element = document.getElementById(targetId);
    if (!element) return;
    setDownloading(true);
    try {
      // Render the report with the browser (so Bangla text shapes correctly), then paginate into A4.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
        onclone: (doc) => {
          // The PDF is always rendered in the light theme.
          doc.documentElement.classList.remove("dark");
          const clone = doc.getElementById(targetId);
          if (!clone) return;
          clone.style.width = "1100px";
          clone.style.padding = "24px";
          clone.querySelectorAll<HTMLElement>(".print-table-wrap").forEach((el) => {
            el.style.overflow = "visible";
            el.style.display = "block";
          });
          // The PDF always uses the table, never the mobile cards.
          clone.querySelectorAll<HTMLElement>(".report-cards").forEach((el) => {
            el.style.display = "none";
          });
          clone.querySelectorAll<HTMLElement>(".print-only").forEach((el) => {
            el.style.display = "block";
          });
        },
      });

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const margin = 8;
      const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
      const pxPerMm = canvas.width / pageWidth;
      const sliceHeightPx = Math.floor(pageHeight * pxPerMm);

      for (let y = 0, page = 0; y < canvas.height; y += sliceHeightPx, page++) {
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = Math.min(sliceHeightPx, canvas.height - y);
        slice.getContext("2d")!.drawImage(canvas, 0, -y);
        if (page > 0) pdf.addPage();
        pdf.addImage(
          slice.toDataURL("image/png"),
          "PNG",
          margin,
          margin,
          pageWidth,
          slice.height / pxPerMm,
        );
      }
      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("PDF তৈরি করা যায়নি। পরিবর্তে \"প্রিন্ট করুন\" থেকে PDF হিসেবে সংরক্ষণ করুন।");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="no-print flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" onClick={() => window.print()}>
        <Printer /> প্রিন্ট করুন
      </Button>
      <Button variant="outline" onClick={downloadPdf} disabled={downloading}>
        {downloading ? <Loader2 className="animate-spin" /> : <Download />} PDF ডাউনলোড
      </Button>
      {periods.length > 0 ? (
        <Select
          value={periodSlug(current.month, current.year)}
          onValueChange={(slug) => router.push(`${basePath}/${slug}`)}
        >
          <SelectTrigger className="min-w-52" aria-label="পূর্ববর্তী মাসের হিসাব">
            <History />
            <SelectValue placeholder="পূর্ববর্তী মাসের হিসাব" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p.id} value={periodSlug(p.month, p.year)}>
                {periodLabel(p.month, p.year)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
