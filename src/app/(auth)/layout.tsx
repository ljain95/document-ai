import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If the visitor already has a valid session, skip the auth screens entirely.
  const session = await getSession();
  if (session) redirect("/app");

  const dict = t();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="px-8 py-6">
        <Link href="/" className="inline-flex items-center gap-3">
          <Image
            src="/icon.png"
            alt=""
            width={28}
            height={28}
            className="rounded-sm"
            priority
          />
          <span className="text-[15px] font-medium text-neutral-900">
            {dict.app.name}
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      <footer className="flex justify-center gap-6 px-8 py-6 text-xs text-neutral-500">
        <Link href="#" className="hover:text-neutral-900">
          {dict.footer.terms}
        </Link>
        <Link href="#" className="hover:text-neutral-900">
          {dict.footer.privacy}
        </Link>
        <Link href="#" className="hover:text-neutral-900">
          {dict.footer.security}
        </Link>
      </footer>
    </div>
  );
}
