"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup, isAuthSuccess } from "@/network/auth";
import { t } from "@/lib/i18n";

type ErrorKey = keyof ReturnType<typeof t>["auth"]["errors"];

export function SignupForm() {
  const dict = t().auth.signup;
  const errorDict = t().auth.errors;
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function notifyError(code: ErrorKey) {
    toast.error(errorDict[code]);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const form = new FormData(event.currentTarget);
    try {
      const result = await signup({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      if (isAuthSuccess(result)) {
        router.replace("/app");
        return;
      }
      notifyError(result.error);
    } catch {
      notifyError("network_error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-neutral-900">
          {dict.nameLabel}
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          placeholder={dict.namePlaceholder}
          className="h-11 bg-white"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-neutral-900">
          {dict.emailLabel}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={dict.emailPlaceholder}
          className="h-11 bg-white"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-neutral-900">
          {dict.passwordLabel}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder={dict.passwordPlaceholder}
          className="h-11 bg-white"
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full bg-neutral-900 text-white hover:bg-neutral-800"
      >
        {pending ? dict.submitting : dict.submit}
        {!pending && <ArrowRight className="h-4 w-4" />}
      </Button>

      <p className="text-center text-sm text-neutral-500">
        {dict.haveAccount}{" "}
        <a
          href="/login"
          className="text-neutral-900 underline-offset-4 hover:underline"
        >
          {dict.signIn}
        </a>
      </p>
    </form>
  );
}
