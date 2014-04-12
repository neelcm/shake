var siteboot = require("../siteboot"); 

var Server = siteboot.Server; 
var ServerObject = siteboot.ServerObject; 

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

server.init({
	database: {
		"hostname": "localhost",
		"user": "test",
		"password": "test",
		"database": "siteboot_test"
	},
	server_port: 8000
}).done(function(){
	server.object("test_obj").create({
		name: "Success!"
	}).done(function(){
		server.object("test_obj").find({name: "Success!"}).done(function(obj){
			if(obj){
				console.log("Testing object creation: "+obj.name); 
				obj.name = "Successfully changed name field!"; 
				obj.save().done(function(){
					server.object("test_obj").find({id: obj.id}).done(function(obj){
						console.log("New object name: "+obj.name); 
						obj.destroy().done(function(){
							server.object("test_obj").find({name: "Success!"}).done(function(obj){
								if(!obj){
									console.log("Object destroyed.."); 
								} else {
									console.error("Failed to delete object!"); 
								}
							}); 
						}); 
					}); 
				}); 
			} else {
				console.error("Failed to create object!"); 
			}
		}); 
	}); 
}); 
