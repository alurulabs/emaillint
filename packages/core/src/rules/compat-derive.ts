import type { FeatureData, DerivedCompat, ClientStatus, ClientSupport, Reference } from "../types/index.js";

const STATUS_MAP: Record<string, ClientSupport> = {
  y: "supported",
  n: "unsupported",
  a: "partial",
};

// Rank: higher = worse.
const RANK: Record<ClientSupport, number> = { unsupported: 3, partial: 2, supported: 1, unknown: 0 };

function splitStatus(raw: string): { status: ClientSupport; noteRef?: string } {
  const letter = raw.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const rest = raw.trim().split(/\s+/).slice(1);
  const noteRef = rest.join(" ").match(/#(\d+)/)?.[1];
  return { status: STATUS_MAP[letter] ?? "unknown", noteRef };
}

export function deriveSlug(data: FeatureData): DerivedCompat {
  const references: Reference[] = [
    { title: "Can I Email", url: `https://www.caniemail.com/features/${data.slug}/`, kind: "official" },
  ];
  const support: ClientStatus[] = [];
  for (const [client, platforms] of Object.entries(data.stats)) {
    for (const [platform, versions] of Object.entries(platforms)) {
      const keys = Object.keys(versions); // insertion order preserved
      const lastKey = keys[keys.length - 1];
      const { status, noteRef } = splitStatus(versions[lastKey]);
      const note = noteRef ? data.notesByNum[noteRef] : undefined;
      support.push({ client: `${client}-${platform}`, status, note });
    }
  }
  return { support, references, lastTested: data.lastTested };
}

export function mergeSlugs(derived: DerivedCompat[]): DerivedCompat {
  const byClient = new Map<string, ClientStatus>();
  const refSet = new Map<string, Reference>();
  let lastTested: string | undefined;
  for (const d of derived) {
    for (const r of d.references) refSet.set(r.url, r);
    for (const s of d.support) {
      const prev = byClient.get(s.client);
      if (!prev || RANK[s.status] > RANK[prev.status]) byClient.set(s.client, s);
    }
    if (d.lastTested && (!lastTested || d.lastTested < lastTested)) lastTested = d.lastTested;
  }
  return { support: [...byClient.values()], references: [...refSet.values()], lastTested };
}
