import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

export type User = InferSelectModel<typeof schema.users>;
export type NewUser = InferInsertModel<typeof schema.users>;

export type Department = InferSelectModel<typeof schema.departments>;
export type NewDepartment = InferInsertModel<typeof schema.departments>;
export type DepartmentMember = InferSelectModel<typeof schema.departmentMembers>;

export type Project = InferSelectModel<typeof schema.projects>;
export type NewProject = InferInsertModel<typeof schema.projects>;
export type ProjectAssignment = InferSelectModel<typeof schema.projectAssignments>;

export type LogbookEntry = InferSelectModel<typeof schema.logbookEntries>;
export type NewLogbookEntry = InferInsertModel<typeof schema.logbookEntries>;

export type Report = InferSelectModel<typeof schema.reports>;
export type NewReport = InferInsertModel<typeof schema.reports>;
export type ReportRead = InferSelectModel<typeof schema.reportReads>;

export type Letter = InferSelectModel<typeof schema.letters>;
export type NewLetter = InferInsertModel<typeof schema.letters>;

export type Invitation = InferSelectModel<typeof schema.invitations>;
export type NewInvitation = InferInsertModel<typeof schema.invitations>;

export type Application = InferSelectModel<typeof schema.applications>;
export type NewApplication = InferInsertModel<typeof schema.applications>;

export type ActivityLog = InferSelectModel<typeof schema.activityLog>;

export type Session = InferSelectModel<typeof schema.sessions>;

export type ClearanceLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type SecurityClass = "GREEN" | "AMBER" | "RED" | "BLACK";

export type ThreatLevel =
  | "negligible"
  | "low"
  | "moderate"
  | "high"
  | "critical"
  | "apollyon";

export type ProjectStatus =
  | "active"
  | "review"
  | "suspended"
  | "archived"
  | "expunged";

export type UserWithDepartment = User & {
  primaryDepartment?: Department;
};

export type ProjectWithAssignments = Project & {
  assignments: (ProjectAssignment & { user: User })[];
  department?: Department;
  createdByUser?: User;
};

export type ReportWithAuthor = Report & {
  author: User;
  project?: Project;
};

export type LogbookEntryWithAuthor = LogbookEntry & {
  author: User;
};
