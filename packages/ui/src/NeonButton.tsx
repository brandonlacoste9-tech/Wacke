import React from "react";

type NeonVariant = "pink" | "cyan" | "purple";

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: NeonVariant;
  children: React.ReactNode;
}

const variantClasses: Record<NeonVariant, string> = {
  pink: "from-pink-600 to-pink-800 hover:shadow-[0_0_20px_rgba(255,20,147,0.6)]",
  cyan: "from-cyan-600 to-cyan-800 hover:shadow-[0_0_20px_rgba(0,255,255,0.6)]",
  purple: "from-purple-600 to-purple-800 hover:shadow-[0_0_20px_rgba(139,0,255,0.6)]",
};

export function NeonButton({
  variant = "pink",
  children,
  className = "",
  ...props
}: NeonButtonProps) {
  return (
    <button
      className={`
        bg-gradient-to-r ${variantClasses[variant]}
        px-6 py-3 rounded-xl font-bold text-white
        transition-all duration-200 hover:scale-105
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
