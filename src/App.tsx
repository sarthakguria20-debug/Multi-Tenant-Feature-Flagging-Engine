import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { FlagList } from './components/FlagList';
import { FlagEditor } from './components/FlagEditor';
import { TestConsole } from './components/TestConsole';
import type { Project, Flag as FlagType } from './types';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);
  const [flags, setFlags] = useState<FlagType[]>([]);
  const [editingFlagId, setEditingFlagId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(data => {
      setProjects(data);
      if (data.length > 0 && data[0].environments.length > 0) {
        setActiveEnvId(data[0].environments[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!activeEnvId) return;
    const proj = projects.find(p => p.environments.some(e => e.id === activeEnvId));
    if (!proj) return;

    fetch(`/api/projects/${proj.id}/flags?envId=${activeEnvId}`)
      .then(r => r.json())
      .then(data => setFlags(data));
  }, [activeEnvId, projects]);

  const activeProject = projects.find(p => p.environments.some(e => e.id === activeEnvId));
  const activeEnv = activeProject?.environments.find(e => e.id === activeEnvId);
  const editingFlag = isCreating ? null : flags.find(f => f.id === editingFlagId);

  const handleSaveFlag = async (formData: Partial<FlagType>) => {
    if (!activeProject || !activeEnvId) return;
    
    if (isCreating) {
      const res = await fetch(`/api/projects/${activeProject.id}/flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, envId: activeEnvId })
      });
      const newFlag = await res.json();
      setFlags([...flags, newFlag]);
      setIsCreating(false);
      setEditingFlagId(newFlag.id);
    } else if (editingFlagId) {
      const res = await fetch(`/api/flags/${editingFlagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const updated = await res.json();
      setFlags(flags.map(f => f.id === updated.id ? updated : f));
    }
  };

  const handleToggleActive = async (flagId: string, active: boolean) => {
    const res = await fetch(`/api/flags/${flagId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
    const updated = await res.json();
    setFlags(flags.map(f => f.id === updated.id ? updated : f));
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      <Sidebar 
        projects={projects} 
        activeEnvId={activeEnvId} 
        onSelectEnv={id => { setActiveEnvId(id); setEditingFlagId(null); setIsCreating(false); }} 
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className={`transition-all duration-300 flex-shrink-0 ${editingFlagId || isCreating ? 'w-[450px]' : 'flex-1'}`}>
           <FlagList 
            flags={flags}
            activeFlagId={editingFlagId}
            onSelectFlag={id => { setEditingFlagId(id); setIsCreating(false); }}
            onCreateFlag={() => { setIsCreating(true); setEditingFlagId(null); }}
            onToggleActive={handleToggleActive}
          />
        </div>

        {(editingFlagId || isCreating) && (
          <div className="flex-1 flex flex-col min-w-0 bg-white border-l border-slate-200 shadow-xl z-10 relative">
            <FlagEditor 
              flag={editingFlag || null}
              onSave={handleSaveFlag}
              onClose={() => { setEditingFlagId(null); setIsCreating(false); }}
            />
          </div>
        )}
      </div>

      <TestConsole 
        activeEnvId={activeEnvId} 
        sdkKey={activeEnv?.sdkKey || null}
      />
    </div>
  );
}
