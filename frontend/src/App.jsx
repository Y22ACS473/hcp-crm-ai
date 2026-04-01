import ChatLogger from "./components/ChatLogger";
import InteractionForm from "./components/InteractionForm";
import InteractionList from "./components/InteractionList";

function App() {
  return (
    <div className="container">
      <h1>Mini CRM - HCP Log Interaction</h1>
      <div className="grid">
        <InteractionForm />
        <ChatLogger />
      </div>
      <InteractionList />
    </div>
  );
}

export default App;
