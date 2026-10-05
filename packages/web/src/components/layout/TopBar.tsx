"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Search, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { NotificationPanel } from "./NotificationPanel";
import { CommandPalette } from "./CommandPalette";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const router = useRouter();
  const { provider, practice, logout } = useAppStore();
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  const initials = provider?.name
    ? provider.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "DR";

  const handleLogout = () => {
    logout();
    localStorage.removeItem("oradent_token");
    localStorage.removeItem("oradent_refresh_token");
    router.push("/login");
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-6">
        {/* Left: Practice name */}
        <div>
          <h1 className="text-lg font-semibold text-stone-900">
            {practice?.name || "Oradent"}
          </h1>
        </div>

        {/* Center: Search trigger */}
        <button
          onClick={() => setCommandOpen(true)}
          className="flex h-9 w-80 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm text-stone-400 transition-colors hover:border-stone-300 hover:bg-stone-100"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search patients, actions...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-stone-200 bg-white px-1.5 font-mono text-[10px] font-medium text-stone-500 sm:flex">
            <span className="text-xs">&#x2318;</span>K
          </kbd>
        </button>

        {/* Right: Date, notifications, profile */}
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-stone-500 lg:block">{today}</span>

          <ThemeToggle />

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

            {notificationsOpen && (
              <NotificationPanel
                onClose={() => setNotificationsOpen(false)}
              />
            )}
          </div>

          {/* Provider dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-stone-100">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: provider?.color || "#0d9488" }}
                >
                  {initials}
                </div>
                <ChevronDown className="h-4 w-4 text-stone-400" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 min-w-[200px] overflow-hidden rounded-lg border border-stone-200 bg-white p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
              >
                <div className="px-3 py-2 border-b border-stone-100 mb-1">
                  <p className="text-sm font-medium text-stone-900">
                    {provider?.name || "Provider"}
                  </p>
                  <p className="text-xs text-stone-500">
                    {provider?.email || ""}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {provider?.role} {provider?.title ? `- ${provider.title}` : ""}
                  </p>
                </div>

                <DropdownMenu.Item asChild>
                  <Link
                    href="/settings"
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-stone-700 outline-none transition-colors hover:bg-stone-100 focus:bg-stone-100"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1 h-px bg-stone-100" />

                <DropdownMenu.Item
                  onClick={handleLogout}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 outline-none transition-colors hover:bg-red-50 focus:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
