// 分类中文名与路由映射
export const CATEGORY_LABELS: Record<string, string> = {
  airport: '机场订阅',
  client_app: '订阅客户端',
  proxy_core: '订阅客户端',
  vps_plan: 'VPS / 云服务器',
  ai_model: 'AI 模型',
  dev_service: '开发者服务',
}

export function categoryPath(category: string): string {
  switch (category) {
    case 'airport':
      return '/airports'
    case 'client_app':
    case 'proxy_core':
      return '/apps'
    case 'vps_plan':
      return '/vps'
    default:
      return '/'
  }
}

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category
}
