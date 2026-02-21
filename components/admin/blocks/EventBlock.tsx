
import React from 'react';
import { Calendar, MapPin, Zap, Clock, Info, Flag as FlagIcon } from 'lucide-react';
import { ContentBlock, Race, SessionType } from '../../../types';
import { useEditor } from '../editor/EditorContext';
import { useData } from '../../../contexts/DataContext';
import { getFlagUrl } from '../../../constants';
import { DottedGlowBackground } from '../../ui/DottedGlowBackground';

export const EventEditor: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { races } = useData();
    const { id, style = 'card' } = block.attributes;
    
    const race = races.find(r => r.id === id);
    if (!race) {
        return (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs bg-white font-sans italic">
                Grand Prix über die Sidebar auswählen...
            </div>
        );
    }

    const formatDate = (iso?: string) => {
        if (!iso) return '--.--';
        return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    const formatTime = (iso?: string) => {
        if (!iso) return '--:--';
        return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    };

    const getSessionLabel = (key: string): string => {
        const labels: Record<string, string> = {
            fp1: '1. Training',
            fp2: '2. Training',
            fp3: '3. Training',
            sprintQuali: 'Sprint Quali',
            sprint: 'Sprint',
            qualifying: 'Qualifying',
            race: 'Das Rennen'
        };
        return labels[key] || key;
    };

    // Bestimme die anzuzeigenden Sessions basierend auf dem Format
    const sessionKeys: string[] = race.format === 'sprint' 
        ? ['fp1', 'sprintQuali', 'sprint', 'qualifying', 'race']
        : ['fp1', 'fp2', 'fp3', 'qualifying', 'race'];

    const accentColor = '#e10059'; // F1 Pink als Standard für Events

    return (
        <div className="w-full font-display italic">
            <div className="bg-f1-card rounded-2xl overflow-hidden shadow-2xl border border-white/5 relative">
                
                {/* Header Section */}
                <div className="p-6 pb-2 border-b border-white/5 bg-white/5 flex items-center justify-between relative z-20">
                     <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <div className="text-white font-black text-3xl md:text-4xl uppercase italic tracking-tight leading-none flex items-center gap-3">
                                {race.country}
                                <img src={getFlagUrl(race.flag)} className="w-[26px] aspect-[3/2] object-cover border border-black/30 -translate-y-[4px]" alt="" />
                            </div>
                        </div>
                     </div>
                </div>

                {/* Accent Strip */}
                <div 
                    className="h-1 w-full z-20 relative"
                    style={{ background: `linear-gradient(90deg, ${accentColor} 0%, #1b1c20 100%)` }}
                ></div>

                <div className="flex flex-col @[768px]:flex-row relative">
                    
                    {/* Visual Area (Track Map) */}
                    <div 
                        className="w-full @[768px]:w-5/12 relative overflow-hidden border-b @[768px]:border-b-0 @[768px]:border-r border-white/5 flex items-center justify-center h-52 @[768px]:h-auto min-h-[250px] group/track"
                        style={{
                            background: `radial-gradient(circle at 50% 50%, ${accentColor}33 0%, #151619 85%)`
                        }}
                    >
                        <DottedGlowBackground 
                            color={accentColor}
                            speed={0.3}
                            gap={12}
                            radius={1}
                            className="opacity-60"
                        />

                        <div className="relative z-10 w-full h-full flex items-center justify-center pt-8 px-8 pb-32">
                            {race.trackMap ? (
                                <img 
                                    src={race.trackMap} 
                                    className="max-w-full max-h-full object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform scale-110 group-hover/track:scale-125 transition-transform duration-700" 
                                    alt={`${race.circuitName}`} 
                                />
                            ) : (
                                <MapPin size={64} className="text-white/10" />
                            )}
                        </div>
                        
                        {/* Location Overlay */}
                        <div className="absolute bottom-4 left-6 z-20 flex flex-col items-start">
                            <div className="mb-4 flex flex-col items-start gap-2">
                                <div className="text-[10px] font-black uppercase text-f1-pink tracking-widest not-italic leading-none">Round {race.round}</div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded skew-x-[-12deg] shadow-glow not-italic uppercase tracking-widest w-fit ${race.format === 'sprint' ? 'bg-orange-600 text-white' : 'bg-white/10 text-white/60'}`}>
                                    {race.format === 'sprint' ? 'Sprint Weekend' : 'Standard Weekend'}
                                </span>
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase text-white/40 tracking-widest not-italic mb-1">Circuit Location</div>
                                <div className="text-xl font-bold text-white uppercase leading-none">{race.city}</div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Area */}
                    <div className="w-full @[768px]:w-7/12 p-6 flex flex-col justify-center relative bg-f1-card z-20">
                        
                        <div className="mb-6 border-b border-white/5 pb-4">
                            <div className="flex items-center mb-1">
                                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest not-italic">Streckenname</span>
                            </div>
                            <div className="text-2xl font-bold text-white leading-none uppercase tracking-tight">
                                {race.circuitName}
                            </div>
                        </div>

                        {/* Sessions Grid */}
                        <div className="space-y-2">
                            {sessionKeys.map((key) => {
                                const dateStr = race.sessions[key];
                                const isRace = key === 'race';
                                return (
                                        <div 
                                            key={key} 
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group/session ${
                                                isRace 
                                                ? 'bg-f1-pink/10 border-f1-pink/30 shadow-[inset_0_0_15px_rgba(225,0,89,0.1)] hover:bg-f1-pink/20' 
                                                : 'bg-white/5 border-white/5 hover:bg-white/20 hover:border-f1-pink/30'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 h-4 rounded-full transition-transform group-hover/session:scale-y-125 ${isRace ? 'bg-f1-pink' : 'bg-white/20'}`}></div>
                                                <span className={`text-sm font-bold uppercase tracking-wide transition-colors ${isRace ? 'text-white' : 'text-zinc-400 group-hover/session:text-white'}`}>
                                                    {getSessionLabel(key)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-right">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-sm font-bold uppercase not-italic leading-none ${isRace ? 'text-f1-pink' : 'text-zinc-500'}`}>
                                                        {formatDate(dateStr)}
                                                    </span>
                                                    <span className={`text-lg font-black italic leading-none tabular-nums ${isRace ? 'text-white' : 'text-zinc-300'}`}>
                                                        {formatTime(dateStr)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                );
                            })}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export const EventInspector: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const { updateBlock } = useEditor();
    const { races } = useData();

    return (
        <div className="space-y-4 font-sans">
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Grand Prix auswählen</label>
                <select 
                    className="w-full border border-slate-200 rounded p-2 text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-f1-pink" 
                    value={block.attributes?.id} 
                    onChange={e => updateBlock(block.clientId, { id: e.target.value })}
                >
                    <option value="">GP wählen...</option>
                    {races.sort((a,b) => a.round - b.round).map(r => (
                        <option key={r.id} value={r.id}>
                            Rd. {r.round}: {r.country} GP
                        </option>
                    ))}
                </select>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-400 leading-relaxed italic">
                Der Event-Block nutzt das standardisierte card-orientierte Design der F1-Entitäten. Er passt sich automatisch an das Rennformat (Standard vs. Sprint) an.
            </div>
        </div>
    );
};

export const defaultAttributes = { 
    id: '', 
    style: 'card' 
};
