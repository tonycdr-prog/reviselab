import { useEffect, useState } from "react";

import { brandConfig } from "@reviselab/core";
import {
  Button,
  InlineLoading,
  InlineNotification,
  TextInput,
  Theme,
  Tile,
} from "@reviselab/ui/carbon";

import { exchangePairingCode } from "../lib/review-client";
import { getSettings, saveSettings } from "../lib/settings";

export function OptionsApp() {
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:3000");
  const [pairingCode, setPairingCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<"saving" | "pairing" | null>(
    null,
  );
  const [isBootstrappingSettings, setIsBootstrappingSettings] = useState(true);
  const canPair = pairingCode.trim().length > 0;

  function handleApiBaseUrlChange(value: string) {
    setApiBaseUrl(value);
    setError(null);
    setStatus(null);
  }

  function handlePairingCodeChange(value: string) {
    setPairingCode(value);
    setError(null);
    setStatus(null);
  }

  useEffect(() => {
    let isMounted = true;

    getSettings()
      .then((settings) => {
        if (!isMounted) {
          return;
        }

        setApiBaseUrl(settings.apiBaseUrl);
        setPairingCode(settings.pairingCode);
        setIsBootstrappingSettings(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setError("Unable to load extension settings.");
        setIsBootstrappingSettings(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave() {
    if (activeTask) {
      return;
    }

    setStatus(null);
    setError(null);
    setActiveTask("saving");

    try {
      const saved = await saveSettings({
        apiBaseUrl,
        pairingCode,
      });
      setApiBaseUrl(saved.apiBaseUrl);
      setPairingCode(saved.pairingCode);
      setStatus("Settings saved.");
      setError(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save settings.",
      );
      setStatus(null);
    } finally {
      setActiveTask(null);
    }
  }

  async function handlePair() {
    if (activeTask) {
      return;
    }

    setStatus(null);
    setError(null);
    setActiveTask("pairing");

    try {
      const saved = await saveSettings({
        apiBaseUrl,
        pairingCode,
      });
      setApiBaseUrl(saved.apiBaseUrl);
      setPairingCode(saved.pairingCode);
      await exchangePairingCode();
      setPairingCode("");
      setStatus("Extension paired.");
      setError(null);
    } catch (pairingError) {
      setError(
        pairingError instanceof Error
          ? pairingError.message
          : "Pairing failed.",
      );
      setStatus(null);
    } finally {
      setActiveTask(null);
    }
  }

  return (
    <Theme theme="white">
      <main className="rl-extension-root">
        <div className="cds--content rl-extension-section">
          <Tile className="rl-extension-section">
            <h1>{brandConfig.extensionDisplayName}</h1>
            <p>
              Connect the Overleaf companion to your running {brandConfig.name}{" "}
              workspace so it can submit selection reviews.
            </p>

            {status ? (
              <InlineNotification
                lowContrast
                kind="success"
                title="Ready"
                subtitle={status}
              />
            ) : null}

            {error ? (
              <InlineNotification
                lowContrast
                kind="error"
                title="Problem"
                subtitle={error}
              />
            ) : null}

            {activeTask ? (
              <InlineLoading
                status="active"
                description={
                  activeTask === "pairing"
                    ? "Pairing the extension"
                    : "Saving extension settings"
                }
              />
            ) : isBootstrappingSettings ? (
              <InlineLoading
                status="active"
                description="Loading extension settings"
              />
            ) : null}

            <TextInput
              id="apiBaseUrl"
              labelText={`${brandConfig.name} base URL`}
              helperText="Use the running web app origin for your local or deployed ReviseLab workspace."
              type="url"
              value={apiBaseUrl}
              disabled={activeTask !== null || isBootstrappingSettings}
              onChange={(event) =>
                handleApiBaseUrlChange(event.currentTarget.value)
              }
            />

            <TextInput
              id="pairingCode"
              labelText="Pairing code"
              helperText="Paste the short-lived pairing code from the dashboard."
              value={pairingCode}
              disabled={activeTask !== null || isBootstrappingSettings}
              onChange={(event) =>
                handlePairingCodeChange(event.currentTarget.value)
              }
            />

            <div className="rl-extension-actions">
              <Button
                onClick={handleSave}
                kind="secondary"
                disabled={activeTask !== null || isBootstrappingSettings}
              >
                Save settings
              </Button>
              <Button
                onClick={handlePair}
                disabled={
                  activeTask !== null || isBootstrappingSettings || !canPair
                }
              >
                Pair extension
              </Button>
            </div>
          </Tile>
        </div>
      </main>
    </Theme>
  );
}
