import React from "react";

interface LiveBadgeProps {
  viewerCount?: number;
}

export function LiveBadge({ viewerCount }: LiveBadgeProps) {
  return (
    <div className="flex items-center space-x-2">
      <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center space-x-1">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        <span>LIVE</span>
      </span>
      {viewerCount !== undefined && (
        <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
          👁 {viewerCount.toLocaleString("fr-CA")}
        </span>
      )}
    </div>
  );
}
