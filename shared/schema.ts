import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (keeping the existing one)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Repository schema
export const repository = pgTable("repositories", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull().unique(),
  description: text("description"),
  ownerAvatar: text("owner_avatar"),
  stars: text("stars"),
  forks: text("forks"),
  openIssues: text("open_issues"),
  language: text("language"),
  createdAt: text("created_at"),
  lastUpdated: text("last_updated"),
  codeQuality: integer("code_quality"),
  codeCoverage: integer("code_coverage"),
  commitFrequency: text("commit_frequency"),
  activeContributors: integer("active_contributors"),
  languages: jsonb("languages").notNull(),
  commitActivity: jsonb("commit_activity").notNull(),
  complexFiles: jsonb("complex_files").notNull(),
  dependencies: jsonb("dependencies").notNull(),
});

// Repository schema validation
export const repositorySchema = createInsertSchema(repository);

export type InsertRepository = z.infer<typeof repositorySchema>;
export type Repository = typeof repository.$inferSelect;

// Language data for chart
export const languageSchema = z.object({
  name: z.string(),
  percentage: z.number(),
  color: z.string(),
});

// Commit activity data for chart
export const commitActivitySchema = z.object({
  month: z.string(),
  count: z.number(),
});

// Complex file data
export const complexFileSchema = z.object({
  path: z.string(),
  complexity: z.number(),
  level: z.enum(["High", "Medium", "Low"]),
});

// Dependency data
export const dependencySchema = z.object({
  name: z.string(),
  version: z.string(),
  status: z.enum(["Up to date", "Update available", "Outdated"]),
});
