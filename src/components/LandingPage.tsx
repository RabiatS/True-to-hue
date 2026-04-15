import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Wand2, ArrowRight, Image as ImageIcon } from 'lucide-react';

interface LandingPageProps {
  onGenerate: (appName: string, appDesc: string, colorPrefs: string, mode: string, images: string[]) => void;
  isLoading: boolean;
}

interface ShowcaseTheme {
  name: string;
  accent: string;
  accentDark: string;
  bg: string;
  panel: string;
  text: string;
  muted: string;
  soft: string;
}

const rabiatTheme: ShowcaseTheme = {
  name: 'True to Hue',
  accent: '#A81C1C',
  accentDark: '#6B0000',
  bg: '#0A0A0A',
  panel: '#141414',
  text: '#F5F5F0',
  muted: 'rgba(245,245,240,0.60)',
  soft: 'rgba(245,245,240,0.35)'
};

const showcasePool: ShowcaseTheme[] = [
  rabiatTheme,
  { name: 'Pastel Light', accent: '#8B6AD9', accentDark: '#5E45A8', bg: '#F8F4FF', panel: '#FFFFFF', text: '#1D1730', muted: 'rgba(29,23,48,0.65)', soft: 'rgba(29,23,48,0.45)' },
  { name: 'Ivory Studio', accent: '#B8681C', accentDark: '#8C4C11', bg: '#FFF8EE', panel: '#FFFFFF', text: '#2B1B0E', muted: 'rgba(43,27,14,0.65)', soft: 'rgba(43,27,14,0.45)' },
  { name: 'Sea Glass', accent: '#3EB489', accentDark: '#2A8A61', bg: '#081412', panel: '#101F1A', text: '#EAF6F0', muted: 'rgba(234,246,240,0.62)', soft: 'rgba(234,246,240,0.40)' },
  { name: 'Solar Note', accent: '#D59600', accentDark: '#8A6200', bg: '#14110A', panel: '#1D170B', text: '#FAF1D8', muted: 'rgba(250,241,216,0.62)', soft: 'rgba(250,241,216,0.40)' },
  { name: 'Cloud Editorial', accent: '#E857A1', accentDark: '#B63B7D', bg: '#F5F7FB', panel: '#FFFFFF', text: '#1C2233', muted: 'rgba(28,34,51,0.65)', soft: 'rgba(28,34,51,0.45)' },
  { name: 'Coral Wave', accent: '#F26457', accentDark: '#B8443A', bg: '#181112', panel: '#25191A', text: '#F8ECEB', muted: 'rgba(248,236,235,0.62)', soft: 'rgba(248,236,235,0.40)' },
];

function shuffle<T>(arr: T[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isLightHex(hex: string) {
  const clean = hex.replace('#', '');
  const normalized = clean.length === 3
    ? clean.split('').map((ch) => ch + ch).join('')
    : clean;

  const r = parseInt(normalized.slice(0, 2), 16) || 0;
  const g = parseInt(normalized.slice(2, 4), 16) || 0;
  const b = parseInt(normalized.slice(4, 6), 16) || 0;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6;
}

export default function LandingPage({ onGenerate, isLoading }: LandingPageProps) {
  const [step, setStep] = useState(0);
  const [appName, setAppName] = useState('');
  const [appDesc, setAppDesc] = useState('');
  const [colorPrefs, setColorPrefs] = useState('');
  const [mode, setMode] = useState('DARK');
  const [images, setImages] = useState<string[]>([]);
  const [pairImages, setPairImages] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'solo' | 'pair'>('solo');
  const [cameraError, setCameraError] = useState('');
  const [generationType, setGenerationType] = useState<'standard' | 'aura' | 'pair'>('standard');
  const [auraFocus, setAuraFocus] = useState('');
  const [pairBlendNotes, setPairBlendNotes] = useState('');
  const [pairColorInput, setPairColorInput] = useState('');
  const [showcaseThemes, setShowcaseThemes] = useState<ShowcaseTheme[]>([]);
  const [activeShowcase, setActiveShowcase] = useState<ShowcaseTheme>(rabiatTheme);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pairFileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const batch = shuffle(showcasePool).slice(0, 4);
    setShowcaseThemes(batch);
  }, []);

  const addFilesToImages = (files: File[], target: 'solo' | 'pair' = 'solo') => {
    if (!files.length) return;
    const existing = target === 'pair' ? pairImages.length : images.length;
    const limit = target === 'pair' ? 2 : 3;
    if (files.length + existing > limit) {
      alert(`You can only upload up to ${limit} ${target === 'pair' ? 'pair' : 'reference'} images.`);
      return;
    }

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'pair') {
          setPairImages(prev => [...prev, reader.result as string].slice(0, 2));
        } else {
          setImages(prev => [...prev, reader.result as string].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    addFilesToImages(files, 'solo');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePairImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    addFilesToImages(files, 'pair');
    if (pairFileInputRef.current) {
      pairFileInputRef.current.value = '';
    }
  };

  const handleCameraFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    addFilesToImages(files, cameraTarget);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  };

  const openCamera = async (target: 'solo' | 'pair' = 'solo') => {
    if ((target === 'solo' && images.length >= 3) || (target === 'pair' && pairImages.length >= 2) || isLoading) return;
    setCameraError('');
    setCameraTarget(target);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this browser. Use "Choose File" instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      cameraStreamRef.current = stream;
      setIsCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch (error) {
      console.error('Unable to access camera:', error);
      setCameraError('Could not access your camera. Allow camera permission, or use "Choose File".');
    }
  };

  const closeCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('Camera is not ready yet. Try again in a moment.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('Failed to capture image from camera.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    if (cameraTarget === 'pair') {
      setPairImages((prev) => [...prev, dataUrl].slice(0, 2));
    } else {
      setImages((prev) => [...prev, dataUrl].slice(0, 3));
    }
    closeCamera();
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const removeImage = (index: number, target: 'solo' | 'pair' = 'solo') => {
    if (target === 'pair') {
      setPairImages(prev => prev.filter((_, i) => i !== index));
      return;
    }
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    let enrichedDesc = appDesc.trim();
    let enrichedPrefs = colorPrefs.trim();

    if (generationType === 'aura') {
      enrichedDesc += `\nAura Mode: Build visual identity from personal/object aura cues. Focus: ${auraFocus || 'general emotional tone'}.`;
      enrichedPrefs += `\nAura interpretation requested from uploaded imagery.`;
    }

    if (generationType === 'pair') {
      enrichedDesc += `\nPair Aura Mode: blend two identities into one cohesive brand language. Notes: ${pairBlendNotes || 'balanced blend'}.\nPair color hints: ${pairColorInput || 'none provided'}.`;
      enrichedPrefs += `\nCreate harmony between two people/inputs using shared and complementary tones.`;
    }

    onGenerate(appName, enrichedDesc, enrichedPrefs, mode, [...images, ...pairImages]);
  };

  const isLightShowcase = isLightHex(activeShowcase.bg);
  const uiBorder = isLightShowcase ? 'rgba(10,10,10,0.18)' : 'rgba(245,245,240,0.16)';
  const uiSoftBg = isLightShowcase ? 'rgba(10,10,10,0.03)' : 'rgba(255,255,255,0.02)';
  const uiInputBg = isLightShowcase ? '#FFFFFF' : activeShowcase.panel;
  const uiHoverBg = isLightShowcase ? 'rgba(10,10,10,0.05)' : 'rgba(255,255,255,0.05)';

  return (
    <div className="min-h-screen text-[#F5F5F0] font-mono flex flex-col transition-colors duration-300 overflow-x-hidden" style={{ backgroundColor: activeShowcase.bg, color: activeShowcase.text }}>
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-10 py-5 sm:py-7 flex justify-between items-center border-b" style={{ borderColor: uiBorder }}>
        <div className="flex flex-col">
          <div className="font-bebas text-lg sm:text-2xl tracking-[0.2em]">
            TRUE TO <span style={{ color: activeShowcase.accent }}>HUE</span>
          </div>
          <a
            href="https://rabiatsadiq.com"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] tracking-[0.15em] uppercase transition-colors duration-300 hover:underline"
            style={{ color: activeShowcase.muted }}
          >
            @rabiatsadiq.com
          </a>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl w-full space-y-8 sm:space-y-12"
            >
              <div className="text-center space-y-5 sm:space-y-6">
                <h1 className="font-bebas text-4xl sm:text-6xl md:text-8xl tracking-wider leading-[0.95]">
                  SHAPE YOUR <span style={{ color: activeShowcase.accent }}>DESIGN SYSTEM</span>
                </h1>
                <p className="font-serif text-base sm:text-xl md:text-2xl italic max-w-2xl mx-auto" style={{ color: activeShowcase.muted }}>
                  Describe your vision, upload inspiration, and let AI build a complete, cohesive design system for your next project.
                </p>
                <div className="pt-4 sm:pt-8">
                  <button 
                    onClick={() => setStep(1)}
                    className="text-[#F5F5F0] px-8 py-4 font-mono text-xs sm:text-sm tracking-widest uppercase font-medium transition-colors flex items-center justify-center gap-2 mx-auto w-full sm:w-auto"
                    style={{ backgroundColor: activeShowcase.accent }}
                  >
                    START BUILDING <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-4 p-5 sm:p-6 border" style={{ borderColor: uiBorder, backgroundColor: uiSoftBg }}>
                  <div className="text-[10px] tracking-[3px]" style={{ color: activeShowcase.soft }}>01</div>
                  <h3 className="font-bold tracking-wide">Describe Your Product</h3>
                  <p className="text-xs leading-relaxed" style={{ color: activeShowcase.muted }}>Tell us what you are building, who it is for, and the feeling you want your experience to have.</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="space-y-4 p-5 sm:p-6 border" style={{ borderColor: uiBorder, backgroundColor: uiSoftBg }}>
                  <div className="text-[10px] tracking-[3px]" style={{ color: activeShowcase.soft }}>02</div>
                  <h3 className="font-bold tracking-wide">Tune Colors & Typography</h3>
                  <p className="text-xs leading-relaxed" style={{ color: activeShowcase.muted }}>Review generated options, compare combinations, and shape the visual direction to match your brand.</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="space-y-4 p-5 sm:p-6 border" style={{ borderColor: uiBorder, backgroundColor: uiSoftBg }}>
                  <div className="text-[10px] tracking-[3px]" style={{ color: activeShowcase.soft }}>03</div>
                  <h3 className="font-bold tracking-wide">Export & Ship</h3>
                  <p className="text-xs leading-relaxed" style={{ color: activeShowcase.muted }}>Copy CSS variables, download your design system, and drop it straight into your project.</p>
                </motion.div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] tracking-[3px] uppercase" style={{ color: activeShowcase.muted }}>Try Brand Examples</div>
                  <button
                    onClick={() => {
                      const batch = shuffle(showcasePool).slice(0, 4);
                      setShowcaseThemes(batch);
                      setActiveShowcase(batch[0]);
                    }}
                    className="text-[10px] tracking-[2px] uppercase border px-3 py-1.5"
                    style={{ borderColor: uiBorder, color: activeShowcase.text, backgroundColor: 'transparent' }}
                  >
                    Shuffle
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {showcaseThemes.map((sample) => (
                    <button
                      key={sample.name}
                      onClick={() => setActiveShowcase(sample)}
                      className="text-left p-3 border transition-all"
                      style={{
                        backgroundColor: sample.panel,
                        borderColor: activeShowcase.name === sample.name ? sample.accent : (isLightHex(sample.bg) ? 'rgba(10,10,10,0.18)' : 'rgba(245,245,240,0.18)'),
                        color: sample.text
                      }}
                    >
                      <div className="text-[11px] tracking-[1px] mb-2">{sample.name}</div>
                      <div className="grid grid-cols-3 h-7 rounded-sm overflow-hidden border" style={{ borderColor: isLightHex(sample.bg) ? 'rgba(10,10,10,0.18)' : 'rgba(245,245,240,0.16)' }}>
                        <div style={{ backgroundColor: sample.bg }} />
                        <div style={{ backgroundColor: sample.panel }} />
                        <div style={{ backgroundColor: sample.accent }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl w-full space-y-8"
            >
              <div>
                <div className="text-[10px] tracking-[4px] uppercase mb-4" style={{ color: activeShowcase.accent }}>01 — YOUR VISION</div>
                <h2 className="font-bebas text-3xl sm:text-5xl tracking-wide mb-2">Describe your project</h2>
                <p className="font-serif text-lg italic" style={{ color: activeShowcase.muted }}>This can be an app, brand, campaign, portfolio, or any concept. We'll generate a palette that fits.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] tracking-[2px] uppercase" style={{ color: activeShowcase.soft }}>Theme Name (Optional)</label>
                  <input 
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="e.g. Sunset Protocol, Arctic Bloom..."
                    className="w-full border p-4 text-sm focus:outline-none transition-colors"
                    style={{ backgroundColor: uiInputBg, borderColor: uiBorder, color: activeShowcase.text }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] tracking-[2px] uppercase" style={{ color: activeShowcase.soft }}>Project Description</label>
                  <textarea 
                    value={appDesc}
                    onChange={(e) => setAppDesc(e.target.value)}
                    placeholder="e.g. A cozy learning brand with playful energy, calm trust, and soft editorial warmth..."
                    className="w-full border p-4 text-sm focus:outline-none transition-colors min-h-[120px] resize-y"
                    style={{ backgroundColor: uiInputBg, borderColor: uiBorder, color: activeShowcase.text }}
                  />
                  <p className="text-[10px] tracking-[1px]" style={{ color: activeShowcase.soft }}>
                    Dev test mode: start your theme name, description, or style text with <strong>!test</strong> or <strong>7777</strong> to generate a local tester theme with zero API calls.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] tracking-[2px] uppercase" style={{ color: activeShowcase.soft }}>Mode</label>
                  <div className="flex gap-3 sm:gap-4 flex-wrap">
                    <button 
                      onClick={() => setMode('DARK')}
                      className="px-4 sm:px-6 py-3 text-xs tracking-widest border transition-colors flex-1 sm:flex-none"
                      style={{
                        borderColor: mode === 'DARK' ? activeShowcase.accent : uiBorder,
                        color: mode === 'DARK' ? activeShowcase.accent : activeShowcase.muted,
                        backgroundColor: 'transparent'
                      }}
                    >
                      DARK
                    </button>
                    <button 
                      onClick={() => setMode('LIGHT')}
                      className="px-4 sm:px-6 py-3 text-xs tracking-widest border transition-colors flex-1 sm:flex-none"
                      style={{
                        borderColor: mode === 'LIGHT' ? activeShowcase.accent : uiBorder,
                        color: mode === 'LIGHT' ? activeShowcase.accent : activeShowcase.muted,
                        backgroundColor: 'transparent'
                      }}
                    >
                      LIGHT
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 sm:pt-8">
                <button 
                  onClick={() => setStep(2)}
                  disabled={!appDesc.trim()}
                  className="text-[#F5F5F0] px-6 py-3 font-mono text-xs tracking-widest uppercase font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  style={{ backgroundColor: activeShowcase.accent }}
                >
                  NEXT: STYLE INPUTS <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl w-full space-y-8"
            >
              <div>
                <div className="text-[10px] tracking-[4px] uppercase mb-4" style={{ color: activeShowcase.accent }}>02 — COLOR PREFERENCES</div>
                <h2 className="font-bebas text-3xl sm:text-5xl tracking-wide mb-2">Any style cues in mind?</h2>
                <p className="font-serif text-lg italic" style={{ color: activeShowcase.muted }}>Share color ideas, moods, or references. Be vague or specific. Skip this for full AI suggestions.</p>
              </div>

              <div className="space-y-4">
                <textarea 
                  value={colorPrefs}
                  onChange={(e) => setColorPrefs(e.target.value)}
                  placeholder="e.g. Primary yellow and beige, secondary light pink and purple, with a hint of pastel green..."
                  className="w-full border p-4 text-sm focus:outline-none transition-colors min-h-[160px] resize-y"
                  style={{ backgroundColor: uiInputBg, borderColor: uiBorder, color: activeShowcase.text }}
                />
                <p className="text-[10px] leading-relaxed" style={{ color: activeShowcase.soft }}>
                  Examples: "warm earth tones", "neon cyberpunk", "primary #FFD700, secondary soft lavender", "ocean blues with coral accents"
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 sm:pt-8">
                <button 
                  onClick={() => setStep(1)}
                  className="border px-6 py-3 font-mono text-xs tracking-widest uppercase transition-colors w-full sm:w-auto"
                  style={{ borderColor: uiBorder, color: activeShowcase.muted, backgroundColor: 'transparent' }}
                >
                  BACK
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="text-[#F5F5F0] px-6 py-3 font-mono text-xs tracking-widest uppercase font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                  style={{ backgroundColor: activeShowcase.accent }}
                >
                  NEXT: REFERENCES <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl w-full space-y-8"
            >
              <div>
                <div className="text-[10px] tracking-[4px] uppercase mb-4" style={{ color: activeShowcase.accent }}>03 — REFERENCE IMAGES</div>
                <h2 className="font-bebas text-3xl sm:text-5xl tracking-wide mb-2">Got inspo images?</h2>
                <p className="font-serif text-lg italic" style={{ color: activeShowcase.muted }}>Upload references and choose a generation mode. Aura modes can use personal or pair photos.</p>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] tracking-[2px] uppercase" style={{ color: activeShowcase.muted }}>Generation Mode</div>
                <div className="grid sm:grid-cols-3 gap-2">
                  <button onClick={() => setGenerationType('standard')} className="border px-3 py-2 text-[10px] tracking-[2px] uppercase" style={{ borderColor: generationType === 'standard' ? activeShowcase.accent : uiBorder, color: generationType === 'standard' ? activeShowcase.accent : activeShowcase.muted }}>Standard</button>
                  <button onClick={() => setGenerationType('aura')} className="border px-3 py-2 text-[10px] tracking-[2px] uppercase" style={{ borderColor: generationType === 'aura' ? activeShowcase.accent : uiBorder, color: generationType === 'aura' ? activeShowcase.accent : activeShowcase.muted }}>Aura (Single)</button>
                  <button onClick={() => setGenerationType('pair')} className="border px-3 py-2 text-[10px] tracking-[2px] uppercase" style={{ borderColor: generationType === 'pair' ? activeShowcase.accent : uiBorder, color: generationType === 'pair' ? activeShowcase.accent : activeShowcase.muted }}>Pair Aura</button>
                </div>
              </div>

              {generationType === 'aura' && (
                <textarea
                  value={auraFocus}
                  onChange={(e) => setAuraFocus(e.target.value)}
                  placeholder="Aura focus (optional): calm confidence, playful warmth, grounded energy..."
                  className="w-full border p-4 text-sm focus:outline-none min-h-[90px]"
                  style={{ backgroundColor: uiInputBg, borderColor: uiBorder, color: activeShowcase.text }}
                />
              )}

              {generationType === 'pair' && (
                <div className="space-y-3">
                  <textarea
                    value={pairBlendNotes}
                    onChange={(e) => setPairBlendNotes(e.target.value)}
                    placeholder="Pair blend goal: how these two people/inputs should feel together"
                    className="w-full border p-4 text-sm focus:outline-none min-h-[90px]"
                    style={{ backgroundColor: uiInputBg, borderColor: uiBorder, color: activeShowcase.text }}
                  />
                  <input
                    value={pairColorInput}
                    onChange={(e) => setPairColorInput(e.target.value)}
                    placeholder="Optional pair color hints (e.g., one likes navy, one likes peach)"
                    className="w-full border p-3 text-sm focus:outline-none"
                    style={{ backgroundColor: uiInputBg, borderColor: uiBorder, color: activeShowcase.text }}
                  />
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                {images.length < 3 && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="h-12 border border-dashed border-white/20 px-4 flex items-center justify-center gap-2 transition-colors text-white/60 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] tracking-[2px] uppercase w-full sm:w-auto"
                      style={{ borderColor: `${activeShowcase.accent}66`, color: activeShowcase.accent }}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Choose File
                    </button>

                    <button
                      onClick={() => openCamera('solo')}
                      disabled={isLoading}
                      className="h-12 border border-dashed border-white/20 px-4 flex items-center justify-center gap-2 transition-colors text-white/60 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] tracking-[2px] uppercase w-full sm:w-auto"
                      style={{ borderColor: `${activeShowcase.accent}66`, color: activeShowcase.accent }}
                    >
                      <Camera className="w-4 h-4" />
                      Use Camera
                    </button>

                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isLoading}
                      className="h-12 border border-dashed border-white/20 px-4 flex items-center justify-center gap-2 transition-colors text-white/60 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] tracking-[2px] uppercase w-full sm:w-auto"
                      style={{ borderColor: `${activeShowcase.accent}66`, color: activeShowcase.accent }}
                    >
                      <Camera className="w-4 h-4" />
                      Camera File
                    </button>
                  </>
                )}
              </div>

              {generationType === 'pair' && (
                <div className="space-y-3">
                  <div className="text-[10px] tracking-[2px] uppercase" style={{ color: activeShowcase.muted }}>Pair Inputs (Person B / second source)</div>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => pairFileInputRef.current?.click()}
                      disabled={isLoading || pairImages.length >= 2}
                      className="h-11 border border-dashed px-4 text-[10px] tracking-[2px] uppercase"
                      style={{ borderColor: `${activeShowcase.accent}66`, color: activeShowcase.accent }}
                    >
                      Add Pair File
                    </button>
                    <button
                      onClick={() => openCamera('pair')}
                      disabled={isLoading || pairImages.length >= 2}
                      className="h-11 border border-dashed px-4 text-[10px] tracking-[2px] uppercase"
                      style={{ borderColor: `${activeShowcase.accent}66`, color: activeShowcase.accent }}
                    >
                      Pair Camera
                    </button>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {pairImages.map((img, idx) => (
                      <div key={`pair-${idx}`} className="relative group w-20 h-20 sm:w-24 sm:h-24">
                        <img src={img} alt={`Pair ${idx + 1}`} className="w-full h-full object-cover border border-white/10" />
                        <button type="button" onClick={() => removeImage(idx, 'pair')} className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cameraError && (
                <p className="text-[11px] text-red-400">{cameraError}</p>
              )}

              <div className="flex gap-3 sm:gap-4 flex-wrap">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group w-24 h-24 sm:w-32 sm:h-32">
                    <img 
                      src={img} 
                      alt={`Upload ${idx + 1}`} 
                      className="w-full h-full object-cover border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx, 'solo')}
                      className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {images.length < 3 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="w-24 h-24 sm:w-32 sm:h-32 border border-dashed flex flex-col items-center justify-center gap-2 transition-colors text-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: `${activeShowcase.accent}66`, color: activeShowcase.accent }}
                  >
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[10px] tracking-[2px] uppercase">UPLOAD</span>
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={isLoading}
                />
                <input
                  type="file"
                  ref={pairFileInputRef}
                  onChange={handlePairImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={isLoading}
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleCameraFileInput}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={isLoading}
                />
              </div>

              {isCameraOpen && (
                <div className="border p-4 space-y-3" style={{ backgroundColor: uiInputBg, borderColor: uiBorder }}>
                  <div className="text-[10px] tracking-[2px] uppercase" style={{ color: activeShowcase.muted }}>Camera Preview</div>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-[360px] object-cover border border-white/10"
                  />
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={capturePhoto}
                      className="text-[#F5F5F0] px-4 py-2 text-[10px] tracking-[2px] uppercase font-medium transition-colors w-full sm:w-auto"
                      style={{ backgroundColor: activeShowcase.accent }}
                    >
                      Capture Photo ({cameraTarget === 'pair' ? 'Pair' : 'Reference'})
                    </button>
                    <button
                      onClick={closeCamera}
                      className="border px-4 py-2 text-[10px] tracking-[2px] uppercase transition-colors w-full sm:w-auto"
                      style={{ borderColor: uiBorder, color: activeShowcase.muted, backgroundColor: uiHoverBg }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 sm:pt-8">
                <button 
                  onClick={() => setStep(2)}
                  disabled={isLoading}
                  className="border px-6 py-3 font-mono text-xs tracking-widest uppercase transition-colors disabled:opacity-50 w-full sm:w-auto"
                  style={{ borderColor: uiBorder, color: activeShowcase.muted, backgroundColor: 'transparent' }}
                >
                  BACK
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="text-[#F5F5F0] px-6 py-3 font-mono text-xs tracking-widest uppercase font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                  style={{ backgroundColor: activeShowcase.accent }}
                >
                  {isLoading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Wand2 className="w-4 h-4" />
                      </motion.div>
                      GENERATING...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" /> GENERATE SYSTEM
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
