export enum Routes {
  Login = '/login',
  Login_Start = '/login-start',
  Loading = '/loading',
  First_Login = '/first-login',
  Setup_Password = '/setup-password',
  Two_Fa_Login = '/2fa-login',
  Two_Fa_Setup = '/2fa-setup',
  Dashboard = '/dashboard',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SALES = 'SALES',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  SETUP_REQUIRED = 'SETUP_REQUIRED',
}
