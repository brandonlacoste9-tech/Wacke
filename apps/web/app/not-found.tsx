"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-wacke-dark flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-wacke-purple/10 via-wacke-dark to-wacke-dark z-0" />
      <div className="absolute inset-0 bg-[url('/bg_texture.jpg')] opacity-10 mix-blend-overlay z-0" />

      <div className="relative z-10 glass p-10 md:p-16 rounded-3xl border border-wacke-cyan/30 shadow-[0_0_40px_rgba(0,255,255,0.1)] max-w-2xl w-full">
        <h1 className="text-7xl md:text-9xl font-black font-display tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-wacke-cyan to-wacke-pink mb-4 drop-shadow-[0_0_15px_rgba(255,42,133,0.5)]">
          404
        </h1>
        
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 font-display uppercase tracking-wider graffiti-text transform -rotate-2">
          Page roasted by AI
        </h2>
        
        <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-md mx-auto">
          We looked everywhere, but this stream is offline, deleted, or never existed in the first place.
        </p>

        <Link
          href="/"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-wacke-pink to-wacke-purple text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(255,42,133,0.4)] hover:shadow-[0_0_30px_rgba(255,42,133,0.6)]"
        >
          <Zap className="w-5 h-5" />
          <span>Back to Chaos</span>
        </Link>
      </div>
    </main>
  );
}
