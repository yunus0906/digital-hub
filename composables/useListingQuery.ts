type ListingFilters = Record<string, string | number | null | undefined> & { page: number }

export function buildListingQuery(filters: ListingFilters): Record<string, string> {
  const query: Record<string, string> = {}
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined && value !== '__all__' && !(key === 'page' && value === 1)) {
      query[key] = String(value)
    }
  })
  return query
}

export function useListingQuery(path: string, filters: ListingFilters) {
  const router = useRouter()
  let timer: ReturnType<typeof setTimeout> | null = null

  function cancelPending() {
    if (timer) clearTimeout(timer)
    timer = null
  }

  function applyNow() {
    cancelPending()
    return router.replace({ path, query: buildListingQuery(filters) })
  }

  function scheduleApply() {
    cancelPending()
    timer = setTimeout(() => {
      timer = null
      filters.page = 1
      applyNow()
    }, 300)
  }

  function goPage(page: number) {
    cancelPending()
    filters.page = page
    return applyNow()
  }

  function resetQuery() {
    cancelPending()
    return router.replace({ path })
  }

  onUnmounted(cancelPending)

  return { scheduleApply, applyNow, goPage, resetQuery }
}
