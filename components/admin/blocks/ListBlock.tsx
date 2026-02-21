
import React from 'react';
import { List as ListIcon, ListOrdered, Plus, Trash2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { ContentBlock } from '../../../types';
import { useEditor } from '../editor/EditorContext';
import AutoResizeTextarea from '../editor/AutoResizeTextarea';

export const listDefaults = { 
    title: '', 
    items: [''], 
    ordered: false, 
    blockSize: 'full', // Default: Voll
    align: 'center',   // Default: Mitte
    style: 'card'      // Default: Card
};

export const ListEditor: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock } = useEditor();
    const { ordered, blockSize, align, style = 'card', title } = block.attributes;
    const isCard = style === 'card';
    
    // Constant text size enforced as per request (defaulting to small)
    const currentSize = (block.attributes.textSize || 'small') as 'small' | 'medium' | 'large';

    // Configuration for perfect vertical alignment
    const sizeConfig = {
        small: { 
            text: 'text-xl leading-7', 
            wrapper: 'h-7',            
            pt: 'pt-[3px]',            
            gap: 'space-y-2',          
            padding: 'p-4'             
        }, 
        medium: { 
            text: 'text-2xl leading-8', 
            wrapper: 'h-8',             
            pt: 'pt-[3px]',             
            gap: 'space-y-3',           
            padding: 'p-6'              
        },
        large: { 
            text: 'text-4xl leading-10', 
            wrapper: 'h-10',             
            pt: 'pt-[4px]',              
            gap: 'space-y-5',            
            padding: 'p-8'               
        }
    }[currentSize];

    // Fine-tuning vertical alignment per type/size
    let symbolPt = sizeConfig.pt;
    let textPt = sizeConfig.pt;

    if (!ordered) {
        if (currentSize === 'small' || currentSize === 'medium') {
            symbolPt = 'pt-[2px]';
            textPt = 'pt-[2px]';
        }
        if (currentSize === 'large') {
            symbolPt = 'pt-[3px]';
            textPt = 'pt-[3px]';
        }
    } else {
        if (currentSize === 'medium') {
            symbolPt = 'pt-[1px]'; 
            textPt = 'pt-[2px]';   
        }
        if (currentSize === 'small') {
            symbolPt = 'pt-[2px]';
            textPt = 'pt-[2px]';
        }
        if (!isCard && currentSize === 'small') {
            symbolPt = 'pt-0';
            textPt = '-mt-[3px]'; 
        }
        if (!isCard && currentSize === 'medium') {
            textPt = '-mt-[3px]';
        }
        // Adjustment for Card Style Numbers (moved 1px down)
        if (isCard) {
             if (currentSize === 'small') symbolPt = 'pt-[1px]';
             if (currentSize === 'medium') symbolPt = 'pt-0';
             if (currentSize === 'large') symbolPt = 'pt-[3px]';
        }
    }

    // Dynamic Symbol Sizes
    const symbolConfig = {
        simple: {
            bullet: { small: 'w-2 h-2', medium: 'w-3 h-3', large: 'w-4 h-4' }, 
            number: { small: 'text-xl', medium: 'text-2xl', large: 'text-4xl' }
        },
        card: {
            bullet: { small: 'w-2.5 h-2.5', medium: 'w-4 h-4', large: 'w-5 h-5' },
            number: { small: 'text-3xl', medium: 'text-4xl', large: 'text-5xl' }
        }
    };

    const activeSymbolClass = isCard 
        ? (ordered ? symbolConfig.card.number[currentSize] : symbolConfig.card.bullet[currentSize])
        : (ordered ? symbolConfig.simple.number[currentSize] : symbolConfig.simple.bullet[currentSize]);
    
    // Layout Classes - Only apply special widths/aligns for Card style
    const effectiveBlockSize = isCard ? (blockSize || 'full') : 'full';
    const effectiveAlign = isCard ? (align || 'center') : 'left';

    // Width Calculation based on Fractions (1/3, 2/3, 3/3)
    const widthClass = {
        'small': 'w-full md:w-1/3',
        'medium': 'w-full md:w-2/3',
        'large': 'w-full md:w-5/6',
        'full': 'w-full'
    }[effectiveBlockSize as string] || 'w-full';

    const alignClass = {
        'left': 'mr-auto',
        'center': 'mx-auto',
        'right': 'ml-auto'
    }[effectiveAlign as string] || 'mx-auto';

    // Simple Style (Clean, Light)
    if (!isCard) {
        return (
            <div className={`py-4 pl-6 border-l-4 border-f1-pink w-full`}>
                {/* Header for Simple List */}
                <div className="mb-4">
                    <AutoResizeTextarea
                        value={title || ''}
                        onChange={(e) => updateBlock(block.clientId, { title: e.target.value })}
                        className="w-full bg-transparent focus:outline-none font-display font-black text-3xl uppercase italic tracking-tight text-white placeholder:text-white/20"
                        placeholder="TITEL HIER EINGEBEN..."
                    />
                </div>

                <div className={`${sizeConfig.gap}`}>
                    {(block.attributes.items || []).map((item: string, index: number) => (
                        <div key={index} className="group flex items-start relative">
                            {/* Bullet/Number Wrapper */}
                            <div className={`shrink-0 mr-4 flex justify-center transition-all duration-200 ${sizeConfig.wrapper} ${ordered ? `items-start ${symbolPt}` : 'items-center'}`}>
                                {ordered ? (
                                    <span className={`font-display font-black text-f1-pink italic leading-none transition-all duration-200 ${activeSymbolClass} ${currentSize === 'small' ? '-ml-[4px]' : currentSize === 'medium' ? '-ml-[4px]' : ''}`}>
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                ) : (
                                    <div className={`${activeSymbolClass} bg-f1-pink rounded-full shadow-glow transition-all duration-200`} />
                                )}
                            </div>
                            {/* Text Input */}
                            <AutoResizeTextarea
                                value={item}
                                onChange={(e) => {
                                    const newItems = [...(block.attributes.items || [])];
                                    newItems[index] = e.target.value;
                                    updateBlock(block.clientId, { items: newItems });
                                }}
                                className={`w-full bg-transparent focus:outline-none text-slate-300 font-display font-bold uppercase italic resize-none placeholder:text-slate-500 pr-8 ${sizeConfig.text} ${textPt}`}
                                placeholder="Listenpunkt..."
                            />
                            {/* Centered Trash Icon */}
                            <button onClick={() => {
                                const newItems = [...(block.attributes.items || [])];
                                newItems.splice(index, 1);
                                updateBlock(block.clientId, { items: newItems });
                            }} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
                <button onClick={() => {
                    const newItems = [...(block.attributes.items || [])];
                    newItems.push('');
                    updateBlock(block.clientId, { items: newItems });
                }} className="flex items-center text-xs font-bold text-slate-400 hover:text-f1-pink uppercase mt-4 transition-colors">
                    <Plus size={14} className="mr-1" /> Eintrag hinzufügen
                </button>
            </div>
        );
    }

    // Card Style (Dark, Driver Block aesthetic)
    return (
        <div className={`bg-f1-card rounded-2xl overflow-hidden shadow-2xl border border-white/5 font-display italic ${widthClass} ${alignClass}`}>
            
            {/* Header Input for Card */}
            <div className="p-6 pb-2 border-b border-white/5 bg-white/5">
                <AutoResizeTextarea
                    value={title || ''}
                    onChange={(e) => updateBlock(block.clientId, { title: e.target.value })}
                    className="w-full bg-transparent focus:outline-none text-white font-display font-black text-3xl uppercase italic tracking-tight placeholder:text-white/20"
                    placeholder="TITEL HIER EINGEBEN..."
                />
            </div>

            {/* Header Strip */}
            <div className="h-1 w-full bg-gradient-to-r from-f1-pink to-f1-card"></div>
            
            <div className="divide-y divide-white/5">
                {(block.attributes.items || []).map((item: string, index: number) => (
                    // Flex start ensures we align with the top line of text
                    <div key={index} className={`group relative flex items-start hover:bg-white/5 transition-colors duration-300 ${sizeConfig.padding}`}>
                        
                        {/* Bullet / Number Wrapper */}
                        <div className={`shrink-0 mr-6 w-12 text-center flex justify-center transition-all duration-200 ${sizeConfig.wrapper} ${ordered ? `items-start ${symbolPt}` : 'items-center'}`}>
                            {ordered ? (
                                <span className={`font-black leading-none transition-all duration-300 ${activeSymbolClass} ${item ? 'text-white/20 group-hover:text-f1-pink' : 'text-white/5'} ${currentSize === 'small' ? '-ml-[4px]' : currentSize === 'medium' ? '-ml-[4px]' : ''}`}>
                                    {index + 1}
                                </span>
                            ) : (
                                <div className={`${activeSymbolClass} bg-f1-pink rounded-full shadow-[0_0_15px_rgba(225,0,89,0.6)] group-hover:scale-125 transition-all duration-300`} />
                            )}
                        </div>

                        {/* Text Input */}
                        <AutoResizeTextarea
                            value={item}
                            onChange={(e) => {
                                const newItems = [...(block.attributes.items || [])];
                                newItems[index] = e.target.value;
                                updateBlock(block.clientId, { items: newItems });
                            }}
                            className={`w-full bg-transparent focus:outline-none text-white font-bold uppercase tracking-wide resize-none placeholder:text-white/10 ${sizeConfig.text} ${textPt}`}
                            placeholder="INHALT..."
                        />

                        {/* Action - Centered */}
                        <button onClick={() => {
                            const newItems = [...(block.attributes.items || [])];
                            newItems.splice(index, 1);
                            updateBlock(block.clientId, { items: newItems });
                        }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/10 hover:text-red-500 rounded-full hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Footer Add Button */}
            <button 
                onClick={() => {
                    const newItems = [...(block.attributes.items || [])];
                    newItems.push('');
                    updateBlock(block.clientId, { items: newItems });
                }} 
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white uppercase font-bold text-xs tracking-[0.2em] transition-all flex items-center justify-center border-t border-white/5 hover:border-f1-pink/50"
            >
                Eintrag hinzufügen
            </button>
        </div>
    );
};

export const ListInspector: React.FC<{ block: ContentBlock }> = ({ block }) => {
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Listen-Typ</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => updateBlock(block.clientId, { ordered: false })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${!block.attributes?.ordered ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon size={14} className="mr-1"/> Bullets</button>
                    <button onClick={() => updateBlock(block.clientId, { ordered: true })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${block.attributes?.ordered ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}><ListOrdered size={14} className="mr-1"/> Nummern</button>
                </div>
            </div>
        </div>
    );
};
