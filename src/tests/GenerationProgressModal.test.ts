import { afterEach, describe, expect, it, vi } from 'vitest';
import { runGenerationRequest, sumTokenUsage } from '../components/GenerationProgressModal';

describe('sumTokenUsage', () => {
    it('totals token counts and estimates current Claude pricing', () => {
        expect(sumTokenUsage([
            { input_tokens: 100_000, output_tokens: 10_000 },
            { input_tokens: 50_000, output_tokens: 5_000 },
        ])).toEqual({
            inputTokens: 150_000,
            outputTokens: 15_000,
            estimatedCostUsd: 0.45,
        });
    });

    it('treats missing token counts as zero', () => {
        expect(sumTokenUsage([{ input_tokens: null, output_tokens: null }])).toEqual({
            inputTokens: 0,
            outputTokens: 0,
            estimatedCostUsd: 0,
        });
    });
});

describe('runGenerationRequest', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not wait when generation is already stopped', async () => {
        const controller = new AbortController();
        controller.abort();

        const request = vi.fn();

        await expect(
            runGenerationRequest(controller.signal, () => false, request, vi.fn())
        ).resolves.toBeUndefined();
        expect(request).not.toHaveBeenCalled();
    });

    it('propagates the first failure without retrying', async () => {
        const controller = new AbortController();
        const error = new Error('provider failed');
        const request = vi.fn().mockRejectedValue(error);
        const onFailure = vi.fn();

        await expect(
            runGenerationRequest(
            controller.signal,
            () => false,
            request,
                onFailure
            )
        ).rejects.toBe(error);

        expect(request).toHaveBeenCalledTimes(1);
        expect(onFailure).toHaveBeenCalledWith(error);
    });

    it('returns successful content after one request', async () => {
        const request = vi.fn().mockResolvedValue('generated');

        await expect(
            runGenerationRequest(undefined, () => false, request, vi.fn())
        ).resolves.toBe('generated');
        expect(request).toHaveBeenCalledTimes(1);
    });

    it('does not return content if generation is stopped while the request is in flight', async () => {
        const controller = new AbortController();
        let resolveRequest: (value: string) => void = () => undefined;
        const request = vi.fn(() => new Promise<string>(resolve => {
            resolveRequest = resolve;
        }));
        const pending = runGenerationRequest(controller.signal, () => false, request, vi.fn());

        controller.abort();
        resolveRequest('generated');

        await expect(pending).resolves.toBeUndefined();
        expect(request).toHaveBeenCalledTimes(1);
    });
});
