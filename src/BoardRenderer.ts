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

	mainCanvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	pxRatio: number;
	boardWidth: number; // in logical pixels
	boardHeight: number;
	boardSize: number; // in stones
	onlySketch: boolean; // true for simplified rendering

	gridMargin: number;
	gridExtraMargin: number;
	randomSeed: number; // as provided in options
	bgOption: string; // as provided in options
	bgColorRgb: string;
	bgCanvasOption: HTMLCanvasElement; // as provided in options
	bgCanvas: HTMLCanvasElement;
	fontPx: number;
	coordFontPx: number;
	withCoords: boolean;
	withSimpleStones: boolean;

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
	shellPatternIndexes: number[][]; // indexes are coordinates as j,i
	slatePatternIndexes: number[][];

	public constructor (options:{
		widthPx:number,
		heightPx?:number,
		marginPx?:number,
		isSketch?:boolean,
		noCoords?:boolean,
		simpleStones?:boolean,
		backgroundCanvas?:HTMLCanvasElement,
		background?:string,
		patternSeed?:number,
		pixelRatio?:number
	}) {
		this.pxRatio = Math.max(1, options.pixelRatio || 1);

		this.onlySketch = !!options.isSketch;
		this.withCoords = !options.noCoords;
		this.withSimpleStones = !!options.simpleStones;
		this.gridExtraMargin = (options.marginPx || DEFAULT_MARGIN_PX) * this.pxRatio;

		this.bgCanvasOption = options.backgroundCanvas;
		this.bgOption = options.background;
		this.randomSeed = options.patternSeed || Math.random();

		this.setSize(options.widthPx, options.heightPx);
	}

	public changeLook (options:{
		isSketch?:boolean,
		noCoords?:boolean,
		simpleStones?:boolean,
		background?:string,
		patternSeed?:number
	}) {
		if (options.isSketch !== undefined) this.onlySketch = options.isSketch;
		if (options.noCoords !== undefined) {
			this.withCoords = !options.noCoords;
			this.computeDimensions();
		}
		if (options.simpleStones !== undefined) {
			this.withSimpleStones = options.simpleStones;
			if (!this.onlySketch) this.prepareStonePatterns();
		}
		if (options.background !== undefined || options.patternSeed !== undefined) {
			if (options.background !== undefined) this.bgOption = options.background;
			if (options.patternSeed !== undefined) this.randomSeed = options.patternSeed;
			this.prepareBackground();
		}
	}

	private setSize (widthPx:number, heightPx?: number) :boolean {
		if (!widthPx) {
			console.error('Invalid gobo widthPx: ' + widthPx);
			widthPx = 100;
		}
		const width = widthPx * this.pxRatio;
		const height = (heightPx || widthPx) * this.pxRatio;
		if (width === this.boardWidth && height === this.boardHeight) return false; // unchanged

		this.boardWidth = width;
		this.boardHeight = height;
		return true; // changed
	}

	public prepare (logicalBoard:LogicalBoard) :HTMLCanvasElement {
		this.logicalBoard = logicalBoard;
		this.computeDimensions();

		if (!this.onlySketch) this.prepareStonePatterns();
		this.prepareBackground();

		this.createMainCanvas();
		return this.mainCanvas;
	}

	// NB: this clears canvas' content so one has to call render too
	public resizeBoard (widthPx:number, heightPx?: number) {
		if (!this.setSize(widthPx, heightPx)) return;

		this.computeDimensions();
		if (!this.onlySketch) this.prepareStonePatterns();
		this.mainCanvas.width = this.boardWidth;
		this.mainCanvas.height = this.boardHeight;
	}

	public renderAll () {
		this.useMainCanvas();
		this.drawBackground();
		this.drawGrid();
		this.drawStarPoints();
		if (this.withCoords) this.drawCoordinates();
		this.drawAllObjects();
	}

	public getCanvas () {
		return this.mainCanvas;
	}

	private createMainCanvas () {
		this.mainCanvas = document.createElement('canvas');
		this.mainCanvas.width = this.boardWidth;
		this.mainCanvas.height = this.boardHeight;
	}

	private useMainCanvas () {
		this.ctx = this.mainCanvas.getContext('2d');
		this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'middle';
	}

	private createAndUseCanvas (width:number, height:number) {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		this.ctx = canvas.getContext('2d');
		return canvas;
	}

	private computeDimensions () {
		const squareSize = Math.min(this.boardWidth, this.boardHeight);
		this.boardSize = this.logicalBoard.boardSize;

		if (this.withCoords) {
			this.vertexSize = (squareSize - 2 * this.gridExtraMargin) / (this.boardSize + 2);
			if (this.vertexSize > MAX_COORD_FONTSIZE_PX * this.pxRatio) {
				this.coordFontPx = MAX_COORD_FONTSIZE_PX * this.pxRatio;
				this.vertexSize = (squareSize - 2 * this.gridExtraMargin - 2 * this.coordFontPx) / this.boardSize;
			} else {
				this.coordFontPx = this.vertexSize;
			}
			this.gridMargin = this.gridExtraMargin + this.coordFontPx;
		} else {
			this.vertexSize = (squareSize - 2 * this.gridExtraMargin) / this.boardSize;
			this.gridMargin = this.gridExtraMargin;
		}

		this.stoneRadius = this.vertexSize / 2;
		this.markSize = this.vertexSize * 0.55;
		this.fontPx = this.vertexSize * 0.8;

		this.vertexLeft = Math.round(this.gridMargin + this.vertexSize / 2 + (this.boardWidth - squareSize) / 2);
		this.vertexTop = Math.round(this.gridMargin + this.vertexSize / 2 + (this.boardHeight - squareSize) / 2);
		this.vertexBottom = this.vertexTop + (this.boardSize - 1) * this.vertexSize;
		this.vertexRight = this.vertexLeft + (this.boardSize - 1) * this.vertexSize;
	}

	/**
	 * Converts coordinates from pixels to grid
	 * @param x - origin 0,0 is top-left corner of the canvas
	 * @param y
	 * @returns [i, j] - with 0,0 as bottom-left corner of the grid
	 */
	public pixelToGridCoords (x:number, y:number) :[number,number] {
    	const i = Math.round((x - this.vertexLeft) / this.vertexSize);
    	const j = Math.round((this.vertexBottom - y) / this.vertexSize);
		return [i, j];
	}

	private prepareBackground () {
		if (this.bgCanvasOption) {
			this.bgCanvas = this.bgCanvasOption;
		} else if (!this.bgOption) {
			this.bgColorRgb = DEFAULT_BACKGROUND_COLOR;
			this.bgCanvas = null;
		} else if (this.bgOption[0] === '#' || this.bgOption.substr(0, 3).toLowerCase() === 'rgb') {
			this.bgColorRgb = this.bgOption;
			this.bgCanvas = null;
		} else if (this.bgOption === 'wood') {
			if (this.onlySketch) return; // ignore if sketch mode
			var canvas = this.bgCanvas = document.createElement('canvas');
			canvas.width = canvas.height = 200 * this.pxRatio;
			paintCanvas(canvas, this.randomSeed, this.randomSeed, this.pxRatio);
		}
	}

	private prepareStonePatterns () {
		setRandomSeed(this.randomSeed);
		const size = this.vertexSize;
		const center = size / 2;

		this.stoneShadow = this.createAndUseCanvas(size, size);
		this.drawStoneShadow(center, center);

		this.slateStones = [];
		this.shellStones = [];
		if (this.withSimpleStones) {
			this.slateStones.push(this.createAndUseCanvas(size, size));
			this.drawSlateStone(center, center, this.stoneRadius);
			this.shellStones.push(this.createAndUseCanvas(size, size));
			this.drawShellStone(center, center, this.stoneRadius);
		} else {
			for (let i = SLATE_STONE_COUNT - 1; i >= 0; i--) {
				this.slateStones.push(this.createAndUseCanvas(size, size));
				this.drawSlateStone(center, center, this.stoneRadius);
			}
			for (let i = 9 * SHELL_3x3GRID_COUNT - 1; i >= 0; i--) {
				this.shellStones.push(this.createAndUseCanvas(size, size));
				this.drawShellStone(center, center, this.stoneRadius);
			}

			// So that each "repaint" shows the same pattern for a given stone position, pre-decides pattern indexes
			this.slatePatternIndexes = [];
			for (let j = 0; j < this.boardSize; j++) {
				let row = this.slatePatternIndexes[j] = <number[]>[];
				for (let i = 0; i < this.boardSize; i++) {
					row.push(~~(pseudoRandom() * SLATE_STONE_COUNT));
				}
			}
			this.shellPatternIndexes = [];
			for (let j = 0; j < this.boardSize; j++) {
				let row = this.shellPatternIndexes[j] = <number[]>[];
				for (let i = 0; i < this.boardSize; i++) {
					const indexIn3x3 = i % 3 + 3 * (j % 3);
					const whichGrid = (i % 6 < 3) === (j % 6 < 3) ? 0 : 1;
					const index = indexIn3x3 + 9 * whichGrid;
					row.push(index);
				}
			}
		}

		this.miniShell = this.createAndUseCanvas(size, size);
		this.drawShellStone(center, center, this.stoneRadius / 2);
		this.miniSlate = this.createAndUseCanvas(size, size);
		this.drawSlateStone(center, center, this.stoneRadius / 2);
	}

	private setBackgroundFillStyle () {
		if (this.bgCanvas) {
			this.ctx.fillStyle = this.ctx.createPattern(this.bgCanvas, 'repeat');
		} else {
			this.ctx.fillStyle = this.bgColorRgb;
		}
	}

	private drawBackground () {
		this.setBackgroundFillStyle();
		this.ctx.fillRect(0, 0, this.boardWidth, this.boardHeight);
	}

	private drawGrid () {
		this.ctx.strokeStyle = '#000';
		this.ctx.lineWidth = 1;
		this.ctx.beginPath();
		for (let n = 0; n < this.boardSize; n++) {
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

	private drawStarPoints () {
		this.ctx.fillStyle = '#000';
		let points = starPoints[this.boardSize];
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

	private drawCoordinates () {
		this.ctx.fillStyle = '#000';
		this.ctx.font = this.coordFontPx + "px Arial";
		const letters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
		const distFromVertex = this.stoneRadius + this.gridMargin / 2;

		// Horizontal - column names
		let x = this.vertexLeft;
		let y1 = this.vertexTop - distFromVertex;
		let y2 = this.vertexBottom + distFromVertex;
		for (let n = 0; n < this.boardSize; n++) {
			this.ctx.fillText(letters[n], x, y1);
			this.ctx.fillText(letters[n], x, y2);
			x += this.vertexSize;
		}

		// Vertical - row numbers
		let x1 = this.vertexLeft - distFromVertex;
		let x2 = this.vertexRight + distFromVertex;
		let y = this.vertexTop;
		for (let n = 0; n < this.boardSize; n++) {
			const rowNumber = (this.boardSize - n).toString();
			this.ctx.fillText(rowNumber, x1, y);
			this.ctx.fillText(rowNumber, x2, y);
			y += this.vertexSize;
		}
	}

	// Stones, marks, labels
	private drawAllObjects () {
		const levelCount = this.onlySketch ? 1 : 2;

		for (let level = 0; level < levelCount; level++) {
			for (let j = 0; j < this.boardSize; j++) {
				for (let i = 0; i < this.boardSize; i++) {
					this.renderAt(i, j, level);
				}
			}
		}
	}

	private renderAt (i:number, j:number, level:number) {
		const x = i * this.vertexSize + this.vertexLeft;
		const y = this.vertexBottom - j * this.vertexSize;
		const vertex = this.logicalBoard.getVertex(i, j);

		if (vertex.stoneColor !== Color.EMPTY) {
			if (level === 0 && !this.onlySketch)  {
				this.renderStoneShadow(x, y);
			} else {
				this.renderStoneAt(x, y, vertex.stoneColor, i, j);
			}
		}
		if (vertex.stoneColor === Color.EMPTY || level === 1 || this.onlySketch) {
			if (vertex.mark) {
				this.drawMarkAt(x, y, vertex);
			}
			if (vertex.label) {
				this.drawLabelAt(x, y, vertex, vertex.label);
			}
		}
	}

	private renderStoneShadow (x:number, y:number) {
		const dist = this.stoneRadius * DIST_SHADOW;
		const r = this.stoneRadius - dist;
		this.ctx.drawImage(this.stoneShadow, x - r, y - r);
	}

	private renderStoneAt (x:number, y:number, color:Color, i:number, j:number) {
		if (this.onlySketch) return this.renderSketchStoneAt(x, y, color, this.stoneRadius);

		let stoneCollection, index;
		if (color === Color.BLACK) {
			stoneCollection = this.slateStones;
			index = this.withSimpleStones ? 0 : this.slatePatternIndexes[j][i];
		} else {
			stoneCollection = this.shellStones;
			index = this.withSimpleStones ? 0 : this.shellPatternIndexes[j][i];
		}
		const img = stoneCollection[index];

		this.ctx.drawImage(img, x - this.stoneRadius, y - this.stoneRadius);
	}

	private renderSketchStoneAt (x:number, y:number, color:Color, radius:number) {
		this.ctx.fillStyle = color === Color.BLACK ? 'rgb(0,0,0)' : 'rgb(255,255,255)';
		this.ctx.beginPath();
		this.ctx.arc(x, y, radius * 0.93, 0, 2 * Math.PI);
		this.ctx.fill();
	}

	private renderMiniStoneAt (x:number, y:number, color:Color, underStone:Color) {
		if (this.onlySketch || underStone !== Color.EMPTY) {
			const radius = this.stoneRadius * 0.4;
			return this.renderSketchStoneAt(x, y, color, radius);
		} else {
			const radius = this.stoneRadius;
			const img = color === Color.BLACK ? this.miniSlate : this.miniShell;
			this.ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
		}
	}

	private drawStoneShadow (x:number, y:number) {
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

	private drawLightReflexion (x:number, y:number, radius:number, colorIn:string, colorOut:string, radiusIn:number, radiusOut:number) {
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

	private drawSlateStone (x:number, y:number, radius:number) {
		if (!this.withSimpleStones) {
			const radiusOut = 0.8 - pseudoRandom() * 0.2;

			const brightness = pseudoRandom() * 40 + 76;
			const color = 10;
			const colorIn = 'rgb(' +
				~~(pseudoRandom() * color + brightness) + ',' +
				~~(pseudoRandom() * color + brightness) + ',' +
				~~(pseudoRandom() * color + brightness) + ')';

			this.drawLightReflexion(x, y, radius, colorIn, '#000', 0.01, radiusOut);
		} else {
			this.drawLightReflexion(x, y, radius, '#666', '#000', 0.01, 0.75);
		}
	}

	/**
	 * @license Clamshell stones drawing algorithm based on Jan Prokop's WGo.js
	 * (http://wgo.waltheri.net/)
	 */
	private drawShellStone (x:number, y:number, radius:number) {
		this.drawLightReflexion(x, y, radius, '#fff', '#aaa', 0.33, 1);

		if (!this.withSimpleStones) {
			const shellLines = SHELL_LINES[~~(pseudoRandom() * 3)];
			const angle = pseudoRandom() * 2 * Math.PI;
			const thickness = (1 + pseudoRandom() * 1.5) * this.pxRatio;
			const factor =  0.2 + pseudoRandom() * 0.3; // 0: lines are straight; 0.9: lines are very curvy
			this.drawShell(x, y, radius, angle, shellLines, factor, thickness);
		}
	}

	private drawShell (x:number, y:number, radius:number, angle:number, lines:number[], factor:number, thickness:number) {
		let fromAngle = angle;
		let toAngle = angle;

		for(let i = 0; i < lines.length; i++) {
			fromAngle += lines[i];
			toAngle -= lines[i];
			let alpha = pseudoRandom() * (SHELL_LINE_ALPHA_MAX - SHELL_LINE_ALPHA_MIN) + SHELL_LINE_ALPHA_MIN;
			this.drawShellLine(x, y, radius, fromAngle, toAngle, factor, thickness, alpha);
		}
	}

	private drawShellLine (x:number, y:number, radius:number, start_angle:number, end_angle:number,
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

	private prepareForDrawingOver (x:number, y:number, vertex:Vertex) {
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

	private drawMarkAt (x:number, y:number, vertex:Vertex) {
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
			ctx.font = (1.5 * this.fontPx) + "px Arial";
			ctx.fillText('*', x, y + this.fontPx * 0.35);
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

	private drawLabelAt (x:number, y:number, vertex:Vertex, label:string) {
		this.ctx.fillStyle = this.prepareForDrawingOver(x, y, vertex);
		if (vertex.style) this.ctx.fillStyle = vertex.style;

		const largeCharCount = label.replace(THIN_CHAR_REGEXP, '').length;
		const thinCharCount = label.length - largeCharCount;
		const estimatedWidth = largeCharCount + 0.5 * thinCharCount;
		const factor = 1.2 - 0.2 * estimatedWidth;

		const fontSize = Math.max(this.fontPx * factor, MIN_FONTSIZE_PX * this.pxRatio);

		this.ctx.font = fontSize + "px Arial";

		this.ctx.fillText(label, x, y);
	}
}

export { BoardRenderer };
