export type DictionaryItem = { id: string; name: string; cityId?: string };

export type CatalogDictionaries = {
  specializations: DictionaryItem[];
  injuryTypes: DictionaryItem[];
  cities: DictionaryItem[];
  districts: DictionaryItem[];
  formats: DictionaryItem[];
};

export type SpecialistCard = {
  id: string;
  fullName: string;
  photoUrl: string | null;
  experienceYears: number;
  pricePerSession: number;
  city: { id: string; name: string } | null;
  district: { id: string; name: string } | null;
  specializations: { id: string; name: string }[];
  formats: { id: string; name: string }[];
  ratingAvg: number;
  ratingCount: number;
  inclusiveSpace: boolean;
  isDemo: boolean;
};

export type SpecialistService = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export type SpecialistProfile = SpecialistCard & {
  description: string;
  injuryTypes: { id: string; name: string }[];
  services: SpecialistService[];
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SpecialistReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  authorName: string;
};

export type SpecialistsSort =
  | "price_asc"
  | "price_desc"
  | "experience_desc"
  | "experience_asc"
  | "rating_desc"
  | "newest";
