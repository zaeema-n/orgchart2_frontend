import React, { useState } from 'react';
import Tree from 'react-tree-graph';

const OrgChartTree = ({ data }) => {
  const [treeData, setTreeData] = useState(data);

  const handleClick = (node) => {
    // Toggle the collapsed state of the node
    node.collapsed = !node.collapsed;
    // Update the tree data to trigger a re-render
    setTreeData({ ...treeData });
  };

  const renderTree = (node) => {
    if (node.collapsed) {
      return { ...node, children: [] }; // Hide children if collapsed
    }
    return {
      ...node,
      children: node.children ? node.children.map(renderTree) : [],
    };
  };

  return (
    <div style={{ width: '100%', height: '100vh', textAlign: 'center', overflow: 'auto' }}>
      <Tree
        data={renderTree(treeData)}
        height={window.innerHeight * 0.8}
        width={window.innerWidth * 0.8}
        svgProps={{
          transform: 'rotate(90)', // Make the tree horizontal
        }}
        textProps={{
          x: -10, // Adjust text position for horizontal layout
          y: 5,
          transform: 'rotate(-90)', // Rotate text back to horizontal
        }}
        animated
        onClick={handleClick}
      />
    </div>
  );
};

export default OrgChartTree;