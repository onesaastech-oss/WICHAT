const asObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});

const parseObject = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return asObject(value);
    if (typeof value === 'string') {
        try { return asObject(JSON.parse(value)); } catch { return {}; }
    }
    return {};
};

const normalizeReply = (interactive = {}) => {
    const source = asObject(interactive);
    const reply = source.button_reply || source.list_reply || source.interactive_reply || source.reply || {};
    if (!reply.id && !reply.title) return null;
    return {
        type: source.button_reply ? 'button_reply' : source.list_reply ? 'list_reply' : (source.type || 'interactive_reply'),
        id: reply.id || '',
        title: reply.title || '',
        description: reply.description || ''
    };
};

export const normalizeInteractiveMessage = (message = {}) => {
    const raw = parseObject(message.interactive || message.interactive_data);
    const action = asObject(raw.action);
    const buttons = Array.isArray(action.buttons) ? action.buttons : [];
    const sections = Array.isArray(action.sections) ? action.sections : [];
    const normalized = {
        ...raw,
        type: raw.type === 'button' || raw.type === 'list' ? raw.type : (buttons.length ? 'button' : 'list'),
        header: raw.header ? asObject(raw.header) : null,
        body: raw.body ? asObject(raw.body) : { text: message.message || '' },
        footer: raw.footer ? asObject(raw.footer) : null,
        action: {
            ...action,
            buttons,
            sections,
            button: action.button || ''
        }
    };

    const reply = message.interactive_reply || normalizeReply(raw);
    return {
        interactive: normalized,
        interactive_reply: reply,
        message_type: 'interactive',
        message: message.message || reply?.title || normalized.body?.text || ''
    };
};

export const getInteractiveDisplayText = (message = {}) => {
    const normalized = normalizeInteractiveMessage(message);
    return normalized.interactive_reply?.title
        || normalized.interactive?.body?.text
        || message.message
        || 'Interactive message';
};

export const getInteractiveOptions = (message = {}) => {
    const { interactive } = normalizeInteractiveMessage(message);
    const action = interactive.action || {};
    if (interactive.type === 'button') {
        return action.buttons
            .map((button) => button?.reply)
            .filter(Boolean)
            .map((reply) => ({ ...reply, kind: 'button' }));
    }
    return action.sections.flatMap((section) => (section.rows || []).map((row) => ({
        ...row,
        sectionTitle: section.title || '',
        kind: 'list'
    })));
};

export const getInteractiveSearchText = (message = {}) => {
    const normalized = normalizeInteractiveMessage(message);
    const options = getInteractiveOptions(message);
    return [
        normalized.interactive?.header?.text,
        normalized.interactive?.body?.text,
        normalized.interactive?.footer?.text,
        normalized.interactive_reply?.id,
        normalized.interactive_reply?.title,
        ...options.flatMap((item) => [item.id, item.title, item.description])
    ].filter(Boolean).join(' ');
};

export const buildInteractivePayload = ({ text = '', interactiveType = 'list', items = [], header = '', footer = '', button = 'View options' } = {}) => {
    const safeItems = (Array.isArray(items) ? items : [])
        .filter((item) => item && item.id && item.title)
        .map((item) => ({ id: String(item.id).slice(0, 200), title: String(item.title).slice(0, 24), ...(item.description ? { description: String(item.description).slice(0, 72) } : {}) }));
    const interactive = {
        type: interactiveType === 'button' ? 'button' : 'list',
        ...(header ? { header: { type: 'text', text: header } } : {}),
        body: { text },
        ...(footer ? { footer: { text: footer } } : {}),
        action: interactiveType === 'button'
            ? { buttons: safeItems.slice(0, 3).map(({ id, title }) => ({ type: 'reply', reply: { id, title } })) }
            : { button, sections: [{ rows: safeItems.slice(0, 10) }] }
    };
    return { type: 'interactive', interactive };
};
