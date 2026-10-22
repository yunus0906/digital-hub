export function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('zh-CN')
}

export function fmtMem(mb: number | null) {
  if (mb === null) return '—'
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
}

export function codeStatusLabel(s: string) {
  const map: Record<string, string> = {
    open_source: '开源', closed_source: '闭源', partial_source: '部分开源',
    incomplete_source: '源码不完整', undisclosed: '未公布', license_unconfirmed: '许可证未确认',
  }
  return map[s] ?? s
}
