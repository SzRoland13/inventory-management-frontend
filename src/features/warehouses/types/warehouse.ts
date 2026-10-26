export enum WarehouseType {
  STANDARD = 'STANDARD',
  VIRTUAL = 'VIRTUAL',
  TRANSIT = 'TRANSIT',
}

export enum WarehouseStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface WarehouseAddress {
  country: string;
  city: string;
  addressLine1: string;
  addressLine2: string | null;
  phone: string | null;
  email: string | null;
}

export interface WarehouseRequest {
  name: string;
  code: string;
  type: WarehouseType;
  address: WarehouseAddress | null;
}

export interface WarehouseResponse extends WarehouseRequest {
  id: number;
  companyId: number;
  status: WarehouseStatus;
  createdAt: string;
  updatedAt: string;
}
