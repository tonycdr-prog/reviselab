import { browser } from "wxt/browser";

export type ExtensionSettings = {
  apiBaseUrl: string;
  pairingCode: string;
  pairedToken: string;
};

const DEFAULT_SETTINGS: ExtensionSettings = {
  apiBaseUrl: "http://localhost:3000",
  pairingCode: "",
  pairedToken: "",
};

function normalizeApiBaseUrl(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return DEFAULT_SETTINGS.apiBaseUrl;
  }

  return trimmed.replace(/\/+$/, "");
}

function normalizePairingCode(value: string | undefined) {
  return value?.trim().toUpperCase() ?? DEFAULT_SETTINGS.pairingCode;
}

function normalizePairedToken(value: string | undefined) {
  return value?.trim() ?? DEFAULT_SETTINGS.pairedToken;
}

export async function getSettings(): Promise<ExtensionSettings> {
  const stored = (await browser.storage.sync.get(
    DEFAULT_SETTINGS,
  )) as Partial<ExtensionSettings>;

  return {
    apiBaseUrl: normalizeApiBaseUrl(stored.apiBaseUrl),
    pairingCode: normalizePairingCode(stored.pairingCode),
    pairedToken: normalizePairedToken(stored.pairedToken),
  };
}

export async function saveSettings(
  nextSettings: Partial<ExtensionSettings>,
): Promise<ExtensionSettings> {
  const current = await getSettings();
  const nextApiBaseUrl =
    nextSettings.apiBaseUrl === undefined
      ? current.apiBaseUrl
      : normalizeApiBaseUrl(nextSettings.apiBaseUrl);
  const nextPairingCode =
    nextSettings.pairingCode === undefined
      ? current.pairingCode
      : normalizePairingCode(nextSettings.pairingCode);
  const shouldResetPairing = nextApiBaseUrl !== current.apiBaseUrl;
  const merged = {
    ...current,
    ...nextSettings,
    apiBaseUrl: nextApiBaseUrl,
    pairingCode: nextPairingCode,
    pairedToken:
      nextSettings.pairedToken !== undefined
        ? normalizePairedToken(nextSettings.pairedToken)
        : shouldResetPairing
          ? DEFAULT_SETTINGS.pairedToken
          : current.pairedToken,
  };
  await browser.storage.sync.set(merged);
  return merged;
}
