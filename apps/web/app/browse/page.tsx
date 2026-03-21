export default function BrowsePage() {
  const categories = [
    { name: "Gaming", count: "2.4K streams", color: "from-green-600 to-green-800", icon: "🎮" },
    { name: "Musique", count: "1.2K streams", color: "from-pink-600 to-pink-800", icon: "🎵" },
    { name: "Jeu", count: "890 streams", color: "from-purple-600 to-purple-800", icon: "🎲" },
    { name: "Chilé", count: "654 streams", color: "from-red-600 to-red-800", icon: "😎" },
    { name: "Frette", count: "432 streams", color: "from-cyan-600 to-cyan-800", icon: "❄️" },
    { name: "Art", count: "321 streams", color: "from-yellow-600 to-yellow-800", icon: "🎨" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2 neon-pink font-graffiti">PARCOURIR</h1>
      <p className="text-gray-400 mb-8">Explore les streams les plus wackés</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.name}
            className={`bg-gradient-to-br ${category.color} p-8 rounded-xl cursor-pointer hover:scale-105 transition-transform neon-border`}
          >
            <div className="text-6xl mb-4">{category.icon}</div>
            <h2 className="text-2xl font-bold mb-2">{category.name}</h2>
            <p className="text-gray-200">{category.count}</p>
          </div>
        ))}
      </div>

      {/* Trending Streams */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">🔥 Streams en Feu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-wacke-darker rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-wacke-purple/40 to-wacke-cyan/40 relative">
                <div className="absolute top-2 left-2 bg-red-600 px-2 py-1 rounded text-xs font-bold">LIVE</div>
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs">
                  {Math.floor(Math.random() * 10000)} viewers
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple"></div>
                  <div>
                    <p className="font-semibold text-sm">Streamer_Name_{i}</p>
                    <p className="text-xs text-gray-400">Playing something cool</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
