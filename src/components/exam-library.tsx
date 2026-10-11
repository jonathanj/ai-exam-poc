"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  Plus,
  Search,
  Files,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  Copy,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { request } from "@/lib/client";
type Row = {
  id: string;
  title: string;
  status: string;
  archived: boolean;
  sample: boolean;
  revision: number;
  updatedAt: string;
  marks: number;
  body: string;
  questionCount: number;
};
export function ExamLibrary({ exams }: { exams: Row[] }) {
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const active = exams.filter((e) => !e.archived);
  const shown = exams.filter(
    (e) =>
      e.archived === archived &&
      `${e.title} ${e.body}`.toLowerCase().includes(search.toLowerCase()),
  );
  async function action(exam: Row, action: string, payload?: unknown) {
    setError("");
    setBusy(true);
    try {
      const res = await request<{ id: string }>(`/api/exams/${exam.id}`, {
        action,
        revision: exam.revision,
        payload,
      });
      if (action === "duplicate") router.push(`/exams/${res.id}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <p className="eyebrow text-primary mb-3">YOUR ASSESSMENT WORKSPACE</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            My exams
          </h1>
          <p className="text-muted-foreground mt-3">
            Create with intention. Refine with confidence.
          </p>
        </div>
        <Button asChild>
          <Link href="/exams/new">
            <Plus className="size-4" />
            Create an exam
          </Link>
        </Button>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-9">
        {[
          {
            label: "Active papers",
            value: active.length,
            icon: Files,
            note: "Your private exam library",
          },
          {
            label: "In progress",
            value: active.filter((e) => e.status === "draft").length,
            icon: Clock3,
            note: "Room for your next good question",
          },
          {
            label: "Reviewed",
            value: active.filter((e) => e.status === "reviewed").length,
            icon: CheckCircle2,
            note: "Approved by you, ready to print",
          },
        ].map((c) => (
          <Card key={c.label} className="p-5 gap-0 shadow-none">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className="size-4 text-primary" />
            </div>
            <p className="text-3xl font-semibold mt-4">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-2">{c.note}</p>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={!archived ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setArchived(false)}
          >
            Active exams
          </Button>
          <Button
            variant={archived ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setArchived(true)}
          >
            Archived
          </Button>
        </div>
        <div className="relative max-w-sm w-full sm:w-72">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            aria-label="Search exams"
            className="pl-9 bg-card"
            placeholder="Search your exams…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-destructive mb-4">
          {error}
        </p>
      )}
      <Card className="gap-0 shadow-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="pl-6">Exam</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Questions / marks</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="pl-6 py-5">
                  <Link
                    href={`/exams/${e.id}`}
                    className="font-medium hover:text-primary flex items-center gap-2"
                  >
                    {e.title}
                    <ArrowUpRight className="size-3 text-muted-foreground" />
                  </Link>
                  <span className="block text-xs text-muted-foreground mt-1.5">
                    Grade 7 · Mathematics · {e.body}
                    {e.sample ? " · Sample" : ""}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      e.status === "reviewed"
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-amber-50 text-amber-800"
                    }
                  >
                    {e.status === "reviewed" ? "Reviewed" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {e.questionCount} / {e.marks}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(e.updatedAt).toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "Africa/Johannesburg",
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Actions for ${e.title}`}
                        disabled={busy}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => action(e, "duplicate")}>
                        <Copy />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => action(e, "archive", !e.archived)}
                      >
                        {e.archived ? <ArchiveRestore /> : <Archive />}
                        {e.archived ? "Restore" : "Archive"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!shown.length && (
          <div className="py-20 px-6 text-center">
            <div className="bg-secondary rounded-2xl size-14 flex items-center justify-center mx-auto mb-5">
              <Files className="text-primary" />
            </div>
            <h2 className="font-semibold text-lg">
              {search
                ? "No exams match your search"
                : archived
                  ? "No archived papers"
                  : "Your next paper starts here"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              {search
                ? "Try a different title or examining body."
                : "Build a balanced brief and make every question your own."}
            </p>
            {!archived && !search && (
              <Button asChild>
                <Link href="/exams/new">
                  <Plus className="size-4" />
                  Create your first exam
                </Link>
              </Button>
            )}
          </div>
        )}
      </Card>
      <p className="text-xs text-muted-foreground mt-5">
        Private to your account · Teacher-defined curriculum guidance ·
        Human-reviewed assessment
      </p>
    </div>
  );
}
