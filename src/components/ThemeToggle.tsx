import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    root.classList.toggle("dark");
    setDark(root.classList.contains("dark"));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      className={[
        "relative inline-flex h-8 w-16 items-center rounded-full p-1 transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-ring/60",
        "hover:shadow-[0_0_18px_rgba(255,255,255,0.25)] dark:hover:shadow-[0_0_22px_rgba(93,63,211,0.45)]",
        dark
          ? "bg-gradient-to-r from-indigo-600 to-purple-700"
          : "bg-gradient-to-r from-yellow-300 to-amber-500",
        className,
      ].join(" ")}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={false}
        animate={{ boxShadow: dark ? "0 0 24px rgba(93,63,211,0.5)" : "0 0 24px rgba(255,193,7,0.5)" }}
        transition={{ duration: 0.35 }}
        aria-hidden
      />
      <motion.div
        className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 dark:bg-black/90"
        initial={false}
        animate={{ x: dark ? 32 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.35 }}
      >
        {dark ? <Moon className="h-4 w-4 text-indigo-300" /> : <Sun className="h-4 w-4 text-amber-600" />}
      </motion.div>
    </button>
  );
}
