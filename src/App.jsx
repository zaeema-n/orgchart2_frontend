import React, { useEffect, useState } from "react";
import Neo4j from "neo4j-driver";
import TidyTree from "./components/TidyTree"; // Import the new component
import EventSlider from "./components/EventSlider";

// Neo4j connection settings
const uri = "bolt://localhost:7687"; // Change this to match your setup
const user = "neo4j";
const password = "orgchart";

const driver = Neo4j.driver(uri, Neo4j.auth.basic(user, password));

// Function to fetch the dates from gazette_dates.txt
const fetchGazetteDates = async () => {
  try {
    const response = await fetch("/gazette_dates.txt"); // Assuming the file is in the public directory
    const data = await response.text();
    const dates = data
      .split("\n")
      .map((date) => date.trim())
      .filter((date) => date !== "");
    return dates;
  } catch (error) {
    console.error("Error fetching dates:", error);
    return [];
  }
};

// Function to fetch data for a given date (called once for all dates)
const fetchDataForAllDates = async (dates) => {
  const session = driver.session();
  const allData = {};

  try {
    // Loop through all dates to fetch the data for each date
    for (const selectedDate of dates) {

      if (allData[selectedDate]) {
        console.log(`App.jsx: Skipping fetch, data already exists for ${selectedDate}`);
        continue; // Move to the next date
      }
      
      const result = await session.run(
        `MATCH (g:government)-[r:HAS_MINISTER]->(m:minister)-[y:HAS_DEPARTMENT]->(d:department)
        WHERE (r.start_date <= date("${selectedDate}") AND (r.end_date IS NULL OR r.end_date > date("${selectedDate}")))
          AND (y.start_date <= date("${selectedDate}") AND (y.end_date IS NULL OR y.end_date > date("${selectedDate}")))
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

      allData[selectedDate] = graph;
      console.log(`App.jsx: Data fetched for ${selectedDate}`);
    }

    return allData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return {};
  } finally {
    await session.close();
  }
};

const App = () => {
  const [treeData, setTreeData] = useState(null);
  const [gazetteDates, setGazetteDates] = useState([]);
  const [allData, setAllData] = useState({}); // Store all data for each date

  useEffect(() => {
    const initializeApp = async () => {
      if (gazetteDates.length === 0) {
        const dates = await fetchGazetteDates();
        setGazetteDates(dates);
  
        if (dates.length > 0) {
          const allFetchedData = await fetchDataForAllDates(dates);
          setAllData(allFetchedData);
        }
      }
    };
  
    initializeApp();
  }, []); 

  const handleDateChange = (date) => {
    if (date && allData[date]) {
      setTreeData(allData[date]);
      console.log("App.jsx: Tree data changed and set for:", date);
    }
  };

  const timelineData = gazetteDates.map((date) => ({
    date,
    event: `OrgChart at ${date}`,
  }));

  return (
    <div>
      <h2>Organization Chart</h2>
      {/* <HorizontalTimeline data={timelineData} /> */}
      <EventSlider
        data={timelineData}
        onSelectDate={handleDateChange}
      />
      {treeData ? (
        <TidyTree
          data={treeData}
        />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default App;
