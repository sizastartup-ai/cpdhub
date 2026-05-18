'use client';

import React, { useEffect, useState } from 'react';

const NetworkBackground = () => {
  const [nodes, setNodes] = useState<{ id: number; x: number; y: number; dx: number; dy: number; duration: number }[]>([]);

  useEffect(() => {
    const nodeCount = 30;
    const newNodes = Array.from({ length: nodeCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      dx: (Math.random() - 0.5) * 10,
      dy: (Math.random() - 0.5) * 10,
      duration: 3 + Math.random() * 5,
    }));
    setNodes(newNodes);
  }, []);

  return (
    <div className="network-container">
      {nodes.map((node) => (
        <div
          key={node.id}
          className="node"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            '--x': `${node.dx}px`,
            '--y': `${node.dy}px`,
            '--duration': `${node.duration}s`,
          } as React.CSSProperties}
        />
      ))}
      {/* Static lines for visual complexity without heavy JS calculations */}
      <div className="line" style={{ top: '20%', left: '10%', width: '30%', transform: 'rotate(15deg)' }} />
      <div className="line" style={{ top: '40%', left: '60%', width: '25%', transform: 'rotate(-25deg)' }} />
      <div className="line" style={{ top: '70%', left: '30%', width: '40%', transform: 'rotate(10deg)' }} />
      <div className="line" style={{ top: '15%', left: '70%', width: '20%', transform: 'rotate(45deg)' }} />
      <div className="line" style={{ top: '85%', left: '15%', width: '35%', transform: 'rotate(-5deg)' }} />
    </div>
  );
};

export default NetworkBackground;
