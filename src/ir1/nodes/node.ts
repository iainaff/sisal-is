import * as AST from "../../ast";
import * as GML from "../../graphml/";
import { Port } from "../ports/port";

export class Node {
  private static lastId: number = 0;

  public name: string;
  public location: string;
  public outPorts: Port[];
  public inPorts: Port[];
  public siblings: Node[];
  public id: string;

  constructor(name: string, ast?: AST.Node) {
    Node.lastId++;

    this.name = name;
    if (ast && ast.location) {
      const locString = (position: AST.Position) => {
        return String(position.line) + ":" + String(position.column);
      };
      this.location = locString(ast.location.start) + "-" +
                      locString(ast.location.end);
    } else {
      this.location = "not applicable";
    }
    this.outPorts = [];
    this.inPorts = [];
    this.siblings = [];
    this.id = "node" + String(Node.lastId);
  }

  public requestPorts(portNum: number): number {
    return this.outPorts.length;
  }

  public graphML(): string {
    return this.graphMLInternal("");
  }

  public getInEdges(): Array<[Node, number]> {
    const edges: Array<[Node, number]> = [];
    for (const node of this.siblings) {
      edges.push([node, 0]);
    }
    return edges;
  }

  protected addInPorts(nodes: Node[]): void {
    for (const node of nodes) {
      if (node.requestPorts(1) !== 1) {
        throw new Error("Each part should produce exactly one output");
      }
      this.siblings.push(node);
      this.inPorts.push(node.outPorts[0]);
    }
  }

  protected graphMLInternal(subGraph: string): string {
    return GML.makeNode(this.id, this.name, this.location, this.inPorts.length, this.outPorts.length, subGraph);
  }
}

export function subGraphML(nodes: Node[]): string {
  const component = new Map<string, Node>();
  const edges = new Array<[string, number, string, number, Port]>();

  let nextNodes = nodes;
  while (nextNodes.length > 0) {
    const newNextNodes = new Array<Node>();
    for (const node of nextNodes) {
      if (component.has(node.id)) {
        continue;
      }

      component.set(node.id, node);
      const nodeEdges = node.getInEdges();
      for (let i = 0; i < nodeEdges.length; i++) {
        edges.push([nodeEdges[i][0].id, nodeEdges[i][1], node.id, i, nodeEdges[i][0].outPorts[0]]);
        if (!component.has(nodeEdges[i][0].id)) {
          newNextNodes.push(nodeEdges[i][0]);
        }
      }
    }
    nextNodes = newNextNodes;
  }

  return Array.from(component.values(), (c) => c.graphML()).join("") +
         edges.map((e) => GML.makeEdge(e[0], e[1], e[2], e[3], e[4])).join("");
}
