"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  BookOpenIcon,
  CogIcon,
  HighlighterIcon,
  HistoryIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";
import For from "@/components/logics/forData";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipProvider, TooltipWrapper } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { logout } from "@/network/auth";
import { t } from "@/lib/i18n";

interface Item {
  title: string;
  icon: LucideIcon;
  path: string;
  fullUrl: string;
}

interface MiniSidebarProps {
  email: string;
}

export function MiniSidebar({ email }: MiniSidebarProps) {
  const dict = t().app.sidebar;
  const pathname = usePathname();
  const router = useRouter();

  const ITEMS: Item[] = [
    {
      title: dict.library,
      icon: BookOpenIcon,
      path: "/app/library",
      fullUrl: "/app/library",
    },
  ];

  const BOTTOM_ITEMS: Item[] = [
    {
      title: dict.settings,
      icon: CogIcon,
      path: "/app/settings",
      fullUrl: "/app/settings",
    },
  ];

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  function renderItem(item: Item) {
    const active = pathname.startsWith(item.path);
    return (
      <TooltipWrapper label={item.title}>
        <div className="flex flex-col items-center justify-center">
          <div
            onClick={() => {
              if (!active) router.push(item.fullUrl);
            }}
            className={cn(
              "size-8 rounded-md cursor-pointer flex items-center justify-center",
              active && "border bg-white",
            )}
          >
            <item.icon className="size-5" />
          </div>
          <p className="text-[8px] text-center mt-1">{item.title}</p>
        </div>
      </TooltipWrapper>
    );
  }

  const initial = (email[0] ?? "?").toUpperCase();

  return (
    <TooltipProvider delayDuration={150}>
      <div className="h-screen w-16 flex flex-col items-center px-3 py-6 gap-4 border-r bg-background">
        <Image
          src="/icon.png"
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 mb-2"
          priority
        />

        <For data={ITEMS} render={renderItem} />

        <div className="mt-auto flex flex-col items-center gap-4">
          <For data={BOTTOM_ITEMS} render={renderItem} />

          <div className="w-8 h-px bg-border" />

          <Popover>
            <PopoverTrigger asChild>
              <div
                className="size-10 rounded-full bg-pink-200 text-foreground flex items-center justify-center cursor-pointer font-medium"
                aria-label={email}
              >
                {initial}
              </div>
            </PopoverTrigger>
            <PopoverContent side="right" align="end" className="w-44 p-1">
              <button
                onClick={() => router.push("/app/account")}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent text-left"
              >
                <UserIcon className="size-4" />
                {dict.account}
              </button>
              <button
                onClick={() => router.push("/app/settings")}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent text-left"
              >
                <SettingsIcon className="size-4" />
                {dict.settings}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent text-left text-destructive"
              >
                <LogOutIcon className="size-4" />
                {dict.logout}
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </TooltipProvider>
  );
}
