import React, { useEffect, useState } from "react";
import Neo4j from "neo4j-driver";
import TidyTree from "./components/TidyTree"; // Import the new component
import HorizontalTimeline from "./components/HorizontalTimeline";
import EventSlider from "./components/EventSlider";

// Neo4j connection settings
const uri = "bolt://localhost:7687"; // Change this to match your setup
const user = "neo4j";
const password = "orgchart";

const fetchData = async () => {
  const driver = Neo4j.driver(uri, Neo4j.auth.basic(user, password));
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (g:government)-[r:HAS_MINISTER]->(m:minister)-[y:HAS_DEPARTMENT]->(d:department)
      WHERE (r.start_date <= date("2015-09-21") AND (r.end_date IS NULL OR r.end_date >= date("2015-09-21")))
        AND (y.start_date <= date("2015-09-21") AND (y.end_date IS NULL OR y.end_date >= date("2015-09-21")))
      RETURN g, r, m, y, d`
    );

    const graph = { name: "Government", children: [] };
    const ministersMap = new Map();

    result.records.forEach((record) => {
      const minister = record.get("m").properties.name;
      const department = record.get("d").properties.name;

      if (!ministersMap.has(minister)) {
        ministersMap.set(minister, { name: minister, children: [] });
        graph.children.push(ministersMap.get(minister));
      }
      ministersMap.get(minister).children.push({ name: department });
    });

    return graph;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  } finally {
    session.close();
  }
};

const App = () => {
  const [treeData, setTreeData] = useState(null);

  useEffect(() => {
    fetchData().then(setTreeData);
  }, []);

  // Example timeline data, replace with dynamic data if needed
  const timelineData = [
    { date: "2010", event: "Event 1" },
    { date: "2015", event: "Event 2" },
    { date: "2020", event: "Event 3" },
  ];

  return (
    <div>
      <h2>Organization Chart</h2>
      {/* <HorizontalTimeline data={timelineData} /> */}
      <EventSlider data={timelineData} />
      {treeData ? <TidyTree data={treeData} containerId="tree1" /> : <p>Loading...</p>}
    </div>
  );
};

export default App;
