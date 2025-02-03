import React, { useEffect, useState } from 'react';
import neo4j from 'neo4j-driver';
import OrgChartTree from './components/OrgChartTree';

const App = () => {
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const driver = neo4j.driver(
        'bolt://localhost:7687', // Replace with your Neo4j connection URI
        neo4j.auth.basic('neo4j', 'orgchart') // Replace with your Neo4j credentials
      );

      const session = driver.session();
      const query = `
        MATCH (g:government)-[r:HAS_MINISTER]->(m:minister)-[y:HAS_DEPARTMENT]->(d:department)
        WHERE (r.start_date <= date("2015-09-21") AND (r.end_date IS NULL OR r.end_date >= date("2015-09-21")))
        AND (y.start_date <= date("2015-09-21") AND (y.end_date IS NULL OR y.end_date >= date("2015-09-21")))
        RETURN g, r, m, y, d
      `;

      try {
        const result = await session.run(query);
        const data = result.records.map(record => ({
          government: record.get('g').properties,
          minister: record.get('m').properties,
          department: record.get('d').properties,
        }));
        setGraphData(formatData(data));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        await session.close();
        await driver.close();
      }
    };

    fetchData();
  }, []);

  const formatData = (data) => {
    const governmentNode = {
      name: data[0].government.name, // Replace 'name' with the actual property
      children: [],
    };

    data.forEach((item) => {
      const ministerNode = {
        name: item.minister.name, // Replace 'name' with the actual property
        children: [
          {
            name: item.department.name, // Replace 'name' with the actual property
            collapsed: true, // Departments start collapsed
          },
        ],
        collapsed: false, // Ministers start expanded
      };
      governmentNode.children.push(ministerNode);
    });

    return governmentNode;
  };

  if (!graphData) return <div>Loading...</div>;

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <h1 style={{ textAlign: 'center' }}>Government Organizational Chart</h1>
      <OrgChartTree data={graphData} />
    </div>
  );
};

export default App;