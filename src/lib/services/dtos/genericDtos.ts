export type ApiResponse<T> = {
  success: boolean;
  messageKey: string;
  data: T;
};
