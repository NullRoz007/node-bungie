var request = require('request');
var fs = require('fs');
const spawn = require( 'child_process' ).spawnSync;

process.on('uncaughtException', function (err) {
  console.error(err.message);
});

fs.mkdir('build');
fs.mkdir('build/docs');
request({url: "https://raw.githubusercontent.com/DestinyDevs/BungieNetPlatform/master/wiki-builder/data/endpoints.json"}, (error, response, body) => {
  var jObject = JSON.parse(body);
  var bungie_code = "module.exports = {\n";
  for(service in jObject){
    var command = spawn( 'node', [ 'builder.js', String(service)]);
    if(command.stderr.toString() != ""){
      console.log('\x1b[31m%\x1b[40m', "["+service+`] ERROR: ${command.stderr.toString()}`);
    }
    console.log('\x1b[0m', "["+service+`]: ${command.stdout.toString()}` );
    tidyUpBuild(service);
    bungie_code += "\t"+service+": require('./"+service+".js'),\n";
  }
  bungie_code += "}";
  fs.writeFile("build/bungie.js", bungie_code);
});

function tidyUpBuild(service){
  var wrapper_file = service+".js";
  var docs_file = "Docs-"+service+".md";
  var json_file = service+".json";

  fs.unlink(json_file);
  fs.rename(wrapper_file, 'build/'+service+".js");
  fs.rename(docs_file, "build/docs/Docs-"+service+".md");
}
