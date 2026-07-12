"use client";

import { Flame } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function MainContent() {
  const { language } = useLanguage();
  const isFr = language === "fr";

  return (
    <main className="flex-1 overflow-y-auto">
      {/* Live Stream Player */}
      <div className="relative aspect-video bg-black">
        {/* Stream placeholder - would be video player in production */}
        <div className="absolute inset-0 bg-gradient-to-br from-wacke-purple/20 via-transparent to-wacke-cyan/20 flex items-center justify-center">
          <div className="text-6xl neon-cyan font-bold opacity-30">LIVE STREAM</div>
        </div>

        {/* Live Badge */}
        <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded font-bold text-sm flex items-center space-x-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          <span>{isFr ? "EN DIRECT" : "LIVE"}</span>
        </div>

        {/* Viewer Count */}
        <div className="absolute top-4 left-32 bg-black/60 backdrop-blur-sm px-3 py-1 rounded flex items-center space-x-2">
          <span className="text-red-500">👁️</span>
          <span className="font-semibold">4,294 wackés</span>
        </div>
      </div>

      {/* Stream Info */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex space-x-4">
            {/* Streamer Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-2xl font-bold">
              G
            </div>

            <div>
              <h1 className="text-2xl font-bold">Just Chatting avec la gang</h1>
              <p className="text-wacke-cyan font-semibold">Gabriel 🏪</p>
              <div className="flex space-x-2 mt-2">
                <span className="bg-wacke-purple/40 px-3 py-1 rounded text-sm">Just Chatting</span>
                <span className="bg-wacke-pink/40 px-3 py-1 rounded text-sm">#Québec</span>
                <span className="bg-wacke-cyan/40 px-3 py-1 rounded text-sm">#Wacké</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-3 rounded-lg font-bold flex items-center space-x-2 transition-all hover:scale-105">
              <Flame className="w-5 h-5 text-white fill-current animate-pulse" />
              <span>{isFr ? "BOUM!" : "BOOM!"}</span>
            </button>
            <button className="bg-wacke-purple/40 hover:bg-wacke-purple/60 px-6 py-3 rounded-lg font-bold flex items-center space-x-2 transition-all hover:scale-105 border border-wacke-pink">
              <span>💜</span>
              <span>{isFr ? "SUIVRE" : "FOLLOW"}</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
