(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//import { Gobo } from '../src/Gobo'; // for TS
var Gobo = window['gobo'].Gobo;
var BLACK = 0, WHITE = 1, EMPTY = -1;
function addIntro() {
    newDiv(document.body, 'title', 'gobo Tests & Samples');
    newDiv(document.body, 'subtitle', 'General Remarks');
    newDiv(document.body, 'intro', "These samples are given in JavaScript for the wider audience.\nThis html page contains a tag:");
    newDiv(document.body, 'codeInText', "<script src='../bin/gobo.js'></script>");
    newDiv(document.body, 'intro', "then you can simply do:");
    newDiv(document.body, 'codeInText', "var Gobo = window['gobo'].Gobo;");
    newDiv(document.body, 'intro', "...but you could of course load gobo differently.\n" +
        "For example in TypeScript you can simply import Gobo.\n\n" +
        "All examples below suppose the following constants are declared:");
    newDiv(document.body, 'codeInText', "var BLACK = 0, WHITE = 1, EMPTY = -1;");
    newDiv(document.body, 'intro', "For neat rendering on \"retina\" displays (when window.devicePixelRatio > 1),\n" +
        "you should pass pixelRatio to your Gobo object:");
    newDiv(document.body, 'codeInText', "new Gobo({ pixelRatio: window.devicePixelRatio,... })");
}
/**
 * A very simple example to start from.
 */
function basicTest() {
    var width = 300;
    var gobo = newGobo({ gobanSize: 5, widthPx: width, background: '#ea8' });
    gobo.setStoneAt(2, 1, WHITE);
    gobo.setStoneAt(2, 3, BLACK);
    gobo.setStoneAt(3, 1, WHITE);
    gobo.setStoneAt(3, 1, EMPTY);
    gobo.render();
    createSample(width, gobo.canvas, 'Basic Sample', 'A very simple example to start from.', "var gobo = new Gobo({\n    gobanSize: 5,\n    widthPx: 300,\n    background: '#ea8'\n});\n\ngobo.setStoneAt(2, 2, WHITE);\ngobo.setStoneAt(2, 3, BLACK);\ngobo.setStoneAt(3, 1, WHITE);\ngobo.setStoneAt(3, 1, EMPTY); // removes stone\n\ngobo.render();");
}
/**
 * Performance test
 */
function testManyRenderings() {
    var width = 512;
    var seed = ~~(Math.random() * 100000) / 100000; // so we can use this demo to find nice seeds
    var gobo = newGobo({ widthPx: width, background: 'wood', patternSeed: seed });
    var code = "var gobo = new Gobo({\n    widthPx: 512,\n    background: 'wood',\n    patternSeed: " + seed + " // for random patterns of wood & stones (0 < seed < 1)\n});\n\naddStoneAndRender(gobo, 1000);\n\nfunction addStoneAndRender(gobo, count) {\n    if (!count) return; // finished\n    gobo.setStoneAt(~~(Math.random() * 19), ~~(Math.random() * 19), Math.random() < 0.5 ? 0 : 1);\n    gobo.render();\n    setTimeout(addStoneAndRender, 0, gobo, count - 1);\n}";
    var textDiv = createSample(width, gobo.canvas, 'Performance Test', '1,000 "render" operations (full board is redrawn).', code).textDiv;
    var t0 = Date.now();
    addStoneAndRender(gobo, 1000, function () {
        var perRedraw = Math.round((Date.now() - t0) / 100) / 10;
        textDiv.innerText = code + ("\n\n=> " + perRedraw + "ms per redraw");
    });
}
function addStoneAndRender(gobo, count, cb) {
    if (!count)
        return cb();
    gobo.setStoneAt(~~(Math.random() * 19), ~~(Math.random() * 19), Math.random() < 0.5 ? 0 : 1);
    gobo.render();
    setTimeout(addStoneAndRender, 0, gobo, count - 1, cb);
}
/**
 * Labels & marks, sketch mode
 */
function testLabelsAndMarks() {
    var width = 350;
    var gobo = newGobo({ gobanSize: 7, isSketch: true, widthPx: width, background: '#dcb' });
    gobo.setMarkAt(0, 6, '+Wo');
    gobo.setMarkAt(1, 6, '+Bo');
    gobo.setMarkAt(2, 6, '+?');
    gobo.setMarkAt(0, 1, 'O');
    gobo.setStoneAt(0, 0, BLACK);
    gobo.setMarkAt(0, 0, 'O');
    gobo.setStoneAt(0, 2, WHITE);
    gobo.setMarkAt(0, 2, 'O:5,8');
    gobo.setMarkAt(2, 1, '[]');
    gobo.setStoneAt(2, 0, BLACK);
    gobo.setMarkAt(2, 0, '[]');
    gobo.setStoneAt(2, 2, WHITE);
    gobo.setMarkAt(2, 2, '[]:5,2');
    gobo.setStoneAt(1, 3, BLACK);
    gobo.setMarkAt(1, 3, '+:4,1');
    gobo.setStoneAt(1, 4, WHITE);
    gobo.setMarkAt(1, 4, '+');
    gobo.setLabelAt(3, 3, 'A');
    gobo.setLabelAt(3, 4, '12');
    gobo.setStoneAt(3, 5, BLACK);
    gobo.setLabelAt(3, 5, '1');
    gobo.setStoneAt(4, 3, BLACK);
    gobo.setLabelAt(4, 3, 'B');
    gobo.setStoneAt(5, 3, WHITE);
    gobo.setLabelAt(5, 3, 'j');
    gobo.setStoneAt(6, 5, WHITE);
    gobo.setLabelAt(6, 5, '9.9');
    gobo.setStoneAt(6, 4, WHITE);
    gobo.setLabelAt(6, 4, '299');
    gobo.setStoneAt(6, 6, WHITE);
    gobo.setLabelAt(6, 6, '9999');
    gobo.setMarkAt(6, 2, '*');
    gobo.setMarkAt(4, 1, 'A:10,2');
    gobo.setStoneAt(5, 1, WHITE);
    gobo.setMarkAt(5, 1, 'V:10');
    gobo.setMarkAt(6, 1, 'X');
    gobo.render();
    var intro = newDiv(null, 'intro', 'Some examples of what you can do with labels and marks.');
    newDiv(intro, 'intro', 'Syntax of mark string is: code[:size[,lineWidth]]');
    newDiv(intro, 'intro', 'So for example:');
    newDiv(intro, 'codeInText', "gobo.setMarkAt(1, 3, '+:4,1')");
    newDiv(intro, 'intro', 'Means: Add in (1,3) a "+" mark of size = 4 and line width = 1');
    newDiv(intro, 'intro', 'Default size is 10, equals to the diameter of a stone.');
    newDiv(intro, 'intro', 'Default line width is 5, which is quite thick. With 1 being a very thin line (actually not very visible, see example below).');
    createSample(width, gobo.canvas, 'Labels & marks, sketch mode', intro, "var gobo = new Gobo({ gobanSize: 7, isSketch: true, widthPx: 350, background: '#dcb' });\n\ngobo.setMarkAt(0, 6, '+Wo');\ngobo.setMarkAt(1, 6, '+Bo');\ngobo.setMarkAt(2, 6, '+?');\n\ngobo.setMarkAt(0, 1, 'O');\ngobo.setStoneAt(0, 0, BLACK); gobo.setMarkAt(0, 0, 'O');\ngobo.setStoneAt(0, 2, WHITE); gobo.setMarkAt(0, 2, 'O:5,8');\n\ngobo.setMarkAt(2, 1, '[]');\ngobo.setStoneAt(2, 0, BLACK); gobo.setMarkAt(2, 0, '[]');\ngobo.setStoneAt(2, 2, WHITE); gobo.setMarkAt(2, 2, '[]:5,2');\n\ngobo.setStoneAt(1, 3, BLACK); gobo.setMarkAt(1, 3, '+:4,1');\ngobo.setStoneAt(1, 4, WHITE); gobo.setMarkAt(1, 4, '+');\n\ngobo.setLabelAt(3, 3, 'A'); gobo.setLabelAt(3, 4, '12');\ngobo.setStoneAt(3, 5, BLACK); gobo.setLabelAt(3, 5, '1');\n\ngobo.setStoneAt(4, 3, BLACK); gobo.setLabelAt(4, 3, 'B');\ngobo.setStoneAt(5, 3, WHITE); gobo.setLabelAt(5, 3, 'j');\ngobo.setStoneAt(6, 5, WHITE); gobo.setLabelAt(6, 5, '9.9');\ngobo.setStoneAt(6, 4, WHITE); gobo.setLabelAt(6, 4, '299');\ngobo.setStoneAt(6, 6, WHITE); gobo.setLabelAt(6, 6, '9999');\n\ngobo.setMarkAt(6, 2, '*');\ngobo.setMarkAt(4, 1, 'A:10,2');\ngobo.setStoneAt(5, 1, WHITE); gobo.setMarkAt(5, 1, 'V:10');\ngobo.setMarkAt(6, 1, 'X');\n\ngobo.render();");
}
/**
 * You can use your own image as background (some look better than others).
 */
function testCustomBackground() {
    var width = 350;
    var woodExample = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAACKUlEQVQ4T7WUXXLcMAyDQVKyszl1TtBr9g5ekeqAkvyTZvpW58UzO4E/EgDl96+vXovhVQoCHW8PHO+G6IHNCqwoPDo8Any2YvluIthLQYuO5oGiAhGB/D/BWhB9EjZHhCeNqcI7EEH+b4RW0PokNEH+PQgpGIHjFCxTsKcgH66H78qRT0GHmUJFb4IkjEvQw3NHJgrHFBSgmsE9oKop6D3Q3FFMIbgL0pQOvKPhaJEUW1GYGrw/CS/BsY40hSNfpig+a03H6PLbPb/8oQoxy93eR6Ygd7uRNvfuqEUh/dyh4lVqEh7eUrT3yPFMJSkYFZk7PAUzQlyTo5oCy5TNFK9tELZlSnfsqtBSzhwuwWXKNn9LwvsOGY8P/pguO97cYQ/sdG7u8EE4g/1vwTpI+LUxMnNYMgrLFBKW1RQVbHpBbKrAig3/cRAOMYr23nPpIpqVZIzo4ooNY5LvE4L55Acz2DlyEkaOe4QDS1AlzaIRolcOi2qG/BTMHU6X9xSsSdfCcfgQ3M0A1YwNCTk+ydJlkzweS5BQfJKQjSAhDWFIx8jAXsZeUpCEbAqpVg5vhH8J7tUyMkMw0GdTREew0+Vb9Xi+0uUZ7CG4Rq6WvXWfsXHGxnPkR2yWIGPDpsxIjabY1RR2ljuk4NghuzyOA4/AT11mg3KHM7t0/Kzej8GmIAnnRXl0OYOteTw8eFAclb1f1yarx+OQx3IRPq/N9y6P8zWuzVU9wR9BRU5H3DbiDgAAAABJRU5ErkJggg==';
    var code = "var gobo = new Gobo({\n\tbackgroundCanvas: canvas,\n\tnoCoords: true, // turn off coordinates\n\tgobanSize: 7,\n\twidthPx: 350\n});\n\ngobo.setStoneAt(3, 3, WHITE);\n\ngobo.render();";
    var canvas = loadImage(woodExample, function () {
        var gobo = newGobo({ gobanSize: 7, widthPx: width, backgroundCanvas: canvas, noCoords: true });
        gobo.setStoneAt(3, 3, WHITE);
        gobo.render();
        createSample(width, gobo.canvas, 'Custom Background', 'You can use your own image as background (some look better than others).', code);
    });
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
/**
 * Test used to gauge if white stones look "different enough" to a human eye.
 */
function testFullWhiteBoard() {
    var width = 512, gobanSize = 13;
    var seed = 0.993623429;
    var gobo = newGobo({ gobanSize: gobanSize, widthPx: width, background: 'wood', patternSeed: seed });
    for (var j = 0; j < gobanSize; j++) {
        for (var i = 0; i < gobanSize; i++) {
            gobo.setStoneAt(i, j, WHITE);
        }
    }
    gobo.render();
    var code = "var gobo = new Gobo({\n\tgobanSize: 13,\n\twidthPx: 512,\n\tbackground: 'wood',\n\tpatternSeed: " + seed + "\n});\n\nfor (var j = 0; j < 13; j++) {\n    for (var i = 0; i < 13; i++) {\n        gobo.setStoneAt(i, j, WHITE);\n    }\n}\n\ngobo.render();";
    createSample(width, gobo.canvas, 'Full White Board', 'Test used to gauge if white stones look "different enough" to a human eye.', code);
}
//---
function newGobo(options) {
    // Always set pixelRatio here - not mentioned in each example to keep it short.
    options.pixelRatio = window.devicePixelRatio;
    return new Gobo(options);
}
function createSample(width, canvas, title, intro, code) {
    if (title)
        newDiv(document.body, 'subtitle', title);
    if (intro) {
        if (typeof intro === 'string') {
            newDiv(document.body, 'intro', intro);
        }
        else {
            document.body.appendChild(intro);
        }
    }
    var sampleDiv = newDiv(document.body, 'sampleDiv');
    var boardDiv = newDiv(sampleDiv, 'boardDiv');
    canvas.style.width = canvas.style.height = width + 'px';
    boardDiv.appendChild(canvas);
    var textDiv = newDiv(sampleDiv, 'textDiv codeSample', code);
    return { boardDiv: boardDiv, textDiv: textDiv };
}
function newDiv(parent, className, text) {
    var div = document.createElement('div');
    if (className)
        div.className = className;
    if (parent !== null)
        parent.appendChild(div);
    if (text)
        div.innerText = text;
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

},{}]},{},[1]);
