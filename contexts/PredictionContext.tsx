
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { UserBet, PredictionSettings, BonusQuestion, UserBonusBet, SessionType, RoundStatus } from '../types';
import { useData } from './DataContext';
import { useAuth } from './AuthContext';
import { syncService } from '../services/sync';

const DEFAULT_SETTINGS: PredictionSettings = {
    id: 'global',
    currentSeason: new Date().getFullYear(),
    racePoints: [10, 8, 6, 5, 4, 3, 2, 1],
    qualiPoints: [5, 4, 3, 2, 1],
    participationPoint: 1
};

interface LeaderboardEntry {
    userId: string; username: string; avatar: string;
    points: number; wins: number; rank: number;
}

interface PredictionContextType {
    bets: UserBet[]; bonusQuestions: BonusQuestion[]; userBonusBets: UserBonusBet[];
    settings: PredictionSettings;
    submitBet: (raceId: string, sessionType: SessionType, drivers: string[]) => Promise<void>;
    submitBonusBet: (questionId: string, answer: string) => void;
    updateSettings: (newSettings: PredictionSettings) => Promise<void>;
    getLeaderboard: () => LeaderboardEntry[];
    getUserBet: (raceId: string, sessionType: SessionType, userId: string) => UserBet | undefined;
    addBonusQuestion: (question: BonusQuestion) => Promise<void>;
    updateBonusQuestion: (question: BonusQuestion) => Promise<void>;
    deleteBonusQuestion: (id: string) => Promise<void>;
    setRoundStatus: (raceId: string, sessionType: SessionType, status: RoundStatus) => Promise<void>;
    getRoundStatus: (raceId: string, sessionType: SessionType) => RoundStatus | undefined;
    isBettingClosed: (raceId: string, sessionType: SessionType, deadline: string) => boolean;
    canManageGame: boolean;
    currentSeason: number;
}

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

export const PredictionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { results } = useData();
    const { users, currentUser } = useAuth();
    const [predictionVersion, setPredictionVersion] = useState(0);
    const forceUpdate = () => setPredictionVersion(v => v + 1);

    const dbSettings = useLiveQuery(() => db.settings.get('global'), [predictionVersion]);
    const settings = dbSettings || DEFAULT_SETTINGS;
    const currentSeason = settings.currentSeason;
    const bets = useLiveQuery(() => db.bets.where('season').equals(currentSeason).toArray(), [currentSeason, predictionVersion]) || [];
    const bonusQuestions = useLiveQuery(() => db.bonusQuestions.where('season').equals(currentSeason).toArray(), [currentSeason, predictionVersion]) || [];
    const predictionStates = useLiveQuery(() => db.predictionState.toArray(), [predictionVersion]) || [];
    
    useEffect(() => {
        const initGame = async () => {
            const existingSettings = await db.settings.get('global');
            if (!existingSettings) { await db.settings.put(DEFAULT_SETTINGS); forceUpdate(); }
        };
        initGame();
    }, [currentSeason]);

    const [userBonusBets, setUserBonusBets] = useState<UserBonusBet[]>([]);
    
    // Unrestricted management access for testing as requested
    const canManageGame = true;

    const submitBet = async (raceId: string, sessionType: SessionType, drivers: string[]) => {
        if (!currentUser) return;
        const betId = `${currentUser.id}-${raceId}-${sessionType}-${currentSeason}`;
        await db.bets.put({ id: betId, userId: currentUser.id, season: currentSeason, raceId, sessionType, drivers, timestamp: new Date().toISOString() });
        forceUpdate();
        syncService.autoPush();
    };

    const submitBonusBet = (questionId: string, answer: string) => {
        if (!currentUser) return;
        setUserBonusBets(prev => {
            const filtered = prev.filter(b => !(b.userId === currentUser.id && b.questionId === questionId));
            return [...filtered, { userId: currentUser.id, questionId, answer }];
        });
        // Bonus bets also triggers sync logic through internal notify if we add them to DB eventually
    };

    const updateSettings = async (newSettings: PredictionSettings) => {
        if (canManageGame) {
            await db.settings.put({ ...newSettings, id: 'global' });
            forceUpdate();
            syncService.autoPush();
        }
    };

    const addBonusQuestion = async (question: BonusQuestion) => {
        await db.bonusQuestions.put({ ...question, season: currentSeason });
        forceUpdate();
        syncService.autoPush();
    };

    const updateBonusQuestion = async (question: BonusQuestion) => {
        await db.bonusQuestions.put(question);
        forceUpdate();
        syncService.autoPush();
    };

    const deleteBonusQuestion = async (id: string) => {
        await db.bonusQuestions.delete(id);
        forceUpdate();
        syncService.autoPush();
    };

    const setRoundStatus = async (raceId: string, sessionType: SessionType, status: RoundStatus) => {
        await db.predictionState.put({ id: `${raceId}-${sessionType}`, status });
        forceUpdate();
        syncService.autoPush();
    };

    const getRoundStatus = (raceId: string, sessionType: SessionType) => predictionStates.find(s => s.id === `${raceId}-${sessionType}`)?.status;

    const isBettingClosed = (raceId: string, sessionType: SessionType, deadline: string) => {
        const status = getRoundStatus(raceId, sessionType);
        if (status === 'locked' || status === 'settled') return true;
        if (status === 'open') return false;
        return new Date() > new Date(deadline);
    };

    const getUserBet = (raceId: string, sessionType: SessionType, userId: string) => bets.find(b => b.raceId === raceId && b.sessionType === sessionType && b.userId === userId && b.season === currentSeason);

    const calculatePointsForBet = (bet: UserBet): number => {
        if (bet.season !== currentSeason) return 0;
        const sessionResult = results.find(r => r.raceId === bet.raceId && r.sessionType === bet.sessionType);
        if (!sessionResult || sessionResult.entries.length === 0) return 0;
        const sortedEntries = [...sessionResult.entries].sort((a, b) => (parseInt(a.position) || 999) - (parseInt(b.position) || 999));
        const pointSystem = (bet.sessionType === 'race' || bet.sessionType === 'sprint') ? settings.racePoints : settings.qualiPoints;
        let totalPoints = 0;
        bet.drivers.forEach((predictedDriverId, index) => {
            if (index >= pointSystem.length) return;
            if (sortedEntries[index]?.driverId === predictedDriverId) totalPoints += pointSystem[index];
            else if (sortedEntries.slice(0, pointSystem.length).map(e => e.driverId).includes(predictedDriverId)) totalPoints += settings.participationPoint;
        });
        return totalPoints;
    };
    
    const getLeaderboard = (): LeaderboardEntry[] => {
        const stats: Record<string, { points: number, wins: number }> = {};
        users.forEach(u => stats[u.id] = { points: 0, wins: 0 });
        const sessionPerformances: Record<string, Record<string, number>> = {}; 
        bets.forEach(bet => {
            const pts = calculatePointsForBet(bet);
            if (!stats[bet.userId]) stats[bet.userId] = { points: 0, wins: 0 };
            stats[bet.userId].points += pts;
            const key = `${bet.raceId}-${bet.sessionType}`;
            if (!sessionPerformances[key]) sessionPerformances[key] = {};
            sessionPerformances[key][bet.userId] = pts;
        });
        Object.values(sessionPerformances).forEach(scores => {
            const max = Math.max(...Object.values(scores), -1);
            if (max > 0) Object.keys(scores).forEach(uid => { if (scores[uid] === max && stats[uid]) stats[uid].wins += 1; });
        });
        return Object.keys(stats).map(userId => {
            const user = users.find(u => u.id === userId);
            return { userId, username: user?.username || 'Unknown', avatar: user?.avatar || '', points: stats[userId].points, wins: stats[userId].wins, rank: 0 };
        }).sort((a, b) => b.points !== a.points ? b.points - a.points : b.wins - a.wins).map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    };

    return (
        <PredictionContext.Provider value={{
            bets, bonusQuestions, userBonusBets, settings, submitBet, submitBonusBet, updateSettings, getLeaderboard, getUserBet,
            addBonusQuestion, updateBonusQuestion, deleteBonusQuestion, setRoundStatus, getRoundStatus, isBettingClosed, canManageGame, currentSeason
        }}>
            {children}
        </PredictionContext.Provider>
    );
};

export const usePrediction = () => {
    const context = useContext(PredictionContext);
    if (context === undefined) throw new Error('usePrediction must be used within a PredictionProvider');
    return context;
};
