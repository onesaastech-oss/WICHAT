import React from 'react';
import { FiChevronRight, FiList, FiMousePointer } from 'react-icons/fi';
import { getInteractiveOptions, normalizeInteractiveMessage } from '../../utils/interactiveMessage';

export default function InteractiveMessageRenderer({ msg, isOwnMessage = false }) {
    const normalized = normalizeInteractiveMessage(msg);
    const { interactive, interactive_reply: reply } = normalized;
    const options = getInteractiveOptions(msg);
    const body = interactive.body?.text || msg.message || '';

    return (
        <div className="min-w-[220px] max-w-[340px] overflow-hidden rounded-xl border border-black/10 bg-white/70 dark:border-white/10 dark:bg-gray-900/30">
            {interactive.header?.text && (
                <div className="border-b border-black/5 px-3 pt-3 text-sm font-semibold dark:border-white/10">
                    {interactive.header.text}
                </div>
            )}
            <div className="px-3 py-3">
                <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{body}</p>
                {interactive.footer?.text && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{interactive.footer.text}</p>}
            </div>
            {reply ? (
                <div className={`border-t px-3 py-2 text-sm ${isOwnMessage ? 'border-green-200 text-green-800 dark:border-green-900 dark:text-green-200' : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200'}`}>
                    <div className="flex items-center gap-2 font-medium"><FiMousePointer className="h-3.5 w-3.5" />{reply.title || reply.id}</div>
                    {reply.description && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{reply.description}</div>}
                </div>
            ) : options.length > 0 ? (
                <div className="border-t border-black/10 dark:border-white/10">
                    {interactive.type === 'list' && interactive.action?.button && (
                        <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400"><FiList />{interactive.action.button}</div>
                    )}
                    {options.map((option, index) => (
                        <div key={`${option.id || option.title}-${index}`} className="flex items-center justify-between border-t border-black/5 px-3 py-2.5 text-sm text-emerald-700 dark:border-white/10 dark:text-emerald-300">
                            <span className="min-w-0"><span className="block truncate font-medium">{option.title}</span>{option.description && <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{option.description}</span>}</span>
                            <FiChevronRight className="ml-2 h-4 w-4 flex-shrink-0" />
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

