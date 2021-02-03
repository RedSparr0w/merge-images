(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.mergeImages = factory());
}(this, (function () { 'use strict';

	// Defaults
	var defaultOptions = {
		format: 'image/png',
		quality: 0.92,
		width: undefined,
		height: undefined,
		Canvas: undefined,
		crossOrigin: undefined,
	};

	var getX = function (image, width) {
		if (image.right != undefined)
			{ return width - (image.right + (image.width || image.img.width)); }
		return image.left || image.x || 0;
	};

	var getY = function (image, height) {
		if (image.bottom != undefined)
			{ return height - (image.bottom + (image.height || image.img.height)); }
		return image.top || image.y || 0;
	};

	// Return Promise
	var mergeImages = function (sources, options) {
		if ( sources === void 0 ) sources = [];
		if ( options === void 0 ) options = {};

		return new Promise(function (resolve) {
		options = Object.assign({}, defaultOptions, options);

		// Setup browser/Node.js specific variables
		var canvas = options.Canvas ? new options.Canvas() : window.document.createElement('canvas');
		var Image = options.Image || window.Image;

		// Load sources
		var images = sources.map(function (source) { return new Promise(function (resolve, reject) {
			// Convert sources to objects
			if (source.constructor.name !== 'Object') {
				source = { src: source };
			}

			// Resolve source and img when loaded
			var img = new Image();
			img.crossOrigin = options.crossOrigin;
			img.onerror = function () { return reject(new Error('Couldn\'t load image')); };
			img.onload = function () { return resolve(Object.assign({}, source, { img: img })); };
			img.src = source.src;
			img.custom = source.custom;
		}); });

		// Get canvas context
		var ctx = canvas.getContext('2d');

		// When sources have loaded
		resolve(Promise.all(images)
			.then(function (images) {
				// Set canvas dimensions
				var getSize = function (dim) { return options[dim] || Math.max.apply(Math, images.map(function (image) { return image.img[dim]; })); };
				canvas.width = getSize('width');
				canvas.height = getSize('height');

				// Draw images to canvas
				images.forEach(function (image) {
					// Local canvas
					var _canvas = options.Canvas ? new options.Canvas() : window.document.createElement('canvas');
					_canvas.width = image.width || image.img.width;
					_canvas.height = image.height || image.img.height;

					// Local context
					var _ctx = _canvas.getContext('2d');
					_ctx.globalAlpha = image.opacity || 1;

					// Check if any custom filtering
					if (image.custom) { image.custom(_ctx, image); }

					// Draw the image locally
					_ctx.drawImage(image.img, 0, 0, image.width || image.img.width, image.height || image.img.height);

					// Add image to main canvas
					ctx.drawImage(_ctx.canvas, getX(image, canvas.width), getY(image, canvas.height), image.width || image.img.width, image.height || image.img.height);
				});

				if (options.Canvas && options.format === 'image/jpeg') {
					// Resolve data URI for node-canvas jpeg async
					return new Promise(function (resolve, reject) {
						canvas.toDataURL(options.format, {
							quality: options.quality,
							progressive: false
						}, function (err, jpeg) {
							if (err) {
								reject(err);
								return;
							}
							resolve(jpeg);
						});
					});
				}

				// Resolve all other data URIs sync
				return canvas.toDataURL(options.format, options.quality);
			}));
	});
	};

	return mergeImages;

})));
//# sourceMappingURL=index.umd.js.map
