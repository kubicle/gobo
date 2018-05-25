import { LogicalBoard } from './LogicalBoard';
import { Vertex, Color } from './Vertex';
import { paintCanvas } from './wood.js';
import { setRandomSeed, pseudoRandom } from './cheapSeed';


const starPoints:{[index:number] : [number,number][]} = {
	9:  [[5,5]],
	13: [[4,4],[10,4],[4,10],[10,10]],
	19: [[4,4],[10,4],[16,4],[4,10],[10,10],[16,10],[4,16],[10,16],[16,16]]
};

const DEFAULT_BACKGROUND_COLOR = '#c75';
const DEFAULT_MARGIN_PX = 5;
const MAX_COORD_FONTSIZE_PX = 10; // NB: coordinates have no minimum since they must align with the grid
const MIN_FONTSIZE_PX = 12;
const THIN_CHAR_REGEXP = /[.,:;|`'!]/g;
const DIST_SHADOW = 0.25; // px * stone radius

const SLATE_STONE_COUNT = 11;

// Shell stones need much more randomness to look natural to human eye.
// We use 9x9 grids that we "apply" on the board with a chessboard-like pattern: 1212 on row #1, then 2121 on row #2 etc.
// A more complex algorithm is needed if we want to use more grids - or if we want to spread stones without using grids.
const SHELL_3x3GRID_COUNT = 2;
const SHELL_LINES = [
	[0.10, 0.09, 0.08, 0.07, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06],
	[0.10, 0.12, 0.11, 0.10, 0.09, 0.09, 0.09, 0.09],
	[0.12, 0.14, 0.13, 0.12, 0.12, 0.12]
];
const SHELL_LINE_ALPHA_MIN = 0; // 0.2 make the line quite "grey"; 0.05 makes it very light
const SHELL_LINE_ALPHA_MAX = 0.15;


class BoardRenderer {
	logicalBoard: LogicalBoard;

	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	pixelRatio: number;
	width: number;
	height: number;
	gobanSize: number;
	isSketch: boolean;

	gridMargin: number;
	gridExtraMargin: number;
	patternSeed: number; // as provided in options
	background: string; // as provided in options
	backgroundColor: string;
	backgroundCanvas: HTMLCanvasElement;
	fontSize: number;
	coordFontSize: number;
	withCoords: boolean;

	vertexSize: number;
	vertexLeft: number;
	vertexTop: number;
	vertexRight: number;
	vertexBottom: number;

	stoneRadius: number;
	markSize: number;

	slateStones: HTMLCanvasElement[];
	shellStones: HTMLCanvasElement[];
	stoneShadow: HTMLCanvasElement;
	miniShell: HTMLCanvasElement;
	miniSlate: HTMLCanvasElement;
	shellPatternIndexes: [number,number][]; // indexes are coordinates as j,i
	slatePatternIndexes: [number,number][];

	public constructor(options:{
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
		this.pixelRatio = Math.max(1, options.pixelRatio || 1);
		this.width = options.widthPx * this.pixelRatio;
		this.height = (options.heightPx || options.widthPx) * this.pixelRatio;
		if (!options.widthPx) {
			console.error('Invalid gobo widthPx: ' + options.widthPx);
			this.width = this.height = 100;
		}

		this.isSketch = !!options.isSketch;
		this.withCoords = !options.noCoords;
		this.gridExtraMargin = (options.marginPx || DEFAULT_MARGIN_PX) * this.pixelRatio;

		this.backgroundCanvas = options.backgroundCanvas;
		this.background = options.background;
		this.patternSeed = options.patternSeed || Math.random();
	}

	public prepare(logicalBoard:LogicalBoard) :HTMLCanvasElement {
		this.logicalBoard = logicalBoard;
		this.computeDimensions();

		if (!this.isSketch) {
			setRandomSeed(this.patternSeed);
			this.prepareStonePatterns();
		}
		setRandomSeed(this.patternSeed);
		this.createMainCanvas();
		this.prepareBackground();

		return this.canvas;
	}

	public render() {
		this.drawBackground();
		this.drawGrid();
		this.drawStarPoints();
		if (this.withCoords) this.drawCoordinates();
		this.drawAllObjects();
	}

	public getCanvas() {
		return this.canvas;
	}

	private createMainCanvas() {
		this.canvas = this.createCanvas(this.width, this.height);
		this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'middle';
	}

	private createCanvas(width:number, height:number) {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		this.ctx = canvas.getContext('2d');
		return canvas;
	}

	private computeDimensions() {
		const squareSize = Math.min(this.width, this.height);
		this.gobanSize = this.logicalBoard.gobanSize;

		if (this.withCoords) {
			this.vertexSize = (squareSize - 2 * this.gridExtraMargin) / (this.gobanSize + 2);
			if (this.vertexSize > MAX_COORD_FONTSIZE_PX * this.pixelRatio) {
				this.coordFontSize = MAX_COORD_FONTSIZE_PX * this.pixelRatio;
				this.vertexSize = (squareSize - 2 * this.gridExtraMargin - 2 * this.coordFontSize) / this.gobanSize;
			} else {
				this.coordFontSize = this.vertexSize;
			}
			this.gridMargin = this.gridExtraMargin + this.coordFontSize;
		} else {
			this.vertexSize = (squareSize - 2 * this.gridExtraMargin) / this.gobanSize;
			this.gridMargin = this.gridExtraMargin;
		}

		this.stoneRadius = this.vertexSize / 2;
		this.markSize = this.vertexSize * 0.55;
		this.fontSize = this.vertexSize * 0.8;

		this.vertexLeft = Math.round(this.gridMargin + this.vertexSize / 2 + (this.width - squareSize) / 2);
		this.vertexTop = Math.round(this.gridMargin + this.vertexSize / 2 + (this.height - squareSize) / 2);
		this.vertexBottom = this.vertexTop + (this.gobanSize - 1) * this.vertexSize;
		this.vertexRight = this.vertexLeft + (this.gobanSize - 1) * this.vertexSize;
	}

	/**
	 * Converts coordinates from pixels to grid
	 * @param x - origin 0,0 is top-left corner of the canvas
	 * @param y
	 * @returns [i, j] - with 0,0 as bottom-left corner of the grid
	 */
	public pixelToGridCoordinates(x:number, y:number) :[number,number] {
    	const i = Math.round((x - this.vertexLeft) / this.vertexSize);
    	const j = Math.round((this.vertexBottom - y) / this.vertexSize);
		return [i, j];
	}

	private prepareBackground() {
		if (this.backgroundCanvas) return;

		if (!this.background) {
			this.backgroundColor = DEFAULT_BACKGROUND_COLOR;
		} else if (this.background[0] === '#' || this.background.substr(0, 3).toLowerCase() === 'rgb') {
			this.backgroundColor = this.background;
		} else if (this.background === 'wood') {
			if (this.isSketch || this.backgroundCanvas) return; // ignore if canvas is passed or sketch mode
			var canvas = this.backgroundCanvas = document.createElement('canvas');
			canvas.width = canvas.height = 200 * this.pixelRatio;
			paintCanvas(canvas);
		}
	}

	private prepareStonePatterns() {
		const size = this.vertexSize;
		const center = size / 2;

		this.stoneShadow = this.createCanvas(size, size);
		this.drawStoneShadow(center, center);

		this.slateStones = [];
		for (let i = SLATE_STONE_COUNT - 1; i >= 0; i--) {
			this.slateStones.push(this.createCanvas(size, size));
			this.drawSlateStone(center, center, this.stoneRadius);
		}
		this.shellStones = [];
		for (let i = 9 * SHELL_3x3GRID_COUNT - 1; i >= 0; i--) {
			this.shellStones.push(this.createCanvas(size, size));
			this.drawShellStone(center, center, this.stoneRadius);
		}

		// So that each "repaint" shows the same pattern for a given stone position, pre-decides pattern indexes
		this.slatePatternIndexes = [];
		for (let j = 0; j < this.gobanSize; j++) {
			let row = this.slatePatternIndexes[j] = <[number,number]>[];
			for (let i = 0; i < this.gobanSize; i++) {
				row.push(~~(pseudoRandom() * SLATE_STONE_COUNT));
			}
		}
		this.shellPatternIndexes = [];
		for (let j = 0; j < this.gobanSize; j++) {
			let row = this.shellPatternIndexes[j] = <[number,number]>[];
			for (let i = 0; i < this.gobanSize; i++) {
				const indexIn3x3 = i % 3 + 3 * (j % 3);
				const whichGrid = (i % 6 < 3) === (j % 6 < 3) ? 0 : 1;
				const index = indexIn3x3 + 9 * whichGrid;
				row.push(index);
			}
		}

		this.miniShell = this.createCanvas(size, size);
		this.drawShellStone(center, center, this.stoneRadius / 2);
		this.miniSlate = this.createCanvas(size, size);
		this.drawSlateStone(center, center, this.stoneRadius / 2);
	}

	private setBackgroundFillStyle() {
		if (this.backgroundCanvas) {
			this.ctx.fillStyle = this.ctx.createPattern(this.backgroundCanvas, 'repeat');
		} else {
			this.ctx.fillStyle = this.backgroundColor;
		}
	}

	private drawBackground() {
		this.setBackgroundFillStyle();
		this.ctx.fillRect(0, 0, this.width, this.height);
	}

	private drawGrid() {
		this.ctx.strokeStyle = '#000';
		this.ctx.lineWidth = 1;
		this.ctx.beginPath();
		for (let n = 0; n < this.gobanSize; n++) {
			// Vertical lines
			const x = this.vertexLeft + n * this.vertexSize;
			this.ctx.moveTo(x, this.vertexTop);
			this.ctx.lineTo(x, this.vertexBottom);
			// Horizontal lines
			let y = this.vertexTop + n * this.vertexSize;
			this.ctx.moveTo(this.vertexLeft, y);
			this.ctx.lineTo(this.vertexRight, y);
		}
		this.ctx.stroke();
	}

	private drawStarPoints() {
		this.ctx.fillStyle = '#000';
		let points = starPoints[this.gobanSize];
		if (!points) return;
		for (let n = 0; n < points.length; n++) {
			let coords = points[n];
			const x = (coords[0] - 1) * this.vertexSize + this.vertexLeft;
			const y = (coords[1] - 1) * this.vertexSize + this.vertexTop;
			this.ctx.beginPath();
			this.ctx.arc(x, y, this.vertexSize / 9, 0, 2 * Math.PI);
			this.ctx.fill();
		}
	}

	private drawCoordinates() {
		this.ctx.fillStyle = '#000';
		this.ctx.font = this.coordFontSize + "px Arial";
		const letters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
		const distFromVertex = this.stoneRadius + this.gridMargin / 2;

		// Horizontal - column names
		let x = this.vertexLeft;
		let y1 = this.vertexTop - distFromVertex;
		let y2 = this.vertexBottom + distFromVertex;
		for (let n = 0; n < this.gobanSize; n++) {
			this.ctx.fillText(letters[n], x, y1);
			this.ctx.fillText(letters[n], x, y2);
			x += this.vertexSize;
		}

		// Vertical - row numbers
		let x1 = this.vertexLeft - distFromVertex;
		let x2 = this.vertexRight + distFromVertex;
		let y = this.vertexTop;
		for (let n = 0; n < this.gobanSize; n++) {
			const rowNumber = (this.gobanSize - n).toString();
			this.ctx.fillText(rowNumber, x1, y);
			this.ctx.fillText(rowNumber, x2, y);
			y += this.vertexSize;
		}
	}

	// Stones, marks, labels
	private drawAllObjects() {
		const levelCount = this.isSketch ? 1 : 2;

		for (let level = 0; level < levelCount; level++) {
			for (let j = 0; j < this.gobanSize; j++) {
				for (let i = 0; i < this.gobanSize; i++) {
					this.renderAt(i, j, level);
				}
			}
		}
	}

	private renderAt(i:number, j:number, level:number) {
		const x = i * this.vertexSize + this.vertexLeft;
		const y = this.vertexBottom - j * this.vertexSize;
		const vertex = this.logicalBoard.getVertexAt(i, j);

		if (vertex.stoneColor !== Color.EMPTY) {
			if (level === 0 && !this.isSketch)  {
				this.renderStoneShadow(x, y);
			} else {
				this.renderStoneAt(x, y, vertex.stoneColor, i, j);
			}
		}
		if (vertex.stoneColor === Color.EMPTY || level === 1 || this.isSketch) {
			if (vertex.mark) {
				this.drawMarkAt(x, y, vertex);
			}
			if (vertex.label) {
				this.drawLabelAt(x, y, vertex, vertex.label);
			}
		}
	}

	private renderStoneShadow(x:number, y:number) {
		const dist = this.stoneRadius * DIST_SHADOW;
		const r = this.stoneRadius - dist;
		this.ctx.drawImage(this.stoneShadow, x - r, y - r);
	}

	private renderStoneAt(x:number, y:number, color:Color, i:number, j:number) {
		if (this.isSketch) return this.renderSketchStoneAt(x, y, color, this.stoneRadius);

		let img;
		if (color === Color.BLACK) {
			img = this.slateStones[this.slatePatternIndexes[j][i]];
		} else {
			img = this.shellStones[this.shellPatternIndexes[j][i]];
		}

		this.ctx.drawImage(img, x - this.stoneRadius, y - this.stoneRadius);
	}

	private renderSketchStoneAt(x:number, y:number, color:Color, radius:number) {
		this.ctx.fillStyle = color === Color.BLACK ? 'rgb(0,0,0)' : 'rgb(255,255,255)';
		this.ctx.beginPath();
		this.ctx.arc(x, y, radius * 0.93, 0, 2 * Math.PI);
		this.ctx.fill();
	}

	private renderMiniStoneAt(x:number, y:number, color:Color, underStone:Color) {
		if (this.isSketch || underStone !== Color.EMPTY) {
			const radius = this.stoneRadius * 0.4;
			return this.renderSketchStoneAt(x, y, color, radius);
		} else {
			const radius = this.stoneRadius;
			const img = color === Color.BLACK ? this.miniSlate : this.miniShell;
			this.ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
		}
	}

	private drawStoneShadow(x:number, y:number) {
		var blur = this.stoneRadius * 0.1;
		var radius = this.stoneRadius * 0.95;

		var gradient = this.ctx.createRadialGradient(x, y, radius - 1 - blur, x, y, radius + blur);
		gradient.addColorStop(0, 'rgba(32,32,32,0.5)');
		gradient.addColorStop(1, 'rgba(62,62,62,0)');

		this.ctx.fillStyle = gradient;

		this.ctx.beginPath();
		this.ctx.arc(x, y, radius + blur, 0, 2 * Math.PI, true);
		this.ctx.fill();
	}

	private drawLightReflexion(x:number, y:number, radius:number, colorIn:string, colorOut:string, radiusIn:number, radiusOut:number) {
		const d = radius / 5;
		const radgrad = this.ctx.createRadialGradient(
			x - 2 * d, y - 2 * d, radiusIn * radius,
			x - d, y - d, radiusOut * radius
		);
		radgrad.addColorStop(0, colorIn);
		radgrad.addColorStop(1, colorOut);

		this.ctx.beginPath();
		this.ctx.fillStyle = radgrad;
		this.ctx.arc(x, y, radius * 0.95, 0, 2 * Math.PI, true);
		this.ctx.fill();
	}

	private drawSlateStone(x:number, y:number, radius:number) {
		const radiusOut = 0.8 - pseudoRandom() * 0.2;

		const brightness = pseudoRandom() * 40 + 76;
		const color = 10;
		const colorIn = 'rgb(' +
			~~(pseudoRandom() * color + brightness) + ',' +
			~~(pseudoRandom() * color + brightness) + ',' +
			~~(pseudoRandom() * color + brightness) + ')';

		this.drawLightReflexion(x, y, radius, colorIn, '#000', 0.01, radiusOut);
	}

	/**
	 * Clamshell stones drawing algorithm from Jan Prokop's WGo.js
	 * (http://wgo.waltheri.net/)
	 */
	private drawShellStone(x:number, y:number, radius:number) {
		this.drawLightReflexion(x, y, radius, '#fff', '#aaa', 0.33, 1);
		const shellLines = SHELL_LINES[~~(pseudoRandom() * 3)];
		const angle = pseudoRandom() * 2 * Math.PI;
		const thickness = 1 + pseudoRandom() * 1.5;
		const factor =  0.2 + pseudoRandom() * 0.3; // 0: lines are straight; 0.9: lines are very curvy
		this.drawShell(x, y, radius, angle, shellLines, factor, thickness);
	}

	private drawShell(x:number, y:number, radius:number, angle:number, lines:number[], factor:number, thickness:number) {
		let fromAngle = angle;
		let toAngle = angle;

		for(let i = 0; i < lines.length; i++) {
			fromAngle += lines[i];
			toAngle -= lines[i];
			let alpha = pseudoRandom() * (SHELL_LINE_ALPHA_MAX - SHELL_LINE_ALPHA_MIN) + SHELL_LINE_ALPHA_MIN;
			this.drawShellLine(x, y, radius, fromAngle, toAngle, factor, thickness, alpha);
		}
	}

	private drawShellLine(x:number, y:number, radius:number, start_angle:number, end_angle:number,
                          factor:number, thickness:number, alpha:number) {
		const ctx = this.ctx;
		alpha = ~~(alpha * 100) / 100;
		ctx.strokeStyle = 'rgba(128,128,128,' + alpha + ')';
		ctx.lineWidth = (radius / 30) * thickness;
		ctx.beginPath();

		radius -= Math.max(1, ctx.lineWidth);

		var x1 = x + radius * Math.cos(start_angle * Math.PI);
		var y1 = y + radius * Math.sin(start_angle * Math.PI);
		var x2 = x + radius * Math.cos(end_angle * Math.PI);
		var y2 = y + radius * Math.sin(end_angle * Math.PI);

		var m, angle, diff_x, diff_y;
		if (x2 > x1) {
			m = (y2 - y1) / (x2 - x1);
			angle = Math.atan(m);
		} else if (x2 === x1) {
			angle = Math.PI / 2;
		} else {
			m = (y2 - y1) / (x2 - x1);
			angle = Math.atan(m) - Math.PI;
		}

		var c = factor * radius;
		diff_x = Math.sin(angle) * c;
		diff_y = Math.cos(angle) * c;

		var bx1 = x1 + diff_x;
		var by1 = y1 - diff_y;

		var bx2 = x2 + diff_x;
		var by2 = y2 - diff_y;

		ctx.moveTo(x1, y1);
		ctx.bezierCurveTo(bx1, by1, bx2, by2, x2, y2);
		ctx.stroke();
	}

	private prepareForDrawingOver(x:number, y:number, vertex:Vertex) {
		switch (vertex.stoneColor) {
		case Color.EMPTY:
			if (vertex.mark[0] !== '+') {
				this.setBackgroundFillStyle();
				const s = this.vertexSize * 0.8;
				this.ctx.fillRect(x - s / 2, y - s / 2, s, s);
			}
			return '#000';
		case Color.BLACK:
			return '#fff';
		case Color.WHITE:
			return '#000';
		}
	}

	private drawMarkAt(x:number, y:number, vertex:Vertex) {
		const ctx = this.ctx;
		const markAndParams = vertex.mark.split(':');
		const mark = markAndParams[0];
		const params = markAndParams.length > 1 ? markAndParams[1].split(',') : [];
		const size = (parseInt(params[0]) / 10 || 1) * this.markSize;
		const half = size / 2;
		const lineWidth = (parseInt(params[1]) || 5) * size / 24;
		
		switch (mark) {
		case '[]':
			ctx.strokeStyle = this.prepareForDrawingOver(x, y, vertex);
			ctx.lineWidth = lineWidth;
			ctx.strokeRect(x - half, y - half, size, size);
			break;
		case 'O':
			ctx.strokeStyle = this.prepareForDrawingOver(x, y, vertex);
			ctx.lineWidth = lineWidth;
			ctx.beginPath();
			ctx.arc(x, y, half, 0, 2 * Math.PI);
			ctx.stroke();
			break;
		case '*':
			ctx.fillStyle = this.prepareForDrawingOver(x, y, vertex);
			ctx.font = (1.5 * this.fontSize) + "px Arial";
			ctx.fillText('*', x, y + this.fontSize * 0.35);
			break;
		case '+':
			ctx.strokeStyle = this.prepareForDrawingOver(x, y, vertex);
			ctx.lineWidth = lineWidth;
			ctx.beginPath();
			ctx.moveTo(x - half, y);
			ctx.lineTo(x + half, y);
			ctx.moveTo(x, y - half);
			ctx.lineTo(x, y + half);
			ctx.stroke();
			break;
		case '+?':
			ctx.fillStyle = '#888';
			ctx.fillRect(x - half, y - half, size, size);
			break;
		case '+Bo': case '+Wo':
			this.renderMiniStoneAt(x, y, mark[1] === 'B' ? Color.BLACK : Color.WHITE, vertex.stoneColor);
			break;
		default:
			console.error('Unknown mark type: ' + vertex.mark);
		}
	}

	private drawLabelAt(x:number, y:number, vertex:Vertex, label:string) {
		this.ctx.fillStyle = this.prepareForDrawingOver(x, y, vertex);
		if (vertex.style) this.ctx.fillStyle = vertex.style;

		const largeCharCount = label.replace(THIN_CHAR_REGEXP, '').length;
		const thinCharCount = label.length - largeCharCount;
		const estimatedWidth = largeCharCount + 0.5 * thinCharCount;
		const factor = 1.2 - 0.2 * estimatedWidth;

		const fontSize = Math.max(this.fontSize * factor, MIN_FONTSIZE_PX * this.pixelRatio);

		this.ctx.font = fontSize + "px Arial";

		this.ctx.fillText(label, x, y);
	}
}

export { BoardRenderer };
