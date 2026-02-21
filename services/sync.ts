
import { db } from './db';

const STORAGE_KEY_URL = 'pp_db_url';
const STORAGE_KEY_API_KEY = 'pp_upload_key'; 
const STORAGE_KEY_SQL = 'pp_sql_config';
const STORAGE_KEY_UPLOAD_URL = 'pp_upload_url';

export const REMOTE_CONFIG_URL = 'https://letthemrace.net/api/config.php';
const APP_HANDSHAKE_KEY = 'PolePosition_Live_2026';

export interface SqlConfig {
    host: string;
    user: string;
    pass: string;
    name: string;
}

export type SyncState = 'idle' | 'syncing' | 'success' | 'error';
type SyncListener = (state: SyncState) => void;
const listeners = new Set<SyncListener>();

let debounceTimer: any = null;

export const syncService = {
    subscribe: (listener: SyncListener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    notify: (state: SyncState) => {
        listeners.forEach(l => l(state));
    },

    getConfig: () => ({
        url: localStorage.getItem(STORAGE_KEY_URL) || '',
        key: localStorage.getItem(STORAGE_KEY_API_KEY) || '',
        uploadUrl: localStorage.getItem(STORAGE_KEY_UPLOAD_URL) || '',
        sql: JSON.parse(localStorage.getItem(STORAGE_KEY_SQL) || '{"host":"","user":"","pass":"","name":""}') as SqlConfig
    }),

    setConfig: (url: string, key: string, sql: SqlConfig, uploadUrl?: string) => {
        localStorage.setItem(STORAGE_KEY_URL, url.trim());
        localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
        localStorage.setItem(STORAGE_KEY_SQL, JSON.stringify(sql));
        if (uploadUrl) localStorage.setItem(STORAGE_KEY_UPLOAD_URL, uploadUrl.trim());
    },

    fetchRemoteConfig: async () => {
        try {
            const url = new URL(REMOTE_CONFIG_URL);
            url.searchParams.append('lock', APP_HANDSHAKE_KEY);
            url.searchParams.append('v', '40');
            url.searchParams.append('t', Date.now().toString());

            const response = await fetch(url.toString(), { 
                cache: 'no-cache', 
                mode: 'cors'
            });
            
            if (response.status === 403) throw new Error("Server lehnt Handshake ab (403).");
            if (!response.ok) throw new Error(`HTTP Fehler ${response.status}`);

            const remoteData = await response.json();
            
            if (remoteData.sql && remoteData.media) {
                syncService.setConfig(
                    remoteData.sql.script_url,
                    remoteData.sql.security_key,
                    {
                        host: remoteData.sql.host,
                        user: remoteData.sql.user,
                        pass: remoteData.sql.pass,
                        name: remoteData.sql.db_name
                    },
                    remoteData.media.upload_url
                );
                return true;
            }
            return false;
        } catch (e: any) {
            console.error("Remote Config Load Failed", e);
            throw e;
        }
    },

    testConnection: async () => {
        const { url } = syncService.getConfig();
        if (!url) throw new Error("Keine Script-URL.");
        const testUrl = syncService.getAuthenticatedUrl(url, { test: '1', v: '40' });
        const response = await fetch(testUrl, { method: 'GET', mode: 'cors', cache: 'no-cache' });
        if (!response.ok) throw new Error("SQL Proxy nicht erreichbar.");
        return await response.json();
    },

    testMediaConnection: async () => {
        const { uploadUrl, key } = syncService.getConfig();
        if (!uploadUrl) throw new Error("Keine Upload-URL.");
        try {
            const url = new URL(uploadUrl);
            url.searchParams.append('key', key);
            url.searchParams.append('action', 'debug_paths');
            const response = await fetch(url.toString(), { 
                method: 'GET', 
                mode: 'cors',
                headers: { 'X-API-KEY': key },
                cache: 'no-cache'
            });
            if (!response.ok) return false;
            const data = await response.json();
            return data.dir_writable === true;
        } catch (e) {
            return false;
        }
    },

    diagnoseMedia: async () => {
        const { uploadUrl, key } = syncService.getConfig();
        if (!uploadUrl) throw new Error("Keine Upload-URL.");
        
        console.log("[Sync] Diagnose anfordern...");
        const url = new URL(uploadUrl);
        url.searchParams.append('key', key);
        url.searchParams.append('action', 'debug_paths');
        
        const res = await fetch(url.toString(), { 
            mode: 'cors', 
            cache: 'no-cache',
            headers: { 'X-API-KEY': key }
        });
        
        console.log("[Sync] Diagnose Antwort erhalten. Status:", res.status);
        const text = await res.text();
        console.log("[Sync] Diagnose Roh-Text:", text);
        
        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error(`Server lieferte kein JSON: ${text.substring(0, 100)}`);
        }
    },

    fetchRemoteMediaList: async () => {
        const { uploadUrl, key } = syncService.getConfig();
        if (!uploadUrl) throw new Error("Keine Upload-URL konfiguriert.");
        
        const url = new URL(uploadUrl);
        url.searchParams.append('action', 'list');
        url.searchParams.append('key', key); 
        url.searchParams.append('t', Date.now().toString()); 
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            mode: 'cors',
            headers: { 
                'X-API-KEY': key,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (!response.ok) {
            const errBody = await response.text().catch(() => "Kein Body");
            throw new Error(`Server antwortet mit Status ${response.status}: ${errBody}`);
        }
        return await response.json();
    },

    deleteRemoteMedia: async (fileName: string) => {
        const { uploadUrl, key } = syncService.getConfig();
        if (!uploadUrl) throw new Error("Keine Upload-URL konfiguriert.");

        console.log("[Sync] Lösche:", fileName);
        const fd = new FormData();
        fd.append('action', 'delete');
        fd.append('name', fileName);
        fd.append('key', key);

        try {
            const response = await fetch(uploadUrl, {
                method: 'POST',
                mode: 'cors',
                headers: { 'X-API-KEY': key },
                body: fd
            });

            const text = await response.text();
            console.log("[Sync] Delete-Antwort Roh:", text);
            
            let resData;
            try {
                resData = JSON.parse(text);
            } catch (e) {
                throw new Error(`Server-Fehler: Antwort ist kein JSON. Inhalt: ${text.substring(0, 100)}...`);
            }

            if (resData.success === false) {
                const errMsg = resData.error || `Fehler beim Löschen`;
                const debug = resData.debug ? `\n\nDiagnose: ${resData.debug}` : '';
                throw new Error(errMsg + debug);
            }
            
            return true;
        } catch (err: any) {
            console.error("Delete Method Error:", err);
            throw err;
        }
    },

    autoPush: () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        syncService.notify('syncing');
        debounceTimer = setTimeout(async () => {
            try {
                await syncService.pushToServer();
                syncService.notify('success');
                setTimeout(() => syncService.notify('idle'), 3000);
            } catch (e) {
                syncService.notify('error');
            }
        }, 2000);
    },

    exportLocalData: async () => {
        const data: Record<string, any> = {};
        const tableNames = ['users', 'posts', 'teams', 'drivers', 'races', 'results', 'bets', 'bonusQuestions', 'predictionState', 'settings', 'media'];
        for (const name of tableNames) {
            const table = (db as any)[name];
            if (table) data[name] = await table.toArray();
        }
        return data;
    },

    getAuthPayload: () => {
        const { key, sql } = syncService.getConfig();
        const payload = JSON.stringify({ key, ...sql });
        return btoa(unescape(encodeURIComponent(payload)));
    },

    getAuthenticatedUrl: (baseUrl: string, params: Record<string, string> = {}) => {
        try {
            const url = new URL(baseUrl);
            url.searchParams.append('auth', syncService.getAuthPayload());
            Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
            return url.toString();
        } catch (e) { return baseUrl; }
    },

    pushToServer: async (onLog?: (msg: string) => void, onProgress?: (pct: number) => void): Promise<any> => {
        const { url } = syncService.getConfig();
        if (!url) return;
        if (onLog) onLog("Sammle lokale Daten...");
        const data = await syncService.exportLocalData();
        if (onProgress) onProgress(30);
        if (onLog) onLog("Sende Daten an Cloud...");
        const uploadUrl = syncService.getAuthenticatedUrl(url, { action: 'push', v: '40' });
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (onProgress) onProgress(80);
        if (!response.ok) throw new Error("Upload abgelehnt.");
        const result = await response.json();
        if (onLog) onLog("✓ Cloud-Sync erfolgreich.");
        if (onProgress) onProgress(100);
        return result;
    },

    pullFromServer: async () => {
        const { url } = syncService.getConfig();
        if (!url) return null; 
        const pullUrl = syncService.getAuthenticatedUrl(url, { action: 'pull', v: '40' });
        try {
            const response = await fetch(pullUrl, { method: 'GET', mode: 'cors' });
            if (!response.ok) return null;
            const data = await response.json();
            if (data.error || data.status === 'empty') return null;
            const tableNames = Object.keys(data);
            const validTables = db.tables.map(t => t.name);
            const tablesToUpdate = tableNames.filter(name => validTables.includes(name));
            if (tablesToUpdate.length > 0) {
                await db.transaction('rw', validTables, async () => {
                    for (const name of tablesToUpdate) {
                        const table = (db as any)[name];
                        if (table && data[name]) {
                            await table.clear();
                            await table.bulkAdd(data[name]);
                        }
                    }
                });
            }
            return data;
        } catch (e) { return null; }
    }
};
