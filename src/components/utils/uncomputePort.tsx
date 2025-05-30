import { ancillaConstructColor, quantumConstructColor } from '@/constants';
import { Handle, Position } from 'reactflow';
import React from 'react';
import { cn } from '@/lib/utils';

export default function UncomputePort({ node, edges, index }) {
  const handleId = `quantumHandle${node.type}Uncompute${index}${node.id}`;
  const isConnected = edges.some(edge => edge.sourceHandle === handleId);

  const handleClassName = cn(
    `z-20 circle-port-out absolute`,
    isConnected ? "!bg-green-100 !border-black" : "!bg-gray-200 !border-dashed !border-black"
  );

  return (
    <div className="relative flex items-center justify-end space-x-0 overflow-visible mt-1">
      <div
        className="relative p-2"
        style={{
          width: '180px',
        }}
      >
        <div
          className="absolute inset-0 custom-shape"
          style={{
            backgroundColor: ancillaConstructColor,
          }}
        />
        <div className="w-full text-left text-sm text-black relative z-10" style={{ paddingLeft: '15px' }}>Uncompute</div>

        <Handle
          type="source"
          id={handleId}
          position={Position.Right}
          className={handleClassName}
          isValidConnection={() => true}
          isConnectable={true}
          style={{
            top: '50%',
            right: '0px',
            transform: 'translateY(-50%) rotate(45deg)'
          }}
          isConnectableEnd={false}
        />
      </div>
    </div>
  );
}