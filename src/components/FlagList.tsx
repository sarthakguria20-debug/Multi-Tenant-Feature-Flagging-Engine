import { useState, useEffect } from 'react';
import { Plus, ToggleLeft, ToggleRight, Settings, Clock, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import type { Flag as FlagType } from '../types';

interface FlagListProps {
  flags: FlagType[];
  activeFlagId: string | null;
  onSelectFlag: (flagId: string) => void;
  onCreateFlag: () => void;
  onToggleActive: (flagId: string, active: boolean) => void;
}

export function FlagList({ flags, activeFlagId, onSelectFlag, onCreateFlag, onToggleActive }: FlagListProps) {
  return (
    <div className="flex-1 flex flex-col h-screen bg-[#F8FAFC]">
      <div className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-600 border border-slate-200">PROD_CLUSTER</div>
          <div className="h-4 w-px bg-slate-300"></div>
          <h1 className="text-lg font-semibold text-slate-900">
            Feature Flags
          </h1>
        </div>
        <button 
          onClick={onCreateFlag}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all"
        >
          + Create Flag
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
        {flags.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-white border border-slate-200 rounded-xl shadow-sm">
            <ToggleLeft className="w-12 h-12 mx-auto mb-4 opacity-50 text-slate-400" />
            <p>No flags found in this environment.</p>
          </div>
        )}
        
        {flags.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="col-span-12">Flags</div>
            </div>
            <div className="flex-1 flex flex-col">
              {flags.map(flag => (
                <div 
                  key={flag.id}
                  onClick={() => onSelectFlag(flag.id)}
                  className={cn(
                    "flex flex-col border-b border-slate-100 py-4 px-6 cursor-pointer transition-colors relative",
                    activeFlagId === flag.id 
                      ? "bg-indigo-50/50" 
                      : "hover:bg-slate-50/50 bg-white"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="font-semibold text-sm text-slate-900">{flag.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded text-slate-500 bg-slate-100 font-mono">
                          {flag.key}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{flag.description}</p>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleActive(flag.id, !flag.active);
                      }}
                      className="p-1 outline-none"
                    >
                      <div className={cn("w-10 h-5 rounded-full relative transition-[background-color] shadow-inner", flag.active ? "bg-indigo-600" : "bg-slate-200")}>
                        <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full shadow transition-all", flag.active ? "right-1" : "left-1")}></div>
                      </div>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[10px] uppercase font-bold text-slate-400 mt-2 tracking-widest">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                      <Activity className="w-3 h-3" />
                      {flag.rules.length} rule{flag.rules.length !== 1 ? 's' : ''} active
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Updated {formatDistanceToNow(flag.updatedAt)} ago
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 uppercase font-bold">
              <span>Showing {flags.length} Flags</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
