// Pure helpers for the project tree. No DOM access, so they can be unit-tested with `node --test`.
// A project is { id, name, parentId, order? }; a parentId that names no existing project counts as top level.
// Siblings with an order (set by dragging) come first in that order; the rest follow alphabetically.

function resolveParentId(project, ids) {
    return project.parentId && ids.has(project.parentId) ? project.parentId : null;
}

export function getChildProjects(projects, parentId = null) {
    const ids = new Set(projects.map((project) => project.id));
    return projects
        .filter((project) => resolveParentId(project, ids) === parentId)
        .sort((a, b) => compareOrder(a.order, b.order) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

// Ascending by a manual order, with unordered (missing) values after every ordered one.
export function compareOrder(a, b) {
    const aKey = Number.isFinite(a) ? a : Infinity;
    const bKey = Number.isFinite(b) ? b : Infinity;
    return aKey === bKey ? 0 : aKey < bKey ? -1 : 1;
}

// The ids with movedId taken out and put back in front of beforeId (or at the end when beforeId is null or absent).
export function placeId(ids, movedId, beforeId) {
    const rest = ids.filter((id) => id !== movedId);
    const index = beforeId == null ? -1 : rest.indexOf(beforeId);
    rest.splice(index === -1 ? rest.length : index, 0, movedId);
    return rest;
}

// Moves a project under parentId (null for top level), in front of the sibling beforeId or last, and renumbers
// that level's order. Returns the same array when the move would put a project inside itself.
export function moveProjectTo(projects, projectId, parentId, beforeId = null) {
    if (parentId === projectId || (parentId && getDescendantIds(projects, projectId).includes(parentId))) return projects;
    const siblingIds = getChildProjects(projects, parentId).map((project) => project.id);
    const orderById = new Map(placeId(siblingIds, projectId, beforeId).map((id, index) => [id, index]));
    return projects.map((project) => {
        if (!orderById.has(project.id)) return project;
        const next = { ...project, order: orderById.get(project.id) };
        if (project.id === projectId) next.parentId = parentId;
        return next;
    });
}

export function getDescendantIds(projects, projectId) {
    const descendants = [];
    const visit = (parentId) => {
        getChildProjects(projects, parentId).forEach((project) => {
            descendants.push(project.id);
            visit(project.id);
        });
    };
    visit(projectId);
    return descendants;
}

// Depth-first, in sibling order within each level: what a picker or the tree shows, top to bottom.
export function flattenProjects(projects) {
    const flat = [];
    const visit = (parentId, depth, path) => {
        getChildProjects(projects, parentId).forEach((project) => {
            const projectPath = [...path, project.name];
            flat.push({ project, depth, path: projectPath });
            visit(project.id, depth + 1, projectPath);
        });
    };
    visit(null, 0, []);
    return flat;
}

export function hasDate(item) {
    return item.type === 'event' || !item.noDue;
}

// Project tasks stay out of the date tabs unless they have a date and were opted in.
export function isHiddenFromDateTabs(item, projectIds) {
    if (!item.projectId || !projectIds.has(item.projectId)) return false;
    return !hasDate(item) || !item.inDateTabs;
}
