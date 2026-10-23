import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getChildProjects, getDescendantIds, flattenProjects, isHiddenFromDateTabs } from '../project-logic.mjs';

const projects = [
    { id: 'w', name: 'Work', parentId: null },
    { id: 'h', name: 'home', parentId: null },
    { id: 'b', name: 'Client B', parentId: 'w' },
    { id: 'a', name: 'Client A', parentId: 'w' },
    { id: 'a1', name: 'Contract', parentId: 'a' },
    { id: 'o', name: 'Orphan', parentId: 'gone' },
];

test('getChildProjects sorts by name and treats missing parents as top level', () => {
    assert.deepEqual(getChildProjects(projects).map((p) => p.id), ['h', 'o', 'w']);
    assert.deepEqual(getChildProjects(projects, 'w').map((p) => p.id), ['a', 'b']);
    assert.deepEqual(getChildProjects(projects, 'h'), []);
});

test('getDescendantIds walks every level', () => {
    assert.deepEqual(getDescendantIds(projects, 'w'), ['a', 'a1', 'b']);
    assert.deepEqual(getDescendantIds(projects, 'a1'), []);
});

test('flattenProjects gives depth and path in tree order', () => {
    assert.deepEqual(
        flattenProjects(projects).map(({ project, depth, path }) => [project.id, depth, path.join(' › ')]),
        [
            ['h', 0, 'home'],
            ['o', 0, 'Orphan'],
            ['w', 0, 'Work'],
            ['a', 1, 'Work › Client A'],
            ['a1', 2, 'Work › Client A › Contract'],
            ['b', 1, 'Work › Client B'],
        ]
    );
});

test('isHiddenFromDateTabs', () => {
    const ids = new Set(['w']);
    assert.equal(isHiddenFromDateTabs({ dueDate: '2026-10-20' }, ids), false);
    assert.equal(isHiddenFromDateTabs({ projectId: 'w', dueDate: '2026-10-20' }, ids), true);
    assert.equal(isHiddenFromDateTabs({ projectId: 'w', dueDate: '2026-10-20', inDateTabs: true }, ids), false);
    assert.equal(isHiddenFromDateTabs({ projectId: 'w', noDue: true, inDateTabs: true }, ids), true);
    assert.equal(isHiddenFromDateTabs({ projectId: 'w', type: 'event', startDate: '2026-10-20', inDateTabs: true }, ids), false);
    // A task whose project was deleted elsewhere falls back to the date tabs.
    assert.equal(isHiddenFromDateTabs({ projectId: 'gone', dueDate: '2026-10-20' }, ids), false);
});
