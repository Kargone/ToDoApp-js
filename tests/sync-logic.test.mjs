import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    isValidKey,
    toStored,
    stableStringify,
    fromStored,
    fingerprint,
    diffCollection,
    migrateCollection,
    selectArchivable,
    buildArchiveUpdates,
} from '../sync-logic.mjs';

test('isValidKey', () => {
    assert.equal(isValidKey('1783044546776-bc2081493562e8'), true);
    assert.equal(isValidKey('-NvX3abc_Z'), true);
    assert.equal(isValidKey(''), false);
    assert.equal(isValidKey('a.b'), false);
    assert.equal(isValidKey('a/b'), false);
    assert.equal(isValidKey(undefined), false);
});

test('toStored drops the id and what Firebase would drop', () => {
    assert.deepEqual(
        toStored({ id: 'x', text: 'A', completed: false, dueTime: '', repeatRule: null, undo: undefined, projectId: undefined, rule: { daysOfWeek: [], interval: 1 } }),
        { text: 'A', completed: false, dueTime: '', rule: { interval: 1 } }
    );
});

test('stableStringify ignores key order', () => {
    assert.equal(stableStringify({ b: 1, a: [2, { d: 3, c: 4 }] }), stableStringify({ a: [2, { c: 4, d: 3 }], b: 1 }));
});

test('fromStored puts keys back as ids', () => {
    assert.deepEqual(fromStored({ k1: { text: 'A' }, k2: null }), [{ text: 'A', id: 'k1' }]);
    assert.deepEqual(fromStored(null), []);
});

test('diffCollection writes only changed records and nulls removed ones', () => {
    const before = fingerprint([{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }]);
    const { updates, next } = diffCollection('tasks', before, [{ id: 'a', text: 'A' }, { id: 'b', text: 'B2' }, { id: 'd', text: 'D' }]);
    assert.deepEqual(updates, { 'tasks/b': { text: 'B2' }, 'tasks/d': { text: 'D' }, 'tasks/c': null });
    assert.deepEqual([...next.keys()], ['a', 'b', 'd']);
});

test('diffCollection treats a Firebase round trip as unchanged', () => {
    const local = [{ id: 'a', text: 'A', repeatRule: null, rule: { daysOfMonth: [] }, isVirtual: false }];
    const roundTrip = fromStored({ a: JSON.parse(JSON.stringify(toStored(local[0]))) });
    assert.deepEqual(diffCollection('tasks', fingerprint(roundTrip), local).updates, {});
});

test('migrateCollection keeps valid ids as keys and re-keys the rest', () => {
    let n = 0;
    const createKey = () => `new${++n}`;
    const migrated = migrateCollection([
        { id: 't1', text: 'A' },
        { id: 't1', text: 'dup' },
        { id: 'bad.id', text: 'B' },
        { text: 'no id' },
        null,
    ], createKey);
    assert.deepEqual(migrated, { t1: { text: 'A' }, new1: { text: 'dup' }, new2: { text: 'B' }, new3: { text: 'no id' } });

    // A sparse array comes back from Firebase as an object with index keys; keyed data keeps its keys.
    assert.deepEqual(migrateCollection({ 0: { id: 'a', text: 'A' }, 2: { text: 'B' }, '-Nk': { text: 'C' } }, createKey),
        { a: { text: 'A' }, new4: { text: 'B' }, '-Nk': { text: 'C' } });
});

test('selectArchivable takes completed records finished over a year ago', () => {
    const items = [
        { id: 'old', completed: true, completedOn: '2025-10-26' },
        { id: 'edge', completed: true, completedOn: '2025-10-27' },
        { id: 'recent', completed: true, completedOn: '2026-01-01' },
        { id: 'fallback', completed: true, dueDate: '2024-03-01' },
        { id: 'event', completed: true, type: 'event', startDate: '2024-03-01' },
        { id: 'open-old', completed: false, dueDate: '2020-01-01' },
        { id: 'undated', completed: true },
    ];
    assert.deepEqual(selectArchivable(items, '2026-10-27').map((item) => item.id), ['old', 'fallback', 'event']);
});

test('buildArchiveUpdates moves records in one update', () => {
    assert.deepEqual(buildArchiveUpdates([{ id: 'a', text: 'A', completed: true }], '2026-10-27'), {
        'archive/a': { text: 'A', completed: true, archivedOn: '2026-10-27' },
        'tasks/a': null,
    });
});
