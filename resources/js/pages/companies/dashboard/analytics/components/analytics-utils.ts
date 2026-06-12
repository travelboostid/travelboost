export type BreakdownItem = {
    name: string;
    value: number;
    percentage?: number;
};

export function hashString(str: string): number {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }

    return hash;
}

export function getColorFromLabel(label: string): string {
    const hue = hashString(label) % 360;

    return `hsl(${hue} 70% 55%)`;
}

export function applyChartColors<T extends { name: string }>(
    data: T[],
): (T & { fill: string })[] {
    return data.map((item) => ({
        ...item,
        fill: getColorFromLabel(item.name),
    }));
}

export function toBreakdownItems(
    items: Array<Record<string, unknown>> | undefined,
    valueKey: string,
): BreakdownItem[] {
    if (!items?.length) {
        return [];
    }

    return items.map((item) => ({
        name: String(item.name ?? 'Unknown'),
        value: Number(item[valueKey] ?? item.value ?? 0),
        percentage:
            item.percentage !== undefined ? Number(item.percentage) : undefined,
    }));
}

export function formatPagePath(path: string): string {
    if (!path || path === '(not set)') {
        return path;
    }

    try {
        const url = new URL(path, 'https://placeholder.test');

        return url.pathname + url.search;
    } catch {
        return path;
    }
}
