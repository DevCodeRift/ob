import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";

export const securityClassEnum = pgEnum("security_class", [
  "GREEN",
  "AMBER",
  "RED",
  "BLACK",
]);

export const threatLevelEnum = pgEnum("threat_level", [
  "negligible",
  "low",
  "moderate",
  "high",
  "critical",
  "apollyon",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "active",
  "review",
  "suspended",
  "archived",
  "expunged",
]);

export const projectRoleEnum = pgEnum("project_role", [
  "lead",
  "researcher",
  "assistant",
  "observer",
]);

export const entryTypeEnum = pgEnum("entry_type", [
  "observation",
  "experiment",
  "incident",
  "note",
  "addendum",
  "interview",
]);

export const reportTypeEnum = pgEnum("report_type", [
  "general",
  "incident",
  "intel",
  "status",
  "containment_breach",
]);

export const priorityEnum = pgEnum("priority", [
  "low",
  "normal",
  "high",
  "critical",
  "omega",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "acknowledged",
  "investigating",
  "resolved",
  "archived",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "contacted",
  "interviewing",
  "approved",
  "rejected",
  "blacklisted",
]);

export const letterStyleEnum = pgEnum("letter_style", [
  "standard",
  "decree",
  "summons",
  "prophecy",
  "warning",
  "commendation",
]);

export const sealTypeEnum = pgEnum("seal_type", [
  "ouroboros",
  "eye",
  "serpent",
  "moon",
  "void",
  "mechanicus",
]);

export const projectAccessTypeEnum = pgEnum("project_access_type", [
  "user",
  "department",
  "rank",
  "clearance",
]);

export const proposalStatusEnum = pgEnum("proposal_status", [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "revision",
]);

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  codename: text("codename"),
  description: text("description"),
  headUserId: uuid("head_user_id"),
  iconSymbol: text("icon_symbol").default("⛧"),
  color: text("color").default("#c9a227"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ranks = pgTable(
  "ranks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    shortName: text("short_name"),
    clearanceLevel: integer("clearance_level").notNull().default(1),
    sortOrder: integer("sort_order").notNull().default(0),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    deptIdx: index("idx_ranks_dept").on(table.departmentId),
    uniqueRankPerDept: unique().on(table.departmentId, table.name),
  })
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    username: text("username").notNull().unique(),
    displayName: text("display_name").notNull(),
    title: text("title"),
    designation: text("designation"),
    clearanceLevel: integer("clearance_level").notNull().default(0),
    primaryDepartmentId: uuid("primary_department_id").references(
      () => departments.id
    ),
    profileImage: text("profile_image"),
    bio: text("bio"),
    specializations: text("specializations").array(),
    isActive: boolean("is_active").default(true).notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: index("idx_users_username").on(table.username),
    clearanceIdx: index("idx_users_clearance").on(table.clearanceLevel),
    departmentIdx: index("idx_users_department").on(table.primaryDepartmentId),
  })
);

export const departmentMembers = pgTable(
  "department_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rankId: uuid("rank_id").references(() => ranks.id, { onDelete: "set null" }),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    assignedBy: uuid("assigned_by").references(() => users.id),
  },
  (table) => ({
    uniqueMember: unique().on(table.departmentId, table.userId),
    deptIdx: index("idx_dept_members_dept").on(table.departmentId),
    userIdx: index("idx_dept_members_user").on(table.userId),
    rankIdx: index("idx_dept_members_rank").on(table.rankId),
  })
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectCode: text("project_code").notNull().unique(),
    name: text("name").notNull(),
    codename: text("codename"),
    objectClass: text("object_class"),
    securityClass: securityClassEnum("security_class")
      .default("GREEN")
      .notNull(),
    threatLevel: threatLevelEnum("threat_level").default("low").notNull(),
    departmentId: uuid("department_id").references(() => departments.id),
    siteAssignment: text("site_assignment"),
    status: projectStatusEnum("status").default("active").notNull(),
    description: text("description"),
    containmentProcedures: text("containment_procedures"),
    researchProtocols: text("research_protocols"),
    progress: integer("progress").default(0).notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: index("idx_projects_code").on(table.projectCode),
    statusIdx: index("idx_projects_status").on(table.status),
    securityIdx: index("idx_projects_security").on(table.securityClass),
    deptIdx: index("idx_projects_dept").on(table.departmentId),
  })
);

export const projectAssignments = pgTable(
  "project_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: projectRoleEnum("role").default("researcher").notNull(),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    assignedBy: uuid("assigned_by").references(() => users.id),
  },
  (table) => ({
    uniqueAssign: unique().on(table.projectId, table.userId),
    projectIdx: index("idx_assign_project").on(table.projectId),
    userIdx: index("idx_assign_user").on(table.userId),
  })
);

export const projectAccessRules = pgTable(
  "project_access_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    accessType: projectAccessTypeEnum("access_type").notNull(),
    targetId: uuid("target_id"),
    minClearance: integer("min_clearance"),
    role: projectRoleEnum("role").default("researcher").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (table) => ({
    projectIdx: index("idx_access_rules_project").on(table.projectId),
    typeIdx: index("idx_access_rules_type").on(table.accessType),
  })
);

export const logbookEntries = pgTable(
  "logbook_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    entryNumber: integer("entry_number"),
    entryText: text("entry_text").notNull(),
    entryType: entryTypeEnum("entry_type").default("observation").notNull(),
    attachments: jsonb("attachments").$type<{
      images?: string[];
      documents?: string[];
    }>(),
    minClearanceToView: integer("min_clearance_to_view").default(0),
    redactedVersion: text("redacted_version"),
    isRedacted: boolean("is_redacted").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("idx_logbook_project").on(table.projectId),
    authorIdx: index("idx_logbook_author").on(table.authorId),
    dateIdx: index("idx_logbook_date").on(table.createdAt),
  })
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportCode: text("report_code").notNull().unique(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    summary: text("summary"),
    reportType: reportTypeEnum("report_type").default("general").notNull(),
    priority: priorityEnum("priority").default("normal").notNull(),
    projectId: uuid("project_id").references(() => projects.id),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    status: reportStatusEnum("status").default("pending").notNull(),
    minClearanceToView: integer("min_clearance_to_view").default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    acknowledgedAt: timestamp("acknowledged_at"),
    acknowledgedBy: uuid("acknowledged_by").references(() => users.id),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: uuid("resolved_by").references(() => users.id),
  },
  (table) => ({
    codeIdx: index("idx_reports_code").on(table.reportCode),
    statusIdx: index("idx_reports_status").on(table.status),
    priorityIdx: index("idx_reports_priority").on(table.priority),
    authorIdx: index("idx_reports_author").on(table.authorId),
  })
);

export const reportReads = pgTable(
  "report_reads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueRead: unique().on(table.reportId, table.userId),
  })
);

export const letters = pgTable(
  "letters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicToken: text("public_token").notNull().unique(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    style: letterStyleEnum("style").default("standard").notNull(),
    sealType: sealTypeEnum("seal_type").default("ouroboros").notNull(),
    signature: text("signature"),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    recipientName: text("recipient_name"),
    viewCount: integer("view_count").default(0).notNull(),
    isPublic: boolean("is_public").default(true).notNull(),
    isSealed: boolean("is_sealed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: index("idx_letters_token").on(table.publicToken),
    authorIdx: index("idx_letters_author").on(table.authorId),
  })
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    displayName: text("display_name").notNull(),
    title: text("title"),
    clearanceLevel: integer("clearance_level").notNull().default(1),
    departmentId: uuid("department_id").references(() => departments.id),
    rankId: uuid("rank_id").references(() => ranks.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    usedBy: uuid("used_by").references(() => users.id),
  },
  (table) => ({
    tokenIdx: index("idx_invites_token").on(table.token),
  })
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    discordHandle: text("discord_handle").notNull(),
    email: text("email"),
    proposedName: text("proposed_name").notNull(),
    proposedTitle: text("proposed_title"),
    requestedDepartmentId: uuid("requested_department_id").references(() => departments.id),
    requestedRankId: uuid("requested_rank_id").references(() => ranks.id),
    preferredDepartment: text("preferred_department"),
    username: text("username"),
    passwordHash: text("password_hash"),
    motivation: text("motivation"),
    experience: text("experience"),
    referral: text("referral"),
    status: applicationStatusEnum("status").default("pending").notNull(),
    adminNotes: text("admin_notes"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    createdUserId: uuid("created_user_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("idx_apps_status").on(table.status),
    dateIdx: index("idx_apps_date").on(table.createdAt),
    usernameIdx: index("idx_apps_username").on(table.username),
  })
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: uuid("target_id"),
    details: jsonb("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("idx_activity_user").on(table.userId),
    actionIdx: index("idx_activity_action").on(table.action),
    dateIdx: index("idx_activity_date").on(table.createdAt),
  })
);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const covenantRoleEnum = pgEnum("covenant_role", [
  "sovereign",
  "keeper",
  "initiate",
  "aspirant",
]);

export const covenantMembers = pgTable(
  "covenant_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    covenantTitle: text("covenant_title").notNull(),
    covenantRole: covenantRoleEnum("covenant_role").default("aspirant").notNull(),
    oathTakenAt: timestamp("oath_taken_at").notNull(),
    inductedBy: uuid("inducted_by").references(() => users.id),
    sigil: text("sigil"),
    motto: text("motto"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("idx_covenant_user").on(table.userId),
    roleIdx: index("idx_covenant_role").on(table.covenantRole),
  })
);

export const covenantInvitations = pgTable(
  "covenant_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    targetUserId: uuid("target_user_id").references(() => users.id),
    targetName: text("target_name").notNull(),
    proposedTitle: text("proposed_title").notNull(),
    proposedRole: covenantRoleEnum("proposed_role").default("aspirant").notNull(),
    proposedSignil: text("proposed_sigil"),
    invocationText: text("invocation_text"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    username: text("username"),
    passwordHash: text("password_hash"),
  },
  (table) => ({
    tokenIdx: index("idx_covenant_invite_token").on(table.token),
  })
);

export const projectProposals = pgTable(
  "project_proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    codename: text("codename"),
    objectClass: text("object_class"),
    securityClass: securityClassEnum("security_class").default("GREEN").notNull(),
    threatLevel: threatLevelEnum("threat_level").default("low").notNull(),
    siteAssignment: text("site_assignment"),
    description: text("description"),
    containmentProcedures: text("containment_procedures"),
    researchProtocols: text("research_protocols"),
    justification: text("justification"),
    estimatedResources: text("estimated_resources"),
    proposedTimeline: text("proposed_timeline"),
    status: proposalStatusEnum("status").default("pending").notNull(),
    adminNotes: text("admin_notes"),
    rejectionReason: text("rejection_reason"),
    revisionNotes: text("revision_notes"),
    submittedBy: uuid("submitted_by")
      .notNull()
      .references(() => users.id),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    createdProjectId: uuid("created_project_id").references(() => projects.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("idx_proposals_status").on(table.status),
    submitterIdx: index("idx_proposals_submitter").on(table.submittedBy),
    dateIdx: index("idx_proposals_date").on(table.createdAt),
  })
);

export const proposalDepartments = pgTable(
  "proposal_departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => projectProposals.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").default(false).notNull(),
  },
  (table) => ({
    uniqueDept: unique().on(table.proposalId, table.departmentId),
    proposalIdx: index("idx_prop_depts_proposal").on(table.proposalId),
  })
);

export const proposalClearanceRequirements = pgTable(
  "proposal_clearance_requirements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => projectProposals.id, { onDelete: "cascade" }),
    clearanceLevel: integer("clearance_level").notNull(),
    description: text("description"),
  },
  (table) => ({
    proposalIdx: index("idx_prop_clearance_proposal").on(table.proposalId),
  })
);

export const projectDepartments = pgTable(
  "project_departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").default(false).notNull(),
  },
  (table) => ({
    uniqueDept: unique().on(table.projectId, table.departmentId),
    projectIdx: index("idx_proj_depts_project").on(table.projectId),
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// ORDO SERPENTIUS - SEAT ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const serpentiusClearanceEnum = pgEnum("serpentius_clearance", [
  "ouroboros_sovereign", // CL5 - The Keeper, chairs the council
  "ophidian_apex",       // CL2 - Inner circle, full operational knowledge
  "venom_circle",        // CL1 - Operational members, significant access
  "scale_bearer",        // CL0 - Aware of existence, need-to-know only
  "outer_coil",          // Outside but aware of existence
]);

export const serpentiusSeats = pgTable(
  "serpentius_seats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seatId: text("seat_id").notNull().unique(), // e.g., "prime_minister", "war_minister"
    position: text("position").notNull(), // Display name: "Prime Minister"
    serpentTitle: text("serpent_title").notNull(), // "The Basilisk"
    clearance: serpentiusClearanceEnum("clearance").notNull(),
    symbol: text("symbol").notNull().default("⛧"),
    duties: text("duties").notNull(),
    obligations: text("obligations").notNull(),
    // Assigned member info
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    memberName: text("member_name"), // Display name (can differ from user)
    memberDiscord: text("member_discord"),
    memberImage: text("member_image"),
    // Metadata
    appointedAt: timestamp("appointed_at"),
    appointedBy: uuid("appointed_by").references(() => users.id),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    seatIdx: index("idx_serpentius_seat").on(table.seatId),
    userIdx: index("idx_serpentius_user").on(table.userId),
    clearanceIdx: index("idx_serpentius_clearance").on(table.clearance),
  })
);
