var events = require('events');
var util = require('util');
var fs = require('fs');
var _ = require('underscore');
var path = require('path');

function Generator(json) {
	events.EventEmitter.call( this );
	fs.readFile(json, (err, data) => {
		if(err) throw err;
		this.api_definition = JSON.parse(data);
		this.emit('ready')
	});
}

util.inherits(Generator, events.EventEmitter);

var standalone = false;

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

Generator.prototype.generateDocs = function(wrapper, options, file){
	var title = options.title;
	var output = "";
	output += "\n<h2>Endpoints:</h2>\n";
	wrapper.endpoints.forEach((endpoint) => {
		var url = endpoint.url;
		var name = endpoint.name;

		var _url = url.replace(/{/g, '%');
		_url = _url.replace(/}/g, '%');
		var url_arr = _url.split('/');
		var _params = [];
		url_arr.forEach((part) => {
			if(part[0] === '%' && part[part.length - 1] === '%'){
				var paramName = part.substr(1).slice(0, -1);
				_params.push(paramName);
			}
		});

		var example_code = name+"(options, callback)\n";
		var joiner = ': null,\n\t';
		var append = ": null\n";
		if(_params.length == 0){
			append = "";
		}
		example_code += "Example:\n```js"+
							"\nwrapper."+name+"({\n\t"+_params.join(joiner)+append+"}, (error, response, json) => {});\n```"
		output += "\n"+example_code;

		if(options.addtoeach){
			var ate_string = options.addtoeach.replaceAll("%endpoint_name%", name);
			output += "\n"+ate_string;
		}
		output+"\n\n---";
	});
	var write_norm = true;
	if(options.addtotop){
		if(typeof options.addtotop == "string"){
			var new_output = options.addtotop + output;
			write_norm = false;
			console.log("I: Wrapper Docs has addtotop (object).");
			fs.writeFile(file, new_output);
		}
		else{
			if(options.addtotop.file){
				fs.readFile(options.addtotop.file, (error, data) => {
					if(error) { console.log(error) }
					var new_output = "<h2>"+title+"</h2>" + "\n\n"+String(data)+"---\n" + output;
					write_norm = false;
					console.log("I: Wrapper Docs has addtotop (object).");
					fs.writeFile(file, new_output);

				});
			}
			else{
				console.log("OH OH");
			}
		}
	}

	output = "<h2>"+title+"</h2>" + output;
	if(write_norm){ fs.writeFile(file, output); }

}

Generator.prototype.generate = function(callback){
	console.log("I: Generating: "+this.api_definition.name+"...");

	var parent = this;

	var wrapper = {
		addGlobalHeader: function(name){
			this[name] = '';
		},
		emit: function (filename, module) {
			var object_to_emit = this;
			var props = [];
			var code = "";

			console.log("I: Setting up parent...");
			code += "var parent = {api_definition: {base_url:\""+parent.api_definition.base_url+"\",global_headers: [";//+parent.api_definition.global_headers.toString()+"}};\n\n"

			parent.api_definition.global_headers.forEach((header) => {
				code += "\""+header+"\", "
			});
			code += "]}};\n\nvar wrapper;\nvar standalone = true;\n\n"
			if(this.auth){
				this.auth._requires.forEach((require) => {
					code += "var "+require+" = require('"+require+"');\n"
				});
			}
			console.log("I: Seralizing wrapper to javascript source code...");

			_.each(object_to_emit, (value, key) => {

				if(key != "addGlobalHeader" && key != "emit" && key != "auth"){


					if(!value) value = "\"\"";
					var value_to_put = value.toString();
					if(key == "endpoints") value_to_put = "[]"
					var val_check = value_to_put.substr(0, 8);
					if(val_check == "function") {
						var arr = value_to_put.split('\n');
						arr.splice(1, 0, "				var __name = \""+key+"\";");
						value_to_put = arr.join('\n');
					}
					var name = (key.indexOf('-') == -1) ? key : JSON.stringify(key);
					if(name == "Authorization") {name = "\"Authorization\""}
					var prop = name+": "+value_to_put;
					props.push(prop);
				}
			});

			code += "var _request = require('request');\n\nvar output = { "+props.join(",\n")+"};\nwrapper = output;"


			if(module) {code += "\n\nmodule.exports = output;\n\n"}

			if(this.auth) {
				code += "/* Auto generated auth flow code: */\n";
				code += "var auth = {\n"
					 + "\tpayload: {"
					 + "\n\t\ttypes: [";
				code += "\""+this.auth.payload.types.join('", "') + "\"], ";
				code += "\n\t\theader_name: \""+this.auth.payload.header_name+"\", ";
					 code += "\n\t},\n"
				code += "\twhen: \""+this.auth.when+"\",\n";
				code += "\trun: "+this.auth.run.toString();
				code += "\n};\n\n"
				if(this.auth.when == 'ready'){
					code += "\n\nauth.run();\n\n"
				}
			}

			code += fillStringWithOptions.toString() + "\n\n";
			code += getGlobalHeaders.toString() + "\n\n";

			try{
				fs.writeFile(filename, code, () => {
					console.log("I: Done.");
				});
			}
			catch (err){
				console.log("W: Failed to write file: "+filename);
			}
		}
	};

	this.api_definition.global_headers.forEach((header) => {
		wrapper.addGlobalHeader(header);
	});

	wrapper['endpoints'] = [];
	this.api_definition.endpoints.forEach((endpoint) => {
		if(endpoint.hasOAuth) {this.emit('skipped')}
		else{
			wrapper.endpoints.push({name: endpoint.name, url: endpoint.url});
			var endpoint_object = function(options, callback){
				if(!standalone){
					//%STANDALONE%
					var _endpoint = endpoint;
					var _url =  _endpoint.url;
					var headers_object = getGlobalHeaders(parent.api_definition.global_headers, wrapper);

					var _final_url = parent.api_definition.base_url+fillStringWithOptions(_url, options);
					var request_options = {
						headers: headers_object,
						url: _final_url
					};

					var _request = require('request');
					_request(request_options, (error, response, body) => {
						if (error) callback(error, null, null);

						var jObject = JSON.parse(body);
						callback(null, response, jObject);
					});
					//%STANDALONE%
				}
				else {
					this.__endpoints__.forEach(endpoint => {
						if(endpoint["name"] == __name){
							var _url = endpoint["url"];
							var headers_object = getGlobalHeaders(parent.api_definition.global_headers, wrapper);
							var _final_url = parent.api_definition.base_url+fillStringWithOptions(_url, options);
							var request_options = {
								headers: headers_object,
								url: _final_url
							};
							var _request = require('request');
							_request(request_options, (error, response, body) => {
								if (error) callback(error, null, null);

								var jObject = JSON.parse(body);
								callback(null, response, jObject);
							});
						}
					});
				}
			};
			console.log("I: Processing: "+endpoint.name);
			wrapper[endpoint.name] = endpoint_object;
		}

	});
	if(this.api_definition.auth){
		var auth_object = require(path.join('../', this.api_definition.auth));
		wrapper['auth'] = auth_object;
	}

	wrapper['__endpoints__'] = JSON.stringify(wrapper.endpoints);
	callback(wrapper);
}

module.exports = Generator;

/////////////////////////////////////////
//			Helper Functions           //
/////////////////////////////////////////

function fillStringWithOptions(string, options){
	var arr = string.split('/');
	arr.forEach(part => {
		if(part[0] === '%' && part[part.length - 1] === '%'){
			var name = part.substr(1);
			name = name.substr(0, name.length - 1);
			string = string.replace(part, options[name]);
		}
	});
	return string;
}

function getGlobalHeaders(headers, wrapper){
	var ret_object = {};

	headers.forEach(header => {
		var value = wrapper[header];
		ret_object[header] = value;
	});

	return ret_object;
}

function hasProp(object, prop_name){
	for(prop in object){
		if(prop == prop_name) return true;
	}
	return false;
}
