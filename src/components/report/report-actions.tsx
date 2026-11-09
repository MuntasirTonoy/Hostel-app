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
import { useI18n } from "@/i18n/client";
import { periodSlug } from "@/lib/months";
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
  const { t, f } = useI18n();
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
      const scale = 2;
      let rowBottoms: number[] = [];
      const canvas = await html2canvas(element, {
        scale,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
        onclone: (doc) => {
          // The PDF is always rendered in the light theme.
          doc.documentElement.classList.remove("dark");
          const clone = doc.getElementById(targetId);
          if (!clone) return;
          clone.style.width = "800px"; // A4 portrait proportions at a readable text size.
          clone.style.padding = "24px";
          clone.querySelectorAll<HTMLElement>(".print-table-wrap").forEach((el) => {
            el.style.overflow = "visible";
            el.style.display = "block";
          });
          // The name column hugs the longest name, and drops the sticky column's solid
          // background so the row lines and shading run through it.
          clone.querySelectorAll<HTMLElement>(".print-table-wrap th:first-child").forEach((el) => {
            el.style.width = "1%";
            el.style.position = "static";
            el.style.background = "transparent";
            el.style.fontWeight = "600";
          });
          // The PDF always uses the table, never the mobile cards.
          clone.querySelectorAll<HTMLElement>(".report-cards").forEach((el) => {
            el.style.display = "none";
          });
          clone.querySelectorAll<HTMLElement>(".print-only").forEach((el) => {
            el.style.display = "block";
          });
          clone.querySelectorAll<HTMLElement>(".print-table-wrap table").forEach((el) => {
            el.style.minWidth = "0";
          });
          // Measured last, once the layout above applies: pages break only between rows.
          const top = clone.getBoundingClientRect().top;
          rowBottoms = Array.from(clone.querySelectorAll("tr"), (tr) =>
            Math.floor((tr.getBoundingClientRect().bottom - top) * scale),
          );
        },
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const margin = 8;
      const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
      const pxPerMm = canvas.width / pageWidth;
      const sliceHeightPx = Math.floor(pageHeight * pxPerMm);

      for (let y = 0, page = 0, end = 0; y < canvas.height; y = end, page++) {
        const limit = y + sliceHeightPx;
        const lastRowOnPage = Math.max(0, ...rowBottoms.filter((b) => b > y && b <= limit));
        end = limit >= canvas.height ? canvas.height : lastRowOnPage || limit;
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = end - y;
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
      toast.error(t.publicReport.pdfFailed);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="no-print flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" onClick={() => window.print()}>
        <Printer /> {t.publicReport.print}
      </Button>
      <Button variant="outline" onClick={downloadPdf} disabled={downloading}>
        {downloading ? <Loader2 className="animate-spin" /> : <Download />} {t.publicReport.downloadPdf}
      </Button>
      {periods.length > 0 ? (
        <Select
          value={periodSlug(current.month, current.year)}
          onValueChange={(slug) => router.push(`${basePath}/${slug}`)}
        >
          <SelectTrigger className="min-w-52" aria-label={t.publicReport.previous}>
            <History />
            <SelectValue placeholder={t.publicReport.previous} />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p.id} value={periodSlug(p.month, p.year)}>
                {f.period(p.month, p.year)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
