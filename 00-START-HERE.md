# Warm-up pack: draft-and-review pipeline

For the dev team. 12 November 2026.

Today you build a small draft-and-review pipeline with an AI coding assistant, one track each, so everyone has hands-on experience with AI agents before discovery starts on Monday. A Drafter agent writes a micro-lesson from a short public text, a Reviewer agent checks it against the source, and a person approves or rejects it.

Everything you need is in this pack. You do not need input from the PO, UX or architects. If something is unclear, write the question down for week 1, make an assumption and carry on.

## What is in the pack

| Folder or file | What it is | When to use it |
| --- | --- | --- |
| `01-Problem-statement.docx` | The task: ground rules, your four tracks, the plan for the day and the wrap-up questions | Read first |
| `02-PRD.docx` | The spec: requirements, acceptance criteria and the lesson contract (the JSON your agents pass to each other) | Read second, and keep open while you build |
| `03-Prototype/micro-lesson-studio.html` | A working mock-up of the finished tool. Double-click it to open it in Edge or Chrome. It works offline. | Try it before you build. Its agents are simulated, so yours should be real. |
| `04-User-manual/Micro-lesson-Studio-User-Manual.docx` | A user manual with screenshots that explains every screen of the prototype | When you want to know what a screen should do |
| `05-Eval-set/` | 8 source texts with correct lessons, plus 48 labelled lessons (24 correct, 24 incorrect), and a script that scores your agents | To check your work. Start with its README. |

## How to start

1. Read the problem statement and the PRD (about 15 minutes).
2. Open the prototype and run it once with the sample text. Switch the flawed first draft on and off.
3. Pick up your track and write a short spec for your AI assistant: the input, the output and one worked example.
4. Build Level 1, then update your status on the board. Level 2 and the stretch tracks are for when you finish.
5. Measure your work with the eval set (see `05-Eval-set/README.md`), and write your half-page note.

## Your tracks

| Track | Owner | Requirements |
| --- | --- | --- |
| 1. Drafter agent | Yasser Arafeth | FR-2 |
| 2. Reviewer agent | Debaditya Ghosh | FR-3 |
| 3. Agent loop and trace | Swapnil Zende | FR-4, FR-5, FR-8 |
| 4. Review screen | Deepak Yadav | FR-1, FR-6, FR-7, FR-9, FR-10 |

The Drafter and the Reviewer are built by different people against the agreed lesson contract, so they plug together in the loop at the end of the day.

## Rules

- Public text only. Never paste confidential, client or program content into any tool.
- Use only approved AI assistants (Claude Code, GitHub Copilot, or another approved tool).
- You own the result: run, read and test everything the assistant writes.
- Timebox: if you are stuck for 15 minutes, ask a teammate or note the blocker and move on.

## Running the scorer

You need Python 3.8 or later. No packages are needed.

```
cd 05-Eval-set
python score.py reviewer reviewer-output.json
python score.py drafter drafter-output.json
```

The README in that folder explains the file formats.

## Live copies

The Word files in this pack are offline copies. The live versions are below, and you may need access to open them.

- Problem statement: https://claude.ai/artifact/9RXwu3EUXW4aDFgvv9JH8A
- PRD: https://claude.ai/artifact/SrjwQP9tJw274gFo4uiY4E
- Prototype: https://claude.ai/artifact/WWGPxjv6tBkA4mWVCUXHAm
