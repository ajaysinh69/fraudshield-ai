import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  Upload, 
  FileText, 
  Mic, 
  Video, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  X,
  Flag,
  Check,
  ArrowLeft,
  Loader2,
  Sun,
  Moon
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

interface DetectionResult {
  riskScore: number;
  explanation: string;
  suspiciousElements: string[];
  action: 'block' | 'report' | 'ignore' | null;
  transcript?: string; // audio
  deepfakeLikelihood?: number; // video 0-100
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("text");
  const [textInput, setTextInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<{
    text?: DetectionResult;
    audio?: DetectionResult;
    video?: DetectionResult;
  }>({});

  // Dynamic demo stats
  const [stats, setStats] = useState({ analyzed: 0, blocked: 0, users: 0 });
  useEffect(() => {
    const targets = { analyzed: 328, blocked: 256, users: 89 };
    const step = 20;
    const interval = setInterval(() => {
      setStats((prev) => {
        const next = { ...prev };
        next.analyzed = Math.min(targets.analyzed, prev.analyzed + Math.ceil((targets.analyzed - prev.analyzed) / 8));
        next.blocked = Math.min(targets.blocked, prev.blocked + Math.ceil((targets.blocked - prev.blocked) / 8));
        next.users = Math.min(targets.users, prev.users + Math.ceil((targets.users - prev.users) / 8));
        if (next.analyzed === targets.analyzed && next.blocked === targets.blocked && next.users === targets.users) {
          clearInterval(interval);
        }
        return next;
      });
    }, step);
    return () => clearInterval(interval);
  }, []);

  // Dark mode toggle
  const [dark, setDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains("dark");
  });
  const toggleDark = () => {
    const root = document.documentElement;
    root.classList.toggle("dark");
    setDark(root.classList.contains("dark"));
  };

  // Helper: highlight keywords in text (red underline)
  const highlightKeywords = (text: string, keywords: string[]) => {
    if (!text) return null;
    // Sort by length to avoid partial overlaps
    const sorted = [...keywords].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`(${sorted.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    const parts = text.split(pattern);
    return parts.map((part, idx) => {
      const match = sorted.some(k => k.toLowerCase() === part.toLowerCase());
      return match ? (
        <span key={idx} className="text-red-400 underline decoration-red-500 underline-offset-4">{part}</span>
      ) : (
        <span key={idx}>{part}</span>
      );
    });
  };

  // Helper: highlight words (yellow) in transcript
  const highlightTranscript = (text: string, keywords: string[]) => {
    if (!text) return null;
    const pattern = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    const parts = text.split(pattern);
    return parts.map((part, idx) => {
      const match = keywords.some(k => k.toLowerCase() === part.toLowerCase());
      return match ? (
        <span key={idx} className="bg-yellow-500/20 text-yellow-300 px-1 rounded">{part}</span>
      ) : (
        <span key={idx}>{part}</span>
      );
    });
  };

  const suspiciousKeywords = ['urgent', 'click now', 'verify account', 'suspended', 'winner', 'congratulations'];

  const mockAnalyzeText = async (text: string): Promise<DetectionResult> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const foundSuspicious = suspiciousKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    const riskScore = Math.min(foundSuspicious.length * 25 + Math.random() * 20, 95);
    return {
      riskScore: Math.round(riskScore),
      explanation: foundSuspicious.length > 0 
        ? `Detected ${foundSuspicious.length} suspicious pattern(s). Common phishing indicators found.`
        : "No obvious scam patterns detected. Message appears legitimate.",
      suspiciousElements: foundSuspicious,
      action: null
    };
  };

  const mockAnalyzeAudio = async (): Promise<DetectionResult> => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    return {
      riskScore: Math.round(Math.random() * 40 + 30),
      explanation: "Voice analysis complete. Detected potential voice spoofing patterns and suspicious transcript content.",
      suspiciousElements: ["Robotic voice patterns", "Background noise inconsistencies", "Urgent language"],
      action: null,
      transcript: "Hello, this is an urgent notice. Your account has been suspended. Please verify account details now to avoid penalties."
    };
  };

  const mockAnalyzeVideo = async (): Promise<DetectionResult> => {
    await new Promise(resolve => setTimeout(resolve, 4000));
    const likelihood = Math.round(Math.random() * 60 + 20);
    return {
      riskScore: Math.round(Math.random() * 30 + 15),
      explanation: "Deepfake analysis complete. Minor facial inconsistencies detected; assessing authenticity.",
      suspiciousElements: ["Frame 0:23 - Slight lip sync mismatch", "Lighting inconsistency at 1:15"],
      action: null,
      deepfakeLikelihood: likelihood
    };
  };

  const handleAnalyze = async (type: 'text' | 'audio' | 'video', data?: string) => {
    setIsAnalyzing(true);
    try {
      let result: DetectionResult;
      switch (type) {
        case 'text':
          if (!data?.trim()) {
            toast.error("Please enter some text to analyze");
            return;
          }
          result = await mockAnalyzeText(data);
          break;
        case 'audio':
          result = await mockAnalyzeAudio();
          break;
        case 'video':
          result = await mockAnalyzeVideo();
          break;
      }
      setResults(prev => ({ ...prev, [type]: result }));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} analysis complete`);
    } catch (error) {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // New: Use Sample Input button handler
  const handleUseSample = async (type: 'text' | 'audio' | 'video') => {
    if (type === 'text') {
      const sample = "Congratulations! You are a winner. Urgent: verify account now or your access will be suspended. Click now.";
      setTextInput(sample);
      await handleAnalyze('text', sample);
    } else if (type === 'audio') {
      await handleAnalyze('audio');
    } else {
      await handleAnalyze('video');
    }
  };

  // New: file validators
  const handleTextFile = async (file: File | null) => {
    if (!file) return;
    const ok = file.type.startsWith("text/") || /\.(txt|csv)$/i.test(file.name);
    if (!ok) {
      toast.error("Invalid file type. Please upload a .txt or .csv file.");
      return;
    }
    const content = await file.text();
    setTextInput(content.slice(0, 5000)); // cap size
    toast("Text file loaded.");
  };

  const handleAudioFile = (file: File | null) => {
    if (!file) return;
    const ok = /\.(mp3|wav|m4a)$/i.test(file.name);
    if (!ok) {
      toast.error("Invalid audio file. Supported: .mp3, .wav, .m4a");
      return;
    }
    toast("Audio file ready. Click Analyze Audio to proceed.");
  };

  const handleVideoFile = (file: File | null) => {
    if (!file) return;
    const ok = /\.(mp4|mov|avi)$/i.test(file.name);
    if (!ok) {
      toast.error("Invalid video file. Supported: .mp4, .mov, .avi");
      return;
    }
    toast("Video file ready. Click Analyze Video to proceed.");
  };

  const handleAction = (type: 'text' | 'audio' | 'video', action: 'block' | 'report' | 'ignore') => {
    setResults(prev => ({
      ...prev,
      [type]: prev[type] ? { ...prev[type]!, action } : undefined
    }));
    
    const actionMessages = {
      block: "Content blocked and added to blacklist",
      report: "Content reported to authorities",
      ignore: "Content marked as safe"
    };
    
    toast.success(actionMessages[action]);
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-500";
    if (score >= 40) return "text-yellow-500";
    return "text-green-500";
  };

  const getRiskBadgeColor = (score: number) => {
    if (score >= 70) return "bg-red-500/20 text-red-400 border-red-500/30";
    if (score >= 40) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-green-500/20 text-green-400 border-green-500/30";
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold text-white">FraudShield AI</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDark}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user && (
              <span className="hidden sm:block text-slate-400">
                Welcome, {user.name || user.email || "User"}
              </span>
            )}
            <Button variant="outline" onClick={signOut} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Strip */}
        <div className="mb-6">
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Scams Analyzed: <span className="text-white font-semibold">{stats.analyzed}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <span>Blocked: <span className="text-white font-semibold">{stats.blocked}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-400" />
              <span>Users Protected: <span className="text-white font-semibold">{stats.users}</span></span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Fraud Detection Dashboard</h1>
            <p className="text-slate-400">Upload content to analyze for potential scams and fraud</p>
          </div>

          {/* Main Detection Interface */}
          <Card className="bg-slate-900/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                Content Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {/* Make tab triggers in a single horizontal row with scroll on small screens */}
                <TabsList className="flex w-full items-center gap-2 overflow-x-auto whitespace-nowrap bg-slate-800 border-slate-700 p-1 rounded-md">
                  <TabsTrigger value="text" className="shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white px-4 py-2 rounded-md">
                    <FileText className="h-4 w-4 mr-2" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white px-4 py-2 rounded-md">
                    <Mic className="h-4 w-4 mr-2" />
                    Audio
                  </TabsTrigger>
                  <TabsTrigger value="video" className="shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white px-4 py-2 rounded-md">
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Paste suspicious text or upload file
                    </label>
                    <Textarea
                      placeholder="Paste the suspicious message here..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[120px]"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Input
                      type="file"
                      accept=".txt,.csv,text/plain"
                      onChange={(e) => handleTextFile(e.target.files?.[0] || null)}
                      className="bg-slate-800 border-slate-700 text-slate-300 file:bg-slate-700 file:text-slate-300 file:border-0"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAnalyze('text', textInput)}
                        disabled={isAnalyzing}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Analyze Text
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleUseSample('text')}
                        disabled={isAnalyzing}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800 w-full sm:w-auto"
                      >
                        Use Sample Input
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="audio" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Upload audio file for voice analysis
                    </label>
                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center bg-slate-800/50">
                      <Upload className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400 mb-2">Drop audio files here or click to browse</p>
                      <p className="text-sm text-slate-500">Supports .mp3, .wav, .m4a files</p>
                      <Input
                        type="file"
                        accept=".mp3,.wav,.m4a,audio/*"
                        onChange={(e) => handleAudioFile(e.target.files?.[0] || null)}
                        className="mt-4 bg-slate-800 border-slate-700 text-slate-300 file:bg-slate-700 file:text-slate-300 file:border-0"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAnalyze('audio')}
                      disabled={isAnalyzing}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Analyze Audio
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUseSample('audio')}
                      disabled={isAnalyzing}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 w-full sm:w-auto"
                    >
                      Use Sample Input
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="video" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Upload video file for deepfake detection
                    </label>
                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center bg-slate-800/50">
                      <Upload className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400 mb-2">Drop video files here or click to browse</p>
                      <p className="text-sm text-slate-500">Supports .mp4, .mov, .avi files</p>
                      <Input
                        type="file"
                        accept=".mp4,.mov,.avi,video/*"
                        onChange={(e) => handleVideoFile(e.target.files?.[0] || null)}
                        className="mt-4 bg-slate-800 border-slate-700 text-slate-300 file:bg-slate-700 file:text-slate-300 file:border-0"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAnalyze('video')}
                      disabled={isAnalyzing}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4 mr-2" />
                          Analyze Video
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUseSample('video')}
                      disabled={isAnalyzing}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 w-full sm:w-auto"
                    >
                      Use Sample Input
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Results Section with enhanced channel-specific UI */}
          {Object.entries(results).map(([type, result]) => (
            result && (
              <motion.div
                key={type}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-slate-900/50 border-slate-700 mb-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {type === 'text' && <FileText className="h-5 w-5" />}
                        {type === 'audio' && <Mic className="h-5 w-5" />}
                        {type === 'video' && <Video className="h-5 w-5" />}
                        {type.charAt(0).toUpperCase() + type.slice(1)} Analysis Results
                      </span>
                      <Badge className={getRiskBadgeColor(result.riskScore)}>
                        {result.riskScore >= 70 ? 'High Risk' : result.riskScore >= 40 ? 'Medium Risk' : 'Low Risk'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Risk Score */}
                    <div className="text-center">
                      <div className={`text-5xl md:text-6xl font-bold ${getRiskColor(result.riskScore)} mb-2`}>
                        {result.riskScore}%
                      </div>
                      <p className="text-slate-400">Risk Score</p>
                    </div>

                    {/* Explanation */}
                    <div>
                      <h4 className="text-white font-semibold mb-2">Analysis Summary</h4>
                      <p className="text-slate-300">{result.explanation}</p>
                    </div>

                    {/* Channel-specific sections */}
                    {type === 'text' && (
                      <div>
                        <h4 className="text-white font-semibold mb-2">Message with Highlights</h4>
                        <div className="text-slate-200 leading-relaxed">
                          {highlightKeywords(textInput, suspiciousKeywords)}
                        </div>
                      </div>
                    )}

                    {type === 'audio' && result.transcript && (
                      <div>
                        <h4 className="text-white font-semibold mb-2">Transcript</h4>
                        <div className="text-slate-200 leading-relaxed">
                          {highlightTranscript(result.transcript, ["urgent", "suspended", "verify", "now", "penalties"])}
                        </div>
                      </div>
                    )}

                    {type === 'video' && typeof result.deepfakeLikelihood === "number" && (
                      <div>
                        <h4 className="text-white font-semibold mb-2">Deepfake Likelihood</h4>
                        <div className="w-full bg-slate-800 border border-slate-700 rounded h-3 overflow-hidden">
                          <div
                            className={`h-full ${result.deepfakeLikelihood >= 70 ? "bg-red-600" : result.deepfakeLikelihood >= 40 ? "bg-yellow-500" : "bg-green-600"}`}
                            style={{ width: `${result.deepfakeLikelihood}%` }}
                          />
                        </div>
                        <p className="mt-2 text-slate-300">{result.deepfakeLikelihood}% likelihood</p>
                      </div>
                    )}

                    {/* Suspicious Elements */}
                    {result.suspiciousElements.length > 0 && (
                      <div>
                        <h4 className="text-white font-semibold mb-2">Flagged Elements</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.suspiciousElements.map((element, index) => (
                            <Badge key={index} variant="outline" className="border-red-500/30 text-red-400">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {element}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div>
                      <h4 className="text-white font-semibold mb-3">Take Action</h4>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          variant={result.action === 'block' ? 'default' : 'outline'}
                          onClick={() => handleAction(type as any, 'block')}
                          className={
                            (result.action === 'block'
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'border-red-500/30 text-red-400 hover:bg-red-500/10') +
                            ' w-full sm:w-auto'
                          }
                        >
                          <X className="h-4 w-4 mr-2" />
                          Block
                        </Button>
                        <Button
                          variant={result.action === 'report' ? 'default' : 'outline'}
                          onClick={() => handleAction(type as any, 'report')}
                          className={
                            (result.action === 'report'
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              : 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10') +
                            ' w-full sm:w-auto'
                          }
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </Button>
                        <Button
                          variant={result.action === 'ignore' ? 'default' : 'outline'}
                          onClick={() => handleAction(type as any, 'ignore')}
                          className={
                            (result.action === 'ignore'
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'border-green-500/30 text-green-400 hover:bg-green-500/10') +
                            ' w-full sm:w-auto'
                          }
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Ignore
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          ))}
        </motion.div>
      </div>
    </div>
  );
}