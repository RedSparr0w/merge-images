// Defaults
const defaultOptions = {
	format: 'image/png',
	quality: 0.92,
	width: undefined,
	height: undefined,
	Canvas: undefined,
	crossOrigin: undefined,
};

const getX = (image, width) => {
	if (image.right != undefined)
		return width - (image.right + (image.width || image.img.width));
	return image.left || image.x || 0;
}

const getY = (image, height) => {
	if (image.bottom != undefined)
		return height - (image.bottom + (image.height || image.img.height));
	return image.top || image.y || 0;
}

// Return Promise
const mergeImages = (sources = [], options = {}) => new Promise(resolve => {
	options = Object.assign({}, defaultOptions, options);

	// Setup browser/Node.js specific variables
	const canvas = options.Canvas ? new options.Canvas() : window.document.createElement('canvas');
	const Image = options.Image || window.Image;

	// Load sources
	const images = sources.map(source => new Promise((resolve, reject) => {
		// Convert sources to objects
		if (source.constructor.name !== 'Object') {
			source = { src: source };
		}

		// Resolve source and img when loaded
		const img = new Image();
		img.crossOrigin = options.crossOrigin;
		img.onerror = () => reject(new Error(`Couldn\'t load image: ${img.src || 'unknown source'}`));
		img.onload = () => resolve(Object.assign({}, source, { img }));
		img.src = source.src;
		img.custom = source.custom;
	}));

	// Get canvas context
	const ctx = canvas.getContext('2d');

	// When sources have loaded
	resolve(Promise.all(images)
		.then(images => {
			// Set canvas dimensions
			const getSize = dim => options[dim] || Math.max(...images.map(image => image.img[dim]));
			canvas.width = getSize('width');
			canvas.height = getSize('height');

			// Draw images to canvas
			images.forEach(image => {
				// Local canvas
				const _canvas = options.Canvas ? new options.Canvas() : window.document.createElement('canvas');
				_canvas.width = image.width || image.img.width;
				_canvas.height = image.height || image.img.height;

				// Local context
				const _ctx = _canvas.getContext('2d');
				_ctx.globalAlpha = image.opacity || 1;

				// Check if any custom filtering
				if (image.custom) image.custom(_ctx, image);

				// Draw the image locally
				_ctx.drawImage(image.img, 0, 0, image.width || image.img.width, image.height || image.img.height);

				// Add image to main canvas
				ctx.drawImage(_ctx.canvas, getX(image, canvas.width), getY(image, canvas.height), image.width || image.img.width, image.height || image.img.height);
			});

			if (options.Canvas && options.format === 'image/jpeg') {
				// Resolve data URI for node-canvas jpeg async
				return new Promise((resolve, reject) => {
					canvas.toDataURL(options.format, {
						quality: options.quality,
						progressive: false
					}, (err, jpeg) => {
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

export default mergeImages;
