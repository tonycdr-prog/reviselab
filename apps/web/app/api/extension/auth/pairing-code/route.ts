import { NextResponse } from "next/server";

import { createExtensionPairingCode } from "@/lib/reviews/extension-review";

export async function POST() {
  try {
    const pairing = await createExtensionPairingCode();
    return NextResponse.json(pairing);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create pairing.",
      },
      { status: 400 },
    );
  }
}
