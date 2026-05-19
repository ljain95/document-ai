import { LoginForm } from "../loginForm";
import { t } from "@/lib/i18n";

export default function LoginPage() {
  const dict = t().auth.login;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">{dict.title}</h1>
        <p className="text-sm text-neutral-500">{dict.subtitle}</p>
      </div>
      <LoginForm />
    </div>
  );
}
