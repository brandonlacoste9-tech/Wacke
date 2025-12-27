"use client";

import { useState } from "react";

export default function GraffitiChat() {
  const [messages] = useState([
    { user: "Laval_Racer", text: "Tiguidou, on se revoit demain.", color: "text-yellow-400" },
    { user: "Laval_Racer", text: "Ayoye c'est malade ce play!", color: "text-yellow-400" },
    { user: "Laval_Racer", text: "Tiguidou, on se revoit demain.", color: "text-yellow-400" },
    { user: "Vieux_Fort_Vibes", text: "Wacké raide ce bug la!", color: "text-purple-400" },
    { user: "Laval_Racer", text: "C'est de valeur pour ton char mec.", color: "text-yellow-400" },
    { user: "GlitchQueen", text: "On s'en va au dep après?", color: "text-pink-400" },
    { user: "GlitchQueen", text: "Crisse de bon stream man.", color: "text-pink-400" },
    { user: "HockeyFan24", text: "Osti! que c'est drôle hahaha", color: "text-cyan-400" },
  ]);

  const [sacreMode, setSacreMode] = useState(true);

  return (
    <aside className="w-96 bg-wacke-darker border-l border-wacke-purple/30 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-wacke-purple/30 flex items-center justify-between">
        <h2 className="text-xl font-bold graffiti-text neon-pink">GRAFFITI CHAT</h2>
        <button 
          onClick={() => setSacreMode(!sacreMode)}
          className={`text-xs px-3 py-1 rounded-full font-bold transition-colors ${
            sacreMode 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-600 text-gray-300'
          }`}
        >
          MODE SACRÉ {sacreMode ? '🔥' : '💤'}
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className="animate-fade-in">
            <p className={`text-sm font-bold ${msg.color}`}>{msg.user}</p>
            <p className="text-sm text-gray-200 ml-2">{msg.text}</p>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-wacke-purple/30">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Spray ton message..."
            className="flex-1 bg-wacke-dark border border-wacke-purple/40 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-wacke-cyan/60 transition-colors"
          />
          <button className="bg-gradient-to-r from-wacke-pink to-wacke-purple px-4 py-2 rounded-lg hover:opacity-80 transition-opacity">
            ➤
          </button>
        </div>
        <div className="flex space-x-2 mt-2 text-xs text-gray-400">
          <button className="hover:text-wacke-cyan transition-colors">🎨</button>
          <button className="hover:text-wacke-cyan transition-colors">😎</button>
          <button className="hover:text-wacke-cyan transition-colors">🔥</button>
          <button className="hover:text-wacke-cyan transition-colors">⚡</button>
        </div>
      </div>
    </aside>
  );
}
