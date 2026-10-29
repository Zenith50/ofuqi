import { describe, expect, it } from "vitest";

import { parseChatRequestPayload, parseExportRequestPayload, parseTranslateRequestPayload, readJsonBody } from "@/lib/api/validation";
import { getDemoCv } from "@/lib/cv/demoData";
import {
  createTranslationCacheEntry,
  normalizeCvData,
  normalizeCvPatch,
  readFreshTranslationCache,
} from "@/lib/cv/validation";

describe("API payload validation", () => {
  it("normalizes a valid chat payload and drops malformed messages", () => {
    const payload = parseChatRequestPayload({
      language: "ar",
      cvStateJson: { ok: true },
      messages: [
        { role: "system", content: "" },
        { role: "user", content: "Improve the summary" },
        { role: "admin", content: "bad role" },
      ],
    });

    expect(payload.language).toBe("ar");
    expect(payload.messages).toEqual([{ role: "user", content: "Improve the summary" }]);
    expect(payload.cvStateJson).toContain("ok");
  });

  it("rejects an oversized body by UTF-8 bytes", async () => {
    const body = "أ".repeat(200_000);
    const request = new Request("http://localhost/api/chat", { method: "POST", body });

    await expect(readJsonBody(request)).rejects.toThrow(/too large/);
  });

  it("rejects invalid translation and export payloads", () => {
    expect(() => parseTranslateRequestPayload({ targetLanguage: "fr", cvData: {} })).toThrow(
      /Invalid translation payload/,
    );
    expect(() => parseExportRequestPayload({ format: "exe", data: getDemoCv("en") })).toThrow(
      /Invalid export payload/,
    );
  });
});

describe("CV runtime validation", () => {
  it("accepts known CV patch keys and rejects unknown or malformed fields", () => {
    expect(normalizeCvPatch({ summary: "Sharper summary", skills: ["Leadership"] })).toEqual({
      summary: "Sharper summary",
      skills: ["Leadership"],
    });

    expect(normalizeCvPatch({ admin: true })).toBeNull();
    expect(normalizeCvPatch({ experience: [{ role: "Lead", admin: true }] })).toBeNull();
    expect(normalizeCvPatch({ skills: "Leadership" })).toBeNull();
  });

  it("keeps translation cache fresh only for the source fingerprint it was created from", () => {
    const source = getDemoCv("en");
    const translated = normalizeCvData({ ...getDemoCv("ar"), language: "ar" });
    expect(translated).not.toBeNull();

    const cache = createTranslationCacheEntry(source, translated!);
    expect(readFreshTranslationCache(cache, source, "ar")).toEqual(translated);

    const changedSource = { ...source, summary: `${source.summary} updated` };
    expect(readFreshTranslationCache(cache, changedSource, "ar")).toBeNull();
    expect(readFreshTranslationCache(cache, source, "en")).toBeNull();
  });
});
