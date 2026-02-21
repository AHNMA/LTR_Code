import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Post, ContentBlock, BlockType, BlockAttributes, PostSection, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, NavigationContext } from '../../contexts/NavigationContext';
import { BLOCK_SPACINGS } from '../../constants';
import { 
  X, Save, MoveUp, MoveDown, Trash2, 
  Monitor, Tablet, Smartphone, 
  Eye, RefreshCw, AlertCircle, Cloud, Undo2, Redo2, Image as ImageIcon, AlertTriangle, Camera,
  ChevronRight, ChevronLeft, Calendar, Clock, Facebook, Twitter, Linkedin, Copy, MessageSquare, Maximize,
  Edit3, ExternalLink, SlidersHorizontal
} from 'lucide-react';
import MediaLibrary from './MediaLibrary';
import FrontendBlockRenderer from '../article/BlockRenderer';
import { EditorContext } from './editor/EditorContext';
import { BlockRegistry, getBlockModule } from './BlockRegistry';
import AutoResizeTextarea from './editor/AutoResizeTextarea';
import BlockInserter from './editor/BlockInserter';
import EditorInspector from './editor/EditorInspector';

// Utility: Slugify
const slugify = (text: string) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           
        .replace(/[^\w\-]+/g, '')       
        .replace(/\-\-+/g, '-')         
        .replace(/^-+/, '')             
        .replace(/-+$/, '');            
};

const generateId = () => `block-${Math.random().toString(36).substr(2, 9)}`;

// --- DEVICE TOOLBAR COMPONENT ---
interface DeviceToolbarProps {
    activeDevice: 'mobile' | 'tablet' | 'desktop' | 'custom';
    previewWidth: number | '100%';
    onDeviceChange: (mode: 'mobile' | 'tablet' | 'desktop') => void;
    onWidthChange: (width: number) => void;
    theme?: 'light' | 'dark';
}

const DeviceToolbar: React.FC<DeviceToolbarProps> = ({ activeDevice, previewWidth, onDeviceChange, onWidthChange, theme = 'light' }) => {
    const isPreviewMode = theme === 'dark';
    
    // Container Styles
    const containerClass = isPreviewMode 
        ? "bg-white/10 border-white/10 shadow-none text-white" 
        : "bg-white border-slate-200 shadow-sm text-slate-600";
        
    // Button Styles
    const btnActive = isPreviewMode 
        ? "bg-f1-pink text-white shadow-glow" 
        : "bg-f1-pink text-white shadow-md";
        
    const btnInactive = isPreviewMode 
        ? "text-white/50 hover:text-white hover:bg-white/10" 
        : "text-slate-400 hover:text-slate-700 hover:bg-slate-100";
        
    const separatorClass = isPreviewMode ? "bg-white/20" : "bg-slate-200";
    
    const inputClass = isPreviewMode
        ? "bg-black/20 text-white border-white/10 placeholder:text-white/30 focus:ring-white/20 [color-scheme:dark]" 
        : "bg-slate-50 text-slate-900 border-slate-200 placeholder:text-slate-400 focus:ring-f1-pink/20 [color-scheme:light]";

    const unitTextClass = isPreviewMode ? "text-white/60" : "text-slate-400";

    return (
        <div className={`flex items-center p-1.5 rounded-xl border ${containerClass} transition-colors duration-300`}>
            <div className="flex items-center space-x-1">
                <button 
                    onClick={() => onDeviceChange('desktop')} 
                    className={`p-2 rounded-lg transition-all duration-200 ${activeDevice === 'desktop' ? btnActive : btnInactive}`} 
                    title="Desktop (100%)"
                >
                    <Monitor size={16}/>
                </button>
                <button 
                    onClick={() => onDeviceChange('tablet')} 
                    className={`p-2 rounded-lg transition-all duration-200 ${activeDevice === 'tablet' ? btnActive : btnInactive}`} 
                    title="Tablet (768px)"
                >
                    <Tablet size={16}/>
                </button>
                <button 
                    onClick={() => onDeviceChange('mobile')} 
                    className={`p-2 rounded-lg transition-all duration-200 ${activeDevice === 'mobile' ? btnActive : btnInactive}`} 
                    title="Mobile (375px)"
                >
                    <Smartphone size={16}/>
                </button>
            </div>
            
            <div className={`h-5 w-px mx-3 ${separatorClass}`}></div>
            
            <div className="flex items-center relative group">
                <div className="relative">
                    <input 
                        type="number" 
                        min="320" 
                        max="2560"
                        value={previewWidth === '100%' ? '' : previewWidth} 
                        placeholder="Auto"
                        onChange={(e) => onWidthChange(parseInt(e.target.value))}
                        className={`w-20 text-xs font-mono font-bold rounded-lg border py-1.5 px-3 text-center focus:outline-none focus:ring-2 transition-all ${inputClass}`}
                    />
                </div>
                <span className={`text-[10px] ml-2 font-bold uppercase tracking-wider select-none ${unitTextClass}`}>px</span>
            </div>
        </div>
    );
};

const BlockWrapper: React.FC<{ block: ContentBlock, index: number, isSelected: boolean }> = ({ block, index, isSelected }) => {
    const { setSelectedBlockId, moveBlock, removeBlock } = React.useContext(EditorContext)!;

    const module = getBlockModule(block.type);
    const EditorComponent = module ? module.Editor : null;

    const getSpacingClass = (type: string): string => {
        return BLOCK_SPACINGS[type] || 'my-4';
    };

    return (
        <div 
            onClick={(e) => { 
                e.stopPropagation(); 
                setSelectedBlockId(block.clientId); 
            }}
            className={`group relative transition-all duration-200 border-2 rounded-lg -mx-[10px] ${getSpacingClass(block.type)} ${isSelected ? 'border-f1-pink ring-4 ring-f1-pink/5 z-10' : 'border-transparent hover:border-white/10'}`}
        >
            {isSelected && (
                <div 
                    className="absolute -top-9 right-0 bg-white border border-slate-200 text-slate-600 p-1 rounded-lg flex items-center space-x-1 shadow-sm z-50"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); moveBlock(block.clientId, 'up'); }} 
                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                        title="Nach oben verschieben"
                    >
                        <MoveUp size={14}/>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); moveBlock(block.clientId, 'down'); }} 
                        className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                        title="Nach unten verschieben"
                    >
                        <MoveDown size={14}/>
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); removeBlock(block.clientId); }} 
                        className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-colors"
                        title="Block löschen"
                    >
                        <Trash2 size={14}/>
                    </button>
                </div>
            )}
            <div className="p-2 min-h-[40px]">
                {EditorComponent ? <EditorComponent block={block} /> : <div className="p-4 bg-slate-50 rounded border border-slate-200 text-center italic">Block type {block.type} not found</div>}
            </div>
        </div>
    );
};

const BlockList: React.FC<{ blocks: ContentBlock[] }> = ({ blocks }) => {
    const ctx = React.useContext(EditorContext);
    return (
        <div className="pb-20">
            {blocks.map((block, idx) => (
                <BlockWrapper 
                    key={block.clientId}
                    block={block} 
                    index={idx} 
                    isSelected={ctx?.selectedBlockId === block.clientId} 
                />
            ))}
        </div>
    );
};

interface ConfirmationModalProps {
    type: 'unsaved' | 'link';
    target?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const UnifiedConfirmationModal: React.FC<ConfirmationModalProps> = ({ type, target, onConfirm, onCancel }) => {
    const isUnsaved = type === 'unsaved';
    
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-f1-dark/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onCancel}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-slate-200 text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-50 text-f1-pink rounded-full flex items-center justify-center mx-auto mb-6">
                    {isUnsaved ? <AlertTriangle size={32} /> : <ExternalLink size={32} />}
                </div>
                
                <h3 className="text-xl font-display font-black uppercase italic text-slate-900 mb-2">
                    {isUnsaved ? 'Ungespeicherte Änderungen' : 'Externer Link'}
                </h3>
                
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                    {isUnsaved 
                        ? "Du hast Änderungen am Artikel vorgenommen, die noch nicht gesichert wurden. Möchtest du den Editor wirklich verlassen?" 
                        : "Du befindest dich im Vorschau-Modus. Möchtest du den Editor verlassen, um diesem Link zu folgen?"}
                    {!isUnsaved && target && <br/>}
                    {!isUnsaved && target && <span className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-400 mt-2 inline-block max-w-full truncate">{target}</span>}
                </p>
                
                <div className="flex space-x-3 justify-center">
                    <button 
                        onClick={onConfirm} 
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-colors"
                    >
                        {isUnsaved ? 'Schließen' : 'Öffnen'}
                    </button>
                    <button 
                        onClick={onCancel} 
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold uppercase text-xs tracking-widest transition-colors"
                    >
                        Abbrechen
                    </button>
                </div>
            </div>
        </div>
    );
};

interface EditorSnapshot {
    blocks: ContentBlock[];
    metadata: Partial<Post>;
}

interface ModalConfig {
    isOpen: boolean;
    type: 'unsaved' | 'link';
    action: () => void;
    targetUrl?: string;
}

const PostEditor: React.FC<{ post?: Post, onSave: (post: Post) => void, onCancel: () => void }> = ({ post, onSave, onCancel }) => {
    const { users, currentUser } = useAuth();
    const realNavigation = useNavigation();
    
    const [blocks, setBlocks] = useState<ContentBlock[]>([]);
    const [metadata, setMetadata] = useState<Partial<Post>>({});
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [mediaPickerTarget, setMediaPickerTarget] = useState<{ clientId: string, isCollection?: boolean } | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const [activeDevice, setActiveDevice] = useState<'mobile' | 'tablet' | 'desktop' | 'custom'>('desktop');
    const [previewWidth, setPreviewWidth] = useState<number | '100%'>('100%');

    const handleDeviceChange = (mode: 'mobile' | 'tablet' | 'desktop') => {
        setActiveDevice(mode);
        if (mode === 'mobile') setPreviewWidth(375);
        if (mode === 'tablet') setPreviewWidth(768);
        if (mode === 'desktop') setPreviewWidth('100%');
    };

    const handleWidthChange = (width: number) => {
        if (!isNaN(width) && width > 0) {
            setPreviewWidth(width);
            setActiveDevice('custom');
        } else if (isNaN(width)) {
            setPreviewWidth('100%');
            setActiveDevice('desktop');
        }
    };

    const [modalConfig, setModalConfig] = useState<ModalConfig>({
        isOpen: false,
        type: 'unsaved',
        action: () => {}
    });

    const [past, setPast] = useState<EditorSnapshot[]>([]);
    const [future, setFuture] = useState<EditorSnapshot[]>([]);

    const eligibleAuthors = users.filter(u => ['admin', 'editor', 'it', 'author'].includes(u.role));
    const getAuthorName = (u: User) => (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` : u.username;

    useEffect(() => {
        if (post) {
            const cleanMetadata = { ...post };
            if (!Array.isArray(cleanMetadata.section)) {
                cleanMetadata.section = [cleanMetadata.section as any];
            }
            if (!cleanMetadata.layoutOptions) {
                cleanMetadata.layoutOptions = { showLatestNews: true, showNextRace: true, enableComments: true };
            } else if (cleanMetadata.layoutOptions.enableComments === undefined) {
                cleanMetadata.layoutOptions.enableComments = true;
            }
            setMetadata(cleanMetadata);
            setBlocks(post.blocks || []);
        } else {
            const defaultAuthorName = currentUser ? getAuthorName(currentUser) : 'Redaktion';
            const defaultAuthorId = currentUser ? currentUser.id : undefined;
            setMetadata({ 
                title: '', excerpt: '', slug: '', author: defaultAuthorName, authorId: defaultAuthorId,
                section: ['feed'], tags: ['F1'], readTime: '3 min', status: 'draft',
                layoutOptions: { showLatestNews: true, showNextRace: true, enableComments: true }
            });
            const defaultModule = BlockRegistry['custom/paragraph'];
            if (defaultModule) {
                setBlocks([{ clientId: generateId(), type: 'custom/paragraph', attributes: { ...defaultModule.defaultAttributes }, innerBlocks: [] }]);
            }
        }
        setHasUnsavedChanges(false);
        setPast([]);
        setFuture([]);
    }, [post]); 

    const takeSnapshot = useCallback(() => {
        setPast(prev => {
            const newSnapshot: EditorSnapshot = {
                blocks: JSON.parse(JSON.stringify(blocks)),
                metadata: { ...metadata }
            };
            return [...prev.slice(-49), newSnapshot];
        });
        setFuture([]);
    }, [blocks, metadata]);

    const handleUndo = useCallback(() => {
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        setFuture(prev => [
            { blocks: JSON.parse(JSON.stringify(blocks)), metadata: { ...metadata } },
            ...prev.slice(0, 49)
        ]);
        setBlocks(previous.blocks);
        setMetadata(previous.metadata);
        setPast(newPast);
        setHasUnsavedChanges(true);
    }, [past, blocks, metadata]);

    const handleRedo = useCallback(() => {
        if (future.length === 0) return;
        const next = future[0];
        const newFuture = future.slice(1);
        setPast(prev => [
            ...prev,
            { blocks: JSON.parse(JSON.stringify(blocks)), metadata: { ...metadata } }
        ]);
        setBlocks(next.blocks);
        setMetadata(next.metadata);
        setFuture(newFuture);
        setHasUnsavedChanges(true);
    }, [future, blocks, metadata]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isZ = e.key.toLowerCase() === 'z';
            const isY = e.key.toLowerCase() === 'y';
            const isCtrl = e.ctrlKey || e.metaKey;
            const isShift = e.shiftKey;
            if (isCtrl && isZ) {
                e.preventDefault();
                if (isShift) handleRedo();
                else handleUndo();
            } else if (isCtrl && isY) {
                e.preventDefault();
                handleRedo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    const handleClose = () => {
        if (hasUnsavedChanges) {
            setModalConfig({
                isOpen: true,
                type: 'unsaved',
                action: onCancel
            });
        } else {
            onCancel();
        }
    };

    const handleSave = () => {
        const finalSlug = metadata.slug || slugify(metadata.title || '');
        onSave({ ...metadata as Post, slug: finalSlug, blocks });
        setHasUnsavedChanges(false);
    };

    const handleMetadataChange = (key: keyof Post, value: any) => {
        takeSnapshot();
        setMetadata(prev => ({ ...prev, [key]: value }));
        setHasUnsavedChanges(true);
    };

    const handleTitleChange = (val: string) => {
        if (!hasUnsavedChanges) takeSnapshot();
        setMetadata(prev => {
            const isNewOrEmptySlug = !prev.slug || (prev.slug === slugify(prev.title || ''));
            return { ...prev, title: val, slug: isNewOrEmptySlug ? slugify(val) : prev.slug };
        });
        setHasUnsavedChanges(true);
    };

    const handlePreviewClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        if (link) {
            e.preventDefault();
            e.stopPropagation();
            const href = link.getAttribute('href');
            if (href) {
                setModalConfig({
                    isOpen: true,
                    type: 'link',
                    targetUrl: href,
                    action: () => window.open(href, '_blank')
                });
            }
        }
    };

    const handleInternalNav = (action: () => void, targetName: string) => {
        setModalConfig({
            isOpen: true,
            type: 'link',
            targetUrl: `Interner Link: ${targetName}`,
            action: action
        });
    };

    const previewNavigationContext = {
        ...realNavigation,
        goToDriver: (id: string) => handleInternalNav(() => {}, "Fahrer-Profil"),
        goToTeam: (id: string) => handleInternalNav(() => {}, "Team-Profil"),
        goToArticle: (id: string) => handleInternalNav(() => {}, "Artikel"),
        goToStandings: () => handleInternalNav(() => {}, "WM-Stand"),
        goToCalendar: () => handleInternalNav(() => {}, "Kalender"),
        goToHome: () => handleInternalNav(() => {}, "Startseite"),
    };

    const findBlock = useCallback((tree: ContentBlock[], clientId: string): { block: ContentBlock, parentList: ContentBlock[], index: number } | null => {
        for (let i = 0; i < tree.length; i++) {
            if (tree[i].clientId === clientId) return { block: tree[i], parentList: tree, index: i };
            const found = findBlock(tree[i].innerBlocks || [], clientId);
            if (found) return found;
        }
        return null;
    }, []);

    const getBlock = useCallback((clientId: string) => {
        const result = findBlock(blocks, clientId);
        return result?.block;
    }, [blocks, findBlock]);

    const updateBlock = (clientId: string, attributes: Partial<BlockAttributes>) => {
        takeSnapshot();
        setBlocks(prev => {
            const next = JSON.parse(JSON.stringify(prev));
            const target = findBlock(next, clientId);
            if (target) target.block.attributes = { ...target.block.attributes, ...attributes };
            return next;
        });
        setHasUnsavedChanges(true);
    };

    const removeBlock = (clientId: string) => {
        takeSnapshot();
        setBlocks(prev => {
            const next = JSON.parse(JSON.stringify(prev));
            const target = findBlock(next, clientId);
            if (target) target.parentList.splice(target.index, 1);
            return next;
        });
        if (selectedBlockId === clientId) setSelectedBlockId(null);
        setHasUnsavedChanges(true);
    };

    const insertBlock = (type: BlockType, atIndex?: number) => {
        takeSnapshot();
        const module = BlockRegistry[type];
        const defaultAttrs = module ? module.defaultAttributes : {};
        const newBlock: ContentBlock = { clientId: generateId(), type, attributes: { ...defaultAttrs }, innerBlocks: [] };
        
        setBlocks(prev => {
            const next = JSON.parse(JSON.stringify(prev));
            if (typeof atIndex === 'number') {
                next.splice(atIndex, 0, newBlock);
            } else if (selectedBlockId) {
                const current = findBlock(next, selectedBlockId);
                if (current) current.parentList.splice(current.index + 1, 0, newBlock);
                else next.push(newBlock);
            } else {
                next.push(newBlock);
            }
            return next;
        });
        setSelectedBlockId(newBlock.clientId);
        setHasUnsavedChanges(true);
    };

    const moveBlock = (clientId: string, direction: 'up' | 'down') => {
        takeSnapshot();
        setBlocks(prev => {
            const next = JSON.parse(JSON.stringify(prev));
            const target = findBlock(next, clientId);
            if (!target) return prev;
            const newIndex = direction === 'up' ? target.index - 1 : target.index + 1;
            if (newIndex < 0 || newIndex >= target.parentList.length) return prev;
            [target.parentList[target.index], target.parentList[newIndex]] = [target.parentList[newIndex], target.parentList[target.index]];
            return next;
        });
        setHasUnsavedChanges(true);
    };

    const selectedBlock = findBlock(blocks, selectedBlockId || '')?.block;
    const showLatestNews = metadata.layoutOptions?.showLatestNews !== false;
    const showNextRace = metadata.layoutOptions?.showNextRace !== false;
    const enableComments = metadata.layoutOptions?.enableComments !== false;
    const showRightSidebar = showLatestNews || showNextRace;
    const sections = Array.isArray(metadata.section) ? metadata.section : [metadata.section || 'feed'];

    return (
        <EditorContext.Provider value={{ selectedBlockId, setSelectedBlockId, updateBlock, removeBlock, moveBlock, insertBlock, setMediaPickerTarget, getBlock }}>
            <div className="fixed inset-0 bg-white z-[60] flex flex-col font-sans text-slate-900 overflow-hidden">
                
                {modalConfig.isOpen && (
                    <UnifiedConfirmationModal 
                        type={modalConfig.type} 
                        target={modalConfig.targetUrl}
                        onConfirm={() => {
                            setModalConfig({ ...modalConfig, isOpen: false });
                            modalConfig.action();
                        }}
                        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
                    />
                )}

                {showPreview && (
                    <NavigationContext.Provider value={previewNavigationContext}>
                        <div className="fixed inset-0 z-[100] bg-neutral-950 text-slate-300 overflow-hidden animate-in fade-in duration-200 flex flex-col">
                            <header className="h-14 border-b border-white/10 bg-neutral-900/90 backdrop-blur-md shrink-0 z-50 relative">
                                <div className="flex items-center justify-between px-4 h-full w-full">
                                    <div className="flex items-center space-x-1">
                                        <button onClick={() => setShowPreview(false)} className="flex items-center px-3 py-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors mr-2 text-[10px] font-bold uppercase tracking-wider" title="Zurück zum Editor">
                                            <ChevronLeft size={14} className="mr-1" /> Zurück zum Editor
                                        </button>
                                        <div className="w-px h-6 bg-white/10 mx-1"></div>
                                        <button onClick={handleUndo} disabled={past.length === 0} className={`p-2 rounded-lg transition-all flex items-center justify-center ${past.length === 0 ? 'text-white/10 cursor-not-allowed' : 'text-slate-400 hover:bg-white/10 hover:text-f1-pink'}`} title="Rückgängig (Ctrl+Z)"><Undo2 size={20} /></button>
                                        <button onClick={handleRedo} disabled={future.length === 0} className={`p-2 rounded-lg transition-all flex items-center justify-center ${future.length === 0 ? 'text-white/10 cursor-not-allowed' : 'text-slate-400 hover:bg-white/10 hover:text-f1-pink'}`} title="Wiederherstellen (Ctrl+Y)"><Redo2 size={20} /></button>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        {hasUnsavedChanges ? <div className="flex items-center text-amber-500 animate-pulse text-[10px] font-bold uppercase tracking-widest"><AlertCircle size={14} className="mr-1.5" /> Ungespeichert</div> : <div className="flex items-center text-slate-500 text-[10px] font-bold uppercase tracking-widest"><Cloud size={14} className="mr-1.5" /> Gespeichert</div>}
                                        <button onClick={handleSave} className="bg-f1-pink text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-pink-700 transition-all flex items-center shadow-glow"><Save size={16} className="mr-2" /> Speichern</button>
                                    </div>
                                </div>
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center"><div className="pointer-events-auto"><DeviceToolbar activeDevice={activeDevice} previewWidth={previewWidth} onDeviceChange={handleDeviceChange} onWidthChange={handleWidthChange} theme="dark" /></div></div>
                            </header>

                            <div className="flex-1 overflow-y-auto overflow-x-auto flex justify-center py-8">
                                <div className={`transition-all duration-300 bg-f1-dark shadow-2xl relative shrink-0 border border-white/10 @container ${activeDevice !== 'desktop' ? 'overflow-hidden' : ''}`} style={{ width: previewWidth === '100%' ? '100%' : `${previewWidth}px`, maxWidth: previewWidth === '100%' ? '100%' : 'none', minHeight: '100%', height: 'fit-content', borderRadius: activeDevice === 'mobile' ? '40px' : activeDevice === 'tablet' ? '12px' : '0', borderWidth: activeDevice === 'mobile' ? '8px' : activeDevice === 'tablet' ? '4px' : '0', borderColor: activeDevice !== 'desktop' ? '#262626' : 'transparent' }}>
                                    <article className="bg-f1-dark min-h-full pb-20 font-sans" onClickCapture={handlePreviewClick}>
                                        <div className="container mx-auto px-4 py-4 flex items-center text-xs text-slate-500 uppercase font-bold tracking-wider">
                                            <span className="text-slate-400">Home</span>
                                            <ChevronRight size={12} className="mx-2 shrink-0" />
                                            <span className="text-f1-pink">News</span>
                                            <ChevronRight size={12} className="mx-2 shrink-0" />
                                            <span className="flex-1 min-w-0 truncate text-white">{metadata.title || 'Vorschau'}</span>
                                        </div>

                                        <header className="container mx-auto px-4 lg:max-w-4xl xl:max-w-5xl text-center mb-8 flex flex-col items-center">
                                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                                {sections.map(sec => (
                                                    <span key={sec} className="bg-f1-pink text-white px-2 py-0.5 sm:px-3 sm:py-1 text-[7px] sm:text-[10px] font-bold uppercase tracking-widest rounded shadow-glow">{sec}</span>
                                                ))}
                                            </div>
                                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.1] px-6 mb-8 uppercase tracking-tighter italic break-words w-full text-center">
                                                {metadata.title}
                                            </h1>
                                            <div className="flex flex-wrap justify-center items-center gap-6 text-[10px] text-slate-500 border-y border-white/5 py-6 mb-8 uppercase font-bold tracking-widest w-full">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden mr-3 border border-white/10">
                                                        <img src={`https://ui-avatars.com/api/?name=${metadata.author}&background=random`} alt={metadata.author} />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-slate-500">Written by</div>
                                                        <div className="text-white text-xs">{metadata.author}</div>
                                                    </div>
                                                </div>
                                                <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                                                <div className="flex items-center space-x-6">
                                                    <div className="flex items-center"><Calendar size={14} className="mr-2 text-f1-pink" /><span>{metadata.date}</span></div>
                                                    {metadata.isUpdated && (
                                                        <div className="flex items-center text-f1-pink"><RefreshCw size={14} className="mr-1.5" /> Updated</div>
                                                    )}
                                                    <div className="flex items-center"><Clock size={14} className="mr-2 text-f1-pink" /><span>{metadata.readTime}</span></div>
                                                </div>
                                            </div>
                                        </header>

                                        <div className="container mx-auto px-0 md:px-4 lg:max-w-6xl mb-12">
                                            <div className="relative aspect-video md:rounded-2xl overflow-hidden shadow-2xl group bg-f1-card border border-white/5">
                                                {metadata.image && <img src={metadata.image} className="w-full h-full object-cover" />}
                                                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-f1-dark via-black/40 to-transparent p-6 md:p-8 pt-20 z-10 flex flex-col justify-end items-start">
                                                    <div className="flex flex-col space-y-2 w-full max-w-2xl">
                                                        {metadata.heroCredits && (<div className="flex items-center space-x-2"><Camera size={12} className="text-f1-pink" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 font-sans">{metadata.heroCredits}</span></div>)}
                                                        {metadata.heroCaption && (<div className="text-2xl font-bold text-white leading-none italic font-display uppercase tracking-tight">{metadata.heroCaption}</div>)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`container mx-auto px-4 lg:max-w-6xl flex flex-col ${previewWidth === '100%' || (typeof previewWidth === 'number' && previewWidth >= 1024) ? 'lg:flex-row' : ''} gap-12`}>
                                            {(previewWidth === '100%' || (typeof previewWidth === 'number' && previewWidth >= 1024)) && (
                                                <aside className="hidden lg:flex flex-col w-20 sticky top-32 h-fit items-center space-y-6 pt-12">
                                                    <div className="text-[10px] font-bold uppercase -rotate-90 mb-10 text-slate-600 tracking-widest whitespace-nowrap">Share Article</div>
                                                    <button className="p-3 rounded-full bg-white/5 text-slate-400 hover:text-white transition-all shadow-sm border border-white/5"><Facebook size={20} /></button>
                                                    <button className="p-3 rounded-full bg-white/5 text-slate-400 hover:text-white transition-all shadow-sm border border-white/5"><Twitter size={20} /></button>
                                                    <button className="p-3 rounded-full bg-white/5 text-slate-400 hover:text-white transition-all shadow-sm border border-white/5"><Copy size={20} /></button>
                                                    <div className="w-px h-20 bg-white/5 my-4"></div>
                                                    <div className="flex flex-col items-center"><MessageSquare size={20} className="text-f1-pink mb-1" /><span className="text-xs font-bold text-white">{metadata.commentCount || 0}</span></div>
                                                </aside>
                                            )}
                                            <div className="flex-1 max-w-3xl mx-auto w-full">
                                                {metadata.excerpt && (<div className="text-xl md:text-2xl font-serif italic leading-relaxed text-slate-200 mb-10 border-b border-white/5 pb-10 first-letter:text-6xl first-letter:font-black first-letter:text-f1-pink first-letter:mr-3 first-letter:float-left first-letter:leading-none">{metadata.excerpt}</div>)}
                                                <div className="article-body">{blocks.map(block => <FrontendBlockRenderer key={block.clientId} block={block} />)}</div>
                                                <div className="mt-16 pt-8 border-t border-white/5">
                                                    <h4 className="text-[10px] font-bold uppercase text-slate-600 mb-6 tracking-widest">Related Topics</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(metadata.tags || ['Placeholder']).map(tag => (<button key={tag} className="px-3 py-1 sm:px-4 sm:py-2 bg-white/5 text-slate-400 rounded-lg text-[9px] sm:text-xs font-bold uppercase tracking-wider hover:bg-f1-pink hover:text-white transition-colors border border-white/5">#{tag}</button>))}
                                                    </div>
                                                </div>
                                                <div className="mt-12 bg-f1-card p-8 rounded-2xl flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 select-none pointer-events-none grayscale border border-white/5"><div className="w-20 h-20 rounded-full overflow-hidden border-4 border-f1-dark shadow-md flex-shrink-0 bg-slate-700"></div><div><div className="text-xs font-bold uppercase text-f1-pink tracking-widest mb-1">About the Author</div><h3 className="text-xl font-display font-bold text-white mb-2">{metadata.author}</h3><p className="text-sm text-slate-400 leading-relaxed">Senior Formula 1 Editor covering the paddock since 2018...</p></div></div>
                                                {enableComments && (<div className="mt-12 p-8 border border-white/10 bg-f1-card rounded-2xl text-center select-none pointer-events-none"><MessageSquare size={32} className={`mx-auto mb-4 ${enableComments ? 'text-f1-pink' : 'text-slate-600'}`} /><h3 className="text-xl font-display font-bold text-white">Join the Conversation</h3><p className="text-slate-400 mb-6 text-sm">Be the first to comment on this story.</p><button className="bg-f1-pink text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest">Write a Comment</button></div>)}
                                            </div>
                                            {showRightSidebar && (
                                                <aside className={`w-72 shrink-0 ${(previewWidth === '100%' || (typeof previewWidth === 'number' && previewWidth >= 1280)) ? 'hidden xl:block' : 'hidden'}`}><div className="sticky top-24">{showLatestNews && (<><div className="flex items-center mb-6"><div className="w-1 h-4 bg-f1-pink rounded-full mr-3"></div><h3 className="text-sm font-bold uppercase tracking-widest text-white">Latest News</h3></div><div className="space-y-6">{[1,2,3].map(i => (<div key={i} className="group cursor-pointer"><div className="text-[10px] text-slate-400 mb-1 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-f1-pink mr-2"></span>{i * 15} MIN AGO</div><h4 className="text-sm font-bold text-slate-200 leading-snug group-hover:text-f1-pink transition-colors">Toto Wolff warns about 2026 regulations loopholes</h4></div>))}</div></>)}{showNextRace && (<div className="mt-12 p-6 bg-f1-card border border-white/10 rounded-xl text-white text-center relative overflow-hidden"><div className="relative z-10"><div className="text-xs font-bold text-f1-pink uppercase tracking-widest mb-2">Next Race</div><div className="text-2xl font-display font-bold mb-1">Bahrain GP</div><div className="text-sm text-slate-400">11.02.2026</div><button className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-bold uppercase transition-colors">Race Center</button></div></div>)}</div></aside>
                                            )}
                                        </div>
                                    </article>
                                </div>
                            </div>
                        </div>
                    </NavigationContext.Provider>
                )}

                {mediaPickerTarget && (
                    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-8"><div className="bg-white w-full max-w-5xl h-full rounded-2xl overflow-hidden shadow-2xl"><MediaLibrary onSelect={(item) => { if (mediaPickerTarget.clientId === 'post_image') handleMetadataChange('image', item.url); else if (mediaPickerTarget.isCollection) { const current = selectedBlock?.attributes?.images || []; const newImage = { id: generateId(), url: item.url, credit: '', alt: '', crop: true, align: 'center' }; updateBlock(mediaPickerTarget.clientId, { images: [...current, newImage] }); } else updateBlock(mediaPickerTarget.clientId, { url: item.url }); setMediaPickerTarget(null); }} onClose={() => setMediaPickerTarget(null)} /></div></div>
                )}

                <EditorInspector metadata={metadata} onMetadataChange={handleMetadataChange} />

                <header className="h-14 border-b border-slate-200 bg-white shrink-0 z-[70] relative">
                    <div className="flex items-center justify-between px-4 h-full w-full">
                        <div className="flex items-center space-x-1">
                            <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors mr-2" title="Schließen"><X size={20} /></button>
                            <div className="w-px h-6 bg-slate-200 mx-1"></div>
                            <button onClick={handleUndo} disabled={past.length === 0} className={`p-2 rounded-lg transition-all flex items-center justify-center ${past.length === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 hover:text-f1-pink'}`} title="Rückgängig (Ctrl+Z)"><Undo2 size={20} /></button>
                            <button onClick={handleRedo} disabled={future.length === 0} className={`p-2 rounded-lg transition-all flex items-center justify-center ${future.length === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 hover:text-f1-pink'}`} title="Wiederherstellen (Ctrl+Y)"><Redo2 size={20} /></button>
                        </div>
                        <div className="flex items-center space-x-4">
                            {hasUnsavedChanges ? <div className="flex items-center text-amber-500 animate-pulse text-[10px] font-bold uppercase tracking-widest"><AlertCircle size={14} className="mr-1.5" /> Ungespeichert</div> : <div className="flex items-center text-slate-300 text-[10px] font-bold uppercase tracking-widest"><Cloud size={14} className="mr-1.5" /> Gespeichert</div>}
                            <button onClick={() => setShowPreview(true)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center"><Eye size={16} className="mr-2" /> Vorschau</button>
                            <button onClick={handleSave} className="bg-f1-pink text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-pink-700 transition-all flex items-center shadow-glow"><Save size={16} className="mr-2" /> Speichern</button>
                        </div>
                    </div>
                    <div className="absolute inset-0 pointer-events-none flex items-center lg:pr-80"><div className="transition-all duration-300 shrink-0 w-80"></div><div className="flex-1 flex justify-center pointer-events-auto"><DeviceToolbar activeDevice={activeDevice} previewWidth={previewWidth} onDeviceChange={handleDeviceChange} onWidthChange={handleWidthChange} /></div></div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    <BlockInserter />
                    <main onClick={() => setSelectedBlockId(null)} className="flex-1 overflow-y-auto bg-white pt-10 pb-40 custom-scrollbar transition-all duration-300 lg:mr-80">
                        <div onClick={(e) => { e.stopPropagation(); setSelectedBlockId(null); }} className="mx-auto transition-all duration-500 bg-f1-dark shadow-2xl border border-white/5 min-h-screen h-auto relative overflow-hidden @container" style={{ width: previewWidth === '100%' ? '100%' : `${previewWidth}px`, maxWidth: previewWidth === '100%' ? '1152px' : '100%', borderRadius: activeDevice === 'mobile' ? '40px 40px 0 0' : activeDevice === 'tablet' ? '12px 12px 0 0' : '16px 16px 0 0', borderWidth: activeDevice === 'mobile' ? '8px 8px 0 8px' : activeDevice === 'tablet' ? '4px 4px 0 4px' : '0', borderColor: activeDevice !== 'desktop' ? '#262626' : 'transparent' }}>
                            
                            <div className="container mx-auto px-4 py-4 flex items-center text-xs text-slate-500 uppercase font-bold tracking-wider mb-0 select-none cursor-default">
                                <span className="hover:text-f1-pink transition-colors shrink-0">Home</span>
                                <ChevronRight size={12} className="mx-2 shrink-0" />
                                <span className="text-f1-pink shrink-0">News</span>
                                <ChevronRight size={12} className="mx-2 shrink-0" />
                                <span className="flex-1 min-w-0 truncate text-slate-400 italic">
                                    {metadata.title || 'Neuer Artikel'}
                                </span>
                            </div>

                            <div className="py-8">
                                <header className="max-w-4xl xl:max-w-5xl mx-auto px-4 flex flex-col items-center mb-8">
                                    <div className="flex justify-center gap-2 mb-6 flex-wrap">
                                        {sections.map((sec, i) => (
                                            <span key={i} className="bg-f1-pink text-white px-2 py-0.5 sm:px-3 sm:py-1 text-[7px] sm:text-[10px] font-bold uppercase tracking-widest rounded shadow-glow cursor-default">{sec}</span>
                                        ))}
                                    </div>
                                    <div className="w-full flex justify-center">
                                        <AutoResizeTextarea 
                                            value={metadata.title || ''} 
                                            onChange={(e: any) => handleTitleChange(e.target.value)} 
                                            placeholder="TITEL HIER EINGEBEN..." 
                                            className="w-full text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.1] px-6 mb-8 uppercase tracking-tighter italic placeholder:text-white/20 focus:outline-none border-none bg-transparent text-center resize-none flex items-center justify-center" 
                                        />
                                    </div>
                                    <div className="flex flex-wrap justify-center items-center gap-6 text-[10px] text-slate-500 border-y border-white/5 py-6 mb-8 uppercase font-bold tracking-widest w-full">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden mr-3">
                                                <img src={`https://ui-avatars.com/api/?name=${metadata.author}&background=random`} alt={metadata.author} className="w-full h-full object-cover"/>
                                            </div>
                                            <div className="text-left">
                                                <div className="text-slate-500">Written by</div>
                                                <div className="text-white text-xs">{metadata.author}</div>
                                            </div>
                                        </div>
                                        <div className="w-px h-8 bg-white/5 hidden sm:block"></div>
                                        <div className="flex items-center space-x-6">
                                            <div className="flex items-center"><Calendar size={14} className="mr-2 text-f1-pink" /><span>{metadata.date || 'Heute'}</span></div>
                                            {metadata.isUpdated && (<div className="flex items-center text-f1-pink font-bold"><RefreshCw size={14} className="mr-1.5" />Updated</div>)}
                                            <div className="flex items-center"><Clock size={14} className="mr-2 text-f1-pink" /><span>{metadata.readTime || '3 min'}</span></div>
                                        </div>
                                    </div>
                                </header>

                                <div className={`max-w-6xl mx-auto mb-12 ${activeDevice === 'mobile' ? 'px-0' : 'px-0 md:px-4'}`}>
                                    <div className="group relative">
                                        {metadata.image ? (
                                            <div className={`relative w-full aspect-video overflow-hidden shadow-2xl transition-all border border-white/5 group bg-f1-card ${activeDevice === 'mobile' ? '' : 'md:rounded-2xl'}`}>
                                                <img src={metadata.image} className="w-full h-full object-cover opacity-95" alt="Cover" />
                                                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"><button onClick={() => setMediaPickerTarget({ clientId: 'post_image' })} className="bg-white/90 backdrop-blur text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white shadow-sm transition-colors">Bild ändern</button><button onClick={() => handleMetadataChange('image', '')} className="bg-red-500/90 backdrop-blur text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 shadow-sm transition-colors">Entfernen</button></div>
                                                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 md:p-8 pt-20 z-10 flex justify-between items-end">
                                                    <div className="flex flex-col space-y-2 w-full max-w-2xl"><div className="flex items-center space-x-2"><Camera size={12} className="text-f1-pink" /><input value={metadata.heroCredits || ''} onChange={(e) => handleMetadataChange('heroCredits', e.target.value)} className="bg-transparent border-none focus:outline-none text-[10px] font-black uppercase tracking-[0.2em] text-white/70 placeholder:text-white/20 w-full font-sans" placeholder="CREDITS..." /></div><AutoResizeTextarea value={metadata.heroCaption || ''} onChange={(e) => handleMetadataChange('heroCaption', e.target.value)} className="w-full bg-transparent border-none focus:outline-none text-2xl font-bold text-white placeholder:text-white/10 leading-none italic resize-none font-display" placeholder="BILDBESCHREIBUNG..." /></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => setMediaPickerTarget({ clientId: 'post_image' })} className="w-full aspect-video rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center text-slate-400 hover:text-f1-pink hover:border-f1-pink/50 transition-all group/btn"><ImageIcon size={48} className="mb-2 opacity-20 group-hover/btn:scale-110 transition-transform" /><span className="text-xs font-bold uppercase tracking-widest">Titelbild hinzufügen</span></button>
                                        )}
                                    </div>
                                </div>

                                <div className={`container mx-auto px-4 lg:max-w-6xl flex flex-col gap-12 ${(previewWidth === '100%' || (typeof previewWidth === 'number' && previewWidth >= 1024)) ? 'lg:flex-row' : ''}`}>
                                    <aside className={`flex-col w-20 sticky top-32 h-fit items-center space-y-6 pt-12 opacity-60 pointer-events-none select-none ${(previewWidth === '100%' || (typeof previewWidth === 'number' && previewWidth >= 1024)) ? 'hidden lg:flex' : 'hidden'}`}><div className="text-[10px] font-bold uppercase -rotate-90 mb-10 text-slate-400 tracking-widest whitespace-nowrap">Share Article</div><button className="p-3 rounded-full bg-white/5 text-slate-400 shadow-sm border border-white/5"><Facebook size={20} /></button><button className="p-3 rounded-full bg-white/5 text-slate-400 shadow-sm border border-white/5"><Twitter size={20} /></button><button className="p-3 rounded-full bg-white/5 text-slate-400 shadow-sm border border-white/5"><Linkedin size={20} /></button><button className="p-3 rounded-full bg-white/5 text-slate-400 shadow-sm border border-white/5"><Copy size={20} /></button><div className="w-px h-20 bg-white/10 my-4"></div><div className="flex flex-col items-center"><MessageSquare size={20} className="text-f1-pink mb-1" /><span className="text-xs font-bold text-white">{metadata.commentCount || 0}</span></div></aside>
                                    <div className="flex-1 max-w-3xl mx-auto w-full">
                                        <AutoResizeTextarea value={metadata.excerpt || ''} onChange={(e) => handleMetadataChange('excerpt', e.target.value)} placeholder="Lead / Einleitungstext schreiben..." className="w-full text-xl md:text-2xl font-serif leading-relaxed text-slate-300 mb-10 border-b border-white/10 pb-10 focus:outline-none border-none bg-transparent placeholder:text-white/20 resize-none first-letter:text-5xl first-letter:font-bold first-letter:text-f1-pink first-letter:mr-2 first-letter:float-left" />
                                        <BlockList blocks={blocks} />
                                        <div className="mt-16 pt-8 border-t border-white/10 opacity-50 select-none pointer-events-none grayscale">
                                            <h4 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-widest">Related Topics</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {(metadata.tags || ['Placeholder']).map(tag => (<button key={tag} className="px-3 py-1 sm:px-4 sm:py-2 bg-white/5 text-slate-400 rounded-lg text-[9px] sm:text-xs font-bold uppercase tracking-wider border border-white/5">#{tag}</button>))}
                                            </div>
                                        </div>
                                        <div className="mt-12 bg-white/5 p-8 rounded-2xl flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 opacity-60 select-none pointer-events-none grayscale border border-white/5"><div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-700 shadow-md flex-shrink-0 bg-slate-800"></div><div><div className="text-xs font-bold uppercase text-f1-pink tracking-widest mb-1">About the Author</div><h3 className="text-xl font-display font-bold text-white mb-2">{metadata.author}</h3><p className="text-sm text-slate-400 leading-relaxed">Senior Formula 1 Editor covering the paddock since 2018...</p></div></div>
                                        <div className={`mt-12 p-8 border rounded-2xl text-center transition-all duration-300 ${enableComments ? 'border-white/10 bg-white/5' : 'border-dashed border-white/10 bg-transparent opacity-40 grayscale'}`}><MessageSquare size={32} className={`mx-auto mb-4 ${enableComments ? 'text-f1-pink' : 'text-slate-500'}`} /><h3 className={`text-xl font-display font-bold ${enableComments ? 'text-white' : 'text-slate-500'}`}>{enableComments ? 'Kommentar-Sektion: Aktiv' : 'Kommentar-Sektion: Deaktiviert'}</h3><p className="text-slate-400 mb-6 text-sm">{enableComments ? 'Besucher können unter diesem Artikel kommentieren.' : 'Die Kommentar-Funktion ist für diesen Artikel ausgeschaltet.'}</p>{enableComments && (<div className="bg-f1-pink text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest inline-block opacity-50 cursor-default">Kommentar schreiben (Vorschau)</div>)}</div>
                                    </div>
                                    {showRightSidebar && (
                                        <aside className={`shrink-0 opacity-60 pointer-events-none grayscale select-none w-72 ${(previewWidth === '100%' || (typeof previewWidth === 'number' && previewWidth >= 1280)) ? 'hidden xl:block' : 'hidden'}`}><div className="sticky top-24">{showLatestNews && (<><div className="flex items-center mb-6"><div className="w-1 h-4 bg-f1-pink rounded-full mr-3"></div><h3 className="text-sm font-bold uppercase tracking-widest text-white">Latest News</h3></div><div className="space-y-6">{[1,2,3].map(i => (<div key={i} className="group cursor-pointer"><div className="text-[10px] text-slate-400 mb-1 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-f1-pink mr-2"></span>{i * 15} MIN AGO</div><h4 className="text-sm font-bold text-slate-300 leading-snug group-hover:text-f1-pink transition-colors">Toto Wolff warns about 2026 regulations loopholes</h4></div>))}</div></>)}{showNextRace && (<div className="mt-12 p-6 bg-f1-card border border-white/10 rounded-xl text-white text-center relative overflow-hidden"><div className="relative z-10"><div className="text-xs font-bold text-f1-pink uppercase tracking-widest mb-2">Next Race</div><div className="text-2xl font-display font-bold mb-1">Bahrain GP</div><div className="text-sm text-slate-400">11.02.2026</div><button className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-bold uppercase transition-colors">Race Center</button></div></div>)}</div></aside>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </EditorContext.Provider>
    );
};

export default PostEditor;