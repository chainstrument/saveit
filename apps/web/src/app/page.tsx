import { Header } from "@/components/Header";
import { BookmarkList } from "@/components/bookmarks/BookmarkList";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <BookmarkList />
      </main>
    </div>
  );
}
