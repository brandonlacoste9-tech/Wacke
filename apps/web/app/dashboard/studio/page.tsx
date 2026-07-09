"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, Play, Square, SwitchCamera, CameraOff } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import GraffitiChat from "@/components/GraffitiChat";

export default function StudioPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastTime, setBroadcastTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isSwitching, setIsSwitching] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  // Broadcast timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBroadcasting) {
      interval = setInterval(() => {
        setBroadcastTime(prev => prev + 1);
      }, 1000);
    } else {
      setBroadcastTime(0);
    }
    return () => clearInterval(interval);
  }, [isBroadcasting]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Request camera permissions on mount
  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: "user" },
          audio: true,
        });
        
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access denied", err);
        setError(t("dashCameraError"));
      }
    }

    setupCamera();

    return () => {
      // Cleanup tracks on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  const switchCamera = async () => {
    if (isSwitching) return;
    setIsSwitching(true);
    const newMode = facingMode === "user" ? "environment" : "user";
    try {
      // Stop old tracks FIRST to release the hardware lock on mobile devices
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Wait a tiny bit for iOS to fully release the camera
      await new Promise(resolve => setTimeout(resolve, 300));

      let newStream;
      try {
        // Try strict facingMode for mobile
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 }, 
            frameRate: { ideal: 30 },
            facingMode: { exact: newMode }
          },
          audio: true,
        });
      } catch (err) {
        // Fallback for desktop/generic webcams
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 }, 
            frameRate: { ideal: 30 },
            facingMode: newMode 
          },
          audio: true,
        });
      }

      // Maintain current mute states
      newStream.getVideoTracks().forEach(track => track.enabled = videoEnabled);
      newStream.getAudioTracks().forEach(track => track.enabled = audioEnabled);

      setStream(newStream);
      setFacingMode(newMode);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      // Replace tracks in active WebRTC peer connection
      if (peerConnection && isBroadcasting) {
        const senders = peerConnection.getSenders();
        
        const videoSender = senders.find(s => s.track?.kind === "video");
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (videoSender && newVideoTrack) {
          await videoSender.replaceTrack(newVideoTrack);
        }

        const audioSender = senders.find(s => s.track?.kind === "audio");
        const newAudioTrack = newStream.getAudioTracks()[0];
        if (audioSender && newAudioTrack) {
          await audioSender.replaceTrack(newAudioTrack);
        }
      }
    } catch (err) {
      console.error("Camera switch failed", err);
    } finally {
      setIsSwitching(false);
    }
  };

  const startBroadcast = async () => {
    if (!stream) return;
    setError(null);
    setIsBroadcasting(true);
    
    try {
      // 1. Get WHIP URL from our API
      const res = await fetch("/api/stream/cloudflare", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token || ""}`,
        }
      });
      
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || t("dashServerError"));
      }

      const whipUrl = data.whipUrl;

      // 2. Setup WebRTC Peer Connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.cloudflare.com:3478" }]
      });

      // Add local media tracks to the connection
      stream.getTracks().forEach(track => {
        pc.addTransceiver(track, { direction: "sendonly" });
      });

      // 3. Create SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 4. Send SDP Offer to Cloudflare WHIP endpoint
      const whipRes = await fetch(whipUrl, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp
      });

      if (!whipRes.ok) {
        throw new Error(t("dashWhipError"));
      }

      // 5. Accept SDP Answer from Cloudflare
      const answerSdp = await whipRes.text();
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: answerSdp })
      );

      setPeerConnection(pc);
      
      // Mark as live in DB
      await fetch("/api/stream/cloudflare/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ status: "live" })
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setIsBroadcasting(false);
    }
  };

  const stopBroadcast = async () => {
    setIsBroadcasting(false);
    
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    
    // Mark as offline in DB
    try {
      await fetch("/api/stream/cloudflare/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ status: "offline" })
      });
    } catch(e) {
      // ignore
    }
  };

  if (isLoading || !user) {
    return <div className="p-8 text-center animate-pulse">Chargement...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight font-display">
            <span className="gradient-text-cyber">{t("dashStudioTitle")}</span>
          </h1>
          <p className="text-gray-400 mt-1.5">{t("dashStudioSubtitle")}</p>
        </div>
        
        {isBroadcasting && (
          <div className="flex items-center space-x-3 bg-red-500/20 text-red-500 px-4 py-2 rounded-xl font-bold border border-red-500/50">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span>{t("dashLiveStatus")}</span>
            </div>
            <span className="text-white font-mono bg-black/50 px-2 py-0.5 rounded text-sm border border-white/10 shadow-inner">
              {formatTime(broadcastTime)}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Camera Preview */}
        <div className="lg:col-span-2">
          <div className="relative glass-card rounded-2xl overflow-hidden aspect-video border border-white/[0.07] shadow-2xl shadow-black/40 group bg-black/60">
            {!stream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <CameraOff className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-semibold text-lg">{t("dashCameraOff")}</p>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted // Always mute local preview to avoid feedback loop
              className={`w-full h-full object-cover mirror-mode transition-opacity duration-300 ${stream ? 'opacity-100' : 'opacity-0'}`}
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />
            
            {/* Camera Controls Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={switchCamera}
                disabled={isSwitching}
                className="p-3 rounded-xl transition-colors bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
                title={t("dashSwitchCamera")}
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleVideo}
                className={`p-3 rounded-xl transition-colors ${videoEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
              >
                {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button 
                onClick={toggleAudio}
                className={`p-3 rounded-xl transition-colors ${audioEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
              >
                {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="glass-card rounded-2xl p-6 flex flex-col border border-white/[0.07] shadow-2xl shadow-black/30">
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider font-display">{t("dashStreamControls")}</h2>
          
          <div className="space-y-5 flex-1">
            <div className="bg-black/40 p-4 rounded-xl border border-white/[0.06]">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">{t("dashStreamTitleLabel")}</label>
              <input
                type="text"
                defaultValue={t("dashDefaultTitle")}
                className="w-full bg-transparent border-none p-0 text-white focus:ring-0 font-medium text-lg placeholder-gray-600"
              />
            </div>

            <div className="bg-black/40 p-4 rounded-xl border border-white/[0.06]">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">{t("dashCategoryLabel")}</label>
              <select className="w-full bg-transparent border-none p-0 text-white focus:ring-0 font-medium text-lg">
                <option value="irl">{t("catIrl")}</option>
                <option value="talk">{t("catTalk")}</option>
                <option value="gaming">{t("catGaming")}</option>
              </select>
            </div>
          </div>

          <div className="mt-8">
            {!isBroadcasting ? (
              <button 
                onClick={startBroadcast}
                className="w-full py-4 bg-gradient-to-r from-wacke-pink to-wacke-purple text-white rounded-xl font-black text-xl hover:opacity-90 hover:scale-[1.02] transition-all flex items-center justify-center space-x-3 shadow-lg shadow-wacke-pink/20 uppercase tracking-wider"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>{t("dashGoLive")}</span>
              </button>
            ) : (
              <button 
                onClick={stopBroadcast}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-xl hover:bg-red-700 hover:scale-[1.02] transition-all flex items-center justify-center space-x-3 uppercase tracking-wider"
              >
                <Square className="w-6 h-6 fill-current" />
                <span>{t("dashStopLive")}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Chat Panel (only visible when broadcasting) */}
      {isBroadcasting && (
        <div className="mt-6 h-[500px] lg:h-[600px] w-full rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl bg-black/50">
          <GraffitiChat streamId={user.id} />
        </div>
      )}
    </div>
  );
}
