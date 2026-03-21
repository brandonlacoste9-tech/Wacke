export default function Sidebar() {
  const recommendedChannels = [
    { name: "Roxanne_Glitch", game: "Juste de la lase", viewers: "12k", live: true },
    { name: "Le_Mapache", game: "Elden Ring DLC", viewers: "4.5k", live: true },
    { name: "Poutine_Cyborg", game: "Dernier live-Hier", viewers: null, live: false },
  ];

  const categories = [
    { name: "Jeu", icon: "🎮", color: "from-purple-600 to-purple-800" },
    { name: "Chilé", icon: "😎", color: "from-red-600 to-red-800" },
    { name: "Frette", icon: "❄️", color: "from-cyan-600 to-cyan-800" },
    { name: "Gaming", icon: "🎮", color: "from-green-600 to-green-800" },
  ];

  return (
    <aside className="w-72 bg-wacke-darker border-r border-wacke-purple/30 p-4 overflow-y-auto">
      {/* Recommended Channels */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          CHAÎNES RECOMMANDÉES
        </h2>
        <div className="space-y-3">
          {recommendedChannels.map((channel) => (
            <div key={channel.name} className="flex items-center space-x-3 hover:bg-wacke-dark/50 p-2 rounded cursor-pointer transition-colors">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple"></div>
                {channel.live && (
                  <span className="absolute -bottom-1 -right-1 bg-red-600 text-xs px-1.5 py-0.5 rounded text-white font-bold">
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{channel.name}</p>
                <p className="text-xs text-gray-400">{channel.game}</p>
              </div>
              {channel.viewers && (
                <span className="text-xs text-gray-400">{channel.viewers}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          CATÉGORIES WACKÉ
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => (
            <div
              key={category.name}
              className={`bg-gradient-to-br ${category.color} p-4 rounded-lg cursor-pointer hover:scale-105 transition-transform`}
            >
              <div className="text-3xl mb-2">{category.icon}</div>
              <p className="text-sm font-semibold">{category.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Discord Join */}
      <div className="mt-8 bg-wacke-dark/50 border border-wacke-purple/30 rounded-lg p-4">
        <p className="text-sm text-gray-300 mb-3">Rejoindre le squad Discord?</p>
        <button className="w-full bg-[#5865F2] hover:bg-[#4752C4] py-2 px-4 rounded font-semibold text-sm transition-colors">
          Embarque
        </button>
      </div>
    </aside>
  );
}
