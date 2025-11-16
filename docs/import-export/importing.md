To import a file in sqlite (in our case) you would run one of the following:

If you want to import all scenarios and clear old loaded scenarios

```SQL
.save ehr_sim.db
ATTACH DATABASE '/Users/<your_user>/<path-to-current-terminal>/ehr_sim.db' AS source;
DELETE FROM scenarios;
DELETE FROM scenario_tabs;
INSERT INTO main.scenarios SELECT * FROM source.scenarios;
INSERT INTO main.scenario_tabs SELECT * FROM source.scenario_tabs;
```

If you want to add imported scenarios with new auto-generated IDs (handles duplicates)

```SQL
.save ehr_sim.db
ATTACH DATABASE '/Users/<your_user>/<path-to-current-terminal>/ehr_sim.db' AS source;

-- Insert scenarios with new auto-generated IDs (exclude id column)
INSERT INTO main.scenarios (name, definition)
SELECT name, definition FROM source.scenarios;

-- Insert scenario_tabs by matching scenario names and definitions to get new IDs
INSERT INTO main.scenario_tabs (scenarioId, name, content, orderIndex)
SELECT m.id, st.name, st.content, st.orderIndex
FROM source.scenario_tabs st
JOIN source.scenarios s ON st.scenarioId = s.id
JOIN main.scenarios m ON s.name = m.name AND s.definition = m.definition;
```
