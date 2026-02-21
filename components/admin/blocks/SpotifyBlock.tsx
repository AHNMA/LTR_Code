import React from 'react';
import { Music, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { ContentBlock } from '../../../types';
import { useEditor } from '../editor/EditorContext';

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
    const { url, blockSize = 'medium', align = 'center' } = block.attributes;
    const sizeClass = { 'small': 'max-w-md', 'medium': 'max-w-2xl', 'large': 'max-w-4xl' }[blockSize as string] || 'max-w-2xl';
    const alignClass = { 'left': 'mr-auto', 'center': 'mx-auto', 'right': 'ml-auto' }[align as string] || 'mx-auto';

    return (
        <div className={`w-full ${sizeClass} ${alignClass}`}>
            {url ? (
                <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                    <iframe 
                        src={url} 
                        width="100%" 
                        height="152" 
                        frameBorder="0" 
                        allow="encrypted-media" 
                        loading="lazy"
                        className="pointer-events-none"
                    ></iframe>
                </div>
            ) : (
                <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center flex flex-col items-center justify-center text-slate-400">
                    <Music size={32} className="mb-2 text-green-500" />
                    <span className="text-xs font-bold uppercase">Spotify hinzufügen</span>
                </div>
            )}
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