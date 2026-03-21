import React from 'react';

/**
 * Formats WhatsApp text with bold formatting (*text*)
 * @param {string} text - The text to format
 * @returns {Array} Array of React elements
 */
export const formatWhatsAppText = (text) => {
  const boldRegex = /\*(.*?)\*/g;
  let match;
  
  const segments = [];
  let lastIndex = 0;
  
  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'normal', text: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'bold', text: match[1] });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    segments.push({ type: 'normal', text: text.slice(lastIndex) });
  }
  
  return segments.map((segment, idx) => {
    if (segment.type === 'bold') {
      return <strong key={idx} className="font-semibold">{segment.text}</strong>;
    }
    return <span key={idx}>{segment.text}</span>;
  });
};

/**
 * Gets preview text with variables replaced
 * When a variable is mapped to contact.name, shows {name}; for contact.number, shows {number}
 * @param {Object} template - The selected template
 * @param {Object} variableValues - Object mapping variable names to values
 * @param {Object} variableSources - Object mapping variable names to their source (e.g. { type: 'contact', key: 'contact.name' })
 * @returns {string} Formatted preview text
 */
export const getPreviewText = (template, variableValues, variableSources = {}) => {
  if (!template) return '';
  let text = template.content;
  template.variables.forEach((variable, index) => {
    const source = variableSources[variable];
    let value;
    if (source?.type === 'contact' && source?.key === 'contact.name') {
      value = '{name}';
    } else if (source?.type === 'contact' && source?.key === 'contact.number') {
      value = '{number}';
    } else {
      value = variableValues[variable] || `{{${index + 1}}}`;
    }
    text = text.replace(new RegExp(`{{\\s*${index + 1}\\s*}}`, 'g'), value);
  });
  return text;
};

