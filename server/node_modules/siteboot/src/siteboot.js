/*********************************************

FORTMAX Node.js SERVER

For more projects, visit https://github.com/fantachip/

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
**********************************************/


var http = require("http");
var https = require("https");
var fs = require("fs");
var url = require("url"); 
var path = require("path");
var JSON = require("JSON");
var walk = require("walk"); 
var mustache = require('mustache'); 
var crypto = require("crypto"); 
var querystring = require("querystring"); 
var formidable = require("formidable");
var mysql = require("mysql");
var async = require("async"); 
var multipart = require("multipart");
var sys = require("sys");
var sequelize = require("sequelize"); 
var util = require("util"); 
var events = require("events"); 
var assert = require("assert"); 
var Q = require("q"); 
var jquery = require("jquery");
var i18n = require("i18n"); 
var $ = require("jquery"); 
var jsdom = require("jsdom"); 
var Path = require("path"); 

var cluster = require("cluster");

var extname = path.extname; 

var widgets = {};
var pages = {};
var forms = {}; 
var texts = {}; 
var handlers = {};
var plugins = {}; 
var core = {}; 

var locale = Object.create(i18n); 
locale.configure({
	locales: ["en", "se"], 
	directory: __dirname + "/lang", 
	defaultLocale: "en"
}); 

__ = locale.__; 

var events = require("events"); 
var util = require("util"); 
var fs = require("fs"); 

var Server = function(){
	if(typeof arguments[0] == "function"){
		arguments[0].call(this); 
	}
	this.defer = Q.defer; 
	this.client_code = ""; 
	this.client_style = ""; 
	this._middleware = []; 
}

util.inherits(Server, events.EventEmitter); 

Server.prototype.use = function(middleware){
	if(!middleware) throw new Error("Empty argument supplied to Server::use()"); 
	this._middleware.push(middleware.call(this)); 
}

var ServerObject = function(x){
	this._object = x; 
	this._write = {}; 
	this.properties = {}; 
}

var Widget = function(x, obj){
	this.server = x; 
	this.object = obj; 
}


Server.prototype.ready = function(cb){
	this.on("ready", cb); 
}

var Client = function(code){
	if(!Client.client_code) Client.client_code = ""; 
	if((typeof code) == "function"){
		Client.client_code += ";("+code.toString()+")();\n";
	} else if(code){
		Client.client_code += code.toString(); 
	}
}

Client.css = function(code){
	code = code + ""; 
	if(!Client.client_style) Client.client_style = ""; 
	if(code && code.length < 256 && fs.existsSync(code)){
		Client.client_style += fs.readFileSync(code)+""; 
	} else if (code){
		Client.client_style += code.toString(); 
	}
}

Client.script = function(code){
	if(!Client.client_code) Client.client_code = ""; 
	if(code && code.toString().length < 256 && fs.existsSync(code)){
		Client.client_code += fs.readFileSync(code); 
	} else if((typeof code) == "function" || (typeof code) == "string"){
		Client.client_code += code.toString()+"\n";
	}
}

Client.ready = function(code){
	if(!Client.client_code) Client.client_code = ""; 
	if(code && code.toString().length < 256 && fs.existsSync(code)){
		Client.client_code += "$(document).ready(function(){"+fs.readFileSync(code)+"});\n"; 
	} else if((typeof code) == "function"){
		Client.client_code += "$(document).ready("+code.toString()+");\n";
	} else {
		Client.client_code += "$(document).ready(function(){"+code.toString()+"});\n"; 
	}
}

// initialize console output
Server(function (){
	console.debug = function(msg){
		console.log(__("DEBUG: ")+msg); 
	}

	console._sb_err = console.error; 

	console.error = function(msg){
		console._sb_err(__("ERROR: ")+msg); 
	}

	console.info = function(msg){
		console.log(__("INFO: ")+msg); 
	}
}); 

var User = function(){
	this.loggedin = false; 
	this.username = "default";
}

var Session = function(x){
	this.user = new User(); 
	this.rendered_widgets = {}; 
	this.object = x; 
}

Session.prototype = {
	get sid(){
		return this.object.sid; 
	}
}

Session.prototype.save = function(){
	server.emit("session_save", this); 
	this.object.save(); 
}

Session.prototype.toJSON = function(){
	return {
		sid: this.sid, 
		user: this.user,
		data: this.data
	}
}

Server.prototype.shutdown = function(){
	this.http.close(); 
}

		
Server.prototype.init = function(config){
	var self = this; 
	var ret = Q.defer(); 
	
	this.BASEDIR = __dirname+"/"; 
	this.config = config; 
	this.cache = {}; 
	this.cache.sessions = {}; 
	this.cache.mailer_templates = {}; 
	this.db = {}; 
	this.plugins = plugins; 
	this.jquery = $; 
	
	this.filter = {
		filters: [], 
		add: function(filter, replace){
			this.filters.push({filter: filter, replace: replace}); 
		}, 
		apply: function(str){
			this.filters.map(function(x){
				str = str.replace(x.filter, x.replace); 
			}); 
			return str.toString(); 
		}
	}; 
	/*
	this.pool = {
		// get object by name
		get: function(model){
			if(model in self.db.objects){
				return new self.db.objects[model](); 
			}
			throw new Error("Object "+model+" not found!"); 
		}, 
		type: function(model){
			if(model in self.db.objects){
				return self.db.objects[model]; 
			}
			throw new Error("Object "+model+" not found!"); 
		}
	}
	*/
	
	if(!("site_path" in config)) config.site_path = process.cwd(); 

	console.log("Initializing database with configuration "+JSON.stringify(config.database));
	var db = new sequelize(config.database.database, config.database.user, config.database.password, {
		define: {
			charset: "utf8", 
			collate: 'utf8_general_ci',
			freezeTableName: true,
		},
		host: config.database.hostname,
		dialect: "mysql"
	}); 
	// test a query to make sure everything is working..
	db.query("select 1 from dual").error(function(err){
		console.error(__("Could not connect to database: %s", err));
		process.exit(); 
	}); 
	db.types = sequelize; 
	db.objects = {}; 
	
	this.db = db; 
	
	// initialize all objects
	async.eachSeries(Object.keys(Server._objects), function(x, next){
		var model = Server._objects[x]; 
		
		// resolv all the types
		Object.keys(model.fields).map(function(x){
			if(typeof(model.fields[x]) == "object"){
				var typename = model.fields[x].type.toString().toUpperCase(); 
				if(!(typename in self.db.types)){
					delete model.fields[x]; 
				} else {
					model.fields[x].type = self.db.types[typename]; 
				}
			} else {
				model.fields[x] = self.db.types[model.fields[x].toString().toUpperCase()]; 
			}
		}); 
								
		self.registerObjectFields(x, model.fields).done(function(){
			next(); 
		}); 
	}, function(){
		self.vfs.add_index(__dirname+"/content"); 
		
		self.StartServer(); 
		server_started = true; 
		console.log("Server listening on "+(self.config.server_socket||self.config.server_port||"localhost"));
		
		ret.resolve(); 
	}); 
	
	return ret.promise; 
}

Server._objects = {}; 
Server._widgets = {}; 
Server._pages = {}; 
Server._commands = {}; 

Server.registerObject = function(opts){
	if(!opts || !opts.name) throw Error("No name passed to registerObject!"); 			
	Server._objects[opts.name] = opts; 
}

Server.registerWidget = function(opts){
	if(!opts || !opts.name) 
		throw Error("No widget name supplied to registerWidget!"); 
	Server._widgets[opts.name] = opts; 
}

Server.registerPage = function(opts){
	if(!opts || !opts.path) throw Error("No page path supplied to registerPage!"); 
	Server._pages[opts.path] = opts; 
}

Server.prototype.registerClientScript = function(path){
	if(fs.existsSync(path)){
		Client.client_code = fs.readFileSync(path).toString() + Client.client_code; 
	}
}


Server.prototype.object = function(name){
	var i = new ServerObject(); 
	i.server = this; 
	i._object = null; 
	i._table = this.db.objects[name]; 
	i._object_name = name; 
	
	if(!name) throw Error("No name supplied to Server::object()"); 
	
	//console.debug("Looking up model for "+name+" in "+Object.keys(Server._objects)); 
	var model = Server._objects[name]||{}; 
	// define object getters and setters for each field
	if(model && model.fields){
		Object.keys(model.fields).map(function(f){
			//console.debug("Defining getter for field "+f+" of "+model.name); 
			Object.defineProperty(i, f, {
				get: function(){
					if(this._object) 
						return this._object[f]; 
					return null; 
				},
				set: function(v){
					this._write[f] = true; 
					if(this._object)
						this._object[f] = v; 
				}
			}); 
		}); 
	} else {
		return null; 
	}
	
	if(name in i && (typeof i[name]) == "function")
		i[name](); 
	
	return i; 
}

Server.prototype.ClientRequest = function(request, res){
	var self = this; 
	
	function parseCookieString(str){
		var cookies = {}; 
		str && str.split(';').forEach(function( cookie ) {
			var parts = cookie.split('=');
			cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
		});
		return cookies; 
	}

	var query = url.parse(request.url, true);
		
	var req = {
		path: "/"+query.pathname.replace(/\/+$/, "").replace(/^\/+/, "").replace(/\/+/g, "/"), 
		args: query.query,
		meta: {}, 
		method: request.method, 
		cookies: parseCookieString(request.headers.cookie),
		server: this, 
		_request: request, 
		render: function(template, fragments){
			return self.RenderFragments(template, fragments, this); 
		}, 
		
		can: function(perm){
			if(!this.session.user) return false; 
			return this.session.user.can(perm); 
		},
		document: null, 
		readFileSync: function(name){
			var file = self.vfs.resolve(name); 
			console.debug("Trying to load request specific file: "+name+" ("+file+")"); 
			if(fs.existsSync(file)){
				return fs.readFileSync(file).toString(); 
			} else {
				return null; 
			}
		}
	}
	
	res.cookies = {}; 
	
	async.eachSeries(this._middleware, 
		function(func, next){
			func.call(self, req, res, function(done){
				if(!done){
					next(); 
				} else {
					console.debug("Route resolved successfully!"); 
					res.end(); 
				}
			}); 
		}, 
		function(err){
			res.writeHead(404, {}); 
			res.write("The url was not found on this server!"); 
			res.end(); 
		}
	); 
}

Server.prototype.registerObjectFields = function(name, fields){
	var table = {}; 
	var self = this; 
	var ret = Q.defer(); 
	
	if(!(name in self.db.objects)){
		self.db.objects[name] = table = self.db.define(name, fields); 
		table.sync().success(function(){
			async.eachSeries(Object.keys(fields), function(f, next){
				//console.info("Updating field "+f+" for "+name+"!"); 
				if(!self.config.update){
					next(); 
					return; 
				}
				var def = {}; 
				if(typeof(fields[f]) == "object") def = fields[f]; 
				else def = {type: fields[f]}; 
				
				// need to prevent setting primary key twice
				self.db.getQueryInterface().changeColumn(table.tableName, f, def)
				.success(function(){next();})
				.error(function(err){
					console.debug("ERROR: "+err); 
					self.db.getQueryInterface().addColumn(table.tableName, f, def)
					.success(function(){next();})
					.error(function(err){
						console.debug("ERROR: "+err);  
						next(); 
					}); 
				}); 
			}, function(){
				table.sync().success(function(){
					ret.resolve(table);
				}).error(function(){
					ret.resolve(table); 
				});
			}); 
		}); 
	} else {
		var table = self.db.objects[name]; 
		async.eachSeries(Object.keys(fields), function(f, next){
			console.info("Registering field "+f+" for "+name+"!"); 
			var field = {}; 
			if(typeof(fields[f]) == "object") field = fields[f]; 
			else field = {type: fields[f]}; 
			
			if(!self.config.update){
				next(); 
				return; 
			} else if(!field.primaryKey){
				self.db.getQueryInterface().changeColumn(table.tableName, f, field)
				.success(function(){next();})
				.error(function(err){
					console.debug("ERROR: "+err); 
					self.db.getQueryInterface().addColumn(table.tableName, f, field)
					.success(function(){next();})
					.error(function(err){
						console.debug("ERROR: "+err);  
						next(); 
					}); 
				});   
			} else {
				next();
			}
		}, function(){
			ret.resolve(table); 
		}); 
	}
	return ret.promise;  
}

Server.prototype.StartServer = function(){
	var self = this; 
	self.http = http.createServer(function(req, res){
		self.ClientRequest(req, res); 
	});
	self.http.listen(self.config.server_socket||self.config.server_port||8000);
}

Server.prototype.boot = function(){
	var loader = require("./modules/loader"); 
	console.debug("====== BOOTING SITE ======"); 
	
	var self = this; 
	var server = this.server; 
	
	var site = this.site; 
	
	function LoadPlugins(directory, next){
		console.debug("Loading plugins from "+directory); 
		if(!fs.existsSync(directory)){
			next(); 
			return; 
		}
		fs.readdir(directory, function(err, files) {
			var pl = []; 
			if(err || !files){
				next(); 
				return; 
			}
			async.each(files||[], function(file, next){
				fs.stat(directory + '/' + file, function(err, stats) {
					if(stats.isDirectory()) {
						pl.push(file); 
					}
					next(); 
				});
			}, loadplugins); 
			function loadplugins(){
				async.eachSeries(pl, function(plug, cb){
					console.debug("Loading plugin "+plug); 
					LoadModule(directory+"/"+plug, function(module){
						plugins[plug] = module; 
						cb();
					}, plug); 
				}, function(){
					next(); 
				}); 
			}
		});
	}
	function LoadModule(path, cb, prefix){
		prefix = prefix || ""; 
		loader.LoadModule(path, function(module){
			if(!module){
				console.error("Could not load module "+path);
				cb(null); 
				return; 
			}
			async.series([
				// add content to web root
				function(next){
					vfs.add_index(path+"/content", next); 
				},  
				// load objects
				function(next){
					if(!fs.existsSync(path+"/objects")){
						next(); 
						return; 
					}
					fs.readdir(path+"/objects", function(err, files){
						if(files) files.sort(); 
						async.eachSeries(files, function(file, next){
							if(!/.*js$/.test(file)){
								next(); 
								return; 
							}
							file = path+"/objects/"+file; 
							console.debug("Loading object from "+file); 
							var model = require(file).model; 
							
							var required = ["constructor", "fields", "name"];
							var fail = false;  
							if(!model){
								console.error("Object definition in "+file+" is missing 'model' field defining the model of the object!"); 
								fail = true; 
							} else {
								required.map(function(x){
									if(!(x in model)){
										console.error("Object definition in "+file+" is missing required field "+x);
										fail = true; 
									}
								}); 
							}
							if(fail){
								next();
								return; 
							}
							
							if(!model.tableName)
								model.tableName = model.name.replace(/\./g, "_"); 
								
							// resolv all the types
							Object.keys(model.fields).map(function(x){
								if(typeof(model.fields[x]) == "object"){
									var typename = model.fields[x].type.toString().toUpperCase(); 
									if(!(typename in self.db.types)){
										delete model.fields[x]; 
									} else {
										model.fields[x].type = self.db.types[typename]; 
									}
								} else {
									model.fields[x] = self.db.types[model.fields[x].toString().toUpperCase()]; 
								}
							}); 
							
							console.debug(Object.keys(model.fields)); 
							
							self.registerObjectFields(model.tableName, model.fields).done(function(def){
								var child = model.constructor; // Child type as function Child(){}
								if(!child) 
									throw Error("Model must contain a constructor property!"); 
								if(!def) 
									throw Error("There was an error in your definition!"); 
								
								var proto = child.prototype; 
								
								// replace prototype with base class 	
								if(model.name in self.db.objects){
									console.debug("DDDDD overriding object "+model.name); 
									self.server.extend(child, self.db.objects[model.name]); 
									//child.prototype = new self.db.objects[model.name](); 
									//child.prototype.super = self.db.objects[model.name].prototype; 
								} else {
									self.server.extend(child, ServerObject); 
									//child.prototype = new ServerObject(); 
									//child.prototype.super = ServerObject.prototype;
								}
								
								child.prototype._table = def; 
								child.prototype._object_name = model.name; 
								child.prototype.server = self.server; 
								//child.prototype.constructor = child; 
								
								// define object getters and setters for each field
								Object.keys(model.fields).map(function(f){
									//console.debug("Defining getter for field "+f+" of "+model.name); 
									child.prototype.__defineGetter__(f, function(){
										//if(this._write && (f in this._write))
										//	return this._write[f]; 
										if(this._object) 
											return this._object[f]; 
										return null; 
									});
									child.prototype.__defineSetter__(f, function(v){
										//if(!this._write) this._write = {}; 
										this._write[f] = true; 
										if(this._object)
											this._object[f] = v; 
									});
								}); 
								
								self.db.objects[model.name] = child; 
								
								def.sync().success(function(){
									if(model.index && self.config.update){
										self.db.getQueryInterface().removeIndex(def.tableName, def.tableName+"_main_index").success(function(){
										
											self.db.getQueryInterface().addIndex(def.tableName, model.index, {
												indexName: def.tableName+"_main_index",
												indicesType: 'UNIQUE'
											}); 
										}).error(function(err){
											self.db.getQueryInterface().addIndex(def.tableName, model.index, {
												indexName: def.tableName+"_main_index",
												indicesType: 'UNIQUE'
											}); 
										}); 
									}
									next(); 
								});  
								
							}); 
							
						}, function(){
							next(); 
						}); 
					});
				},
				
				// load all the forms
				function(next){
					for(var key in module.forms) {
						var name = ((prefix)?(prefix+":"):"")+key; 
						forms[name] = module.forms[key]; 
					}
					next(); 
				},
				// load all widgets
				function(next){
					var widgets = self.server.pool.get("res.widget"); 
					console.log("Loading all widgets for module "+path); 
					async.eachSeries(Object.keys(module.widgets), function(key, next){
						var name = ((prefix)?(prefix+":"):"")+key; 
						
						console.debug("Loading widget "+name); 
						widgets.find({
							name: name
						}, {
							name: name, 
							type: name, 
							code: forms[name],
							parent: null,
							original_template: forms[name]
						}).done(function(w){
							w.original_template = forms[name]; 
							w.code = forms[name]; 
							
							self.widget_types[name] = module.widgets[key]; 
							var x = Object.create(server); 
							
							// replace the render method with a widget specific method that takes into account template prefixing TODO
							x.render = function(template, data){
								// if already prefixed with plugin name then we just render as normal. 
								console.debug("Rendering template "+template+" for "+prefix); 
								if(template.indexOf(prefix) == 0) 
									return server.render(template, data); 
								// otherwise prefix it with the plugin name
								return server.render(((prefix)?(prefix+":"):"")+template, data); 
							} 
							
							var child = self.widget_types[name]; 
							if(!child) throw Error("View type not defined!"); 
							
							self.server.extend(child, ServerView); 
							
							child.prototype.server = x; 
							child.prototype.widget_id = name;
							child.prototype._name = name; 
							
							w.save().done(function(){
								next(); 
							}); 
						}); 
					}, function(){
						next();
					}); 
				},
				// load client code
				function(next){
					if(!self.client_code)
						self.client_code = ""; 
						
					if(!fs.existsSync(path+"/client")){
						next(); 
						return; 
					}
					fs.readdir(path+"/client", function(err, files){
						if(files) files.sort(); 
						for(var key in files){
							var file = files[key]; 
							if(/\.js$/.test(file)){
								console.log("Loading client script "+path+"/client/"+file); 
								self.client_code += fs.readFileSync(path+"/client/"+file); 
							}
						}
						next(); 
					});
				},
				// load css code
				function(next){
					var dirname = path+"/css/"; 
					if(!self.client_style)
						self.client_style = ""; 
					if(!fs.existsSync(dirname)){
						next(); 
						return; 
					}
					fs.readdir(dirname, function(err, files){
						if(files) files.sort(); 
						for(var key in files){
							var file = files[key]; 
							if(/\.css$/.test(file)){
								console.log("Loading stylesheet "+dirname+file); 
								var css = fs.readFileSync(dirname+file); 
								if(css)
									self.client_style += css; 
							}
						}
						next(); 
					});
				}, 
				// load mailer templates into cache
				function(next){
					var dirname= path+"/mailer_templates/"; 
					if(!fs.existsSync(dirname)){
						next(); 
						return; 
					}
					fs.readdir(dirname, function(err, files){
						if(files) files.sort(); 
						files.map(function(file){
							if(fs.statSync(dirname+file).isDirectory()){
								console.log("Adding mailer template: "+dirname+file); 
								self.cache.mailer_templates[file] = {
									path: dirname,
									template: file
								}; 
							}
						}); 
						next(); 
					});
				}
			], function(){
				console.debug("Loaded module from path "+path); 
				module.server = self.server; 
				
				if("init" in module) {
					var t = setTimeout(function(){
						console.error("Module initialization timed out for "+path); 
						cb(module); 
					}, 5000); 
					
					
					module.init(server).done(function(){
						clearTimeout(t); 
						cb(module); 
					}); 
				} else {
					cb(module);
				}
			}); 
		});
	}
	async.series([
		function(cb){
			LoadModule(__dirname, function(module){
				if(!module){
					console.debug("Could not load core components!"); 
					process.exit(); 
				}
				core = module;
				cb(); 
			}); 
		}, 
		function(next){
			console.debug("Loading core plugins.."); 
			LoadPlugins(__dirname+"/plugins", next); 
		},
		function(callback){
			console.debug("Indexing module content in "+__dirname+"/content"); 
			vfs.add_index(__dirname+"/content", function(){
				callback(); 
			}); 
		},
		function(cb){
			console.debug("Loading site data..."); 
			LoadModule(self.config.site_path, function(module){
				if(!module){
					console.error("Could not load main site module!");
					process.exit(); 
				} 
				cb(); 
			}); 
		},
		function(next){
			console.debug("Loading site plugins.."); 
			LoadPlugins(self.config.site_path+"/plugins", next); 
		}
	], function(){
		if (cluster.isMaster) {
			// this is the master control process
			console.log("Control process running: PID=" + process.pid);

			// fork as many times as we have CPUs
			var numCPUs = require("os").cpus().length;

			cluster.fork();

			// handle unwanted worker exits
			cluster.on("exit", function(worker, code) {
				if (code != 0) {
					console.log("Worker crashed! Spawning a replacement.");
					cluster.fork();
				}
			}); 
		} else {
			/*process.on('uncaughtException', function (err) {
				var crash = "=============================\n";
				crash += "Program crashed on "+(new Date())+"\n"; 
				crash += (err)?err.stack:err; 
				console.error(crash); 
				fs.appendFile(self.config.site_path+"/crashlog.log", crash); 
			});*/
			
			var server_started = false; 
			setTimeout(function(){
				if(!server_started) {
					console.error("Site is taking too long to start! did you forget to call 'next' in the site 'init' method?"); 
					process.exit(); 
				}
			}, 30000); 
			
			console.debug("Starting site..."); 
			site.init(server).done(function(){
				self.StartServer(); 
				server_started = true; 
				console.log("Server listening on "+(self.config.server_socket||self.config.server_port||"localhost"));
			});
		}
	}); 
	
}

Server.registerWidget({
	name: "root", 
	html: fs.readFileSync(__dirname+"/html/root.html"),
	client: ""
}); 

Server.loadPlugin = function(file){
	if(!fs.existsSync(file)){
		return; 
	}
	var sc = fs.readFileSync(file).toString(); 
	
	var context = Object.create(exports); 
	Object.keys(global).map(function(key){context[key] = global[key];}); 
	context.require = require; 
	context.__dirname = Path.dirname(file); 
	context.exports = {}; 
	
	// execute the script in the exports context
	(new Function( "with(this) { " + sc + "}")).call(context);
}


Client.script(__dirname+"/siteboot-client.js"); 
Client.css(__dirname+"/siteboot.css"); 

exports.Server = Server; 
exports.Client = Client; 
exports.ServerObject = ServerObject; 
exports.Widget = Widget; 
exports.$ = $; 
exports.mustache = mustache; 
