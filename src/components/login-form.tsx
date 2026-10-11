"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/exams");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between bg-primary p-16 text-primary-foreground">
        <div className="flex items-center gap-3 font-semibold text-xl">
          <BookOpen /> Exam Studio
        </div>
        <div>
          <span className="eyebrow text-primary-foreground/60">
            A LITTLE MORE INTENTION. A BETTER PAPER.
          </span>
          <h1 className="mt-5 text-5xl leading-tight font-semibold max-w-lg">
            Good questions.
            <br />
            Thoughtful assessment.
          </h1>
          <p className="mt-6 max-w-md text-lg text-primary-foreground/70">
            Your expertise, supported by AI. Create balanced mathematics papers,
            refine every question, and keep the final say.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          Grade 7 Mathematics · Authoring POC
        </p>
      </section>
      <section className="flex items-center justify-center p-8">
        <form onSubmit={login} className="w-full max-w-sm space-y-6">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <BookOpen />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Welcome back
            </h2>
            <p className="text-muted-foreground mt-2">
              Sign in to your private examiner workspace.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <Button className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
            <ArrowRight className="size-4" />
          </Button>
          <p className="text-xs text-muted-foreground flex gap-2 leading-relaxed">
            <ShieldCheck className="size-4 shrink-0" /> Accounts are provisioned
            by your administrator. Your exams are visible only to you.
          </p>
        </form>
      </section>
    </main>
  );
}
