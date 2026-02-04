export const CLEARANCE_LEVELS = {
  0: {
    name: "Pending",
    title: "Uncleared",
    description: "Awaiting verification",
    color: "#606068",
    canAccess: [] as string[],
  },
  1: {
    name: "Level 1",
    title: "Initiate",
    description: "Basic access to assigned projects",
    color: "#4a5568",
    canAccess: ["dashboard", "assigned-projects", "letters"],
  },
  2: {
    name: "Level 2",
    title: "Acolyte",
    description: "Can contribute to research and view reports",
    color: "#2a8a8a",
    canAccess: ["dashboard", "assigned-projects", "letters", "reports-view"],
  },
  3: {
    name: "Level 3",
    title: "Adept",
    description: "Can create projects and manage department activities",
    color: "#b87333",
    canAccess: [
      "dashboard",
      "all-dept-projects",
      "letters",
      "reports",
      "create-projects",
    ],
  },
  4: {
    name: "Level 4",
    title: "Magos",
    description: "Cross-department access, personnel management",
    color: "#c9a227",
    canAccess: [
      "dashboard",
      "all-projects",
      "letters",
      "reports",
      "personnel",
      "invitations",
    ],
  },
  5: {
    name: "Level 5",
    title: "Archmagos",
    description: "Full administrative access",
    color: "#c42b2b",
    canAccess: ["*"],
  },
} as const;

export type ClearanceLevel = keyof typeof CLEARANCE_LEVELS;

export const SECURITY_CLASS_REQUIREMENTS: Record<string, number> = {
  GREEN: 1,
  AMBER: 2,
  RED: 4,
  BLACK: 5,
};

export function getClearanceInfo(level: number) {
  return CLEARANCE_LEVELS[level as ClearanceLevel] ?? CLEARANCE_LEVELS[0];
}

export function canAccessSecurityClass(
  userClearance: number,
  securityClass: string
): boolean {
  const required = SECURITY_CLASS_REQUIREMENTS[securityClass] ?? 1;
  return userClearance >= required;
}

export function hasClearance(userClearance: number, required: number): boolean {
  return userClearance >= required;
}

export const DIVISIONS = {
  MECHANICUS: {
    name: "Mechanicus",
    codename: "TECH",
    icon: "⚙",
    color: "#b87333",
    description: "The keepers of forbidden technology and arcane machinery",
    ranks: [
      { name: "Magos", shortName: "M", clearance: 4 },
      { name: "Senior Adept", shortName: "SA", clearance: 3 },
      { name: "Adept", shortName: "A", clearance: 2 },
      { name: "Acolyte", shortName: "Ac", clearance: 1 },
    ],
  },
  OCCULT: {
    name: "Occult",
    codename: "ARCANA",
    icon: "⛧",
    color: "#6b3fa0",
    description: "Practitioners of the esoteric arts",
    ranks: [
      { name: "Archon", shortName: "Ar", clearance: 4 },
      { name: "Senior Magister", shortName: "SM", clearance: 3 },
      { name: "Magister", shortName: "Mg", clearance: 2 },
      { name: "Aspirant", shortName: "As", clearance: 1 },
    ],
  },
  MINISTRY_OF_SCIENCE: {
    name: "Ministry of Science",
    codename: "SCIENTIA",
    icon: "◎",
    color: "#2a8a8a",
    description: "The empirical arm of the Foundation",
    ranks: [
      { name: "Lead Researcher", shortName: "LR", clearance: 2 },
      { name: "Senior Researcher", shortName: "SR", clearance: 1 },
      { name: "Researcher", shortName: "R", clearance: 1 },
      { name: "Junior Researcher", shortName: "JR", clearance: 0 },
    ],
  },
  RED_HAND: {
    name: "Red Hand",
    codename: "RUBRUM",
    icon: "✋",
    color: "#8b1a1a",
    description: "The Foundation's enforcement and security division",
    ranks: [
      { name: "Commander of the Red Hand", shortName: "CMD", clearance: 5 },
      { name: "Deputy Commander of the Red Hand", shortName: "DCMD", clearance: 4 },
      { name: "Red Hand", shortName: "RH", clearance: 3 },
    ],
  },
} as const;

export type DivisionKey = keyof typeof DIVISIONS;
