import { crc32 } from "node:zlib";

function makeZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const [fileName, content] of Object.entries(entries)) {
    const name = Buffer.from(fileName);
    const data = Buffer.from(content);
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + data.length;
  }

  const centralSize = centralParts.reduce(
    (total, part) => total + part.length,
    0,
  );
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

export function makeLatexZip() {
  return makeZip({
    "main.tex": String.raw`\documentclass{article}
\title{A Novel Benchmark for Retrieval-Augmented Review Assistants}
\begin{document}
\maketitle
\begin{abstract}
We propose a groundbreaking retrieval augmented review assistant for scientific writing. The benchmark compares category fit, tone calibration, and policy-aware revision suggestions across realistic abstract editing tasks. Results show targeted review signals improve clarity without changing the paper's core claims.
\end{abstract}
\section{Introduction}
This work studies review readiness for scientific preprints before submission.
\end{document}
`,
  });
}

export function makePdf() {
  return Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 68 >>
stream
BT /F1 12 Tf 72 720 Td (ReviseLab smoke test manuscript abstract.) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000204 00000 n
trailer
<< /Root 1 0 R /Size 5 >>
startxref
321
%%EOF
`);
}

export async function uploadSource(env, path, body, contentType) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/paper-sources/${encodedPath}`,
    {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": contentType,
        "x-upsert": "false",
      },
      body,
    },
  );

  if (!response.ok) {
    throw new Error(`Storage upload failed with ${response.status}.`);
  }
}

export async function deleteSource(env, path) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/paper-sources/${encodedPath}`,
      {
        method: "DELETE",
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );

    if (!response.ok && response.status !== 404) {
      console.warn(`Storage cleanup returned ${response.status}.`);
    }
  } catch (error) {
    console.warn(
      error instanceof Error
        ? `Storage cleanup failed: ${error.message}`
        : "Storage cleanup failed.",
    );
  }
}
