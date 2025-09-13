import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  Shield, 
  MessageSquare, 
  Mic, 
  Video, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Zap,
  Lock,
  Github,
  Twitter,
  Mail,
  Upload,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useEffect } from "react";

export default function Landing() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [menuOpen]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const features = [
    {
      icon: MessageSquare,
      title: "Text Scam Detector",
      description: "Advanced AI analysis of SMS messages and text content to identify phishing attempts, smishing attacks, and fraudulent communications.",
      color: "text-blue-400"
    },
    {
      icon: Mic,
      title: "Voice Scam Detector", 
      description: "Real-time voice analysis and transcription to detect spoofed calls, robocalls, and suspicious voice patterns.",
      color: "text-green-400"
    },
    {
      icon: Video,
      title: "Deepfake Detector",
      description: "Cutting-edge computer vision technology to identify manipulated videos and deepfake content with high accuracy.",
      color: "text-purple-400"
    }
  ];

  const stats = [
    { number: "99.7%", label: "Detection Accuracy" },
    { number: "< 2s", label: "Analysis Time" },
    { number: "50M+", label: "Scams Blocked" },
    { number: "24/7", label: "Protection" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shield className="h-8 w-8" />
            <span className="text-xl font-bold">FraudShield AI</span>
          </motion.div>
          
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="min-h-11 text-slate-700 dark:text-foreground hover:underline">Features</Button>
            <Button variant="ghost" className="min-h-11 text-slate-700 dark:text-foreground hover:underline">About</Button>
            <ThemeToggle />
            <Button onClick={handleGetStarted} disabled={isLoading} className="min-h-11">
              {isAuthenticated ? "Dashboard" : "Get Started"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Mobile actions */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu overlay (full-screen) */}
        {menuOpen && (
          <div id="mobile-menu" className="md:hidden fixed inset-0 z-[60]">
            {/* Backdrop */}
            <button
              aria-label="Close menu overlay"
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            {/* Sliding panel */}
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative bg-white dark:bg-card/95 backdrop-blur-md border-b border-border pt-4 shadow-sm"
            >
              <div className="px-4 pb-6 flex flex-col gap-4">
                <Button
                  variant="ghost"
                  className="justify-start min-h-11 w-full text-lg py-4 hover:underline text-slate-700 dark:text-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  Features
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start min-h-11 w-full text-lg py-4 hover:underline text-slate-700 dark:text-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  About
                </Button>
                <Button
                  onClick={() => {
                    setMenuOpen(false);
                    handleGetStarted();
                  }}
                  className="min-h-11 w-full text-lg py-4"
                >
                  {isAuthenticated ? "Dashboard" : "Get Started"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-slate-100 to-red-100 dark:from-blue-900/20 dark:via-slate-950 dark:to-red-900/20" />
        <div className="container mx-auto px-4 py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8"
            >
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">AI-Powered Fraud Detection</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-800 to-slate-500 dark:from-white dark:via-blue-100 dark:to-slate-300 bg-clip-text text-transparent">
              Stop Scams Before They Stop You
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              AI-powered detection of fraudulent SMS, calls, and deepfake videos.
              <br />
              <span className="text-blue-700 dark:text-blue-400">Protect yourself with cutting-edge technology.</span>
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button 
                size="lg"
                onClick={handleGetStarted}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold"
              >
                <Shield className="mr-2 h-5 w-5" />
                Try Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-blue-700 dark:text-blue-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Advanced Fraud Detection
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Our AI-powered platform analyzes multiple types of content to protect you from sophisticated scams and fraud attempts.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -5 }}
              >
                <Card className="bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900/50 dark:border-slate-700 dark:hover:border-slate-600 transition-all duration-300 h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-slate-900 dark:text-white text-xl">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Simple, fast, and accurate fraud detection in three easy steps.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Content",
                description: "Upload suspicious text, audio, or video content through our secure interface.",
                icon: Upload
              },
              {
                step: "02", 
                title: "AI Analysis",
                description: "Our advanced AI models analyze the content for fraud patterns and suspicious elements.",
                icon: Zap
              },
              {
                step: "03",
                title: "Get Results",
                description: "Receive detailed risk assessment and recommended actions to protect yourself.",
                icon: CheckCircle
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-blue-700 dark:text-blue-400 font-bold text-sm mb-2">STEP {step.step}</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-blue-100 to-red-100 dark:from-blue-900/50 dark:to-red-900/50 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700"
          >
            <AlertTriangle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">
              Don't Fall Victim to Scams
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust FraudShield AI to protect them from sophisticated fraud attempts.
            </p>
            <Button 
              size="lg"
              onClick={handleGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold"
            >
              <Lock className="mr-2 h-5 w-5" />
              Start Protecting Yourself
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                <span className="text-xl font-bold text-slate-900 dark:text-white">FraudShield AI</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-md">
                Advanced AI-powered fraud detection to protect you from scams, phishing, and deepfake content.
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  <Github className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Support</h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-800 mt-8 pt-8 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              © 2024 FraudShield AI. All rights reserved. 
              <span className="block mt-1 text-xs">
                Prototype for hackathon use only. Not for production use.
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}