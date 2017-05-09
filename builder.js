var autowrapper = require('./lib/autowrapper.js');
var request = require('request');
var fs = require('fs');

var destiny_object = {
	name: "Bungie.net DestinyPlatform API Wrapper",
	base_url: "http://bungie.net/platform/",
	global_headers: [
		"X-API-Key"
	],
	endpoints: []
};

var args = process.argv.slice(2);
console.log("I: Fetching endpoints...");
request({url: "https://raw.githubusercontent.com/DestinyDevs/BungieNetPlatform/master/wiki-builder/data/endpoints.json"}, (error, response, body) => {
	var jObject = JSON.parse(body);
	var ServiceName = args[0];
	var Service = jObject[ServiceName];
	for(e in Service.endpoints){
		var endpoint = Service.endpoints[e];

		var method = endpoint.method;
		if(method != "POST"){
			var _url = endpoint.endpoint.replace(/{/g, '%');
			_url = _url.replace(/}/g, '%');
			var url_arr = _url.split('/');
			var _params = [];
			url_arr.forEach((part) => {
				if(part[0] === '%' && part[part.length - 1] === '%'){
					var paramName = part.substr(1).slice(0, -1);
					_params.push(paramName);
				}
			});

			var object = {
				name: e,
				params: _params,
				url: _url
			};
			destiny_object.endpoints.push(object);
		}
		else {
			console.log("W: Skipping POST endpoint.");
		}
	}

	var output = JSON.stringify(destiny_object);
	fs.writeFile(ServiceName+".json", output, () => {
		var Generator = new autowrapper(ServiceName+'.json');
		Generator.on('ready', () => {
			Generator.generate((wrapper) => {

				wrapper.emit(ServiceName+".js", true);
				Generator.generateDocs(wrapper, {
					title: ServiceName,
					addtoeach: "[endpoint](http://destinydevs.github.io/BungieNetPlatform/docs/DestinyService/%endpoint_name%/)\n"
				}, "Docs-"+ServiceName+".md");
			});
		});
	});
});
