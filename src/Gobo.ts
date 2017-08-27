import { Vertex, Color } from './Vertex';
import { LogicalBoard } from './LogicalBoard';
import { BoardRenderer } from './BoardRenderer';


class Gobo {
	board: LogicalBoard;
	renderer: BoardRenderer;
	parent: HTMLElement;

	constructor(parent:HTMLElement, options:any) {
		this.parent = parent;
		parent.textContent = '';
 		options.widthPx = options.widthPx || parent.clientWidth;

		this.board = new LogicalBoard(options.gobanSize || 19);

		this.renderer = new BoardRenderer(options);
	}

	public prepareRenderer(cb: (err:Error, canvas:HTMLCanvasElement) => void) {
		var self = this;
		this.renderer.prepare(this.board, function () {
			let canvas = self.renderer.getCanvas();
			self.parent.appendChild(canvas);
			cb(null, canvas);
		});
	}

	public render() {
		this.renderer.render();
	}

	public setStoneAt(i:number, j:number, color:Color) {
		this.board.setStoneAt(i, j, color);
	}

	public clearVertexAt(i:number, j:number) {
		this.board.clearVertexAt(i, j);
	}

	public getStoneColorAt(i:number, j:number) :Color {
		return this.board.getVertexAt(i, j).stoneColor;
	}

	public setLabelAt(i:number, j:number, label:string, style?:string) {
		this.board.setLabelAt(i, j, label, style);
	}

	public setMarkAt(i:number, j:number, mark:string) {
		this.board.setMarkAt(i, j, mark);
	}

	// Converts canvas to Gobo coordinates
	public pixelToGridCoordinates(x:number, y:number) :number[] {
		return this.renderer.pixelToGridCoordinates(x, y);
	}
}

export { Gobo };
