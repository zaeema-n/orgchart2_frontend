import React, { useEffect, useState } from "react";
import TidyTree from "./components/TidyTree"; // Import the new component
import EventSlider from "./components/EventSlider";
import { ErrorBoundary } from "react-error-boundary";

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
  const allData = {};

  try {
    // Loop through all dates to fetch the data for each date
    for (const selectedDate of dates) {

      if (allData[selectedDate]) {
        console.log(`App.jsx: Skipping fetch, data already exists for ${selectedDate}`);
        continue; // Move to the next date
      }
      
      // GraphQL Query
      const query = `
        query {
          govStrucByDate(date: "${selectedDate}") {
            name
            ministers {
              name
              departments {
                name
              }
            }
          }
        }
      `;
      
      const response = await fetch("http://127.0.0.1:5000/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const result = await response.json();

      if (!result.data || !result.data.govStrucByDate || result.data.govStrucByDate.length === 0) {
        console.warn(`No data returned for date ${selectedDate}`);
        allData[selectedDate] = null;
        continue;
      }

      // Extract the government structure data
      const govStructure = result.data.govStrucByDate[0];

      const graph = { name: govStructure.name, children: [] };
      const ministersMap = new Map();

      govStructure.ministers.forEach((minister) => {
        if (!ministersMap.has(minister.name)) {
          ministersMap.set(minister.name, { name: minister.name, children: [] });
          graph.children.push(ministersMap.get(minister.name));
        }

        minister.departments.forEach((department) => {
          ministersMap.get(minister.name).children.push({ name: department.name });
        });
      });


      allData[selectedDate] = graph;
      console.log(`Data fetched for ${selectedDate}`);
    }

    return allData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return {};
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
