export default function MainContent() {
  return (
    <main className="flex-1 overflow-y-auto">
      {/* Live Stream Player */}
      <div className="relative aspect-video bg-black">
        {/* Stream placeholder - would be video player in production */}
        <div className="absolute inset-0 bg-gradient-to-br from-wacke-purple/20 via-transparent to-wacke-cyan/20">
          <img 
            src="/api/placeholder/1920/1080" 
            alt="Live Stream"
            className="w-full h-full object-cover opacity-80"
          />
        </div>
        
        {/* Live Badge */}
        <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded font-bold text-sm flex items-center space-x-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          <span>EN DIRECT</span>
        </div>

        {/* Viewer Count */}
        <div className="absolute top-4 left-32 bg-black/60 backdrop-blur-sm px-3 py-1 rounded flex items-center space-x-2">
          <span className="text-red-500">👁️</span>
          <span className="font-semibold">4,294 wackés</span>
        </div>

        {/* Neon Signs Overlay - decorative */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="text-6xl neon-cyan font-bold opacity-30">MTL</div>
        </div>
      </div>

      {/* Stream Info */}
      <div className="p-6 bg-wacke-darker border-t border-wacke-purple/30">
        <div className="flex items-start justify-between">
          <div className="flex space-x-4">
            {/* Streamer Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple"></div>
            
            {/* Stream Details */}
            <div>
              <h2 className="text-2xl font-bold mb-1">Kevin_du_450</h2>
              <p className="text-gray-300 mb-2">SPEEDRUN DU MÉTRO LIGNE VERTE (FAIL POSSIBLE)</p>
              <div className="flex space-x-2">
                <span className="bg-wacke-purple/40 px-3 py-1 rounded text-sm">#Quebec</span>
                <span className="bg-wacke-pink/40 px-3 py-1 rounded text-sm">#Rage</span>
                <span className="bg-wacke-cyan/40 px-3 py-1 rounded text-sm">#Wacké</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-3 rounded-lg font-bold flex items-center space-x-2 transition-all hover:scale-105">
              <span>🔥</span>
              <span>BOUM!</span>
            </button>
            <button className="bg-wacke-purple/40 hover:bg-wacke-purple/60 px-6 py-3 rounded-lg font-bold flex items-center space-x-2 transition-all hover:scale-105 border border-wacke-pink">
              <span>💜</span>
              <span>SUIVRE</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
