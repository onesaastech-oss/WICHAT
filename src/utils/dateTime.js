/**
 * Parse server/database datetime values as literal wall-clock time.
 * DB stores IST without timezone info; avoid treating ISO "Z" suffix as UTC (+05:30 shift).
 */
export function parseServerDate(value) {
    if (value == null || value === '') return null;
    if (typeof value === 'number') return new Date(value);

    const str = String(value).trim();
    const match = str.match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/
    );

    if (match) {
        return new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3]),
            Number(match[4]),
            Number(match[5]),
            Number(match[6] || 0)
        );
    }

    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toServerTimestamp(value) {
    const date = parseServerDate(value);
    return date ? date.getTime() : undefined;
}

/** Format a server datetime with moment without timezone shift. */
export function formatServerDateTime(value, format, momentFn) {
    const date = parseServerDate(value);
    if (!date || !momentFn) return '';
    return momentFn(date).format(format);
}
