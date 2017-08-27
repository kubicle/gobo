import { Vertex, Color } from './Vertex';


class LogicalBoard {
	vertexes: Vertex[][];

	public constructor(public gobanSize: number) {
		this.vertexes = new Array(gobanSize);
		for (let j = 0; j < gobanSize; j++) {
			this.vertexes[j] = new Array(gobanSize);
			for (let i = 0; i < gobanSize; i++) {
				this.vertexes[j][i] = new Vertex();
			}
		}
	}

	public getVertexAt(i:number, j:number) :Vertex {
		let vertex = this.vertexes[j][i];
		if (!vertex) throw new Error('Invalid coordinates: ' + i + ',' + j);
		return vertex;
	}

	public clearVertexAt(i:number, j:number) :void {
		this.getVertexAt(i, j).clear();
	}

	public setStoneAt(i:number, j:number, color:Color) :void {
		this.getVertexAt(i, j).setStone(color);
	}

	public setLabelAt(i:number, j:number, label:string, style?:string) :void {
		let vertex = this.getVertexAt(i, j);
		vertex.setLabel(label);
		if (style) vertex.setStyle(style);
	}

	public setMarkAt(i:number, j:number, mark:string) :void {
		this.getVertexAt(i, j).setMark(mark);
	}
}

export { LogicalBoard };
