import tmi from "tmi.js";

export class WackeBotManager {
  private static instance: WackeBotManager | null = null;
  private client: tmi.Client | null = null;
  private joinedChannels: Set<string> = new Set();
  private isRunning: boolean = false;
  private monitorInterval: NodeJS.Timeout | null = null;

  private botUsername: string = process.env.TWITCH_BOT_USERNAME || "WackeHypeBot";
  private botOauth: string = process.env.TWITCH_BOT_OAUTH_TOKEN || ""; // e.g. oauth:xxxxxxxxxx

  private constructor() {}

  public static getInstance(): WackeBotManager {
    if (!WackeBotManager.instance) {
      WackeBotManager.instance = new WackeBotManager();
    }
    return WackeBotManager.instance;
  }

  /**
   * Starts the bot connection and begins polling live Twitch channels to join.
   */
  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    const isMock = !this.botOauth || this.botOauth === "";

    console.log(`[WackeBot] Starting bot service. Mode: ${isMock ? "SANDBOX SIMULATED (Logs only)" : "PRODUCTION"}`);

    if (isMock) {
      // In sandbox mode, we just start monitoring and log posts to console
      this.startMonitoring();
      return;
    }

    try {
      this.client = new tmi.Client({
        options: { debug: true },
        identity: {
          username: this.botUsername,
          password: this.botOauth, // Must be formatted as "oauth:xxxx"
        },
        connection: {
          reconnect: true,
          secure: true,
        },
      });

      this.client.on("message", (channel, userstate, message, self) => {
        if (self) return; // Don't reply to self
        this.handleMessage(channel, userstate, message);
      });

      this.client.on("connected", () => {
        console.log(`[WackeBot] Connected to Twitch IRC as ${this.botUsername}`);
      });

      await this.client.connect();
      this.startMonitoring();
    } catch (err) {
      console.error("[WackeBot] Connection error:", err);
      this.isRunning = false;
    }
  }

  /**
   * Stops the bot connection.
   */
  public async stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    if (this.client) {
      try {
        await this.client.disconnect();
      } catch (err) {
        console.error("[WackeBot] Disconnect error:", err);
      }
      this.client = null;
    }

    this.joinedChannels.clear();
    console.log("[WackeBot] Bot service stopped.");
  }

  public getStatus() {
    return {
      running: this.isRunning,
      channels: Array.from(this.joinedChannels),
      mode: (!this.botOauth || this.botOauth === "") ? "SIMULATED_SANDBOX" : "PRODUCTION",
      botUsername: this.botUsername,
    };
  }

  private startMonitoring() {
    // Poll active streams immediately, then every 3 minutes
    this.pollLiveChannels();
    this.monitorInterval = setInterval(() => this.pollLiveChannels(), 180_000);
  }

  private async pollLiveChannels() {
    if (!this.isRunning) return;

    try {
      // Fetch currently active Twitch streams we track on Wacké
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const res = await fetch(`${appUrl}/api/twitch/livestreams?limit=20`);
      if (!res.ok) throw new Error("Failed to fetch active streams");
      
      const data = await res.json();
      const activeStreams: string[] = (data.streams || []).map((s: any) => s.user_login.toLowerCase());

      // 1. Join new live channels
      for (const channel of activeStreams) {
        if (!this.joinedChannels.has(channel)) {
          await this.joinChannel(channel);
        }
      }

      // 2. Part from offline channels
      for (const channel of Array.from(this.joinedChannels)) {
        if (!activeStreams.includes(channel)) {
          await this.leaveChannel(channel);
        }
      }
    } catch (err: any) {
      console.error("[WackeBot] Error polling streams:", err.message);
    }
  }

  private async joinChannel(channel: string) {
    if (this.joinedChannels.has(channel)) return;
    this.joinedChannels.add(channel);

    console.log(`[WackeBot] Joining chat room: #${channel}`);

    if (this.client) {
      try {
        await this.client.join(channel);
        this.postAnnouncement(channel);
      } catch (err) {
        console.error(`[WackeBot] Failed to join #${channel}:`, err);
        this.joinedChannels.delete(channel);
      }
    } else {
      // Simulated sandbox mode log
      this.postAnnouncement(channel);
    }
  }

  private async leaveChannel(channel: string) {
    if (!this.joinedChannels.has(channel)) return;
    this.joinedChannels.delete(channel);

    console.log(`[WackeBot] Leaving chat room: #${channel} (Offline)`);

    if (this.client) {
      try {
        await this.client.part(channel);
      } catch (err) {
        console.error(`[WackeBot] Failed to part #${channel}:`, err);
      }
    }
  }

  private postAnnouncement(channel: string) {
    const streamer = channel.charAt(0).toUpperCase() + channel.slice(1);
    const msg = `Allô @${streamer}! Ton live est actuellement mis en avant sur Wacké (wacke.live). Tes spectateurs peuvent y utiliser notre soundboard interactive et TTS québécois en temps réel! Bon live! 🪙🔥`;

    if (this.client) {
      this.client.say(channel, msg).catch((err) => {
        console.error(`[WackeBot] Failed to send greeting to #${channel}:`, err);
      });
    } else {
      console.log(`[WackeBot Sandbox SIMULATION] Send to #${channel}: "${msg}"`);
    }
  }

  private handleMessage(channel: string, userstate: tmi.ChatUserstate, message: string) {
    const formattedMsg = message.trim().toLowerCase();
    
    if (formattedMsg.startsWith("!wacke") || formattedMsg.startsWith("!tokens")) {
      const channelClean = channel.replace("#", "");
      const streamer = channelClean.charAt(0).toUpperCase() + channelClean.slice(1);
      const reply = `@${userstate.username}, Wacké est le hub québécois de streaming. Viens tip des jetons et déclencher le TTS en temps réel sur https://wacke.live/stream/${channelClean} !`;

      if (this.client) {
        this.client.say(channel, reply).catch((err) => {
          console.error(`[WackeBot] Failed to reply in #${channel}:`, err);
        });
      } else {
        console.log(`[WackeBot Sandbox SIMULATION] Reply to #${channel}: "${reply}"`);
      }
    }
  }
}
