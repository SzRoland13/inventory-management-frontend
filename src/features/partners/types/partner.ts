export enum PartnerType {
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  BOTH = 'BOTH',
}

export enum ContactType {
  BILLING = 'BILLING',
  SHIPPING = 'SHIPPING',
  BOTH = 'BOTH',
  OTHER = 'OTHER',
}

export interface PartnerRequest {
  name: string;
  type: PartnerType;
  taxNumber: string | null;
}

export interface ContactRequest {
  type: ContactType;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  country: string;
  phone: string | null;
  email: string | null;
}

export interface ContactResponse extends ContactRequest {
  id: number;
  removed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerResponse extends PartnerRequest {
  id: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  contacts: ContactResponse[];
}
