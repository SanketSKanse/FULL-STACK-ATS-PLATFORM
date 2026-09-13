import React from 'react';
import { Sparkles, Moon } from 'lucide-react';
import useTheme from '../hooks/useTheme';

export default function ThemeToggle({ className = '' }) {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label="Toggle Color Theme"
      className={`relative inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-all duration-200 border shadow-md active:scale-95 ${
        isDark
          ? 'bg-[#1C4D8D]/30 hover:bg-[#4988C4]/20 border-[#4988C4]/40 text-white backdrop-blur-md ring-1 ring-[#4988C4]/20'
          : 'bg-white hover:bg-[#BDE8F5]/50 border-[#1C4D8D]/30 text-[#0F2854] backdrop-blur-md shadow-sm'
      } ${className}`}
    >
      {isDark ? (
        <>
          <Sparkles size={15} className="text-[#4988C4] animate-pulse shrink-0" />
          <span className="hidden md:inline font-medium tracking-wide">Dark Theme</span>
        </>
      ) : (
        <>
          <Moon size={15} className="text-[#1C4D8D] shrink-0" />
          <span className="hidden md:inline font-medium tracking-wide">Light Theme</span>
        </>
      )}
    </button>
  );
}
