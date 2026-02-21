
import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Team, Driver, Race, SessionResult } from '../types';
import { syncService } from '../services/sync';

interface DataContextType {
  teams: Team[];
  drivers: Driver[];
  races: Race[];
  results: SessionResult[];
  addTeam: (team: Team) => Promise<any>;
  updateTeam: (team: Team) => Promise<any>;
  deleteTeam: (id: string) => Promise<void>;
  getTeam: (id: string) => Team | undefined;
  addDriver: (driver: Driver) => Promise<any>;
  updateDriver: (driver: Driver) => Promise<any>;
  deleteDriver: (id: string) => Promise<void>;
  getDriver: (id: string) => Driver | undefined;
  getDriversByTeam: (teamId: string) => Driver[];
  addRace: (race: Race) => Promise<any>;
  updateRace: (race: Race) => Promise<any>;
  deleteRace: (id: string) => Promise<void>;
  getRace: (id: string) => Race | undefined;
  updateSessionResult: (result: SessionResult) => Promise<void>;
  getSessionResult: (raceId: string, type: string) => SessionResult | undefined;
  recalculateStandings: () => Promise<void>;
  reorderEntities: (collection: 'teams' | 'drivers' | 'races', orderedItems: any[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dataVersion, setDataVersion] = useState(0);
  const forceUpdate = () => setDataVersion(v => v + 1);

  const teams = useLiveQuery(() => db.teams.orderBy('order').toArray(), [dataVersion]) || [];
  const drivers = useLiveQuery(() => db.drivers.orderBy('order').toArray(), [dataVersion]) || [];
  const races = useLiveQuery(() => db.races.orderBy('round').toArray(), [dataVersion]) || [];
  const results = useLiveQuery(() => db.results.toArray(), [dataVersion]) || [];

  const calculateAndSetStandings = async () => {
    const allDrivers = await db.drivers.toArray();
    const allTeams = await db.teams.toArray();
    const allResults = await db.results.toArray();
    const driverStats: Record<string, { points: number }> = {};
    const teamStats: Record<string, { points: number }> = {};
    allDrivers.forEach(d => driverStats[d.id] = { points: 0 });
    allTeams.forEach(t => teamStats[t.id] = { points: 0 });
    allResults.forEach(session => {
        if (session.sessionType === 'race' || session.sessionType === 'sprint') {
            session.entries.forEach(entry => {
                if (driverStats[entry.driverId]) driverStats[entry.driverId].points += Number(entry.points) || 0;
                if (entry.teamId && teamStats[entry.teamId]) teamStats[entry.teamId].points += Number(entry.points) || 0;
            });
        }
    });
    const sortedDrivers = [...allDrivers].sort((a, b) => driverStats[b.id].points - driverStats[a.id].points);
    const sortedTeams = [...allTeams].sort((a, b) => teamStats[b.id].points - teamStats[a.id].points);
    await db.transaction('rw', db.drivers, db.teams, () => {
        sortedDrivers.forEach((d, idx) => db.drivers.update(d.id, { points: driverStats[d.id].points, rank: idx + 1 }));
        sortedTeams.forEach((t, idx) => db.teams.update(t.id, { points: teamStats[t.id].points, rank: idx + 1 }));
    });
  };

  const addTeam = async (team: Team) => {
      if (team.order === undefined) team.order = (await db.teams.count()) + 1;
      await db.teams.put(team);
      await calculateAndSetStandings();
      forceUpdate();
      syncService.autoPush();
  };
  const updateTeam = async (team: Team) => {
      await db.teams.put(team);
      await calculateAndSetStandings();
      forceUpdate();
      syncService.autoPush();
  };
  const deleteTeam = async (id: string) => {
      await db.transaction('rw', db.teams, db.drivers, async () => {
          await db.teams.delete(id);
          await db.drivers.where({ teamId: id }).modify({ teamId: null });
      });
      await calculateAndSetStandings();
      forceUpdate();
      syncService.autoPush();
  };
  const getTeam = (id: string) => teams.find(t => t.id === id);

  const addDriver = async (driver: Driver) => {
      if (driver.order === undefined) driver.order = (await db.drivers.count()) + 1;
      await db.drivers.put(driver);
      await calculateAndSetStandings();
      forceUpdate();
      syncService.autoPush();
  };
  const updateDriver = async (driver: Driver) => {
      await db.drivers.put(driver);
      await calculateAndSetStandings();
      forceUpdate();
      syncService.autoPush();
  };
  const deleteDriver = async (id: string) => {
      await db.drivers.delete(id);
      await calculateAndSetStandings();
      forceUpdate();
      syncService.autoPush();
  };
  const getDriver = (id: string) => drivers.find(d => d.id === id);
  const getDriversByTeam = (teamId: string) => drivers.filter(d => d.teamId === teamId);

  const addRace = async (race: Race) => {
      race.round = (await db.races.count()) + 1;
      await db.races.put(race);
      forceUpdate();
      syncService.autoPush();
  };
  const updateRace = async (race: Race) => {
      await db.races.put(race);
      forceUpdate();
      syncService.autoPush();
  };
  const deleteRace = async (id: string) => {
      await db.races.delete(id);
      forceUpdate();
      syncService.autoPush();
  };
  const getRace = (id: string) => races.find(r => r.id === id);

  const updateSessionResult = async (result: SessionResult) => {
    const existing = await db.results.where({ raceId: result.raceId, sessionType: result.sessionType }).first();
    if (existing) await db.results.put({ ...result, id: existing.id });
    else await db.results.add(result);
    await calculateAndSetStandings();
    forceUpdate();
    syncService.autoPush();
  };

  const getSessionResult = (raceId: string, type: string) => results.find(r => r.raceId === raceId && r.sessionType === type);

  const recalculateStandings = async () => {
      await calculateAndSetStandings();
      forceUpdate();
      syncService.autoPush();
  };

  const reorderEntities = async (collection: 'teams' | 'drivers' | 'races', orderedItems: any[]) => {
      const table = db.table(collection);
      await db.transaction('rw', table, async () => {
          for (let i = 0; i < orderedItems.length; i++) {
              await table.update(orderedItems[i].id, { [collection === 'races' ? 'round' : 'order']: i + 1 });
          }
      });
      forceUpdate();
      syncService.autoPush();
  };

  return (
    <DataContext.Provider value={{ 
      teams, drivers, races, results,
      addTeam, updateTeam, deleteTeam, getTeam,
      addDriver, updateDriver, deleteDriver, getDriver, getDriversByTeam,
      addRace, updateRace, deleteRace, getRace,
      updateSessionResult, getSessionResult, recalculateStandings, reorderEntities
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
