var cheapSeed = require('./cheapSeed');
var random = cheapSeed.pseudoRandom;
var randomBetween = cheapSeed.pseudoRandomBetween;

var RED = 0, GREEN = 1, BLUE = 2;

var AVERAGE_LINE_WIDTH_PX = 1.2; // decides how many vertical lines we have
var LINE_DELTADELTA = 0.1;
var MAX_DELTA = 0.25; // +/- max variation each line can move per pixel

var GREEN_RED_RATIO = [0.47, 0.8]; // 0 allows red; 1 allows yellow
var BLUE_GREEN_RATIO = [0.5, 0.9]; // 0 allows yellow; 1 allows pink

var DARKER_RATIO = [0.75, 0.9]; // 0 makes black; 1 gives same color
var BRIGHT_DARK_REGULARITY = [0.2, 0.5]; // 0 makes total alternance bright/dark; 1 makes complete random


function randowBrown() {
	var color = [];
	color[RED] = 1;
	var g = color[GREEN] = randomBetween(GREEN_RED_RATIO[0], GREEN_RED_RATIO[1]);
	color[BLUE] = randomBetween(g * BLUE_GREEN_RATIO[0], g * BLUE_GREEN_RATIO[1]);
	return color;
}

function darkerColor(base) {
	var color = [0, 0, 0];
	for (var c = 0; c < 3; c++) {
		var ratio = randomBetween(DARKER_RATIO[0], DARKER_RATIO[1]);
		color[c] = base[c] * ratio;
	}
	return color;
}

function buildLineWidths(width, lineDeltas) {
	var lineCount = ~~(width / AVERAGE_LINE_WIDTH_PX);
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
	var yRatio = Math.min(y, height - y) / height;

	for (var i = 0; i < lineCount - 1; i++) {
		var deltaDelta = (random() - 0.5) * LINE_DELTADELTA;
		lineDeltas[i] = Math.max(Math.min(lineDeltas[i] + deltaDelta, MAX_DELTA), -MAX_DELTA);
		var newWidth = (remainingWidth / (lineCount - i) + (lineWidths[i] + lineDeltas[i])) / 2;
		lineWidths[i] = initLineWidths[i] * (1 - yRatio) + newWidth * yRatio;
		remainingWidth -= lineWidths[i];
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

function drawWood(canvas) {
	var lineDeltas = [];
	var initLineWidths = buildLineWidths(canvas.width, lineDeltas);
	var lineCount = initLineWidths.length;
	var initLineColors = buildLineColors(lineCount);
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

exports.paintCanvas = function (canvas, randomSeed) {
	cheapSeed.setRandomSeed(randomSeed);
	drawWood(canvas);
};
