"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Check, History, Square } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  type StoredQuestion,
  type ExamView,
  type QuestionContent,
} from "@/lib/domain";
import { request } from "@/lib/client";
import { MathText } from "./math";
type Proposal = { id: string; inputRevision: number; content: QuestionContent };
type HistoryData = {
  messages: { id: string; role: string; content: string }[];
  proposals: Proposal[];
  revisions: {
    id: string;
    revision: number;
    source: string;
    content: QuestionContent;
    createdAt: string;
  }[];
};
export function QuestionChat({
  exam,
  question,
  onClose,
  onUpdate,
}: {
  exam: ExamView;
  question: StoredQuestion;
  onClose: () => void;
  onUpdate: (exam: ExamView) => void;
}) {
  const [history, setHistory] = useState<HistoryData>({
    messages: [],
    proposals: [],
    revisions: [],
  });
  const [input, setInput] = useState("");
  const [partial, setPartial] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  const base = `/api/exams/${exam.id}/questions/${question.id}`;
  useEffect(() => {
    let active = true;
    request<HistoryData>(`${base}/chat`)
      .then((v) => {
        if (active) setHistory(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
      abort.current?.abort();
    };
  }, [base]);
  async function refresh() {
    setHistory(await request<HistoryData>(`${base}/chat`));
  }
  async function send() {
    if (!input.trim()) return;
    setBusy(true);
    setError("");
    setPartial("");
    abort.current = new AbortController();
    try {
      const res = await fetch(`${base}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
        signal: abort.current.signal,
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setHistory((h) => ({
        ...h,
        messages: [
          ...h.messages,
          { id: "pending", role: "user", content: input },
        ],
      }));
      setInput("");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "",
        complete = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;
        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line);
          if (event.error) throw new Error(event.error);
          if (event.delta) setPartial((p) => p + event.delta);
          if (event.done) complete = true;
        }
      }
      if (!complete)
        throw new Error(
          "Response interrupted. Partial text has not been saved.",
        );
      await refresh();
      setPartial("");
    } catch (e) {
      setError(
        (e as Error).name === "AbortError"
          ? "Response stopped. Partial text has not been saved."
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  async function propose() {
    setBusy(true);
    setError("");
    try {
      const p = await request<Proposal>(`${base}/proposal`, {
        action: "propose",
        request: input,
      });
      setHistory((h) => ({ ...h, proposals: [p, ...h.proposals] }));
      setInput("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function accept(p: Proposal) {
    setBusy(true);
    setError("");
    try {
      const updated = await request<ExamView>(`${base}/proposal`, {
        action: "accept",
        proposalId: p.id,
      });
      onUpdate(updated);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto p-0">
        <SheetHeader className="border-b p-6">
          <SheetTitle className="flex gap-2 items-center">
            <Sparkles className="size-5 text-primary" />
            Question {question.position + 1} · AI assistant
          </SheetTitle>
          <SheetDescription>
            Discuss freely. Apply changes only after reviewing a proposal.
          </SheetDescription>
        </SheetHeader>
        <div className="p-6">
          <Tabs defaultValue="chat">
            <TabsList className="w-full">
              <TabsTrigger value="chat">Conversation</TabsTrigger>
              <TabsTrigger value="proposals">
                Proposals ({history.proposals.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="size-3" />
                History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="space-y-4 mt-5">
              {!history.messages.length && (
                <div className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-5">
                  Ask about the concept, rubric, difficulty, or how to make this
                  question clearer.
                </div>
              )}
              {history.messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-xl p-4 ${m.role === "user" ? "bg-secondary ml-8" : "border mr-4"}`}
                >
                  <p className="eyebrow text-muted-foreground mb-2">
                    {m.role === "user" ? "YOU" : "ASSISTANT"}
                  </p>
                  <MathText>{m.content}</MathText>
                </div>
              ))}
              {partial && (
                <div className="border rounded-xl p-4">
                  <p className="eyebrow text-muted-foreground mb-2">
                    PARTIAL RESPONSE · NOT YET SAVED
                  </p>
                  <MathText>{partial}</MathText>
                </div>
              )}
            </TabsContent>
            <TabsContent value="proposals" className="space-y-5 mt-5">
              {!history.proposals.length && (
                <p className="text-sm text-muted-foreground">
                  Describe a change below and request a proposal.
                </p>
              )}
              {history.proposals.map((p) => (
                <div className="border rounded-xl p-4 space-y-3" key={p.id}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="eyebrow text-muted-foreground mb-3">
                        CURRENT
                      </p>
                      <MathText>{question.content.introduction}</MathText>
                      {question.content.parts.map((part, i) => (
                        <div className="mt-2" key={i}>
                          <MathText>{part.prompt}</MathText>
                          <p className="text-xs text-muted-foreground">
                            {part.marks} marks · {part.difficulty}
                          </p>
                          <MathText>{part.answer}</MathText>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="eyebrow text-primary mb-3">PROPOSED</p>
                      <MathText>{p.content.introduction}</MathText>
                      {p.content.parts.map((part, i) => (
                        <div className="mt-2" key={i}>
                          <MathText>{part.prompt}</MathText>
                          <p className="text-xs text-muted-foreground">
                            {part.marks} marks · {part.difficulty}
                          </p>
                          <MathText>{part.answer}</MathText>
                        </div>
                      ))}
                    </div>
                  </div>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-primary">
                      Inspect complete before / after (including rubrics and
                      metadata)
                    </summary>
                    <div className="grid sm:grid-cols-2 gap-2 mt-2">
                      <pre className="bg-muted p-2 overflow-auto max-h-64">
                        {JSON.stringify(question.content, null, 2)}
                      </pre>
                      <pre className="bg-muted p-2 overflow-auto max-h-64">
                        {JSON.stringify(p.content, null, 2)}
                      </pre>
                    </div>
                  </details>
                  {p.inputRevision !== question.revision ? (
                    <p className="text-amber-800 text-xs">
                      Stale proposal. Request a new one against revision{" "}
                      {question.revision}.
                    </p>
                  ) : (
                    <Button size="sm" disabled={busy} onClick={() => accept(p)}>
                      <Check className="size-4" />
                      Accept revision
                    </Button>
                  )}
                </div>
              ))}
            </TabsContent>
            <TabsContent value="history" className="space-y-4 mt-5">
              {history.revisions.map((r) => (
                <details className="border rounded-lg p-3" key={r.id}>
                  <summary className="text-sm cursor-pointer">
                    Revision {r.revision} · {r.source}
                  </summary>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                  {r.content.parts.map((p, i) => (
                    <div key={i} className="mt-2">
                      <MathText>{p.prompt}</MathText>
                      <MathText>{p.answer}</MathText>
                    </div>
                  ))}
                </details>
              ))}
            </TabsContent>
          </Tabs>
          {error && (
            <p role="alert" className="text-sm text-destructive mt-4">
              {error}
            </p>
          )}
          <div className="mt-6 border-t pt-4 space-y-3">
            <Textarea
              aria-label="Message or revision request"
              placeholder="Ask a question, or describe an adjustment…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={send} disabled={busy || !input.trim()}>
                <Send className="size-4" />
                Send message
              </Button>
              <Button
                variant="outline"
                onClick={propose}
                disabled={busy || !input.trim()}
              >
                <Sparkles className="size-4" />
                Propose revision
              </Button>
              {busy && (
                <Button variant="ghost" onClick={() => abort.current?.abort()}>
                  <Square className="size-3" />
                  Stop chat
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              AI can make mistakes. Check mathematical accuracy and marking
              criteria.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
