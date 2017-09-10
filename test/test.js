(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.gobo = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var wood_js_1 = require("./wood.js");
var starPoints = {
    9: [[5, 5]],
    13: [[4, 4], [10, 4], [4, 10], [10, 10]],
    19: [[4, 4], [10, 4], [16, 4], [4, 10], [10, 10], [16, 10], [4, 16], [10, 16], [16, 16]]
};
var DEFAULT_BACKGROUND_COLOR = '#c75';
var DEFAULT_MARGIN_PX = 5;
var MAX_COORD_FONTSIZE_PX = 10; // NB: coordinates have no minimum since they must align with the grid
var MIN_FONTSIZE_PX = 12;
var THIN_CHAR_REGEXP = /[.,:;|`'!]/g;
var DIST_SHADOW = 0.25; // px * stone radius
var SLATE_STONE_COUNT = 11;
// Shell stones need much more randomness to look natural to human eye.
// We use 9x9 grids that we "apply" on the board with a chessboard-like pattern: 1212 on row #1, then 2121 on row #2 etc.
// A more complex algorithm is needed if we want to use more grids - or if we want to spread stones without using grids.
var SHELL_3x3GRID_COUNT = 2;
var SHELL_LINES = [
    [0.10, 0.09, 0.08, 0.07, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06],
    [0.10, 0.12, 0.11, 0.10, 0.09, 0.09, 0.09, 0.09],
    [0.12, 0.14, 0.13, 0.12, 0.12, 0.12]
];
var SHELL_LINE_ALPHA_MIN = 0; // 0.2 make the line quite "grey"; 0.05 makes it very light
var SHELL_LINE_ALPHA_MAX = 0.15;
var BoardRenderer = (function () {
    function BoardRenderer(options) {
        this.width = options.widthPx;
        this.height = options.heightPx || options.widthPx;
        if (!options.widthPx) {
            console.error('Invalid gobo widthPx: ' + options.widthPx);
            this.width = this.height = 100;
        }
        this.isSketch = !!options.isSketch;
        this.withCoords = !options.noCoords;
        this.gridExtraMargin = options.marginPx || DEFAULT_MARGIN_PX;
        this.backgroundCanvas = options.backgroundCanvas;
        this.background = options.background;
    }
    BoardRenderer.prototype.prepare = function (logicalBoard) {
        this.logicalBoard = logicalBoard;
        this.computeDimensions();
        if (!this.isSketch)
            this.prepareStonePatterns();
        this.createMainCanvas();
        this.prepareBackground();
        return this.canvas;
    };
    BoardRenderer.prototype.render = function () {
        this.drawBackground();
        this.drawGrid();
        this.drawStarPoints();
        if (this.withCoords)
            this.drawCoordinates();
        this.drawAllObjects();
    };
    BoardRenderer.prototype.getCanvas = function () {
        return this.canvas;
    };
    BoardRenderer.prototype.createMainCanvas = function () {
        this.createCanvas(this.width, this.height);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    };
    BoardRenderer.prototype.createCanvas = function (width, height) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        return this.canvas;
    };
    BoardRenderer.prototype.computeDimensions = function () {
        var squareSize = Math.min(this.width, this.height);
        this.gobanSize = this.logicalBoard.gobanSize;
        if (this.withCoords) {
            this.vertexSize = (squareSize - 2 * this.gridExtraMargin) / (this.gobanSize + 2);
            if (this.vertexSize > MAX_COORD_FONTSIZE_PX) {
                this.coordFontSize = MAX_COORD_FONTSIZE_PX;
                this.vertexSize = (squareSize - 2 * this.gridExtraMargin - 2 * this.coordFontSize) / this.gobanSize;
            }
            else {
                this.coordFontSize = this.vertexSize;
            }
            this.gridMargin = this.gridExtraMargin + this.coordFontSize;
        }
        else {
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
    };
    /**
     * Converts coordinates from pixels to grid
     * @param x - origin 0,0 is top-left corner of the canvas
     * @param y
     * @returns [i, j] - with 0,0 as bottom-left corner of the grid
     */
    BoardRenderer.prototype.pixelToGridCoordinates = function (x, y) {
        var i = Math.round((x - this.vertexLeft) / this.vertexSize);
        var j = Math.round((this.vertexBottom - y) / this.vertexSize);
        return [i, j];
    };
    BoardRenderer.prototype.prepareBackground = function () {
        if (this.backgroundCanvas)
            return;
        if (!this.background) {
            this.backgroundColor = DEFAULT_BACKGROUND_COLOR;
        }
        else if (this.background[0] === '#' || this.background.substr(0, 3).toLowerCase() === 'rgb') {
            this.backgroundColor = this.background;
        }
        else if (this.background === 'wood') {
            if (this.isSketch || this.backgroundCanvas)
                return; // ignore if canvas is passed or sketch mode
            var canvas = this.backgroundCanvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            wood_js_1.paintCanvas(canvas, Math.random());
        }
    };
    BoardRenderer.prototype.prepareStonePatterns = function () {
        var size = this.vertexSize;
        var center = size / 2;
        this.stoneShadow = this.createCanvas(size, size);
        this.drawStoneShadow(center, center);
        this.slateStones = [];
        for (var i = SLATE_STONE_COUNT - 1; i >= 0; i--) {
            this.slateStones.push(this.createCanvas(size, size));
            this.drawSlateStone(center, center, this.stoneRadius);
        }
        this.shellStones = [];
        for (var i = 9 * SHELL_3x3GRID_COUNT - 1; i >= 0; i--) {
            this.shellStones.push(this.createCanvas(size, size));
            this.drawShellStone(center, center, this.stoneRadius);
        }
        // So that each "repaint" shows the same pattern for a given stone position, pre-decides pattern indexes
        this.slatePatternIndexes = [];
        for (var j = 0; j < this.gobanSize; j++) {
            var row = this.slatePatternIndexes[j] = [];
            for (var i = 0; i < this.gobanSize; i++) {
                row.push(~~(Math.random() * SLATE_STONE_COUNT));
            }
        }
        this.shellPatternIndexes = [];
        for (var j = 0; j < this.gobanSize; j++) {
            var row = this.shellPatternIndexes[j] = [];
            for (var i = 0; i < this.gobanSize; i++) {
                var indexIn3x3 = i % 3 + 3 * (j % 3);
                var whichGrid = (i % 6 < 3) === (j % 6 < 3) ? 0 : 1;
                var index = indexIn3x3 + 9 * whichGrid;
                row.push(index);
            }
        }
        this.miniShell = this.createCanvas(size, size);
        this.drawShellStone(center, center, this.stoneRadius / 2);
        this.miniSlate = this.createCanvas(size, size);
        this.drawSlateStone(center, center, this.stoneRadius / 2);
    };
    BoardRenderer.prototype.setBackgroundFillStyle = function () {
        if (this.backgroundCanvas) {
            this.ctx.fillStyle = this.ctx.createPattern(this.backgroundCanvas, 'repeat');
        }
        else {
            this.ctx.fillStyle = this.backgroundColor;
        }
    };
    BoardRenderer.prototype.drawBackground = function () {
        this.setBackgroundFillStyle();
        this.ctx.fillRect(0, 0, this.width, this.height);
    };
    BoardRenderer.prototype.drawGrid = function () {
        this.ctx.strokeStyle = '#000';
        this.ctx.beginPath();
        for (var n = 0; n < this.gobanSize; n++) {
            // Vertical lines
            var x = this.vertexLeft + n * this.vertexSize;
            this.ctx.moveTo(x, this.vertexTop);
            this.ctx.lineTo(x, this.vertexBottom);
            // Horizontal lines
            var y = this.vertexTop + n * this.vertexSize;
            this.ctx.moveTo(this.vertexLeft, y);
            this.ctx.lineTo(this.vertexRight, y);
        }
        this.ctx.stroke();
    };
    BoardRenderer.prototype.drawStarPoints = function () {
        this.ctx.fillStyle = '#000';
        var points = starPoints[this.gobanSize];
        if (!points)
            return;
        for (var n = 0; n < points.length; n++) {
            var coords = points[n];
            var x = (coords[0] - 1) * this.vertexSize + this.vertexLeft;
            var y = (coords[1] - 1) * this.vertexSize + this.vertexTop;
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.vertexSize / 9, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    };
    BoardRenderer.prototype.drawCoordinates = function () {
        this.ctx.font = this.coordFontSize + "px Arial";
        var letters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
        var distFromVertex = this.stoneRadius + this.gridMargin / 2;
        // Horizontal - column names
        var x = this.vertexLeft;
        var y1 = this.vertexTop - distFromVertex;
        var y2 = this.vertexBottom + distFromVertex;
        for (var n = 0; n < this.gobanSize; n++) {
            this.ctx.fillText(letters[n], x, y1);
            this.ctx.fillText(letters[n], x, y2);
            x += this.vertexSize;
        }
        // Vertical - row numbers
        var x1 = this.vertexLeft - distFromVertex;
        var x2 = this.vertexRight + distFromVertex;
        var y = this.vertexTop;
        for (var n = 0; n < this.gobanSize; n++) {
            var rowNumber = (this.gobanSize - n).toString();
            this.ctx.fillText(rowNumber, x1, y);
            this.ctx.fillText(rowNumber, x2, y);
            y += this.vertexSize;
        }
    };
    // Stones, marks, labels
    BoardRenderer.prototype.drawAllObjects = function () {
        var levelCount = this.isSketch ? 1 : 2;
        for (var level = 0; level < levelCount; level++) {
            for (var j = 0; j < this.gobanSize; j++) {
                for (var i = 0; i < this.gobanSize; i++) {
                    this.renderAt(i, j, level);
                }
            }
        }
    };
    BoardRenderer.prototype.renderAt = function (i, j, level) {
        var x = i * this.vertexSize + this.vertexLeft;
        var y = this.vertexBottom - j * this.vertexSize;
        var vertex = this.logicalBoard.getVertexAt(i, j);
        if (vertex.stoneColor !== -1 /* EMPTY */) {
            if (level === 0 && !this.isSketch) {
                this.renderStoneShadow(x, y);
            }
            else {
                this.renderStoneAt(x, y, vertex.stoneColor, i, j);
            }
        }
        if (vertex.stoneColor === -1 /* EMPTY */ || level === 1 || this.isSketch) {
            if (vertex.mark) {
                this.drawMarkAt(x, y, vertex);
            }
            if (vertex.label) {
                this.drawLabelAt(x, y, vertex, vertex.label);
            }
        }
    };
    BoardRenderer.prototype.renderStoneShadow = function (x, y) {
        var dist = this.stoneRadius * DIST_SHADOW;
        var r = this.stoneRadius - dist;
        this.ctx.drawImage(this.stoneShadow, x - r, y - r);
    };
    BoardRenderer.prototype.renderStoneAt = function (x, y, color, i, j) {
        if (this.isSketch)
            return this.renderSketchStoneAt(x, y, color, this.stoneRadius);
        var img;
        if (color === 0 /* BLACK */) {
            img = this.slateStones[this.slatePatternIndexes[j][i]];
        }
        else {
            img = this.shellStones[this.shellPatternIndexes[j][i]];
        }
        this.ctx.drawImage(img, x - this.stoneRadius, y - this.stoneRadius);
    };
    BoardRenderer.prototype.renderSketchStoneAt = function (x, y, color, radius) {
        this.ctx.fillStyle = color === 0 /* BLACK */ ? 'rgb(0,0,0)' : 'rgb(255,255,255)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 0.93, 0, 2 * Math.PI);
        this.ctx.fill();
    };
    BoardRenderer.prototype.renderMiniStoneAt = function (x, y, color, underStone) {
        if (this.isSketch || underStone !== -1 /* EMPTY */) {
            var radius = this.stoneRadius * 0.4;
            return this.renderSketchStoneAt(x, y, color, radius);
        }
        else {
            var radius = this.stoneRadius;
            var img = color === 0 /* BLACK */ ? this.miniSlate : this.miniShell;
            this.ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
        }
    };
    BoardRenderer.prototype.drawStoneShadow = function (x, y) {
        var blur = this.stoneRadius * 0.1;
        var radius = this.stoneRadius * 0.95;
        var gradient = this.ctx.createRadialGradient(x, y, radius - 1 - blur, x, y, radius + blur);
        gradient.addColorStop(0, 'rgba(32,32,32,0.5)');
        gradient.addColorStop(1, 'rgba(62,62,62,0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius + blur, 0, 2 * Math.PI, true);
        this.ctx.fill();
    };
    BoardRenderer.prototype.drawLightReflexion = function (x, y, radius, colorIn, colorOut, radiusIn, radiusOut) {
        var d = radius / 5;
        var radgrad = this.ctx.createRadialGradient(x - 2 * d, y - 2 * d, radiusIn * radius, x - d, y - d, radiusOut * radius);
        radgrad.addColorStop(0, colorIn);
        radgrad.addColorStop(1, colorOut);
        this.ctx.beginPath();
        this.ctx.fillStyle = radgrad;
        this.ctx.arc(x, y, radius * 0.95, 0, 2 * Math.PI, true);
        this.ctx.fill();
    };
    BoardRenderer.prototype.drawSlateStone = function (x, y, radius) {
        var radiusOut = 0.8 - Math.random() * 0.2;
        var brightness = Math.random() * 40 + 76;
        var color = 10;
        var colorIn = 'rgb(' +
            ~~(Math.random() * color + brightness) + ',' +
            ~~(Math.random() * color + brightness) + ',' +
            ~~(Math.random() * color + brightness) + ')';
        this.drawLightReflexion(x, y, radius, colorIn, '#000', 0.01, radiusOut);
    };
    /**
     * Clamshell stones drawing algorithm from Jan Prokop's WGo.js
     * (http://wgo.waltheri.net/)
     */
    BoardRenderer.prototype.drawShellStone = function (x, y, radius) {
        this.drawLightReflexion(x, y, radius, '#fff', '#aaa', 0.33, 1);
        var shellLines = SHELL_LINES[~~(Math.random() * 3)];
        var angle = Math.random() * 2 * Math.PI;
        var thickness = 1 + Math.random() * 1.5;
        var factor = 0.2 + Math.random() * 0.3; // 0: lines are straight; 0.9: lines are very curvy
        this.drawShell(x, y, radius, angle, shellLines, factor, thickness);
    };
    BoardRenderer.prototype.drawShell = function (x, y, radius, angle, lines, factor, thickness) {
        var fromAngle = angle;
        var toAngle = angle;
        for (var i = 0; i < lines.length; i++) {
            fromAngle += lines[i];
            toAngle -= lines[i];
            var alpha = Math.random() * (SHELL_LINE_ALPHA_MAX - SHELL_LINE_ALPHA_MIN) + SHELL_LINE_ALPHA_MIN;
            this.drawShellLine(x, y, radius, fromAngle, toAngle, factor, thickness, alpha);
        }
    };
    BoardRenderer.prototype.drawShellLine = function (x, y, radius, start_angle, end_angle, factor, thickness, alpha) {
        var ctx = this.ctx;
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
        }
        else if (x2 === x1) {
            angle = Math.PI / 2;
        }
        else {
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
    };
    BoardRenderer.prototype.prepareForDrawingOver = function (x, y, vertex) {
        switch (vertex.stoneColor) {
            case -1 /* EMPTY */:
                if (vertex.mark[0] !== '+') {
                    this.setBackgroundFillStyle();
                    var s = this.vertexSize * 0.8;
                    this.ctx.fillRect(x - s / 2, y - s / 2, s, s);
                }
                return '#000';
            case 0 /* BLACK */:
                return '#fff';
            case 1 /* WHITE */:
                return '#000';
        }
    };
    BoardRenderer.prototype.drawMarkAt = function (x, y, vertex) {
        switch (vertex.mark) {
            case '[]':
                this.ctx.strokeStyle = this.prepareForDrawingOver(x, y, vertex);
                this.ctx.lineWidth = 2.5;
                this.ctx.strokeRect(x - this.markSize / 2, y - this.markSize / 2, this.markSize, this.markSize);
                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = '#000';
                break;
            case 'O':
                this.ctx.strokeStyle = this.prepareForDrawingOver(x, y, vertex);
                this.ctx.lineWidth = 2.5;
                this.ctx.beginPath();
                this.ctx.arc(x, y, this.markSize / 2, 0, 2 * Math.PI);
                this.ctx.stroke();
                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = '#000';
                break;
            case '*':
                this.ctx.fillStyle = this.prepareForDrawingOver(x, y, vertex);
                this.ctx.font = (1.5 * this.fontSize) + "px Arial";
                this.ctx.fillText('*', x, y + this.fontSize * 0.35);
                break;
            case '+?':
                this.ctx.fillStyle = '#888';
                this.ctx.fillRect(x - this.markSize / 2, y - this.markSize / 2, this.markSize, this.markSize);
                break;
            case '+Bo':
            case '+Wo':
                this.renderMiniStoneAt(x, y, vertex.mark[1] === 'B' ? 0 /* BLACK */ : 1 /* WHITE */, vertex.stoneColor);
                break;
            default:
                console.error('Unknown mark type: ' + vertex.mark);
        }
    };
    BoardRenderer.prototype.drawLabelAt = function (x, y, vertex, label) {
        this.ctx.fillStyle = this.prepareForDrawingOver(x, y, vertex);
        if (vertex.style)
            this.ctx.fillStyle = vertex.style;
        var largeCharCount = label.replace(THIN_CHAR_REGEXP, '').length;
        var thinCharCount = label.length - largeCharCount;
        var estimatedWidth = largeCharCount + 0.5 * thinCharCount;
        var factor = 1.2 - 0.2 * estimatedWidth;
        var fontSize = Math.max(this.fontSize * factor, MIN_FONTSIZE_PX);
        this.ctx.font = fontSize + "px Arial";
        this.ctx.fillText(label, x, y);
    };
    return BoardRenderer;
}());
exports.BoardRenderer = BoardRenderer;

},{"./wood.js":6}],2:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var LogicalBoard_1 = require("./LogicalBoard");
var BoardRenderer_1 = require("./BoardRenderer");
var Gobo = (function () {
    function Gobo(options) {
        this.board = new LogicalBoard_1.LogicalBoard(options.gobanSize || 19);
        this.renderer = new BoardRenderer_1.BoardRenderer(options);
        this.canvas = this.renderer.prepare(this.board);
    }
    Gobo.prototype.render = function () {
        this.renderer.render();
    };
    Gobo.prototype.setStoneAt = function (i, j, color) {
        this.board.setStoneAt(i, j, color);
    };
    Gobo.prototype.clearVertexAt = function (i, j) {
        this.board.clearVertexAt(i, j);
    };
    Gobo.prototype.getStoneColorAt = function (i, j) {
        return this.board.getVertexAt(i, j).stoneColor;
    };
    Gobo.prototype.setLabelAt = function (i, j, label, style) {
        this.board.setLabelAt(i, j, label, style);
    };
    Gobo.prototype.setMarkAt = function (i, j, mark) {
        this.board.setMarkAt(i, j, mark);
    };
    // Converts canvas to Gobo coordinates
    Gobo.prototype.pixelToGridCoordinates = function (x, y) {
        return this.renderer.pixelToGridCoordinates(x, y);
    };
    return Gobo;
}());
exports.Gobo = Gobo;

},{"./BoardRenderer":1,"./LogicalBoard":3}],3:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Vertex_1 = require("./Vertex");
var LogicalBoard = (function () {
    function LogicalBoard(gobanSize) {
        this.gobanSize = gobanSize;
        this.vertexes = new Array(gobanSize);
        for (var j = 0; j < gobanSize; j++) {
            this.vertexes[j] = new Array(gobanSize);
            for (var i = 0; i < gobanSize; i++) {
                this.vertexes[j][i] = new Vertex_1.Vertex();
            }
        }
    }
    LogicalBoard.prototype.getVertexAt = function (i, j) {
        var vertex = this.vertexes[j][i];
        if (!vertex)
            throw new Error('Invalid coordinates: ' + i + ',' + j);
        return vertex;
    };
    LogicalBoard.prototype.clearVertexAt = function (i, j) {
        this.getVertexAt(i, j).clear();
    };
    LogicalBoard.prototype.setStoneAt = function (i, j, color) {
        this.getVertexAt(i, j).setStone(color);
    };
    LogicalBoard.prototype.setLabelAt = function (i, j, label, style) {
        var vertex = this.getVertexAt(i, j);
        vertex.setLabel(label);
        if (style)
            vertex.setStyle(style);
    };
    LogicalBoard.prototype.setMarkAt = function (i, j, mark) {
        this.getVertexAt(i, j).setMark(mark);
    };
    return LogicalBoard;
}());
exports.LogicalBoard = LogicalBoard;

},{"./Vertex":4}],4:[function(require,module,exports){
"use strict";
exports.__esModule = true;
;
var Vertex = (function () {
    function Vertex() {
        this.clear();
    }
    Vertex.prototype.clear = function () {
        this.stoneColor = -1 /* EMPTY */;
        this.label = '';
        this.mark = '';
    };
    Vertex.prototype.setStone = function (color) {
        this.stoneColor = color;
    };
    Vertex.prototype.setLabel = function (label) {
        this.label = label;
    };
    Vertex.prototype.setMark = function (mark) {
        this.mark = mark;
    };
    Vertex.prototype.setStyle = function (style) {
        this.style = style;
    };
    return Vertex;
}());
exports.Vertex = Vertex;

},{}],5:[function(require,module,exports){
/**
 * Seedable pseudo-random number generator.
 * 1,000,000,000 random numbers; thanks to http://www.hpmuseum.org/software/41/41ranjm.htm
 */
'use strict';
var randomSeed;
/**
 * Initializes the pseudo-random seed.
 * @param {number} seed - number between 0 and 1
 */
exports.setRandomSeed = function (seed) {
    if (!(seed >= 0 && seed <= 1))
        throw new Error('Seed must be between 0 and 1');
    randomSeed = seed;
};
/**
 * @returns {number} - the next pseudo-random number between 0 and 1
 */
exports.pseudoRandom = function () {
    var n = 43046721 * randomSeed + 0.236067977; // 9^8 xn + sqrt(5); simpler FRC(9821 xn + 0.211327) gives 1Mio numbers
    randomSeed = n - Math.floor(n);
    return randomSeed;
};
/**
 * @param {number} min
 * @param {number} max
 * @returns {number} - a pseudo-random number between min and max
 */
exports.pseudoRandomBetween = function (min, max) {
    return exports.pseudoRandom() * (max - min) + min;
};

},{}],6:[function(require,module,exports){
var cheapSeed = require('./cheapSeed');
var random = cheapSeed.pseudoRandom;
var randomBetween = cheapSeed.pseudoRandomBetween;
var RED = 0, GREEN = 1, BLUE = 2;
var AVERAGE_LINE_WIDTH_PX = 1.2; // decides how many vertical lines we have
var LINE_DELTADELTA = 0.55;
var MAX_DELTA = 0.95; // +/- max variation each line can move per pixel
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
    var color = [0, 0, 0];
    var lineColors = [];
    for (var i = lineCount - 1; i >= 0; i--) {
        var ratio = i % 2 ? 1 - random() * brightDarkRegularity : 0 + random() * brightDarkRegularity;
        for (var c = 0; c < 3; c++)
            color[c] = ratio * color1[c] + (1 - ratio) * color2[c];
        var rgb = '#';
        for (var c = 0; c < 3; c++)
            rgb += ('0' + (Math.round(color[c] * 255)).toString(16)).slice(-2);
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
            ctx.fillStyle = initLineColors[i];
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

},{"./cheapSeed":5}],7:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var LogicalBoard_1 = require("../src/LogicalBoard");
var BoardRenderer_1 = require("../src/BoardRenderer");
var Gobo_1 = require("../src/Gobo");
/**
 * A very simple example to start from.
 */
function runBasicTest() {
    var width = 400;
    var gobo = new Gobo_1.Gobo({ gobanSize: 9, widthPx: width, background: '#b75' });
    gobo.setStoneAt(2, 3, 0 /* BLACK */); // NB: BLACK is 0, WHITE is 1
    gobo.setStoneAt(5, 2, 1 /* WHITE */);
    gobo.setStoneAt(3, 6, 0 /* BLACK */);
    gobo.setStoneAt(5, 5, 1 /* WHITE */);
    gobo.render();
    createNewDiv(width).appendChild(gobo.canvas);
}
var GoboTest = (function () {
    function GoboTest(options) {
        this.board = new LogicalBoard_1.LogicalBoard(options.gobanSize || 19);
        this.renderer = new BoardRenderer_1.BoardRenderer(options);
        this.canvas = this.renderer.prepare(this.board);
    }
    // Tests
    GoboTest.prototype.testManyRenderings = function () {
        console.time('manyRenderings');
        this.addStoneAndRender(1000);
    };
    GoboTest.prototype.addStoneAndRender = function (count) {
        if (!count)
            return console.timeEnd('manyRenderings');
        var gsize = this.board.gobanSize;
        var r = Math.random();
        var color = r < 0.5 ? 0 /* BLACK */ : 1 /* WHITE */;
        this.board.setStoneAt(~~(Math.random() * gsize), ~~(Math.random() * gsize), color);
        this.renderer.render();
        setTimeout(this.addStoneAndRender.bind(this, count - 1));
    };
    GoboTest.prototype.testLabelsAndMarks = function () {
        this.board.setLabelAt(3, 3, 'A');
        this.board.setStoneAt(3, 5, 0 /* BLACK */);
        this.board.setLabelAt(3, 5, '1');
        this.board.setStoneAt(4, 4, 0 /* BLACK */);
        this.board.setStoneAt(5, 2, 1 /* WHITE */);
        this.board.setLabelAt(5, 2, '29');
        this.board.setStoneAt(5, 3, 0 /* BLACK */);
        this.board.setStoneAt(6, 5, 1 /* WHITE */);
        this.board.setLabelAt(6, 5, '9.9');
        this.board.setStoneAt(6, 4, 1 /* WHITE */);
        this.board.setLabelAt(6, 4, '299');
        this.board.setStoneAt(6, 3, 1 /* WHITE */);
        this.board.setStoneAt(6, 6, 1 /* WHITE */);
        this.board.setLabelAt(6, 6, '9999');
        this.board.setMarkAt(2, 8, '[]');
        this.board.setStoneAt(2, 7, 0 /* BLACK */);
        this.board.setMarkAt(2, 7, '[]');
        this.board.setStoneAt(3, 6, 1 /* WHITE */);
        this.board.setMarkAt(3, 6, '[]');
        this.board.setMarkAt(0, 8, 'O');
        this.board.setStoneAt(0, 7, 0 /* BLACK */);
        this.board.setMarkAt(0, 7, 'O');
        this.board.setStoneAt(1, 6, 1 /* WHITE */);
        this.board.setMarkAt(1, 6, 'O');
        this.renderer.render();
    };
    GoboTest.prototype.testFullWhiteBoard = function () {
        var gsize = this.board.gobanSize;
        for (var j = 0; j < gsize; j++) {
            for (var i = 0; i < gsize; i++) {
                this.board.setStoneAt(i, j, 1 /* WHITE */);
            }
        }
        this.renderer.render();
    };
    return GoboTest;
}());
function runTest(testName, params, goboOptions) {
    var width = params.width || 600;
    var div = createNewDiv(width);
    goboOptions = goboOptions || {};
    goboOptions.widthPx = width;
    goboOptions.background = goboOptions.background || '#864';
    if (params.image) {
        goboOptions.backgroundCanvas = loadImage(params.image, doTest.bind(null, div, goboOptions, testName));
    }
    else {
        doTest(div, goboOptions, testName);
    }
}
function createNewDiv(width) {
    var div = document.createElement('div');
    document.body.appendChild(div);
    div.style.width = div.style.height = width + 'px';
    div.style.marginBottom = '10px';
    return div;
}
function loadImage(image, cb) {
    var canvas = document.createElement('canvas');
    var img = new Image();
    img.src = image;
    img.onload = function () {
        img.onload = null;
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        cb();
    };
    return canvas;
}
function doTest(div, goboOptions, testName) {
    var goboTest = new GoboTest(goboOptions);
    div.appendChild(goboTest.canvas);
    goboTest[testName]();
}
var woodExample = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAACKUlEQVQ4T7WUXXLcMAyDQVKyszl1TtBr9g5ekeqAkvyTZvpW58UzO4E/EgDl96+vXovhVQoCHW8PHO+G6IHNCqwoPDo8Any2YvluIthLQYuO5oGiAhGB/D/BWhB9EjZHhCeNqcI7EEH+b4RW0PokNEH+PQgpGIHjFCxTsKcgH66H78qRT0GHmUJFb4IkjEvQw3NHJgrHFBSgmsE9oKop6D3Q3FFMIbgL0pQOvKPhaJEUW1GYGrw/CS/BsY40hSNfpig+a03H6PLbPb/8oQoxy93eR6Ygd7uRNvfuqEUh/dyh4lVqEh7eUrT3yPFMJSkYFZk7PAUzQlyTo5oCy5TNFK9tELZlSnfsqtBSzhwuwWXKNn9LwvsOGY8P/pguO97cYQ/sdG7u8EE4g/1vwTpI+LUxMnNYMgrLFBKW1RQVbHpBbKrAig3/cRAOMYr23nPpIpqVZIzo4ooNY5LvE4L55Acz2DlyEkaOe4QDS1AlzaIRolcOi2qG/BTMHU6X9xSsSdfCcfgQ3M0A1YwNCTk+ydJlkzweS5BQfJKQjSAhDWFIx8jAXsZeUpCEbAqpVg5vhH8J7tUyMkMw0GdTREew0+Vb9Xi+0uUZ7CG4Rq6WvXWfsXHGxnPkR2yWIGPDpsxIjabY1RR2ljuk4NghuzyOA4/AT11mg3KHM7t0/Kzej8GmIAnnRXl0OYOteTw8eFAclb1f1yarx+OQx3IRPq/N9y6P8zWuzVU9wR9BRU5H3DbiDgAAAABJRU5ErkJggg==';
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

},{"../src/BoardRenderer":1,"../src/Gobo":2,"../src/LogicalBoard":3}]},{},[7])(7)
});