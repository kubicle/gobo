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
    if (!(seed >= 0 && seed <= 1)) throw new Error('Seed must be between 0 and 1');
	randomSeed = seed;
}

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
