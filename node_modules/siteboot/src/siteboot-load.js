var fs = require("fs"); 
var async = require("async"); 
var walk = require("walk"); 

Server(function(){
	var Loader = {}; 
	Server.prototype.loader = Loader; 
	Loader.LoadScripts = function(dir, callback){
		if(!fs.existsSync(dir)) {
			callback({}); 
			return; 
		}
		fs.readdir(dir, function (err, files) {
			if (err) {
				console.log(err);
				callback({}); 
				return;
			}
			var scripts = {}; 
			for(var key in files){
				var file = files[key]; 
				if(!/\.js$/.test(file)) {
					console.debug("Skipping "+file+"..."); 
					continue;
				}
				try{
					var script_name = file.replace(/\.[^/.]+$/, "");
					console.debug("Loading "+script_name); 
					var hr = require(dir+"/"+file);
					//if(!("init" in hr)) continue; 
					hr.name = script_name; 
					//hr.init(server, function(){
					//	HandlerInitCompleted(hr); 
					//});
					//HandlerInitCompleted(hr); 
					//handlers[script_name] = hr; 
					scripts[script_name] = hr.module; 
					console.log("SCRIPT LOADED: "+script_name);
				}
				catch(e){
					console.log("ERROR: could not load script "+dir+"/"+file+": "+e+"\n"+e.stack); 
					process.exit(); 
				} 
			}
			callback(scripts);
		});
	}

	function basename(url){
			return ((url=/(([^\/\\\.#\? ]+)(\.\w+)*)([?#].+)?$/.exec(url))!= null)? url[2]: '';
	}


	Loader.LoadForms = function(basedir, callback){
		var walker = walk.walk(basedir); 
		var forms = {}; 
		
		walker.on("file", function(root, stat, next){
			if(!/\.html$/.test(stat.name)) {
				next(); 
				return;
			}
			
			try{
				var data = fs.readFileSync(root + "/" + stat.name); 
				var name = stat.name.replace(/\.[^/.]+$/, ""); 
				forms[name] = String(data); 
			}
			catch(e){
				console.log("ERROR: "+root+"/"+stat.name); 
			} 
			next(); 
		}).on("end", function(){
			callback(forms); 
		});
	}

	Loader.LoadModule = function(path, callback){
		var module = {}; 
		if(fs.existsSync(path+"/init.js"))
			module = require(path+"/init"); 
		
		var object = module; 	
		if("plugin" in module){
			object = new module.plugin.object();
			module = module.plugin; 
		}
		
		object.name = basename(path); 
		object.title = module.name; 
		object.description = module.description; 
		
		async.series([
			function(callback){
				console.debug("Loading html forms from "+path+"/html"); 
				Loader.LoadForms(path+"/html", function(results){
					object.forms = {}; 
					for(var key in results){
						console.debug("Found form "+key); 
						object.forms[key] = results[key]; 
					}
					callback(); 
				}); 
			},
			function(callback){
				console.log("Loading handlers from "+path+"/handlers");
				Loader.LoadScripts(path+"/handlers", function(scripts){
					object.handlers = {}; 
					for(var key in scripts){
						//hr.init(server);
						object.handlers[key] = scripts[key]; 
					}
					callback(); 
				});
			},
			function(callback){
				console.log("Loading widgets from "+path+"/widgets");
				Loader.LoadScripts(path+"/widgets", function(scripts){
					object.widgets = {}; 
					for(var key in scripts){
						if(scripts[key] && scripts[key].type)
							object.widgets[key] = scripts[key].type;
						else
							console.error("Widget "+key+" does not have correct 'type' member exported from the module!"); 
					}
					callback(); 
				});
			},
		], function(){
			callback(object); 
		});
	}
}); 
