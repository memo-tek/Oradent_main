"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Receipt,
  Brain,
  AlertCircle,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = "appointment" | "billing" | "ai" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const typeConfig: Record<
  NotificationType,
  { icon: typeof Calendar; color: string; bg: string }
> = {
  appointment: {
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  billing: {
    icon: Receipt,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  ai: {
    icon: Brain,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  system: {
    icon: AlertCircle,
    color: "text-stone-600",
    bg: "bg-stone-50",
  },
};

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "appointment",
    title: "Upcoming Appointment",
    message: "John Doe has an appointment at 2:00 PM today.",
    time: "10 min ago",
    read: false,
  },
  {
    id: "2",
    type: "billing",
    title: "Payment Received",
    message: "Jane Smith paid $250 for invoice #1042.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    type: "ai",
    title: "AI Analysis Ready",
    message: "X-ray analysis for Robert Johnson is complete.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "4",
    type: "system",
    title: "System Update",
    message: "Oradent v2.1 is now available with new features.",
    time: "5 hours ago",
    read: true,
  },
  {
    id: "5",
    type: "appointment",
    title: "Cancelled Appointment",
    message: "Maria Garcia cancelled her 4:00 PM appointment.",
    time: "Yesterday",
    read: true,
  },
];

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl animate-in fade-in-0 slide-in-from-top-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-stone-900">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-teal-100 px-1.5 text-[10px] font-medium text-teal-700">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearAll}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <Trash2 className="h-3 w-3" />
            Clear all
          </button>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-stone-400">
            <Check className="mb-2 h-8 w-8" />
            <p className="text-sm">All caught up!</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => {
              const config = typeConfig[notification.type];
              const Icon = config.icon;

              return (
                <button
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50",
                    !notification.read && "bg-teal-50/30"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      config.bg
                    )}
                  >
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm",
                          notification.read
                            ? "text-stone-600"
                            : "font-medium text-stone-900"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-stone-500 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[10px] text-stone-400">
                      {notification.time}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-stone-100 px-4 py-2">
          <button className="w-full rounded-md py-1.5 text-center text-xs font-medium text-teal-600 transition-colors hover:bg-teal-50">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
