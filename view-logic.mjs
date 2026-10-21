// Pure display helpers. No DOM access, so they can be unit-tested with `node --test`.

const DAY_MS = 24 * 60 * 60 * 1000;

export function toIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function itemDate(item) {
    return item.type === 'event' ? item.startDate : item.dueDate;
}

export function itemTime(item) {
    return item.type === 'event' ? item.startTime : item.dueTime;
}

function dayOffset(dateIso, now) {
    const [year, month, day] = dateIso.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target - today) / DAY_MS);
}

export function isOverdue(item, now) {
    if (item.completed || item.isVirtual || item.noDue) return false;
    const dateIso = itemDate(item);
    if (!dateIso) return false;

    const todayIso = toIsoDate(now);
    if (dateIso < todayIso) return true;
    if (dateIso > todayIso) return false;

    const timeValue = itemTime(item);
    if (!timeValue) return false;
    return new Date(`${dateIso}T${timeValue}`) < now;
}

export function formatTimeCell(item, now) {
    const dateIso = itemDate(item);
    if (item.noDue || !dateIso) return '—';

    const offset = dayOffset(dateIso, now);
    if (offset === 0) {
        return itemTime(item) || '—';
    }

    const [year, month, day] = dateIso.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (Math.abs(offset) <= 6) {
        return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

export function showsInDateTab(item, todayIso) {
    if (!item.completed) return true;
    return item.completedOn === todayIso && !item.dismissed;
}

export function resolveTheme(stored, prefersDark) {
    if (stored === 'light' || stored === 'dark') return stored;
    return prefersDark ? 'dark' : 'light';
}

export function shouldOpenSheetOnKey(event) {
    if (event.key !== 'n' && event.key !== 'N') return false;
    if (event.ctrlKey || event.metaKey || event.altKey) return false;
    const target = event.target || {};
    if (target.isContentEditable) return false;
    return !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}
