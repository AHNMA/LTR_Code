import React, { useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { ContentBlock } from '../../../types';
import { useEditor } from '../editor/EditorContext';
import AutoResizeTextarea from '../editor/AutoResizeTextarea';
import { GoogleGenAI } from "@google/genai";
import RichTextToolbar from '../editor/RichTextToolbar';

export const paragraphDefaults = { 
    content: '', 
    fontSize: '20px', 
    textAlign: 'left', 
    fontFamily: 'display', 
    viewMode: 'preview' 
};

export const ParagraphEditor: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock, selectedBlockId } = useEditor();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const isSelected = selectedBlockId === block.clientId;
    const isPreview = block.attributes.viewMode !== 'edit';

    useEffect(() => {
        if (isPreview && previewRef.current) {
            const currentHTML = previewRef.current.innerHTML;
            const newContent = block.attributes.content || '';
            if (currentHTML !== newContent) {
                previewRef.current.innerHTML = newContent;
            }
        }
    }, [block.attributes.content, isPreview]);

    return (
        <div style={{ textAlign: block.attributes.textAlign }} className="relative group/para">
            <div className={`transition-all duration-200 ${isSelected ? 'opacity-100 translate-y-0 mb-1' : 'opacity-0 -translate-y-2 h-0 overflow-hidden pointer-events-none'}`}>
                {isSelected && (
                    <RichTextToolbar 
                        textareaRef={textareaRef}
                        previewRef={previewRef}
                        value={block.attributes.content || ''}
                        onChange={val => updateBlock(block.clientId, { content: val })}
                        currentFont={block.attributes.fontFamily || 'display'}
                        onFontChange={val => updateBlock(block.clientId, { fontFamily: val })}
                        viewMode={isPreview ? 'preview' : 'edit'}
                        onToggleViewMode={() => updateBlock(block.clientId, { viewMode: isPreview ? 'edit' : 'preview' })}
                        textAlign={block.attributes.textAlign || 'left'}
                        onTextAlignChange={(val) => updateBlock(block.clientId, { textAlign: val })}
                    />
                )}
            </div>

            {isPreview ? (
                <div
                    ref={previewRef}
                    contentEditable={isSelected} 
                    suppressContentEditableWarning
                    onInput={(e) => {
                        updateBlock(block.clientId, { content: e.currentTarget.innerHTML });
                    }}
                    className={`cursor-text leading-relaxed text-slate-300 selection:bg-f1-pink/20 break-words hyphens-auto [&_mark]:bg-[#fef08a] [&_mark]:text-slate-900 [&_sup]:align-super [&_sup]:text-[0.6em] [&_a]:text-f1-pink [&_a]:font-bold [&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-4 [&_p]:text-inherit [&_div]:text-inherit ${block.attributes.fontFamily === 'sans' ? 'font-sans font-light text-lg' : 'font-display font-medium text-2xl tracking-wide'} border border-transparent min-h-[40px] focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-white/20`}
                    style={{ textAlign: block.attributes.textAlign, textJustify: 'inter-word' }}
                    data-placeholder="Schreib etwas..."
                />
            ) : (
                <AutoResizeTextarea
                    ref={textareaRef}
                    value={block.attributes.content || ''}
                    onChange={(e) => updateBlock(block.clientId, { content: e.target.value })}
                    className={`w-full bg-transparent focus:outline-none ${block.attributes.fontFamily === 'sans' ? 'font-sans text-lg' : 'font-display text-2xl'} placeholder:text-white/20 border-l-2 border-transparent focus:border-white/20 pl-2 -ml-2 transition-colors font-mono text-sm bg-white/5 text-slate-300 p-2 rounded-2xl`}
                    placeholder="HTML Code..."
                    style={{ textAlign: block.attributes.textAlign }}
                />
            )}
        </div>
    );
};

export const ParagraphInspector: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock } = useEditor();
    const [isTranslating, setIsTranslating] = React.useState(false);

    const handleTranslate = async (targetLang: string) => {
        if (!block.attributes.content) return;
        setIsTranslating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Translate the following HTML text to ${targetLang}. 
                IMPORTANT: Maintain all HTML tags exactly. Only translate visible text.
                Input: ${block.attributes.content}`
            });
            if (response.text) updateBlock(block.clientId, { content: response.text });
        } catch (error) {
            console.error("Translation failed", error);
            alert("Translation failed.");
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center text-xs font-bold uppercase text-slate-800 mb-2">
                <Sparkles size={14} className="text-f1-pink mr-2"/> AI Übersetzung
            </div>
            <div className="grid grid-cols-2 gap-2">
                {['German', 'English', 'Spanish', 'French'].map(lang => (
                    <button 
                        key={lang}
                        onClick={() => handleTranslate(lang)} 
                        disabled={isTranslating}
                        className="py-2 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold uppercase flex items-center justify-center disabled:opacity-50"
                    >
                        {isTranslating ? '...' : lang}
                    </button>
                ))}
            </div>
        </div>
    );
};