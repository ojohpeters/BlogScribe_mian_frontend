import type { Tag } from "@/types/blog"

interface TagCloudProps {
  tags: Tag[]
}

export function TagCloud({ tags }: TagCloudProps) {
  const tagCounts: Record<string, number> = {}
  tags.forEach((tag) => {
    tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1
  })

  const maxCount = Math.max(...Object.values(tagCounts))

  return (
    <div className="bg-muted p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Tag Cloud</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(tagCounts).map(([tag, count]) => (
          <span
            key={tag}
            className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold"
            style={{
              fontSize: `${Math.max(0.8, (count / maxCount) * 1.5)}rem`,
              opacity: 0.3 + (count / maxCount) * 0.7,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

