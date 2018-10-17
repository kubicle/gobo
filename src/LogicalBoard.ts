import { Vertex, Color } from './Vertex';


class LogicalBoard {
	vertexes: Vertex[][];

	public constructor(public boardSize: number) {
		this.vertexes = new Array(boardSize);
		for (let j = 0; j < boardSize; j++) {
			this.vertexes[j] = new Array(boardSize);
			for (let i = 0; i < boardSize; i++) {
				this.vertexes[j][i] = new Vertex();
			}
		}
	}

	public getVertex(i:number, j:number) :Vertex {
		let vertex = this.vertexes[j][i];
		if (!vertex) throw new Error('Invalid coordinates: ' + i + ',' + j);
		return vertex;
	}

	public clearVertex(i:number, j:number) :void {
		this.getVertex(i, j).clearVertex();
	}

	public setStone(i:number, j:number, color:Color) :void {
		this.getVertex(i, j).setStone(color);
	}

	public setLabel(i:number, j:number, label:string, style?:string) :void {
		let vertex = this.getVertex(i, j);
		vertex.setLabel(label);
		if (style) vertex.setStyle(style);
	}

	public setMark(i:number, j:number, mark:string) :void {
		this.getVertex(i, j).setMark(mark);
	}
}

export { LogicalBoard };
