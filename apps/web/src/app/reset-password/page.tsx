"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true);
    setError(null);
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token });
      if (error) throw new Error(error.message ?? "Lien invalide ou expiré");
      router.push("/login?reset=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-destructive text-center">
        Lien invalide. <a href="/forgot-password" className="underline">Refaire une demande</a>.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Nouveau mot de passe</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Confirmer</label>
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="mt-1 w-full" disabled={loading}>
        {loading ? "Enregistrement..." : "Changer le mot de passe"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-primary" />
            <span className="font-semibold text-xl">SaveIt</span>
          </div>
          <p className="text-muted-foreground text-sm">Nouveau mot de passe</p>
        </div>
        <Suspense fallback={<p className="text-sm text-muted-foreground text-center">Chargement...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
