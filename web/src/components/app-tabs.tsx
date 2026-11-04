"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, FileText } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { Brand } from "@/components/site";

const TABS = [
  { href: "/app/", label: "履歴書", icon: FileText },
  { href: "/app/applications/", label: "選考管理", icon: ClipboardList },
];

function useCurrent() {
  const path = usePathname();
  const current = path.replace(/\/?$/, "/");
  // 選考管理は、応募先の詳しいページ（/app/applications/detail/）でも選んだ状態にする
  return (href: string) => (href === "/app/" ? current === href : current.startsWith(href));
}

/** 履歴書の一覧・選考管理で共通のヘッダー（ロゴと、パソコンでは切り替えのタブ） */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-3 px-4 sm:px-6">
        <Brand />
        <HeaderTabs />
      </div>
    </header>
  );
}

/** パソコン：ヘッダーの右で切り替える */
function HeaderTabs() {
  const current = useCurrent();
  return (
    <nav aria-label="画面の切り替え" className="ml-auto hidden gap-1 lg:flex">
      {TABS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={current(href) ? "page" : undefined}
          className={cn(buttonVariants({ variant: "ghost" }), "text-muted-foreground aria-[current=page]:bg-primary/10 aria-[current=page]:text-primary")}
        >
          <Icon data-icon="inline-start" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** スマホ：画面下に固定するタブ。ヘッダーの外に置く（ぼかしのあるヘッダーの中では画面に固定されないため） */
export function BottomTabs() {
  const current = useCurrent();
  return (
    <nav aria-label="画面の切り替え" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={current(href) ? "page" : undefined}
            className="flex h-16 flex-col items-center justify-center gap-1 text-xs text-muted-foreground outline-none focus-visible:bg-muted aria-[current=page]:text-primary"
          >
            <Icon className="size-6" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
