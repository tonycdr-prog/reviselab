"use client";

import { useState } from "react";

import {
  Button,
  CodeSnippet,
  InlineLoading,
  InlineNotification,
  Tile,
} from "@reviselab/ui/carbon";

type PairingResponse = {
  code: string;
  expiresAt: string;
};

export function ExtensionPairingTile() {
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreatePairingCode() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/extension/auth/pairing-code", {
        method: "POST",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Unable to create pairing code.");
      }

      const data = (await response.json()) as PairingResponse;
      setPairingCode(data.code);
      setExpiresAt(data.expiresAt);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to create pairing code.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Tile className="rl-section">
      <h3>Overleaf pairing</h3>
      <p className="rl-muted">
        Generate a short-lived pairing code, then paste it into the ReviseLab
        Overleaf extension settings.
      </p>

      {error ? (
        <InlineNotification
          lowContrast
          kind="error"
          title="Pairing problem"
          subtitle={error}
        />
      ) : null}

      {pairingCode ? (
        <div className="rl-section">
          <CodeSnippet type="single">{pairingCode}</CodeSnippet>
          <p className="rl-muted">Expires at {expiresAt}</p>
        </div>
      ) : null}

      {isLoading ? (
        <InlineLoading
          description="Creating a fresh pairing code"
          status="active"
        />
      ) : null}

      <Button
        type="button"
        kind="secondary"
        disabled={isLoading}
        onClick={handleCreatePairingCode}
      >
        {pairingCode ? "Create a fresh pairing code" : "Create pairing code"}
      </Button>
    </Tile>
  );
}
