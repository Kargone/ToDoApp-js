// Pure helpers for the keyed Firebase layout. No DOM or SDK access, so they can be unit-tested with `node --test`.
//
// users/{uid}/
//   schemaVersion: 2
//   tasks/{key}:    task fields (the key is the task's id)
//   projects/{key}: { name, parentId? }
//   archive/{key}:  task fields + archivedOn, never loaded during normal use

export const SCHEMA_VERSION = 2;

// Characters Firebase does not allow in a key.
export function isValidKey(key) {
    return typeof key === 'string' && key.length > 0 && key.length <= 768 && !/[.#$[\]/\u0000-\u001f\u007f]/.test(key);
}

// What Firebase would hand back for a value: no undefined, null, empty arrays or empty objects.
function prune(value) {
    if (Array.isArray(value)) {
        const items = value.map(prune).filter((item) => item !== undefined);
        return items.length ? items : undefined;
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value)
            .map(([key, item]) => [key, prune(item)])
            .filter(([, item]) => item !== undefined);
        return entries.length ? Object.fromEntries(entries) : undefined;
    }
    return value === null || value === undefined ? undefined : value;
}

// The stored form of an in-memory record: the id moves into the key.
export function toStored(item) {
    const { id, ...fields } = item;
    return prune(fields) || {};
}

// Key-order-independent JSON, so a record read back from Firebase compares equal to the one written.
export function stableStringify(value) {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    if (value && typeof value === 'object') {
        return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    }
    return JSON.stringify(value);
}

// In-memory records from a stored collection ({ key: fields }), each carrying its key as id.
export function fromStored(collection) {
    if (!collection || typeof collection !== 'object') return [];
    return Object.entries(collection)
        .filter(([, fields]) => fields && typeof fields === 'object')
        .map(([key, fields]) => ({ ...fields, id: key }));
}

// Fingerprint of each record by id, used to tell which records changed since the last sync.
export function fingerprint(items) {
    return new Map(items.map((item) => [item.id, stableStringify(toStored(item))]));
}

// Multi-path update for one collection: changed records are written whole, removed ones set to null.
export function diffCollection(collectionName, previous, items) {
    const next = fingerprint(items);
    const updates = {};
    next.forEach((print, id) => {
        if (previous.get(id) !== print) updates[`${collectionName}/${id}`] = JSON.parse(print);
    });
    previous.forEach((print, id) => {
        if (!next.has(id)) updates[`${collectionName}/${id}`] = null;
    });
    return { updates, next };
}

// Old layout stored tasks and projects as arrays. Existing ids become keys (other records point at them
// through projectId, parentId and undo.templateId). A record without a usable id keeps its object key when it
// has a real one (not an array index); anything else, or a repeat, gets a fresh key.
export function migrateCollection(legacy, createKey) {
    const entries = Array.isArray(legacy) ? legacy.map((item) => [null, item]) : Object.entries(legacy || {});
    const collection = {};
    entries.forEach(([existingKey, item]) => {
        if (!item || typeof item !== 'object') return;
        const candidates = [item.id, existingKey && !/^\d+$/.test(existingKey) ? existingKey : null];
        const key = candidates.find((candidate) => isValidKey(candidate) && !(candidate in collection)) || createKey();
        collection[key] = toStored(item);
    });
    return collection;
}

export const ARCHIVE_AFTER_YEARS = 1;

function yearsBefore(todayIso, years) {
    const [year, rest] = [Number(todayIso.slice(0, 4)), todayIso.slice(4)];
    return `${year - years}${rest}`;
}

// When a completed record was finished. Records from before completedOn existed fall back to their own date.
export function completionDate(item) {
    return item.completedOn || (item.type === 'event' ? item.startDate : item.dueDate) || item.startDate || '';
}

// Completed records finished more than a year ago. Open records are never archived, however old.
export function selectArchivable(items, todayIso) {
    const cutoff = yearsBefore(todayIso, ARCHIVE_AFTER_YEARS);
    return items.filter((item) => {
        if (!item.completed || item.isVirtual) return false;
        const finished = completionDate(item);
        return Boolean(finished) && finished < cutoff;
    });
}

// One atomic update that moves records into the archive and out of the task list.
export function buildArchiveUpdates(items, todayIso) {
    const updates = {};
    items.forEach((item) => {
        updates[`archive/${item.id}`] = { ...toStored(item), archivedOn: todayIso };
        updates[`tasks/${item.id}`] = null;
    });
    return updates;
}
