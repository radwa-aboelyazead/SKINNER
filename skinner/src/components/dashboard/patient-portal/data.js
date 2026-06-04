import eczemaImg from "@/assets/patient/eczema.jpg";
import acneImg from "@/assets/patient/acne.jpg";
import psoriasisImg from "@/assets/patient/psoriasis.jpg";
import eczemaHero from "@/assets/patient/eczema-hero.jpg";

export const patientImages = {
  patientSkin: null,
  analysisSkin: null,
  previousThumb: null,
  acneImg,
  eczemaImg,
  psoriasisImg,
  vitiligoImg: null,
  eczemaHero,
};

export const previousAnalyses = [];

export const doctors = [];
export const libraryConditions = [
  {
    id: "eczema",
    title: "Eczema (Atopic Dermatitis)",
    description:
      "A chronic inflammatory skin condition characterized by dry, itchy, and inflamed skin. Often associated with a personal or family history of atopy.",
    common: "Children, people with atopic history",
    symptoms: "Dryness, intense itching, red patches, scaling",
    image: eczemaImg,
  },
  {
    id: "acne",
    title: "Acne Vulgaris",
    description:
      "An inflammatory condition of the pilosebaceous unit, presenting with comedones, papules, pustules and sometimes nodules or cysts.",
    common: "Adolescents and young adults",
    symptoms: "Pimples, blackheads, whiteheads, possible scarring",
    image: acneImg,
  },
  {
    id: "psoriasis",
    title: "Psoriasis",
    description:
      "A chronic immune-mediated skin disease marked by sharply demarcated scaly plaques, frequently on extensor surfaces and the scalp.",
    common: "Adults, variable onset",
    symptoms: "Well-defined red plaques with silvery scale, itching sometimes",
    image: psoriasisImg,
  },
];
