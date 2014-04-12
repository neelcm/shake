var async = require("async"); 
var request = require("request"); 
var fs = require("fs"); 
var JSON = require("JSON"); 
var child = require("child_process"); 

var Plugin = function(){
	
}

Plugin.prototype.cmd_app = function(args){
	var self = this; 
	var ret = self.server.defer(); 

	if(args.length < 1){
		ret.resolve({error: "Too few arguments to app command!"}); 
		return ;
	}
	
	if(args[0] == "list"){
		var plugs = []; 
		
		Object.keys(self.server.plugins).map(function(x){
			plugs.push(self.server.plugins[x]); 
		}); 
		
		var list = plugs.map(function(x){
			return "["+ x.status + "]\t" + x.name+" - "+x.title+"\n"; 
		}).reduce(function(a, b){
			return (a+b); 
		}); 
		success("List of apps: \n"+list); 
	} else if(args[0] == "source"){
		if(args[1] == "add"){
			if(typeof args[2] != "string"){
				error("Invalid argument to 'add'!"); 
			} else {
				var sources = self.server.pool.get("app.source"); 
				sources.create({
					package_list_url: args[2]
				}).done(function(){
					success("Done!"); 
				}); 
			}
		} else {
			error("Unknown command!"); 
		}
	} else if(args[0] == "update"){
		var sources = self.server.pool.get("app.source"); 
		sources.search({}).done(function(ids){
			sources.browse(ids).done(function(list){
				console.debug("Got list.."); 
				var packages = {}; 
				async.eachSeries(list, function(x, next){
					console.debug("Processing "+x.package_list_url); 
					var url = x.package_list_url; 
					if(url.indexOf("file://") == 0){
						var file = url.substring(7); 
						console.debug("Reading file "+file); 
						try {
							var data = fs.readFileSync(file); 
							data = JSON.parse(data); 
							Object.keys(data.packages).map(function(x){
								packages[x] = data.packages[x]; 
							}); 
							next(); 
						} catch(e){
							console.error(e); 
							next(); 
						}
					} else {
						request.get(x.package_list_url, function(e, r, data){
							if(e){
								console.error(e); 
								next(); 
							}
							var data = fs.readFileSync(file); 
							try {
								data = JSON.parse(data); 
								Object.keys(data.packages).map(function(x){
									packages[x] = data.packages[x]; 
								}); 
								next(); 
							} catch(e){
								next(); 
							}
							next(); 
						}); 
					}
				}, function(){
					// insert or update the packages in the database
					async.eachSeries(Object.keys(packages), function(x, next){
						var package = packages[x]; 
						var apps = self.server.pool.get("app.app"); 
						apps.find({
							name: x
						}, {
							name: x, 
							fetch_url: package.zip
						}).done(function(app){
							app.fetch_url = package.zip; 
							app.git_url = package.git; 
							app.save().done(function(){
								next(); 
							}); 
						}); 
							
					}, function(){
						success("Done!"); 
					}); 
					
				}); 
			}); 
		}); 
	} else if(args[0] == "install"){
		var apps = self.server.pool.get("app.app"); 
		var appname = args[1]; 
		var tempfile = "/tmp/"+appname+".zip"; 
		var targetpath = self.server.config.site_path+"/plugins/"+appname; 
		apps.find({name: appname}).done(function(app){
			if(!app){
				error("App not found: "+appname); 
				return; 
			}
			console.log("Installing application: "+appname); 
			
			var req = request.get(app.fetch_url); 
			req.pipe(fs.createWriteStream(tempfile)); 
			req.on("end", function(done){
				if(!fs.existsSync(targetpath)){
					console.debug("Installing application "+appname); 
					/*try {
						fs.mkdirSync(targetpath); 
					} catch(e){
						console.error(e); 
						error("Could not create target directory!"); 
						return; 
					}*/
					child.execFile("/usr/bin/env", ["git", "clone", app.git_url, targetpath], function(){
						// install into sitepath
						console.log("Successfully installed app "+appname+" into "+targetpath); 
						success("Updated application "+appname); 
					});
				} else {
					console.debug("Updating application "+appname); 
					child.execFile("/usr/bin/env", ["git", "pull", "origin", "master", targetpath], function(){
						// install into sitepath
						console.log("Successfully updated app "+appname+" into "+targetpath); 
						success("Installed application "+appname); 
					});
				} 
			}); 
		}); 
	} else if(args[0] == "upgrade"){
		var apps = self.server.pool.get("app.app"); 
		apps.search({}).done(function(ids){
			apps.browse(ids).done(function(list){
				var c = 0; 
				async.eachSeries(list, function(app, next){
					var targetpath = self.server.config.site_path+"/plugins/"+app.name; 
					child.execFile("/usr/bin/env", ["git", "--work-tree", targetpath, "--git-dir", targetpath+"/.git", "pull", "origin", "master"], function(err, res){
						if(err){
							console.error(err); 
							next(); 
							return; 
						}
						// install into sitepath
						console.log("Successfully updated app "+app.name+" into "+targetpath+": "+res); 
						c++; 
						next(); 
					});
				}, function(){
					success("Updated "+c+" applications!"); 
				}); 
			}); 
		}); 
	} else {
		error("Unknown command!"); 
	}
	function success(r){
		ret.resolve({success: r}); 
	}
	function error(r){
		ret.resolve({error: r}); 
	}
	return ret.promise;
}

Plugin.prototype.init = function(x){
	var self = this; 
	var ret = self.server.defer(); 
	
	self.server.console.registerCommand("app", function(args){
		return self.cmd_app(args);  
	}); 
	
	self.server.app = this; 
	ret.resolve(); 
	return ret.promise; 
}

exports.plugin = {
	name: "App store interface",
	description: "This plugin implements the console 'app' command and an interface to the appstore. The appstore allows the user to install apps and plugin for siteboot.", 
	object: Plugin
}
