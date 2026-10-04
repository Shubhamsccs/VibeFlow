import React, { useState } from 'react';
import { X, Plus, Trash2, Shield, Globe, Terminal } from 'lucide-react';
import { useConfigStore } from '../../store/useConfigStore';
import { useSubjectStore } from '../../store/useSubjectStore';
import { RuleType } from '../../types/tracker';

interface WhitelistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhitelistModal: React.FC<WhitelistModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { whitelistRules, addWhitelistRule, deleteWhitelistRule } = useConfigStore();
  const { subjects } = useSubjectStore();

  const [ruleType, setRuleType] = useState<RuleType>('process');
  const [pattern, setPattern] = useState('');
  const [subjectId, setSubjectId] = useState<string>('global');
  const [error, setError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pattern.trim()) {
      setError('Please specify an executable name or window title keyword');
      return;
    }
    const finalSubjectId = subjectId === 'global' ? null : subjectId;
    await addWhitelistRule(ruleType, pattern.trim(), finalSubjectId);
    setPattern('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Whitelist Rules</h3>
              <p className="text-xs text-slate-400">
                Define allowed applications and learning portal keywords
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Rules List */}
        <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-1 custom-scrollbar">
          {whitelistRules.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500">
              No whitelist rules configured yet.
            </div>
          ) : (
            whitelistRules.map((rule) => {
              const ruleSubject = subjects.find((s) => s.id === rule.subject_id);
              return (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                      {rule.rule_type === 'process' ? (
                        <Terminal className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Globe className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-white">
                          {rule.pattern}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-400">
                          {rule.rule_type === 'process' ? 'Process' : 'Title Keyword'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {ruleSubject ? `Bound to: ${ruleSubject.name}` : 'Global Rule (All Subjects)'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteWhitelistRule(rule.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Add New Rule Form */}
        <form onSubmit={handleAdd} className="pt-4 border-t border-white/5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Rule Type
              </label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as RuleType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm text-white outline-none focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="process">Executable (.exe)</option>
                <option value="window_title">Browser Title Keyword</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Applicable Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-sm text-white outline-none focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="global">Global (All Subjects)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Pattern / Match String
            </label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => {
                setPattern(e.target.value);
                if (error) setError('');
              }}
              placeholder={
                ruleType === 'process'
                  ? 'e.g. code.exe, pycharm64.exe, notion.exe'
                  : 'e.g. Khan Academy, LeetCode, Coursera, Excalidraw'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors font-mono"
            />
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            Add Whitelist Rule
          </button>
        </form>
      </div>
    </div>
  );
};
