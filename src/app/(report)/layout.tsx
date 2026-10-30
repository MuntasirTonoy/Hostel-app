/**
 * Bare layout for a hostel's public report (/monthly-bill/<code>): no site
 * navigation, so the page is clean to share, view on a phone or print.
 */
export default function ReportLayout({ children }: LayoutProps<"/">) {
  return <>{children}</>;
}
