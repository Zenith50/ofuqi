import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Queries ───────────────────────────────────────────────────

export const listUserProjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("cvProjects")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);
  },
});

export const getProject = query({
  args: { projectId: v.id("cvProjects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return null;

    return project;
  },
});

// ─── Mutations ─────────────────────────────────────────────────

export const createProject = mutation({
  args: {
    templateKey: v.string(),
    defaultLanguage: v.string(),
    availableLanguages: v.array(v.string()),
    variant: v.optional(v.any()),
    conversation: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();

    return await ctx.db.insert("cvProjects", {
      userId,
      templateKey: args.templateKey,
      statusKey: "draft",
      defaultLanguage: args.defaultLanguage,
      availableLanguages: args.availableLanguages,
      variant: args.variant,
      conversation: args.conversation,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProjectVariant = mutation({
  args: {
    projectId: v.id("cvProjects"),
    variant: v.any(),
  },
  handler: async (ctx, { projectId, variant }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(projectId, {
      variant,
      updatedAt: Date.now(),
    });
  },
});

export const updateProjectConversation = mutation({
  args: {
    projectId: v.id("cvProjects"),
    conversation: v.any(),
  },
  handler: async (ctx, { projectId, conversation }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(projectId, {
      conversation,
      updatedAt: Date.now(),
    });
  },
});

export const updateProjectMetadata = mutation({
  args: {
    projectId: v.id("cvProjects"),
    templateKey: v.optional(v.string()),
    statusKey: v.optional(v.string()),
    defaultLanguage: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.templateKey !== undefined) patch.templateKey = updates.templateKey;
    if (updates.statusKey !== undefined) patch.statusKey = updates.statusKey;
    if (updates.defaultLanguage !== undefined) patch.defaultLanguage = updates.defaultLanguage;

    await ctx.db.patch(projectId, patch);
  },
});

export const saveProjectState = mutation({
  args: {
    projectId: v.id("cvProjects"),
    variant: v.any(),
    conversation: v.any(),
    translationCache: v.optional(v.any()),
  },
  handler: async (ctx, { projectId, variant, conversation, translationCache }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const patch: Record<string, unknown> = {
      variant,
      conversation,
      updatedAt: Date.now(),
    };
    if (translationCache !== undefined) {
      patch.translationCache = translationCache;
    }

    await ctx.db.patch(projectId, patch);
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("cvProjects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    await ctx.db.delete(projectId);
  },
});
