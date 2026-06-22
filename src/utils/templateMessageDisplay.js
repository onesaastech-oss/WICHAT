export function parseMessageComponent(component) {
    if (!component) return [];
    if (Array.isArray(component)) return component;
    if (typeof component === 'string') {
        try {
            const parsed = JSON.parse(component);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

function applyBodyParameters(bodyText, bodyParams) {
    const text = String(bodyText || '');
    if (!text) return '';

    const matches = text.match(/\{\{\d+\}\}/g) || [];
    return matches.reduce((acc, ph, idx) => {
        const val = bodyParams[idx]?.text ?? '';
        return acc.replace(ph, val);
    }, text);
}

export function buildTemplateDisplayMessage(template, component) {
    const templateData = template && typeof template === 'object' ? template : {};
    const components = templateData.components;

    if (!Array.isArray(components)) return '';

    const componentList = parseMessageComponent(component);
    const category = String(templateData.category || '').toUpperCase();
    const bodyComponent = components.find((c) => c.type === 'BODY');
    const bodyParams = componentList.find(
        (c) => String(c.type || '').toLowerCase() === 'body'
    )?.parameters || [];

    if (category === 'AUTHENTICATION') {
        if (bodyComponent?.text) {
            return applyBodyParameters(bodyComponent.text, bodyParams);
        }

        const code = bodyParams[0]?.text ?? '';
        if (!code) return '';

        let text = `${code} is your verification code.`;
        if (bodyComponent?.add_security_recommendation) {
            text += ' For your security, do not share this code.';
        }
        return text;
    }

    return applyBodyParameters(bodyComponent?.text || '', bodyParams);
}

export function buildTemplateDisplayFooter(template) {
    const components = template?.components;
    if (!Array.isArray(components)) return '';

    const footerComponent = components.find((c) => c.type === 'FOOTER');
    if (!footerComponent) return '';

    if (footerComponent.text) {
        return String(footerComponent.text);
    }

    if (footerComponent.code_expiration_minutes != null) {
        const minutes = Number(footerComponent.code_expiration_minutes);
        if (Number.isFinite(minutes) && minutes >= 1) {
            return `This code expires in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
        }
    }

    return '';
}

export function applyHeaderParameters(headerText, headerParams = []) {
    const text = String(headerText || '');
    if (!text) return '';

    const textParams = headerParams.filter((p) => p.type === 'text');
    const matches = text.match(/\{\{\d+\}\}/g) || [];

    return matches.reduce((acc, ph, idx) => {
        const val = textParams[idx]?.text ?? headerParams[idx]?.text ?? '';
        return acc.replace(ph, val);
    }, text);
}

export function resolveTemplateBodyText(msg) {
    if (msg?.message && String(msg.message).trim()) {
        return msg.message;
    }

    const template = msg?.template || {};
    const componentList = parseMessageComponent(msg?.component);
    return buildTemplateDisplayMessage(template, componentList);
}

export function resolveTemplateFooterText(msg) {
    const template = msg?.template || {};
    return buildTemplateDisplayFooter(template);
}
