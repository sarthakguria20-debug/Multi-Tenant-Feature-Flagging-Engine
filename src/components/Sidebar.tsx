import { Layers, Activity, Server, Shield, Hexagon } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Project, Environment } from '../types';

interface SidebarProps {
  projects: Project[];
  activeEnvId: string | null;
  onSelectEnv: (envId: string) => void;
}

export function Sidebar({ projects, activeEnvId, onSelectEnv }: SidebarProps) {
  return (
    <div className="w-64 bg-[#0F172A] border-r border-slate-800 h-screen flex flex-col text-slate-400">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center shadow-sm">
          <Hexagon className="w-5 h-5 text-white" />
        </div>
        <div className="font-bold text-white tracking-tight">FLAGENGINE</div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 space-y-8">
        {projects.map(proj => (
          <div key={proj.id}>
            <div className="px-6 mb-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              {proj.name}
            </div>
            <div className="flex flex-col">
              {proj.environments.map(env => (
                <button
                  key={env.id}
                  onClick={() => onSelectEnv(env.id)}
                  className={cn(
                    "w-full text-left px-6 py-2.5 flex items-center gap-3 text-sm transition-colors relative",
                    activeEnvId === env.id 
                      ? "bg-slate-800/50 text-white font-medium border-r-2 border-indigo-500" 
                      : "hover:text-white text-slate-400"
                  )}
                >
                  <Server className="w-4 h-4" />
                  {env.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-6 border-t border-slate-800">
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
          <span>SSE: Connected</span>
        </div>
      </div>
    </div>
  );
}
