import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchInteractions, runAgentChat } from "../features/interactionsSlice";

function ChatLogger() {
  const dispatch = useDispatch();
  const chatResult = useSelector((state) => state.interactions.chatResult);
  const [message, setMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    await dispatch(runAgentChat(message));
    await dispatch(fetchInteractions());
    setMessage("");
  };

  return (
    <div className="card">
      <h2>AI Chat Interface</h2>
      <form onSubmit={onSubmit}>
        <textarea
          placeholder='Example: "Met Dr. Reddy today, discussed diabetes drug, asked for samples"'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send to Agent</button>
      </form>
      {chatResult?.error && (
        <pre className="result errorBox">{String(chatResult.detail)}</pre>
      )}
      {chatResult && !chatResult.error && (
        <pre className="result">{JSON.stringify(chatResult, null, 2)}</pre>
      )}
    </div>
  );
}

export default ChatLogger;
