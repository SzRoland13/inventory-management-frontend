export type TwoFactorSetupRequest = {
  email: string;
  shortLifeToken: string;
};

export type PasswordSetupRequest = {
  oneTimeCode: string;
  password: string;
  repeatPassword: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type UserDetails = {
  id: number;
  email: string;
  username: string;
  role: string;
  avatarId: number | null;
  avatarUrl: string | null;
  avatarUrlExpiry: string | null;
};

export type LoginResponse = {
  user: UserDetails;
  firstTime2FAEnabled: boolean;
};

export type ShortLifeTokenResponse = {
  twoFactorEnabled: boolean;
  shortLifeToken: string;
  expiresAt: Date;
};

export type TwoFactorVerifyRequest = {
  email: string;
  code: string;
  shortLifeToken: string;
};
