import React, { useState, useEffect } from 'react';
import { 
    Settings, BoxSelect, Info, RefreshCw, CheckSquare, Square, 
    Trash2, User as UserIcon, Calendar, Clock, Image as ImageIcon, Layout, MessageSquare 
} from 'lucide-react';
import { Post, PostSection, User } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { useEditor } from './EditorContext';
import { getBlockModule } from '../BlockRegistry';

const SECTIONS: PostSection[] = ['highlight', 'aktuell', 'updated', 'trending', 'ausgewählt', 'feed'];

const slugify = (text: string) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')         
        .replace(/^-+/, '')             
        .replace(/-+$/, '');            
};

const InspectorPanel: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="border-b border-slate-100 pb-3 mb-3 last:border-0">
        <h4 className="flex items-center text-[10px] font-bold uppercase text-slate-400 mb-2.5 tracking-widest">
            <span className="p-1 bg-slate-100 rounded text-slate-400 mr-2">{icon}</span>
            {title}
        </h4>
        {children}
    </div>
);

interface EditorInspectorProps {
    metadata: Partial<Post>;
    onMetadataChange: (key: keyof Post, value: any) => void;
}

const EditorInspector: React.FC<EditorInspectorProps> = ({ metadata, onMetadataChange }) => {
    const { selectedBlockId, removeBlock } = useEditor();
    const { users, currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'settings' | 'block'>('settings');

    useEffect(() => {
        if (selectedBlockId) {
            setActiveTab('block');
        } else {
            setActiveTab('settings');
        }
    }, [selectedBlockId]);

    const eligibleAuthors = users.filter(u => ['admin', 'editor', 'it', 'author'].includes(u.role));
    const getAuthorName = (u: User) => (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` : u.username;
    
    const currentAuthorValue = metadata.authorId || eligibleAuthors.find(u => getAuthorName(u) === metadata.author)?.id || 'legacy';
    
    const { getBlock } = useEditor();
    const selectedBlock = selectedBlockId ? getBlock(selectedBlockId) : null;

    const handleAuthorSelect = (userId: string) => {
        if (userId === 'legacy') return;
        const user = users.find(u => u.id === userId);
        if (user) {
            onMetadataChange('author', getAuthorName(user));
            onMetadataChange('authorId', user.id);
        }
    };

    const toggleSection = (section: PostSection) => {
        const currentSections = Array.isArray(metadata.section) ? metadata.section : [metadata.section as any];
        let newSections: PostSection[];
        
        if (currentSections.includes(section)) {
            newSections = currentSections.filter(s => s !== section);
        } else {
            newSections = [...currentSections, section];
        }
        
        if (newSections.length === 0) newSections = ['feed'];
        onMetadataChange('section', newSections);
    };

    const updateLayoutOption = (key: 'showLatestNews' | 'showNextRace' | 'enableComments', val: boolean) => {
        const currentOptions = metadata.layoutOptions || {};
        onMetadataChange('layoutOptions', { ...currentOptions, [key]: val });
    };

    const showLatestNews = metadata.layoutOptions?.showLatestNews !== false;
    const showNextRace = metadata.layoutOptions?.showNextRace !== false;
    const enableComments = metadata.layoutOptions?.enableComments !== false;

    return (
        <aside className="hidden lg:flex flex-col fixed right-0 top-14 bottom-0 w-80 bg-white border-l border-slate-200 z-50 overflow-hidden">
            <div className="flex border-b border-slate-100 shrink-0">
                <button 
                    onClick={() => setActiveTab('settings')} 
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center transition-colors ${activeTab === 'settings' ? 'text-f1-pink border-b-2 border-f1-pink bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Settings size={14} className="mr-2" /> Settings
                </button>
                <button 
                    onClick={() => setActiveTab('block')} 
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center transition-colors ${activeTab === 'block' ? 'text-f1-pink border-b-2 border-f1-pink bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <BoxSelect size={14} className="mr-2" /> Block
                </button>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'settings' ? (
                    <div className="absolute inset-0 flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="flex-1 overflow-y-auto p-4 no-scrollbar overflow-x-hidden">
                            
                            <div className="mb-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Status</label>
                                <div className="bg-slate-100 p-1 rounded-lg flex h-8">
                                    <button onClick={() => onMetadataChange('status', 'draft')} className={`flex-1 py-0.5 text-[9px] font-black uppercase rounded transition-all ${metadata.status !== 'published' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Draft</button>
                                    <button onClick={() => onMetadataChange('status', 'published')} className={`flex-1 py-0.5 text-[9px] font-black uppercase rounded transition-all ${metadata.status === 'published' ? 'bg-green-600 text-white shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}>Live</button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <InspectorPanel title="Meta Daten" icon={<Info size={12}/>}>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Autor</label>
                                            <select 
                                                className="w-full border border-slate-200 rounded p-1.5 text-[11px] font-medium bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-f1-pink" 
                                                value={currentAuthorValue} 
                                                onChange={e => handleAuthorSelect(e.target.value)}
                                            >
                                                <option value="">Autor wählen...</option>
                                                {currentAuthorValue === 'legacy' && <option value="legacy">{metadata.author} (Legacy)</option>}
                                                {eligibleAuthors.map(user => <option key={user.id} value={user.id}>{getAuthorName(user)}</option>)}
                                            </select>
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50 cursor-pointer" onClick={() => onMetadataChange('isUpdated', !metadata.isUpdated)}>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center"><RefreshCw size={10} className="mr-1.5" /> Als "Updated" markieren</span>
                                            <div className="text-f1-pink">
                                                {metadata.isUpdated ? <CheckSquare size={14} /> : <Square size={14} className="text-slate-300" />}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Slug</label>
                                                <input 
                                                    className="w-full border border-slate-200 rounded p-1.5 text-[11px] font-medium bg-white text-slate-900 focus:outline-none focus:border-f1-pink font-mono" 
                                                    value={metadata.slug || ''} 
                                                    onChange={e => onMetadataChange('slug', slugify(e.target.value))} 
                                                    placeholder="URL-Slug" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Lesedauer</label>
                                                <input 
                                                    className="w-full border border-slate-200 rounded p-1.5 text-[11px] font-medium bg-white text-slate-900 focus:outline-none focus:border-f1-pink" 
                                                    value={metadata.readTime || ''} 
                                                    onChange={e => onMetadataChange('readTime', e.target.value)} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </InspectorPanel>

                                <InspectorPanel title="Layout & Sidebar" icon={<Layout size={12}/>}>
                                    <div className="space-y-1">
                                        {[
                                            { id: 'showLatestNews', label: 'Latest News (Sidebar)', icon: <Clock size={12}/> },
                                            { id: 'showNextRace', label: 'Next Race (Sidebar)', icon: <Calendar size={12}/> },
                                            { id: 'enableComments', label: 'Kommentare aktiv', icon: <MessageSquare size={12}/> }
                                        ].map(opt => {
                                            const isVal = (metadata.layoutOptions as any)?.[opt.id] !== false;
                                            return (
                                                <div key={opt.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => updateLayoutOption(opt.id as any, !isVal)}>
                                                    <span className="text-[10px] font-bold uppercase text-slate-600 flex items-center">
                                                        <span className="mr-2 text-slate-400">{opt.icon}</span>
                                                        {opt.label}
                                                    </span>
                                                    <div className="text-f1-pink">
                                                        {isVal ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-200" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </InspectorPanel>

                                <InspectorPanel title="Bereiche (Sections)" icon={<BoxSelect size={12}/>}>
                                    <div className="flex flex-wrap gap-1.5">
                                        {SECTIONS.map(section => {
                                            const currentSections = Array.isArray(metadata.section) ? metadata.section : [metadata.section as any];
                                            const isSelected = currentSections.includes(section);
                                            return (
                                                <button 
                                                    key={section}
                                                    onClick={() => toggleSection(section)}
                                                    className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase transition-all border ${isSelected ? 'bg-f1-pink text-white border-f1-pink shadow-glow' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'}`}
                                                >
                                                    {section}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </InspectorPanel>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col animate-in fade-in slide-in-from-right-2 duration-300">
                        <div className="flex-1 overflow-y-auto p-4 no-scrollbar overflow-x-hidden">
                            <h3 className="font-black uppercase text-[10px] text-slate-400 tracking-widest border-b pb-2 mb-4">Block-Einstellungen</h3>
                            {selectedBlock ? (
                                <div className="space-y-5">
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 p-2 rounded border border-slate-100 flex justify-between items-center mb-3">
                                        <span>Typ: {selectedBlock.type.split('/')[1]}</span>
                                        <span className="font-mono text-slate-300">{selectedBlock.clientId.substr(0,4)}</span>
                                    </div>
                                    {(() => {
                                        const module = getBlockModule(selectedBlock.type);
                                        const Inspector = module?.Inspector;
                                        return Inspector ? <Inspector block={selectedBlock} /> : <div className="text-xs text-slate-400 italic">Keine Einstellungen verfügbar.</div>;
                                    })()}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-slate-300 italic text-xs">
                                    Wähle einen Block aus, um Einstellungen zu bearbeiten.
                                </div>
                            )}
                        </div>
                        
                        {selectedBlock && selectedBlockId && (
                            <div className="p-4 border-t border-slate-100 bg-white shrink-0 z-10">
                                <button onClick={() => removeBlock(selectedBlockId)} className="w-full flex items-center justify-center space-x-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-[10px] font-black uppercase transition-colors">
                                    <Trash2 size={14} /> <span>Block entfernen</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
};

export default EditorInspector;