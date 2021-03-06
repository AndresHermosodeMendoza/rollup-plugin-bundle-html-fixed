'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = require('fs');
var fs__default = _interopDefault(fs);
var path = require('path');
var crypto = _interopDefault(require('crypto'));

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var isStream_1 = createCommonjsModule(function (module) {

var isStream = module.exports = function (stream) {
	return stream !== null && typeof stream === 'object' && typeof stream.pipe === 'function';
};

isStream.writable = function (stream) {
	return isStream(stream) && stream.writable !== false && typeof stream._write === 'function' && typeof stream._writableState === 'object';
};

isStream.readable = function (stream) {
	return isStream(stream) && stream.readable !== false && typeof stream._read === 'function' && typeof stream._readableState === 'object';
};

isStream.duplex = function (stream) {
	return isStream.writable(stream) && isStream.readable(stream);
};

isStream.transform = function (stream) {
	return isStream.duplex(stream) && typeof stream._transform === 'function' && typeof stream._transformState === 'object';
};
});

var hasha = function (input, options) {
	if ( options === void 0 ) options = {};

	var outputEncoding = options.encoding || 'hex';

	if (outputEncoding === 'buffer') {
		outputEncoding = undefined;
	}

	var hash = crypto.createHash(options.algorithm || 'sha512');

	var update = function (buffer) {
		var inputEncoding = typeof buffer === 'string' ? 'utf8' : undefined;
		hash.update(buffer, inputEncoding);
	};

	if (Array.isArray(input)) {
		input.forEach(update);
	} else {
		update(input);
	}

	return hash.digest(outputEncoding);
};

hasha.stream = function (options) {
	if ( options === void 0 ) options = {};

	var outputEncoding = options.encoding || 'hex';

	if (outputEncoding === 'buffer') {
		outputEncoding = undefined;
	}

	var stream = crypto.createHash(options.algorithm || 'sha512');
	stream.setEncoding(outputEncoding);
	return stream;
};

hasha.fromStream = function async (stream, options) {
	if ( options === void 0 ) options = {};

	if (!isStream_1(stream)) {
		throw new TypeError('Expected a stream');
	}

	return new Promise(function (resolve, reject) {
		// TODO: Use `stream.pipeline` and `stream.finished` when targeting Node.js 10
		stream
			.on('error', reject)
			.pipe(hasha.stream(options))
			.on('error', reject)
			.on('finish', function () {
				resolve(this.read());
			});
	});
};

hasha.fromFile = function async (filePath, options) { return hasha.fromStream(fs__default.createReadStream(filePath), options); };

hasha.fromFileSync = function (filePath, options) { return hasha(fs__default.readFileSync(filePath), options); };

var hasha_1 = hasha;

// import cheerio from 'cheerio';
var cheerio = require('cheerio');

function traverse(dir, list) {
	var dirList = fs.readdirSync(dir);
	dirList.forEach(function (node) {
		var file = dir + "/" + node;
		if (fs.statSync(file).isDirectory()) {
			traverse(file, list);
		} else {
			if (/\.js$/.test(file)) {
				list.push({ type: 'js', file: file });
			} else if (/\.css$/.test(file)) {
				list.push({ type: 'css', file: file });
			}
		}
	});
}

function isURL(url){
  return (new RegExp('^(?:[a-z]+:)?//', 'i')).test(url);
}

function index (opt) {
	if ( opt === void 0 ) opt = {};

	var template = opt.template;
	var filename = opt.filename;
	var externals = opt.externals;
	var inject = opt.inject;
	var dest = opt.dest;
	var absolute = opt.absolute;
	var ignore = opt.ignore;
	var onlinePath = opt.onlinePath;

	return {
		name: 'html',
		writeBundle: function writeBundle(config, data) {
			var isHTML = /^.*<html>.*<\/html>$/.test(template);
			console.log(template);
			var $ = cheerio.load(isHTML?template:fs.readFileSync(template).toString());
			var head = $('head');
			var body = $('body');
			var entryConfig = {};
			//The following forEach through the error
			/*Object.values(config).forEach(function (c) {
				if (c.isEntry) { entryConfig = c; }
			});*/
			var fileName = 'undefined'//entryConfig.fileName;
			var sourcemap = 'undefined';//entryConfig.sourceMap;
			var fileList = [];
			// relative('./', file) will not be equal to file when file is a absolute path
			var destPath = path.relative('./', fileName);
			var destDir = dest || destPath.slice(0, destPath.indexOf(path.sep));
			var destFile = destDir + "/" + (filename || path.basename(template));
			var absolutePathPrefix = absolute ? '/' : '';

			traverse(destDir, fileList);

			if (Array.isArray(externals)) {
				var firstBundle = 0;
				externals.forEach(function(node) {
					if (node.pos === 'before') {
						fileList.splice(firstBundle++, 0, node);
					} else {
						fileList.splice(fileList.length, 0, node);
					}
				});
			}

			fileList.forEach(function (node) {
				var type = node.type;
				var file = node.file;
				if (ignore && file.match(ignore)) {
					return;
				}

				var hash = '';
				var code = '';

				if (/\[hash\]/.test(file)) {
					if (file === destPath) {
						// data.code will remove the last line of the source code(//# sourceMappingURL=xxx), so it's needed to add this
						code = data.code + "//# sourceMappingURL=" + (path.basename(file)) + ".map";
					} else {
						code = fs.readFileSync(file).toString();
					}
					if (sourcemap) {
						var srcmapFile = file + ".map";
						var srcmapCode = fs.readFileSync(srcmapFile).toString();
						var srcmapHash = hasha_1(srcmapCode, { algorithm: 'md5' });

						// remove the source map file without hash
						fs.unlinkSync(srcmapFile);
						srcmapFile = srcmapFile.replace('[hash]', srcmapHash);
						fs.writeFileSync(srcmapFile, srcmapCode);

						code = code.replace(("//# sourceMappingURL=" + (path.basename(file)) + ".map"), ("//# sourceMappingURL=" + (path.basename(srcmapFile))));
					}
					hash = hasha_1(code, { algorithm: 'md5' });
					// remove the file without hash
					fs.unlinkSync(file);
					file = file.replace('[hash]', hash);
					fs.writeFileSync(file, code);
				}

				
				var src = isURL(file) ? file : absolutePathPrefix + path.relative(destDir, file).replace(/\\/g, '/');
				if (onlinePath) { 
					var filename = file.split('/').slice(-1)[0];
					var slash = onlinePath.slice(-1) === '/' ? '' : '/';
					src = onlinePath + slash + filename;
				}
				if (node.timestamp) {
                    src += '?t=' + (new Date()).getTime();
				}

				if (type === 'js') {
					var script = "<script type=\"text/javascript\" src=\"" + src + "\"></script>\n";
					// node.inject will cover the inject
					if (node.inject === 'head' || inject === 'head') {
						head.append(script);
					} else {
						body.append(script);
					}
				} else if (type === 'css') {
					head.append(("<link rel=\"stylesheet\" href=\"" + src + "\">\n"));
				}
			});
			fs.writeFileSync(destFile, $.html());
		}
	};
}

module.exports = index;
