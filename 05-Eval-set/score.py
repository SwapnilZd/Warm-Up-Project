"""
Score your agents against the eval set. No packages needed (Python 3.8+).

  python score.py reviewer reviewer-output.json   # how well does your Reviewer agent judge lessons?
  python score.py drafter  drafter-output.json    # how good are the lessons your Drafter agent writes?

reviewer-output.json  = {"L01": {"verdict": "approve", "issues": []}, "L04": {"verdict": "revise", "issues": ["..."]}, ...}
                        one entry per lesson id in eval-set.json ("labelled_lessons"). Use the lesson, source text and your Reviewer.
drafter-output.json   = {"src-01": { ...lesson JSON... }, "src-02": { ... }, ...}
                        one entry per source id in eval-set.json ("sources"). A value may also be the raw text your Drafter returned;
                        if it is not valid JSON it is counted as invalid JSON.

This script only MEASURES your agents. Build the agents yourselves.
"""
import json, os, re, sys
from collections import defaultdict

EVAL = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'eval-set.json')
def norm(t): return re.sub(r'\s+', ' ', str(t or '')).strip().lower()

def score_reviewer(pred_path):
    ev = json.load(open(EVAL, encoding='utf-8')); pred = json.load(open(pred_path, encoding='utf-8'))
    rows = ev['labelled_lessons']; total = len(rows); correct = 0; missing = 0
    ok_good = tot_good = caught = tot_bad = 0; by_type = defaultdict(lambda: [0, 0]); misses = []
    for r in rows:
        p = pred.get(r['id'])
        if not p or p.get('verdict') not in ('approve', 'revise'): missing += 1; misses.append((r['id'], r['failure_type'], 'no verdict', r['label'])); got = None
        else: got = p['verdict']
        hit = got == r['label']; correct += hit
        if r['label'] == 'approve': tot_good += 1; ok_good += hit
        else: tot_bad += 1; caught += hit; by_type[r['failure_type']][1] += 1; by_type[r['failure_type']][0] += hit
        if not hit and got: misses.append((r['id'], r['failure_type'], got, r['label']))
    print(f'Reviewer score on {total} labelled lessons')
    print(f'  Overall accuracy:                 {correct}/{total} = {correct/total:.0%}')
    print(f'  Correct lessons approved:         {ok_good}/{tot_good} = {ok_good/tot_good:.0%}   (low means the Reviewer is too strict)')
    print(f'  Incorrect lessons sent back:      {caught}/{tot_bad} = {caught/tot_bad:.0%}   (low means the Reviewer misses mistakes)')
    if missing: print(f'  Lessons with no verdict:          {missing}')
    print('  Caught, by type of mistake:')
    for k, (a, b) in sorted(by_type.items()): print(f'    {k:20s} {a}/{b}')
    if misses:
        print('  Wrong or missing verdicts (lesson, type, your verdict, expected):')
        for m in misses: print('    ', *m)

def score_drafter(out_path):
    ev = json.load(open(EVAL, encoding='utf-8')); out = json.load(open(out_path, encoding='utf-8')); src = {s['id']: s['text'] for s in ev['sources']}
    cols = ['valid JSON', 'all fields', 'exact quote', 'answer in quote', 'has a blank']; tot = {c: 0 for c in cols}; full = 0
    print(f"{'source':8s} " + ' '.join(f'{c:>16s}' for c in cols))
    for sid, text in src.items():
        v = out.get(sid); lesson = None
        if isinstance(v, str):
            try: lesson = json.loads(v)
            except Exception: lesson = None
        elif isinstance(v, dict): lesson = v
        q = (lesson or {}).get('quiz') if isinstance((lesson or {}).get('quiz'), dict) else {}
        quote = (lesson or {}).get('source_quote') or ''
        res = [lesson is not None, bool(lesson) and all(isinstance(lesson.get(k), str) and lesson[k].strip() for k in ('title', 'summary', 'source_quote')) and bool(q.get('question')) and bool(q.get('answer')),
               bool(quote) and norm(quote) in norm(text), bool(q.get('answer')) and bool(quote) and norm(q['answer']) in norm(quote), '____' in str(q.get('question') or '')]
        for c, r in zip(cols, res): tot[c] += r
        full += all(res[:4]); print(f'{sid:8s} ' + ' '.join(f"{'yes' if r else 'NO':>16s}" for r in res))
    n = len(src); print('\nShare of sources that pass each check:'); [print(f'  {c:16s} {tot[c]}/{n} = {tot[c]/n:.0%}') for c in cols]
    print(f'  Lessons that pass the first four checks: {full}/{n} = {full/n:.0%}')
    print('The summary and question checks are left for your Reviewer agent to catch.')

if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] not in ('reviewer', 'drafter'): print(__doc__); sys.exit(1)
    (score_reviewer if sys.argv[1] == 'reviewer' else score_drafter)(sys.argv[2])
