"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

const MOCK_NOTIFICATIONS = [
  { id: "1", type: "follow", message: "Sophie 🎮 t'a suivi!", time: "il y a 2 min", read: false },
  { id: "2", type: "boum", message: "Gabriel 🏪 a envoyé un BOUM! 🔥", time: "il y a 15 min", read: false },
  { id: "3", type: "gift", message: "Ti-Coune t'a offert 100 jetons 💰", time: "il y a 1h", read: true },
  { id: "4", type: "live", message: "xQc est en live! 🔴", time: "il y a 2h", read: true },
];

/**
 * NotificationBell — Animated bell icon with badge count and dropdown panel.
 */
export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [hasRung, setHasRung] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen((prev) => !prev);
    if (!hasRung) setHasRung(true);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const TYPE_ICONS: Record<string, string> = {
    follow: "💜",
    boum: "🔥",
    gift: "🪙",
    live: "🔴",
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell
          className={`w-5 h-5 text-gray-400 hover:text-white transition-colors
                     ${unreadCount > 0 && !hasRung ? "animate-bell-ring" : ""}`}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-wacke-red text-white text-[9px] font-black rounded-full flex items-center justify-center animate-scale-in">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 glass-dark rounded-2xl shadow-2xl overflow-hidden animate-scale-in z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-wacke-purple/20">
            <h3 className="text-sm font-bold text-white">{t("notifications")}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-wacke-cyan hover:underline font-bold"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start space-x-3 px-4 py-3 hover:bg-white/3 transition-colors border-b border-white/3
                           ${!notif.read ? "bg-wacke-purple/5" : ""}`}
              >
                <span className="text-lg shrink-0 mt-0.5">
                  {TYPE_ICONS[notif.type] ?? "📢"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${!notif.read ? "text-white font-semibold" : "text-gray-400"}`}>
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{notif.time}</p>
                </div>
                {!notif.read && (
                  <span className="w-1.5 h-1.5 rounded-full bg-wacke-cyan shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-wacke-purple/20 text-center">
            <button className="text-[10px] text-gray-500 hover:text-wacke-cyan font-bold uppercase tracking-wider transition-colors">
              {t("viewAllNotifications")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
