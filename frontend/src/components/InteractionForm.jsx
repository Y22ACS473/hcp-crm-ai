import { useState } from "react";
import { useDispatch } from "react-redux";

import { createInteraction, fetchInteractions } from "../features/interactionsSlice";

const defaultForm = {
  doctor_name: "",
  interaction_at: new Date().toISOString().slice(0, 16),
  interaction_type: "visit",
  notes: "",
  products_discussed: "",
  follow_up_actions: "",
  topic: "",
  intent: ""
};

function InteractionForm() {
  const dispatch = useDispatch();
  const [form, setForm] = useState(defaultForm);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, interaction_at: new Date(form.interaction_at).toISOString() };
    await dispatch(createInteraction(payload));
    dispatch(fetchInteractions());
    setForm(defaultForm);
  };

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Structured Log Interaction</h2>
      <input name="doctor_name" placeholder="Doctor Name (HCP)" value={form.doctor_name} onChange={onChange} required />
      <input type="datetime-local" name="interaction_at" value={form.interaction_at} onChange={onChange} required />
      <select name="interaction_type" value={form.interaction_type} onChange={onChange}>
        <option value="visit">Visit</option>
        <option value="call">Call</option>
      </select>
      <input name="topic" placeholder="Topic" value={form.topic} onChange={onChange} />
      <textarea name="notes" placeholder="Notes" value={form.notes} onChange={onChange} />
      <input name="products_discussed" placeholder="Products discussed" value={form.products_discussed} onChange={onChange} />
      <input name="follow_up_actions" placeholder="Follow-up actions" value={form.follow_up_actions} onChange={onChange} />
      <input name="intent" placeholder="Intent" value={form.intent} onChange={onChange} />
      <button type="submit">Save Interaction</button>
    </form>
  );
}

export default InteractionForm;
