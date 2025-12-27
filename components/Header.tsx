export default function Header() {
  return (
    <header className="bg-wacke-darker border-b border-wacke-purple/30 px-6 py-4 flex items-center justify-between">
      {/* Logo and Navigation */}
      <div className="flex items-center space-x-8">
        <h1 className="text-3xl font-bold neon-pink font-graffiti">WACKÉ</h1>
        <nav className="flex space-x-6 text-gray-400">
          <a href="#" className="hover:text-wacke-cyan transition-colors">PARCOURIR</a>
          <a href="#" className="hover:text-wacke-cyan transition-colors">MUSIQUE</a>
          <a href="#" className="hover:text-wacke-cyan transition-colors">GAMING</a>
        </nav>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Chercher un stream, un jeu, un chilage..."
            className="w-full bg-wacke-dark border border-wacke-purple/40 rounded-full px-6 py-2 text-sm focus:outline-none focus:border-wacke-cyan/60 transition-colors"
          />
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        <div className="bg-gradient-to-r from-wacke-pink to-wacke-purple px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2">
          <span>⚡</span>
          <span>420 TOKENS</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wacke-cyan to-wacke-purple"></div>
      </div>
    </header>
  );
}
