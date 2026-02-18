export type ApiResponse<T> = {
  success: boolean;
  messageKey: string;
  payload: T;
};
