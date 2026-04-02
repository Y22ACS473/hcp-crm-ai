import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createInteraction,
  fetchInteractions,
  resetDraft,
  setDraftField,
  summarizeTranscript
} from "../features/interactionsSlice";

function parseDateTime(interactionAt) {
  const raw = interactionAt || new Date().toISOString().slice(0, 16);
  const [date, time = "12:00"] = raw.includes("T") ? raw.split("T") : [raw.slice(0, 10), raw.slice(11, 16)];
  return { date: date.slice(0, 10), time: time.slice(0, 5) };
}

function suggestedFollowUpLinks(draft) {
  const raw = draft.doctor_name.trim();
  const hcpLabel = raw
    ? `Dr. ${raw.split(/\s+/).filter(Boolean).slice(-1)[0]}`
    : "Dr. Sharma";
  return [
    { key: "fu-1", text: "Schedule follow-up meeting in 2 weeks" },
    { key: "fu-2", text: "Send OncoBoost Phase III PDF" },
    { key: "fu-3", text: `Add ${hcpLabel} to advisory board invite list` }
  ];
}

function InteractionDetailsForm() {
  const dispatch = useDispatch();
  const draft = useSelector((s) => s.interactions.draft);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voicePaste, setVoicePaste] = useState("");

  const { date, time } = useMemo(() => parseDateTime(draft.interaction_at), [draft.interaction_at]);
  const followUps = useMemo(() => suggestedFollowUpLinks(draft), [draft]);

  const setInteractionAt = (nextDate, nextTime) => {
    dispatch(setDraftField({ name: "interaction_at", value: `${nextDate}T${nextTime}` }));
  };

  const onField = (e) => {
    dispatch(setDraftField({ name: e.target.name, value: e.target.value }));
  };

  const onDateChange = (e) => {
    setInteractionAt(e.target.value, time);
  };

  const onTimeChange = (e) => {
    setInteractionAt(date, e.target.value);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...draft,
      interaction_at: new Date(draft.interaction_at).toISOString()
    };
    await dispatch(createInteraction(payload));
    dispatch(fetchInteractions());
    dispatch(resetDraft());
  };

  const onSummarizeVoice = async () => {
    const text = voicePaste.trim();
    if (!text) {
      setVoiceOpen(true);
      return;
    }
    await dispatch(summarizeTranscript(text));
    setVoicePaste("");
    setVoiceOpen(false);
  };

  const appendFollowUp = (line) => {
    const cur = draft.follow_up_actions.trim();
    const next = cur ? `${cur}\n• ${line}` : `• ${line}`;
    dispatch(setDraftField({ name: "follow_up_actions", value: next }));
  };

  const addMaterial = () => {
    const line = window.prompt("Material to add (e.g. brochure, PDF name):")?.trim();
    if (!line) return;
    const cur = draft.materials_shared.trim();
    dispatch(
      setDraftField({
        name: "materials_shared",
        value: cur ? `${cur}; ${line}` : line
      })
    );
  };

  const addSample = () => {
    const line = window.prompt("Sample (product, qty):")?.trim();
    if (!line) return;
    const cur = draft.samples_distributed.trim();
    dispatch(
      setDraftField({
        name: "samples_distributed",
        value: cur ? `${cur}; ${line}` : line
      })
    );
  };

  const hasMaterials = Boolean(draft.materials_shared?.trim());
  const hasSamples = Boolean(draft.samples_distributed?.trim());

  return (
    <section className="panel panel--main">
      <div className="panel__head">
        <h2 className="panel__title panel__title--lead">Interaction Details</h2>
      </div>

      <form className="interaction-form" onSubmit={onSubmit}>
        <div className="field-row">
          <label className="field">
            <span className="field__label">HCP Name</span>
            <div className="field__control field__control--search">
              <svg className="field__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <input
                name="doctor_name"
                placeholder="Search or select HCP..."
                value={draft.doctor_name}
                onChange={onField}
                required
                autoComplete="off"
              />
            </div>
          </label>
          <label className="field">
            <span className="field__label">Interaction Type</span>
            <select name="interaction_type" value={draft.interaction_type} onChange={onField}>
              <option value="meeting">Meeting</option>
              <option value="visit">Visit</option>
              <option value="call">Call</option>
            </select>
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field__label">Date</span>
            <div className="field__control field__control--icon">
              <svg className="field__icon field__icon--right" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="currentColor"
                  d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
                />
              </svg>
              <input type="date" value={date} onChange={onDateChange} required />
            </div>
          </label>
          <label className="field">
            <span className="field__label">Time</span>
            <div className="field__control field__control--icon">
              <svg className="field__icon field__icon--right" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="currentColor"
                  d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
                />
              </svg>
              <input type="time" value={time} onChange={onTimeChange} required />
            </div>
          </label>
        </div>

        <label className="field">
          <span className="field__label">Attendees</span>
          <input
            name="attendees"
            placeholder="Enter names or search..."
            value={draft.attendees}
            onChange={onField}
          />
        </label>

        <label className="field">
          <span className="field__label">Topics Discussed</span>
          <div className="textarea-wrap">
            <textarea
              name="topics_discussed"
              className="textarea--tall"
              placeholder="Enter key discussion points..."
              value={draft.topics_discussed}
              onChange={onField}
              rows={5}
            />
            <span className="textarea-wrap__mic" title="Voice capture placeholder" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </span>
          </div>
        </label>

        <div className="voice-note-block">
          <button
            type="button"
            className="btn btn--secondary btn--magic btn--voice"
            onClick={() => setVoiceOpen((v) => !v)}
          >
            <span className="wand" aria-hidden>
              ✦
            </span>
            Summarize from Voice Note (Requires Consent)
          </button>
          {voiceOpen && (
            <div className="voice-note-pop">
              <p className="hint">Paste the transcript from your approved recording workflow.</p>
              <textarea
                value={voicePaste}
                onChange={(e) => setVoicePaste(e.target.value)}
                placeholder="Paste voice note transcript..."
                rows={4}
              />
              <button type="button" className="btn btn--primary" onClick={onSummarizeVoice}>
                Summarize into Topics
              </button>
            </div>
          )}
        </div>

        <div className="subsection subsection--boxed">
          <h3 className="subsection__title">Materials Shared / Samples Distributed</h3>

          <div className="asset-row">
            <div className="asset-row__main">
              <span className="field__label">Materials Shared</span>
              {hasMaterials ? (
                <p className="asset-row__value">{draft.materials_shared}</p>
              ) : (
                <p className="asset-row__empty">No materials added.</p>
              )}
            </div>
            <button type="button" className="btn btn--outline btn--sm btn--with-icon" onClick={addMaterial}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              Search/Add
            </button>
          </div>

          <div className="asset-row asset-row--samples">
            <div className="asset-row__main">
              <span className="field__label">Samples Distributed</span>
              {hasSamples ? (
                <p className="asset-row__value">{draft.samples_distributed}</p>
              ) : (
                <p className="asset-row__empty">No samples added.</p>
              )}
            </div>
            <button type="button" className="btn btn--outline btn--sm btn--with-icon" onClick={addSample}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5S5.17 15.5 6 15.5s1.5.67 1.5 1.5S6.83 18.5 6 18.5zm12-9h8.5l1.1 1.33V15H18v-5z" />
              </svg>
              Add Sample
            </button>
          </div>
        </div>

        <fieldset className="sentiment">
          <legend className="field__label">Observed/Inferred HCP Sentiment</legend>
          <div className="sentiment__opts">
            {[
              { v: "positive", label: "Positive", emoji: "\u{1F60A}" },
              { v: "neutral", label: "Neutral", emoji: "\u{1F610}" },
              { v: "negative", label: "Negative", emoji: "\u{1F61E}" }
            ].map(({ v, label, emoji }) => (
              <label key={v} className="sentiment__opt">
                <input type="radio" name="sentiment" value={v} checked={draft.sentiment === v} onChange={onField} />
                <span className="sentiment__emoji" aria-hidden>
                  {emoji}
                </span>
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span className="field__label">Outcomes</span>
          <textarea
            name="outcomes"
            placeholder="Key outcomes or agreements..."
            value={draft.outcomes}
            onChange={onField}
            rows={3}
          />
        </label>

        <label className="field">
          <span className="field__label">Follow-up Actions</span>
          <textarea
            name="follow_up_actions"
            placeholder="Enter next steps or tasks..."
            value={draft.follow_up_actions}
            onChange={onField}
            rows={3}
          />
        </label>

        <div className="ai-followups">
          <h3 className="ai-followups__title">AI Suggested Follow-ups:</h3>
          <ul className="ai-followups__links">
            {followUps.map((item) => (
              <li key={item.key}>
                <button type="button" className="ai-followups__link" onClick={() => appendFollowUp(item.text)}>
                  <span className="ai-followups__plus" aria-hidden>
                    +
                  </span>
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn--primary btn--lg">
            Save interaction
          </button>
        </div>
      </form>
    </section>
  );
}

export default InteractionDetailsForm;
