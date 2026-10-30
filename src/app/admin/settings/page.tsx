import { redirect } from "next/navigation";

/** Settings were merged into the profile page. */
export default function SettingsPage() {
  redirect("/admin/profile");
}
