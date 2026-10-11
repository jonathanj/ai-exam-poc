"use client";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
export function PrintControls({
  id,
  mode,
  status,
}: {
  id: string;
  mode: string;
  status: string;
}) {
  return (
    <div className="no-print max-w-4xl mx-auto p-5 flex flex-wrap gap-3 items-center">
      <Button asChild variant="outline">
        <Link href={`/exams/${id}`}>
          <ArrowLeft className="size-4" />
          Back to editor
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link
          href={`/exams/${id}/print?mode=${mode === "memo" ? "paper" : "memo"}`}
        >
          {mode === "memo" ? "Learner paper" : "Teacher memorandum"}
        </Link>
      </Button>
      <Button onClick={() => window.print()}>
        <Printer className="size-4" />
        Print / Save as PDF
      </Button>
      {status !== "reviewed" && (
        <p className="text-sm text-amber-800 w-full">
          Unreviewed draft — check questions and marking criteria before
          classroom use.
        </p>
      )}
      <p className="text-xs text-muted-foreground w-full">
        Use A4 paper. Turn off browser headers and footers for a clean layout;
        page numbers are provided by the print stylesheet.
      </p>
    </div>
  );
}
