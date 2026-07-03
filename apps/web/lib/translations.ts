export type Language = "fr" | "en";

export const translations = {
  fr: {
    // ── Header & Nav ──────────────────────────────────────────────────
    browse: "Parcourir",
    searchPlaceholder: "Rechercher des streams, catégories...",
    login: "Connexion",
    logout: "Se déconnecter",
    dashboardStream: "Streamer",
    home: "Accueil",
    gaming: "Gaming",
    music: "Musique",
    irl: "IRL",

    // ── Sidebar ───────────────────────────────────────────────────────
    recommended: "Chaînes Recommandées",
    caisseDeBiere: "La Caisse de Bière",
    noDonors: "Aucun donateur aujourd'hui",
    joinDiscord: "Rejoindre le Discord Wacké ?",
    join: "Rejoindre",
    expand: "Agrandir",
    collapse: "Réduire",

    // ── Home Page ─────────────────────────────────────────────────────
    welcome: "Bienvenue sur Wacké",
    heroSubtitle: "Le hub du streaming québécois. Sans filtre. 100% pur jus.",
    spectators: "Spectateurs",
    channels: "Chaînes",
    boom: "BOUM!",
    browseByCategory: "PARCOURIR PAR CATÉGORIE",

    // ── Category names ────────────────────────────────────────────────
    catGaming: "Gaming",
    catMusique: "Musique",
    catJeu: "Jeu",
    catChile: "Chilé",
    catFrette: "Frette",
    catArt: "Art",
    catIrl: "IRL",
    catTalk: "Jasette",

    // ── Combined Stream Grid ──────────────────────────────────────────
    liveNow: "🔴 LIVE MAINTENANT",
    loadMore: "Charger plus",
    all: "Tout",
    noLiveStreams: "Aucun stream en direct pour le moment",
    seeAll: "Voir tout",

    // ── Feature Showcase ──────────────────────────────────────────────
    whyWacke: "Pourquoi Wacké?",
    whyWackeSub: "Le premier hub de streaming 100% québécois. Voici ce qui nous rend uniques.",
    feature1Title: "Graffiti Chat",
    feature1Sub: "Chat en temps réel",
    feature1Desc: "Un chat graffiti-style propulsé par WebSocket. Spraye tes réactions en direct avec le style urbain québécois.",
    feature2Title: "Mode Sacré",
    feature2Sub: "Culture authentique",
    feature2Desc: "Les sacres québécois passent librement — c'est notre culture. Le vrai hate speech? Bloqué net. Zéro tolérance.",
    feature3Title: "Économie de Tokens",
    feature3Sub: "Récompense tes créateurs",
    feature3Desc: "Gagne 500 jetons par jour. Envoie des BOUM! 🔥 à tes streamers préférés. Chaque réaction compte.",

    // ── Graffiti Chat ─────────────────────────────────────────────────
    chatPlaceholder: "Spray ton message...",
    ttsBtn: "TTS (50 🪙)",
    ttsGenerating: "Génération...",
    stickerTitle: "GÉNÉRATEUR DE STICKERS AI (100 🪙)",
    stickerPlaceholder: "Ex: un canard punk...",
    stickerBtn: "Sprayer",
    soundboardTitle: "SOUNDBOARD INTERACTIVE",
    sacreTitle: "GÉNÉRATEUR DE SACRES QUÉBÉCOIS",
    sacreTtsCheckbox: "Hurler via TTS (+50 🪙)",
    sacreBtn: "Crier",
    sacreActive: "Mode Sacré actif — sacres permis",
    sacreDisabled: "Mode Sacré désactivé",
    chatEmpty: "Sois le premier à sprayer un message...",
    loginToChat: "Connecte-toi pour chatter...",
    aiDrawing: "L'IA dessine ton graffiti... (2s)",
    shouting: "Cri en cours...",
    sendLabel: "Envoyer",
    playedSound: "a joué le son",
    stickerLabel: "STICKER AI",
    prefixLabel: "Préfixe",
    sacreLabel: "Sacre",
    suffixLabel: "Suffixe",
    stickerTooltip: "Générateur de stickers AI (100 jetons)",
    soundTooltip: "Soundboard interactive (20-50 jetons)",
    sacreTooltip: "Générateur de sacres (10 jetons)",

    // ── Token Shop ────────────────────────────────────────────────────
    shopTitle: "BOUTIQUE DE JETONS 🪙",
    shopSubtitle: "Recharge ton solde pour débloquer les modules sacrés, TTS, stickers et soundboard !",
    buyBtn: "Recharger",
    loadingCheckout: "Redirection vers Stripe...",
    loginToBuy: "Tu dois être connecté pour acheter des jetons",
    stripeError: "Erreur Stripe",
    paymentUrlMissing: "L'URL de paiement est introuvable",
    connectionError: "Erreur de connexion",
    popular: "POPULAIRE",
    securedByStripe: "Sécurisé par Stripe",

    // ── KickFeaturedCarousel ──────────────────────────────────────────
    watchLive: "Regarder Live 🟢",
    featuredOn: "🔴 À l'affiche sur Wacké",

    // ── KickStreamGrid ────────────────────────────────────────────────
    livesDuMoment: "🔴 LIVES DU MOMENT",
    viewAll: "Voir tout →",
    noStreamsNow: "Aucun stream en direct pour le moment",

    // ── TrendingGames ─────────────────────────────────────────────────
    trending: "Tendances",
    viewStreams: "Voir les streams →",

    // ── Browse Page ───────────────────────────────────────────────────
    searchResults: "Résultats de recherche pour les streams en direct",
    exploreCategory: "Explore les streams de la catégorie",
    exploreWacke: "Explore les streams les plus wackés du moment",
    allCategories: "← Toutes les catégories",
    categories: "Catégories",
    searchLabel: "RECHERCHE",
    livesLabel: "LIVES",
    browsePage: "PARCOURIR",

    // ── User Dropdown ─────────────────────────────────────────────────
    tokens: "jetons",
    myProfile: "Mon profil",
    dashboard: "Tableau de bord",
    settings: "Paramètres",
    disconnect: "Déconnexion",

    // ── Notification Bell ─────────────────────────────────────────────
    notifications: "Notifications",
    markAllRead: "Tout marquer lu",
    viewAllNotifications: "Voir toutes les notifications",

    // ── Mobile Bottom Nav ─────────────────────────────────────────────
    explore: "Explore",
    stream: "Stream",
    profile: "Profil",
    tokensNav: "Jetons",
    alreadyClaimed: "⏰ Déjà réclamé",

    // ── Follow Button ─────────────────────────────────────────────────
    loginToFollow: "Connecte-toi pour suivre ce streamer!",
    followError: "Erreur de connexion.",
    connectionLost: "Connexion perdue. Réessaie.",
    following: "ABONNÉ ✅",
    follow: "SUIVRE",

    // ── WackePlayer ───────────────────────────────────────────────────
    connectingStream: "Connexion au stream...",
    streamOffline: "Stream hors ligne",
    streamerReturns: "Le streamer revient bientôt...",
    theaterMode: "Mode théâtre",
    fullscreen: "Plein écran",
    unmute: "Activer le son",
    mute: "Couper le son",

    // ── Header misc ───────────────────────────────────────────────────
    claimSuccess: "+500 jetons! 🪙",
    claimAlready: "Déjà réclamé aujourd'hui!",
    openShop: "Ouvrir la boutique de jetons Wacké",
    claimTooltip: "Réclamer ton bonus quotidien de 500 jetons",
    themeLabel: "Thème",
    nightMode: "Mode Nuit Blanche",
  },
  en: {
    // ── Header & Nav ──────────────────────────────────────────────────
    browse: "Browse",
    searchPlaceholder: "Search streams, categories...",
    login: "Log In",
    logout: "Log Out",
    dashboardStream: "Stream",
    home: "Home",
    gaming: "Gaming",
    music: "Music",
    irl: "IRL",

    // ── Sidebar ───────────────────────────────────────────────────────
    recommended: "Recommended Channels",
    caisseDeBiere: "The Beer Case",
    noDonors: "No spenders today",
    joinDiscord: "Join the Wacké Discord?",
    join: "Join Now",
    expand: "Expand",
    collapse: "Collapse",

    // ── Home Page ─────────────────────────────────────────────────────
    welcome: "Welcome to Wacké",
    heroSubtitle: "The home of Quebec streaming. Unfiltered. 100% real.",
    spectators: "Spectators",
    channels: "Channels",
    boom: "BOOM!",
    browseByCategory: "BROWSE BY CATEGORY",

    // ── Category names ────────────────────────────────────────────────
    catGaming: "Gaming",
    catMusique: "Music",
    catJeu: "Games",
    catChile: "Chill",
    catFrette: "Cold",
    catArt: "Art",
    catIrl: "IRL",
    catTalk: "Talk",

    // ── Combined Stream Grid ──────────────────────────────────────────
    liveNow: "🔴 LIVE NOW",
    loadMore: "Load more",
    all: "All",
    noLiveStreams: "No live streams currently",
    seeAll: "See all",

    // ── Feature Showcase ──────────────────────────────────────────────
    whyWacke: "Why Wacké?",
    whyWackeSub: "The first 100% Quebec-centric streaming hub. Here is what makes us unique.",
    feature1Title: "Graffiti Chat",
    feature1Sub: "Real-time Chat",
    feature1Desc: "A graffiti-style chat powered by WebSocket. Spray your reactions live in French-Canadian street-art style.",
    feature2Title: "Mode Sacré",
    feature2Sub: "Authentic Culture",
    feature2Desc: "Quebec swear words pass freely—it's part of our culture. Genuine hate speech? Blocked instantly. Zero tolerance.",
    feature3Title: "Token Economy",
    feature3Sub: "Support Your Creators",
    feature3Desc: "Get 500 free tokens daily. Send BOUM! 🔥 to your favorite streamers. Every interaction counts.",

    // ── Graffiti Chat ─────────────────────────────────────────────────
    chatPlaceholder: "Spray your message...",
    ttsBtn: "TTS (50 🪙)",
    ttsGenerating: "Generating...",
    stickerTitle: "AI STICKER GENERATOR (100 🪙)",
    stickerPlaceholder: "Ex: a punk duck...",
    stickerBtn: "Spray",
    soundboardTitle: "INTERACTIVE SOUNDBOARD",
    sacreTitle: "QUÉBÉCOIS SWEAR GENERATOR",
    sacreTtsCheckbox: "Scream via TTS (+50 🪙)",
    sacreBtn: "Shout",
    sacreActive: "Mode Sacré active — swears allowed",
    sacreDisabled: "Mode Sacré disabled",
    chatEmpty: "Be the first to spray a message...",
    loginToChat: "Log in to chat...",
    aiDrawing: "AI is drawing your graffiti... (2s)",
    shouting: "Shouting...",
    sendLabel: "Send",
    playedSound: "played the sound",
    stickerLabel: "AI STICKER",
    prefixLabel: "Prefix",
    sacreLabel: "Swear",
    suffixLabel: "Suffix",
    stickerTooltip: "AI sticker generator (100 tokens)",
    soundTooltip: "Interactive soundboard (20-50 tokens)",
    sacreTooltip: "Swear generator (10 tokens)",

    // ── Token Shop ────────────────────────────────────────────────────
    shopTitle: "TOKEN SHOP 🪙",
    shopSubtitle: "Refill your balance to unlock swear generators, TTS voices, stickers, and soundboard chimes!",
    buyBtn: "Purchase",
    loadingCheckout: "Redirecting to Stripe...",
    loginToBuy: "You must be logged in to buy tokens",
    stripeError: "Stripe Error",
    paymentUrlMissing: "Payment URL not found",
    connectionError: "Connection error",
    popular: "POPULAR",
    securedByStripe: "Secured by Stripe",

    // ── KickFeaturedCarousel ──────────────────────────────────────────
    watchLive: "Watch Live 🟢",
    featuredOn: "🔴 Featured on Wacké",

    // ── KickStreamGrid ────────────────────────────────────────────────
    livesDuMoment: "🔴 LIVE NOW",
    viewAll: "See all →",
    noStreamsNow: "No live streams at the moment",

    // ── TrendingGames ─────────────────────────────────────────────────
    trending: "Trending",
    viewStreams: "View streams →",

    // ── Browse Page ───────────────────────────────────────────────────
    searchResults: "Search results for live streams",
    exploreCategory: "Explore streams in the",
    exploreWacke: "Explore the hottest streams right now",
    allCategories: "← All Categories",
    categories: "Categories",
    searchLabel: "SEARCH",
    livesLabel: "LIVE",
    browsePage: "BROWSE",

    // ── User Dropdown ─────────────────────────────────────────────────
    tokens: "tokens",
    myProfile: "My Profile",
    dashboard: "Dashboard",
    settings: "Settings",
    disconnect: "Log Out",

    // ── Notification Bell ─────────────────────────────────────────────
    notifications: "Notifications",
    markAllRead: "Mark all as read",
    viewAllNotifications: "View all notifications",

    // ── Mobile Bottom Nav ─────────────────────────────────────────────
    explore: "Explore",
    stream: "Stream",
    profile: "Profile",
    tokensNav: "Tokens",
    alreadyClaimed: "⏰ Already claimed",

    // ── Follow Button ─────────────────────────────────────────────────
    loginToFollow: "Log in to follow this streamer!",
    followError: "Connection error.",
    connectionLost: "Connection lost. Try again.",
    following: "FOLLOWING ✅",
    follow: "FOLLOW",

    // ── WackePlayer ───────────────────────────────────────────────────
    connectingStream: "Connecting to stream...",
    streamOffline: "Stream offline",
    streamerReturns: "The streamer will be back soon...",
    theaterMode: "Theater mode",
    fullscreen: "Fullscreen",
    unmute: "Unmute",
    mute: "Mute",

    // ── Header misc ───────────────────────────────────────────────────
    claimSuccess: "+500 tokens! 🪙",
    claimAlready: "Already claimed today!",
    openShop: "Open the Wacké token shop",
    claimTooltip: "Claim your daily 500 token bonus",
    themeLabel: "Theme",
    nightMode: "Night Owl Mode",
  }
} as const;

export type TranslationKey = keyof typeof translations.fr;
