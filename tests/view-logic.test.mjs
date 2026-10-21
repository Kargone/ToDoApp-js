import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    toIsoDate,
    isOverdue,
    formatTimeCell,
    showsInDateTab,
    resolveTheme,
    shouldOpenSheetOnKey,
} from '../view-logic.mjs';

// Tue Oct 20 2026, 14:00 local
const now = new Date(2026, 9, 20, 14, 0);

test('toIsoDate formats a local date', () => {
    assert.equal(toIsoDate(now), '2026-10-20');
});

test('isOverdue', () => {
    assert.equal(isOverdue({ dueDate: '2026-10-19' }, now), true);
    assert.equal(isOverdue({ dueDate: '2026-10-20', dueTime: '13:59' }, now), true);
    assert.equal(isOverdue({ dueDate: '2026-10-20', dueTime: '14:30' }, now), false);
    assert.equal(isOverdue({ dueDate: '2026-10-20' }, now), false);
    assert.equal(isOverdue({ noDue: true }, now), false);
    assert.equal(isOverdue({ dueDate: '2026-10-19', completed: true }, now), false);
    assert.equal(isOverdue({ type: 'event', startDate: '2026-10-20', startTime: '09:00' }, now), true);
});

test('formatTimeCell', () => {
    assert.equal(formatTimeCell({ dueDate: '2026-10-20', dueTime: '18:30' }, now), '18:30');
    assert.equal(formatTimeCell({ dueDate: '2026-10-19' }, now), 'MON');
    assert.equal(formatTimeCell({ dueDate: '2026-10-26' }, now), 'MON');
    assert.equal(formatTimeCell({ dueDate: '2026-10-27' }, now), 'OCT 27');
    assert.equal(formatTimeCell({ dueDate: '2026-10-13' }, now), 'OCT 13');
    assert.equal(formatTimeCell({ dueDate: '2026-10-20' }, now), '—');
    assert.equal(formatTimeCell({ noDue: true }, now), '—');
});

test('showsInDateTab', () => {
    assert.equal(showsInDateTab({}, '2026-10-20'), true);
    assert.equal(showsInDateTab({ completed: true }, '2026-10-20'), false);
    assert.equal(showsInDateTab({ completed: true, completedOn: '2026-10-20' }, '2026-10-20'), true);
    assert.equal(showsInDateTab({ completed: true, completedOn: '2026-10-20', dismissed: true }, '2026-10-20'), false);
    assert.equal(showsInDateTab({ completed: true, completedOn: '2026-10-19' }, '2026-10-20'), false);
});

test('resolveTheme', () => {
    assert.equal(resolveTheme('dark', false), 'dark');
    assert.equal(resolveTheme(null, true), 'dark');
    assert.equal(resolveTheme('purple', false), 'light');
    assert.equal(resolveTheme(undefined, false), 'light');
});

test('shouldOpenSheetOnKey', () => {
    assert.equal(shouldOpenSheetOnKey({ key: 'n', target: { tagName: 'BODY' } }), true);
    assert.equal(shouldOpenSheetOnKey({ key: 'N', target: { tagName: 'DIV' } }), true);
    assert.equal(shouldOpenSheetOnKey({ key: 'n', target: { tagName: 'INPUT' } }), false);
    assert.equal(shouldOpenSheetOnKey({ key: 'n', ctrlKey: true, target: { tagName: 'BODY' } }), false);
    assert.equal(shouldOpenSheetOnKey({ key: 'n', target: { tagName: 'DIV', isContentEditable: true } }), false);
    assert.equal(shouldOpenSheetOnKey({ key: 'm', target: { tagName: 'BODY' } }), false);
});
