
import React from 'react';
import { 
    AlignLeft, Type, List as ListIcon, Quote as QuoteIcon, ChevronDown, Table as TableIcon,
    Image as ImageIcon, Layers, Play, Youtube, Music, Minus, MessageSquare,
    User as UserIcon, Flag, Trophy, Calendar as CalendarIcon, BarChart2, Calculator, CheckCircle
} from 'lucide-react';
import { BlockType } from '../../../types';
import { useEditor } from './EditorContext';

const BlockCategory: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h4 className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{title}</h4>
        <div className="grid grid-cols-2 gap-2">
            {children}
        </div>
    </div>
);

const InserterTile: React.FC<{ type: BlockType, label: string, icon: React.ReactNode }> = ({ type, label, icon }) => {
    const { insertBlock } = useEditor();
    return (
        <button 
            onClick={() => insertBlock(type)}
            className="flex flex-col items-center justify-center py-4 px-2 bg-slate-50 rounded-lg hover:bg-white hover:text-f1-pink transition-all group border border-slate-200 hover:border-f1-pink/30 hover:shadow-sm"
        >
            <div className="text-slate-400 group-hover:text-f1-pink mb-2 transition-colors">{icon}</div>
            <span className="text-[10px] font-bold uppercase truncate w-full text-center leading-none">{label}</span>
        </button>
    );
};

const BlockInserter: React.FC = () => {
    return (
        <aside className="w-80 bg-white border-r border-slate-200 overflow-hidden z-50 flex flex-col shrink-0">
            <div className="p-6 space-y-12 flex-1 overflow-y-auto custom-scrollbar">
                <BlockCategory title="Text">
                    <InserterTile type="custom/paragraph" label="Absatz" icon={<AlignLeft size={18}/>} />
                    <InserterTile type="custom/heading" label="Überschrift" icon={<Type size={18}/>} />
                    <InserterTile type="custom/list" label="Liste" icon={<ListIcon size={18}/>} />
                    <InserterTile type="custom/quote" label="Zitat" icon={<QuoteIcon size={18}/>} />
                    <InserterTile type="custom/details" label="Details" icon={<ChevronDown size={18}/>} />
                    <InserterTile type="custom/table" label="Tabelle" icon={<TableIcon size={18}/>} />
                </BlockCategory>
                <BlockCategory title="Medien">
                    <InserterTile type="custom/image" label="Bild" icon={<ImageIcon size={18}/>} />
                    <InserterTile type="custom/gallery" label="Galerie" icon={<Layers size={18}/>} />
                    <InserterTile type="custom/slider" label="Slider" icon={<Play size={18}/>} />
                    <InserterTile type="custom/youtube" label="YouTube" icon={<Youtube size={18}/>} />
                    <InserterTile type="custom/spotify" label="Spotify" icon={<Music size={18}/>} />
                </BlockCategory>
                <BlockCategory title="Design">
                    <InserterTile type="custom/separator" label="Trennlinie" icon={<Minus size={18}/>} />
                    <InserterTile type="custom/comment" label="Kommentar" icon={<MessageSquare size={18}/>} />
                </BlockCategory>
                <BlockCategory title="Renngeschehen">
                    <InserterTile type="f1/driver" label="Fahrer" icon={<UserIcon size={18} className="text-f1-pink"/>} />
                    <InserterTile type="f1/team" label="Team" icon={<Flag size={18} className="text-f1-pink"/>} />
                    <InserterTile type="f1/event" label="GP Event" icon={<Trophy size={18} className="text-f1-pink"/>} />
                    <InserterTile type="f1/calendar" label="Kalender" icon={<CalendarIcon size={18} className="text-f1-pink"/>} />
                    <InserterTile type="f1/standings" label="WM-Stand" icon={<BarChart2 size={18} className="text-f1-pink"/>} />
                    <InserterTile type="f1/title-watch" label="Title Watch" icon={<Calculator size={18} className="text-f1-pink"/>} />
                    <InserterTile type="f1/results" label="Results" icon={<CheckCircle size={18} className="text-f1-pink"/>} />
                </BlockCategory>
            </div>
        </aside>
    );
};

export default BlockInserter;
