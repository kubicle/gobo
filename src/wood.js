var cheapSeed = require('./cheapSeed');
var setRandomSeed = cheapSeed.setRandomSeed;
var random = cheapSeed.pseudoRandom;
var randomBetween = cheapSeed.pseudoRandomBetween;

var RED = 0, GREEN = 1, BLUE = 2;

var MAX_DELTA = 0.12; // +/- max variation each line can move per vertical pixel
var LINE_DELTADELTA = MAX_DELTA / 8;
var WARPZONE_X = 30, WARPZONE_Y = 100;

var GREEN_RED_RATIO = [0.4, 0.85]; // 0 allows red; 1 allows yellow
var BLUE_GREEN_RATIO = [0.6, 0.9]; // 0 allows yellow; 1 allows pink

var DARKER_RATIO = [0.75, 0.9]; // 0 makes black; 1 gives same color
var BRIGHT_DARK_REGULARITY = [0.2, 0.5]; // 0 makes total alternance bright/dark; 1 makes complete random

var averageLineWidth; // decides how many vertical lines we have
var maxDeviation; // how much a line can deviate "freely"


function randowBrown() {
	var color = [];
	color[RED] = 1;
	var g = color[GREEN] = randomBetween(GREEN_RED_RATIO[0], GREEN_RED_RATIO[1]);
	color[BLUE] = randomBetween(g * BLUE_GREEN_RATIO[0], g * BLUE_GREEN_RATIO[1]);
	return color;
}

function darkerColor(base) {
	var color = [0, 0, 0];
	var ratio = randomBetween(DARKER_RATIO[0], DARKER_RATIO[1]);
	for (var c = 0; c < 3; c++) {
		color[c] = base[c] * ratio;
	}
	return color;
}

function buildLineWidths(width, lineDeltas) {
	var lineCount = ~~(width / averageLineWidth);
	var remainingWidth = width;
	var lineWidths = [];
	for (var i = lineCount; i >= 2; i--) {
		var lineWidth = (random() + 0.5) * (remainingWidth / i);
		lineWidths.push(lineWidth);
		remainingWidth -= lineWidth;
		lineDeltas.push(0);
	}
	lineWidths.push(remainingWidth);
	return lineWidths;
}

function makeLinesVary(initLineWidths, lineWidths, lineDeltas, width, height, y) {
	var remainingWidth = width;
	var lineCount = lineWidths.length;
	var yWrap = Math.max((y - height) / WARPZONE_Y + 1, 0);

	for (var i = 0; i < lineCount - 1; i++) {
		var perfectX = (i + 0.5) * averageLineWidth;
		var x = (width - remainingWidth) + lineWidths[i] / 2;

		var xWrap = Math.max((x - width) / WARPZONE_X + 1, 0);
		var deviationRatio = Math.min(Math.abs(x - perfectX) / maxDeviation, 1);

		var lineDelta = lineDeltas[i];
		var deltaDelta = (random() - 0.5) * LINE_DELTADELTA;
		lineDelta = lineDelta * (1 - deviationRatio) + deltaDelta;
		lineDeltas[i] = lineDelta = Math.max(Math.min(lineDelta, MAX_DELTA), -MAX_DELTA);

		var w = lineWidths[i] + lineDelta;
		w = remainingWidth / (lineCount - i) * xWrap + w * (1 - xWrap);
		var newWidth = initLineWidths[i] * yWrap + w * (1 - yWrap);

		lineWidths[i] = newWidth;
		remainingWidth -= newWidth;
	}
	lineWidths[lineCount - 1] = remainingWidth;
}

function buildLineColors(lineCount) {
	var color1 = randowBrown(), color2 = darkerColor(color1);
	var brightDarkRegularity = randomBetween(BRIGHT_DARK_REGULARITY[0], BRIGHT_DARK_REGULARITY[1]);
	var color = [0,0,0];
	var lineColors = [];
	for (var i = lineCount - 1; i >= 0; i--) {
		var ratio = i % 2 ? 1 - random() * brightDarkRegularity : 0 + random() * brightDarkRegularity;

		for (var c = 0; c < 3; c++) color[c] = ratio * color1[c] + (1 - ratio) * color2[c];
		var rgb = '#';
		for (var c = 0; c < 3; c++) rgb += ('0' + (Math.round(color[c] * 255)).toString(16)).slice(-2);
		lineColors[i] = rgb;
	}
	return lineColors;
}

function drawWood(canvas, colorSeed, patternSeed, pixelRatio) {
	setRandomSeed(patternSeed);
	averageLineWidth = randomBetween(1.2, 2.4) * pixelRatio;
	maxDeviation = randomBetween(1, 2.5) * averageLineWidth;
	var lineDeltas = [];
	var initLineWidths = buildLineWidths(canvas.width, lineDeltas);
	var lineCount = initLineWidths.length;

	setRandomSeed(colorSeed);
	var initLineColors = buildLineColors(lineCount);

	setRandomSeed(patternSeed);
	var lineWidths = initLineWidths.concat();
	var ctx = canvas.getContext('2d');

	for (var y = 0; y < canvas.height; y++) {
		var x = 0;
		for (var i = 0; i < lineCount; i++) {
			ctx.fillStyle = initLineColors[i]
			var width = lineWidths[i];
			ctx.fillRect(x, y, width + 1, 1);
			x += width;
		}
		makeLinesVary(initLineWidths, lineWidths, lineDeltas, canvas.width, canvas.height, y);
	}
}

/**
 * Paints a canvas with a wood texture.
 *
 * @param {HTMLCanvasElement} canvas 
 * @param {number} colorSeed - numberbetween 0 and 1
 * @param {number} patternSeed - numberbetween 0 and 1
 * @param {number} pixelRatio - e.g. 1, 2, 3...
 */
exports.paintCanvas = function (canvas, colorSeed, patternSeed, pixelRatio) {
	drawWood(canvas, colorSeed, patternSeed, pixelRatio);
};
