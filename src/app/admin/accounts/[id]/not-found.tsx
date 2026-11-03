import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";

export default async function AccountNotFound() {
  const { t } = await getI18n();
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <h1 className="text-xl font-semibold">{t.accounts.notFound}</h1>
      <Button asChild>
        <Link href="/admin/accounts">{t.accounts.backToList}</Link>
      </Button>
    </div>
  );
}
