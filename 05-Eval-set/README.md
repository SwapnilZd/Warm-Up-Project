# Micro-lesson eval set

Use this set to measure the two agents you build today. It has examples of good and bad output, so you can see whether your Drafter writes correct lessons and whether your Reviewer tells good lessons from bad ones.

All source texts are original and written for practice. They are not official guidance. Use public text only.

## What is in this folder

| File | What it is |
| --- | --- |
| `eval-set.json` | The full set: the agreed contract, the five checks, 8 source texts with a correct lesson for each, and 48 labelled lessons (24 correct, 24 incorrect). |
| `eval-set.csv` | The 48 labelled lessons as a table. Open it in Excel to read the examples. |
| `score.py` | A small script that scores your agents' output. It only measures. It does not contain an agent. |

## What a correct lesson looks like

```json
{
  "title": "A good team stand-up",
  "summary": "A good team stand-up is short and predictable.",
  "quiz": { "question": "Complete the statement: Hold it at the same time every day, and keep it to ____ minutes.", "answer": "15" },
  "source_quote": "Hold it at the same time every day, and keep it to 15 minutes."
}
```

A lesson is correct when all five checks pass:

1. **contract**: every field is present and the question has a blank (`____`).
2. **quote**: the source quote is an exact piece of the source. Extra spaces and capital letters are ignored.
3. **answer**: the quiz answer appears in the source quote.
4. **summary**: the summary uses only words from the source (no more than one in five of its main words may be missing).
5. **question**: the question matches the source quote (at least four in five of its words appear in the quote).

## What an incorrect lesson looks like

Each incorrect example breaks the lesson in one realistic way. `eval-set.json` records which checks it should fail.

| Failure type | Example (source: team stand-ups) |
| --- | --- |
| quote_paraphrased | The quote says "Keep a stand-up to about 15 minutes at the same time daily." The source does not say that. |
| wrong_answer | The answer is `30`, but the quote says 15. |
| invented_summary | The summary adds "Most teams do it first thing in the morning." |
| no_blank | The question has no blank (`____`). |
| unrelated_question | The question asks about the best day of the week, which the quote does not mention. |
| invented_quote | The quote is a plausible sentence that is not in the source. |
| missing_field | A required field, such as the title, is missing. |

The set also has correct lessons that look slightly different (extra spaces, lower case, a reworded summary). A good Reviewer approves these. If yours sends them back, it is too strict.

## How to use it

**Drafter agent (Track 1)**

1. For each source in `sources`, run your Drafter on `text` and save its output.
2. Put the outputs in one file: `{ "src-01": {...}, "src-02": {...}, ... }`.
3. Run `python score.py drafter drafter-output.json`.
4. Compare each lesson with `expected_lesson`. More than one correct lesson is possible, so the expected one is a guide, not the only right answer.

**Reviewer agent (Track 2)**

1. For each item in `labelled_lessons`, give your Reviewer the source text (use `source_id`) and the `lesson`.
2. Save its verdicts in one file: `{ "L01": {"verdict": "approve", "issues": []}, ... }`.
3. Run `python score.py reviewer reviewer-output.json`.
4. Read the misses. Do not hide the mistakes: they show you where your Reviewer is weak.

**Agent loop (Track 3)**

Run the Drafter and Reviewer together on every source and count how many lessons are approved first time, after one retry, or still need a person.

## Proposed targets for today

These are suggestions, to be agreed at the kick-off.

- Drafter: at least 7 of 8 sources give a lesson that passes the first four checks.
- Reviewer: at least 80% overall accuracy, and no more than 2 of the 24 correct lessons sent back.

## Good habits

- Do not tune your Reviewer only to pass these 48 lessons. Write 5 to 10 new examples of your own, including tricky ones, and add them to the set.
- Keep a note of every case your agent got wrong and why. That list is useful input for the discovery proofs of concept.
