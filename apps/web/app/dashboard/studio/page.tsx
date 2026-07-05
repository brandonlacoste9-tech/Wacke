"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, Play, Square } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function BroadcastStudio() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  // Request camera permissions on mount
  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: true,
        });
        
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access denied", err);
        setError("Erreur: Impossible d'accéder à la caméra ou au microphone. Vérifiez vos permissions.");
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
        throw new Error(data.error || "Erreur de connexion au serveur");
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
        throw new Error("Erreur de négociation WHIP avec Cloudflare");
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
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Studio Wacké</h1>
          <p className="text-gray-400 mt-1">Diffuse en direct sans aucun logiciel (via Cloudflare WHIP).</p>
        </div>
        
        {isBroadcasting && (
          <div className="flex items-center space-x-2 bg-red-500/20 text-red-500 px-4 py-2 rounded-xl font-bold border border-red-500/50">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span>EN DIRECT</span>
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
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-white/10 shadow-2xl group">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted // Always mute local preview to avoid feedback loop
              className="w-full h-full object-cover mirror-mode"
              style={{ transform: "scaleX(-1)" }}
            />
            
            {/* Camera Controls Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
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
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4">Contrôles du Stream</h2>
          
          <div className="space-y-4 flex-1">
            <div className="bg-black/30 p-4 rounded-xl">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Titre du stream</label>
              <input 
                type="text" 
                defaultValue="Live depuis le Studio Wacké"
                className="w-full bg-transparent border-none p-0 text-white focus:ring-0 font-medium"
              />
            </div>
            
            <div className="bg-black/30 p-4 rounded-xl">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Catégorie</label>
              <select className="w-full bg-transparent border-none p-0 text-white focus:ring-0 font-medium">
                <option value="irl">IRL</option>
                <option value="talk">Jasette</option>
              </select>
            </div>
          </div>

          <div className="mt-8">
            {!isBroadcasting ? (
              <button 
                onClick={startBroadcast}
                className="w-full py-4 bg-gradient-to-r from-wacke-pink to-wacke-purple text-white rounded-xl font-black text-xl hover:opacity-90 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-wacke-pink/20"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>GO LIVE</span>
              </button>
            ) : (
              <button 
                onClick={stopBroadcast}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-xl hover:bg-red-700 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
              >
                <Square className="w-6 h-6 fill-current" />
                <span>ARRÊTER LE STREAM</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
