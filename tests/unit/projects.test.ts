import { describe, expect, it } from "vitest";
import {
  buildWorkspaceHref,
  convexRowToProject,
  createStarterCvProject,
  resolveCvProjectTemplateKey,
  resolveLegacyDraftRoute,
  resolveProjectLanguage,
} from "@/lib/cv/projects";

describe("cv project helpers", () => {
  it("creates a starter project with both variants and the selected template", () => {
    const project = createStarterCvProject("harvard");

    expect(project.id).toBe("starter-harvard");
    expect(project.shared.templateKey).toBe("harvard");
    expect(project.shared.statusKey).toBe("draft");
    expect(project.variant.language).toBe("en");
  });

  it("resolves a requested language before falling back to the default", () => {
    const project = createStarterCvProject();

    expect(resolveProjectLanguage(project, "ar", "en")).toBe("ar");
    expect(resolveProjectLanguage(project, "unknown", "ar")).toBe("ar");
    expect(resolveProjectLanguage(project, null, null)).toBe(project.shared.defaultLanguage);
  });

  it("builds workspace routes for projects and starter templates", () => {
    expect(buildWorkspaceHref({ projectId: "abdullah-sales", language: "ar" })).toBe("/chat/new?project=abdullah-sales&lang=ar");
    expect(buildWorkspaceHref({ templateKey: "ada", language: "en" })).toBe("/chat/new?template=ada&lang=en");
    expect(buildWorkspaceHref({})).toBe("/chat/new");
  });

  it("maps legacy and current template params into the professional template catalog", () => {
    expect(resolveCvProjectTemplateKey("ats")).toBe("ats");
    expect(resolveCvProjectTemplateKey("studio")).toBe("ada");
    expect(resolveCvProjectTemplateKey("monolith")).toBe("harvard");
    expect(resolveCvProjectTemplateKey("ATS3")).toBe("ats");
  });

  it("normalizes a stored template alias when mapping a convex row", () => {
    const project = convexRowToProject({
      _id: "project-studio",
      templateKey: "studio",
      updatedAt: Date.now(),
    });

    expect(project.shared.templateKey).toBe("ada");
  });

  it("maps legacy draft links into the new project model", () => {
    expect(resolveLegacyDraftRoute("khalid-executive")).toEqual({
      projectId: "khalid-engineer",
      language: "en",
    });
    expect(resolveLegacyDraftRoute("abdullah-arabic")).toEqual({
      projectId: "abdullah-sales",
      language: "ar",
    });
    expect(resolveLegacyDraftRoute("unknown")).toBeNull();
  });
});
