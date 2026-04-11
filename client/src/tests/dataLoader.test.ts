import { describe, it, expect, afterEach, vi } from "vitest";
import { loadNotebookData } from "../dataLoader";
import type { NotebookItem } from "../models/game.model.ts";

describe("dataLoader", () => {
    it('should process raw fetch data correctly', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ items: ['Lead Pipe'] }),
        });

        vi.stubGlobal('fetch', mockFetch);

        const result = await loadNotebookData();
        expect(result).toEqual([{ item: 'Lead Pipe' }]);

        // Clean up after the test
        vi.unstubAllGlobals();
    });
});