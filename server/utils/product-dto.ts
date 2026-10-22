import type { DataSource, ProductDataSource, ProductLink, Tag } from '@prisma/generated-client'

export function mapTag(item: { tag: Pick<Tag, 'name' | 'slug'> }) {
  return { name: item.tag.name, slug: item.tag.slug }
}

export function mapLink(link: Pick<ProductLink, 'linkType' | 'url' | 'label' | 'isOfficial'>) {
  return {
    type: link.linkType,
    url: link.url,
    label: link.label,
    isOfficial: link.isOfficial,
  }
}

export function mapDataSource(item: Pick<ProductDataSource, 'sourceUrl' | 'fieldKey' | 'verifiedAt'> & {
  dataSource: Pick<DataSource, 'name' | 'sourceType'>
}) {
  return {
    name: item.dataSource.name,
    type: item.dataSource.sourceType,
    sourceUrl: item.sourceUrl,
    fieldKey: item.fieldKey,
    verifiedAt: item.verifiedAt,
  }
}
