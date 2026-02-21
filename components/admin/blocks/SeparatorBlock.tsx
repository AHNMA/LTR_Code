
import React from 'react';
import { Layout, Minus, Circle, Flag, Zap, CircleDot } from 'lucide-react';
import { ContentBlock } from '../../../types';
import { useEditor } from '../editor/EditorContext';
import BlockRenderer from '../../../components/article/BlockRenderer';

export const SeparatorEditor: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const style = block.attributes?.style || 'tech';
    const { updateBlock, selectedBlockId } = useEditor();

    // 1. STYLE: TECH (Broadcast Style)
    if (style === 'tech') {
        return (
            <div>
                <div className="mb-6"><BlockRenderer block={block} editable={true} selectedBlockId={selectedBlockId} onUpdateBlock={updateBlock} /></div>
                <div className="flex items-center justify-center w-full py-6 select-none group/sep">
                   <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full"></div>
                   <div className="mx-6 flex space-x-1 shrink-0">
                       <div className="w-2 h-6 bg-f1-pink -skew-x-[20deg] shadow-glow group-hover/sep:scale-110 transition-transform duration-300"></div>
                       <div className="w-1 h-6 bg-white/20 -skew-x-[20deg] group-hover/sep:bg-white/40 transition-colors"></div>
                   </div>
                   <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full"></div>
                </div>
            </div>
        );
    }

    // 2. STYLE: TRACK (Race Curbs)
    if (style === 'track') {
        return (
            <div className="overflow-hidden flex items-center justify-center py-6 select-none">
                <div className="flex space-x-1 opacity-80">
                    {[...Array(16)].map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-6 h-3 skew-x-[-30deg] transition-all duration-300 hover:opacity-100 ${i % 2 === 0 ? 'bg-f1-pink shadow-[0_0_10px_rgba(225,0,89,0.4)]' : 'bg-white/10'}`}
                        ></div>
                    ))}
                </div>
            </div>
        );
    }

    // 3. STYLE: MINIMAL (Simple Line)
    if (style === 'minimal') {
        return (
            <div className="flex items-center justify-center w-full max-w-2xl mx-auto py-6 select-none">
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent w-full"></div>
                <div className="mx-4 w-1.5 h-1.5 rotate-45 bg-white/40"></div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent w-full"></div>
            </div>
        );
    }

    // 4. STYLE: LIGHTS (Start Lights)
    if (style === 'lights') {
        return (
            <div className="flex items-center justify-center w-full py-6 select-none">
                <div className="bg-black/40 px-6 py-2 rounded-full border border-white/5 flex space-x-4 shadow-lg backdrop-blur-sm">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)] animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                </div>
            </div>
        );
    }

    // 5. STYLE: CHEQUERED (Finish Flag)
    if (style === 'chequered') {
        return (
            <div className="w-full py-6 flex flex-col items-center opacity-60 select-none">
                <div className="flex w-full max-w-lg">
                    {[...Array(24)].map((_, i) => (
                        <div key={`top-${i}`} className={`h-2 flex-1 ${i % 2 === 0 ? 'bg-white' : 'bg-transparent'}`}></div>
                    ))}
                </div>
                <div className="flex w-full max-w-lg">
                    {[...Array(24)].map((_, i) => (
                        <div key={`bot-${i}`} className={`h-2 flex-1 ${i % 2 !== 0 ? 'bg-white' : 'bg-transparent'}`}></div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
};

export const SeparatorInspector: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock } = useEditor();
    const currentStyle = block.attributes?.style || 'tech';
    
    // Style Definitions for the Inspector
    const variants = [
        { id: 'tech', label: 'Tech / Broadcast', icon: <Zap size={14} /> },
        { id: 'track', label: 'Race Track (Curbs)', icon: <Minus size={14} /> },
        { id: 'lights', label: 'Start Ampel', icon: <CircleDot size={14} /> },
        { id: 'chequered', label: 'Zielflagge', icon: <Flag size={14} /> },
        { id: 'minimal', label: 'Minimal', icon: <Circle size={14} /> },
    ];

    return (
        <div className="space-y-6 font-sans">
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Design Variante</label>
                <div className="grid grid-cols-1 gap-2 bg-slate-100 p-2 rounded-lg">
                    {variants.map(opt => (
                        <button 
                            key={opt.id}
                            onClick={() => updateBlock(block.clientId, { style: opt.id })}
                            className={`flex items-center px-4 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all duration-200 group ${
                                currentStyle === opt.id 
                                    ? 'bg-white shadow-sm text-f1-pink border border-f1-pink/10 translate-x-1' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50 border border-transparent'
                            }`}
                        >
                            <span className={`mr-3 transition-colors ${currentStyle === opt.id ? 'text-f1-pink' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                {opt.icon}
                            </span>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-400 leading-relaxed">
                Wähle einen Trenner, der visuell zum Abschnitt passt. "Tech" eignet sich gut für Daten, "Curbs" für Action-Übergänge.
            </div>
        </div>
    );
};
