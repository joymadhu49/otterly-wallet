import browser from 'webextension-polyfill';
import { keyringService } from './keyring/keyringService';
import { DEFAULT_AUTOLOCK_MIN } from '../constants/chain';

const ALARM = 'arc:autolock';
const SETTINGS_KEY = 'arc:settings';

type Settings = { autolockMinutes: number };

export async function getSettings(): Promise<Settings> {
  const data = await browser.storage.local.get(SETTINGS_KEY);
  return data[SETTINGS_KEY] || { autolockMinutes: DEFAULT_AUTOLOCK_MIN };
}

export async function setSettings(s: Partial<Settings>): Promise<Settings> {
  const cur = await getSettings();
  const next = { ...cur, ...s };
  await browser.storage.local.set({ [SETTINGS_KEY]: next });
  await rearmAutolock();
  return next;
}

export async function rearmAutolock(): Promise<void> {
  const { autolockMinutes } = await getSettings();
  try {
    await browser.alarms.clear(ALARM);
    if (autolockMinutes > 0) {
      browser.alarms.create(ALARM, { delayInMinutes: autolockMinutes });
    }
  } catch {
    // alarms unavailable
  }
}

export function bindAutolock(): void {
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM) {
      await keyringService.lock();
    }
  });
  browser.idle.setDetectionInterval(60);
  browser.idle.onStateChanged.addListener(async (state) => {
    if (state === 'locked') {
      await keyringService.lock();
    }
  });
}

export function touchActivity(): void {
  rearmAutolock();
}
