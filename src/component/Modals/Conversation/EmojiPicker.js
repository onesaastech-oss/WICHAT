import React, { useEffect, useRef } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

function EmojiPickerPopover({
    open,
    onEmojiClick,
    onClose,
    anchorRef,
    darkMode = false,
    className = ''
}) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event) => {
            const containerEl = containerRef.current;
            const anchorEl = anchorRef?.current || null;
            if (!containerEl) return;
            const clickedInsidePicker = containerEl.contains(event.target);
            const clickedAnchor = anchorEl ? anchorEl.contains(event.target) : false;
            if (!clickedInsidePicker && !clickedAnchor) {
                onClose?.();
            }
        };

        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose?.();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [open, onClose, anchorRef]);

    if (!open) return null;

    return (
        <div
            ref={containerRef}
            className={`absolute bottom-full left-0 mb-2 z-50 ${className}`}
            role="dialog"
            aria-label="Emoji picker"
        >
            <div className="rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    theme={darkMode ? Theme.DARK : Theme.LIGHT}
                    autoFocusSearch
                    searchPlaceHolder="Search emoji"
                    width={320}
                    height={380}
                    lazyLoadEmojis
                    skinTonesDisabled={false}
                    previewConfig={{ showPreview: false }}
                />
            </div>
        </div>
    );
}

export default EmojiPickerPopover;
