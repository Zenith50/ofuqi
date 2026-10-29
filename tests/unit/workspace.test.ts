import { describe, expect, it } from "vitest";
import { getDemoCv } from "@/lib/cv/demoData";
import { applyWorkspaceInstruction, deepMerge } from "@/lib/cv/workspace";

describe("applyWorkspaceInstruction", () => {
  it("treats translation requests as guidance without mutating the draft", () => {
    const data = getDemoCv("en");
    const result = applyWorkspaceInstruction(data, "en", "Translate to Arabic");

    expect(result.status).toBe("translation");
    expect(result.nextData).toEqual(data);
  });

  it("asks for a real number instead of inventing a quantified achievement", () => {
    const data = getDemoCv("en");
    const result = applyWorkspaceInstruction(data, "en", "Add quantified achievement");

    expect(result.status).toBe("updated");
    expect(result.nextData.experience[0]?.achievements).toEqual(data.experience[0]?.achievements);
    expect(result.assistantReply).toMatch(/did not add a number/i);
  });

  it("tightens the summary when asked", () => {
    const data = getDemoCv("en");
    const result = applyWorkspaceInstruction(data, "en", "Tighten summary");

    expect(result.status).toBe("updated");
    expect(result.nextData.summary).toMatch(/strong record|execution/i);
    expect(result.nextData.summary).not.toEqual(data.summary);
  });
});

describe("deepMerge", () => {
  it("does not store a partial experience array as the whole list", () => {
    const data = getDemoCv("en");
    const result = deepMerge(data, {
      experience: [{ role: "Engineer" }],
    });

    expect(result.experience).toEqual(data.experience);
    expect(Array.isArray(result.experience)).toBe(true);
    expect(Array.isArray(result.experience[0]?.achievements)).toBe(true);
  });

  it("keeps experience an array when the patch is an object", () => {
    const data = getDemoCv("en");
    const result = deepMerge(data, {
      experience: { company: "Acme", role: "Engineer" },
    });

    expect(Array.isArray(result.experience)).toBe(true);
    expect(result.experience).toEqual(data.experience);
  });

  it("does not wipe personal when the patch is null", () => {
    const data = getDemoCv("en");
    const result = deepMerge(data, { personal: null });

    expect(result.personal).toEqual(data.personal);
    expect(result.personal.fullName).toBe(data.personal.fullName);
  });

  it("keeps skills an array when the patch is a string", () => {
    const data = getDemoCv("en");
    const result = deepMerge(data, { skills: "AutoCAD" });

    expect(Array.isArray(result.skills)).toBe(true);
    expect(result.skills).toEqual(data.skills);
  });

  it("keeps education, certifications, languages, and achievements as arrays", () => {
    const data = getDemoCv("en");
    const [firstExperience] = data.experience;
    const result = deepMerge(data, {
      education: { institution: "KFUPM" },
      certifications: "PMP",
      languages: { name: "Arabic" },
      experience: [
        {
          ...firstExperience,
          achievements: "Led a team",
        },
      ],
    });

    expect(result.education).toEqual(data.education);
    expect(result.certifications).toEqual(data.certifications);
    expect(result.languages).toEqual(data.languages);
    expect(result.experience).toEqual(data.experience);
    expect(Array.isArray(result.experience[0]?.achievements)).toBe(true);
  });

  it("ignores an education list whose items omit required fields", () => {
    const data = getDemoCv("en");
    const result = deepMerge(data, {
      education: [{ institution: "KFUPM" }],
    });

    expect(result.education).toEqual(data.education);
  });

  it("replaces experience when every item has the required fields", () => {
    const data = getDemoCv("en");
    const experience = [
      {
        company: "Acme",
        role: "Engineer",
        startDate: "2020",
        endDate: "Present",
        achievements: ["Shipped the reporting workflow"],
      },
    ];
    const result = deepMerge(data, { experience });

    expect(result.experience).toEqual(experience);
    expect(result.personal).toEqual(data.personal);
  });

  it("merges partial personal fields without letting null erase them", () => {
    const data = getDemoCv("en");
    const result = deepMerge(data, {
      personal: { email: "new@example.com", fullName: null },
    });

    expect(result.personal.email).toBe("new@example.com");
    expect(result.personal.fullName).toBe(data.personal.fullName);
    expect(result.personal.jobTitle).toBe(data.personal.jobTitle);
  });
});
