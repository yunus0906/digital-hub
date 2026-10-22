// 通用 API 请求封装
export function useApiFetch<T>(path: string, options: Record<string, unknown> = {}) {
  return $fetch<T>(`/api/v1${path}`, options)
}
