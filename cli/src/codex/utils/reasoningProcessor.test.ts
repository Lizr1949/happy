import { describe, it, expect, vi, afterEach } from 'vitest';
import { ReasoningProcessor } from './reasoningProcessor';

describe('ReasoningProcessor streaming', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('streams untitled reasoning deltas and avoids duplicates on completion', () => {
        vi.useFakeTimers();
        vi.setSystemTime(0);

        const messages: any[] = [];
        const processor = new ReasoningProcessor((message) => {
            messages.push(message);
        }, { flushIntervalMs: 100 });

        processor.processDelta('Hello');
        expect(messages).toHaveLength(1);
        expect(messages[0].type).toBe('reasoning');
        expect(messages[0].message).toBe('Hello');

        vi.setSystemTime(50);
        processor.processDelta(' world');
        expect(messages).toHaveLength(1);

        vi.setSystemTime(150);
        processor.processDelta('!');
        expect(messages).toHaveLength(2);
        expect(messages[1].type).toBe('reasoning');
        expect(messages[1].message).toBe(' world!');

        processor.complete('Hello world!');
        expect(messages).toHaveLength(2);
    });

    it('does not stream deltas for titled reasoning and emits tool call/result', () => {
        const messages: any[] = [];
        const processor = new ReasoningProcessor((message) => {
            messages.push(message);
        }, { flushIntervalMs: 0 });

        processor.processDelta('**Plan** Think step');
        processor.complete('**Plan** Think step');

        const reasoningMessages = messages.filter((m) => m.type === 'reasoning');
        const toolCalls = messages.filter((m) => m.type === 'tool-call');
        const toolResults = messages.filter((m) => m.type === 'tool-call-result');

        expect(reasoningMessages.length).toBe(0);
        expect(toolCalls.length).toBe(1);
        expect(toolResults.length).toBe(1);
    });
});
