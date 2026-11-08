const PASSWORD_SETUP_TOKEN_KEY = 'password-setup-token';

export function storePasswordSetupToken(token: string) {
  window.sessionStorage.setItem(PASSWORD_SETUP_TOKEN_KEY, token);
}

export function getPasswordSetupToken() {
  return window.sessionStorage.getItem(PASSWORD_SETUP_TOKEN_KEY);
}

export function clearPasswordSetupToken() {
  window.sessionStorage.removeItem(PASSWORD_SETUP_TOKEN_KEY);
}
