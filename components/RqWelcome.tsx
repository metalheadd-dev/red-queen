"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { draftQueenQuestion, profilePrompt, readRqProfile, RQ_PROFILE_EVENT, RQ_PROFILE_KEY, RQ_WELCOME_EVENT, type RqProfile } from "@/lib/rq-experience";
import { RQ_BOOT_COMPLETE_EVENT } from "@/lib/rq-boot";
import RqWordmark from "./RqWordmark";

const emptyProfile: RqProfile = { name: "", city: "", country: "", people: 1, interest: "both", favorite: "", goal: "prepare", completedAt: "" };

export default function RqWelcome() {
  const pathname = usePathname();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<RqProfile>(emptyProfile);
  const [storageNote, setStorageNote] = useState("");

  useEffect(() => {
    function open() {
      try { setProfile(readRqProfile(localStorage) || emptyProfile); } catch { setProfile(emptyProfile); }
      setStep(0); setStorageNote("");
      previousFocus.current = document.activeElement as HTMLElement;
      if (!dialog.current?.open) dialog.current?.showModal();
    }
    window.addEventListener(RQ_WELCOME_EVENT, open);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let waitingForBoot = false;
    const scheduleOpen = () => { timer = setTimeout(open, 450); };
    try {
      const shouldOpen = pathname === "/" && !readRqProfile(localStorage) && localStorage.getItem("rq-welcome-seen-v1") !== "1" && sessionStorage.getItem("rq-welcome-dismissed") !== "1";
      if (shouldOpen) {
        waitingForBoot = document.documentElement.dataset.rqBoot === "show";
        if (waitingForBoot) window.addEventListener(RQ_BOOT_COMPLETE_EVENT, scheduleOpen, { once: true });
        else timer = setTimeout(open, 1200);
      }
    } catch { /* Explicit introduction remains available. */ }
    return () => {
      clearTimeout(timer);
      if (waitingForBoot) window.removeEventListener(RQ_BOOT_COMPLETE_EVENT, scheduleOpen);
      window.removeEventListener(RQ_WELCOME_EVENT, open);
    };
  }, [pathname]);

  function close() {
    try { localStorage.setItem("rq-welcome-seen-v1", "1"); } catch { /* Session-only dismissal remains available. */ }
    try { sessionStorage.setItem("rq-welcome-dismissed", "1"); } catch { /* Optional persistence. */ }
    dialog.current?.close(); previousFocus.current?.focus();
  }
  useEffect(() => {
    if (!dialog.current?.open) return;
    const heading = dialog.current.querySelector<HTMLElement>("h2");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    dialog.current.scrollTop = 0;
  }, [step]);
  function save() {
    const next = { ...profile, name: profile.name.trim(), city: profile.city.trim(), country: profile.country.trim(), favorite: profile.favorite.trim(), completedAt: new Date().toISOString() };
    setProfile(next);
    try {
      localStorage.setItem(RQ_PROFILE_KEY, JSON.stringify(next));
      let previous = {};
      try { previous = JSON.parse(localStorage.getItem("rq-survival-context-v1") || "{}"); } catch { /* Replace invalid optional context. */ }
      localStorage.setItem("rq-survival-context-v1", JSON.stringify({ ...previous, area: [next.city, next.country].filter(Boolean).join(", ").slice(0, 80), location: undefined, focus: next.goal === "understand" ? "LOCAL_THREATS" : "HOUSEHOLD", mode: next.goal === "practice" ? "SIMULATE" : next.goal === "understand" ? "MONITOR" : "PREPARE" }));
      window.dispatchEvent(new Event(RQ_PROFILE_EVENT));
    } catch { setStorageNote("Your browser could not save these preferences. You can still start a conversation."); }
    setStep(3);
  }
  function start() {
    const mode = profile.goal === "practice" ? "SIMULATE" : profile.goal === "understand" ? "MONITOR" : "PREPARE";
    const href = draftQueenQuestion(profilePrompt(profile), mode, profile.goal === "understand" ? "LOCAL_THREATS" : "HOUSEHOLD");
    close();
    if (pathname === "/red-queen" || pathname === "/terminal") window.dispatchEvent(new Event("rq-chat-draft-ready"));
    else router.push(href);
  }

  return <dialog ref={dialog} className="rq-welcome" aria-labelledby="rq-welcome-title" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === dialog.current) close(); }}>
    <div className="rq-welcome-shell">
      <aside className="rq-welcome-art" aria-hidden="true"><RqWordmark /><img src="/art/red-queen-presence.png" alt="" /><span className="rq-welcome-caption">SHE WAS EXPECTING YOU.</span></aside>
      <div className="rq-welcome-body">
        <div className="rq-welcome-top"><span>FIRST CONTACT / {step === 3 ? "READY" : `0${step + 1}`}</span><button type="button" onClick={close} aria-label="Close introduction">×</button></div>
        <div className="rq-welcome-progress" aria-label={`Introduction step ${Math.min(step + 1, 3)} of 3`}>{[0, 1, 2].map(i => <i key={i} className={i <= step ? "is-complete" : ""} />)}</div>
        {step === 0 && <>
          <span className="rq-kicker">YOUR AGENT. YOUR NEXT MOVE.</span><h2 id="rq-welcome-title">I’m Red Queen.<br /><em>What brings you here?</em></h2><p>I’ll help you understand the danger, make a plan and find what you need. Let’s start with you.</p>
          <div className="rq-welcome-choices">{([{ id: "prepare", title: "I want to be prepared", copy: "A useful plan for me and my household." }, { id: "understand", title: "I want to understand a threat", copy: "Clear answers, with sources I can check." }, { id: "practice", title: "Test my survival instincts", copy: "An interactive scenario. My decisions." }] as const).map(c => <button key={c.id} type="button" aria-pressed={profile.goal === c.id} className={profile.goal === c.id ? "is-selected" : ""} onClick={() => setProfile({ ...profile, goal: c.id })}><span><strong>{c.title}</strong><small>{c.copy}</small></span><b>{profile.goal === c.id ? "✓" : "↗"}</b></button>)}</div>
        </>}
        {step === 1 && <>
          <span className="rq-kicker">A LITTLE CONTEXT</span><h2 id="rq-welcome-title">Who am I<br /><em>looking out for?</em></h2><p>Keep it broad. Share only what you’re comfortable with. A broad location is enough.</p>
          <div className="rq-welcome-fields"><label>What should I call you?<input maxLength={40} autoComplete="nickname" placeholder="Name or alias" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></label><div><label>Country<input maxLength={60} autoComplete="country-name" placeholder="Country" value={profile.country} onChange={e => setProfile({ ...profile, country: e.target.value })} /></label><label>City or region<input maxLength={60} autoComplete="address-level2" placeholder="City or region" value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} /></label></div><label>People to prepare for<select value={profile.people} onChange={e => setProfile({ ...profile, people: Number(e.target.value) })}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1} {i === 0 ? "person" : "people"}</option>)}</select></label></div>
        </>}
        {step === 2 && <>
          <span className="rq-kicker">YOUR KIND OF APOCALYPSE</span><h2 id="rq-welcome-title">Reality, fiction<br /><em>or a little of both?</em></h2><p>Real preparation can start with a good story. Fictional scenarios will always be labelled.</p>
          <div className="rq-interest-options">{([{ id: "real", label: "Real threats" }, { id: "fiction", label: "Fiction & games" }, { id: "both", label: "Both worlds" }] as const).map(o => <button key={o.id} type="button" aria-pressed={profile.interest === o.id} className={profile.interest === o.id ? "is-selected" : ""} onClick={() => setProfile({ ...profile, interest: o.id })}>{o.label}</button>)}</div>
          <div className="rq-welcome-fields"><label>A favourite apocalypse film or game <small>Optional</small><input maxLength={100} placeholder="Resident Evil? The Last of Us? Your choice." value={profile.favorite} onChange={e => setProfile({ ...profile, favorite: e.target.value })} /></label></div><div className="rq-queen-note">“The scenario can be fictional. What you learn about yourself is real.”<span>RED QUEEN</span></div>
        </>}
        {step === 3 && <>
          <span className="rq-kicker">YOUR FIRST MOVE IS READY</span><h2 id="rq-welcome-title">Welcome to RQ{profile.name ? `, ${profile.name}` : ""}.<br /><em>Let’s begin.</em></h2><p>{profile.goal === "practice" ? "I’ll present one scenario. You make the first decision." : profile.goal === "understand" ? "Tell me what concerns you. We’ll work out what matters." : "We’ll start with one useful step for your household."}</p>
          <div className="rq-welcome-summary"><span>{[profile.city, profile.country].filter(Boolean).join(", ") || "Location not set"}</span><span>{profile.people} {profile.people === 1 ? "person" : "people"}</span><span>{profile.interest === "real" ? "Real threats" : profile.interest === "fiction" ? "Fiction & games" : "Real + fictional scenarios"}</span></div>{storageNote && <p role="status">{storageNote}</p>}
          <button className="rq-button rq-button-primary" onClick={start}>Talk to Red Queen <span>↗</span></button><button className="rq-button rq-button-secondary" onClick={() => { draftQueenQuestion(profilePrompt(profile), profile.goal === "practice" ? "SIMULATE" : profile.goal === "understand" ? "MONITOR" : "PREPARE"); close(); router.push("/login"); }}>Create my account</button>
        </>}
        {step < 3 && <div className="rq-welcome-controls"><button className="rq-button rq-button-primary" onClick={() => step === 2 ? save() : setStep(step + 1)}>{step === 2 ? "Meet my Queen" : "Continue"}<span>→</span></button><button className="rq-text-button" onClick={() => step ? setStep(step - 1) : close()}>{step ? "Back" : "Explore first"}</button></div>}
        <p className="rq-welcome-privacy">Preferences stay on this device. When you start the chat, Queen receives the context shown here.</p>
      </div>
    </div>
  </dialog>;
}
