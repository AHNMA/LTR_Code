import React from 'react';
import { Music, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { ContentBlock } from '../../../types';
import { useEditor } from '../editor/EditorContext';
import BlockRenderer from '../../../components/article/BlockRenderer';

const extractSpotifyUrl = (input: string) => {
    if (!input) return '';
    const srcMatch = input.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) return srcMatch[1];
    if (input.includes('open.spotify.com') && !input.includes('/embed/')) {
        return input.replace('open.spotify.com/', 'open.spotify.com/embed/');
    }
    return input;
};

export const SpotifyEditor: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock, selectedBlockId } = useEditor();

    return (
        <div>
            <BlockRenderer block={block} editable={true} selectedBlockId={selectedBlockId} onUpdateBlock={updateBlock} />
        </div>
    );
};

export const SpotifyInspector: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock } = useEditor();
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Spotify Link</label>
                <input 
                    className="w-full border rounded p-2 text-xs bg-white focus:outline-none focus:border-green-500 text-slate-900" 
                    placeholder="https://open.spotify.com/..." 
                    defaultValue={block.attributes?.url || ''}
                    onBlur={e => {
                        const newUrl = extractSpotifyUrl(e.target.value);
                        if (newUrl) updateBlock(block.clientId, { url: newUrl });
                    }}
                />
            </div>
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Größe</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {['small', 'medium', 'large'].map(size => (
                        <button key={size} onClick={() => updateBlock(block.clientId, { blockSize: size })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase transition-all ${block.attributes?.blockSize === size || (!block.attributes?.blockSize && size === 'medium') ? 'bg-white shadow-sm text-green-600' : 'text-slate-400 hover:text-slate-600'}`}>
                            {size === 'small' ? 'Klein' : size === 'medium' ? 'Mittel' : 'Groß'}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Ausrichtung</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => updateBlock(block.clientId, { align: 'left' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${block.attributes?.align === 'left' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400 hover:text-slate-600'}`}><AlignLeft size={14} className="mr-1"/> Links</button>
                    <button onClick={() => updateBlock(block.clientId, { align: 'center' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${block.attributes?.align === 'center' || !block.attributes?.align ? 'bg-white shadow-sm text-green-600' : 'text-slate-400 hover:text-slate-600'}`}><AlignCenter size={14} className="mr-1"/> Mitte</button>
                    <button onClick={() => updateBlock(block.clientId, { align: 'right' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${block.attributes?.align === 'right' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400 hover:text-slate-600'}`}><AlignRight size={14} className="mr-1"/> Rechts</button>
                </div>
            </div>
        </div>
    );
};