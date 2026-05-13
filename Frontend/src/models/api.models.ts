
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  page?: number;
  limit?: number;
}
