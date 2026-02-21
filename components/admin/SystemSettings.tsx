
import React, { useState, useEffect } from 'react';
import { syncService, SqlConfig, REMOTE_CONFIG_URL } from '../../services/sync';
import { Save, RefreshCw, UploadCloud, DownloadCloud, Code, CheckCircle, AlertTriangle, Database, Copy, Wifi, FileText, Terminal, Loader2, Server, Key as KeyIcon, HelpCircle, ShieldCheck, Globe, Zap, List, History as HistoryIcon, Link, CloudCog, FileImage, ExternalLink, ShieldAlert, Activity, Search, X } from 'lucide-react';

const SystemSettings: React.FC = () => {
    const [config, setLocalConfig] = useState(syncService.getConfig());
    const [sqlStatus, setSqlStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
    const [mediaStatus, setMediaStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
    
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');
    const [showCode, setShowCode] = useState<'database' | 'config' | 'upload' | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [auditResult, setAuditResult] = useState<any | null>(null);

    useEffect(() => {
        setLocalConfig(syncService.getConfig());
    }, [status]);

    const addLog = (text: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev.slice(0, 16)]);
    };

    const handleFullTest = async () => {
        setStatus('loading');
        setMsg("Prüfe Systeme...");
        setLogs([]);
        setAuditResult(null);
        addLog("Starte System-Check v41...");

        try {
            addLog("Schritt 1: SQL Proxy Validierung...");
            const sqlRes = await syncService.testConnection();
            if (sqlRes.db_status === 'connected') {
                setSqlStatus('ok');
                addLog("✓ SQL Cloud bereit.");
            }

            addLog("Schritt 2: Media API Diagnose...");
            const diag = await syncService.diagnoseMedia();
            if (diag.dir_writable) {
                setMediaStatus('ok');
                addLog("✓ Media API: Ordner beschreibbar.");
            } else {
                setMediaStatus('error');
                addLog("✖ Media API: Keine Schreibrechte!");
            }

            setMsg("Alle Systeme bereit!");
            setStatus('success');
        } catch (e: any) {
            addLog(`✖ FEHLER: ${e.message}`);
            setStatus('error');
        }
        setTimeout(() => setStatus('idle'), 4000);
    };

    const runMediaAudit = async () => {
        addLog("Starte Media Audit...");
        setAuditResult(null);
        try {
            const diag = await syncService.diagnoseMedia();
            addLog("✓ Antwort erhalten.");
            setAuditResult(diag);
        } catch (e: any) {
            addLog(`✖ Diagnose fehlgeschlagen: ${e.message}`);
            setAuditResult({ error: e.message });
        }
    };

    const configPhpCode = `<?php
/**
 * config.php - v41
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-App-Lock, X-API-KEY");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
header("Content-Type: application/json; charset=utf-8");
$lock_key = 'PolePosition_Live_2026';
$provided_key = $_GET['lock'] ?? $_SERVER['HTTP_X_APP_LOCK'] ?? '';
if ($provided_key !== $lock_key) {
    header('HTTP/1.1 403 Forbidden');
    die(json_encode(["error" => "Handshake failed"]));
}
echo json_encode([
    "sql" => [
        "host"         => "localhost",
        "db_name"      => "IHR_DB_NAME",
        "user"         => "IHR_USER",
        "pass"         => "IHR_PASS",
        "script_url"   => "https://letthemrace.net/api/database.php",
        "security_key" => "Security_Key_Hier"
    ],
    "media" => [
        "upload_url"   => "https://letthemrace.net/api/upload.php",
        "api_key"      => "Gleicher_Key_Wie_Oben"
    ]
]);
?>`;

    const databasePhpCode = `<?php
/**
 * database.php - v41
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-API-KEY, X-App-Lock");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
header("Content-Type: application/json; charset=utf-8");
$config_api_key = '${config.key || 'Security_Key_Hier'}';
$auth_payload = $_GET['auth'] ?? '';
if (!$auth_payload) die(json_encode(['error' => 'Auth missing']));
$decoded = json_decode(base64_decode($auth_payload), true);
if (!$decoded || $decoded['key'] !== $config_api_key) die(json_encode(['error' => 'Key invalid']));
$conn = @new mysqli($decoded['host'], $decoded['user'], $decoded['pass'], $decoded['name']);
if ($conn->connect_error) die(json_encode(['error' => 'DB Connection failed']));
$conn->set_charset("utf8mb4");
$conn->query("CREATE TABLE IF NOT EXISTS sync_store (table_name VARCHAR(50) PRIMARY KEY, data_json LONGTEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['test'])) echo json_encode(['db_status' => 'connected']);
    else {
        $result = $conn->query("SELECT table_name, data_json FROM sync_store");
        $output = [];
        if ($result) { while ($row = $result->fetch_assoc()) { $output[$row['table_name']] = json_decode($row['data_json'], true); } }
        echo json_encode(empty($output) ? ['status' => 'empty'] : $output);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    foreach ($data as $tableName => $rows) {
        $json = $conn->real_escape_string(json_encode($rows));
        $conn->query("INSERT INTO sync_store (table_name, data_json) VALUES ('$tableName', '$json') ON DUPLICATE KEY UPDATE data_json = '$json'");
    }
    echo json_encode(['success' => true]);
}
$conn->close();
?>`;

    const uploadPhpCode = `<?php
/**
 * upload.php - v41
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-API-KEY, Cache-Control, Pragma");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$api_key = '${config.key || 'Security_Key_Hier'}';
$provided_key = $_SERVER['HTTP_X_API_KEY'] ?? $_POST['key'] ?? $_GET['key'] ?? '';

if ($provided_key !== $api_key) {
    header('HTTP/1.1 403 Forbidden');
    die(json_encode(['success' => false, 'error' => 'Unauthorized']));
}

$upload_dir = dirname(__FILE__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
if (!is_dir($upload_dir)) { @mkdir($upload_dir, 0777, true); }

if (($_GET['action'] ?? '') === 'debug_paths') {
    header("Content-Type: application/json");
    $files = is_dir($upload_dir) ? scandir($upload_dir) : [];
    die(json_encode([
        'php_user'     => get_current_user(),
        'upload_dir'   => $upload_dir,
        'dir_writable' => is_writable($upload_dir),
        'file_count'   => count($files) - 2,
        'v'            => '41'
    ]));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['action'] ?? '') === 'list') {
    header("Content-Type: application/json");
    $files = [];
    if (is_dir($upload_dir)) {
        foreach (new DirectoryIterator($upload_dir) as $fileinfo) {
            if (!$fileinfo->isDot() && $fileinfo->isFile()) {
                $ext = strtolower($fileinfo->getExtension());
                if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) {
                    $files[] = [
                        'name' => $fileinfo->getFilename(),
                        'url'  => 'https://' . $_SERVER['HTTP_HOST'] . str_replace(dirname(dirname(__FILE__)), '', $upload_dir) . $fileinfo->getFilename(),
                        'size' => $fileinfo->getSize(),
                        'type' => 'image/' . ($ext === 'jpg' ? 'jpeg' : $ext),
                        'date' => date('c', $fileinfo->getMTime())
                    ];
                }
            }
        }
    }
    die(json_encode($files));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'delete') {
    header("Content-Type: application/json");
    $filename = basename($_POST['name'] ?? ''); 
    $target = $upload_dir . $filename;
    if (empty($filename)) die(json_encode(['success' => false, 'error' => 'Kein Name.']));
    if (file_exists($target)) {
        if (@unlink($target)) die(json_encode(['success' => true]));
        $error = error_get_last();
        die(json_encode(['success' => false, 'error' => 'PHP darf nicht loeschen.', 'debug' => $error['message'] ?? 'unlink failed']));
    }
    die(json_encode(['success' => true, 'note' => 'Datei weg.']));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    header("Content-Type: application/json");
    $name = basename($_FILES['file']['name']);
    $target = $upload_dir . $name;
    if (move_uploaded_file($_FILES['file']['tmp_name'], $target)) {
        @chmod($target, 0644);
        die(json_encode(['success' => true]));
    }
    die(json_encode(['success' => false, 'error' => "Upload fehlgeschlagen."]));
}
?>`;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-lg border-t-4 border-f1-pink">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-display font-bold mb-2 flex items-center">
                            <ShieldAlert className="mr-3 text-f1-pink" /> Server-Anbindung v41
                        </h2>
                        <p className="text-slate-400 text-sm max-w-xl">
                            Script <strong>v41</strong> nutzt keine Browser-Dialoge mehr (Anti-Sandbox).
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                        <button onClick={() => setShowCode(showCode === 'config' ? null : 'config')} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all ${showCode === 'config' ? 'bg-white text-slate-900' : 'bg-white/10 hover:bg-white/20'}`}>config.php</button>
                        <button onClick={() => setShowCode(showCode === 'database' ? null : 'database')} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all ${showCode === 'database' ? 'bg-white text-slate-900' : 'bg-white/10 hover:bg-white/20'}`}>database.php</button>
                        <button onClick={() => setShowCode(showCode === 'upload' ? null : 'upload')} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all ${showCode === 'upload' ? 'bg-white text-slate-900' : 'bg-white/10 hover:bg-white/20'}`}>upload.php (v41)</button>
                    </div>
                </div>

                {showCode && (
                    <div className="mt-6 bg-black/50 rounded-xl p-4 border border-white/10 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-f1-pink uppercase">PHP Script Template</span>
                            <button onClick={() => { 
                                const codes = { config: configPhpCode, database: databasePhpCode, upload: uploadPhpCode };
                                navigator.clipboard.writeText(codes[showCode as keyof typeof codes]); 
                                addLog("Code in Zwischenablage kopiert.");
                            }} className="text-white text-[10px] hover:underline flex items-center bg-white/10 px-2 py-1 rounded">
                                <Copy size={10} className="mr-1" /> Kopieren
                            </button>
                        </div>
                        <pre className="text-[10px] font-mono text-slate-400 overflow-x-auto max-h-[300px]">
                            {showCode === 'config' ? configPhpCode : showCode === 'database' ? databasePhpCode : uploadPhpCode}
                        </pre>
                    </div>
                )}
            </div>

            {auditResult && (
                <div className="bg-white rounded-2xl shadow-xl border-l-4 border-blue-500 p-6 animate-in zoom-in-95 duration-300 relative">
                    <button onClick={() => setAuditResult(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={18} /></button>
                    <h3 className="font-bold text-blue-600 uppercase text-xs tracking-widest mb-4 flex items-center">
                        <Search size={16} className="mr-2" /> Media API Diagnose-Bericht
                    </h3>
                    {auditResult.error ? (
                        <div className="text-red-600 font-bold text-sm bg-red-50 p-4 rounded-lg border border-red-100">{auditResult.error}</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase">Schreibrechte</label>
                                <div className={`text-sm font-bold ${auditResult.dir_writable ? 'text-green-600' : 'text-red-600'}`}>{auditResult.dir_writable ? 'VORHANDEN' : 'BLOCKIERT'}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase">PHP User</label>
                                <div className="text-sm font-bold text-slate-800">{auditResult.php_user}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase">Dateien</label>
                                <div className="text-sm font-bold text-slate-800">{auditResult.file_count}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase">Script Version</label>
                                <div className="text-sm font-bold text-slate-800">v{auditResult.v}</div>
                            </div>
                            <div className="col-span-2 md:col-span-4 p-3 bg-slate-50 rounded-lg">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase">Absoluter Pfad</label>
                                <div className="text-[10px] font-mono text-slate-600 truncate">{auditResult.upload_dir}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center">
                            <Activity size={18} className="mr-2 text-f1-pink" /> Status
                        </h3>
                        <div className="flex space-x-2">
                            <button onClick={runMediaAudit} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-blue-700 transition-all"><Search size={14} className="mr-1" /> Audit</button>
                            <button onClick={handleFullTest} disabled={status === 'loading'} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase hover:bg-f1-pink transition-all"><Wifi size={14} className="mr-1" /> Test</button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className={`p-4 rounded-lg border flex items-center justify-between ${sqlStatus === 'ok' ? 'bg-green-50 border-green-100' : 'bg-slate-50'}`}>
                            <div className="flex items-center"><Server size={18} className="mr-3 text-slate-400" /><span className="text-sm font-bold uppercase">Datenbank</span></div>
                            {sqlStatus === 'ok' && <CheckCircle size={18} className="text-green-500" />}
                        </div>
                        <div className={`p-4 rounded-lg border flex items-center justify-between ${mediaStatus === 'ok' ? 'bg-green-50 border-green-100' : 'bg-slate-50'}`}>
                            <div className="flex items-center"><FileImage size={18} className="mr-3 text-slate-400" /><span className="text-sm font-bold uppercase">Media / Upload</span></div>
                            {mediaStatus === 'ok' && <CheckCircle size={18} className="text-green-500" />}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                    <h3 className="font-bold text-lg text-slate-800 border-b pb-4 mb-4 flex items-center">
                        <Terminal size={18} className="mr-2 text-slate-400" /> Log
                    </h3>
                    <div className="bg-slate-900 rounded-lg p-4 mb-6 flex-1 min-h-[160px] overflow-y-auto border border-slate-700">
                        {logs.map((log, i) => (
                            <div key={i} className={`text-[10px] font-mono leading-tight mb-1 ${log.includes('✓') ? 'text-green-400' : 'text-slate-300'}`}>{log}</div>
                        ))}
                    </div>
                    <button onClick={async () => {
                        setStatus('loading');
                        try { await syncService.pushToServer((m) => addLog(m)); setStatus('success'); } 
                        catch(e) { setStatus('error'); }
                    }} disabled={status === 'loading'} className="w-full py-4 bg-f1-pink text-white rounded-xl font-bold uppercase hover:bg-pink-700 transition-all flex items-center justify-center">
                        <UploadCloud size={20} className="mr-2" /> Backup Jetzt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
