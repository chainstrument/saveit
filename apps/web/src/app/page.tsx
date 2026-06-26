import { BookmarkList } from "@/components/bookmarks/BookmarkList";
import { Bookmark } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-lg">SaveIt</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <BookmarkList />
      </main>
    </div>
  );
}
