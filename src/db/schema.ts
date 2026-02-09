import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const roleCategoryEnum = pgEnum("teamup_role_category", [
  "RND",
  "PRODUCT",
  "GROWTH",
  "ROOT",
  "FUNCTION",
]);

export const users = pgTable(
  "teamup_users",
  {
    id: text("id").primaryKey(), // cuid/uuid
    name: varchar("name", { length: 64 }).notNull(),
    email: varchar("email", { length: 128 }).notNull(),
    roleCategory: roleCategoryEnum("role_category").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("teamup_users_email_uniq").on(t.email)],
);

export const inviteCodes = pgTable(
  "teamup_invite_codes",
  {
    code: varchar("code", { length: 64 }).primaryKey(),
    // Optional: for pre-generated codes, role can be fixed (e.g. ROOT)
    fixedRoleCategory: roleCategoryEnum("fixed_role_category"),
    maxUses: integer("max_uses").notNull().default(1),
    usedCount: integer("used_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("teamup_invite_codes_expires_at_idx").on(t.expiresAt)],
);

export const annualMeetingRegistrations = pgTable(
  "teamup_annual_meeting_registrations",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    attending: boolean("attending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId] })],
);

export const contestRegistrations = pgTable(
  "teamup_contest_registrations",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 24 }).notNull().default("registered"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId] })],
);

export const teams = pgTable(
  "teamup_teams",
  {
    id: text("id").primaryKey(),
    status: varchar("status", { length: 24 }).notNull().default("forming"), // forming|locked
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    memberCount: integer("member_count").notNull().default(0),
    rndCount: integer("rnd_count").notNull().default(0),
    productCount: integer("product_count").notNull().default(0),
    growthCount: integer("growth_count").notNull().default(0),
    rootCount: integer("root_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("teamup_teams_status_idx").on(t.status),
    index("teamup_teams_created_at_idx").on(t.createdAt),
  ],
);

export const teamMembers = pgTable(
  "teamup_team_members",
  {
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleCategory: roleCategoryEnum("role_category").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.teamId, t.userId] }),
    uniqueIndex("teamup_team_members_user_id_uniq").on(t.userId),
    index("teamup_team_members_team_id_idx").on(t.teamId),
  ],
);

export const sessions = pgTable(
  "teamup_sessions",
  {
    token: varchar("token", { length: 128 }).primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("teamup_sessions_user_id_idx").on(t.userId), index("teamup_sessions_expires_at_idx").on(t.expiresAt)],
);
