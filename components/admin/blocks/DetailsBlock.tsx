
import React from 'react';
import { Info, AlignLeft, AlignCenter, AlignRight, ChevronDown, CheckSquare, Square } from 'lucide-react';
import { ContentBlock } from '../../../types';
import { useEditor } from '../editor/EditorContext';
import AutoResizeTextarea from '../editor/AutoResizeTextarea';

export const detailsDefaults = { 
    summary: 'DETAILS AUFKLAPPEN', 
    content: '', 
    defaultOpen: false, 
    blockSize: 'full', // Default: Voll
    align: 'center',   // Default: Mitte
    style: 'card'      // Default: Card
};

export const DetailsEditor: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock } = useEditor();
    
    const { blockSize = 'full', align = 'center', style = 'card' } = block.attributes;
    const isCard = style === 'card';

    // Constants for fixed text size
    const contentTextSize = 'text-lg';
    // Updated padding to match header's p-6 horizontal padding (px-6)
    const contentPadding = 'px-6 py-4'; 
    const simpleContentPadding = 'py-2';

    // Width Calculation based on Fractions (1/3, 2/3, 3/3) - ONLY APPLIED FOR CARD STYLE
    const widthClass = isCard ? ({
        'small': 'w-full md:w-1/3',
        'medium': 'w-full md:w-2/3',
        'large': 'w-full md:w-5/6',
        'full': 'w-full'
    }[blockSize as string] || 'w-full') : 'w-full';

    const alignClass = isCard ? ({
        'left': 'mr-auto',
        'center': 'mx-auto',
        'right': 'ml-auto'
    }[align as string] || 'mx-auto') : '';

    // Simple Style (Light -> Adapted for Dark Mode)
    if (!isCard) {
        return (
            <div className={`group/details bg-transparent border-l-4 border-f1-pink pl-6 py-3 w-full`}>
                <div className="flex items-center">
                    <AutoResizeTextarea
                        value={block.attributes.summary || ''}
                        onChange={(e) => updateBlock(block.clientId, { summary: e.target.value })}
                        className="w-full font-display font-black text-3xl italic uppercase text-white bg-transparent focus:outline-none placeholder:text-white/20 resize-none overflow-hidden"
                        placeholder="TITEL..."
                    />
                </div>
                <div className={simpleContentPadding}>
                    <AutoResizeTextarea
                        value={block.attributes.content || ''}
                        onChange={(e) => updateBlock(block.clientId, { content: e.target.value })}
                        className={`w-full bg-transparent focus:outline-none text-slate-300 leading-relaxed font-display font-bold uppercase tracking-wide placeholder:text-white/20 ${contentTextSize}`}
                        placeholder="Inhalt..."
                    />
                </div>
            </div>
        );
    }

    // Card Style (Dark / List Block Look)
    return (
        <div className={`group/details bg-f1-card rounded-2xl border border-white/5 shadow-2xl overflow-hidden ${widthClass} ${alignClass}`}>
            
            {/* Header / Summary - Matches ListBlock Header */}
            <div className="p-6 pb-2 border-b border-white/5 bg-white/5 flex items-start justify-between">
                <AutoResizeTextarea
                    value={block.attributes.summary || ''}
                    onChange={(e) => updateBlock(block.clientId, { summary: e.target.value })}
                    className="w-full bg-transparent focus:outline-none text-white font-display font-black text-3xl uppercase italic tracking-tight placeholder:text-white/20 resize-none overflow-hidden"
                    placeholder="DETAILS TITEL..."
                />
                <ChevronDown className="text-white/50 ml-4 shrink-0 mt-1" size={24} />
            </div>

            {/* Header Accent Line */}
            <div className="h-1 w-full bg-gradient-to-r from-f1-pink to-f1-card"></div>

            {/* Content Body */}
            <div className={`${contentPadding} bg-f1-card/50`}>
                <AutoResizeTextarea
                    value={block.attributes.content || ''}
                    onChange={(e) => updateBlock(block.clientId, { content: e.target.value })}
                    className={`w-full bg-transparent focus:outline-none text-white/80 leading-relaxed font-display font-bold uppercase tracking-wide placeholder:text-white/10 ${contentTextSize}`}
                    placeholder="INHALT DER DETAILS-BOX..."
                />
            </div>
        </div>
    );
};

export const DetailsInspector: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock } = useEditor();
    const currentStyle = block.attributes?.style || 'card';
    const currentSize = block.attributes?.blockSize || 'full';
    
    return (
        <div className="space-y-6 font-sans">
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Stil</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => updateBlock(block.clientId, { style: 'card' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${currentStyle === 'card' || !currentStyle ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}>Card</button>
                    <button onClick={() => updateBlock(block.clientId, { style: 'simple' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${currentStyle === 'simple' ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}>Simpel</button>
                </div>
            </div>

            {currentStyle === 'card' && (
                <>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Blockgröße</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {['small', 'medium', 'full'].map(size => (
                                <button 
                                    key={size}
                                    onClick={() => updateBlock(block.clientId, { blockSize: size })}
                                    className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase transition-all ${block.attributes?.blockSize === size || (!block.attributes?.blockSize && size === 'full') ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {size === 'small' ? 'Klein' : size === 'medium' ? 'Mittel' : 'Voll'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {currentSize !== 'full' && (
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Blockausrichtung</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => updateBlock(block.clientId, { align: 'left' })}
                                    className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${block.attributes?.align === 'left' ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <AlignLeft size={14} className="mr-1"/> Links
                                </button>
                                <button 
                                    onClick={() => updateBlock(block.clientId, { align: 'center' })}
                                    className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${block.attributes?.align === 'center' || !block.attributes?.align ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <AlignCenter size={14} className="mr-1"/> Mitte
                                </button>
                                <button 
                                    onClick={() => updateBlock(block.clientId, { align: 'right' })}
                                    className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${block.attributes?.align === 'right' ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <AlignRight size={14} className="mr-1"/> Rechts
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Standardmäßig geöffnet</label>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer bg-white" onClick={() => updateBlock(block.clientId, { defaultOpen: !block.attributes?.defaultOpen })}>
                    <span className="text-xs font-bold text-slate-700 uppercase">Geöffnet</span>
                    <div className="relative">
                        {block.attributes?.defaultOpen ? (
                            <CheckSquare size={18} className="text-f1-pink" />
                        ) : (
                            <Square size={18} className="text-slate-300" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
