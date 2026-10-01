import { z } from "zod";

const str = (max: number) => z.string().max(max).default("");
const month = z.string().regex(/^\d{4}-\d{2}$/).or(z.literal("")).nullable().default("");

export const experienceSchema = z.object({
  id: z.string(),
  title: str(120),
  company: str(120),
  location: str(120),
  start: month,
  end: month, // "" ou null = en cours
  description: str(1200),
});
export const educationSchema = z.object({
  id: z.string(),
  degree: str(160),
  school: str(160),
  field: str(120),
  location: str(120),
  start: month,
  end: month,
  honors: str(120),
});
export const skillSchema = z.object({ id: z.string(), name: str(60), level: z.number().int().min(0).max(5).default(0) });
export const languageSchema = z.object({ id: z.string(), name: str(60), level: str(40) });
export const certificationSchema = z.object({ id: z.string(), name: str(160), issuer: str(120), year: str(8) });
export const projectSchema = z.object({ id: z.string(), title: str(120), description: str(600), url: str(200) });
export const volunteeringSchema = z.object({
  id: z.string(), role: str(120), organization: str(120), start: month, end: month, description: str(600),
});
export const referenceSchema = z.object({ id: z.string(), name: str(100), title: str(100), organization: str(100), contact: str(120) });
export const linkSchema = z.object({ id: z.string(), label: str(40), url: str(200) });

export const cvContentSchema = z.object({
  version: z.literal(1).default(1),
  basics: z.object({
    firstName: str(60),
    lastName: str(60),
    headline: str(120),
    email: str(120),
    phone: str(40),
    city: str(80),
    country: str(80),
    address: str(160),
    links: z.array(linkSchema).max(6).default([]),
  }),
  summary: str(700),
  experiences: z.array(experienceSchema).max(10).default([]),
  education: z.array(educationSchema).max(6).default([]),
  skills: z.array(skillSchema).max(20).default([]),
  languages: z.array(languageSchema).max(8).default([]),
  certifications: z.array(certificationSchema).max(10).default([]),
  projects: z.array(projectSchema).max(6).default([]),
  volunteering: z.array(volunteeringSchema).max(5).default([]),
  interests: z.array(z.string().max(40)).max(10).default([]),
  references: z.array(referenceSchema).max(3).default([]),
});
export type CvContent = z.infer<typeof cvContentSchema>;

export const SECTION_KEYS = [
  "summary", "experiences", "education", "skills", "languages",
  "certifications", "projects", "volunteering", "interests", "references",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const FONTS = ["Inter", "Lato", "Poppins", "Montserrat", "Open Sans", "Merriweather"] as const;
export type FontName = (typeof FONTS)[number];

export const ACCENTS = [
  { name: "Émeraude", value: "#0B6B4F" },
  { name: "Océan", value: "#1D4ED8" },
  { name: "Ardoise", value: "#334155" },
  { name: "Prune", value: "#9D174D" },
  { name: "Ambre", value: "#B45309" },
  { name: "Indigo", value: "#4338CA" },
  { name: "Turquoise", value: "#0F766E" },
  { name: "Rouge", value: "#B91C1C" },
];

export const cvStyleSchema = z.object({
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0B6B4F"),
  font: z.enum(FONTS).default("Inter"),
  scale: z.enum(["sm", "md", "lg"]).default("md"),
  density: z.enum(["compact", "normal", "airy"]).default("normal"),
  photoShape: z.enum(["round", "square"]).default("round"),
  hidden: z.array(z.string()).default([]),
  order: z.array(z.string()).default([]),
  showPhoto: z.boolean().default(true),
});
export type CvStyle = z.infer<typeof cvStyleSchema>;

export const defaultStyle = (): CvStyle => cvStyleSchema.parse({});

export const uid = () => Math.random().toString(36).slice(2, 10);

export function emptyContent(): CvContent {
  return cvContentSchema.parse({
    basics: { firstName: "", lastName: "", headline: "", email: "", phone: "", city: "", country: "Bénin", address: "", links: [] },
    summary: "",
  });
}

export function sampleContent(): CvContent {
  return cvContentSchema.parse({
    basics: {
      firstName: "Awa", lastName: "Adjovi", headline: "Gestionnaire commerciale",
      email: "awa.adjovi@exemple.com", phone: "+229 01 97 00 00 00", city: "Cotonou", country: "Bénin", address: "",
      links: [{ id: "l1", label: "LinkedIn", url: "linkedin.com/in/awa-adjovi" }],
    },
    summary: "Gestionnaire commerciale avec 5 ans d’expérience dans la vente et la relation client. Orientée résultats, j’ai contribué à augmenter le portefeuille clients de 35 % et je recherche un poste de responsable commercial dans une entreprise en croissance.",
    experiences: [
      { id: "e1", title: "Chargée de clientèle senior", company: "Société Béninoise de Distribution", location: "Cotonou", start: "2022-03", end: "", description: "Gestion d’un portefeuille de 120 clients professionnels\nAugmentation du chiffre d’affaires de 35 % en 18 mois\nFormation de 4 nouveaux conseillers commerciaux" },
      { id: "e2", title: "Conseillère commerciale", company: "Moov Africa Bénin", location: "Porto-Novo", start: "2020-01", end: "2022-02", description: "Vente de solutions mobiles et suivi après-vente\nAtteinte de 112 % des objectifs trimestriels\nOrganisation d’opérations de prospection terrain" },
      { id: "e3", title: "Stagiaire commerciale", company: "Orabank Bénin", location: "Cotonou", start: "2019-06", end: "2019-12", description: "Accueil et orientation de la clientèle\nSaisie et suivi des dossiers clients" },
    ],
    education: [
      { id: "f1", degree: "Licence en Gestion commerciale", school: "Université d’Abomey-Calavi", field: "Gestion", location: "Abomey-Calavi", start: "2016-10", end: "2019-07", honors: "Mention Bien" },
      { id: "f2", degree: "Baccalauréat série G2", school: "Lycée Béhanzin", field: "Gestion", location: "Porto-Novo", start: "2015-09", end: "2016-06", honors: "" },
    ],
    skills: [
      { id: "s1", name: "Négociation commerciale", level: 5 }, { id: "s2", name: "Relation client", level: 5 },
      { id: "s3", name: "Excel & tableaux de bord", level: 4 }, { id: "s4", name: "Prospection terrain", level: 4 },
      { id: "s5", name: "CRM (HubSpot)", level: 3 },
    ],
    languages: [{ id: "g1", name: "Français", level: "Langue maternelle" }, { id: "g2", name: "Anglais", level: "Courant" }, { id: "g3", name: "Fon", level: "Langue maternelle" }],
    certifications: [{ id: "c1", name: "Techniques de vente avancées", issuer: "CCI Bénin", year: "2023" }],
    projects: [],
    volunteering: [{ id: "v1", role: "Mentore", organization: "Jeunes Entrepreneurs du Bénin", start: "2021-01", end: "", description: "Accompagnement de jeunes porteurs de projets" }],
    interests: ["Lecture", "Entrepreneuriat", "Football"],
    references: [],
  });
}

export function parseContent(raw: string): CvContent {
  try { return cvContentSchema.parse(JSON.parse(raw)); } catch { return emptyContent(); }
}
export function parseStyle(raw: string): CvStyle {
  try { return cvStyleSchema.parse(JSON.parse(raw)); } catch { return defaultStyle(); }
}
