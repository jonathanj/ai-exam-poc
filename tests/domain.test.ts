import { describe, it, expect } from "vitest";
import {
  defaultBrief,
  targets,
  metrics,
  validatePaper,
  questionSchema,
  briefSchema,
  partNumber,
} from "../src/lib/domain";
import { fixturePaper } from "../src/lib/fixtures";
import { hashPassword, verifyPassword } from "../src/lib/password";
describe("mark-weighted assessment", () => {
  it("rounds independently and preserves total with deterministic ties", () => {
    expect(targets(7, { easy: 20, medium: 50, difficult: 30 })).toEqual({
      easy: 1,
      medium: 4,
      difficult: 2,
    });
    expect(targets(3, { a: 50, b: 50 })).toEqual({ a: 2, b: 1 });
  });
  it("meets both blueprint targets for small, typical and large papers", () => {
    for (const marks of [4, 7, 40, 99, 200])
      for (const questionCount of [
        1,
        Math.min(marks, 8),
        Math.min(marks, 30),
      ]) {
        const brief = { ...defaultBrief, marks, questionCount };
        const questions = fixturePaper(brief);
        expect(validatePaper(brief, questions)).toHaveLength(questionCount);
        const m = metrics(questions.map((content) => ({ content })));
        expect(m.marks).toBe(marks);
        expect(m.difficulty).toEqual(targets(marks, brief.difficulty));
        const target = targets(marks, brief.demand);
        for (const key of Object.keys(target))
          expect(m.demand[key] || 0).toBe(target[key]);
      }
  });
  it("derives numbering from order and part count", () => {
    expect(partNumber(0, 0, 1)).toBe("1");
    expect(partNumber(2, 1, 3)).toBe("3.2");
  });
  it("rejects rubric totals, incomplete parts, and invalid distributions", () => {
    const q = fixturePaper(defaultBrief)[0];
    const invalid = structuredClone(q);
    invalid.parts[0].rubric[0].marks++;
    expect(() => questionSchema.parse(invalid)).toThrow();
    expect(() =>
      questionSchema.parse({ introduction: "", parts: [] }),
    ).toThrow();
    expect(() =>
      briefSchema.parse({
        ...defaultBrief,
        difficulty: { easy: 20, medium: 50, difficult: 20 },
      }),
    ).toThrow();
  });
  it("rejects generated paper mark/count mismatches", () => {
    const paper = fixturePaper(defaultBrief);
    expect(() =>
      validatePaper({ ...defaultBrief, marks: 41 }, paper),
    ).toThrow();
    expect(() => validatePaper(defaultBrief, paper.slice(1))).toThrow();
  });
});
describe("credentials", () => {
  it("uses salted hashes and validates passwords", () => {
    const a = hashPassword("a sufficiently long password");
    const b = hashPassword("a sufficiently long password");
    expect(a).not.toBe(b);
    expect(verifyPassword("a sufficiently long password", a)).toBe(true);
    expect(verifyPassword("wrong", a)).toBe(false);
    expect(verifyPassword("wrong", "malformed")).toBe(false);
  });
});
