import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchInteractions } from "../features/interactionsSlice";

function InteractionList() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.interactions);

  useEffect(() => {
    dispatch(fetchInteractions());
  }, [dispatch]);

  return (
    <div className="card">
      <h2>Interaction List</h2>
      {loading && <p>Loading...</p>}
      {!loading && items.length === 0 && <p>No interactions found.</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id} className="listItem">
            <strong>{item.doctor_name}</strong> - {item.interaction_type} - {new Date(item.interaction_at).toLocaleString()}
            <div>Topic: {item.topic || "-"}</div>
            <div>Products: {item.products_discussed || "-"}</div>
            <div>Follow-up: {item.follow_up_actions || "-"}</div>
            <div>Notes: {item.notes}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default InteractionList;
