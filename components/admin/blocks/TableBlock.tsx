
import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, Layout, Table as TableIcon } from 'lucide-react';
import { ContentBlock } from '../../../types';
import { useEditor } from '../editor/EditorContext';
import BlockRenderer from '../../../components/article/BlockRenderer';
import AutoResizeTextarea from '../editor/AutoResizeTextarea';

export const tableDefaults = { 
    title: '', 
    headers: ['HEADER 1', 'HEADER 2'], 
    rows: [['INHALT 1', 'INHALT 2']], 
    fixedWidth: false, 
    blockSize: 'full', 
    align: 'center', 
    style: 'card'
};

export const TableEditor: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock, selectedBlockId } = useEditor();
    const headers = block.attributes.headers || [];
    const rows = block.attributes.rows || [];
    
    const { blockSize = 'full', align = 'center', style = 'card', title } = block.attributes;
    const isCard = style === 'card';

    // Fixed Sizing Logic
    const cellTextSize = 'text-lg'; 
    const cardPadding = 'px-6 py-4';
    const simplePadding = 'p-3';

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

    // Simple Style (Light Mode -> Adapted for Dark Mode Editor)
    if (!isCard) {
        return (
            <div>
                <div className="mb-6"><BlockRenderer block={block} editable={true} selectedBlockId={selectedBlockId} onUpdateBlock={updateBlock} /></div>
                <div className={`overflow-x-auto bg-transparent border-l-4 border-f1-pink pl-4 py-2 w-full`}>
                {/* Header for Simple Table */}
                <div className="mb-4">
                    <AutoResizeTextarea
                        value={title || ''}
                        onChange={(e) => updateBlock(block.clientId, { title: e.target.value })}
                        className="w-full bg-transparent focus:outline-none font-display font-black text-3xl uppercase italic tracking-tight text-white placeholder:text-white/20"
                        placeholder="TITEL HIER EINGEBEN..."
                    />
                </div>

                <table className={`w-full text-left border-collapse ${block.attributes.fixedWidth ? 'table-fixed' : 'table-auto'}`}>
                    <thead>
                        <tr className="border-b-2 border-white/20">
                            {headers.map((h: string, i: number) => (
                                <th key={i} className={simplePadding}>
                                    <input 
                                        value={h}
                                        onChange={(e) => {
                                            const newHeaders = [...headers];
                                            newHeaders[i] = e.target.value;
                                            updateBlock(block.clientId, { headers: newHeaders });
                                        }}
                                        className="w-full bg-transparent font-display font-black text-2xl uppercase italic tracking-tight text-white placeholder:text-white/30 focus:outline-none focus:text-f1-pink"
                                        placeholder={`HEAD ${i+1}`}
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {rows.map((row: string[], ri: number) => (
                            <tr key={ri} className="group hover:bg-white/5 transition-colors">
                                {row.map((cell, ci) => (
                                    <td key={ci} className={`${simplePadding} align-top`}>
                                        <AutoResizeTextarea
                                            value={cell}
                                            onChange={(e) => {
                                                const newRows = [...rows];
                                                newRows[ri] = [...newRows[ri]];
                                                newRows[ri][ci] = e.target.value;
                                                updateBlock(block.clientId, { rows: newRows });
                                            }}
                                            className={`w-full bg-transparent font-display font-bold uppercase text-slate-300 focus:outline-none placeholder:text-white/20 ${cellTextSize}`}
                                            placeholder="..."
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        );
    }

    // Card Style (Dark Mode / Driver Block Aesthetic)
    return (
        <div className={`bg-f1-card rounded-2xl overflow-hidden shadow-2xl border border-white/5 font-display italic tracking-wide ${widthClass} ${alignClass}`}>
            
            {/* Header Input for Card */}
            <div className="p-6 pb-2 border-b border-white/5 bg-white/5">
                <AutoResizeTextarea
                    value={title || ''}
                    onChange={(e) => updateBlock(block.clientId, { title: e.target.value })}
                    className="w-full bg-transparent focus:outline-none text-white font-display font-black text-3xl uppercase italic tracking-tight placeholder:text-white/20"
                    placeholder="TITEL HIER EINGEBEN..."
                />
            </div>

            {/* Header Accent Line */}
            <div className="h-1 w-full bg-gradient-to-r from-f1-pink to-f1-card"></div>

            <div className="overflow-x-auto">
                <table className={`w-full text-left border-collapse ${block.attributes.fixedWidth ? 'table-fixed' : 'table-auto'}`}>
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            {headers.map((h: string, i: number) => (
                                <th key={i} className={`${cardPadding} min-w-[120px] border-r border-white/5 last:border-0`}>
                                    <input 
                                        value={h}
                                        onChange={(e) => {
                                            const newHeaders = [...headers];
                                            newHeaders[i] = e.target.value;
                                            updateBlock(block.clientId, { headers: newHeaders });
                                        }}
                                        className="w-full bg-transparent font-display font-black text-3xl uppercase italic tracking-tight text-white placeholder:text-white/20 focus:outline-none focus:text-f1-pink transition-colors"
                                        placeholder={`HEADER ${i+1}`}
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {rows.map((row: string[], ri: number) => (
                            <tr key={ri} className="group hover:bg-white/5 transition-colors">
                                {row.map((cell, ci) => (
                                    <td key={ci} className={`${cardPadding} align-top border-r border-white/5 last:border-0`}>
                                        <AutoResizeTextarea
                                            value={cell}
                                            onChange={(e) => {
                                                const newRows = [...rows];
                                                newRows[ri] = [...newRows[ri]];
                                                newRows[ri][ci] = e.target.value;
                                                updateBlock(block.clientId, { rows: newRows });
                                            }}
                                            className={`w-full bg-transparent font-display font-bold uppercase text-white/80 focus:outline-none placeholder:text-white/10 min-h-[30px] ${cellTextSize}`}
                                            placeholder="..."
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const TableInspector: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock } = useEditor();
    const currentStyle = block.attributes?.style || 'card';
    const currentSize = block.attributes?.blockSize || 'full';

    const updateTableSize = (newRows: number, newCols: number) => {
        const currentHeaders = block.attributes.headers || [];
        const currentRows = block.attributes.rows || [];
        let nextHeaders = [...currentHeaders];
        let nextRows = [...currentRows];

        if (newCols > nextHeaders.length) {
            const diff = newCols - nextHeaders.length;
            for(let i=0; i<diff; i++) nextHeaders.push(`HEADER ${nextHeaders.length + 1}`);
            nextRows = nextRows.map(row => { const r = [...row]; for(let i=0; i<diff; i++) r.push(''); return r; });
        } else if (newCols < nextHeaders.length) {
            nextHeaders = nextHeaders.slice(0, newCols);
            nextRows = nextRows.map(row => row.slice(0, newCols));
        }

        if (newRows > nextRows.length) {
            const diff = newRows - nextRows.length;
            for(let i=0; i<diff; i++) nextRows.push(Array(newCols).fill(''));
        } else if (newRows < nextRows.length) {
            nextRows = nextRows.slice(0, newRows);
        }
        updateBlock(block.clientId, { headers: nextHeaders, rows: nextRows });
    };

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
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Feste Spaltenbreite</label>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white cursor-pointer" onClick={() => updateBlock(block.clientId, { fixedWidth: !block.attributes?.fixedWidth })}>
                    <span className="text-xs font-bold text-slate-700 uppercase">Aktivieren</span>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${block.attributes?.fixedWidth ? 'bg-f1-pink' : 'bg-slate-200'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${block.attributes?.fixedWidth ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Spalten und Zeilen</label>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Spalten</label>
                        <input 
                            type="number" 
                            min="1" 
                            max="10" 
                            value={(block.attributes?.headers || []).length} 
                            onChange={(e) => updateTableSize((block.attributes?.rows || []).length, parseInt(e.target.value))} 
                            className="w-full border border-slate-200 p-2 rounded text-xs font-bold bg-white text-slate-900 text-center focus:border-f1-pink focus:outline-none [color-scheme:light]" 
                        />
                    </div>
                    <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Zeilen</label>
                        <input 
                            type="number" 
                            min="1" 
                            max="50" 
                            value={(block.attributes?.rows || []).length} 
                            onChange={(e) => updateTableSize(parseInt(e.target.value), (block.attributes?.headers || []).length)} 
                            className="w-full border border-slate-200 p-2 rounded text-xs font-bold bg-white text-slate-900 text-center focus:border-f1-pink focus:outline-none [color-scheme:light]" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
