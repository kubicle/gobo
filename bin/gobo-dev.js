(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.gobo = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var wood_js_1 = require("./wood.js");
var cheapSeed_1 = require("./cheapSeed");
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
    BoardRenderer.prototype.changeLook = function (options) {
        if (options.isSketch !== undefined)
            this.onlySketch = options.isSketch;
        if (options.noCoords !== undefined) {
            this.withCoords = !options.noCoords;
            this.computeDimensions();
        }
        if (options.simpleStones !== undefined) {
            this.withSimpleStones = options.simpleStones;
            if (!this.onlySketch)
                this.prepareStonePatterns();
        }
        if (options.background !== undefined || options.patternSeed !== undefined) {
            if (options.background !== undefined)
                this.bgOption = options.background;
            if (options.patternSeed !== undefined)
                this.randomSeed = options.patternSeed;
            this.prepareBackground();
        }
    };
    BoardRenderer.prototype.setSize = function (widthPx, heightPx) {
        if (!widthPx) {
            console.error('Invalid gobo widthPx: ' + widthPx);
            widthPx = 100;
        }
        var width = widthPx * this.pxRatio;
        var height = (heightPx || widthPx) * this.pxRatio;
        if (width === this.boardWidth && height === this.boardHeight)
            return false; // unchanged
        this.boardWidth = width;
        this.boardHeight = height;
        return true; // changed
    };
    BoardRenderer.prototype.prepare = function (logicalBoard) {
        this.logicalBoard = logicalBoard;
        this.computeDimensions();
        if (!this.onlySketch)
            this.prepareStonePatterns();
        this.prepareBackground();
        this.createMainCanvas();
        return this.mainCanvas;
    };
    // NB: this clears canvas' content so one has to call render too
    BoardRenderer.prototype.resizeBoard = function (widthPx, heightPx) {
        if (!this.setSize(widthPx, heightPx))
            return;
        this.computeDimensions();
        if (!this.onlySketch)
            this.prepareStonePatterns();
        this.mainCanvas.width = this.boardWidth;
        this.mainCanvas.height = this.boardHeight;
    };
    BoardRenderer.prototype.renderAll = function () {
        this.useMainCanvas();
        this.drawBackground();
        this.drawGrid();
        this.drawStarPoints();
        if (this.withCoords)
            this.drawCoordinates();
        this.drawAllObjects();
    };
    BoardRenderer.prototype.getCanvas = function () {
        return this.mainCanvas;
    };
    BoardRenderer.prototype.createMainCanvas = function () {
        this.mainCanvas = document.createElement('canvas');
        this.mainCanvas.width = this.boardWidth;
        this.mainCanvas.height = this.boardHeight;
    };
    BoardRenderer.prototype.useMainCanvas = function () {
        this.ctx = this.mainCanvas.getContext('2d');
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    };
    BoardRenderer.prototype.createAndUseCanvas = function (width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        this.ctx = canvas.getContext('2d');
        return canvas;
    };
    BoardRenderer.prototype.computeDimensions = function () {
        var squareSize = Math.min(this.boardWidth, this.boardHeight);
        this.boardSize = this.logicalBoard.boardSize;
        if (this.withCoords) {
            this.vertexSize = (squareSize - 2 * this.gridExtraMargin) / (this.boardSize + 2);
            if (this.vertexSize > MAX_COORD_FONTSIZE_PX * this.pxRatio) {
                this.coordFontPx = MAX_COORD_FONTSIZE_PX * this.pxRatio;
                this.vertexSize = (squareSize - 2 * this.gridExtraMargin - 2 * this.coordFontPx) / this.boardSize;
            }
            else {
                this.coordFontPx = this.vertexSize;
            }
            this.gridMargin = this.gridExtraMargin + this.coordFontPx;
        }
        else {
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
    };
    /**
     * Converts coordinates from pixels to grid
     * @param x - origin 0,0 is top-left corner of the canvas
     * @param y
     * @returns [i, j] - with 0,0 as bottom-left corner of the grid
     */
    BoardRenderer.prototype.pixelToGridCoords = function (x, y) {
        var i = Math.round((x - this.vertexLeft) / this.vertexSize);
        var j = Math.round((this.vertexBottom - y) / this.vertexSize);
        return [i, j];
    };
    BoardRenderer.prototype.prepareBackground = function () {
        if (this.bgCanvasOption) {
            this.bgCanvas = this.bgCanvasOption;
        }
        else if (!this.bgOption) {
            this.bgColorRgb = DEFAULT_BACKGROUND_COLOR;
            this.bgCanvas = null;
        }
        else if (this.bgOption[0] === '#' || this.bgOption.substr(0, 3).toLowerCase() === 'rgb') {
            this.bgColorRgb = this.bgOption;
            this.bgCanvas = null;
        }
        else if (this.bgOption === 'wood') {
            if (this.onlySketch)
                return; // ignore if sketch mode
            var canvas = this.bgCanvas = document.createElement('canvas');
            canvas.width = canvas.height = 200 * this.pxRatio;
            wood_js_1.paintCanvas(canvas, this.randomSeed, this.randomSeed, this.pxRatio);
        }
    };
    BoardRenderer.prototype.prepareStonePatterns = function () {
        cheapSeed_1.setRandomSeed(this.randomSeed);
        var size = this.vertexSize;
        var center = size / 2;
        this.stoneShadow = this.createAndUseCanvas(size, size);
        this.drawStoneShadow(center, center);
        this.slateStones = [];
        this.shellStones = [];
        if (this.withSimpleStones) {
            this.slateStones.push(this.createAndUseCanvas(size, size));
            this.drawSlateStone(center, center, this.stoneRadius);
            this.shellStones.push(this.createAndUseCanvas(size, size));
            this.drawShellStone(center, center, this.stoneRadius);
        }
        else {
            for (var i = SLATE_STONE_COUNT - 1; i >= 0; i--) {
                this.slateStones.push(this.createAndUseCanvas(size, size));
                this.drawSlateStone(center, center, this.stoneRadius);
            }
            for (var i = 9 * SHELL_3x3GRID_COUNT - 1; i >= 0; i--) {
                this.shellStones.push(this.createAndUseCanvas(size, size));
                this.drawShellStone(center, center, this.stoneRadius);
            }
            // So that each "repaint" shows the same pattern for a given stone position, pre-decides pattern indexes
            this.slatePatternIndexes = [];
            for (var j = 0; j < this.boardSize; j++) {
                var row = this.slatePatternIndexes[j] = [];
                for (var i = 0; i < this.boardSize; i++) {
                    row.push(~~(cheapSeed_1.pseudoRandom() * SLATE_STONE_COUNT));
                }
            }
            this.shellPatternIndexes = [];
            for (var j = 0; j < this.boardSize; j++) {
                var row = this.shellPatternIndexes[j] = [];
                for (var i = 0; i < this.boardSize; i++) {
                    var indexIn3x3 = i % 3 + 3 * (j % 3);
                    var whichGrid = (i % 6 < 3) === (j % 6 < 3) ? 0 : 1;
                    var index = indexIn3x3 + 9 * whichGrid;
                    row.push(index);
                }
            }
        }
        this.miniShell = this.createAndUseCanvas(size, size);
        this.drawShellStone(center, center, this.stoneRadius / 2);
        this.miniSlate = this.createAndUseCanvas(size, size);
        this.drawSlateStone(center, center, this.stoneRadius / 2);
    };
    BoardRenderer.prototype.setBackgroundFillStyle = function () {
        if (this.bgCanvas) {
            this.ctx.fillStyle = this.ctx.createPattern(this.bgCanvas, 'repeat');
        }
        else {
            this.ctx.fillStyle = this.bgColorRgb;
        }
    };
    BoardRenderer.prototype.drawBackground = function () {
        this.setBackgroundFillStyle();
        this.ctx.fillRect(0, 0, this.boardWidth, this.boardHeight);
    };
    BoardRenderer.prototype.drawGrid = function () {
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (var n = 0; n < this.boardSize; n++) {
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
        var points = starPoints[this.boardSize];
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
        this.ctx.fillStyle = '#000';
        this.ctx.font = this.coordFontPx + "px Arial";
        var letters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
        var distFromVertex = this.stoneRadius + this.gridMargin / 2;
        // Horizontal - column names
        var x = this.vertexLeft;
        var y1 = this.vertexTop - distFromVertex;
        var y2 = this.vertexBottom + distFromVertex;
        for (var n = 0; n < this.boardSize; n++) {
            this.ctx.fillText(letters[n], x, y1);
            this.ctx.fillText(letters[n], x, y2);
            x += this.vertexSize;
        }
        // Vertical - row numbers
        var x1 = this.vertexLeft - distFromVertex;
        var x2 = this.vertexRight + distFromVertex;
        var y = this.vertexTop;
        for (var n = 0; n < this.boardSize; n++) {
            var rowNumber = (this.boardSize - n).toString();
            this.ctx.fillText(rowNumber, x1, y);
            this.ctx.fillText(rowNumber, x2, y);
            y += this.vertexSize;
        }
    };
    // Stones, marks, labels
    BoardRenderer.prototype.drawAllObjects = function () {
        var levelCount = this.onlySketch ? 1 : 2;
        for (var level = 0; level < levelCount; level++) {
            for (var j = 0; j < this.boardSize; j++) {
                for (var i = 0; i < this.boardSize; i++) {
                    this.renderAt(i, j, level);
                }
            }
        }
    };
    BoardRenderer.prototype.renderAt = function (i, j, level) {
        var x = i * this.vertexSize + this.vertexLeft;
        var y = this.vertexBottom - j * this.vertexSize;
        var vertex = this.logicalBoard.getVertex(i, j);
        if (vertex.stoneColor !== -1 /* EMPTY */) {
            if (level === 0 && !this.onlySketch) {
                this.renderStoneShadow(x, y);
            }
            else {
                this.renderStoneAt(x, y, vertex.stoneColor, i, j);
            }
        }
        if (vertex.stoneColor === -1 /* EMPTY */ || level === 1 || this.onlySketch) {
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
        if (this.onlySketch)
            return this.renderSketchStoneAt(x, y, color, this.stoneRadius);
        var stoneCollection, index;
        if (color === 0 /* BLACK */) {
            stoneCollection = this.slateStones;
            index = this.withSimpleStones ? 0 : this.slatePatternIndexes[j][i];
        }
        else {
            stoneCollection = this.shellStones;
            index = this.withSimpleStones ? 0 : this.shellPatternIndexes[j][i];
        }
        var img = stoneCollection[index];
        this.ctx.drawImage(img, x - this.stoneRadius, y - this.stoneRadius);
    };
    BoardRenderer.prototype.renderSketchStoneAt = function (x, y, color, radius) {
        this.ctx.fillStyle = color === 0 /* BLACK */ ? 'rgb(0,0,0)' : 'rgb(255,255,255)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 0.93, 0, 2 * Math.PI);
        this.ctx.fill();
    };
    BoardRenderer.prototype.renderMiniStoneAt = function (x, y, color, underStone) {
        if (this.onlySketch || underStone !== -1 /* EMPTY */) {
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
        if (!this.withSimpleStones) {
            var radiusOut = 0.8 - cheapSeed_1.pseudoRandom() * 0.2;
            var brightness = cheapSeed_1.pseudoRandom() * 40 + 76;
            var color = 10;
            var colorIn = 'rgb(' +
                ~~(cheapSeed_1.pseudoRandom() * color + brightness) + ',' +
                ~~(cheapSeed_1.pseudoRandom() * color + brightness) + ',' +
                ~~(cheapSeed_1.pseudoRandom() * color + brightness) + ')';
            this.drawLightReflexion(x, y, radius, colorIn, '#000', 0.01, radiusOut);
        }
        else {
            this.drawLightReflexion(x, y, radius, '#666', '#000', 0.01, 0.75);
        }
    };
    /**
     * @license Clamshell stones drawing algorithm based on Jan Prokop's WGo.js
     * (http://wgo.waltheri.net/)
     */
    BoardRenderer.prototype.drawShellStone = function (x, y, radius) {
        this.drawLightReflexion(x, y, radius, '#fff', '#aaa', 0.33, 1);
        if (!this.withSimpleStones) {
            var shellLines = SHELL_LINES[~~(cheapSeed_1.pseudoRandom() * 3)];
            var angle = cheapSeed_1.pseudoRandom() * 2 * Math.PI;
            var thickness = (1 + cheapSeed_1.pseudoRandom() * 1.5) * this.pxRatio;
            var factor = 0.2 + cheapSeed_1.pseudoRandom() * 0.3; // 0: lines are straight; 0.9: lines are very curvy
            this.drawShell(x, y, radius, angle, shellLines, factor, thickness);
        }
    };
    BoardRenderer.prototype.drawShell = function (x, y, radius, angle, lines, factor, thickness) {
        var fromAngle = angle;
        var toAngle = angle;
        for (var i = 0; i < lines.length; i++) {
            fromAngle += lines[i];
            toAngle -= lines[i];
            var alpha = cheapSeed_1.pseudoRandom() * (SHELL_LINE_ALPHA_MAX - SHELL_LINE_ALPHA_MIN) + SHELL_LINE_ALPHA_MIN;
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
        var ctx = this.ctx;
        var markAndParams = vertex.mark.split(':');
        var mark = markAndParams[0];
        var params = markAndParams.length > 1 ? markAndParams[1].split(',') : [];
        var size = (parseInt(params[0]) / 10 || 1) * this.markSize;
        var half = size / 2;
        var lineWidth = (parseInt(params[1]) || 5) * size / 24;
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
                ctx.fillText('*', x, y + this.fontPx * 0.42);
                break;
            case 'X':
                ctx.strokeStyle = this.prepareForDrawingOver(x, y, vertex);
                ctx.lineWidth = lineWidth;
                this.drawCrossMark(x, y, half);
                break;
            case '+':
                ctx.strokeStyle = this.prepareForDrawingOver(x, y, vertex);
                ctx.lineWidth = lineWidth;
                this.drawPlusMark(x, y, half);
                break;
            case 'V':
            case 'A':
                ctx.strokeStyle = this.prepareForDrawingOver(x, y, vertex);
                ctx.lineWidth = lineWidth;
                this.drawTriangleMark(x, y, half, mark === 'V' ? 1 : -1);
                break;
            case '+?':
                ctx.fillStyle = '#888';
                ctx.fillRect(x - half, y - half, size, size);
                break;
            case '+Bo':
            case '+Wo':
                this.renderMiniStoneAt(x, y, mark[1] === 'B' ? 0 /* BLACK */ : 1 /* WHITE */, vertex.stoneColor);
                break;
            default:
                console.error('Unknown mark type: ' + vertex.mark);
        }
    };
    BoardRenderer.prototype.drawCrossMark = function (x, y, ray) {
        var ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x - ray, y - ray);
        ctx.lineTo(x + ray, y + ray);
        ctx.moveTo(x + ray, y - ray);
        ctx.lineTo(x - ray, y + ray);
        ctx.stroke();
    };
    BoardRenderer.prototype.drawPlusMark = function (x, y, ray) {
        var ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x - ray, y);
        ctx.lineTo(x + ray, y);
        ctx.moveTo(x, y - ray);
        ctx.lineTo(x, y + ray);
        ctx.stroke();
    };
    BoardRenderer.prototype.drawTriangleMark = function (x, y, ray, scaleY) {
        var triangleX = ray * 1.04;
        var triangleY = ray * 0.6 * scaleY;
        var ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x, y + ray * scaleY);
        ctx.lineTo(x - triangleX, y - triangleY);
        ctx.lineTo(x + triangleX, y - triangleY);
        ctx.lineTo(x, y + ray * scaleY);
        ctx.lineTo(x - triangleX, y - triangleY);
        ctx.stroke();
    };
    BoardRenderer.prototype.drawLabelAt = function (x, y, vertex, label) {
        this.ctx.fillStyle = this.prepareForDrawingOver(x, y, vertex);
        if (vertex.style)
            this.ctx.fillStyle = vertex.style;
        var largeCharCount = label.replace(THIN_CHAR_REGEXP, '').length;
        var thinCharCount = label.length - largeCharCount;
        var estimatedWidth = largeCharCount + 0.5 * thinCharCount;
        var factor = 1.2 - 0.2 * estimatedWidth;
        var fontSize = Math.max(this.fontPx * factor, MIN_FONTSIZE_PX * this.pxRatio);
        this.ctx.font = fontSize + "px Arial";
        // Most labels will not use letters going under the baseline (like "j" VS "A")
        // so we "cheat" by moving all our labels down 5%; it should look better.
        var adjustY = fontSize * 0.05;
        this.ctx.fillText(label, x, y + adjustY);
    };
    return BoardRenderer;
}());
exports.BoardRenderer = BoardRenderer;

},{"./cheapSeed":5,"./wood.js":6}],2:[function(require,module,exports){
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
    Gobo.prototype.changeLook = function (options) {
        this.renderer.changeLook(options);
    };
    Gobo.prototype.resize = function (widthPx, heightPx) {
        this.renderer.resizeBoard(widthPx, heightPx);
    };
    Gobo.prototype.render = function () {
        this.renderer.renderAll();
    };
    Gobo.prototype.setStoneAt = function (i, j, color) {
        this.board.setStone(i, j, color);
    };
    Gobo.prototype.clearVertexAt = function (i, j) {
        this.board.clearVertex(i, j);
    };
    Gobo.prototype.getStoneColorAt = function (i, j) {
        return this.board.getVertex(i, j).stoneColor;
    };
    Gobo.prototype.setLabelAt = function (i, j, label, style) {
        this.board.setLabel(i, j, label, style);
    };
    Gobo.prototype.getLabelAt = function (i, j) {
        return this.board.getVertex(i, j).label;
    };
    Gobo.prototype.getStyleAt = function (i, j) {
        return this.board.getVertex(i, j).style;
    };
    Gobo.prototype.setMarkAt = function (i, j, mark) {
        this.board.setMark(i, j, mark);
    };
    Gobo.prototype.getMarkAt = function (i, j) {
        return this.board.getVertex(i, j).mark;
    };
    // Converts canvas to Gobo coordinates
    Gobo.prototype.pixelToGridCoordinates = function (x, y) {
        return this.renderer.pixelToGridCoords(x, y);
    };
    return Gobo;
}());
exports.Gobo = Gobo;

},{"./BoardRenderer":1,"./LogicalBoard":3}],3:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Vertex_1 = require("./Vertex");
var LogicalBoard = (function () {
    function LogicalBoard(boardSize) {
        this.boardSize = boardSize;
        this.vertexes = new Array(boardSize);
        for (var j = 0; j < boardSize; j++) {
            this.vertexes[j] = new Array(boardSize);
            for (var i = 0; i < boardSize; i++) {
                this.vertexes[j][i] = new Vertex_1.Vertex();
            }
        }
    }
    LogicalBoard.prototype.getVertex = function (i, j) {
        var vertex = this.vertexes[j][i];
        if (!vertex)
            throw new Error('Invalid coordinates: ' + i + ',' + j);
        return vertex;
    };
    LogicalBoard.prototype.clearVertex = function (i, j) {
        this.getVertex(i, j).clearVertex();
    };
    LogicalBoard.prototype.setStone = function (i, j, color) {
        this.getVertex(i, j).setStone(color);
    };
    LogicalBoard.prototype.setLabel = function (i, j, label, style) {
        var vertex = this.getVertex(i, j);
        vertex.setLabel(label);
        if (style)
            vertex.setStyle(style);
    };
    LogicalBoard.prototype.setMark = function (i, j, mark) {
        this.getVertex(i, j).setMark(mark);
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
        this.clearVertex();
    }
    Vertex.prototype.clearVertex = function () {
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
            ctx.fillStyle = initLineColors[i];
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

},{"./cheapSeed":5}]},{},[2])(2)
});