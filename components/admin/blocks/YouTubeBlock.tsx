import React from 'react';
import { Youtube, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { ContentBlock } from '../../../types';
import { useEditor } from '../editor/EditorContext';

// --- Utils ---
const extractYoutubeId = (input: string) => {
    if (!input) return '';
    const cleanInput = input.trim();

    // 1. Direct ID (11 chars)
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanInput)) return cleanInput;

    // 2. Shorts (youtube.com/shorts/ID)
    const shortsMatch = cleanInput.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

    // 3. Embed Code (src=".../embed/ID")
    const embedMatch = cleanInput.match(/src=".*?\/embed\/([a-zA-Z0-9_-]{11})"/);
    if (embedMatch && embedMatch[1]) return embedMatch[1];

    // 4. Short URL (youtu.be/ID)
    const shortUrlMatch = cleanInput.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortUrlMatch && shortUrlMatch[1]) return shortUrlMatch[1];

    // 5. Standard Watch URL (v=ID)
    const vMatch = cleanInput.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (vMatch && vMatch[1]) return vMatch[1];

    // 6. Direct Embed URL (.../embed/ID)
    const embedUrlMatch = cleanInput.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedUrlMatch && embedUrlMatch[1]) return embedUrlMatch[1];

    // 7. Live Stream URL
    const liveMatch = cleanInput.match(/\/live\/([a-zA-Z0-9_-]{11})/);
    if (liveMatch && liveMatch[1]) return liveMatch[1];

    return '';
};

// --- Editor Component ---
export const YouTubeEditor: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { id, blockSize = 'medium', align = 'center' } = block.attributes;
    
    const sizeClass = {
        'small': 'max-w-sm',
        'medium': 'max-w-xl',
        'large': 'max-w-full'
    }[blockSize as string] || 'max-w-xl';

    const alignClass = {
        'left': 'mr-auto',
        'center': 'mx-auto',
        'right': 'ml-auto'
    }[align as string] || 'mx-auto';

    // Calculate origin for sandbox compatibility
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    return (
        <div className={`w-full ${sizeClass} ${alignClass}`}>
            {id ? (
                <div className="aspect-video bg-black rounded-2xl overflow-hidden relative shadow-sm border border-slate-200">
                    <iframe 
                        className="w-full h-full pointer-events-none" 
                        src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&origin=${origin}`} 
                        frameBorder="0" 
                        title="YouTube Preview"
                        referrerPolicy="no-referrer"
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    ></iframe>
                </div>
            ) : (
                <div className="aspect-video bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                    <Youtube size={32} className="mb-2" />
                    <span className="text-xs font-bold uppercase">Video hinzufügen</span>
                </div>
            )}
        </div>
    );
};

// --- Inspector Component ---
export const YouTubeInspector: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock } = useEditor();

    const handleInput = (val: string) => {
        const newId = extractYoutubeId(val);
        if (newId) {
            updateBlock(block.clientId, { id: newId });
        } else if (val.trim() === '') {
            // Allow clearing
            updateBlock(block.clientId, { id: '' });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Video Link oder Embed-Code</label>
                <input 
                    className="w-full border rounded p-2 text-xs bg-white focus:outline-none focus:border-f1-pink" 
                    placeholder="https://youtube.com/watch?v=... oder Shorts" 
                    defaultValue={block.attributes?.id ? `https://youtu.be/${block.attributes.id}` : ''}
                    onBlur={e => handleInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            handleInput(e.currentTarget.value);
                        }
                    }}
                />
                <p className="text-[9px] text-slate-400 mt-1">Unterstützt Standard-Links, Shorts und Embed-Codes.</p>
            </div>

            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Größe</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {['small', 'medium', 'large'].map(size => (
                        <button 
                            key={size}
                            onClick={() => updateBlock(block.clientId, { blockSize: size })}
                            className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase transition-all ${block.attributes?.blockSize === size || (!block.attributes?.blockSize && size === 'medium') ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {size === 'small' ? 'Klein' : size === 'medium' ? 'Mittel' : 'Groß'}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Ausrichtung</label>
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
        </div>
    );
};

export const defaultAttributes = { id: '', blockSize: 'medium', align: 'center' };