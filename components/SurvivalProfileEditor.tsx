"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  EMPTY_SURVIVAL_PROFILE,
  parseSurvivalProfile,
  readLocalSurvivalProfile,
  readLocalSurvivalProfileUpdatedAt,
  saveLocalSurvivalProfile,
  type SurvivalProfile,
} from "@/lib/survival-profile";

export default function SurvivalProfileEditor({ onSaved }: { onSaved?: (profile: SurvivalProfile) => void }) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<SurvivalProfile>(EMPTY_SURVIVAL_PROFILE);
  const [equipmentText, setEquipmentText] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const local = readLocalSurvivalProfile(localStorage);
    setProfile(local);
    setEquipmentText(local.existingEquipment.join("\n"));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !session?.access_token) return;
    const controller = new AbortController();
    setLoadingAccount(true);
    void fetch("/api/profile/survival-context", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: controller.signal,
      cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) throw new Error("Account memory could not be loaded. Your device copy remains available.");
      const data = await response.json();
      const remote = parseSurvivalProfile(data.profile);
      if (controller.signal.aborted) return;
      if (!remote) {
        setStatus("No account loadout yet. Review this device's copy and Save to sync it.");
        return;
      }
      const remoteUpdatedAt = Date.parse(data.profile.updatedAt || "");
      if (readLocalSurvivalProfileUpdatedAt(localStorage) > (Number.isFinite(remoteUpdatedAt) ? remoteUpdatedAt : 0)) {
        setStatus("This device has a newer loadout. Review it and Save to sync your account.");
        return;
      }
      setProfile(remote);
      setEquipmentText(remote.existingEquipment.join("\n"));
      saveLocalSurvivalProfile(localStorage, remote, data.profile.updatedAt);
      onSaved?.(remote);
      setStatus("Private account loadout loaded on this device.");
    }).catch((error) => {
      if (!controller.signal.aborted) setStatus(error instanceof Error ? error.message : "Account memory could not be loaded.");
    }).finally(() => { if (!controller.signal.aborted) setLoadingAccount(false); });
    return () => controller.abort();
  }, [ready, session?.access_token, onSaved]);

  function update<K extends keyof SurvivalProfile>(key: K, value: SurvivalProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
    setStatus("");
  }

  async function save() {
    const equipment = equipmentText.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean);
    if (equipment.length > 24) {
      setStatus("Keep the inventory to 24 items or fewer for now.");
      return;
    }
    const cleaned = parseSurvivalProfile({ ...profile, existingEquipment: equipment });
    if (!cleaned) {
      setStatus("Check the household size and inventory, then try again.");
      return;
    }
    setSaving(true);
    try {
      saveLocalSurvivalProfile(localStorage, cleaned);
      setProfile(cleaned);
      setEquipmentText(cleaned.existingEquipment.join("\n"));
      onSaved?.(cleaned);
      if (!session?.access_token) {
        setStatus("Saved on this device. Red Queen will use this context in your next chat.");
        return;
      }
      const response = await fetch("/api/profile/survival-context", {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });
      if (!response.ok) throw new Error("Saved on this device, but account sync failed. Try Save again later.");
      const data = await response.json();
      if (typeof data.updatedAt === "string") saveLocalSurvivalProfile(localStorage, cleaned, data.updatedAt);
      setStatus("Saved privately to your account and this device. Red Queen will use it next time.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save this loadout.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="my-loadout" className="rq-inventory-editor" aria-labelledby="my-loadout-title">
      <header>
        <div><span>YOUR CONTEXT // UNDER YOUR CONTROL</span><h2 id="my-loadout-title">What do you already have?</h2><p>Save the basics once. Queen can check gaps before suggesting a cart. Nothing here changes your BIO score.</p></div>
        <strong>{equipmentText.split(/[\n,;]+/).filter((item) => item.trim()).length} OWNED ITEMS</strong>
      </header>
      <fieldset className="rq-inventory-editor__fields" disabled={loadingAccount}>
        <label>City or region <small>Broad area only</small><input value={profile.area} onChange={(event) => update("area", event.target.value)} maxLength={80} placeholder="Barcelona, Spain" /></label>
        <label>People to prepare for<select value={profile.people} onChange={(event) => update("people", Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index} value={index + 1}>{index + 1} {index === 0 ? "person" : "people"}</option>)}</select></label>
        <label>Budget <small>Optional</small><input value={profile.budget} onChange={(event) => update("budget", event.target.value)} maxLength={120} placeholder="For example: €50 this month" /></label>
        <label>Household needs <small>Optional</small><input value={profile.constraints} onChange={(event) => update("constraints", event.target.value)} maxLength={320} placeholder="Pet, limited storage, accessibility needs..." /></label>
        <label className="rq-inventory-editor__equipment">Equipment and supplies you already own <small>One item per line, up to 24</small><textarea value={equipmentText} onChange={(event) => { setEquipmentText(event.target.value); setStatus(""); }} rows={6} maxLength={2500} placeholder={"Flashlights\nFirst-aid kit\nPower bank"} /></label>
      </fieldset>
      <footer>
        <p>{session?.access_token ? "Save to your private account for use on other devices. No exact address, medical history or payment details here." : "Saved only in this browser. Sign in if you want private account sync."}</p>
        <button type="button" onClick={save} disabled={!ready || saving || loadingAccount}>{loadingAccount ? "LOADING ACCOUNT..." : saving ? "SAVING..." : session?.access_token ? "SAVE TO MY PRIVATE ACCOUNT" : "SAVE ON THIS DEVICE"}</button>
      </footer>
      {status && <p role="status" className="rq-inventory-editor__status">{status}</p>}
    </section>
  );
}
