import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PostForm() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="Enter post title" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="featured-image">Featured Image</Label>
        <Input id="featured-image" name="featured_image" type="file" accept="image/*" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="post-length">Post Length (words)</Label>
        <Input id="post-length" name="post_length" type="number" defaultValue={500} min={100} max={2000} step={100} />
        <div className="text-sm text-muted-foreground">Target word count</div>
      </div>
    </div>
  )
}

