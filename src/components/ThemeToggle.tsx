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
        "relative inline-flex h-8 w-14 sm:w-16 items-center rounded-full p-1 transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-ring/60",
        dark
          ? "bg-gradient-to-r from-[#6d28d9] to-[#3b82f6] hover:shadow-[0_0_18px_rgba(59,130,246,0.45)]"
          : "bg-gradient-to-r from-[#facc15] to-[#fde68a] hover:shadow-[0_0_18px_rgba(234,179,8,0.45)]",
        className,
      ].join(" ")}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={false}
        animate={{ boxShadow: dark ? "0 0 22px rgba(59,130,246,0.40)" : "0 0 22px rgba(234,179,8,0.40)" }}
        transition={{ duration: 0.3 }}
        aria-hidden
      />
      <motion.div
        className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 dark:bg-black/90"
        initial={false}
        animate={{ x: dark ? 28 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.3 }}
      >
        {dark ? <Moon className="h-4 w-4 text-indigo-300" /> : <Sun className="h-4 w-4 text-amber-600" />}
      </motion.div>
    </button>
  );
}