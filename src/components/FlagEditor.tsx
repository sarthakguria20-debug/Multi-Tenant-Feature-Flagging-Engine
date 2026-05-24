import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Flag as FlagType, Rule } from '../types';

interface FlagEditorProps {
  flag: FlagType | null;
  onSave: (flag: Partial<FlagType>) => void;
  onClose: () => void;
}

export function FlagEditor({ flag, onSave, onClose }: FlagEditorProps) {
  const [formData, setFormData] = useState<Partial<FlagType>>({});

  useEffect(() => {
    if (flag) {
      setFormData(JSON.parse(JSON.stringify(flag)));
    } else {
      setFormData({
        name: '',
        key: '',
        description: '',
        type: 'boolean',
        active: false,
        rules: [],
        rollout: { percentage: 0, serveValue: 'true', fallbackValue: 'false' }
      });
    }
  }, [flag]);

  if (!formData.name && flag === null) return null;
  if (!Object.keys(formData).length) return null;

  const updateRule = (index: number, updates: Partial<Rule>) => {
    const newRules = [...(formData.rules || [])];
    newRules[index] = { ...newRules[index], ...updates };
    setFormData({ ...formData, rules: newRules });
  };

  const addRule = () => {
    setFormData({
      ...formData,
      rules: [
        ...(formData.rules || []),
        { id: Math.random().toString(36).substr(2, 9), attribute: '', operator: 'eq', value: '', type: formData.type || 'boolean', serveValue: '' }
      ]
    });
  };

  const removeRule = (index: number) => {
    const newRules = [...(formData.rules || [])];
    newRules.splice(index, 1);
    setFormData({ ...formData, rules: newRules });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white text-slate-600 h-full scrollbar-thin">
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 p-6 flex items-center justify-between z-10 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {flag ? 'Edit Flag' : 'Create Flag'}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      <div className="p-6 max-w-3xl space-y-8">
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">General Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Name</label>
              <input 
                type="text" 
                value={formData.name || ''} 
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                placeholder="e.g. New Checkout"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Key</label>
              <input 
                type="text" 
                value={formData.key || ''} 
                onChange={e => setFormData({ ...formData, key: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="e.g. new-checkout"
                disabled={!!flag}
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Description</label>
            <textarea 
              value={formData.description || ''} 
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Type</label>
              <select 
                value={formData.type || 'boolean'} 
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm disabled:bg-slate-50 disabled:text-slate-500"
                disabled={!!flag}
              >
                <option value="boolean">Boolean</option>
                <option value="string">String</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Targeting Rules</h3>
            <button onClick={addRule} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold">
              <Plus className="w-3.5 h-3.5" /> Add Rule
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.rules?.length === 0 && (
              <div className="p-4 border border-dashed border-slate-300 rounded-md text-sm text-slate-500 text-center bg-slate-50">
                No targeted rules set. Fallback rollout will be used.
              </div>
            )}
            {formData.rules?.map((rule, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 relative group shadow-sm">
                <button 
                  onClick={() => removeRule(idx)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 font-mono text-xs text-slate-600">
                  <span className="text-indigo-600 font-bold">IF</span> user context
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input 
                    placeholder="attribute (e.g. email)" 
                    value={rule.attribute}
                    onChange={e => updateRule(idx, { attribute: e.target.value })}
                    className="bg-white border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none w-full shadow-sm"
                  />
                  <select 
                    value={rule.operator}
                    onChange={e => updateRule(idx, { operator: e.target.value as any })}
                    className="bg-white border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none w-full shadow-sm"
                  >
                    <option value="eq">Equals</option>
                    <option value="neq">Not Equals</option>
                    <option value="in">In (comma sep)</option>
                    <option value="nin">Not In</option>
                    <option value="contains">Contains</option>
                  </select>
                  <input 
                    placeholder="value(s)" 
                    value={rule.value}
                    onChange={e => updateRule(idx, { value: e.target.value })}
                    className="bg-white border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none w-full shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-200 mt-3 text-sm text-slate-600">
                  <span className="text-indigo-600 font-mono text-xs font-bold">THEN SERVE</span>
                  <input 
                    placeholder="return value" 
                    value={rule.serveValue}
                    onChange={e => updateRule(idx, { serveValue: e.target.value })}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Default Rollout</h3>
          <div className="p-5 bg-white border border-slate-200 rounded-lg space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-6">
              <div className="w-1/3">
                <label className="text-xs font-semibold text-slate-600 mb-2 block">Percentage</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" min="0" max="100" 
                    value={formData.rollout?.percentage || 0}
                    onChange={e => setFormData({ ...formData, rollout: { ...formData.rollout!, percentage: parseInt(e.target.value) } })}
                    className="w-full accent-indigo-600"
                  />
                  <span className="text-sm font-medium text-slate-900 w-12 text-right">{formData.rollout?.percentage}%</span>
                </div>
              </div>
              <div className="w-1/3">
                <label className="text-[10px] uppercase font-bold text-indigo-600 mb-2 block tracking-widest">Serve (In Rollout)</label>
                <input 
                  value={formData.rollout?.serveValue || ''}
                  onChange={e => setFormData({ ...formData, rollout: { ...formData.rollout!, serveValue: e.target.value } })}
                  className="bg-white border border-slate-200 rounded px-3 py-1.5 text-sm text-slate-900 w-full outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
              </div>
              <div className="w-1/3">
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block tracking-widest">Fallback</label>
                <input 
                  value={formData.rollout?.fallbackValue || ''}
                  onChange={e => setFormData({ ...formData, rollout: { ...formData.rollout!, fallbackValue: e.target.value } })}
                  className="bg-white border border-slate-200 rounded px-3 py-1.5 text-sm text-slate-900 w-full outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
              </div>
            </div>
            <div className="flex bg-amber-50 text-amber-800 border border-amber-200 p-3 rounded-md text-xs gap-2 items-start mt-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <p>The fallback value is served to everyone immediately if the flag is disabled globally.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
