import { Vertex, Color } from '../src/Vertex';
import { LogicalBoard } from '../src/LogicalBoard';
import { BoardRenderer } from '../src/BoardRenderer';
import { Gobo } from '../src/Gobo';


class GoboTest {
	board: LogicalBoard;
	renderer: BoardRenderer;
	parent: HTMLElement;

	constructor(parent: HTMLDivElement, options: any) {
		this.parent = parent;

		this.board = new LogicalBoard(options.gobanSize || 19);

		this.renderer = new BoardRenderer(options);
	}

	private prepareRenderer(cb: () => void) {
		var self = this;
		this.renderer.prepare(this.board, function () {
			self.parent.appendChild(self.renderer.getCanvas());
			cb();
		});
	}

	private addStoneAndRender(count:number) {
		if (!count) return console.timeEnd('manyRenderings');

		const gsize = this.board.gobanSize;
		const r = Math.random();
		const color = r < 0.5 ? Color.BLACK : Color.WHITE;
		this.board.setStoneAt(~~(Math.random() * gsize), ~~(Math.random() * gsize), color);

		this.renderer.render();

		setTimeout(this.addStoneAndRender.bind(this, count - 1));
	}

	// Tests

	public testLabelsAndMarks() {
		this.board.setLabelAt(3, 3, 'A');
		this.board.setStoneAt(3, 5, Color.BLACK); this.board.setLabelAt(3, 5, '1');
		this.board.setStoneAt(4, 4, Color.BLACK);
		this.board.setStoneAt(5, 2, Color.WHITE); this.board.setLabelAt(5, 2, '29');
		this.board.setStoneAt(5, 3, Color.BLACK);
		this.board.setStoneAt(6, 5, Color.WHITE); this.board.setLabelAt(6, 5, '9.9');
		this.board.setStoneAt(6, 4, Color.WHITE); this.board.setLabelAt(6, 4, '299');
		this.board.setStoneAt(6, 3, Color.WHITE);
		this.board.setStoneAt(6, 6, Color.WHITE); this.board.setLabelAt(6, 6, '9999');

		this.board.setMarkAt(2, 8, '[]');
		this.board.setStoneAt(2, 7, Color.BLACK); this.board.setMarkAt(2, 7, '[]');
		this.board.setStoneAt(3, 6, Color.WHITE); this.board.setMarkAt(3, 6, '[]');

		this.board.setMarkAt(0, 8, 'O');
		this.board.setStoneAt(0, 7, Color.BLACK); this.board.setMarkAt(0, 7, 'O');
		this.board.setStoneAt(1, 6, Color.WHITE); this.board.setMarkAt(1, 6, 'O');

		var self = this;
		this.prepareRenderer(function () {
			self.renderer.render();
		})
	}

	// Used for gauging how "different" the white stones can look to a human eye
	public testFullWhiteBoard() {
		const gsize = this.board.gobanSize;
		const self = this;
		this.prepareRenderer(function () {
			for (let j = 0; j < gsize; j++) {
				for (let i = 0; i < gsize; i++) {
					self.board.setStoneAt(i, j, Color.WHITE);
				}
			}
			self.renderer.render();
		});
	}

	// Performance test
	public testManyRenderings() {
		console.time('manyRenderings');
		this.prepareRenderer(this.addStoneAndRender.bind(this, 1000));
	}
}

function runTest(testName:string, params:any, goboOptions?:any) {
	const div = document.createElement('div');
	document.body.appendChild(div);

	const width = params.width || 600;
	div.style.width = div.style.height = width + 'px';
	div.style.marginBottom = '10px';

	goboOptions = goboOptions || {};
	goboOptions.widthPx = width;
	goboOptions.background = goboOptions.background || '#864';

	const gobo = new GoboTest(div, goboOptions);

	gobo[testName]();
}

function runBasicTest() {
	const div = document.createElement('div');
	document.body.appendChild(div);

	div.style.width = div.style.height = '400px';
	div.style.marginBottom = '10px';

	const gobo = new Gobo(div, { gobanSize: 9, background: './test/wood.jpg' });
	gobo.setStoneAt(2, 2, Color.BLACK); // BLACK is 0, WHITE is 1
	gobo.setLabelAt(2, 2, 'A');
	gobo.setMarkAt(3, 2, '[]');
	gobo.prepareRenderer(function () {
		gobo.render();
	})
}

function runTests() {
	runBasicTest();
	runTest('testManyRenderings', { width: 550 }, { background: './test/wood.jpg' });
	runTest('testLabelsAndMarks', { width: 550 });
	runTest('testLabelsAndMarks', { width: 350 }, { isSketch: true, gobanSize: 9 });
	runTest('testFullWhiteBoard', { width: 550 });
}

runTests();
