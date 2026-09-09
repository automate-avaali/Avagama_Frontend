// sessionStorage-backed cache for the RFP Creation page's shortlisted use cases.
//
// The list is small, changes rarely, and was previously re-fetched on every
// visit to the page — including the return trip from RFP Generation, and again
// after a browser refresh. Caching it per tab makes those navigations instant.
// sessionStorage's own lifetime (cleared when the tab closes) bounds how long a
// stale list can survive, and the TTL below bounds it further within a session.
//
// Nothing sensitive is stored: the cached rows are ids, titles, descriptions,
// company/industry and scores. The auth token stays where it already lives and
// is never copied in here.
//
// Every storage access is guarded. Private mode, disabled storage, corrupt JSON
// and quota-exceeded all degrade to "no cache", so callers simply fetch as they
// did before rather than seeing an exception.

const KEY_PREFIX = 'rfp:useCases';

// A cached list older than this is ignored, and the caller falls through to the
// API exactly as if nothing had been cached.
const TTL_MS = 15 * 60 * 1000;

export type CachedUseCase = Record<string, any>;

interface CacheEnvelope {
    savedAt: number;
    items: CachedUseCase[];
}

/**
 * The sessionStorage object, or null when it cannot be used. Reading the
 * property itself throws in some privacy configurations, so even that is
 * wrapped.
 */
function storage(): Storage | null {
    try {
        return window.sessionStorage || null;
    } catch {
        return null;
    }
}

/**
 * Storage key for the signed-in user. Scoping by account and organization means
 * switching either one never surfaces the previous one's list.
 *
 * The identifiers come from the `user` object already held in sessionStorage;
 * this adds no information that was not there before.
 */
function scopeKey(): string {
    const s = storage();
    if (!s) return `${KEY_PREFIX}:anon`;

    try {
        const raw = s.getItem('user');
        if (!raw) return `${KEY_PREFIX}:anon`;

        const user = JSON.parse(raw);
        const account = user?.email || 'anon';
        const org = user?.organization?._id || user?.organization?.name || 'no-org';
        return `${KEY_PREFIX}:${account}:${org}`;
    } catch {
        return `${KEY_PREFIX}:anon`;
    }
}

function readEnvelope(): CacheEnvelope | null {
    const s = storage();
    if (!s) return null;

    let raw: string | null = null;
    try {
        raw = s.getItem(scopeKey());
    } catch {
        return null;
    }
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        // A shape that is not what we wrote is treated as a miss rather than
        // being handed to the page as if it were a use case list.
        if (!parsed || typeof parsed !== 'object') return null;
        if (typeof parsed.savedAt !== 'number' || !Array.isArray(parsed.items)) return null;
        return parsed as CacheEnvelope;
    } catch {
        return null;
    }
}

function writeEnvelope(envelope: CacheEnvelope): void {
    const s = storage();
    if (!s) return;

    try {
        s.setItem(scopeKey(), JSON.stringify(envelope));
    } catch {
        // Quota exceeded or storage blocked. The page works without a cache, so
        // there is nothing to recover from here.
    }
}

/**
 * The list mixes company/domain use cases with evaluations, which identify
 * themselves differently — an evaluation row has no usecaseId of its own. Any
 * of the three ids a row can carry is accepted, so callers holding whichever
 * one they have still find their entry.
 */
function matchesId(item: CachedUseCase, id: string): boolean {
    return [item?.usecaseId, item?._id, item?.id]
        .some(value => value != null && String(value) === id);
}

/**
 * The cached list, or null when there is nothing usable — no entry, corrupt
 * data, storage unavailable, or older than the TTL. A null return always means
 * "fetch normally".
 */
export function get(): CachedUseCase[] | null {
    const envelope = readEnvelope();
    if (!envelope) return null;
    if (Date.now() - envelope.savedAt > TTL_MS) return null;
    return envelope.items;
}

/** Replaces the cached list and restarts its TTL. */
export function set(items: CachedUseCase[]): void {
    if (!Array.isArray(items)) return;
    writeEnvelope({ savedAt: Date.now(), items });
}

/**
 * Merges `patch` into the single cached entry matching `id`, leaving every
 * other entry untouched.
 *
 * The original savedAt is preserved: a granular edit corrects one row, and must
 * not extend how long the rest of the list is considered fresh.
 *
 * A no-op when there is no cache — a mutation is not a reason to create one.
 */
export function updateOne(id: string, patch: Record<string, any>): void {
    if (!id || !patch) return;

    const envelope = readEnvelope();
    if (!envelope) return;

    const target = String(id);
    let changed = false;

    const items = envelope.items.map(item => {
        if (!matchesId(item, target)) return item;
        changed = true;
        return { ...item, ...patch };
    });

    if (!changed) return;
    writeEnvelope({ savedAt: envelope.savedAt, items });
}

/** Drops the cached list, so the next read is a miss. */
export function clear(): void {
    const s = storage();
    if (!s) return;

    try {
        s.removeItem(scopeKey());
    } catch {
        // A failed clear only means the next read may still hit the old entry,
        // which the TTL retires anyway.
    }
}

export default { get, set, updateOne, clear };
