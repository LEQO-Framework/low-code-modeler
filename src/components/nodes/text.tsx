import { useStore } from "@/config/store";
import { cn } from "@/lib/utils";
import React, { memo } from "react";
import { Edge, Handle, Node, Position, getConnectedEdges } from "reactflow";
import { shallow } from "zustand/shallow";
import { IPortData } from "./model";

const selector = (state: { edges: Edge[] }) => ({
  edges: state.edges,
});

export const TextNode = memo((node: Node) => {
  const [sourceConnectable, setSourceConnectable] = React.useState(true);
  const { data, selected, id } = node;
  const { edges } = useStore(selector, shallow);
  const alledges = getConnectedEdges([node], edges);

  React.useEffect(() => {
    alledges.forEach((edge) => {
      if (edge.source === id) {
        setSourceConnectable(false);
        return;
      }
    });
  }, [alledges, id]);

  return (
    <div className={cn(
       "w-[220px] h-[100px] rounded-[50px] bg-gray-300 flex flex-col items-center justify-center shadow-lg transition-all duration-200 px-4",
        selected && "border-2 border-blue-500")}
      //className={cn(
       // "bg-white border-[1px] shadow-xl border-transparent rounded-2xl min-w-[220px] text-start p-3 transition-all duration-200",
        //selected && "border-blue-500"
        //"bg-white border-[1px] shadow-2xl border-transparent rounded-md min-w-[200px] text-start",
        //selected && "border-blue-500",
        
      //)
      
    >
      <span className="py-1 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 block rounded-t-md">
        Send Message
      </span>
      <div className="py-2 px-3 min-h-[32px]">
        <p className="text-xs whitespace-pre-wrap">{data.label}</p>
      </div>
      <div className="custom-node-port-in">{"Inputs"}</div>
        {data.inputs.map((input: IPortData) => (
          <div
            className="custom-node-port custom-node-port-in"
            key={"i-" + input.id}
          >
            {input.label}
            <div className={``}>
              <Handle
                type="target"
                id={input.id}
                position={Position.Left}
                className="circle-port circle-port-left"
                isValidConnection={(connection) =>
                  {return true;}
                }
              />
            </div>
          </div>
          
        ))}

    </div>
  );
});
