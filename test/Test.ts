import { Vertex, Color } from '../src/Vertex';
import { LogicalBoard } from '../src/LogicalBoard';
import { BoardRenderer } from '../src/BoardRenderer';
import { Gobo } from '../src/Gobo';


/**
 * A very simple example to start from.
 */
function runBasicTest() {
	const width = 400;

	const gobo = new Gobo({ gobanSize: 9, widthPx: width, background: '#b75' });

	gobo.setStoneAt(2, 3, Color.BLACK); // NB: BLACK is 0, WHITE is 1
	gobo.setStoneAt(5, 2, Color.WHITE);
	gobo.setStoneAt(3, 6, Color.BLACK);
	gobo.setStoneAt(5, 5, Color.WHITE);

	gobo.render();

	createNewDiv(width).appendChild(gobo.canvas);
}

class GoboTest {
	board: LogicalBoard;
	renderer: BoardRenderer;
	canvas: HTMLCanvasElement;

	constructor(options: any) {
		this.board = new LogicalBoard(options.gobanSize || 19);
		this.renderer = new BoardRenderer(options);
		this.canvas = this.renderer.prepare(this.board);
	}

	// Tests

	public testManyRenderings() {
		console.time('manyRenderings');
		this.addStoneAndRender(1000);
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
		this.board.setStoneAt(3, 6, Color.WHITE); this.board.setMarkAt(3, 6, '[]:5,2');

		this.board.setMarkAt(0, 8, 'O');
		this.board.setStoneAt(0, 7, Color.BLACK); this.board.setMarkAt(0, 7, 'O');
		this.board.setStoneAt(1, 6, Color.WHITE); this.board.setMarkAt(1, 6, 'O:5,8');

		this.board.setStoneAt(2, 4, Color.BLACK); this.board.setMarkAt(2, 4, '+:4,1');
		this.board.setStoneAt(2, 3, Color.WHITE); this.board.setMarkAt(2, 3, '+');
		
		this.renderer.render();
	}

	public testFullWhiteBoard() {
		const gsize = this.board.gobanSize;
		for (let j = 0; j < gsize; j++) {
			for (let i = 0; i < gsize; i++) {
				this.board.setStoneAt(i, j, Color.WHITE);
			}
		}
		this.renderer.render();
	}
}


function runTest(testName:string, params:any, goboOptions?:any) {
	const width = params.width || 600;
	const div = createNewDiv(width);

	goboOptions = goboOptions || {};
	goboOptions.widthPx = width;
	goboOptions.background = goboOptions.background || '#864';

	if (params.image) {
		goboOptions.backgroundCanvas = loadImage(params.image, doTest.bind(null, div, goboOptions, testName));
	} else {
		doTest(div, goboOptions, testName);
	}
}

function createNewDiv(width:number) :HTMLDivElement {
	const div = document.createElement('div');
	document.body.appendChild(div);
	div.style.width = div.style.height = width + 'px';
	div.style.marginBottom = '10px';
	return div;
}

function loadImage(image:string, cb:()=>void) {
	var canvas = document.createElement('canvas');
	var img = new Image();
	img.src = image;
	img.onload = function () {
		img.onload = null;
		canvas.width = img.width; canvas.height = img.height;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0);
		cb();
	}
	return canvas;
}

function doTest(div:HTMLDivElement, goboOptions:{}, testName:string) {
	const goboTest = new GoboTest(goboOptions);
	div.appendChild(goboTest.canvas);

	goboTest[testName]();
}

const woodExample = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAACKUlEQVQ4T7WUXXLcMAyDQVKyszl1TtBr9g5ekeqAkvyTZvpW58UzO4E/EgDl96+vXovhVQoCHW8PHO+G6IHNCqwoPDo8Any2YvluIthLQYuO5oGiAhGB/D/BWhB9EjZHhCeNqcI7EEH+b4RW0PokNEH+PQgpGIHjFCxTsKcgH66H78qRT0GHmUJFb4IkjEvQw3NHJgrHFBSgmsE9oKop6D3Q3FFMIbgL0pQOvKPhaJEUW1GYGrw/CS/BsY40hSNfpig+a03H6PLbPb/8oQoxy93eR6Ygd7uRNvfuqEUh/dyh4lVqEh7eUrT3yPFMJSkYFZk7PAUzQlyTo5oCy5TNFK9tELZlSnfsqtBSzhwuwWXKNn9LwvsOGY8P/pguO97cYQ/sdG7u8EE4g/1vwTpI+LUxMnNYMgrLFBKW1RQVbHpBbKrAig3/cRAOMYr23nPpIpqVZIzo4ooNY5LvE4L55Acz2DlyEkaOe4QDS1AlzaIRolcOi2qG/BTMHU6X9xSsSdfCcfgQ3M0A1YwNCTk+ydJlkzweS5BQfJKQjSAhDWFIx8jAXsZeUpCEbAqpVg5vhH8J7tUyMkMw0GdTREew0+Vb9Xi+0uUZ7CG4Rq6WvXWfsXHGxnPkR2yWIGPDpsxIjabY1RR2ljuk4NghuzyOA4/AT11mg3KHM7t0/Kzej8GmIAnnRXl0OYOteTw8eFAclb1f1yarx+OQx3IRPq/N9y6P8zWuzVU9wR9BRU5H3DbiDgAAAABJRU5ErkJggg==';

function runTests() {
	// Most simple example
	runBasicTest();

	// Performance test
	runTest('testManyRenderings', { width: 550 }, { background: 'wood' });

	// Labels & marks, size 9x9, sketch mode
	runTest('testLabelsAndMarks', { width: 350 }, { gobanSize: 9, isSketch: true, background: '#dcb' });

	// You can use your own image as background (some look better than others)
	runTest('testLabelsAndMarks', { width: 350, image: woodExample }, { gobanSize: 9 });

	// Test used to gauge if white stones look "different enough" to a human eye
	runTest('testFullWhiteBoard', { width: 550 });
}

runTests();
