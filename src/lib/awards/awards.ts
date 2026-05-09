/**
 * Static configuration for the six SAA 2025 award categories.
 *
 * Single source of truth shared by the Homepage awards grid and any future
 * Awards-screen deep links. Slugs are language-agnostic per FR-020 — they
 * stay identical across locales so `/awards#<slug>` is stable.
 */

export type AwardSlug =
  | "top-talent"
  | "top-project"
  | "top-project-leader"
  | "best-manager"
  | "signature-2025-creator"
  | "mvp";

export type Award = {
  readonly id: string;
  readonly slug: AwardSlug;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly labelAsset: string;
  readonly labelWidth: number;
  readonly labelHeight: number;
  readonly quantity: number;
  readonly unitKey: string | null;
  readonly valueVND: number;
  readonly valueVNDSecondary: number | null;
};

export const AWARDS: ReadonlyArray<Award> = [
  {
    id: "top-talent",
    slug: "top-talent",
    titleKey: "home.awards.top_talent.title",
    descriptionKey: "home.awards.top_talent.description",
    labelAsset: "/assets/home/images/award-top-talent.png",
    labelWidth: 222,
    labelHeight: 36,
    quantity: 10,
    unitKey: "awards.detail.unit.don_vi",
    valueVND: 7_000_000,
    valueVNDSecondary: null,
  },
  {
    id: "top-project",
    slug: "top-project",
    titleKey: "home.awards.top_project.title",
    descriptionKey: "home.awards.top_project.description",
    labelAsset: "/assets/home/images/award-top-project.png",
    labelWidth: 232,
    labelHeight: 35,
    quantity: 2,
    unitKey: "awards.detail.unit.tap_the",
    valueVND: 15_000_000,
    valueVNDSecondary: null,
  },
  {
    id: "top-project-leader",
    slug: "top-project-leader",
    titleKey: "home.awards.top_project_leader.title",
    descriptionKey: "home.awards.top_project_leader.description",
    labelAsset: "/assets/home/images/award-top-project-leader.png",
    labelWidth: 232,
    labelHeight: 64,
    quantity: 3,
    unitKey: "awards.detail.unit.ca_nhan",
    valueVND: 7_000_000,
    valueVNDSecondary: null,
  },
  {
    id: "best-manager",
    slug: "best-manager",
    titleKey: "home.awards.best_manager.title",
    descriptionKey: "home.awards.best_manager.description",
    labelAsset: "/assets/home/images/award-best-manager.png",
    labelWidth: 232,
    labelHeight: 30,
    quantity: 1,
    unitKey: "awards.detail.unit.ca_nhan",
    valueVND: 10_000_000,
    valueVNDSecondary: null,
  },
  {
    id: "signature-2025-creator",
    slug: "signature-2025-creator",
    titleKey: "home.awards.signature_2025_creator.title",
    descriptionKey: "home.awards.signature_2025_creator.description",
    labelAsset: "/assets/home/images/award-signature-2025-creator.png",
    labelWidth: 232,
    labelHeight: 54,
    quantity: 1,
    unitKey: null,
    valueVND: 5_000_000,
    valueVNDSecondary: 8_000_000,
  },
  {
    id: "mvp",
    slug: "mvp",
    titleKey: "home.awards.mvp.title",
    descriptionKey: "home.awards.mvp.description",
    labelAsset: "/assets/home/images/award-mvp.png",
    labelWidth: 116,
    labelHeight: 52,
    quantity: 1,
    unitKey: null,
    valueVND: 15_000_000,
    valueVNDSecondary: null,
  },
] as const;

export const AWARD_BG_ASSET = "/assets/home/images/award-bg.png";
