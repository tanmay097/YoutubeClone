"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IKIcon } from "./IKIcon";
import { Avatar } from "./Avatar";
import { useAuth } from "./AuthProvider";

const NAV = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/upload", label: "Upload", icon: "upload" },
  { href: "/account", label: "You", icon: "user" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();
  const bare = pathname === "/login" || pathname === "/register";

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-fg focus:px-3 focus:py-2 focus:text-bg">
        Skip to content
      </a>
      <TopBar onMenu={() => setExpanded((v) => !v)} />
      {!bare && <Sidebar expanded={expanded} pathname={pathname} />}
      <main
        id="main"
        className={`pt-14 pb-20 md:pb-6 ${bare ? "" : expanded ? "md:pl-[72px] xl:pl-60" : "md:pl-[72px]"}`}
      >
        {children}
      </main>
      {!bare && <BottomNav pathname={pathname} />}
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { user, loading } = useAuth();
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-4 bg-bg/95 px-2 backdrop-blur sm:px-4">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Toggle sidebar"
          className="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 hover:bg-chip md:flex"
        >
          <IKIcon name="menu" />
        </button>
        <Link href="/" className="flex items-center gap-1.5 rounded-lg px-2 py-1" aria-label="Vidora home">
          <IKIcon name="logo" size={30} />
          <span className="text-xl font-extrabold tracking-tight">Vidora</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <Link
            href="/upload"
            className="flex h-9 cursor-pointer items-center gap-2 rounded-full bg-chip px-3 text-sm font-semibold transition-colors duration-200 hover:bg-chip-hover"
          >
            <IKIcon name="create" size={20} />
            <span className="hidden sm:inline">Create</span>
          </Link>
        )}
        {loading ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-chip" />
        ) : user ? (
          <AccountMenu />
        ) : (
          <Link
            href="/login"
            className="flex h-9 items-center gap-2 rounded-full border border-line px-3 text-sm font-semibold text-link transition-colors duration-200 hover:bg-link/10"
          >
            <IKIcon name="user" size={20} />
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!user) return null;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex cursor-pointer rounded-full"
      >
        <Avatar src={user.avatarUrl} name={user.name} size={32} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl bg-elevated py-2 shadow-2xl ring-1 ring-line">
          <div className="flex items-center gap-3 border-b border-line px-4 pb-3 pt-1">
            <Avatar src={user.avatarUrl} name={user.name} size={40} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          </div>
          <MenuItem icon="user" label="Your account" onClick={() => { setOpen(false); router.push("/account"); }} />
          <MenuItem icon="upload" label="Upload video" onClick={() => { setOpen(false); router.push("/upload"); }} />
          <MenuItem
            icon="logout"
            label="Sign out"
            onClick={async () => {
              setOpen(false);
              await logout();
              router.push("/");
              router.refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-4 px-4 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-chip"
    >
      <IKIcon name={icon} size={22} />
      {label}
    </button>
  );
}

function Sidebar({ expanded, pathname }: { expanded: boolean; pathname: string }) {
  return (
    <nav
      aria-label="Primary"
      className={`fixed bottom-0 left-0 top-14 z-40 hidden overflow-y-auto bg-bg px-1 md:block ${expanded ? "w-[72px] xl:w-60 xl:px-3" : "w-[72px]"}`}
    >
      <ul className="flex flex-col gap-0.5 pt-1">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center rounded-xl transition-colors duration-150 hover:bg-chip ${active ? "bg-chip font-semibold" : ""} ${
                  expanded
                    ? "flex-col gap-1 py-4 text-[10px] xl:flex-row xl:gap-6 xl:px-3 xl:py-2.5 xl:text-sm"
                    : "flex-col gap-1 py-4 text-[10px]"
                }`}
              >
                <IKIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {expanded && (
        <p className="mt-6 hidden border-t border-line px-3 pt-4 text-xs leading-relaxed text-muted xl:block">
          Vidora: share videos, subscribe to creators, and join the conversation.
        </p>
      )}
    </nav>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-line bg-bg md:hidden">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] ${active ? "font-semibold" : "text-muted"}`}
          >
            <IKIcon name={item.icon} size={24} className={active ? "" : "opacity-75"} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
