import { test, expect, type APIRequestContext } from "@playwright/test";
import { defaultBrief } from "../../src/lib/domain";
const origin = "http://127.0.0.1:3100";
async function post(api: APIRequestContext, path: string, data: unknown) {
  return api.post(path, { headers: { Origin: origin }, data });
}
async function login(api: APIRequestContext, email = "examiner@test.invalid") {
  const res = await post(api, "/api/auth/login", {
    email,
    password: "test-only-password-2026",
  });
  expect(res.ok()).toBeTruthy();
}
test("complete examiner authoring journey", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/login");
  await page.getByLabel("Email address").fill("examiner@test.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("test-only-password-2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "My exams" })).toBeVisible();
  await page
    .getByRole("link", { name: "Create an exam", exact: true })
    .last()
    .click();
  await page.getByLabel("Exam title").fill("Browser journey assessment");
  await page.getByLabel("School", { exact: true }).fill("Test School");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Topics (comma separated)")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Total marks", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Generate paper", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Browser journey assessment" }),
  ).toBeVisible();
  await expect(page.getByText("Sample paper", { exact: true })).toBeVisible();
  await expect(page.getByText("Question 8", { exact: true })).toBeVisible();
  const examId = page.url().split("/").pop()!;
  const beforeDrag = await (
    await page.request.get(`/api/exams/${examId}`)
  ).json();
  await page
    .getByRole("button", { name: "Drag question 1", exact: true })
    .focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Drag question 1", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("status")).toContainText(
    beforeDrag.questions[1].id,
  );
  await page.keyboard.press("Space");
  await expect
    .poll(
      async () =>
        (await (await page.request.get(`/api/exams/${examId}`)).json())
          .questions[0].id,
    )
    .not.toBe(beforeDrag.questions[0].id);

  await page
    .getByRole("button", { name: "Move question 2 up", exact: true })
    .click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Question 8", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Add manual question", exact: true })
    .click();
  await page
    .getByLabel("Question text", { exact: true })
    .fill("Calculate $7 + 5$.");
  await page.getByLabel("Concept being assessed").fill("Whole numbers");
  await page.getByLabel("Model answer", { exact: true }).fill("12");
  await page
    .getByLabel("Solution explanation")
    .fill("Add five to seven to obtain twelve.");
  await page
    .getByRole("button", { name: "Save question", exact: true })
    .click();
  await expect(page.getByText("Question 9", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Discuss", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Message or revision request")
    .fill("How can this be more engaging?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText(/This is a fixture response/)).toBeVisible();
  await expect(page.getByLabel("Message or revision request")).toBeEnabled();
  await page
    .getByLabel("Message or revision request")
    .fill("Use a community school context.");
  await page
    .getByRole("button", { name: "Propose revision", exact: true })
    .click();
  await page.getByRole("tab", { name: /Proposals/ }).click();
  await expect(
    page.getByRole("button", { name: "Accept revision" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Accept revision" }).click();
  await expect(page.getByText("Revision accepted and saved")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("button", { name: "Analyse paper", exact: true })
    .click();
  await expect(page.getByText("AI paper analysis · advisory")).toBeVisible();
  await page
    .getByRole("button", { name: "Mark reviewed", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mark reviewed", exact: true })
    .click();
  await expect(page.getByText("Reviewed", { exact: true })).toBeVisible();
  await page.goto(`/exams/${examId}/print?mode=paper`);
  await expect(
    page.getByRole("heading", { name: /Learner paper/ }),
  ).toBeVisible();
  await expect(page.getByText("Model answer", { exact: true })).toHaveCount(0);
  await page.emulateMedia({ media: "print" });
  await page.screenshot({
    path: "test-results/learner-print.png",
    fullPage: true,
  });
  const pdf = await page.pdf({
    path: "test-results/learner-paper.pdf",
    format: "A4",
    preferCSSPageSize: true,
    printBackground: true,
  });
  expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  expect(
    (pdf.toString("latin1").match(/\/Type \/Page\b/g) || []).length,
  ).toBeGreaterThan(1);
  await page.emulateMedia({ media: "screen" });
  await page.goto(`/exams/${examId}/print?mode=memo`);
  await expect(
    page.getByText("Model answer", { exact: true }).first(),
  ).toBeVisible();
  await page.goto(`/exams/${examId}`);
  const state = await (await page.request.get(`/api/exams/${examId}`)).json();
  const copy = await (
    await post(page.request, `/api/exams/${examId}`, {
      action: "duplicate",
      revision: state.revision,
    })
  ).json();
  await page.goto(`/exams/${copy.id}`);
  await expect(
    page.getByRole("heading", { name: "Browser journey assessment (copy)" }),
  ).toBeVisible();
  await post(page.request, `/api/exams/${copy.id}`, {
    action: "archive",
    revision: 0,
    payload: true,
  });
  await page.goto("/exams");
  await page.getByRole("button", { name: "Archived", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Browser journey assessment (copy)" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/exams/${examId}`);
  await expect(
    page.getByRole("button", { name: "Paper overview", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-editor.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/desktop-editor.png",
    fullPage: false,
  });
  expect(errors).toEqual([]);
});
test("ownership, origin checks, concurrency, proposal staleness and review invalidation", async ({
  playwright,
}) => {
  const owner = await playwright.request.newContext({ baseURL: origin });
  const other = await playwright.request.newContext({ baseURL: origin });
  await login(owner);
  await login(other, "other@test.invalid");
  const create = await post(owner, "/api/exams", {
    ...defaultBrief,
    title: "Isolation paper",
  });
  const { id } = await create.json();
  expect(
    (await post(owner, `/api/exams/${id}/generate`, { revision: 0 })).ok(),
  ).toBeTruthy();
  let state = await (await owner.get(`/api/exams/${id}`)).json();
  const qid = state.questions[0].id;
  for (const path of [
    `/api/exams/${id}`,
    `/api/exams/${id}/history`,
    `/api/exams/${id}/questions/${qid}/chat`,
  ])
    expect((await other.get(path)).status()).toBe(404);
  for (const [path, data] of [
    [`/api/exams/${id}`, { action: "review", revision: state.revision }],
    [`/api/exams/${id}/generate`, { revision: state.revision }],
    [`/api/exams/${id}/analysis`, {}],
    [
      `/api/exams/${id}/questions/${qid}/proposal`,
      { action: "propose", request: "Change context" },
    ],
    [`/api/exams/${id}/questions/${qid}/chat`, { text: "Hello" }],
  ] as const)
    expect((await post(other, path, data)).status()).toBe(404);
  const foreignPrint = await other.get(`/exams/${id}/print?mode=memo`);
  expect(foreignPrint.status()).toBe(404);
  expect(
    (
      await owner.post(`/api/exams/${id}`, {
        headers: { Origin: "https://foreign.invalid" },
        data: { action: "review", revision: state.revision },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await post(owner, `/api/exams/${id}`, { action: "review", revision: 0 })
    ).status(),
  ).toBe(409);
  const proposal = await (
    await post(owner, `/api/exams/${id}/questions/${qid}/proposal`, {
      action: "propose",
      request: "Change the context",
    })
  ).json();
  await post(owner, `/api/exams/${id}`, {
    action: "review",
    revision: state.revision,
  });
  state = await (await owner.get(`/api/exams/${id}`)).json();
  const content = structuredClone(state.questions[0].content);
  content.parts[0].prompt += " Be precise.";
  await post(owner, `/api/exams/${id}`, {
    action: "edit",
    revision: state.revision,
    payload: { id: qid, revision: 0, content },
  });
  state = await (await owner.get(`/api/exams/${id}`)).json();
  expect(state.status).toBe("draft");
  expect(
    (
      await post(owner, `/api/exams/${id}/questions/${qid}/proposal`, {
        action: "accept",
        proposalId: proposal.id,
      })
    ).status(),
  ).toBe(409);
  const results = await Promise.all([
    post(owner, `/api/exams/${id}/generate`, { revision: state.revision }),
    post(owner, `/api/exams/${id}/generate`, { revision: state.revision }),
  ]);
  expect(results.map((r) => r.status()).sort()).toEqual([200, 409]);
  await post(owner, "/api/auth/logout", {});
  expect((await owner.get(`/api/exams/${id}`)).status()).toBe(401);
  await owner.dispose();
  await other.dispose();
});
