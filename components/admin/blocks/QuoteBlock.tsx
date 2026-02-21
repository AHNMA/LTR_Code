import React from 'react';
import { Quote as QuoteIcon, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { ContentBlock } from '../../../types';
import { useEditor } from '../editor/EditorContext';
import BlockRenderer from '../../../components/article/BlockRenderer';
import AutoResizeTextarea from '../editor/AutoResizeTextarea';

export const quoteDefaults = {
  content: '',
  citation: '',
  textAlign: 'center',
  blockSize: 'full',
  align: 'center',
  style: 'card'
};

export const QuoteEditor: React.FC<{ block: ContentBlock }> = ({ block }) => {
  const { updateBlock, selectedBlockId } = useEditor();
  const { blockSize = 'full', align = 'center', style = 'card' } = block.attributes;
  const isCard = style === 'card';
  const textSizeClass = 'text-2xl md:text-3xl';

  const widthClass = isCard
    ? ({ small: 'w-full md:w-1/3', medium: 'w-full md:w-2/3', large: 'w-full md:w-5/6', full: 'w-full' } as any)[blockSize]
    : 'w-full';

  const alignClass = isCard
    ? ({ left: 'mr-auto', center: 'mx-auto', right: 'ml-auto' } as any)[align]
    : '';

  const isSelected = (selectedBlockId === block.clientId) && !!block.clientId;

  if (!isCard) {
    return (
      <div>
        <div className="mb-6">
          <BlockRenderer block={block} editable={true} selectedBlockId={selectedBlockId} onUpdateBlock={updateBlock} />
        </div>

        <div className="relative group/quote my-8 pl-6 border-l-4 border-f1-pink w-full">
          <div className="relative z-10 text-left font-display">
            <AutoResizeTextarea
              value={block.attributes.content || ''}
              onChange={(e) => updateBlock(block.clientId, { content: e.target.value })}
              className={`w-full bg-transparent focus:outline-none font-black italic text-white uppercase leading-none placeholder:text-white/20 resize-none ${textSizeClass}`}
              placeholder="ZITAT TEXT..."
            />

            <div className="flex items-center mt-3">
              <div className="h-0.5 w-8 bg-f1-pink mr-3" />
              <input
                value={block.attributes.citation || ''}
                onChange={(e) => updateBlock(block.clientId, { citation: e.target.value })}
                className="bg-transparent focus:outline-none font-bold uppercase tracking-widest text-slate-400 placeholder:text-white/20 w-full text-lg"
                placeholder="AUTOR / QUELLE"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <BlockRenderer block={block} editable={true} selectedBlockId={selectedBlockId} onUpdateBlock={updateBlock} />
      </div>

      <div className={`relative group/quote ${widthClass} ${alignClass}`}>
        <div className="bg-f1-card rounded-2xl overflow-hidden shadow-2xl border border-white/5 relative p-10 md:p-12 font-display">
          <QuoteIcon className="absolute -top-6 -left-6 text-white/5 transform rotate-12 scale-150 pointer-events-none" size={180} />

          <div className="relative z-10 flex flex-col">
            <div className="relative">
              <AutoResizeTextarea
                value={block.attributes.content || ''}
                onChange={(e) => updateBlock(block.clientId, { content: e.target.value })}
                className={`w-full bg-transparent focus:outline-none font-black italic text-white uppercase leading-[0.9] tracking-tight placeholder:text-white/10 resize-none text-center ${textSizeClass}`}
                placeholder="ZITAT EINGEBEN..."
                style={{ textAlign: 'center' }}
              />
            </div>

            <div className="mt-8 flex flex-col items-center justify-center">
              <div className="h-1 w-12 bg-f1-pink rounded-full mb-3 shadow-[0_0_10px_rgba(225,0,89,0.5)]" />
              <input
                value={block.attributes.citation || ''}
                onChange={(e) => updateBlock(block.clientId, { citation: e.target.value })}
                className="bg-transparent focus:outline-none font-bold uppercase tracking-[0.2em] text-white/60 placeholder:text-white/10 text-xl text-center w-full"
                placeholder="AUTOR / QUELLE"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const QuoteInspector: React.FC<{ block: ContentBlock }> = ({ block }) => {
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
              {['small', 'medium', 'full'].map((size) => (
                <button key={size} onClick={() => updateBlock(block.clientId, { blockSize: size })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase transition-all ${block.attributes?.blockSize === size || (!block.attributes?.blockSize && size === 'full') ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}>
                  {size === 'small' ? 'Klein' : size === 'medium' ? 'Mittel' : 'Voll'}
                </button>
              ))}
            </div>
          </div>

          {currentSize !== 'full' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Blockausrichtung</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => updateBlock(block.clientId, { align: 'left' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${block.attributes?.align === 'left' ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}><AlignLeft size={14} className="mr-1"/> Links</button>
                <button onClick={() => updateBlock(block.clientId, { align: 'center' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${block.attributes?.align === 'center' || !block.attributes?.align ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}><AlignCenter size={14} className="mr-1"/> Mitte</button>
                <button onClick={() => updateBlock(block.clientId, { align: 'right' })} className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center transition-all ${block.attributes?.align === 'right' ? 'bg-white shadow-sm text-f1-pink' : 'text-slate-400 hover:text-slate-600'}`}><AlignRight size={14} className="mr-1"/> Rechts</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuoteEditor;
