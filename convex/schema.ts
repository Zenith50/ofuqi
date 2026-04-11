import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  cvProjects: defineTable({
    userId: v.id("users"),
    templateKey: v.string(),
    statusKey: v.string(),
    defaultLanguage: v.string(),
    availableLanguages: v.array(v.string()),
    variant: v.optional(v.any()),
    conversation: v.optional(v.any()),
    translationCache: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"]),
});
