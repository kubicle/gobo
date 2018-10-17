import { Vertex, Color } from './Vertex';
import { LogicalBoard } from './LogicalBoard';
import { BoardRenderer } from './BoardRenderer';


class Gobo {
	board: LogicalBoard;
	renderer: BoardRenderer;
	public canvas: HTMLCanvasElement;

	constructor(options:{
		gobanSize?:number,
		widthPx:number,
		heightPx?:number,
		marginPx?:number,
		isSketch?:boolean,
		noCoords?:boolean,
		backgroundCanvas?:HTMLCanvasElement,
		background?:string,
		patternSeed?:number,
		pixelRatio?:number
	}) {
		this.board = new LogicalBoard(options.gobanSize || 19);
		this.renderer = new BoardRenderer(options);
		this.canvas = this.renderer.prepare(this.board);
	}

	public resize(widthPx:number, heightPx?: number) {
		this.renderer.resizeBoard(widthPx, heightPx);
	}

	public render() {
		this.renderer.renderAll();
	}

	public setStoneAt(i:number, j:number, color:Color) {
		this.board.setStone(i, j, color);
	}

	public clearVertexAt(i:number, j:number) {
		this.board.clearVertex(i, j);
	}

	public getStoneColorAt(i:number, j:number) :Color {
		return this.board.getVertex(i, j).stoneColor;
	}

	public setLabelAt(i:number, j:number, label:string, style?:string) {
		this.board.setLabel(i, j, label, style);
	}

	public setMarkAt(i:number, j:number, mark:string) {
		this.board.setMark(i, j, mark);
	}

	// Converts canvas to Gobo coordinates
	public pixelToGridCoordinates(x:number, y:number) :number[] {
		return this.renderer.pixelToGridCoords(x, y);
	}
}

export { Gobo };
