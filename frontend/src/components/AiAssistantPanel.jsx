import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { clearChatResult, fetchInteractions, runAgentChat } from "../features/interactionsSlice";

function AiAssistantPanel() {
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
    <aside className="panel panel--aside">
      <div className="panel__head panel__head--aside">
        <div className="aside-title">
          <span className="aside-title__icon aside-title__icon--circle" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
              <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <h2 className="panel__title">AI Assistant</h2>
            <p className="panel__subtitle">Log interaction via chat</p>
          </div>
        </div>
      </div>

      <div className="aside-body aside-body--stack">
        <div className="aside-scroll">
          <div className="chat-bubble chat-bubble--hint">
            <p>
              Log interaction details here (e.g., &quot;Met Dr. Smith, discussed Product X efficacy, positive sentiment,
              shared brochure&quot;) or ask for help.
            </p>
          </div>

          {chatResult?.error && (
            <div className="chat-result chat-result--error">
              <strong>Error</strong>
              <p>{String(chatResult.detail)}</p>
            </div>
          )}
          {chatResult && !chatResult.error && (
            <div className="chat-result chat-result--compact">
              <strong>Last response</strong>
              <pre>{JSON.stringify(chatResult, null, 2)}</pre>
            </div>
          )}
        </div>

        <form className="aside-compose" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="chat-input">
            Describe interaction
          </label>
          <div className="aside-compose__row">
            <input
              id="chat-input"
              className="aside-compose__input"
              type="text"
              placeholder="Describe interaction..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" className="btn btn--log">
              <span className="btn--log__spark" aria-hidden>
                ✦
              </span>
              Log
            </button>
          </div>
          <button
            type="button"
            className="aside-compose__clear"
            onClick={() => dispatch(clearChatResult())}
          >
            Clear last response
          </button>
        </form>
      </div>
    </aside>
  );
}

export default AiAssistantPanel;
