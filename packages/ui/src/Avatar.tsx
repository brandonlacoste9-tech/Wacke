import React from "react";

interface AvatarProps {
  src?: string | null;
  displayName: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-16 h-16 text-2xl",
};

export function Avatar({ src, displayName, size = "md" }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={displayName}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple
                  flex items-center justify-center font-bold text-white`}
    >
      {displayName[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
