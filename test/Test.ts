//import { Gobo } from '../src/Gobo'; // for TS
const Gobo = window['gobo'].Gobo;

const BLACK = 0, WHITE = 1, EMPTY = -1;


function addIntro() {
	newDiv(document.body, 'title', 'gobo Tests & Samples');
	newDiv(document.body, 'subtitle', 'General Remarks');
	newDiv(document.body, 'intro',
		`These samples are given in JavaScript for the wider audience.\nThis html page contains a tag:`);
	newDiv(document.body, 'codeInText', `<script src='../bin/gobo.js'></script>`);
	newDiv(document.body, 'intro', `then you can simply do:`);
	newDiv(document.body, 'codeInText', `var Gobo = window['gobo'].Gobo;`);
	newDiv(document.body, 'intro', `...but you could of course load gobo differently.\n` +
		`For example in TypeScript you can simply import Gobo.\n\n` +
		`All examples below suppose the following constants are declared:`);
	newDiv(document.body, 'codeInText', `var BLACK = 0, WHITE = 1, EMPTY = -1;`);
	newDiv(document.body, 'intro', `For neat rendering on "retina" displays (when window.devicePixelRatio > 1),\n` +
		`you should pass pixelRatio to your Gobo object:`);
	newDiv(document.body, 'codeInText', `new Gobo({ pixelRatio: window.devicePixelRatio,... })`);
}

/**
 * A very simple example to start from.
 */
function basicTest() {
	const width = 300;

	const gobo = newGobo({ gobanSize: 5, widthPx: width, background: '#ea8' });

	gobo.setStoneAt(2, 1, WHITE);
	gobo.setStoneAt(2, 3, BLACK);
	gobo.setStoneAt(3, 1, WHITE);
	gobo.setStoneAt(3, 1, EMPTY);

	gobo.render();

	createSample(width, gobo.canvas,
		'Basic Sample',
		'A very simple example to start from.',
`var gobo = new Gobo({
    gobanSize: 5,
    widthPx: 300,
    background: \'#ea8\'
});

gobo.setStoneAt(2, 2, WHITE);
gobo.setStoneAt(2, 3, BLACK);
gobo.setStoneAt(3, 1, WHITE);
gobo.setStoneAt(3, 1, EMPTY); // removes stone

gobo.render();`);
}

/**
 * Performance test
 */
function testManyRenderings() {
	const width = 512;
	const seed = ~~(Math.random() * 100000) / 100000; // so we can use this demo to find nice seeds
	const gobo = newGobo({ widthPx: width, background: 'wood', patternSeed: seed });

	const code =
`var gobo = new Gobo({
    widthPx: 512,
    background: \'wood\',
    patternSeed: ${seed} // for random patterns of wood & stones (0 < seed < 1)
});

addStoneAndRender(gobo, 1000);

function addStoneAndRender(gobo, count) {
    if (!count) return; // finished
    gobo.setStoneAt(~~(Math.random() * 19), ~~(Math.random() * 19), Math.random() < 0.5 ? 0 : 1);
    gobo.render();
    setTimeout(addStoneAndRender, 0, gobo, count - 1);
}`;

	const textDiv = createSample(width, gobo.canvas,
		'Performance Test',
		'1,000 "render" operations (full board is redrawn).',
		code).textDiv;

	const t0 = Date.now();

	addStoneAndRender(gobo, 1000, () => {
		const perRedraw = Math.round((Date.now() - t0) / 100) / 10;
		textDiv.innerText = code + `\n\n=> ${perRedraw}ms per redraw`;
	});
}

function addStoneAndRender(gobo:any, count:number, cb:()=>void) {
	if (!count) return cb();

	gobo.setStoneAt(~~(Math.random() * 19), ~~(Math.random() * 19), Math.random() < 0.5 ? 0 : 1);

	gobo.render();

	setTimeout(addStoneAndRender, 0, gobo, count - 1, cb);
}

/**
 * Labels & marks, sketch mode
 */
function testLabelsAndMarks() {
	const width = 350;

	const gobo = newGobo({ gobanSize: 7, isSketch: true, widthPx: width, background: '#dcb' });

	gobo.setMarkAt(0, 1, 'O');
	gobo.setStoneAt(0, 0, BLACK); gobo.setMarkAt(0, 0, 'O');
	gobo.setStoneAt(0, 2, WHITE); gobo.setMarkAt(0, 2, 'O:5,8');

	gobo.setMarkAt(2, 1, '[]');
	gobo.setStoneAt(2, 0, BLACK); gobo.setMarkAt(2, 0, '[]');
	gobo.setStoneAt(2, 2, WHITE); gobo.setMarkAt(2, 2, '[]:5,2');

	gobo.setStoneAt(1, 3, BLACK); gobo.setMarkAt(1, 3, '+:4,1');
	gobo.setStoneAt(1, 4, WHITE); gobo.setMarkAt(1, 4, '+');

	gobo.setLabelAt(3, 3, 'A'); gobo.setLabelAt(3, 4, '12');
	gobo.setStoneAt(3, 5, BLACK); gobo.setLabelAt(3, 5, '1');

	gobo.setStoneAt(5, 3, WHITE); gobo.setLabelAt(5, 3, 'B');
	gobo.setStoneAt(6, 5, WHITE); gobo.setLabelAt(6, 5, '9.9');
	gobo.setStoneAt(6, 4, WHITE); gobo.setLabelAt(6, 4, '299');
	gobo.setStoneAt(6, 6, WHITE); gobo.setLabelAt(6, 6, '9999');

	gobo.render();

	createSample(width, gobo.canvas,
		'Labels & marks, sketch mode',
		'Some examples of what you can do with labels and marks.',
`var gobo = new Gobo({ gobanSize: 7, isSketch: true, widthPx: 350, background: '#dcb' });

gobo.setMarkAt(0, 1, 'O');
gobo.setStoneAt(0, 0, BLACK); gobo.setMarkAt(0, 0, 'O');
gobo.setStoneAt(0, 2, WHITE); gobo.setMarkAt(0, 2, 'O:5,8');

gobo.setMarkAt(2, 1, '[]');
gobo.setStoneAt(2, 0, BLACK); gobo.setMarkAt(2, 0, '[]');
gobo.setStoneAt(2, 2, WHITE); gobo.setMarkAt(2, 2, '[]:5,2');

gobo.setStoneAt(1, 3, BLACK); gobo.setMarkAt(1, 3, '+:4,1');
gobo.setStoneAt(1, 4, WHITE); gobo.setMarkAt(1, 4, '+');

gobo.setLabelAt(3, 3, 'A'); gobo.setLabelAt(3, 4, '12');
gobo.setStoneAt(3, 5, BLACK); gobo.setLabelAt(3, 5, '1');

gobo.setStoneAt(5, 3, WHITE); gobo.setLabelAt(5, 3, 'B');
gobo.setStoneAt(6, 5, WHITE); gobo.setLabelAt(6, 5, '9.9');
gobo.setStoneAt(6, 4, WHITE); gobo.setLabelAt(6, 4, '299');
gobo.setStoneAt(6, 6, WHITE); gobo.setLabelAt(6, 6, '9999');

gobo.render();`);
}

/**
 * You can use your own image as background (some look better than others).
 */
function testCustomBackground() {
	const width = 350;
	const woodExample = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAACKUlEQVQ4T7WUXXLcMAyDQVKyszl1TtBr9g5ekeqAkvyTZvpW58UzO4E/EgDl96+vXovhVQoCHW8PHO+G6IHNCqwoPDo8Any2YvluIthLQYuO5oGiAhGB/D/BWhB9EjZHhCeNqcI7EEH+b4RW0PokNEH+PQgpGIHjFCxTsKcgH66H78qRT0GHmUJFb4IkjEvQw3NHJgrHFBSgmsE9oKop6D3Q3FFMIbgL0pQOvKPhaJEUW1GYGrw/CS/BsY40hSNfpig+a03H6PLbPb/8oQoxy93eR6Ygd7uRNvfuqEUh/dyh4lVqEh7eUrT3yPFMJSkYFZk7PAUzQlyTo5oCy5TNFK9tELZlSnfsqtBSzhwuwWXKNn9LwvsOGY8P/pguO97cYQ/sdG7u8EE4g/1vwTpI+LUxMnNYMgrLFBKW1RQVbHpBbKrAig3/cRAOMYr23nPpIpqVZIzo4ooNY5LvE4L55Acz2DlyEkaOe4QDS1AlzaIRolcOi2qG/BTMHU6X9xSsSdfCcfgQ3M0A1YwNCTk+ydJlkzweS5BQfJKQjSAhDWFIx8jAXsZeUpCEbAqpVg5vhH8J7tUyMkMw0GdTREew0+Vb9Xi+0uUZ7CG4Rq6WvXWfsXHGxnPkR2yWIGPDpsxIjabY1RR2ljuk4NghuzyOA4/AT11mg3KHM7t0/Kzej8GmIAnnRXl0OYOteTw8eFAclb1f1yarx+OQx3IRPq/N9y6P8zWuzVU9wR9BRU5H3DbiDgAAAABJRU5ErkJggg==';

	const code =
`var gobo = new Gobo({
	backgroundCanvas: canvas,
	noCoords: true, // turn off coordinates
	gobanSize: 7,
	widthPx: 350
});

gobo.setStoneAt(3, 3, WHITE);

gobo.render();`;

	const canvas = loadImage(woodExample, () => {
		const gobo = newGobo({ gobanSize: 7, widthPx: width, backgroundCanvas: canvas, noCoords: true });
		gobo.setStoneAt(3, 3, WHITE);
		gobo.render();

		createSample(width, gobo.canvas,
			'Custom Background',
			'You can use your own image as background (some look better than others).',
			code);
	});
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

/**
 * Test used to gauge if white stones look "different enough" to a human eye.
 */
function testFullWhiteBoard() {
	const width = 512, gobanSize = 13;
	const seed = 0.993623429;
	const gobo = newGobo({ gobanSize: gobanSize, widthPx: width, background: 'wood', patternSeed: seed });

	for (let j = 0; j < gobanSize; j++) {
		for (let i = 0; i < gobanSize; i++) {
			gobo.setStoneAt(i, j, WHITE);
		}
	}
	gobo.render();

	const code =
`var gobo = new Gobo({
	gobanSize: 13,
	widthPx: 512,
	background: 'wood',
	patternSeed: ${seed}
});

for (var j = 0; j < 13; j++) {
    for (var i = 0; i < 13; i++) {
        gobo.setStoneAt(i, j, WHITE);
    }
}

gobo.render();`;

	createSample(width, gobo.canvas,
		'Full White Board',
		'Test used to gauge if white stones look "different enough" to a human eye.',
		code);
}

//---

function newGobo(options:any) {
	// Always set pixelRatio here - not mentioned in each example to keep it short.
	options.pixelRatio = window.devicePixelRatio;

	return new Gobo(options);
}

function createSample(width:number, canvas:HTMLCanvasElement,
	title:string, intro:string, code:string) : {boardDiv:HTMLDivElement, textDiv:HTMLDivElement} {

	if (title) newDiv(document.body, 'subtitle', title);
	if (intro) newDiv(document.body, 'intro', intro);

	const sampleDiv = newDiv(document.body, 'sampleDiv');

	const boardDiv = newDiv(sampleDiv, 'boardDiv');
	canvas.style.width = canvas.style.height = width + 'px';
	boardDiv.appendChild(canvas);

	const textDiv = newDiv(sampleDiv, 'textDiv codeSample', code);

	return { boardDiv: boardDiv, textDiv: textDiv };
}

function newDiv(parent:HTMLElement, className?:string, text?:string) :HTMLDivElement {
	const div = document.createElement('div');
	if (className) div.className = className;
	parent.appendChild(div);
	if (text) div.innerText = text;
	return div;
}


function runTests() {
	addIntro();
	basicTest();
	testManyRenderings();
	testLabelsAndMarks();
	testFullWhiteBoard();
	testCustomBackground(); // (async)
}

runTests();
