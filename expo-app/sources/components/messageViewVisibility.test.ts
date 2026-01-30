import { describe, it, expect } from 'vitest';
import { shouldShowThinkingMessage } from './messageViewVisibility';

describe('MessageView thinking visibility', () => {
    it('shows non-thinking messages regardless of experiments', () => {
        expect(shouldShowThinkingMessage(false, false)).toBe(true);
        expect(shouldShowThinkingMessage(false, true)).toBe(true);
        expect(shouldShowThinkingMessage(undefined, false)).toBe(true);
    });

    it('hides thinking messages when experiments is disabled', () => {
        expect(shouldShowThinkingMessage(true, false)).toBe(false);
    });

    it('shows thinking messages when experiments is enabled', () => {
        expect(shouldShowThinkingMessage(true, true)).toBe(true);
    });
});
