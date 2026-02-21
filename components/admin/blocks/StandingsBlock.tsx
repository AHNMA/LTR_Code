
import React from 'react';
import { Trophy, BarChart2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { ContentBlock } from '../../../types';
import { useEditor } from '../editor/EditorContext';
import { useData } from '../../../contexts/DataContext';
import BlockRenderer from '../../../components/article/BlockRenderer';

export const StandingsEditor: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock, selectedBlockId } = useEditor();

    return (
        <BlockRenderer block={block} editable={true} selectedBlockId={selectedBlockId} onUpdateBlock={updateBlock} />
    );
};

export const StandingsInspector: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock } = useEditor();
    const currentStyle = block.attributes?.style || 'card';

    return (
        <div className="space-y-4 font-sans">
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Wertungstyp</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => updateBlock(block.clientId, { type: 'drivers' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase transition-all ${block.attributes?.type === 'drivers' || !block.attributes?.type ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400'}`}>Fahrer</button>
                    <button onClick={() => updateBlock(block.clientId, { type: 'teams' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase transition-all ${block.attributes?.type === 'teams' ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400'}`}>Teams</button>
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Stil</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => updateBlock(block.clientId, { style: 'card' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase transition-all ${currentStyle === 'card' ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400'}`}>Card</button>
                    <button onClick={() => updateBlock(block.clientId, { style: 'simple' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase transition-all ${currentStyle === 'simple' ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400'}`}>Simple</button>
                </div>
            </div>
            {currentStyle === 'card' && (
                <div className="animate-in slide-in-from-top-2 duration-200 space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Größe (Breite)</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {['small', 'medium', 'full'].map(size => (
                                <button key={size} onClick={() => updateBlock(block.clientId, { blockSize: size })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase transition-all ${block.attributes?.blockSize === size || (!block.attributes?.blockSize && size === 'medium') ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}>
                                    {size === 'small' ? 'Klein' : size === 'medium' ? 'Mittel' : 'Voll'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Ausrichtung</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => updateBlock(block.clientId, { align: 'left' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${block.attributes?.align === 'left' ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}><AlignLeft size={14} className="mr-1"/> Links</button>
                            <button onClick={() => updateBlock(block.clientId, { align: 'center' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${block.attributes?.align === 'center' || !block.attributes?.align ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}><AlignCenter size={14} className="mr-1"/> Mitte</button>
                            <button onClick={() => updateBlock(block.clientId, { align: 'right' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${block.attributes?.align === 'right' ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}><AlignRight size={14} className="mr-1"/> Rechts</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
