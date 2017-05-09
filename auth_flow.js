/*Currently not working/indev,
Can be added for testing by appending a header named Authorization to destiny_object.global_headers,
and adding a property named auth, with the value of "./auth_flow.js" to the destiny_object object.
*/

var https = require('https');
var pem = require('pem');
var express = require('express');
var events = require('events');

var auth_flow = {
	_requires: [
		'https',
		'pem',
		'express',
	],
	payload: {
		types: ['add-to-all', 'header'],
		header_name: 'Authorization',
		data: ''
	},
	when: "ready",
	run: function (){
		pem.createCertificate({days: 1, selfSigned: true}, function(err, keys){
			var app = express();

			https.createServer({key: keys.serviceKey, cert: keys.certificate}, app).listen(443);

			app.get('/', function(req, res){
				res.send('Destiny API Wrapper Auth Server is up and running...');
			});
			app.get('/auth', function(req, res) {
				var code = req.query.code;
				this['code'] = code;
				var get_codes_options = {
					url: 'https://localhost/getaccesstokens'
				};
				process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
				_request(get_codes_options, (error, response, body) => {if(error) throw error;

				});
				res.send("Success");

			});

			app.get('/getaccesstokens', function(req, res) {
				if(this['code']){
					var X_API_KEY = output["X-API-Key"];
					var get_codes = {
						headers: {
							'X-API-Key': X_API_KEY
						},
						url: 'https://www.bungie.net/Platform/App/GetAccessTokensFromCode/',
						body: "{code: \""+this['code']+"\"}"
					}
					_request.post(get_codes, (error, response, body) => {
						if(error) throw error;
						var jObject = JSON.parse(body);
						var accessToken = jObject.Response.accessToken.value;

						wrapper["Authorization"] = 'Bearer '+accessToken;
						res.send("Done.");
					});
				}
			});
		});
	},
	properties: {
		auth_url: ''
	}
};

module.exports = auth_flow;	
