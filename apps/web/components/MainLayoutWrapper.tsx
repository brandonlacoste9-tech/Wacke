"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import LiveStatsTicker from "./LiveStatsTicker";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";

interface MainLayoutWrapperProps {
  children: React.ReactNode;
}

export default function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  const pathname = usePathname();
  const isOverlay = pathname.includes("/overlay");

  useEffect(() => {
    if (isOverlay) {
      document.body.style.background = "transparent";
      document.body.style.backgroundImage = "none";
      document.body.classList.add("bg-transparent-overlay");
    } else {
      document.body.style.background = "";
      document.body.style.backgroundImage = "";
      document.body.classList.remove("bg-transparent-overlay");
    }
  }, [isOverlay]);

  if (isOverlay) {
    return (
      <main className="w-screen h-screen overflow-hidden bg-transparent">
        {children}
      </main>
    );
  }

  return (
    <>
      <LiveStatsTicker />
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-[calc(100vh-64px)] overflow-x-hidden pb-16 md:pb-0 lg:ml-[296px]">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </>
  );
}
