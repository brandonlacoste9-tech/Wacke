import tmi from "tmi.js";

export interface BotPersona {
  username: string;
  oauth: string;
  type: "qc" | "en" | "alert" | "community";
  greetings: {
    fr: string[];
    en: string[];
  };
}

export class WackeBotManager {
  private static instance: WackeBotManager | null = null;
  private clients: Map<string, tmi.Client> = new Map();
  private botChannels: Map<string, Set<string>> = new Map(); // botUsername -> channels
  private channelLanguages: Map<string, string> = new Map();
  private isRunning: boolean = false;
  private monitorInterval: NodeJS.Timeout | null = null;

  // Define our default fleet of bots
  private bots: BotPersona[] = [];

  private constructor() {
    this.initializeBotFleet();
  }

  public static getInstance(): WackeBotManager {
    if (!WackeBotManager.instance) {
      WackeBotManager.instance = new WackeBotManager();
    }
    return WackeBotManager.instance;
  }

  private initializeBotFleet() {
    // 1. Bot 1: Quebec Specialist
    const qcUsername = process.env.TWITCH_BOT_QC_USERNAME || "WackeHypeQC";
    const qcOauth = process.env.TWITCH_BOT_QC_OAUTH || "";
    
    // 2. Bot 2: English / Global Specialist
    const enUsername = process.env.TWITCH_BOT_EN_USERNAME || "WackeGlobalEN";
    const enOauth = process.env.TWITCH_BOT_EN_OAUTH || "";

    // 3. Bot 3: Alert / Feature Hype Specialist
    const alertUsername = process.env.TWITCH_BOT_ALERT_USERNAME || "WackeAlertBot";
    const alertOauth = process.env.TWITCH_BOT_ALERT_OAUTH || "";

    // 4. Bot 4: Community / Discord Specialist
    const communityUsername = process.env.TWITCH_BOT_COMM_USERNAME || "WackePartyBot";
    const communityOauth = process.env.TWITCH_BOT_COMM_OAUTH || "";

    this.bots = [
      {
        username: qcUsername,
        oauth: qcOauth,
        type: "qc",
        greetings: {
          fr: [
            "Allô @{streamer}! Ton live est en vedette sur Wacké (wacke.live). Tes spectateurs peuvent t'envoyer des sacres, des TTS criés et des stickers custom! Bon stream, chauffe le chat! 🚀🔥",
            "Hey @{streamer}! T'es live sur Wacké.live en ce moment. Viens réclamer ton profil, tes viewers t'attendent avec la soundboard et le spray chat! Tabarnak que ça va être chaud! 🎙️⚡",
            "Salut @{streamer}! Ton stream est mis en avant sur Wacké.live. Tes viewers peuvent utiliser notre Spray Chat en direct et nos jetons d'interaction! Bon live! 🎮"
          ],
          en: [
            "Hey @{streamer}! You are featured on Wacké (wacke.live) right now. Your viewers can trigger funny Quebec swears and interactive sound effects live! Have a wacké stream! 🪙🎸"
          ]
        }
      },
      {
        username: enUsername,
        oauth: enOauth,
        type: "en",
        greetings: {
          fr: [
            "Salut @{streamer}! Ton stream est mis en avant sur Wacké.live. Tes viewers peuvent utiliser notre Spray Chat en direct et nos jetons d'interaction! Bon live! 🎮"
          ],
          en: [
            "Hey @{streamer}! Your stream is currently featured on Wacké (wacke.live). Your community can trigger interactive TTS voices and cool AI stickers in real time! Have a great stream! 🚀🪙",
            "What's up @{streamer}! You are live on Wacké (wacke.live) right now. Come claim your creator profile and interact with your viewers via TTS and soundboard! 🎙️✨"
          ]
        }
      },
      {
        username: alertUsername,
        oauth: alertOauth,
        type: "alert",
        greetings: {
          fr: [
            "Alerte @{streamer}! Ton direct est sur Wacké (wacke.live) en ce moment! Savais-tu que tes viewers peuvent faire parler l'IA en TTS et générer des graffitis en direct sur ton profil? Viens voir! 🎨🔊",
            "Flash Info @{streamer}! T'es en vedette sur Wacké.live! Débloque le son et l'IA pour ton live en te connectant sur Wacké. Bon stream! ⚡🪙"
          ],
          en: [
            "Alert @{streamer}! Your broadcast is featured on Wacké (wacke.live). Unlock interactive soundboard chimes and real-time AI sticker generation for your stream now! 🔔🔥"
          ]
        }
      },
      {
        username: communityUsername,
        oauth: communityOauth,
        type: "community",
        greetings: {
          fr: [
            "Allô @{streamer}! Ton live est sur Wacké (wacke.live). Rejoins la plus grande communauté de créateurs québécois et fais grimper tes viewers! Bon stream! 🥳🍺",
            "Hey @{streamer}! Tu es en vedette sur Wacké.live. Rejoins le serveur Discord Wacké pour connecter avec d'autres streamers et viewers passionnés! 🎉🚀"
          ],
          en: [
            "Hello @{streamer}! You are featured on Wacké (wacke.live). Join our creator community, collaborate with other streamers, and level up your stream! 👾🎉"
          ]
        }
      }
    ];

    // Initialize map entries
    for (const bot of this.bots) {
      this.botChannels.set(bot.username, new Set());
    }
  }

  /**
   * Starts the bot connection and begins polling live Twitch channels to join.
   */
  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`[WackeBot] Starting bot fleet service with ${this.bots.length} personas.`);

    for (const bot of this.bots) {
      const isMock = !bot.oauth || bot.oauth === "";
      console.log(`[WackeBot] Persona: @${bot.username}. Mode: ${isMock ? "SANDBOX SIMULATED (Logs only)" : "PRODUCTION"}`);

      if (isMock) {
        continue;
      }

      try {
        const client = new tmi.Client({
          options: { debug: false },
          identity: {
            username: bot.username,
            password: bot.oauth, // Must be formatted as "oauth:xxxx"
          },
          connection: {
            reconnect: true,
            secure: true,
          },
        });

        client.on("message", (channel, userstate, message, self) => {
          if (self) return; // Don't reply to self
          this.handleMessage(bot.username, client, channel, userstate, message);
        });

        client.on("connected", () => {
          console.log(`[WackeBot] Connected to Twitch IRC as @${bot.username}`);
        });

        await client.connect();
        this.clients.set(bot.username, client);
      } catch (err) {
        console.error(`[WackeBot] Connection error for @${bot.username}:`, err);
      }
    }

    this.startMonitoring();
  }

  /**
   * Stops all bots in the fleet.
   */
  public async stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    for (const [username, client] of this.clients.entries()) {
      try {
        await client.disconnect();
        console.log(`[WackeBot] Disconnected @${username}`);
      } catch (err) {
        console.error(`[WackeBot] Disconnect error for @${username}:`, err);
      }
    }

    this.clients.clear();
    for (const username of this.botChannels.keys()) {
      this.botChannels.get(username)?.clear();
    }
    this.channelLanguages.clear();
    console.log("[WackeBot] All bots in the fleet stopped.");
  }

  public getStatus() {
    const statuses = this.bots.map((bot) => {
      const joined = Array.from(this.botChannels.get(bot.username) || []);
      const isMock = !bot.oauth || bot.oauth === "";
      return {
        username: bot.username,
        type: bot.type,
        mode: isMock ? "SIMULATED_SANDBOX" : "PRODUCTION",
        channelsJoined: joined.length,
        channels: joined,
      };
    });

    return {
      running: this.isRunning,
      bots: statuses,
    };
  }

  private startMonitoring() {
    // Poll active streams immediately, then every 3 minutes
    this.pollLiveChannels();
    this.monitorInterval = setInterval(() => this.pollLiveChannels(), 180_000);
  }

  private async pollLiveChannels() {
    if (!this.isRunning) return;

    let activeStreams: string[] = [];

    try {
      // Fetch currently active Twitch streams we track on Wacké
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const res = await fetch(`${appUrl}/api/twitch/livestreams?limit=20`);
      if (!res.ok) throw new Error("Failed to fetch active streams");
      
      const data = await res.json();
      const activeStreamsMap = new Map<string, string>();
      for (const s of data.streams || []) {
        const userLogin = s.user_login.toLowerCase();
        const lang = s.language || "fr";
        activeStreamsMap.set(userLogin, lang);
        this.channelLanguages.set(userLogin, lang);
      }
      activeStreams = Array.from(activeStreamsMap.keys());
    } catch (err: any) {
      console.warn(`[WackeBot] API fetch offline (${err.message}). Using mock streams fallback for simulation.`);
      const mockStreams = [
        { user_login: "xqc", language: "en" },
        { user_login: "adinross", language: "en" },
        { user_login: "amouranth", language: "en" },
        { user_login: "qc_streamer1", language: "fr" },
        { user_login: "qc_streamer2", language: "fr" },
        { user_login: "qc_streamer3", language: "fr" },
      ];
      for (const s of mockStreams) {
        this.channelLanguages.set(s.user_login, s.language);
      }
      activeStreams = mockStreams.map(s => s.user_login);
    }

    // Get list of currently joined channels across all bots
    const currentlyJoined = new Set<string>();
    for (const channels of this.botChannels.values()) {
      for (const c of channels) {
        currentlyJoined.add(c);
      }
    }

    // 1. Join new live channels
    for (const channel of activeStreams) {
      if (!currentlyJoined.has(channel)) {
        await this.assignAndJoinChannel(channel);
      }
    }

    // 2. Part from offline channels
    for (const bot of this.bots) {
      const joinedSet = this.botChannels.get(bot.username);
      if (!joinedSet) continue;

      for (const channel of Array.from(joinedSet)) {
        if (!activeStreams.includes(channel)) {
          await this.leaveChannel(bot.username, channel);
        }
      }
    }
  }

  /**
   * Assigns a channel to one of the bots in the fleet depending on category/language,
   * then triggers the join connection.
   */
  private async assignAndJoinChannel(channel: string) {
    const lang = this.channelLanguages.get(channel) || "fr";
    const isEn = lang.toLowerCase() === "en" || lang.toLowerCase() === "english";

    // Select candidate bots from fleet
    let candidates = this.bots;
    if (isEn) {
      // English channel -> prefer English, Alert, or Community bots
      candidates = this.bots.filter(b => b.type === "en" || b.type === "alert" || b.type === "community");
    } else {
      // French channel -> prefer Quebec, Alert, or Community bots
      candidates = this.bots.filter(b => b.type === "qc" || b.type === "alert" || b.type === "community");
    }

    if (candidates.length === 0) candidates = this.bots;

    // Find candidate with the fewest joined channels to distribute load evenly
    let selectedBot = candidates[0];
    let minJoined = Infinity;

    for (const bot of candidates) {
      const count = this.botChannels.get(bot.username)?.size || 0;
      if (count < minJoined) {
        minJoined = count;
        selectedBot = bot;
      }
    }

    const botUsername = selectedBot.username;
    this.botChannels.get(botUsername)?.add(channel);

    console.log(`[WackeBot] Assigning channel #${channel} to @${botUsername} (${lang})`);

    const client = this.clients.get(botUsername);
    if (client) {
      try {
        await client.join(channel);
        this.postAnnouncement(selectedBot, client, channel);
      } catch (err) {
        console.error(`[WackeBot] Bot @${botUsername} failed to join #${channel}:`, err);
        this.botChannels.get(botUsername)?.delete(channel);
      }
    } else {
      // Simulated sandbox mode
      this.postAnnouncement(selectedBot, null, channel);
    }
  }

  private async leaveChannel(botUsername: string, channel: string) {
    const joinedSet = this.botChannels.get(botUsername);
    if (!joinedSet || !joinedSet.has(channel)) return;

    joinedSet.delete(channel);
    console.log(`[WackeBot] Bot @${botUsername} leaving chat room: #${channel} (Offline)`);

    const client = this.clients.get(botUsername);
    if (client) {
      try {
        await client.part(channel);
      } catch (err) {
        console.error(`[WackeBot] Bot @${botUsername} failed to part #${channel}:`, err);
      }
    }
  }

  private postAnnouncement(bot: BotPersona, client: tmi.Client | null, channel: string) {
    const streamer = channel.charAt(0).toUpperCase() + channel.slice(1);
    const lang = this.channelLanguages.get(channel) || "fr";
    const isEn = lang.toLowerCase() === "en" || lang.toLowerCase() === "english";

    const greetingTemplates = isEn ? bot.greetings.en : bot.greetings.fr;
    const randomTemplate = greetingTemplates[Math.floor(Math.random() * greetingTemplates.length)];
    const msg = randomTemplate.replace("{streamer}", streamer);

    if (client) {
      client.say(channel, msg).catch((err) => {
        console.error(`[WackeBot] Bot @${bot.username} failed to send greeting to #${channel}:`, err);
      });
    } else {
      console.log(`[WackeBot Sandbox SIMULATION] Bot @${bot.username} send to #${channel} (${lang}): "${msg}"`);
    }
  }

  private handleMessage(
    botUsername: string,
    client: tmi.Client,
    channel: string,
    userstate: tmi.ChatUserstate,
    message: string
  ) {
    const formattedMsg = message.trim().toLowerCase();
    
    if (formattedMsg.startsWith("!wacke") || formattedMsg.startsWith("!tokens")) {
      const channelClean = channel.replace("#", "");
      const lang = this.channelLanguages.get(channelClean) || "fr";
      const isEn = lang.toLowerCase() === "en" || lang.toLowerCase() === "english";

      const reply = isEn
        ? `@${userstate.username}, Wacké is the streaming hub. Come tip tokens and trigger real-time TTS voices at https://wacke.live/stream/${channelClean} !`
        : `@${userstate.username}, Wacké est le hub québécois de streaming. Viens tip des jetons et déclencher le TTS en temps réel sur https://wacke.live/stream/${channelClean} !`;

      client.say(channel, reply).catch((err) => {
        console.error(`[WackeBot] Bot @${botUsername} failed to reply in #${channel}:`, err);
      });
    }
  }
}
