import ScenarioCard from "./ScenarioCard.jsx";

function ScenarioGrid({ scenarios, onSelect }) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    return null;
  }

  return (
    <div className="scenarios-grid">
      {scenarios.map((scenario) => (
        <ScenarioCard
          key={scenario.id}
          scenario={scenario}
          onSelect={() => onSelect?.(scenario.id)}
        />
      ))}
    </div>
  );
}

export default ScenarioGrid;
