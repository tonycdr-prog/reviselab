import { NextResponse } from "next/server";
import { brandConfig } from "@reviselab/core";

import { readJsonObject } from "@/app/api/_helpers/read-json-object";
import { createExtensionPairing } from "@/lib/reviews/extension-review";

export async function POST(request: Request) {
  const body = await readJsonObject<{
    pairingCode?: string;
  }>(request);

  if (!body) {
    return NextResponse.json(
      { error: "Pairing body is invalid JSON." },
      { status: 400 },
    );
  }

  const pairingCode = body.pairingCode?.trim().toUpperCase();

  if (!pairingCode) {
    return NextResponse.json(
      { error: "Pairing code is required." },
      { status: 400 },
    );
  }

  try {
    const token = await createExtensionPairing(pairingCode);

    return NextResponse.json({
      token,
      extensionDisplayName: brandConfig.extensionDisplayName,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Pairing failed.",
      },
      { status: 400 },
    );
  }
}
