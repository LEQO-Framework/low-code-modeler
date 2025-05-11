import { Handle, Position } from 'reactflow';

export default function UncomputePort({ node, edges }) {
  return (
    <div className="relative flex items-center justify-end space-x-0 overflow-visible mt-1">
      <div
        className="flex flex-col items-end space-y-1 relative p-2"
        style={{
          backgroundColor: 'rgba(105, 145, 210, 0.2)',
          width: '180px',
        }}
      >
        <div className="w-full text-left text-sm text-black">Uncompute</div>

        <div className="flex items-center justify-between w-full space-x-2">
          <Handle
            type="source"
            id={`quantumHandle${node.type}Uncompute0${node.id}`}
            position={Position.Right}
            className="z-10 circle-port-out !bg-blue-300 !border-black"
            isValidConnection={() => true}
            isConnectable={edges.filter(edge =>
              edge.sourceHandle === `quantumHandleUncomputeStatePreparation${node.id}`
            ).length < 1}
            style={{
              top: '50%',
              transform: 'translateY(-50%)'
            }}
            isConnectableEnd={false}
          />
        </div>
      </div>
    </div>
  );
}
