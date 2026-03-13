export type CompanyMinimalResponse = {
  id: number;
  name: string;
  logoId: number | null;
  logoUrl: string | null;
  logoUrlExpiry: string | null;
};

export type CompanyBaseDataResponse = {
  id: number;
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  website: string;
};

export type CompanyExtendedResponse = CompanyMinimalResponse & {
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

export type CompanyBillingDataResponse = {
  id: number;
  taxNumber: string;
  vatNumber: string;
  registrationNumber: string;
  bankAccount: string;
  iban: string;
};

export type CompanyBaseDataUpdateRequest = {
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  website: string;
};

export type CompanyBillingDataUpdateRequest = {
  taxNumber: string;
  vatNumber: string;
  registrationNumber: string;
  bankAccount: string;
  iban: string;
};

export type LogoUpdateRequest = {
  mediaAssetId: number;
};
