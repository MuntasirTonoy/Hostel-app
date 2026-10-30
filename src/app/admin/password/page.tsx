import { redirect } from "next/navigation";

/** Password changing now lives on the profile page. */
export default function PasswordPage() {
  redirect("/admin/profile#password");
}
