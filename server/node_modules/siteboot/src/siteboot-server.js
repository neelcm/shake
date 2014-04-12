var Q = require("q"); 
var async = require("async"); 

var ServerInterface = function(siteboot){
	this.siteboot = siteboot; 
	this.q = Q; 
	this.config = siteboot.config;
	this.basedir = siteboot.BASEDIR; 
	this.widgets = siteboot.widgets; 
	this.vfs = siteboot.vfs; 
	this.pool = siteboot.pool; 
	this.db = siteboot.db; 
	this.client_code = siteboot.client_code; 
	this.client_style = siteboot.client_style; 
	this.security = siteboot.security; 
	this.mailer.siteboot = this; 
	this.filter = siteboot.filter; 
	this.console = siteboot.console; 
	this.plugins = siteboot.plugins; 
	this.route = {
		_routes: {}, 
		add: function(path, template){
			var self = this; 
			self._routes[path] = template; 
		}, 
		resolve: function(path){
			var self = this; 
			var result = null; 
			for(var key in Object.keys(self._routes)){
				key = Object.keys(self._routes)[key]; 
				var groups = []; 
				var args = {}; 
				var rx = key.replace(/\:(\w+)/g, function(match, name){
					groups.push(name); 
					return "([^/]+)"; 
				}); 
				//rx = rx.replace(/\//g, "\\/"); 
				console.log("Resolve route: "+path+", will use regex: "+rx+": "+path.search(rx)+": "+groups); 
				rx = new RegExp(rx, "g"); 
				var matches = rx.exec(path); 
				if(matches){
					console.log("Matches: "+JSON.stringify(matches)); 
					var params = {}; 
					var pc = 1; 
					groups.map(function(x){params[x] = matches[pc++];}); 
					result = {
						path: path, 
						params: params,
						destination: self._routes[key]
					}
					break; 
				}
			};
			return result; 
		}
	}
}

ServerInterface.prototype.q = Q; 


ServerInterface.prototype.extend = function extend(Child, Base){
	var proto = Child.prototype; 
	Child.prototype = new Base();
	Child.prototype.super = Base.prototype; 
	Object.keys(proto).map(function(x){
		Child.prototype[x] = proto[x]; 
	}); 
}

ServerInterface.prototype.render = function(template, fragments, context){
	return this.siteboot.RenderFragments(template, fragments, context); 
}

ServerInterface.prototype.render_raw = function(template, fragments, context){
	return this.siteboot.RenderFragmentsRaw(template, fragments, context); 
}

ServerInterface.prototype.defer = function(){
	return Q.defer(); 
}

ServerInterface.prototype.create_widget = function(c, object){
	return this.siteboot.CreateWidget(c, object); 
}

ServerInterface.prototype.registerObjectFields = function(name, fields){
	return this.siteboot.registerObjectFields(name, fields); 
}

ServerInterface.prototype.getClientCode = function(session){
	return "var livesite_session = "+(JSON.stringify(session) || "{}")+";\n\n"+this.client_code; 
}; 

exports.ServerInterface = ServerInterface; 
