"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, Threat } from "@/lib/threats";

function getSafeBaseline(threat: Threat, categoryKey: string) {
  if (categoryKey === "fictional" || categoryKey === "satirical") {
    return [
      "Define what is true inside the simulation before making a decision.",
      "Protect life, communication and optionality before pursuing a dramatic objective.",
      "Use the scenario to test reasoning — never treat lore as real-world evidence.",
    ];
  }

  if (categoryKey === "algorithmic") {
    return [
      "Do not share a seed phrase, private key, password or authentication code with anyone — including RED QUEEN.",
      "Verify domains, transaction details and wallet prompts before signing.",
      "Use official wallet and explorer tools to review exposure; move slowly when a claim creates urgency.",
    ];
  }

  const frame = `${threat.name} ${threat.classification}`.toLowerCase();
  if (/pandemic|virus|bio|health|chemical|outbreak/.test(frame)) {
    return [
      "Use current guidance from local public-health and emergency authorities.",
      "Maintain medication, hygiene and household communication essentials without panic buying.",
      "Know which symptoms or exposures require professional medical advice or emergency care.",
    ];
  }
  if (/blackout|infra|emp|solar|power|cyber/.test(frame)) {
    return [
      "Keep safe lighting, charged communication and an official alert source available.",
      "Plan for water, food safety and essential medical needs during a temporary outage.",
      "Never operate fuel-burning equipment in enclosed spaces; follow utility instructions when power returns.",
    ];
  }
  if (/earth|tsunami|volcano|climate|storm|flood|geological/.test(frame)) {
    return [
      "Know official warning channels, evacuation triggers and the safest route for your area.",
      "Prepare portable essentials, medication and an offline household contact plan.",
      "Follow local emergency instructions; conditions and safe actions vary by location.",
    ];
  }
  return [
    "Verify the current situation with official and independent primary sources.",
    "Protect essential water, medication, communication and payment continuity.",
    "Choose one reversible preparation action before making a costly or disruptive decision.",
  ];
}

export default function ThreatDossierPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id || "");
  const category = CATEGORIES.find((item) => item.threats.some((threat) => threat.id === id));
  const threat = category?.threats.find((item) => item.id === id);

  if (!category || !threat) {
    return (
      <main className="dossier-missing container">
        <span className="pulse-eyebrow">DOSSIER NOT FOUND</span>
        <h1>This reference file is unavailable.</h1>
        <Link className="btn btn-primary" href="/threat-vector">RETURN TO LIBRARY</Link>
      </main>
    );
  }

  const isSimulation = category.key === "fictional" || category.key === "satirical";
  const isDigital = category.key === "algorithmic";
  const baseline = getSafeBaseline(threat, category.key);
  const related = category.threats.filter((item) => item.id !== threat.id).slice(0, 3);
  const laneLabel = isSimulation ? "FICTIONAL SIMULATION" : isDigital ? "DIGITAL DEFENSE SCENARIO" : "REAL-WORLD REFERENCE";
  const analysisPrompt = isSimulation
    ? `Run a clearly labeled fictional decision simulation based on ${threat.name}. Present one decision at a time and wait for my answer.`
    : `Analyze the ${threat.name} reference scenario for my situation. Separate verified live facts from general preparedness, state uncertainty, and identify my highest-impact gap.`;
  const preparePrompt = isSimulation
    ? `Use ${threat.name} as a fictional stress test for my decision-making. Keep it clearly labeled as simulation and begin with one choice.`
    : `Build a practical preparedness checklist for ${threat.name}. Ask only for context that changes the plan, use official guidance where relevant, and give me one action for today.`;

  function queenHref(prompt: string, mode: "ANALYZE" | "PREPARE" | "SIMULATE") {
    const focus = isDigital ? "DIGITAL_SECURITY" : "LOCAL_THREATS";
    return `/terminal?${new URLSearchParams({ mode, focus, prompt }).toString()}`;
  }

  return (
    <div className="dossier-page" style={{ "--dossier-color": category.color } as React.CSSProperties}>
      <header className="dossier-hero">
        <div className="container">
          <Link href="/threat-vector" className="dossier-back">← THREAT LIBRARY</Link>
          <div className="dossier-labels"><span>{laneLabel}</span><b>{threat.id}</b></div>
          <h1>{threat.name}</h1>
          <p>{threat.classification} · Scenario origin: {threat.origin}</p>
        </div>
      </header>

      <main className="container dossier-main">
        <section className={`dossier-trust ${isSimulation ? "simulation" : ""}`}>
          <strong>{isSimulation ? "SIMULATION — NOT A REAL-WORLD CLAIM" : "REFERENCE DOSSIER — NOT A LIVE ALERT"}</strong>
          <p>
            {isSimulation
              ? "This file exists for training and worldbuilding. It must never be interpreted as current intelligence."
              : "This page explains a preparedness scenario. Check the Live Map and official local sources before treating any condition as current."}
          </p>
          {!isSimulation && <Link href="/#live-map">CHECK VERIFIED SIGNALS →</Link>}
        </section>

        <div className="dossier-grid">
          <section className="dossier-primary">
            <div className="dossier-section-heading"><span>01</span><div><b>SCENARIO FRAME</b><h2>What this dossier is for</h2></div></div>
            <p className="dossier-lead">
              Use this file to understand dependencies, prepare questions and practice decisions around <strong>{threat.name}</strong>. Its {threat.level}/100 rating describes the intensity of the library scenario — not the probability that it is happening now.
            </p>

            <div className="dossier-severity">
              <div><span>SCENARIO SEVERITY</span><strong>{threat.level}/100</strong></div>
              <i><b style={{ width: `${threat.level}%` }} /></i>
              <small>CURRENT PROBABILITY: NOT ASSERTED BY THIS LIBRARY</small>
            </div>

            <div className="dossier-section-heading"><span>02</span><div><b>SAFE BASELINE</b><h2>Start without overreacting</h2></div></div>
            <div className="dossier-actions-list">
              {baseline.map((action, index) => (
                <div key={action}><span>0{index + 1}</span><p>{action}</p></div>
              ))}
            </div>

            <div className="dossier-section-heading"><span>03</span><div><b>VERIFICATION GATE</b><h2>Questions to answer before acting</h2></div></div>
            <div className="dossier-questions">
              <p>What is confirmed by a current primary or official source?</p>
              <p>What changes because of my location, household or constraints?</p>
              <p>Which action is useful even if the situation does not escalate?</p>
            </div>
          </section>

          <aside className="dossier-queen-panel">
            <div className="queen-core"><span /></div>
            <span>RED QUEEN // CONTEXT ENGINE</span>
            <h2>Make this file relevant to you.</h2>
            <p>Queen can analyze assumptions, build a checklist or turn this dossier into a clearly labeled decision drill.</p>
            <Link className="btn btn-primary" href={queenHref(analysisPrompt, isSimulation ? "SIMULATE" : "ANALYZE")}>
              {isSimulation ? "RUN SIMULATION" : "ANALYZE MY CONTEXT"}
            </Link>
            <Link className="btn btn-ghost" href={queenHref(preparePrompt, isSimulation ? "SIMULATE" : "PREPARE")}>
              {isSimulation ? "START DECISION DRILL" : "BUILD PREPAREDNESS PLAN"}
            </Link>
            <small>RED QUEEN must state uncertainty and cannot turn this reference file into a verified live claim.</small>
          </aside>
        </div>

        <section className="dossier-related">
          <div className="dossier-section-heading"><span>04</span><div><b>SAME LANE</b><h2>Related reference files</h2></div></div>
          <div>
            {related.map((item) => (
              <Link key={item.id} href={`/threat-vector/${item.id}`}>
                <span>{item.id}</span><strong>{item.name}</strong><small>{item.classification}</small>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
