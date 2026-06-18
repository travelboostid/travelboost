// Credit: https://usehooks-ts.com/
import { useCallback, useState } from 'react';

export type CopiedValue = string | null;
export type CopyFn = (text: string) => Promise<boolean>;
export type UseClipboardReturn = [CopiedValue, CopyFn];

function copyWithExecCommand(value: string): boolean {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, value.length);
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);

        return success;
    } catch {
        return false;
    }
}

export async function copyToClipboard(text: string): Promise<boolean> {
    const value = String(text ?? '');

    if (value === '') {
        return false;
    }

    if (copyWithExecCommand(value)) {
        return true;
    }

    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(value);

            return true;
        } catch {
            // Clipboard API can fail inside modal focus traps.
        }
    }

    return false;
}

export function useClipboard(): UseClipboardReturn {
    const [copiedText, setCopiedText] = useState<CopiedValue>(null);

    const copy: CopyFn = useCallback(async (text) => {
        const success = await copyToClipboard(text);

        if (success) {
            setCopiedText(String(text ?? ''));

            return true;
        }

        setCopiedText(null);

        return false;
    }, []);

    return [copiedText, copy];
}
