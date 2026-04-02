import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchInteractions } from "../features/interactionsSlice";

function InteractionList() {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.interactions);

  useEffect(() => {
    dispatch(fetchInteractions());
  }, [dispatch]);

  return (
    <section className="panel panel--full">
      <div className="panel__head">
        <h2 className="panel__title">Recent interactions</h2>
      </div>
      {error && (
        <p className="interaction-list__error" role="alert">
          Could not reach the API ({error}). Start the backend with{" "}
          <code>uvicorn app.main:app --reload --port 8000</code> from the <code>backend</code> folder, then refresh.
        </p>
      )}
      {loading && <p className="muted">Loading…</p>}
      {!loading && !error && items.length === 0 && <p className="muted">No interactions logged yet.</p>}
      <ul className="interaction-table">
        {items.map((item) => (
          <li key={item.id} className="interaction-row">
            <div className="interaction-row__main">
              <strong>{item.doctor_name}</strong>
              <span className="badge">{item.interaction_type}</span>
              <span className="muted">{new Date(item.interaction_at).toLocaleString()}</span>
            </div>
            {item.topics_discussed && <p className="interaction-row__topics">{item.topics_discussed}</p>}
            <div className="interaction-row__meta">
              {item.sentiment && <span>Sentiment: {item.sentiment}</span>}
              {item.follow_up_actions && <span>Follow-up: {item.follow_up_actions}</span>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default InteractionList;
