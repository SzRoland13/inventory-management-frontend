export type ApiResponse<T> = {
  success: boolean;
  massageKey: string;
  data: T;
};
