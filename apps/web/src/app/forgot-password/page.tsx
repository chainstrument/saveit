"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      if (error) throw new Error(error.message ?? "Erreur");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-primary" />
            <span className="font-semibold text-xl">SaveIt</span>
          </div>
          <p className="text-muted-foreground text-sm">Réinitialisation du mot de passe</p>
        </div>

        {sent ? (
          <div className="text-center flex flex-col gap-3">
            <p className="text-sm">Email envoyé à <strong>{email}</strong>.</p>
            <p className="text-sm text-muted-foreground">
              Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
            </p>
            <a href="/login" className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground">
              Retour à la connexion
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                autoComplete="email"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="mt-1 w-full" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le lien"}
            </Button>

            <a href="/login" className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Retour à la connexion
            </a>
          </form>
        )}
      </div>
    </div>
  );
}
