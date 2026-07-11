"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error("Wacke App Error Boundary Caught:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-wacke-dark flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-red-900/10 z-0" />
      <div className="absolute inset-0 bg-[url('/bg_texture.jpg')] opacity-10 mix-blend-overlay z-0" />

      <div className="relative z-10 glass p-8 md:p-14 rounded-3xl border border-red-500/30 shadow-[0_0_40px_rgba(220,38,38,0.15)] max-w-xl w-full">
        <div className="flex justify-center mb-6 text-red-500 animate-pulse">
          <AlertTriangle className="w-20 h-20 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-display uppercase tracking-widest">
          System Overload
        </h2>
        
        <p className="text-gray-300 text-sm md:text-base mb-8 max-w-md mx-auto">
          Something went catastrophically wrong. The server hamsters tripped over a cable.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-colors border border-white/10"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider hover:scale-105 transition-transform shadow-[0_0_15px_rgba(220,38,38,0.4)]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
