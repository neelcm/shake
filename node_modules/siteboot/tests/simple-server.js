var siteboot = require("../siteboot"); 
var fs = require("fs"); 

var Server = siteboot.Server; 
var Client = siteboot.Client; 
var ServerObject = siteboot.ServerObject; 
var Widget = siteboot.Widget; 
var $ = siteboot.$; 
var async = require("async"); 
var jsdom = require("jsdom"); 
var Path = require("path"); 

ServerObject.prototype.test_obj = function(){
	console.log("Initializing a test_obj instance!"); 
}

Server.registerObject({
	name: "test_obj", 
	fields: {
		id: {
			type: "integer",
			autoIncrement: true, 
			primaryKey: true
		}, 
		name: "string"
	}
}); 

var server = new Server(); 

var server_name = "";

$.fn.page_content = function(){
	return this.each(function(){
		var html = fs.readFileSync(__dirname+"/simple-server.html").toString(); 
		$(this).html(html); 
		
		this.load = function(req){
			var ret = $.Deferred(); 
			var self = $(this); 
			
			$(this).weld({
				page: req.args["page"], 
				picker: "item2",
				message: "Pure awesomeness!"
			}).done(function(){
				ret.resolve(); 
			}); 
			return ret.promise(); 
		}
	}); 
}

$.fn.simple_widget = function(){
	this.attr("ismessage", true); 
	
	this.each(function(i, elem){
		elem.load = function(req){
			var ret = $.Deferred(); 
			var self = $(this); 
			setTimeout(function(){
				console.log("Rendered simple widget!"); 
				self.html("It's working! Simple widget working!"); 
				ret.resolve(self); 
			}, 10); 
			return ret.promise(); 
		}
	}); 
	
	return this; 
}

$.fn.foobar = function(){
	$(this).each(function(i, e){
		e.load = function(req){
			var ret = $.Deferred();
			var self = this; 
			
			$(this).text(JSON.stringify(Object.keys(req))); 
			
			ret.resolve(); 
			return ret.promise(); 
		}
	}); 
	return this; 
}

$.fn.fancy_control = function(){
	return this.each(function(i, e){
		e.load = function(req){
			var ret = $.Deferred(); 
			var self = this; 
			
			server.object("test_obj").find({name: "Success!"}).done(function(obj){
				if(obj){
					$(self).html("Name: "+obj.name); 
				}
				ret.resolve(); 
			}); 
			
			return ret.promise(); 
		}
	}); 
}

Server.registerCommand("ident", function(req, res, name){
	var ret = this.defer(); 
	
	server_name = name; 
	
	ret.resolve(); 
	return ret.promise; 
}); 
	
Client.script(__dirname+"/simple-server-client.js"); 

server.use(Server.dom); 
server.use(Server.client); 
server.use(Server.static(__dirname)); 
server.use(Server.router);

server.init({
	database: {
		"hostname": "localhost",
		"user": "test",
		"password": "test",
		"database": "siteboot_test"
	},
	server_port: 8000
}).done(function(){
	/** This should be done in siteboot on startup! **/
	server.vfs.add_index(__dirname+"/../content"); 
	
	
	server.object("test_obj").create({
		name: "Success!"
	}); 
	
	server.route("/", function(req, res){
		var ret = req.server.defer(); 
		
		res.writeHead(301, {
			"Location": "/home"
		}); 
		res.end(); 
		
		ret.resolve(); 
		return ret.promise; 
	}); 
	
	server.route("/:page", function(req){
		var ret = server.defer(); 
		var doc = req.document; 
		// make it a content page
		var page = $(doc).find("body"); 
		
		page.page_content(); 
		page.find("#message").fancy_control(); 
		//page.find("#list").append($("<html>").foobar().html()); 
		page.find("#list").append($(doc.createElement()).foobar()); 
		
		ret.resolve(); 
		
		return ret.promise; 
	}); 
}); 
