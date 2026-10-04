import React from 'react';

export const GroupsView: React.FC = () => {
  return (
    <div className="w-full flex flex-col py-12 items-center justify-center text-center">
      <div className="max-w-md p-8 rounded-3xl border border-white/5 bg-slate-900/20 space-y-3">
        <h3 className="font-serif text-lg text-slate-300">Groups</h3>
        <p className="text-xs text-slate-500">
          No groups added yet.
        </p>
      </div>
    </div>
  );
};
