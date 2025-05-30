import { ancillaConstructColor, quantumConstructColor } from '@/constants';
import { Handle, Position } from 'reactflow';
import React from 'react';

export default function UncomputePort({ node, edges, index }) {
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
          id={`quantumHandle${node.type}Uncompute${index}${node.id}`}
          position={Position.Right}
          className={`z-20 circle-port-out !bg-green-100 !border-black absolute`}
          isValidConnection={() => true}
          isConnectable={edges.filter(
            (edge) => edge.sourceHandle === `quantumHandleUncomputeStatePreparation${node.id}`
          ).length < 1}
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