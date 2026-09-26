import { create } from 'zustand';
import { WhitelistRule, RuleType } from '../types/tracker';
import {
  getAppSettings,
  setAppSetting as dbSetAppSetting,
  getWhitelistRules,
  saveWhitelistRule,
  deleteWhitelistRule as dbDeleteWhitelistRule,
} from '../lib/db';

interface ConfigState {
  rolloverTime: string; // e.g. "04:00"
  weekStartDay: number; // 1 = Monday, 0 = Sunday
  gracePeriodSec: number; // default 30
  whitelistRules: WhitelistRule[];
  isLoading: boolean;

  loadConfig: () => Promise<void>;
  setRolloverTime: (time: string) => Promise<void>;
  setWeekStartDay: (day: number) => Promise<void>;
  setGracePeriodSec: (seconds: number) => Promise<void>;
  addWhitelistRule: (ruleType: RuleType, pattern: string, subjectId?: string | null) => Promise<WhitelistRule>;
  deleteWhitelistRule: (id: string) => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  rolloverTime: '04:00',
  weekStartDay: 1,
  gracePeriodSec: 30,
  whitelistRules: [],
  isLoading: false,

  loadConfig: async () => {
    set({ isLoading: true });
    try {
      const [settings, rules] = await Promise.all([
        getAppSettings(),
        getWhitelistRules(),
      ]);

      set({
        rolloverTime: settings['rollover_time'] || '04:00',
        weekStartDay: parseInt(settings['week_start_day'] || '1', 10),
        gracePeriodSec: parseInt(settings['grace_period_sec'] || '30', 10),
        whitelistRules: rules,
        isLoading: false,
      });
    } catch (err) {
      console.error('Error loading config:', err);
      set({ isLoading: false });
    }
  },

  setRolloverTime: async (time: string) => {
    await dbSetAppSetting('rollover_time', time);
    set({ rolloverTime: time });
  },

  setWeekStartDay: async (day: number) => {
    await dbSetAppSetting('week_start_day', day.toString());
    set({ weekStartDay: day });
  },

  setGracePeriodSec: async (seconds: number) => {
    await dbSetAppSetting('grace_period_sec', seconds.toString());
    set({ gracePeriodSec: seconds });
  },

  addWhitelistRule: async (ruleType: RuleType, pattern: string, subjectId: string | null = null) => {
    const newRule: WhitelistRule = {
      id: 'rule_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      subject_id: subjectId,
      rule_type: ruleType,
      pattern: pattern.trim(),
    };
    await saveWhitelistRule(newRule);
    set((state) => ({
      whitelistRules: [...state.whitelistRules, newRule],
    }));
    return newRule;
  },

  deleteWhitelistRule: async (id: string) => {
    await dbDeleteWhitelistRule(id);
    set((state) => ({
      whitelistRules: state.whitelistRules.filter((r) => r.id !== id),
    }));
  },
}));
