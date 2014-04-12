var async = require("async"); 
var walk = require("walk"); 
var fs = require("fs"); 
var path = require("path"); 

Server(function(){
	var index = {}; 
	var dirs = {}; 
	
	var vfs = {}; 
	vfs.search = function(wildcard, callback){
		var rx = RegExp(wildcard.replace("*", ".*?"), "gi"); 
		var keys = Object.keys(index); 
		
		// fast asynchronous filter
		async.filter(keys, function(key, callback){
			var match = rx.test(key); 
			if(match){
				console.log("Found matching file "+key+" for "+wildcard); 
			}
			callback(match);
		}, function(results){
			callback(undefined, results); 
		});
	}
		
	vfs.add_index = function(dir, callback){
		console.log("Adding directory to index: "+dir); 
		dirs[dir] = dir; /*
		var addtoindex = function(root, stat, next){
			var realpath = root+"/"+stat.name; 
			var path = root.substr(dir.length)+"/"+stat.name;
			//console.log("Adding link "+path+" -> "+realpath); 
			index[path] = realpath; 
			next(); 
		}
		walk.walk(dir)
		.on("file", addtoindex)
		.on("directory", addtoindex)
		.on("end", function(){
			if(callback) callback(); 
		}); */
	}

	vfs.resolve = function(relpath, callback){
		for(dir in dirs){
			var file = path.join(dir, relpath); 
			if(fs.existsSync(file) && fs.statSync(file).isFile()){
				return file; 
			}
		} 
		return null; 
	}
	
	Server.prototype.vfs = vfs; 
}); 
