import { create } from 'zustand';
import { WhitelistRule, RuleType } from '../types/tracker';
import {
  getAppSettings,
  setAppSetting as dbSetAppSetting,
  getWhitelistRules,
  saveWhitelistRule,
  deleteWhitelistRule as dbDeleteWhitelistRule,
} from '../lib/db';
import { getCurrentLogicalDate } from '../lib/timeUtils';

interface ConfigState {
  rolloverTime: string; // e.g. "04:00"
  weekStartDay: number; // 1 = Monday, 0 = Sunday
  gracePeriodSec: number; // default 30
  dailyTarget: string; // default "6h"
  dDayText: string; // default "D-DAY"
  whitelistRules: WhitelistRule[];
  dayOffs: string[]; // List of logical dates ('YYYY-MM-DD') marked as Day Off
  isLoading: boolean;

  loadConfig: () => Promise<void>;
  setDailyTarget: (target: string) => Promise<void>;
  setDDayText: (text: string) => Promise<void>;
  setRolloverTime: (time: string) => Promise<void>;
  setWeekStartDay: (day: number) => Promise<void>;
  setGracePeriodSec: (seconds: number) => Promise<void>;
  addWhitelistRule: (ruleType: RuleType, pattern: string, subjectId?: string | null) => Promise<WhitelistRule>;
  deleteWhitelistRule: (id: string) => Promise<void>;
  toggleTodayDayOff: () => Promise<boolean>;
  toggleDateDayOff: (dateStr: string) => Promise<boolean>;
  isTodayDayOff: () => boolean;
  isDateDayOff: (dateStr: string) => boolean;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  rolloverTime: '04:00',
  weekStartDay: 1,
  gracePeriodSec: 30,
  dailyTarget: '6h',
  dDayText: 'D-DAY',
  whitelistRules: [],
  dayOffs: [],
  isLoading: false,

  loadConfig: async () => {
    set({ isLoading: true });
    try {
      const [settings, rules] = await Promise.all([
        getAppSettings(),
        getWhitelistRules(),
      ]);

      let parsedDayOffs: string[] = [];
      try {
        if (settings['day_offs']) {
          parsedDayOffs = JSON.parse(settings['day_offs']);
        }
      } catch (e) {
        console.error('Failed to parse day_offs setting:', e);
      }

      set({
        rolloverTime: settings['rollover_time'] || '04:00',
        weekStartDay: parseInt(settings['week_start_day'] || '1', 10),
        gracePeriodSec: parseInt(settings['grace_period_sec'] || '30', 10),
        dailyTarget: settings['daily_target'] || '6h',
        dDayText: settings['d_day'] || 'D-DAY',
        whitelistRules: rules,
        dayOffs: Array.isArray(parsedDayOffs) ? parsedDayOffs : [],
        isLoading: false,
      });
    } catch (err) {
      console.error('Error loading config:', err);
      set({ isLoading: false });
    }
  },

  setDailyTarget: async (target: string) => {
    await dbSetAppSetting('daily_target', target);
    set({ dailyTarget: target });
  },

  setDDayText: async (text: string) => {
    await dbSetAppSetting('d_day', text);
    set({ dDayText: text });
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

  toggleDateDayOff: async (dateStr: string) => {
    const { dayOffs } = get();
    const exists = dayOffs.includes(dateStr);
    const updated = exists ? dayOffs.filter((d) => d !== dateStr) : [...dayOffs, dateStr];
    await dbSetAppSetting('day_offs', JSON.stringify(updated));
    set({ dayOffs: updated });
    return !exists;
  },

  toggleTodayDayOff: async () => {
    const { rolloverTime, toggleDateDayOff } = get();
    const todayStr = getCurrentLogicalDate(rolloverTime);
    return toggleDateDayOff(todayStr);
  },

  isTodayDayOff: () => {
    const { rolloverTime, dayOffs } = get();
    const todayStr = getCurrentLogicalDate(rolloverTime);
    return dayOffs.includes(todayStr);
  },

  isDateDayOff: (dateStr: string) => {
    return get().dayOffs.includes(dateStr);
  },
}));
