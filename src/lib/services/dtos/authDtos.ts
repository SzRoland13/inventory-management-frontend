export type EmailRequest = {
  email: string;
};

export type FirstLoginValidationRequest = {
  email: string;
  oneTimeCode: string;
};

export type PasswordSetupRequest = {
  email: string;
  password: string;
  repeatPassword: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type CheckFirstLoginResponse = {
  emailRegistered: boolean;
  firstLogin: boolean;
};

export type UserDetails = {
  email: string;
  username: string;
  role: string;
};

export type TokensDetails = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = {
  user: UserDetails;
  tokens: TokensDetails;
  firstTime2FAEnabled: boolean;
};

export type ShortLifeTokenResponse = {
  shortLifeToken: string;
  expiresAt: Date;
};

export type TwoFactorVerifyRequest = {
  email: string;
  code: string;
  shortLifeToken: string;
};
