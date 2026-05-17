import { Edge, Elements } from "react-flow-renderer";

export type TypePortData = "input" | "output" | "create";
export interface IPortData {
  label: string;
  id: string;
  typePort: TypePortData;
  node_id?: string;
  type?: "string" | "file" | "number";
}
export enum NodeType {
  nodeCustom = "nodeCustom",
  nodeRecipe = "nodeRecipe",
  default = "default"
}

export enum CreateDataFieldPort {
  inputs = "inputs",
  outputs = "outputs"
}

export enum EdgeType {
  buttonedge = "buttonedge"
}

export enum RecipeCreaterPort {
  recipeOut = "recipe-create-out",
  recipeIn = "recipe-create-in"
}
//Есть уже 3 interface для наслед. в либе
export interface INodeCustom {
  id: string;
  type: NodeType;
  data: INodeCustomData;
  position: { x: number; y: number };
}

export interface INodeCustomData {
  name: string;
  inputs: IPortData[];
  outputs: IPortData[];
  isCreateNode?: boolean;
  [key: string]: any;
}

export interface IOffset {
  x: number;
  y: number;
}
//Есть уже 3 interface для наслед. в либе
export interface ICustomLink extends Edge {}

export interface IcreateDynamicPort {
  nodeList: Elements;
  sourceIDS: string[];
  field: CreateDataFieldPort;
  targetIDS: string[];
  isPortOut: boolean;
  dataLink?: any;
}

export enum PipeType {
  input = "input",
  output = "output",
  pipe = "pipe"
}
