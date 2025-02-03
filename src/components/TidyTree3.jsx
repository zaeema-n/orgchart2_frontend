import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const TidyTree = ({ data }) => {
  const svgRef = useRef();
  const [treeData, setTreeData] = useState(null);

  useEffect(() => {
    if (!data) return;

    const width = 928
    // const width = 1000;
    //const width = window.innerWidth;  // Full screen width
    //const height = window.innerHeight; // Full screen height
    //const width = window.innerWidth;
    const marginTop = 10;
    // marginRight = 10
    const marginRight = 10;
    const marginBottom = 10;
    const marginLeft = 100;
    const dx = 10;
    const root = d3.hierarchy(data);

    // Calculate dy based on the tree height and available width
    const dy = (width - marginRight - marginLeft) / (1 + root.height);
    // Dynamically adjust spacing
    //const dx = Math.max(40, height / (root.descendants().length + 2)); // Adjust vertical spacing
    //const dy = Math.max(80, width / (root.height + 2)); // Adjust horizontal spacing

    // Tree layout with nodeSize
    const tree = d3.tree().nodeSize([dx, dy]);
    //const tree = d3.tree().size([height - marginTop - marginBottom, width - marginLeft - marginRight]);
    const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", dx)
      .attr("viewBox", [-marginLeft, -marginTop, width, dx])
      //.attr("viewBox", [-marginLeft, -marginTop, width, height]) // Full screen
      //.attr("viewBox", [-marginLeft, -height / 2, width, height]) // Centers the tree

      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; user-select: none;");

    const gLink = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

    const gNode = svg.append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

    // Update function to transition nodes and links
    function update(event, source) {
      const duration = event?.altKey ? 2500 : 250; // Adjust transition speed based on alt key
      const nodes = root.descendants().reverse();
      const links = root.links();

      // Compute the new tree layout
      tree(root);

      let left = root;
      let right = root;
      root.eachBefore(node => {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
      });

      const height = right.x - left.x + marginTop + marginBottom;
      //const height = Math.max(900, right.x - left.x + marginTop + marginBottom);


      const transition = svg.transition()
        .duration(duration)
        .attr("height", height)
        .attr("viewBox", [-marginLeft, left.x - marginTop, width, height])
        .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));

      // Update the nodes…
      const node = gNode.selectAll("g")
        .data(nodes, d => d.id);

      // Enter new nodes
      const nodeEnter = node.enter().append("g")
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .on("click", (event, d) => {
          d.children = d.children ? null : d._children;
          update(event, d); // Re-render on click
        });

      nodeEnter.append("circle")
        .attr("r", 2.5)
        .attr("fill", d => d._children ? "#555" : "#999")
        .attr("stroke-width", 10);

      nodeEnter.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d._children ? -6 : 6)
        .attr("text-anchor", d => d._children ? "end" : "start")
        .text(d => d.data.name)
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .attr("stroke", "white")
        .attr("paint-order", "stroke");

      // Transition nodes to new position
      const nodeUpdate = node.merge(nodeEnter).transition(transition)
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

      // Transition exiting nodes
      const nodeExit = node.exit().transition(transition).remove()
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

      // Update the links…
      const link = gLink.selectAll("path")
        .data(links, d => d.target.id);

      // Enter new links
      const linkEnter = link.enter().append("path")
        .attr("d", d => {
          const o = { x: source.x0, y: source.y0 };
          return diagonal({ source: o, target: o });
        });

      // Transition links to new position
      link.merge(linkEnter).transition(transition)
        .attr("d", diagonal);

      // Transition exiting links
      link.exit().transition(transition).remove()
        .attr("d", d => {
          const o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o });
        });

      // Store old positions for transition
      root.eachBefore(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    // Initialize the tree layout
    root.x0 = dy / 2;
    root.y0 = 0;
    root.descendants().forEach((d, i) => {
      d.id = i;
      d._children = d.children;
      if (d.depth && d.data.name.length !== 7) d.children = null; // Example logic to collapse nodes
    });

    update(null, root);

  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default TidyTree;
