export const DEFAULT_DEPARTMENTS = [
  {
    name: "Mechanicus",
    codename: "TECH",
    description:
      "The keepers of forbidden technology and arcane machinery. They maintain the Foundation's technological infrastructure and research anomalous devices.",
    iconSymbol: "⚙",
    color: "#b87333",
    ranks: [
      { name: "Magos", shortName: "M", clearanceLevel: 4, sortOrder: 4, description: "Master of the Machine Cult" },
      { name: "Senior Adept", shortName: "SA", clearanceLevel: 3, sortOrder: 3, description: "Experienced tech-priest" },
      { name: "Adept", shortName: "A", clearanceLevel: 2, sortOrder: 2, description: "Initiated tech-priest" },
      { name: "Acolyte", shortName: "Ac", clearanceLevel: 1, sortOrder: 1, description: "Novice of the Machine God" },
    ],
  },
  {
    name: "Occult",
    codename: "ARCANA",
    description:
      "Practitioners of the esoteric arts. They study and contain supernatural phenomena, ritual magic, and entities from beyond the veil.",
    iconSymbol: "⛧",
    color: "#6b3fa0",
    ranks: [
      { name: "Archon", shortName: "Ar", clearanceLevel: 4, sortOrder: 4, description: "Master of the Arcane" },
      { name: "Senior Magister", shortName: "SM", clearanceLevel: 3, sortOrder: 3, description: "Experienced occultist" },
      { name: "Magister", shortName: "Mg", clearanceLevel: 2, sortOrder: 2, description: "Practicing occultist" },
      { name: "Aspirant", shortName: "As", clearanceLevel: 1, sortOrder: 1, description: "Student of the mysteries" },
    ],
  },
  {
    name: "Ministry of Science",
    codename: "SCIENTIA",
    description:
      "The empirical arm of the Foundation. They apply the scientific method to understand and document anomalous phenomena.",
    iconSymbol: "◎",
    color: "#2a8a8a",
    ranks: [
      { name: "Lead Researcher", shortName: "LR", clearanceLevel: 2, sortOrder: 4, description: "Department research lead" },
      { name: "Senior Researcher", shortName: "SR", clearanceLevel: 1, sortOrder: 3, description: "Experienced researcher" },
      { name: "Researcher", shortName: "R", clearanceLevel: 1, sortOrder: 2, description: "Full researcher" },
      { name: "Junior Researcher", shortName: "JR", clearanceLevel: 0, sortOrder: 1, description: "Trainee researcher" },
    ],
  },
  {
    name: "Red Hand",
    codename: "RUBRUM",
    description:
      "The Foundation's enforcement and security division. They handle containment breaches, security operations, and protection of personnel and assets.",
    iconSymbol: "✋",
    color: "#8b1a1a",
    ranks: [
      { name: "Commander of the Red Hand", shortName: "CMD", clearanceLevel: 5, sortOrder: 3, description: "Supreme commander of security operations" },
      { name: "Deputy Commander of the Red Hand", shortName: "DCMD", clearanceLevel: 4, sortOrder: 2, description: "Second in command of security operations" },
      { name: "Red Hand", shortName: "RH", clearanceLevel: 3, sortOrder: 1, description: "Enforcement operative" },
    ],
  },
  {
    name: "Leadership",
    codename: "COMMAND",
    description:
      "The governing body of the Foundation. They oversee all operations, set policy, and make decisions that shape the organization's future.",
    iconSymbol: "◆",
    color: "#c9a227",
    ranks: [
      { name: "Founder", shortName: "F", clearanceLevel: 5, sortOrder: 6, description: "Founding member of the Foundation" },
      { name: "Director", shortName: "D", clearanceLevel: 5, sortOrder: 5, description: "Executive director of the Foundation" },
      { name: "Deputy Director", shortName: "DD", clearanceLevel: 4, sortOrder: 4, description: "Second in command of the Foundation" },
      { name: "Senior Administrator", shortName: "SA", clearanceLevel: 4, sortOrder: 3, description: "Senior administrative officer" },
      { name: "Administrator", shortName: "A", clearanceLevel: 3, sortOrder: 2, description: "Administrative officer" },
      { name: "Coordinator", shortName: "C", clearanceLevel: 2, sortOrder: 1, description: "Operations coordinator" },
    ],
  },
];

export type DepartmentKey =
  | "mechanicus"
  | "occult"
  | "science"
  | "redhand";
