#!/usr/bin/env node
var autowrapper = require('./autowrapper.js');
var path = require('path');

var args = process.argv.slice(2);
var Generator = new autowrapper(args[0]);
console.log("Building: "+args[0]);
Generator.on('ready', () => {
	Generator.generate((wrapper) => {
		wrapper.emit(args[1], true);
		if(args.indexOf('-d') != -1){
			Generator.generateDocs(wrapper, path.basename(args[0]), "README.md");
		}
	});
});
