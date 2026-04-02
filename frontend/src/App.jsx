import AiAssistantPanel from "./components/AiAssistantPanel";
import InteractionDetailsForm from "./components/InteractionDetailsForm";
import InteractionList from "./components/InteractionList";

function App() {
  return (
    <div className="app-shell">
      <header className="page-header">
        <h1 className="page-header__title">Log HCP Interaction</h1>
      </header>

      <div className="layout-two-col">
        <InteractionDetailsForm />
        <AiAssistantPanel />
      </div>

      <InteractionList />
    </div>
  );
}

export default App;
