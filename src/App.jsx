import { useState } from "react";

const VISA_TYPES = [
  { id: "189", label: "Skilled Independent (189)", category: "skilled" },
  { id: "190", label: "Skilled Nominated (190)", category: "skilled" },
  { id: "491", label: "Skilled Regional (491)", category: "skilled" },
  { id: "482", label: "Temporary Skill Shortage (482)", category: "skilled" },
  { id: "820_801", label: "Partner Visa (820/801)", category: "partner" },
  { id: "309_100", label: "Partner Visa Offshore (309/100)", category: "partner" },
  { id: "100", label: "Permanent Residency (from temp PR)", category: "pr" },
  { id: "citizenship", label: "Australian Citizenship", category: "pr" },
  { id: "200", label: "Refugee Visa (200)", category: "humanitarian" },
  { id: "202", label: "Global Special Humanitarian (202)", category: "humanitarian" },
  { id: "866", label: "Protection Visa (866)", category: "humanitarian" },
];

const SITUATIONS = {
  skilled: ["Employed full-time", "Self-employed / contractor", "Currently overseas", "On a bridging visa"],
  partner: ["Married / de facto in Australia", "Married / de facto overseas", "Recently engaged (prospective)", "Same-sex relationship"],
  pr: ["On a 189/190 visa", "On a 482 visa", "On a partner visa", "Long-term resident (10+ years)"],
  humanitarian: ["Currently offshore (UNHCR referred)", "Currently in Australia seeking protection", "Sponsored by family/community in Australia", "Fleeing persecution, no prior visa"],
};

const CHECKLIST_PROMPTS = {
  "189": "Australian Skilled Independent visa subclass 189 document checklist. Include: skills assessment, EOI/SkillSelect, English test (IELTS/PTE), identity docs, health/character requirements, and points test evidence. Be very specific about Australian immigration requirements.",
  "190": "Australian Skilled Nominated visa subclass 190 document checklist. Include state nomination requirements, skills assessment, English test, identity, health, character, occupation lists. Be specific.",
  "491": "Australian Skilled Regional visa subclass 491 document checklist. Include regional nomination or family sponsorship, skills assessment, English, identity, health, character. Mention regional area requirements.",
  "482": "Australian Temporary Skill Shortage visa subclass 482 document checklist. Include employer sponsorship, skills/qualifications, English, identity, health, character, labour market testing docs. Be specific.",
  "820_801": "Australian Partner visa (820 onshore / 801 permanent) document checklist. Include relationship evidence, sponsor eligibility, identity, health, character for both applicant and sponsor. Mention genuine relationship evidence types.",
  "309_100": "Australian Partner visa offshore (309/100) document checklist. Include relationship evidence, sponsor Australian citizenship/PR proof, identity, health, character. Cover both stage 1 and stage 2.",
  "100": "Australian Permanent Residency visa document checklist for someone transitioning from temporary PR. Include residency calculation, identity, health, character, any remaining conditions.",
  "citizenship": "Australian Citizenship by conferral document checklist. Include residency calculation (4 years total, 1 year PR), identity docs, character, English, intention to reside, ceremony info.",
  "200": "Australian Refugee visa subclass 200 document checklist. Include UNHCR referral, identity and travel documents, evidence of persecution/well-founded fear, health and character checks, biometrics, security checks. Be specific and sensitive to applicant circumstances.",
  "202": "Australian Global Special Humanitarian visa subclass 202 document checklist. Include proposer/sponsor documents (Form 681), evidence of substantial discrimination or harm, identity documents, relationship to proposer, health and character checks. Be specific and sensitive.",
  "866": "Australian Protection visa subclass 866 (onshore) document checklist. Include identity and travel documents, detailed statement of claims for protection/persecution, supporting country-of-origin evidence, health and character checks, legal representation considerations. Be specific and sensitive to applicant circumstances.",
};

const categoryColors = { skilled: "#1a6fff", partner: "#e0456e", pr: "#00a86b", humanitarian: "#9b59b6" };
const categoryLabels = { skilled: "Skilled", partner: "Partner", pr: "PR / Citizenship", humanitarian: "Humanitarian" };

export default function App() {
  const [step, setStep] = useState("landing"); // landing | select | result
  const [selectedVisa, setSelectedVisa] = useState(null);
  const [selectedSituation, setSelectedSituation] = useState("");
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checked, setChecked] = useState({});

  const visa = VISA_TYPES.find(v => v.id === selectedVisa);
  const situations = visa ? SITUATIONS[visa.category] : [];

  async function generateChecklist() {
    if (!selectedVisa || !selectedSituation) return;
    setLoading(true);
    setError(null);
    setChecklist(null);
    setChecked({});

    const prompt = `${CHECKLIST_PROMPTS[selectedVisa]}
Applicant situation: ${selectedSituation}.

Return ONLY a valid JSON object with this exact structure (no markdown, no backticks). Keep it concise: 3-5 categories, 2-4 items per category, details under 25 words each, max 4 tips.
{
  "visaName": "Full visa name",
  "summary": "2-sentence plain English summary of this visa pathway",
  "categories": [
    {
      "name": "Category name",
      "icon": "emoji",
      "items": [
        {
          "doc": "Document name",
          "detail": "Specific requirement or tip (1-2 sentences)",
          "warning": "Optional: a common mistake or critical warning (or null)"
        }
      ]
    }
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "disclaimer": "Short legal disclaimer"
}`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setChecklist(parsed);
      setStep("result");
    } catch (e) {
      setError("Something went wrong generating your checklist. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleCheck(catIdx, itemIdx) {
    const key = `${catIdx}-${itemIdx}`;
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const totalItems = checklist?.categories?.reduce((sum, c) => sum + c.items.length, 0) || 0;
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  // ── LANDING ──────────────────────────────────────────────────────────────
  if (step === "landing") return (
    <div style={{ minHeight: "100vh", background: "#f7f8fc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px" }}>

        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0 0" }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#111", letterSpacing: "-0.5px" }}>🦘 VisaQuest</span>
          <span style={{ fontSize: 12, background: "#e8f4ff", color: "#1a6fff", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>Australia</span>
        </div>

        {/* Hero */}
        <div style={{ textAlign: "center", padding: "72px 0 56px" }}>
          <div style={{ display: "inline-block", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "10px 20px", fontSize: 13, color: "#666", marginBottom: 28, fontWeight: 500 }}>
            AI-powered · Expert knowledge · Free to use
          </div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 900, color: "#0a0a0a", lineHeight: 1.1, margin: "0 0 20px", letterSpacing: "-2px" }}>
            Know exactly what<br />
            <span style={{ color: "#1a6fff" }}>documents you need.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#555", lineHeight: 1.6, margin: "0 0 40px", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            Stop guessing your Australian visa requirements. Get a personalised document checklist in seconds — built on real immigration expertise.
          </p>
          <button
            onClick={() => setStep("select")}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(26,111,255,0.45)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(26,111,255,0.35)"; }}
            style={{ background: "#1a6fff", color: "#fff", border: "none", borderRadius: 12, padding: "16px 40px", fontSize: 17, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(26,111,255,0.35)", transition: "transform 0.15s, box-shadow 0.15s" }}
          >
            Build my checklist →
          </button>
        </div>

        {/* Social proof */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 80 }}>
          {[
            { n: "11", label: "visa types covered" },
            { n: "100%", label: "free to use" },
            { n: "AI", label: "expert-backed guidance" },
          ].map(({ n, label }) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#0a0a0a", letterSpacing: "-1px" }}>{n}</div>
              <div style={{ fontSize: 13, color: "#777", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Visa type chips */}
        <div style={{ marginBottom: 80 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Visa types covered</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {VISA_TYPES.map(v => (
              <span key={v.id} style={{ background: "#fff", border: `1.5px solid ${categoryColors[v.category]}30`, color: categoryColors[v.category], padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                {v.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── SELECT ────────────────────────────────────────────────────────────────
  if (step === "select") return (
    <div style={{ minHeight: "100vh", background: "#f7f8fc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "24px 0 40px", gap: 16 }}>
          <button onClick={() => setStep("landing")} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 14, color: "#555" }}>← Back</button>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#111", letterSpacing: "-0.5px" }}>🦘 VisaQuest</span>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#1a6fff" }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#1a6fff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>1</span>
            Visa type
          </div>
          <div style={{ flex: 1, height: 2, background: selectedVisa ? "#1a6fff" : "#e5e7eb", borderRadius: 2, transition: "background 0.3s" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: selectedVisa ? "#1a6fff" : "#bbb" }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: selectedVisa ? "#1a6fff" : "#e5e7eb", color: selectedVisa ? "#fff" : "#999", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, transition: "all 0.3s" }}>2</span>
            Situation
          </div>
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0a0a0a", margin: "0 0 8px", letterSpacing: "-1px" }}>Which visa are you applying for?</h2>
        <p style={{ color: "#777", marginBottom: 32, fontSize: 15 }}>Select the visa type that matches your situation.</p>

        {["skilled", "partner", "pr", "humanitarian"].map(cat => (
          <div key={cat} style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: categoryColors[cat], textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>{categoryLabels[cat]}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {VISA_TYPES.filter(v => v.category === cat).map(v => (
                <button
                  key={v.id}
                  onClick={() => { setSelectedVisa(v.id); setSelectedSituation(""); }}
                  onMouseEnter={(e) => { if (selectedVisa !== v.id) e.currentTarget.style.borderColor = categoryColors[cat] + "80"; }}
                  onMouseLeave={(e) => { if (selectedVisa !== v.id) e.currentTarget.style.borderColor = "#e5e7eb"; }}
                  style={{
                    background: selectedVisa === v.id ? `${categoryColors[cat]}10` : "#fff",
                    border: `2px solid ${selectedVisa === v.id ? categoryColors[cat] : "#e5e7eb"}`,
                    borderRadius: 12, padding: "14px 18px", textAlign: "left", cursor: "pointer",
                    fontSize: 15, fontWeight: 600, color: selectedVisa === v.id ? categoryColors[cat] : "#333",
                    transition: "all 0.15s"
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {selectedVisa && (
          <div style={{ marginTop: 8, marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a", margin: "0 0 8px" }}>Your situation</h3>
            <p style={{ color: "#777", marginBottom: 16, fontSize: 14 }}>This helps tailor your checklist.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {situations.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSituation(s)}
                  style={{
                    background: selectedSituation === s ? `${categoryColors[visa.category]}10` : "#fff",
                    border: `2px solid ${selectedSituation === s ? categoryColors[visa.category] : "#e5e7eb"}`,
                    borderRadius: 12, padding: "14px 18px", textAlign: "left", cursor: "pointer",
                    fontSize: 15, fontWeight: 500, color: selectedSituation === s ? categoryColors[visa.category] : "#444"
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedVisa && selectedSituation && (
          <button
            onClick={generateChecklist}
            disabled={loading}
            style={{
              width: "100%", background: loading ? "#aac6ff" : "#1a6fff", color: "#fff", border: "none",
              borderRadius: 12, padding: "17px", fontSize: 16, fontWeight: 700, cursor: loading ? "default" : "pointer",
              marginBottom: 40, boxShadow: "0 4px 20px rgba(26,111,255,0.3)"
            }}
          >
            {loading ? "Building your checklist..." : "Generate my checklist →"}
          </button>
        )}

        {error && <p style={{ color: "#e0456e", textAlign: "center", marginBottom: 32 }}>{error}</p>}
      </div>
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (step === "result" && checklist) return (
    <div style={{ minHeight: "100vh", background: "#f7f8fc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "24px 0 32px", gap: 16 }}>
          <button onClick={() => setStep("select")} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 14, color: "#555" }}>← Back</button>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#111", letterSpacing: "-0.5px" }}>🦘 VisaQuest</span>
        </div>

        {/* Visa title */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "24px", marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: categoryColors[visa.category], textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>{categoryLabels[visa.category]}</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0a0a0a", margin: "0 0 10px", letterSpacing: "-0.5px" }}>{checklist.visaName}</h2>
          <p style={{ color: "#555", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{checklist.summary}</p>
        </div>

        {/* Progress */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>Your progress</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1a6fff" }}>{checkedCount}/{totalItems} docs</span>
          </div>
          <div style={{ background: "#f0f4ff", borderRadius: 99, height: 8 }}>
            <div style={{ background: progress === 100 ? "#00a86b" : "#1a6fff", borderRadius: 99, height: 8, width: `${progress}%`, transition: "width 0.3s, background 0.3s" }} />
          </div>
          {progress === 100 && (
            <p style={{ margin: "12px 0 0", fontSize: 13, color: "#00a86b", fontWeight: 600 }}>🎉 All documents checked off — you're ready to apply!</p>
          )}
        </div>

        {/* Categories */}
        {checklist.categories?.map((cat, catIdx) => (
          <div key={catIdx} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "20px 24px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 22 }}>{cat.icon}</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: 0 }}>{cat.name}</h3>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#999", fontWeight: 600 }}>{cat.items.length} items</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cat.items.map((item, itemIdx) => {
                const key = `${catIdx}-${itemIdx}`;
                const done = checked[key];
                return (
                  <div
                    key={itemIdx}
                    onClick={() => toggleCheck(catIdx, itemIdx)}
                    onMouseEnter={(e) => { if (!done) e.currentTarget.style.background = "#f0f4ff"; }}
                    onMouseLeave={(e) => { if (!done) e.currentTarget.style.background = "#fafafa"; }}
                    style={{
                      display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer",
                      padding: "12px", borderRadius: 10, background: done ? "#f0faf5" : "#fafafa",
                      border: `1.5px solid ${done ? "#00a86b30" : "#f0f0f0"}`,
                      transition: "all 0.15s"
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, border: `2px solid ${done ? "#00a86b" : "#d0d0d0"}`,
                      background: done ? "#00a86b" : "#fff", flexShrink: 0, marginTop: 1,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {done && <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: done ? "#00a86b" : "#111", textDecoration: done ? "line-through" : "none" }}>{item.doc}</p>
                      <p style={{ margin: 0, fontSize: 13, color: "#666", lineHeight: 1.5 }}>{item.detail}</p>
                      {item.warning && (
                        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#e0456e", background: "#fff5f7", padding: "6px 10px", borderRadius: 6, borderLeft: "3px solid #e0456e" }}>
                          ⚠ {item.warning}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Tips */}
        {checklist.tips?.length > 0 && (
          <div style={{ background: "#f0f4ff", border: "1px solid #c7d9ff", borderRadius: 16, padding: "20px 24px", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a6fff", margin: "0 0 14px" }}>💡 Expert tips</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {checklist.tips.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: "#1a6fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{i + 1}.</span>
                  <p style={{ margin: 0, fontSize: 14, color: "#334", lineHeight: 1.5 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6, textAlign: "center", marginTop: 8 }}>
          {checklist.disclaimer || "This checklist is for general guidance only and does not constitute legal or migration advice. Always verify requirements with the Department of Home Affairs or a registered migration agent."}
        </p>

        {/* CTA */}
        <div style={{ background: "#0a0a0a", borderRadius: 16, padding: "28px 24px", marginTop: 24, textAlign: "center" }}>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 18, margin: "0 0 8px" }}>Need help with your application?</p>
          <p style={{ color: "#aaa", fontSize: 14, margin: "0 0 20px" }}>Get a 1-on-1 review from a migration expert.</p>
          <a href="https://calendly.com/admin-mufasa/visa-document-review" target="_blank" rel="noopener noreferrer">
            <button style={{ background: "#1a6fff", color: "#fff", border: "none", borderRadius: 10, padding: "13px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Book a consultation
            </button>
          </a>
        </div>

        <button
          onClick={() => { setStep("select"); setSelectedVisa(null); setSelectedSituation(""); setChecklist(null); setChecked({}); }}
          style={{ width: "100%", background: "#fff", color: "#555", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 16 }}
        >
          ↻ Start a new checklist
        </button>
      </div>
    </div>
  );

  return null;
}
