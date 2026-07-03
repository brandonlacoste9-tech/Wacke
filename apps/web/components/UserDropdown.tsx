"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import Link from "next/link";
import { User, Settings, Radio, LogOut, ChevronDown } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

/**
 * UserDropdown — Avatar dropdown menu for authenticated users.
 * Shows profile links, settings, dashboard, and logout.
 */
export default function UserDropdown() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  if (!user) return null;

  const initials = user.displayName.substring(0, 2).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-[11px] font-black text-white uppercase border border-white/10 shadow-md group-hover:shadow-wacke-pink/20 transition-shadow">
          {initials}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200
                     ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 glass-dark rounded-2xl shadow-2xl overflow-hidden animate-scale-in z-50">
          {/* User Info */}
          <div className="px-4 py-4 border-b border-wacke-purple/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-sm font-black text-white uppercase border border-white/10">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {user.displayName}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  @{user.username}
                </p>
              </div>
            </div>
            {/* Token balance */}
            <div className="mt-3 flex items-center space-x-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5">
              <img src="/token.png" alt="Token" className="w-4 h-4 object-contain" />
              <span className="text-xs font-bold text-yellow-400">
                {user.tokenBalance.toLocaleString("fr-CA")} {t("tokens")}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1.5">
            <Link
              href={`/profile/${user.username}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-4 py-2.5 hover:bg-white/3 transition-colors text-gray-300 hover:text-white"
            >
              <User className="w-4 h-4" />
              <span className="text-sm">{t("myProfile")}</span>
            </Link>
            <Link
              href="/dashboard/stream"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-4 py-2.5 hover:bg-white/3 transition-colors text-gray-300 hover:text-white"
            >
              <Radio className="w-4 h-4" />
              <span className="text-sm">{t("dashboard")}</span>
            </Link>
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-4 py-2.5 hover:bg-white/3 transition-colors text-gray-300 hover:text-white"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">{t("settings")}</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-wacke-purple/20 py-1.5">
            <button
              onClick={() => { setIsOpen(false); logout(); }}
              className="flex items-center space-x-3 px-4 py-2.5 hover:bg-red-500/5 transition-colors text-gray-400 hover:text-red-400 w-full"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">{t("disconnect")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
