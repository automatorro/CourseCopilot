import { afterEach, describe, expect, it, vi } from 'vitest';
import { retryGenerationRequest } from '../components/GenerationProgressModal';

describe('retryGenerationRequest', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not wait when generation is already stopped', async () => {
        const controller = new AbortController();
        controller.abort();

        const request = vi.fn();

        await expect(
            retryGenerationRequest(controller.signal, () => false, 3, 1000, request, vi.fn())
        ).resolves.toBeUndefined();
        expect(request).not.toHaveBeenCalled();
    });

    it('does not retry after generation is stopped during the retry delay', async () => {
        vi.useFakeTimers();
        const controller = new AbortController();
        let reportRetry: () => void = () => undefined;
        const retryReported = new Promise<void>(resolve => {
            reportRetry = resolve;
        });
        const request = vi.fn().mockRejectedValue(new Error('temporary failure'));
        const pending = retryGenerationRequest(
            controller.signal,
            () => false,
            3,
            1000,
            request,
            reportRetry
        );

        await retryReported;
        expect(request).toHaveBeenCalledTimes(1);

        controller.abort();

        await expect(pending).resolves.toBeUndefined();
        expect(request).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('retries transient failures until a request succeeds', async () => {
        vi.useFakeTimers();
        const controller = new AbortController();
        let reportRetry: () => void = () => undefined;
        const retryReported = new Promise<void>(resolve => {
            reportRetry = resolve;
        });
        const request = vi.fn()
            .mockRejectedValueOnce(new Error('temporary failure'))
            .mockResolvedValue('generated');
        const pending = retryGenerationRequest(
            controller.signal,
            () => false,
            3,
            1000,
            request,
            reportRetry
        );

        await retryReported;
        await vi.advanceTimersByTimeAsync(1000);

        await expect(pending).resolves.toBe('generated');
        expect(request).toHaveBeenCalledTimes(2);
    });
});
