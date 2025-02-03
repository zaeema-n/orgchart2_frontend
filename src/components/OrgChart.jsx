import React from "react";
import {Tree} from "react-tree-graph";
import "react-tree-graph/dist/style.css";

const OrgChart = ({ data }) => {
  if (!data) return <p>Loading...</p>;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <Tree 
        data={data} 
        height={1000} 
        width={1000} 
        svgProps={{ className: "custom" }} 
      />
    </div>
  );
};

export default OrgChart;
