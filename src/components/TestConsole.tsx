import { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Server, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

export function TestConsole({ activeEnvId, sdkKey }: { activeEnvId: string | null; sdkKey: string | null }) {
  const [contextStr, setContextStr] = useState('{\n  "userId": "user-123",\n  "country": "US"\n}');
  const contextRef = useRef(contextStr);
  
  useEffect(() => {
    contextRef.current = contextStr;
  }, [contextStr]);

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView();
  }, [logs]);

  useEffect(() => {
    if (!sdkKey) return;
    setLogs(prev => [...prev, `[SSE] Connecting to stream for env ${activeEnvId}...`]);
    
    const eventSource = new EventSource(`/api/stream?sdkKey=${sdkKey}`);
    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setLogs(prev => [...prev, `[SSE Update] Flag modified: ${data.flag.key}`]);
      // auto-reeval
      handleEvaluate(contextRef.current);
    };
    eventSource.onopen = () => {
      setLogs(prev => [...prev, `[SSE] Connected.`]);
    };
    eventSource.onerror = () => {
      setLogs(prev => [...prev, `[SSE Error] Connection lost.`]);
    };

    return () => eventSource.close();
  }, [sdkKey]);

  const handleEvaluate = async (ctxStr?: string) => {
    if (!sdkKey) return;
    setLoading(true);
    try {
      const bodyContext = JSON.parse(ctxStr || contextStr);
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sdkKey}` },
        body: JSON.stringify({ context: bodyContext })
      });
      const data = await res.json();
      setResults(data.results);
      setLogs(prev => [...prev, `[Eval] Sub-ms response: ${Object.keys(data.results).length} flags evaluated.`]);
    } catch (e) {
      setLogs(prev => [...prev, `[Error] Invalid context JSON or network error.`]);
    } finally {
      setLoading(false);
    }
  };

  if (!sdkKey) {
    return (
      <div className="w-80 bg-[#0F172A] border-l border-slate-800 flex flex-col items-center justify-center text-slate-500 p-6 text-center h-screen">
        <Server className="w-8 h-8 mb-4 opacity-50" />
        <p className="text-sm">Select an environment to view SDK test console.</p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-[#0F172A] border-l border-slate-800 flex flex-col text-slate-400 h-screen">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          Test Console
        </h3>
        <div className="text-xs font-mono bg-slate-800/50 px-2 py-1 rounded text-slate-400 truncate max-w-[120px]" title={sdkKey}>
          {sdkKey}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Context JSON</label>
          <textarea 
            className="w-full bg-slate-900 border border-slate-800 rounded font-mono text-xs p-3 text-slate-300 focus:outline-none focus:border-indigo-500 h-32"
            value={contextStr}
            onChange={e => setContextStr(e.target.value)}
            spellCheck={false}
          />
          <button 
            onClick={() => handleEvaluate()}
            disabled={loading}
            className="mt-3 w-full bg-slate-800 hover:bg-indigo-600 text-white py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            Evaluate Flags
          </button>
        </div>

        <div className="p-4 border-b border-slate-800 flex-1 overflow-y-auto min-h-0">
          <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Results</label>
          {results ? (
            <div className="space-y-2">
              {Object.entries(results).map(([key, data]: [string, any]) => (
                <div key={key} className="bg-slate-900 border border-slate-800 p-2.5 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-indigo-300">{key}</span>
                    <span className="font-mono text-xs px-1.5 rounded bg-slate-800 border flex items-center gap-1">
                       <Zap className="w-3 h-3 text-yellow-500" />
                       {JSON.stringify(data.value)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Reason: {data.reason}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-8">No results. Run evaluation.</div>
          )}
        </div>

        <div className="h-48 bg-slate-900/50 p-2 overflow-y-auto font-mono text-[10px] space-y-1">
          {logs.map((L, i) => (
            <div key={i} className={L.includes('[Error]') ? 'text-red-400' : 'text-emerald-400'}>{L}</div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
