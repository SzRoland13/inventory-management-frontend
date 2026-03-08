export type CompanyBaseDataResponse = {
  id: number;
  name: string;
  logoId: number | null;
  logoUrl: string | null;
  logoUrlExpiry: string | null;
  exists: boolean;
};

export type CompanyExtendedResponse = CompanyBaseDataResponse & {
  description: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  taxNumber: string;
  vatNumber: string;
  registrationNumber: string;
  bankAccount: string;
  iban: string;
};

export type CompanyUpdateRequest = {
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  taxNumber: string;
  vatNumber: string;
  registrationNumber: string;
  bankAccount: string;
  iban: string;
};

export type LogoUpdateRequest = {
  mediaAssetId: number;
};
