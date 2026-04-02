import { useState, useEffect } from 'react';
import { ThemeData, ThemeVariation } from '../services/gemini';
import { runAccessibilityChecks, ContrastCheck } from '../utils/a11yReport';
import { simulateColorBlindness, VisionType } from '../utils/accessibility';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface A11yReportProps {
  theme: ThemeData;
  selectedPrimary: ThemeVariation;
  selectedSecondary: ThemeVariation;
  isLightMode: boolean;
}

export default function A11yReport({ theme, selectedPrimary, selectedSecondary, isLightMode }: A11yReportProps) {
  const [checks, setChecks] = useState<ContrastCheck[]>([]);
  const [visionMode, setVisionMode] = useState<VisionType>('normal');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setChecks(runAccessibilityChecks(theme, selectedPrimary, selectedSecondary));
  }, [theme, selectedPrimary, selectedSecondary]);

  const score = checks.filter(c => c.passAANormal).length;
  const total = checks.length;
  const percentage = Math.round((score / total) * 100);

  const getStatusColor = (pass: boolean) => pass ? '#22c55e' : '#ef4444';

  const t = {
    bg: isLightMode ? 'bg-[#F5F5F0]' : 'bg-[#0A0A0A]',
    card: isLightMode ? 'bg-white' : 'bg-[#141414]',
    border: isLightMode ? 'border-[#0000001a]' : 'border-[#ffffff1a]',
    borderLight: isLightMode ? 'border-[#0000000d]' : 'border-[#ffffff0d]',
    text: isLightMode ? 'text-black' : 'text-white',
    textMuted: isLightMode ? 'text-[#00000066]' : 'text-[#ffffff66]',
    textSub: isLightMode ? 'text-[#00000099]' : 'text-[#ffffff99]',
    hoverBg: isLightMode ? 'hover:bg-[#0000000d]' : 'hover:bg-[#ffffff0d]',
    activeBg: isLightMode ? 'bg-[#0000001a]' : 'bg-[#ffffff1a]',
  };

  return (
    <section className={`px-10 py-12 border-b ${t.border} ${t.bg}`}>
      <div 
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="text-[10px] tracking-[4px] uppercase" style={{ color: selectedPrimary.hex }}>
            06 — Accessibility Blind Spots (Optional)
          </div>
          {isExpanded ? <ChevronUp size={14} className={t.textMuted} /> : <ChevronDown size={14} className={t.textMuted} />}
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-[11px] ${t.textMuted} tracking-[1px] uppercase`}>Score:</div>
          <div className="text-2xl font-bebas tracking-[2px]" style={{ color: percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#eab308' : '#ef4444' }}>
            {score}/{total} ({percentage}%)
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column: Contrast Checks */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className={`text-[11px] tracking-[2px] uppercase ${t.textSub} mb-4 border-b ${t.border} pb-2`}>
              WCAG Contrast Checks
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checks.map((check, i) => (
                <div key={i} className={`${t.card} border ${t.borderLight} rounded-sm p-4 flex flex-col justify-between`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className={`text-[11px] ${t.text} font-medium mb-1`}>{check.name}</div>
                      <div className={`text-[9px] ${t.textMuted} tracking-[1px]`}>
                        {check.fgName} on {check.bgName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-mono font-medium" style={{ color: getStatusColor(check.passAANormal) }}>
                        {check.ratio.toFixed(2)}:1
                      </div>
                      <div className={`text-[9px] ${t.textMuted} tracking-[1px] uppercase mt-1`}>
                        {check.passAANormal ? '✅ Pass AA' : '❌ Fail AA'}
                      </div>
                    </div>
                  </div>

                  {/* Visual Preview */}
                  <div 
                    className={`h-12 rounded-sm flex items-center justify-center text-[10px] font-medium tracking-[1px] border ${t.border}`}
                    style={{ backgroundColor: check.bgHex, color: check.fgHex }}
                  >
                    Preview Text
                  </div>
                  
                  {/* Detailed Badges */}
                  <div className="flex gap-2 mt-4 text-[8px] tracking-[1px] uppercase">
                    <span className={`px-2 py-1 rounded-sm ${check.passAANormal ? (isLightMode ? 'bg-[#22c55e1a] text-[#16a34a]' : 'bg-[#22c55e1a] text-[#4ade80]') : (isLightMode ? 'bg-[#ef44441a] text-[#dc2626]' : 'bg-[#ef44441a] text-[#f87171]')}`}>
                      AA Normal (4.5)
                    </span>
                    <span className={`px-2 py-1 rounded-sm ${check.passAALarge ? (isLightMode ? 'bg-[#22c55e1a] text-[#16a34a]' : 'bg-[#22c55e1a] text-[#4ade80]') : (isLightMode ? 'bg-[#ef44441a] text-[#dc2626]' : 'bg-[#ef44441a] text-[#f87171]')}`}>
                      AA Large (3.0)
                    </span>
                    <span className={`px-2 py-1 rounded-sm ${check.passAAANormal ? (isLightMode ? 'bg-[#22c55e1a] text-[#16a34a]' : 'bg-[#22c55e1a] text-[#4ade80]') : isLightMode ? 'bg-[#0000000d] text-[#00000066]' : 'bg-[#ffffff0d] text-[#ffffff4d]'}`}>
                      AAA (7.0)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Color Blindness Simulator */}
          <div>
            <h3 className={`text-[11px] tracking-[2px] uppercase ${t.textSub} mb-4 border-b ${t.border} pb-2`}>
              Color Blindness Simulator
            </h3>
            
            <div className={`${t.card} border ${t.borderLight} rounded-sm p-5`}>
              <div className="flex flex-col gap-2 mb-6">
                {(['normal', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as VisionType[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setVisionMode(mode)}
                    className={`text-left px-3 py-2 text-[10px] tracking-[1px] uppercase rounded-sm transition-colors ${
                      visionMode === mode 
                        ? `${t.activeBg} ${t.text}` 
                        : `${t.textMuted} ${t.hoverBg} hover:${t.text}`
                    }`}
                  >
                    {mode === 'normal' ? 'Normal Vision' : mode}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div className={`text-[9px] tracking-[2px] uppercase ${t.textMuted} mb-2`}>Simulated Palette</div>
                
                {/* Primary Accent */}
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-sm transition-colors duration-300"
                    style={{ backgroundColor: simulateColorBlindness(selectedPrimary.hex, visionMode) }}
                  />
                  <div className={`text-[10px] ${t.textSub}`}>{selectedPrimary.name}</div>
                </div>
                
                {/* Secondary Accent */}
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-sm transition-colors duration-300"
                    style={{ backgroundColor: simulateColorBlindness(selectedSecondary.hex, visionMode) }}
                  />
                  <div className={`text-[10px] ${t.textSub}`}>{selectedSecondary.name}</div>
                </div>

                {/* Backgrounds */}
                {theme.palette.backgrounds.slice(0, 2).map((bg, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div 
                      className={`w-8 h-8 rounded-sm border ${t.border} transition-colors duration-300`}
                      style={{ backgroundColor: simulateColorBlindness(bg.hex, visionMode) }}
                    />
                    <div className={`text-[10px] ${t.textSub}`}>{bg.name}</div>
                  </div>
                ))}
              </div>
              
              <div className={`mt-6 p-3 ${isLightMode ? 'bg-[#0000000d]' : 'bg-[#ffffff0d]'} rounded-sm text-[9px] ${t.textSub} leading-relaxed`}>
                <strong>Tip:</strong> Ensure your primary and secondary accents are distinguishable without relying solely on hue. If they look identical in Achromatopsia (grayscale), they lack sufficient lightness contrast.
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
