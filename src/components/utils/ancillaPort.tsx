import { ancillaConstructColor, dirtyConstructColor } from '@/constants';
import { Handle, Position } from 'reactflow';
import { cn } from '@/lib/utils';

export default function AncillaPort({ node, edges, dirty, index }) {
  const displayText = dirty ? 'Dirty Ancilla' : 'Ancilla';

  const handleId = dirty
    ? `dirtyAncillaHandle${node.type}Ancilla${index}${node.id}`
    : `ancillaHandle${node.type}Ancilla${index}${node.id}`;

  const backgroundColor = dirty
    ? dirtyConstructColor
    : ancillaConstructColor;
  const isConnected = edges.some(edge => edge.sourceHandle === handleId);

  const handleClassName = cn(
    "z-10 circle-port-out absolute",
    isConnected ? "!bg-green-100 !border-black" : "!bg-gray-200 !border-dashed !border-black"
  );

  return (
    <div className="relative flex items-center justify-end overflow-visible mt-1">
      <div
        className="relative p-2"
        style={{
          width: '180px',
        }}
      >
        <div
          className="absolute inset-0 ancilla-output"
          style={{
            backgroundColor: backgroundColor,
          }}
        />
        <div className="w-full text-left text-sm text-black relative z-10" style={{ paddingLeft: '15px' }}>
          {displayText}
        </div>

        <Handle
          type="source"
          id={handleId}
          position={Position.Right}
          className={handleClassName}
          isValidConnection={() => true}
          isConnectable={true}
          style={{
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)'
          }}
          isConnectableEnd={false}
        />
      </div>
    </div>
  );
}