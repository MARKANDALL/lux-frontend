// features/features/selfpb/attach-learner-blob.test.js
// One-line: Tests the learner-blob helper that updates SelfPB audio source, blob URL lifecycle, and waveform loading.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { attachLearnerBlobToAudio } from "./attach-learner-blob.js";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("attachLearnerBlobToAudio contract", () => {
  it("is a safe no-op when blob is missing", () => {
    const audioEl = { dataset: {}, load: vi.fn(), src: "" };
    const loadLearnerBlob = vi.fn();

    expect(
      attachLearnerBlobToAudio({ audioEl, blob: null, loadLearnerBlob })
    ).toBe(null);

    expect(audioEl.src).toBe("");
    expect(audioEl.load).not.toHaveBeenCalled();
    expect(loadLearnerBlob).not.toHaveBeenCalled();
  });

  it("revokes the previous blob url, assigns the new one, and updates waveform", () => {
    const audioEl = {
      dataset: { luxBlobUrl: "blob:old-url" },
      load: vi.fn(),
      src: "",
    };
    const blob = { size: 999, type: "audio/webm" };
    const createObjectURL = vi.fn(() => "blob:new-url");
    const revokeObjectURL = vi.fn();
    const loadLearnerBlob = vi.fn();

    const out = attachLearnerBlobToAudio({
      audioEl,
      blob,
      loadLearnerBlob,
      createObjectURL,
      revokeObjectURL,
    });

    expect(out).toBe("blob:new-url");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:old-url");
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(audioEl.dataset.luxBlobUrl).toBe("blob:new-url");
    expect(audioEl.src).toBe("blob:new-url");
    expect(audioEl.load).toHaveBeenCalled();
    expect(loadLearnerBlob).toHaveBeenCalledWith(blob);
  });

  it("does not revoke non-blob previous urls", () => {
    const audioEl = {
      dataset: { luxBlobUrl: "https://example.com/file.mp3" },
      load: vi.fn(),
      src: "",
    };
    const blob = { size: 100, type: "audio/mp3" };
    const createObjectURL = vi.fn(() => "blob:fresh");
    const revokeObjectURL = vi.fn();

    attachLearnerBlobToAudio({
      audioEl,
      blob,
      createObjectURL,
      revokeObjectURL,
      loadLearnerBlob: vi.fn(),
    });

    expect(revokeObjectURL).not.toHaveBeenCalled();
  });
});