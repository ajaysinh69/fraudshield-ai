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
  Loader2
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

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
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const transcribe = useAction(api.assemblyai.transcribe);

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

  const suspiciousKeywords = ['urgent', 'click now', 'verify account', 'suspended', 'winner', 'congratulations', 'transfer now', 'otp', 'account blocked', 'legal action', 'police'];

  // ADD: safe highlighter helpers
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function highlightWithList(text: string, list: string, className: string): ReactNode {
    if (!text) return <span />;
    const keywords = list.split("|").filter(Boolean);
    if (keywords.length === 0) return <span>{text}</span>;
    const regex = new RegExp(`(${keywords.map(escapeRegExp).join("|")})`, "gi");

    const parts: Array<string | ReactNode> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (start > lastIndex) parts.push(text.slice(lastIndex, start));
      parts.push(
        <mark key={start} className={className}>
          {match[0]}
        </mark>
      );
      lastIndex = end;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));

    return <span>{parts}</span>;
  }

  // Exposed helpers used in JSX
  function highlightKeywords(text: string, keywords: string[]): ReactNode {
    return highlightWithList(
      text,
      keywords.join("|"),
      "bg-red-500/20 text-red-400 rounded px-1"
    );
  }

  function highlightTranscript(text: string, keywords: string[]): ReactNode {
    return highlightWithList(
      text,
      keywords.join("|"),
      "bg-red-500/10 text-red-400 underline underline-offset-2 decoration-red-500/70 rounded px-0.5"
    );
  }

  const evidenceOnlyClassify = (text: string) => {
    const lowered = (text || "").toLowerCase();
    const evidence = suspiciousKeywords.filter(k => lowered.includes(k.toLowerCase()));
    if (evidence.length === 0) {
      return {
        label: "UNCERTAIN" as const,
        score: 0,
        evidence,
        explanation: "",
        recommended_action: "REVIEW" as const, // Not displayed in UI but kept for completeness
      };
    }
    return {
      label: "FRAUD" as const,
      score: 90,
      evidence,
      explanation: evidence.length === 1 ? `Contains ${evidence[0]}` : `Contains ${evidence.join(", ")}`,
      recommended_action: "BLOCK" as const,
    };
  };

  const scamKeywords = ["transfer", "otp", "blocked", "police", "urgent"];
  function riskFromTranscript(t: string) {
    const lowered = (t || "").toLowerCase();
    const hits = scamKeywords.filter((k) => lowered.includes(k.toLowerCase()));
    const score = Math.min(100, hits.length * 20 + (hits.length > 0 ? 40 : 0));
    return { score, hits };
  }

  const analyzeMedia = async (type: "audio" | "video", file: File): Promise<DetectionResult> => {
    try {
      const bytes = await file.arrayBuffer();
      const res = await transcribe({
        file: bytes,
        filename: file.name,
        mimeType: file.type || (type === "audio" ? "audio/mpeg" : "video/mp4"),
        mediaType: type,
      });
      const transcript = res?.text || "";
      const { score, hits } = riskFromTranscript(transcript);
      return {
        riskScore: score,
        explanation:
          transcript.length > 0
            ? "Transcript analyzed. Risk derived from scam keyword presence."
            : "No transcript text returned.",
        suspiciousElements: hits.length ? hits : [],
        action: null,
        transcript,
      };
    } catch (e) {
      throw e;
    }
  };

  const mockAnalyzeText = async (text: string): Promise<DetectionResult> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const verdict = evidenceOnlyClassify(text);

    // Map label/score to UI fields
    const riskScore = verdict.score; // 0 for UNCERTAIN, 90 for FRAUD based on evidence-only
    const explanation = verdict.explanation || "No evidence terms found.";
    const suspiciousElements = verdict.evidence;

    return {
      riskScore,
      explanation,
      suspiciousElements,
      action: null,
    };
  };

  const handleAnalyze = async (type: 'text' | 'audio' | 'video', data?: string) => {
    setIsAnalyzing(true);
    try {
      let result: DetectionResult | undefined;
      switch (type) {
        case 'text': {
          if (!data?.trim()) {
            toast.error("No input detected.");
            return;
          }
          result = await mockAnalyzeText(data);
          break;
        }
        case 'audio': {
          if (!audioFile || !/\.(mp3|wav|m4a)$/i.test(audioFile.name)) {
            toast.error("Please upload a valid audio/video file.");
            return;
          }
          toast("Analyzing audio…");
          result = await analyzeMedia('audio', audioFile);
          break;
        }
        case 'video': {
          if (!videoFile || !/\.(mp4|mov|avi)$/i.test(videoFile.name)) {
            toast.error("Please upload a valid audio/video file.");
            return;
          }
          toast("Analyzing video…");
          result = await analyzeMedia('video', videoFile);
          break;
        }
      }
      if (!result) {
        toast.error("Unable to analyze input. Please try again.");
        return;
      }
      setResults(prev => ({ ...prev, [type]: result }));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} analysis complete`);
    } catch (error) {
      console.error(error);
      toast.error("Unable to process this file. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // New: Use Sample Input button handler
  const handleUseSample = async (type: 'text' | 'audio' | 'video') => {
    if (type === 'text') {
      const sample = "Urgent: Your account is blocked. Transfer the OTP now or the police will be notified.";
      setTextInput(sample);
      await handleAnalyze('text', sample);
      return;
    }

    const fetchAndAnalyze = async (url: string, filename: string, mime: string, mediaType: 'audio' | 'video') => {
      try {
        setIsAnalyzing(true);
        toast(`Loading sample ${mediaType}…`);
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const file = new File([buf], filename, { type: mime });
        const result = await analyzeMedia(mediaType, file);
        setResults(prev => ({ ...prev, [mediaType]: result }));
        toast.success(`${mediaType === 'audio' ? 'Audio' : 'Video'} analysis complete`);
      } catch {
        toast.error("Unable to process this file. Please try again.");
      } finally {
        setIsAnalyzing(false);
      }
    };

    if (type === 'audio') {
      // Small public WAV sample
      await fetchAndAnalyze(
        "https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav",
        "sample.wav",
        "audio/wav",
        "audio"
      );
    } else {
      // Public small MP4 sample
      await fetchAndAnalyze(
        "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
        "sample.mp4",
        "video/mp4",
        "video"
      );
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
    setAudioFile(file);
    if (!file) return;
    const ok = /\.(mp3|wav|m4a)$/i.test(file.name);
    if (!ok) {
      toast.error("Invalid audio file. Supported: .mp3, .wav, .m4a");
      return;
    }
    toast("Audio file ready. Click Analyze Audio to proceed.");
  };

  const handleVideoFile = (file: File | null) => {
    setVideoFile(file);
    if (!file) return;
    const ok = /\.(mp4|mov|avi)$/i.test(file.name);
    if (!ok) {
      toast.error("Invalid video file. Supported: .mp4, .mov, .avi");
      return;
    }
    toast("Video file ready. Click Analyze Video to proceed.");
  };

  const handleAction = async (type: 'text' | 'audio' | 'video', action: 'block' | 'report' | 'ignore') => {
    const key = `${type}:${action}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    // Simulate short processing delay for visual feedback
    await new Promise((r) => setTimeout(r, 600));

    setResults(prev => ({
      ...prev,
      [type]: prev[type] ? { ...prev[type]!, action } : undefined
    }));
    
    const actionMessages = {
      block: "Content blocked and added to blacklist",
      report: "Content reported to authorities",
      ignore: "Content marked as safe"
    };
    
    setActionLoading((prev) => ({ ...prev, [key]: false }));
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

  const selectedIndex = activeTab === "text" ? 0 : activeTab === "audio" ? 1 : 2;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-white dark:bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="rounded-full bg-gray-200 text-[#111827] hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 transition-all duration-200 active:scale-95 px-4 py-2 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              <span className="text-lg sm:text-xl font-bold">FraudShield AI</span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle className="scale-90 sm:scale-100" />
            {user && (
              <span className="hidden sm:block text-muted-foreground">
                Welcome, {user.name || user.email || "User"}
              </span>
            )}
            <Button variant="outline" onClick={signOut} className="min-h-11 rounded-md px-4 py-2 transition-all duration-200 hover:shadow">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Add top padding to account for fixed header */}
      <motion.div
        className="pt-16 container mx-auto px-4 py-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Stats Strip */}
        <div className="mb-6">
          <div className="bg-white dark:bg-card border border-border rounded-xl shadow-md p-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-foreground w-full">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Scams Analyzed: <span className="font-semibold">{stats.analyzed}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Blocked: <span className="font-semibold">{stats.blocked}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Users Protected: <span className="font-semibold">{stats.users}</span></span>
            </div>
          </div>
        </div>

        {/* Main Detection Interface */}
        <Card className="bg-white dark:bg-card border-border rounded-xl shadow-md mb-6 w-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Content Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="relative grid grid-cols-3 w-full items-center overflow-hidden bg-muted p-0 rounded-md">
                <TabsTrigger
                  value="text"
                  className="w-full justify-center px-4 py-2 rounded-md transition-colors font-medium text-slate-700 dark:text-slate-300 data-[state=active]:bg-blue-600 dark:data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Text
                </TabsTrigger>
                <TabsTrigger
                  value="audio"
                  className="w-full justify-center px-4 py-2 rounded-md transition-colors font-medium text-slate-700 dark:text-slate-300 data-[state=active]:bg-blue-600 dark:data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:text-white"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Audio
                </TabsTrigger>
                <TabsTrigger
                  value="video"
                  className="w-full justify-center px-4 py-2 rounded-md transition-colors font-medium text-slate-700 dark:text-slate-300 data-[state=active]:bg-blue-600 dark:data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:text-white"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block text-center sm:text-left">
                    Paste suspicious text or upload file
                  </label>
                  <Textarea
                    placeholder="Paste the suspicious message here..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="min-h-[120px] w-full placeholder:text-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Input
                    type="file"
                    accept=".txt,.csv,text/plain"
                    onChange={(e) => handleTextFile(e.target.files?.[0] || null)}
                    className="file:border-0 w-full sm:w-auto border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button
                      onClick={() => handleAnalyze('text', textInput)}
                      disabled={isAnalyzing || !textInput.trim()}
                      className="w-full sm:w-auto min-h-11 rounded-md px-4 py-2 transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-400 dark:hover:bg-blue-500 dark:text-black"
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
                      className="w-full sm:w-auto min-h-11 rounded-md px-4 py-2 transition-all duration-200 hover:shadow bg-gray-100 text-[#111827] hover:bg-gray-200"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>Use Sample Input</>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="audio" className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block text-center sm:text-left">
                    Upload audio file for voice analysis
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-white/70 dark:bg-card/50">
                    <Upload className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Drop audio files here or click to browse</p>
                    <p className="text-sm text-muted-foreground">Supports .mp3, .wav, .m4a files</p>
                    <Input
                      type="file"
                      accept=".mp3,.wav,.m4a,audio/*"
                      onChange={(e) => handleAudioFile(e.target.files?.[0] || null)}
                      className="mt-4 file:border-0 w-full sm:w-auto border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    onClick={() => handleAnalyze('audio')}
                    disabled={isAnalyzing || !audioFile}
                    className="w-full sm:w-auto min-h-11 rounded-md px-4 py-2 transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-400 dark:hover:bg-blue-500 dark:text-black"
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
                    className="w-full sm:w-auto min-h-11 rounded-md px-4 py-2 transition-all duration-200 hover:shadow bg-gray-100 text-[#111827] hover:bg-gray-200"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>Use Sample Input</>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="video" className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block text-center sm:text-left">
                    Upload video file for deepfake detection
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-white/70 dark:bg-card/50">
                    <Upload className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Drop video files here or click to browse</p>
                    <p className="text-sm text-muted-foreground">Supports .mp4, .mov, .avi files</p>
                    <Input
                      type="file"
                      accept=".mp4,.mov,.avi,video/*"
                      onChange={(e) => handleVideoFile(e.target.files?.[0] || null)}
                      className="mt-4 file:border-0 w-full sm:w-auto border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    onClick={() => handleAnalyze('video')}
                    disabled={isAnalyzing || !videoFile}
                    className="w-full sm:w-auto min-h-11 rounded-md px-4 py-2 transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-400 dark:hover:bg-blue-500 dark:text-black"
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
                    className="w-full sm:w-auto min-h-11 rounded-md px-4 py-2 transition-all duration-200 hover:shadow bg-gray-100 text-[#111827] hover:bg-gray-200"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>Use Sample Input</>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Placeholder when no input/results yet */}
        {!results.text && !results.audio && !results.video && (
          <Card className="bg-white dark:bg-card border-border rounded-xl shadow-md mb-6 w-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-center sm:text-left">Waiting for input</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-center sm:text-left">
                Waiting for input... Please upload text, audio, or video.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {Object.entries(results).map(([type, result]) => (
          result && (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white dark:bg-card border-border rounded-xl shadow-md mb-6">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center justify-between">
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
                    <p className="text-muted-foreground">Risk Score</p>
                  </div>

                  {/* Explanation */}
                  <div>
                    <h4 className="font-semibold mb-2">Analysis Summary</h4>
                    <p className="text-foreground">{result.explanation}</p>
                  </div>

                  {/* Channel-specific sections */}
                  {type === 'text' && (
                    <div>
                      <h4 className="font-semibold mb-2">Message with Highlights</h4>
                      <div className="leading-relaxed">
                        {highlightKeywords(textInput, suspiciousKeywords)}
                      </div>
                    </div>
                  )}

                  {type === 'audio' && result.transcript && (
                    <div>
                      <h4 className="font-semibold mb-2">Transcript</h4>
                      <div className="leading-relaxed border border-border rounded-md p-3 max-h-64 overflow-auto bg-white dark:bg-card text-foreground">
                        {highlightTranscript(result.transcript, ["transfer", "otp", "blocked", "police", "urgent"])}
                      </div>
                    </div>
                  )}

                  {type === 'video' && typeof result.deepfakeLikelihood === "number" && (
                    <div>
                      <h4 className="font-semibold mb-2">Deepfake Likelihood</h4>
                      <div className="w-full bg-muted border border-border rounded h-3 overflow-hidden">
                        <div
                          className={`${result.deepfakeLikelihood >= 70 ? "bg-red-600" : result.deepfakeLikelihood >= 40 ? "bg-yellow-500" : "bg-green-600"}`}
                          style={{ width: `${result.deepfakeLikelihood}%`, height: "100%" }}
                        />
                      </div>
                      <p className="mt-2 text-foreground">{result.deepfakeLikelihood}% likelihood</p>
                    </div>
                  )}

                  {/* Suspicious Elements */}
                  {result.suspiciousElements.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Flagged Elements</h4>
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
                    <h4 className="font-semibold mb-3">Take Action</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant={result.action === 'block' ? 'default' : 'outline'}
                        onClick={() => handleAction(type as any, 'block')}
                        disabled={!!actionLoading[`${type}:block`] || isAnalyzing}
                        className={' w-full sm:w-auto min-h-11 rounded-md px-4 py-2 transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-400 dark:hover:bg-blue-500 dark:text-black'}
                      >
                        {actionLoading[`${type}:block`] ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Block
                          </>
                        )}
                      </Button>
                      <Button
                        variant={result.action === 'report' ? 'default' : 'outline'}
                        onClick={() => handleAction(type as any, 'report')}
                        disabled={!!actionLoading[`${type}:report`] || isAnalyzing}
                        className={' w-full sm:w-auto min-h-11 rounded-md px-4 py-2 transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-400 dark:hover:bg-blue-500 dark:text-black'}
                      >
                        {actionLoading[`${type}:report`] ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Flag className="h-4 w-4 mr-2" />
                            Report
                          </>
                        )}
                      </Button>
                      <Button
                        variant={result.action === 'ignore' ? 'default' : 'outline'}
                        onClick={() => handleAction(type as any, 'ignore')}
                        disabled={!!actionLoading[`${type}:ignore`] || isAnalyzing}
                        className={' w-full sm:w-auto min-h-11 rounded-md px-4 py-2 transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-400 dark:hover:bg-blue-500 dark:text-black'}
                      >
                        {actionLoading[`${type}:ignore`] ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Ignore
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        ))}

      {/* Footer */}
      <footer className="mt-8 py-6 text-center bg-white dark:bg-transparent">
        <p className="text-xs text-muted-foreground">
          Prototype for Hackathon – Not production-ready
        </p>
      </footer>
    </motion.div>
  </div>
  );
}