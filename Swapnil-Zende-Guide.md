# Swapnil Zende ke liye: yeh project kya hai, aur kya ban chuka hai

Yeh note beginner ke liye hai. Pehle idea samajh lo, phir code. English ke technical words yahin explain kiye gaye hain.

---

## 1. Poora project ek line mein

Ek chhota tool hai. Usme koi public text paste karte ho (jaise "team stand-up kaise karte hain").

Do helpers us text se ek chhota lesson banate hain:

1. **Drafter** lesson likhta hai.
2. **Reviewer** check karta hai ki lesson sach mein usi text se aaya hai, ya kisi ne naya fact jod diya.
3. **Aadmi** (human) last mein approve ya reject karta hai.

Lesson ka matlab yahan ek chhota card hai: title, summary, ek quiz question jisme blank ho (`____`), answer, aur source se copy ki hui ek line (quote).

Example:

```json
{
  "title": "A good team stand-up",
  "summary": "A good team stand-up is short and predictable.",
  "quiz": {
    "question": "Complete the statement: Hold it at the same time every day, and keep it to ____ minutes.",
    "answer": "15"
  },
  "source_quote": "Hold it at the same time every day, and keep it to 15 minutes."
}
```

Yeh shape sab log man chuke hain. Isko **lesson contract** kehte hain. Isliye alag-alag log apna hissa bana sakte hain, aur baad mein pieces jud jaate hain.

---

## 2. Team mein kaun kya bana raha hai

| Track | Kaun | Unka kaam |
| --- | --- | --- |
| 1. Drafter | Yasser Arafeth | Source text se lesson JSON likhna |
| 2. Reviewer | Debaditya Ghosh | Lesson check karke `approve` ya `revise` bolna, saath mein issues ki list |
| 3. Agent loop aur trace | **Swapnil Zende** | Drafter aur Reviewer ko baar-baar chalana, har step ka log rakhna, aur pehla draft jaan-bujhkar galat karne ka switch |
| 4. Review screen | Deepak Yadav | Browser ka page jahan insaan lesson padh kar approve ya reject kare |

Swapnil ka folder: `backend/`

Deepak ka screen alag folder mein hai: `frontend/`. Woh abhi bina server ke chalta hai. Swapnil ka loop server par chalta hai. Dono baad mein judenge.

---

## 3. Swapnil ka kaam simple shabdon mein

Document (PRD) mein Swapnil ke teen number hain: **FR-4, FR-5, FR-8**.

### FR-4: Agent loop

Loop ka matlab: ek kaam khatam, agla shuru, jab tak rukne ki wajah na aaye.

1. Orchestrator start karta hai. Orchestrator sirf manager hai. Woh khud lesson nahi likhta.
2. Drafter lesson likhta hai.
3. Reviewer check karta hai.
4. Agar Reviewer bole **approve**, loop ruk jata hai. Lesson taiyar hai.
5. Agar Reviewer bole **revise**, Orchestrator uski complaints (issues) Drafter ko wapas de deta hai. Drafter dubara likhta hai.
6. Yeh wapas bhejna sirf itni baar hota hai jitna **Maximum retries** set hai: 0, 1, ya 2.
7. Retries khatam ho jayein aur lesson ab bhi galat ho, to status **needs a person** ho jata hai. Matlab insaan decide kare.

Retries ka seedha matlab:

| Maximum retries | Drafter kitni baar likh sakta hai |
| --- | --- |
| 0 | Sirf 1 baar. Galat hua to turant "needs a person". |
| 1 | 2 baar. Pehli galat, doosri theek ho sakti hai. |
| 2 | 3 baar. |

### FR-5: Trace

Trace ek diary hai. Har step ki ek line:

- kitni second lage (time)
- kisne kiya (Orchestrator, Drafter, ya Reviewer)
- kya kiya (action)
- nateeja kya nikla (result)

Yeh diary teen jagah milti hai:

- page par list ki tarah
- **Copy trace** se text copy
- **Download trace** se file
- disk par `backend/traces/` folder mein, jaise `run-20261118-084358-eb9025.txt`

Ek asli trace aisi dikhti hai:

```text
0.000s  Orchestrator  Started. Flawed first draft on, maximum retries 1.
0.000s  Drafter  Attempt 1: wrote a lesson.
0.000s  Reviewer  Attempt 1: revise (2 issues).
0.000s  Orchestrator  Sent 2 issues back to the Drafter.
0.000s  Drafter  Attempt 2: wrote a lesson.
0.000s  Reviewer  Attempt 2: approve (0 issues).
0.000s  Orchestrator  Approved by the Reviewer. Stopping.
```

Time `0.000s` isliye hai kyunki yeh helpers abhi computer ke andar hi foran jawab dete hain. Koi door wala AI call nahi ho raha.

### FR-8: Flaw switch

Page par checkbox hai: **Make the first draft flawed on purpose**.

Iska matlab: pehla draft jaan-bujhkar kharab karo, taaki dikhe ki Reviewer galti pakadta hai aur loop dubara try karta hai.

Kharab draft mein do galtiyan hoti hain:

- quote ke end par `or so.` jod diya jata hai. Yeh line source mein hai hi nahi.
- summary mein yeh extra line jod di jati hai: `Most teams do it in the morning.` Yeh baat source mein nahi hai.

Yeh switch **sirf pehli attempt** par lagta hai. Doosri attempt saaf lesson likhti hai. Isliye retry 1 par doosri baar approve ho jata hai.

Sample text par yeh switch shuru se on rehta hai.

---

## 4. Ek run ko haath se samjho

Sample text ka pehla hissa:

> A good team stand-up is short and predictable. Hold it at the same time every day, and keep it to 15 minutes.

**Setting:** flaw on, retries 1.

**Attempt 1, Drafter** aisa quote likh deta hai:

> Hold it at the same time every day, and keep it to 15 minutes or so.

**Attempt 1, Reviewer** do baatein pakadta hai:

- quote source ki exact line nahi hai
- summary mein `most`, `teams`, `morning` source mein nahi hain

Verdict: `revise`.

**Orchestrator** yeh 2 issues Drafter ko wapas bhejta hai.

**Attempt 2, Drafter** saaf lesson likhta hai. Quote ab source ki asli line hai. Answer `15` usi quote mein hai. Question mein `____` hai.

**Attempt 2, Reviewer:** `approve`. Loop ruk jata hai.

Page par upar pill dikhta hai: **Approved by the Reviewer**.

Agar retries 0 kar do aur flaw on chhodo, to attempt 2 hoti hi nahi. Pill hota hai: **Needs a person**.

Agar flaw off kar do, to pehli attempt hi saaf hoti hai aur turant approve ho jata hai.

---

## 5. Reviewer kaun si 5 cheezein check karta hai

Yeh checks eval set wale document se aaye hain. Reviewer tabhi `approve` karta hai jab paanchon pass hon.

1. **Contract.** Title, summary, quote, question, answer sab bhare hon. Question mein `____` ho.
2. **Quote.** Quote source ka exact tukda ho. Extra space aur capital/small letters maaf hain.
3. **Answer.** Quiz ka answer usi quote ke andar dikhe. `15` quote mein hona chahiye, kahin aur nahi.
4. **Summary.** Summary ke important words source se aane chahiye. Bahut saare naye words ho to fail.
5. **Question.** Question ke words zyadatar quote mein hone chahiye. Alag topic ka sawal fail hota hai.

`approve` ka matlab "koi issue nahi". `revise` ka matlab "issues ki list hai, dubara likho".

---

## 6. Folder mein kaun si file kya karti hai

Sirf `backend/` Swapnil ka hai.

```text
backend/
  app/
    main.py            server. Page aur API yahin se chalte hain.
    loop.py            FR-4 loop aur FR-5 trace.
    drafter.py         abhi ka Drafter (stub). Lesson yahin banta hai.
    reviewer.py        abhi ka Reviewer (stub). 5 checks yahin hain.
    sample_text.py     sample paragraph, aur 50 se 3000 character ka rule.
    static/index.html  woh page jo browser mein dikhta hai.
  tests/test_loop.py   checks ki file. pytest isi ko chalata hai.
  traces/              har run ki text file yahan save hoti hai.
  requirements.txt     Python packages ki list.
  README.md            English mein short run steps.
```

**Stub** ka matlab temporary helper. Asli Drafter Yasser banayega, asli Reviewer Debaditya. Jab tak woh ready nahi, loop khali na dikhe, isliye yeh do files rule-based kaam karti hain. Koi bahar ka AI abhi call nahi hota.

Baad mein sirf do functions badalne hain:

- `draft_lesson` file `app/drafter.py` mein
- `review_lesson` file `app/reviewer.py` mein

Loop ko Drafter se lesson JSON chahiye, aur Reviewer se yeh:

```json
{ "verdict": "approve", "issues": [] }
```

ya

```json
{ "verdict": "revise", "issues": ["The source quote is not an exact piece of the source text."] }
```

`app/loop.py` ko us case mein chhedne ki zaroorat nahi, jab tak in dono ka output shape yahi rahe.

---

## 7. Page kaise chalana hai

Pehli baar, terminal mein:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Phir browser mein kholo: http://127.0.0.1:8000

`.venv` ek alag chhota Python box hai, taaki packages poore computer par na bikhre. `activate` us box ko on karta hai. `uvicorn` woh program hai jo FastAPI server ko zinda rakhta hai. `--reload` ka matlab: code save karo to server khud restart ho jaye.

Page par kya hai:

| Cheez | Kaam |
| --- | --- |
| Source text | Public text yahan paste karo. 50 se 3000 characters. Chhota ho to Run band rehta hai aur wajah likhi hoti hai. |
| Load sample text | Stand-up wala paragraph bhar deta hai. |
| Flaw checkbox | Pehla draft jaan-bujhkar galat. Sample par on. |
| Maximum retries | 0, 1, ya 2. |
| Run the agents | Ek text par loop chalao. Neeche attempts, trace, aur lesson JSON aata hai. |
| Run the 8 eval sources | Pack ke 8 practice texts par loop chalao. Count dikhta hai: pehli baar approve, retry ke baad approve, ya ab bhi insaan chahiye. |
| Copy trace | Trace ko text ki tarah copy karne ki koshish. |
| Download trace | Trace ki file download. |

Browser agar copy ko rok de, to trace page par dikh raha hai aur `backend/traces/` mein file bhi hai. Download link bhi usi text ko deta hai.

Server band karna ho to us terminal mein `Ctrl + C`.

---

## 8. API kya hai, bilkul chhote mein

API ka matlab: page ya koi aur program server se JSON mein baat kare. Browser ka button andar se yahi call karta hai.

**Ek run**

`POST /api/run`

```json
{ "source": "yahan poora text", "flaw": true, "retries": 1 }
```

Wapas milta hai: `status` (`approved` ya `needs-person`), `lesson`, har attempt, aur `trace`.

**8 sources**

`POST /api/eval`

```json
{ "flaw": false, "retries": 1 }
```

**Trace ki text file**

`GET /api/runs/{id}/trace`

Health check: `GET /health` se `{ "ok": true }` aata hai. Matlab server zinda hai.

---

## 9. Tests ka matlab

Test ek script hai jo code ko sawal puchhti hai aur jawab match karti hai. Insaan har baar click na kare, isliye yeh hai.

`backend` folder mein, venv on karke:

```bash
pytest
```

9 tests pass hone chahiye. Woh yeh confirm karte hain:

- saaf run pehli attempt par approve
- flaw on + retry 1 par doosri attempt approve
- flaw on + retry 0 par needs a person
- galat Drafter retry 2 par 3 baar try karke needs a person
- 8 eval sources: flaw off par 8/8 pehli baar, flaw on + retry 1 par 8/8 doosri baar
- bahut chhota text server 400 error deta hai

Alag se, stub Reviewer ko eval set ki 48 labelled lessons di gayi thin (24 sahi, 24 galat). Usne **48/48** sahi verdict diya. Yeh Debaditya ke Reviewer ka target bhi isi set par hai. Swapnil ka loop isi stub se chal raha hai, isliye loop ka faisla bharosemand hai.

---

## 10. Frontend ko abhi mat todna

`frontend/` Deepak ka review screen hai. Usme `src/services/agents.js` abhi bhi sample lesson lautata hai, taaki woh screen bina server ke chal sake.

Jab team jodni ho, us function ko `POST http://127.0.0.1:8000/api/run` par bhej dena. Screen ko return mein sirf `lesson` chahiye. Trace aur status extra hain, screen unhe ignore kar sakti hai.

---

## 11. Kal kisi se kaise dikhana hai

1. Server on karo. Page kholo.
2. Flaw on, retries 1, **Run the agents**. Dikhao: pehla card Revise, doosra Approve, neeche trace.
3. Retries 0 karke dubara chalao. Dikhao: Needs a person.
4. Flaw off karke chalao. Dikhao: pehli baar hi Approve.
5. **Run the 8 eval sources** dabao. Count dikhao.
6. `traces/` folder mein nayi `.txt` file kholo.

Yahi Swapnil ka demo hai.
