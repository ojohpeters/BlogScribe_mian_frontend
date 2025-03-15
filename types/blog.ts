export interface BlogPost {
  title: string
  url: string
}

export interface ParaphraseResponse {
  Post?: string
  Paraphrased?: string
  error?: string
}

export interface SEOMetadata {
  metaTitle: string
  metaDescription: string
  focusKeyword: string
  tags: string[]
  categories: string[]
  isFeatured: boolean
}

export type PlanType = "PLAN1"

