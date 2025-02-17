import React, { useEffect, useState } from "react";
import Neo4j from "neo4j-driver";
import TidyTree from "./components/TidyTree"; // Import the new component
import EventSlider from "./components/EventSlider";
import { ErrorBoundary } from "react-error-boundary";

// Neo4j connection settings
const uri = import.meta.env.VITE_NEO4J_ORGCHART_DB_URI
const user = import.meta.env.VITE_NEO4J_ORGCHART_USERNAME
const password = import.meta.env.VITE_NEO4J_ORGCHART_PASSWORD

// Validate Neo4j connection settings
if (!uri || !user || !password) {
  throw new Error(
    'Missing Neo4j connection settings. Please ensure VITE_NEO4J_ORGCHART_DB_URI, ' +
    'VITE_NEO4J_ORGCHART_USERNAME, and VITE_NEO4J_ORGCHART_PASSWORD environment variables are set.'
  );
}

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
  const [isTreeDataLoading, setIsTreeDataLoading] = useState(true);
  const [gazetteDates, setGazetteDates] = useState([]);
  const [allData, setAllData] = useState({});

  useEffect(() => {
    const initializeApp = async () => {
      if (gazetteDates.length === 0) {
        const dates = await fetchGazetteDates();
        setGazetteDates(dates);
  
        if (dates.length > 0) {
          const latestDate = dates[dates.length - 1];
          const initialData = await fetchDataForAllDates([latestDate]);
          setAllData(initialData);
          setTreeData(initialData[latestDate]);
          setIsTreeDataLoading(false);
        }
      }
    };
  
    initializeApp();
  }, []); 

  const handleDateChange = async (date) => {
    setIsTreeDataLoading(true);
    if (!allData[date]) {
      console.log(`App.jsx: Fetching data for ${date}`);
      console.log("allData");
      console.log(allData);
      const newData = await fetchDataForAllDates([date]);
      console.log("newData");
      console.log(newData);
      setAllData(prevData => ({
        ...prevData,
        [date]: newData[date]
      }));
      setTreeData(newData[date]);
    } else {
      console.log("allData[date]");
      console.log(date);
      console.log(allData[date]);
      setTreeData(allData[date]);
    }
    setIsTreeDataLoading(false);
  };

  const timelineData = gazetteDates.map((date) => ({
    date,
    event: `OrgChart at ${date}`,
  }));

  return (
    <ErrorBoundary>
      <div style={{ 
        position: 'fixed',  // Fixed position relative to viewport
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          height: '50px',
          padding: '10px 20px',
          backgroundColor: '#1e1e1e',
          borderBottom: '1px solid #333',
          flexShrink: 0
        }}>
          <h2 style={{ margin: 0 }}>Organization Chart</h2>
        </div>
        
        {/* Fixed Slider Section */}
        <div style={{ 
          height: '120px',           // Fixed height
          backgroundColor: '#1e1e1e',
          borderBottom: '1px solid #333',
          padding: '20px',
          position: 'relative',      // For proper rendering
          flexShrink: 0,            // Prevent shrinking
          width: '100%',            // Full width
          display: 'flex',
          alignItems: 'center'      // Center slider vertically
        }}>
          <ErrorBoundary>
            {gazetteDates.length > 0 && (
              <EventSlider
                data={timelineData}
                onSelectDate={handleDateChange}
              />
            )}
          </ErrorBoundary>
        </div>

        {/* Scrollable Tree Section */}
        <div style={{ 
          flex: 1,                  // Take remaining space
          backgroundColor: '#1e1e1e',
          overflow: 'auto',         // Enable scrolling
          padding: '20px',
          position: 'relative'      // For proper rendering
        }}>
          <ErrorBoundary>
            {isTreeDataLoading ? (
              <p>Loading...</p>
            ) : (
              <TidyTree data={treeData} />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
