// Pure helpers for the project tree. No DOM access, so they can be unit-tested with `node --test`.
// A project is { id, name, parentId }; a parentId that names no existing project counts as top level.

function resolveParentId(project, ids) {
    return project.parentId && ids.has(project.parentId) ? project.parentId : null;
}

export function getChildProjects(projects, parentId = null) {
    const ids = new Set(projects.map((project) => project.id));
    return projects
        .filter((project) => resolveParentId(project, ids) === parentId)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
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

// Depth-first, alphabetical within each level: what a picker or the tree shows, top to bottom.
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
