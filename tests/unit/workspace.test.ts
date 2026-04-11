import { describe, expect, it } from "vitest";
import { getDemoCv } from "@/lib/cv/demoData";
import { applyWorkspaceInstruction } from "@/lib/cv/workspace";

describe("applyWorkspaceInstruction", () => {
  it("treats translation requests as guidance without mutating the draft", () => {
    const data = getDemoCv("en");
    const result = applyWorkspaceInstruction(data, "en", "Translate to Arabic");

    expect(result.status).toBe("translation");
    expect(result.nextData).toEqual(data);
  });

  it("adds a quantified achievement to the lead experience entry", () => {
    const data = getDemoCv("en");
    const result = applyWorkspaceInstruction(data, "en", "Add quantified achievement");

    expect(result.status).toBe("updated");
    expect(result.nextData.experience[0]?.achievements[0]).toMatch(/target|initiative|weeks/i);
    expect(result.nextData.experience[0]?.achievements).toHaveLength(data.experience[0]?.achievements.length + 1);
  });

  it("tightens the summary when asked", () => {
    const data = getDemoCv("en");
    const result = applyWorkspaceInstruction(data, "en", "Tighten summary");

    expect(result.status).toBe("updated");
    expect(result.nextData.summary).toMatch(/strong record|execution/i);
    expect(result.nextData.summary).not.toEqual(data.summary);
  });
});
