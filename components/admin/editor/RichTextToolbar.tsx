import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bold, Italic, Strikethrough, Highlighter, Superscript, Link as LinkIcon, Check, X, AlignLeft, AlignCenter, AlignRight, Type as TypeIcon, Code, Eye, Underline, Unlink } from 'lucide-react';

interface RichTextToolbarProps {
    textareaRef?: React.RefObject<HTMLTextAreaElement>;
    previewRef?: React.RefObject<HTMLDivElement>;
    value: string;
    onChange: (val: string) => void;
    currentFont?: string;
    onFontChange?: (font: 'display' | 'sans') => void;
    viewMode?: 'edit' | 'preview';
    onToggleViewMode?: () => void;
    // Typdefinition behält 'justify' bei, um Kompatibilität mit BlockAttributes zu gewährleisten, auch wenn die UI-Option entfernt wurde.
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    onTextAlignChange?: (align: 'left' | 'center' | 'right' | 'justify') => void;
}

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ 
    textareaRef, previewRef, value, onChange, currentFont, onFontChange, 
    viewMode = 'edit', onToggleViewMode, textAlign, onTextAlignChange 
}) => {
    
    const isPreview = viewMode === 'preview';
    const [isLinkMode, setIsLinkMode] = useState(false);
    const [linkText, setLinkText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    
    // Tracks the specific DOM element if we are editing an existing link
    const [activeLinkNode, setActiveLinkNode] = useState<HTMLAnchorElement | null>(null);
    
    const [tempLinkId, setTempLinkId] = useState<string | null>(null);
    const savedSelectionIndices = useRef<{start: number, end: number} | null>(null);

    // Active Format States
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        highlight: false,
        superscript: false,
        link: false
    });

    const checkActiveFormats = useCallback(() => {
        if (!isPreview || !previewRef?.current) {
            // In source edit mode, we can't easily detect active formats at cursor
            setActiveFormats({ bold: false, italic: false, underline: false, strike: false, highlight: false, superscript: false, link: false });
            setActiveLinkNode(null);
            return;
        }

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            // Ensure selection is inside our editor
            const anchorNode = selection.anchorNode;
            const editorNode = previewRef.current;
            
            if (anchorNode && (editorNode.contains(anchorNode) || editorNode === anchorNode)) {
                try {
                    // Highlight logic: check both backColor and hiliteColor.
                    const hilite = document.queryCommandValue('hiliteColor');
                    const back = document.queryCommandValue('backColor');
                    
                    // FIX: Strictly check for our highlight color (#fef08a or rgb values)
                    // Previous logic checked for "not white/transparent", which returned true for the dark theme background
                    const isHighlightColor = (val: string) => {
                        if (!val) return false;
                        const v = val.replace(/\s/g, '').toLowerCase();
                        // Check for hex or rgb(254, 240, 138) match
                        return v.includes('fef08a') || (v.includes('254') && v.includes('240') && v.includes('138'));
                    };

                    const hasHighlight = isHighlightColor(hilite) || isHighlightColor(back);

                    // Check for Link (traverse up)
                    let parent: Node | null = anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode;
                    let foundLink: HTMLAnchorElement | null = null;
                    
                    while (parent && parent !== editorNode) {
                        if (parent.nodeName === 'A') {
                            foundLink = parent as HTMLAnchorElement;
                            break;
                        }
                        parent = parent.parentElement;
                    }
                    setActiveLinkNode(foundLink);

                    setActiveFormats({
                        bold: document.queryCommandState('bold'),
                        italic: document.queryCommandState('italic'),
                        underline: document.queryCommandState('underline'),
                        strike: document.queryCommandState('strikethrough'),
                        highlight: hasHighlight,
                        superscript: document.queryCommandState('superscript'),
                        link: !!foundLink
                    });
                } catch (e) {
                    // Ignore errors in environments where commands aren't supported
                }
            }
        }
    }, [isPreview, previewRef]);

    // Listen to selection changes globally to update toolbar state
    useEffect(() => {
        document.addEventListener('selectionchange', checkActiveFormats);
        document.addEventListener('mouseup', checkActiveFormats);
        document.addEventListener('keyup', checkActiveFormats);
        return () => {
            document.removeEventListener('selectionchange', checkActiveFormats);
            document.removeEventListener('mouseup', checkActiveFormats);
            document.removeEventListener('keyup', checkActiveFormats);
        };
    }, [checkActiveFormats]);

    const handleAction = (tagStart: string, tagEnd: string, command: string, commandValue?: string) => {
        if (isPreview) {
            // Ensure we use CSS styles (span style="...") instead of HTML tags (font) where possible for hiliteColor
            if (command === 'hiliteColor') {
                document.execCommand('styleWithCSS', false, 'true');
            } else {
                document.execCommand('styleWithCSS', false, 'false');
            }

            document.execCommand(command, false, commandValue);
            checkActiveFormats(); // Force update immediately
            if (previewRef?.current) {
                onChange(previewRef.current.innerHTML);
            }
        } else {
            // Fallback for Source Mode (textarea) with Toggle Support
            const el = textareaRef?.current;
            if (!el) return;
            const start = el.selectionStart;
            const end = el.selectionEnd;
            const text = el.value;
            
            // Check for surrounding tags
            const before = text.substring(start - tagStart.length, start);
            const after = text.substring(end, end + tagEnd.length);
            
            let newText = '';
            let newSelectionStart = start;
            let newSelectionEnd = end;

            if (before === tagStart && after === tagEnd) {
                // Unwrap (Remove tags)
                newText = `${text.substring(0, start - tagStart.length)}${text.substring(start, end)}${text.substring(end + tagEnd.length)}`;
                newSelectionStart = start - tagStart.length;
                newSelectionEnd = end - tagStart.length;
            } else {
                // Wrap (Add tags)
                newText = `${text.substring(0, start)}${tagStart}${text.substring(start, end)}${tagEnd}${text.substring(end)}`;
                newSelectionStart = start + tagStart.length;
                newSelectionEnd = end + tagStart.length;
            }

            onChange(newText);
            
            // Restore focus and selection
            setTimeout(() => {
                el.focus();
                el.setSelectionRange(newSelectionStart, newSelectionEnd);
            }, 0);
        }
    };

    const toggleHighlight = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // If currently active, set to transparent (remove). Else set to yellow.
        const newVal = activeFormats.highlight ? 'transparent' : '#fef08a';
        handleAction('<mark>', '</mark>', 'hiliteColor', newVal);
    };

    const startLink = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent focus loss
        e.stopPropagation();

        if (isPreview) {
            // Case 1: Edit existing link
            if (activeLinkNode) {
                setLinkUrl(activeLinkNode.getAttribute('href') || '');
                setLinkText(activeLinkNode.innerText);
                setIsLinkMode(true);
                return;
            }

            // Case 2: Create new link
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
                const range = selection.getRangeAt(0);
                const text = range.toString();
                // Create a temporary ID to find this span later and replace it with a real link
                const id = Math.random().toString(36).substr(2, 9);
                setTempLinkId(id);
                setLinkText(text);
                
                // Insert a marker
                const markerHtml = `<span id="${id}" data-link-marker="true" style="text-decoration: underline; color: blue;">${text}</span>`;
                document.execCommand('insertHTML', false, markerHtml);
                
                if (previewRef?.current) onChange(previewRef.current.innerHTML);
                setLinkUrl('https://');
                setIsLinkMode(true);
            } else {
                // No selection, no active link -> Do nothing or maybe insert empty link (skipped for simplicity)
                setLinkText('');
            }
        } else {
            // Source Mode
            const el = textareaRef?.current;
            if (el) {
                const start = el.selectionStart;
                const end = el.selectionEnd;
                savedSelectionIndices.current = { start, end };
                setLinkText(el.value.substring(start, end));
            }
            setLinkUrl('https://');
            setIsLinkMode(true);
        }
    };

    const applyLink = () => {
        const finalText = linkText || linkUrl;
        
        if (isPreview) {
            if (activeLinkNode) {
                // Update existing link
                activeLinkNode.href = linkUrl;
                activeLinkNode.innerText = finalText;
                if (previewRef?.current) onChange(previewRef.current.innerHTML);
            } else if (tempLinkId) {
                // Create new link from marker
                const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${finalText}</a>`;
                if (previewRef?.current) {
                    const marker = previewRef.current.querySelector(`[id="${tempLinkId}"]`);
                    if (marker) {
                        marker.outerHTML = linkHtml;
                        onChange(previewRef.current.innerHTML);
                    }
                }
            }
            setTempLinkId(null);
            setActiveLinkNode(null);
        } else if (!isPreview) {
            // Source mode
            const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${finalText}</a>`;
            const el = textareaRef?.current;
            if (el && savedSelectionIndices.current) {
                const { start, end } = savedSelectionIndices.current;
                const text = el.value;
                const newText = `${text.substring(0, start)}${linkHtml}${text.substring(end)}`;
                onChange(newText);
            }
        }
        setIsLinkMode(false);
    };

    const removeLink = () => {
        if (isPreview && activeLinkNode && previewRef?.current) {
            // Unwrap the link (keep text, remove tag)
            const textContent = activeLinkNode.innerHTML;
            activeLinkNode.outerHTML = textContent;
            onChange(previewRef.current.innerHTML);
            setActiveLinkNode(null);
        }
        setIsLinkMode(false);
    }

    const cancelLink = () => {
        if (isPreview && tempLinkId && previewRef?.current) {
            // Revert marker if cancelled (unwrap)
            const marker = previewRef.current.querySelector(`[id="${tempLinkId}"]`);
            if (marker) {
                marker.outerHTML = marker.innerHTML;
                onChange(previewRef.current.innerHTML);
            }
        }
        setTempLinkId(null);
        setIsLinkMode(false);
    };

    // Helper to determine if formatting should be disabled (when link is active)
    const isLinkActive = !!activeLinkNode;

    if (isLinkMode) {
        return (
            <div className="flex items-center space-x-2 p-1.5 rounded-lg w-fit border border-slate-200 bg-white shadow-lg mb-2 z-30 relative animate-in fade-in zoom-in-95 duration-100">
                <input type="text" placeholder="Text" value={linkText} onChange={e => setLinkText(e.target.value)} className="w-24 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-f1-pink bg-slate-50 text-slate-900" />
                <input type="text" placeholder="URL" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="w-32 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-f1-pink bg-slate-50 text-slate-900" autoFocus />
                
                <button onMouseDown={(e) => { e.preventDefault(); applyLink(); }} className="p-1 bg-green-500 text-white rounded hover:bg-green-600" title="Speichern"><Check size={14} /></button>
                
                {/* Unlink Button (Only if editing existing link) */}
                {activeLinkNode && (
                    <button onMouseDown={(e) => { e.preventDefault(); removeLink(); }} className="p-1 bg-red-100 text-red-500 rounded hover:bg-red-200" title="Link entfernen">
                        <Unlink size={14} />
                    </button>
                )}

                <button onMouseDown={(e) => { e.preventDefault(); cancelLink(); }} className="p-1 bg-slate-200 text-slate-500 rounded hover:bg-slate-300" title="Abbrechen"><X size={14} /></button>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-1 p-1 rounded-lg w-fit border border-slate-200 bg-white shadow-sm mb-2 z-20 relative select-none">
            <button 
                onMouseDown={(e) => {e.preventDefault(); handleAction('<b>', '</b>', 'bold')}} 
                disabled={isLinkActive}
                className={`p-1.5 rounded transition-colors ${!isLinkActive && activeFormats.bold ? 'bg-f1-pink text-white shadow-sm' : 'text-slate-500'} ${isLinkActive ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 hover:text-f1-pink'}`}
                title="Bold (Ctrl+B)"
            >
                <Bold size={14} />
            </button>
            <button 
                onMouseDown={(e) => {e.preventDefault(); handleAction('<i>', '</i>', 'italic')}} 
                disabled={isLinkActive}
                className={`p-1.5 rounded transition-colors ${!isLinkActive && activeFormats.italic ? 'bg-f1-pink text-white shadow-sm' : 'text-slate-500'} ${isLinkActive ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 hover:text-f1-pink'}`}
                title="Italic (Ctrl+I)"
            >
                <Italic size={14} />
            </button>
            <button 
                onMouseDown={(e) => {e.preventDefault(); handleAction('<u>', '</u>', 'underline')}} 
                disabled={isLinkActive}
                className={`p-1.5 rounded transition-colors ${!isLinkActive && activeFormats.underline ? 'bg-f1-pink text-white shadow-sm' : 'text-slate-500'} ${isLinkActive ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 hover:text-f1-pink'}`}
                title="Underline (Ctrl+U)"
            >
                <Underline size={14} />
            </button>
            <button 
                onMouseDown={(e) => {e.preventDefault(); handleAction('<s>', '</s>', 'strikeThrough')}} 
                disabled={isLinkActive}
                className={`p-1.5 rounded transition-colors ${!isLinkActive && activeFormats.strike ? 'bg-f1-pink text-white shadow-sm' : 'text-slate-500'} ${isLinkActive ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 hover:text-f1-pink'}`}
                title="Strikethrough"
            >
                <Strikethrough size={14} />
            </button>
            <button 
                onMouseDown={toggleHighlight} 
                disabled={isLinkActive}
                className={`p-1.5 rounded transition-colors ${!isLinkActive && activeFormats.highlight ? 'bg-f1-pink text-white shadow-sm' : 'text-slate-500'} ${isLinkActive ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 hover:text-f1-pink'}`}
                title="Highlight"
            >
                <Highlighter size={14} />
            </button>
            <button 
                onMouseDown={(e) => {e.preventDefault(); handleAction('<sup>', '</sup>', 'superscript')}} 
                disabled={isLinkActive}
                className={`p-1.5 rounded transition-colors ${!isLinkActive && activeFormats.superscript ? 'bg-f1-pink text-white shadow-sm' : 'text-slate-500'} ${isLinkActive ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 hover:text-f1-pink'}`}
                title="Superscript"
            >
                <Superscript size={14} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            {onTextAlignChange && (
                <>
                    <button onMouseDown={(e) => {e.preventDefault(); onTextAlignChange('left')}} className={`p-1.5 rounded transition-colors ${textAlign === 'left' ? 'bg-slate-100 text-f1-pink' : 'text-slate-500 hover:bg-slate-50'}`}><AlignLeft size={14} /></button>
                    <button onMouseDown={(e) => {e.preventDefault(); onTextAlignChange('center')}} className={`p-1.5 rounded transition-colors ${textAlign === 'center' ? 'bg-slate-100 text-f1-pink' : 'text-slate-500 hover:bg-slate-50'}`}><AlignCenter size={14} /></button>
                    <button onMouseDown={(e) => {e.preventDefault(); onTextAlignChange('right')}} className={`p-1.5 rounded transition-colors ${textAlign === 'right' ? 'bg-slate-100 text-f1-pink' : 'text-slate-500 hover:bg-slate-50'}`}><AlignRight size={14} /></button>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                </>
            )}
            <button 
                onMouseDown={startLink} 
                className={`p-1.5 rounded transition-colors ${activeFormats.link ? 'bg-f1-pink text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-f1-pink'}`} 
                title={activeFormats.link ? "Link bearbeiten" : "Link hinzufügen"}
            >
                <LinkIcon size={14} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            {onFontChange && currentFont && (
                <button onMouseDown={(e) => {e.preventDefault(); onFontChange(currentFont === 'display' ? 'sans' : 'display')}} className={`p-1.5 rounded transition-colors text-xs font-bold uppercase flex items-center ${currentFont === 'display' ? 'bg-slate-100 text-f1-pink' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <TypeIcon size={14} className="mr-1" /> {currentFont === 'display' ? 'Teko' : 'Inter'}
                </button>
            )}
            {onToggleViewMode && (
                <>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <button onMouseDown={(e) => { e.preventDefault(); onToggleViewMode(); }} className={`p-1.5 rounded flex items-center space-x-1 text-[10px] font-bold uppercase transition-colors ${isPreview ? 'bg-f1-pink text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} title={isPreview ? "Quellcode anzeigen" : "Visueller Editor"}>
                        {isPreview ? <Code size={14} /> : <Eye size={14} />}
                    </button>
                </>
            )}
        </div>
    );
};

export default RichTextToolbar;