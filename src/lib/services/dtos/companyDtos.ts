export type CompanyBaseDataResponse = {
  id: number;
  name: string;
  logoId: number | null;
  logoUrl: string | null;
  logoUrlExpiry: number | null;
  exists: boolean;
};

export type CompanyExtendedResponse = CompanyBaseDataResponse & {
  description: string;
  email: string;
  phone: string;
  address: string;
  website: string;
};

export type CompanyUpdateRequest = {
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  website: string;
};

export type LogoUpdateRequest = {
  mediaAssetId: number;
};
