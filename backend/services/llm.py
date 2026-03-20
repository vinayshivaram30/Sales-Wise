import anthropic
import json
import os
import re

client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _extract_text(message) -> str:
    """Extract text from Anthropic message content."""
    if not message.content:
        return ""
    block = message.content[0]
    return getattr(block, "text", "") or ""


def _parse_json_response(text: str) -> dict:
    """Parse JSON from LLM response, handling markdown code blocks and empty content."""
    if not text or not text.strip():
        raise ValueError("Empty response from LLM")
    text = text.strip()
    # Strip ```json ... ``` or ``` ... ``` code blocks
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    return json.loads(text)


def _build_call_context(call: dict) -> str:
    """Build context string from call data (individual columns)."""
    def v(k, fallback=None):
        return call.get(k) or fallback

    parts = []

    # Customer/Company
    company = v("company") or f"{v('company_name', '')} — {v('company_ctx', '')}".strip() or "Not provided"
    contact = v("contact") or v("contact_name") or "Not provided"
    parts.append(f"- Company: {company}")
    parts.append(f"- Contact: {contact}")
    if v("sales_team_size"):
        parts.append(f"- Sales team: {v('sales_team_size')}")
    if v("current_stack"):
        parts.append(f"- Current stack: {v('current_stack')}")
    if v("known_pain"):
        parts.append(f"- Known pain: {v('known_pain')}")
    if v("deal_stage"):
        parts.append(f"- Deal stage: {v('deal_stage')}")
    if v("deal_size_est"):
        parts.append(f"- Deal size est: {v('deal_size_est')}")
    if v("decision_timeline"):
        parts.append(f"- Decision timeline: {v('decision_timeline')}")
    if v("economic_buyer"):
        parts.append(f"- Economic buyer: {v('economic_buyer')}")
    if v("champion_likelihood"):
        parts.append(f"- Champion likelihood: {v('champion_likelihood')}")

    # Product
    product = v("product_name") or v("core_value_proposition") or v("product_ctx") or "Not provided"
    parts.append(f"- Product: {product}")
    if v("category"):
        parts.append(f"- Category: {v('category')}")
    if v("pricing"):
        parts.append(f"- Pricing: {v('pricing')}")
    if v("key_differentiators"):
        parts.append(f"- Differentiators: {v('key_differentiators')}")
    if v("known_objections"):
        parts.append(f"- Known objections: {v('known_objections')}")

    # Goals
    goal = v("primary_goal") or v("secondary_goal") or v("goal") or "Discovery"
    parts.append(f"- Goal: {goal}")
    if v("demo_focus"):
        parts.append(f"- Demo focus: {v('demo_focus')}")
    if v("objection_to_preempt"):
        parts.append(f"- Objection to pre-empt: {v('objection_to_preempt')}")
    if v("exit_criteria"):
        parts.append(f"- Exit criteria: {v('exit_criteria')}")

    # Past
    past = v("open_objections_from_history") or v("past_context")
    convs = call.get("past_conversations") or []
    if convs:
        past = (past or "") + "\n" + "\n".join(
            f"{c.get('date', '')} {c.get('type', '')}: {c.get('content', '')} → {c.get('outcome', '')}"
            for c in convs
        )
    parts.append(f"- Past context: {past or 'None'}")

    return "\n".join(parts)


async def generate_call_plan(call: dict) -> dict:
    context = _build_call_context(call)
    prompt = f"""You are a sales coaching AI. Generate a discovery call plan.

CONTEXT:
{context}

Generate a call plan using the MEDDIC framework. Return ONLY valid JSON:
{{
  "questions": [
    {{"question": "...", "meddic_field": "metrics|econ_buyer|decision_criteria|decision_process|pain|champion", "why": "...", "priority": 1}},
    ... (3-5 questions total, ordered by priority)
  ],
  "meddic_gaps": {{
    "metrics": false,
    "econ_buyer": false,
    "decision_criteria": false,
    "decision_process": false,
    "pain": false,
    "champion": false
  }},
  "watch_for": "One sentence on likely objection or risk."
}}"""

    message = await client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    return _parse_json_response(_extract_text(message))


async def generate_suggestion(
    transcript_window: str,
    meddic_state: dict,
    asked_questions: list,
    call_plan: dict,
    rag_context: str = ""
) -> dict:
    asked_str = "\n".join(f"- {q}" for q in asked_questions[-10:]) or "None yet"
    meddic_str = json.dumps(meddic_state, indent=2)

    prompt = f"""You are a real-time sales coach. Listen to this live call transcript and suggest the single best next question.

MEDDIC STATE (what we know so far):
{meddic_str}

QUESTIONS ALREADY ASKED (do NOT repeat these):
{asked_str}

RECENT TRANSCRIPT (last ~90 seconds):
{transcript_window}

ADDITIONAL CONTEXT:
{rag_context if rag_context else "None"}

Rules:
- Pick the highest-value MEDDIC gap NOT yet filled
- Make the question natural and conversational, not robotic
- It must follow logically from what was JUST said in the transcript
- Return ONLY valid JSON, nothing else:

{{
  "question": "The exact question to ask",
  "meddic_field": "metrics|econ_buyer|decision_criteria|decision_process|pain|champion",
  "why": "One short phrase explaining why this fills the biggest gap right now",
  "confidence": 0.85
}}"""

    message = await client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}]
    )
    return _parse_json_response(_extract_text(message))


async def generate_summary(full_transcript: str, call: dict, call_plan: dict) -> dict:
    prompt = f"""You are a sales coach. Analyse this completed sales call and produce a structured debrief.

CALL INFO:
- Contact: {call.get('contact_name')} at {call.get('company_name')}
- Goal: {call.get('goal')}

ORIGINAL CALL PLAN (questions we intended to ask):
{json.dumps(call_plan.get('questions', []), indent=2)}

FULL TRANSCRIPT:
{full_transcript}

Return ONLY valid JSON:
{{
  "summary_text": "3-4 sentence narrative summary of the call.",
  "meddic_state": {{
    "metrics":           "What was learned, or null",
    "econ_buyer":        "What was learned, or null",
    "decision_criteria": "What was learned, or null",
    "decision_process":  "What was learned, or null",
    "pain":              "What was learned, or null",
    "champion":          "What was learned, or null"
  }},
  "objections": [
    {{"text": "...", "category": "...", "handled": true, "response": "..."}}
  ],
  "next_steps": [
    {{"text": "...", "owner": "rep|customer", "due": "today|this week|next call"}}
  ],
  "deal_stage": "Qualification|Discovery|Demo|Proposal|Negotiation|Closed",
  "deal_score": 45,
  "coaching": [
    {{"note": "One specific, actionable coaching observation."}}
  ]
}}"""

    message = await client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}]
    )
    return _parse_json_response(_extract_text(message))
