import React, { useRef, useLayoutEffect, useEffect, useCallback, forwardRef } from 'react';

const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ value, className, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    const adjustHeight = useCallback(() => {
        const el = combinedRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
    }, [combinedRef]);

    useLayoutEffect(() => {
        adjustHeight();
    }, [value, adjustHeight]);

    useEffect(() => {
        const el = combinedRef.current;
        if (!el) return;

        let prevWidth = el.offsetWidth;
        const observer = new ResizeObserver(() => {
            window.requestAnimationFrame(() => {
                if (!el) return;
                const newWidth = el.offsetWidth;
                if (Math.abs(newWidth - prevWidth) > 0.5) {
                    prevWidth = newWidth;
                    adjustHeight();
                }
            });
        });
        
        observer.observe(el);
        return () => observer.disconnect();
    }, [adjustHeight, combinedRef]);

    return (
        <textarea
            ref={combinedRef}
            value={value}
            className={`resize-none w-full max-w-full box-border break-words whitespace-pre-wrap ${className}`}
            rows={1}
            {...props}
        />
    );
});

AutoResizeTextarea.displayName = 'AutoResizeTextarea';
export default AutoResizeTextarea;