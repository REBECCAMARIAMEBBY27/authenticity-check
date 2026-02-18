import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Scan, RotateCcw, FileText, Image as ImageIcon, Upload, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ConfidenceGauge from "@/components/ConfidenceGauge";
import AnalysisIndicator from "@/components/AnalysisIndicator";
import ScanningOverlay from "@/components/ScanningOverlay";

interface AnalysisResult {
  verdict: string;
  confidence: number;
  summary: string;
  indicators: { label: string; detail: string; signal: "ai" | "human" | "neutral" }[];
}

type TabType = "text" | "image" | "audio";

const SAMPLE_TEXTS = [
  `The morning sun cast long shadows across the kitchen floor as I fumbled with the coffee maker, still half-asleep. My cat, predictably, had knocked over the plant on the windowsill again — third time this week. I really need to move that thing, but honestly? I kind of like the chaos. There's something comforting about the mess of it all, you know?`,
  `Artificial intelligence has fundamentally transformed the landscape of modern technology, offering unprecedented capabilities in data processing, pattern recognition, and automated decision-making. These advancements have enabled organizations to optimize their operational efficiency, enhance customer experiences, and drive innovation across various sectors of the global economy.`,
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const [text, setText] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setText("");
    setUploadedImage(null);
    setImagePreview(null);
    setUploadedAudio(null);
    setAudioFileName(null);
    setResult(null);
  };

  const analyzeText = async () => {
    if (text.trim().length < 20) {
      toast({ title: "Too short", description: "Please enter at least 20 characters.", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    setResult(null);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "Analysis failed"); }
      setResult(await resp.json());
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setIsAnalyzing(false); }
  };

  const analyzeImage = async () => {
    if (!uploadedImage) { toast({ title: "No image", description: "Please upload an image first.", variant: "destructive" }); return; }
    setIsAnalyzing(true);
    setResult(null);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ imageData: uploadedImage }),
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "Analysis failed"); }
      setResult(await resp.json());
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setIsAnalyzing(false); }
  };

  const analyzeAudio = async () => {
    if (!uploadedAudio) { toast({ title: "No audio", description: "Please upload an audio file first.", variant: "destructive" }); return; }
    setIsAnalyzing(true);
    setResult(null);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ audioData: uploadedAudio, fileName: audioFileName }),
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "Analysis failed"); }
      setResult(await resp.json());
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setIsAnalyzing(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = (event) => { const base64 = event.target?.result as string; setUploadedImage(base64); setImagePreview(base64); setResult(null); };
    reader.readAsDataURL(file);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) { toast({ title: "Invalid file", description: "Please upload an audio file.", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = (event) => { setUploadedAudio(event.target?.result as string); setAudioFileName(file.name); setResult(null); };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setText("");
    setUploadedImage(null);
    setImagePreview(null);
    setUploadedAudio(null);
    setAudioFileName(null);
    setResult(null);
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "text", label: "Text", icon: FileText },
    { id: "image", label: "Image", icon: ImageIcon },
    { id: "audio", label: "Audio", icon: Mic },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(180 100% 45%) 1px, transparent 1px), linear-gradient(90deg, hsl(180 100% 45%) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-border bg-secondary/50">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">AI Detection Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            <span className="text-gradient-primary">AuthentiCheck</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Analyze text, images, or audio to detect whether they were created by AI or a human.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Text Input */}
        {activeTab === "text" && (
          <motion.div className="relative mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {isAnalyzing && <ScanningOverlay />}
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here to analyze..."
              className="min-h-[200px] bg-card border-border font-mono text-sm resize-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder:text-muted-foreground/40"
              disabled={isAnalyzing}
            />
            <div className="absolute bottom-3 right-3 text-xs font-mono text-muted-foreground/50">{text.length} chars</div>
          </motion.div>
        )}

        {/* Image preview */}
        {activeTab === "image" && uploadedImage && (
          <motion.div className="relative mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {isAnalyzing && <ScanningOverlay />}
            <div className="relative rounded-lg border border-border bg-card overflow-hidden">
              <img src={imagePreview || ""} alt="Uploaded preview" className="w-full max-h-[300px] object-contain" />
            </div>
          </motion.div>
        )}

        {/* Image upload zone */}
        {activeTab === "image" && !uploadedImage && (
          <motion.div
            className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 mb-6 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <Upload className="w-8 h-8 text-primary mb-2" />
            <p className="text-foreground font-mono text-sm mb-1">Click to upload an image</p>
            <p className="text-muted-foreground text-xs font-mono">JPG, PNG supported</p>
          </motion.div>
        )}

        {/* Audio preview */}
        {activeTab === "audio" && uploadedAudio && (
          <motion.div className="relative mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {isAnalyzing && <ScanningOverlay />}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-md bg-primary/10">
                  <Mic className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-mono text-foreground">{audioFileName}</p>
                  <p className="text-xs text-muted-foreground font-mono">Audio file loaded</p>
                </div>
              </div>
              <audio controls src={uploadedAudio} className="w-full" />
            </div>
          </motion.div>
        )}

        {/* Audio upload zone */}
        {activeTab === "audio" && !uploadedAudio && (
          <motion.div
            className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 mb-6 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
            onClick={() => audioInputRef.current?.click()}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
            <Mic className="w-8 h-8 text-primary mb-2" />
            <p className="text-foreground font-mono text-sm mb-1">Click to upload an audio file</p>
            <p className="text-muted-foreground text-xs font-mono">MP3, WAV, M4A supported</p>
          </motion.div>
        )}

        {/* Sample texts */}
        {activeTab === "text" && !result && !isAnalyzing && (
          <motion.div className="flex flex-wrap gap-2 mb-6 justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <span className="text-xs text-muted-foreground font-mono mr-1 self-center">Try:</span>
            {SAMPLE_TEXTS.map((sample, i) => (
              <button
                key={i}
                onClick={() => setText(sample)}
                className="text-xs font-mono px-3 py-1.5 rounded-md border border-border bg-secondary/30 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
              >
                <FileText className="w-3 h-3 inline mr-1" />
                Sample {i + 1}
              </button>
            ))}
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="flex justify-center gap-3 mb-10">
          {!result ? (
            <Button
              onClick={activeTab === "text" ? analyzeText : activeTab === "image" ? analyzeImage : analyzeAudio}
              disabled={
                isAnalyzing ||
                (activeTab === "text" && text.trim().length < 20) ||
                (activeTab === "image" && !uploadedImage) ||
                (activeTab === "audio" && !uploadedAudio)
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono gap-2 px-6"
              size="lg"
            >
              {isAnalyzing ? (
                <><Scan className="w-4 h-4 animate-spin" />Analyzing...</>
              ) : (
                <><Scan className="w-4 h-4" />Analyze {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</>
              )}
            </Button>
          ) : (
            <Button onClick={reset} variant="outline" className="font-mono gap-2 border-border hover:border-primary/30 hover:text-primary" size="lg">
              <RotateCcw className="w-4 h-4" />
              Analyze Another
            </Button>
          )}
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} className="space-y-6">
              <div className="flex justify-center">
                <div className="p-8 rounded-2xl border border-border bg-card/80 backdrop-blur-sm" style={{ boxShadow: "var(--shadow-glow)" }}>
                  <ConfidenceGauge confidence={result.confidence} verdict={result.verdict} />
                </div>
              </div>
              <motion.div className="p-4 rounded-lg border border-border bg-card/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Analysis Summary</h3>
                <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
              </motion.div>
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Key Indicators</h3>
                <div className="grid gap-2">
                  {result.indicators.map((ind, i) => (
                    <AnalysisIndicator key={i} indicator={ind} index={i} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
