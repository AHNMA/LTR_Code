
import React from 'react';
import { Trophy } from 'lucide-react';
import { ContentBlock } from '../../../types';
import { useEditor } from '../editor/EditorContext';
import BlockRenderer from '../../../components/article/BlockRenderer';
import { useData } from '../../../contexts/DataContext';

export const ResultsEditor: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { drivers, races, getSessionResult } = useData();
    const { updateBlock, selectedBlockId } = useEditor();
    const race = races.find(r => r.id === block.attributes.id);
    if (!race) return <div className="p-4 border border-slate-200 rounded-2xl text-center text-slate-400 text-xs bg-white font-sans italic">Rennen für Ergebnisse wählen...</div>;
    const result = getSessionResult(race.id, block.attributes?.sessionId || 'race');
    const list = result?.entries?.slice(0, 5) || [];
    return (
        <div>
            <div className="mb-6"><BlockRenderer block={block} editable={true} selectedBlockId={selectedBlockId} onUpdateBlock={updateBlock} /></div>
            <div className="bg-f1-card rounded-2xl overflow-hidden border border-white/10 font-sans">
            <div className="p-3 bg-white/10 flex justify-between items-center"><div className="text-white font-bold text-sm flex items-center"><Trophy size={14} className="mr-2 text-f1-pink"/> {race.country} GP Results</div><div className="text-[10px] uppercase text-white/50">{block.attributes.sessionId}</div></div>
            <div className="divide-y divide-white/5">
                {list.map((e, i) => (
                    <div key={i} className="p-2 px-4 flex justify-between items-center text-xs text-white">
                        <span className="w-4 font-bold text-white/50">{i+1}</span>
                        <span className="font-bold flex-1 ml-2">{drivers.find(d => d.id === e.driverId)?.lastName || 'Unknown'}</span>
                        <span className="font-mono text-white/50">{e.time}</span>
                    </div>
                ))}
                {list.length === 0 && <div className="p-4 text-center text-white/30 text-xs">Keine Daten</div>}
            </div>
            </div>
        </div>
    );
};

export const ResultsInspector: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock } = useEditor();
    const { races } = useData();
    return (
        <div className="space-y-4 font-sans">
            <select className="w-full border border-slate-200 rounded p-2 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-f1-pink" value={block.attributes?.id} onChange={e => updateBlock(block.clientId, { id: e.target.value })}>
                <option value="">GP wählen...</option>
                {races.map(r => <option key={r.id} value={r.id}>{r.country} GP</option>)}
            </select>
            <select className="w-full border border-slate-200 rounded p-2 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-f1-pink" value={block.attributes?.sessionId} onChange={e => updateBlock(block.clientId, { sessionId: e.target.value })}>
                <option value="race">Rennen</option>
                <option value="qualifying">Qualifying</option>
                <option value="sprint">Sprint</option>
                <option value="fp1">FP1</option>
            </select>
        </div>
    );
};
