FORTMAX SITEBOOT WEB OBJECTS
===========

Fortmax SiteBoot is a web development framework offering you a powerful way to develop javascript based web services. SiteBoot is like a game engine, and your site is like a game - except in the context of siteboot it is html that is sent to the user instead of graphical polygons being sent to the graphics card. 

SiteBoot is written entirely in JavaScript and runs on node js. 

	npm install siteboot
	
USAGE
======

Consider this example that is a complete server side control:

	Server(function(){
			$.fn.my_control = function(){
					return this.each(function(){
							$(this).html("<button>Get message</button>"); 
					}); 
			} 
			Server.registerCommand({
					name: "get-message",
					method: function(req, res){
							var ret = req.server.defer(); 
							ret.resolve({message: "YAY! It's working!"}); 
							return ret.promise; 
					}
			}); 
	}); 

	Client(function(){
			$.fn.my_control = function(){
					return this.each(function(){
							var self = $(this); 
							self.click(function(){
									server.exec("get-message", []).done(function(data){
											self.html(data.message); 
									}); 
									return false; 
							}); 
					}); 
			}
			$(document).ready(function(){
					$(".my_control").my_control();
			});
	}); 
	
In this example above we create a control (server side jQuery!) then we define a command on the server, then we define a client side piece of code directly in the server JS file. This code will run on the client. Everything is done with jQuery both on the server and on the client.

SERVICES PROVIDED BY SITEBOOT
===========

* Excellent tools provided for quick and simple module development (almost every single file is a standalone plugin. All files can be concatenated into one js file). 
* Powerful ORM to map objects to MySQL database. With siteboot you rarely will need to write any SQL code. Instead you will define higher level objects and siteboot will automatically keep the database structure up to date. Use Server.registerObject() for this. 
* Built in localization support - either through __("String") in server code, or with {{#__}}String{{/__}} in html templates. Even objects are localized. We use properties that are attached to every object. All properties are always loaded based on currently chosen language for the session. This allows for very easily implemented localization support. 
* Powerful application development framework. It is very easy to develop new plugins for SiteBoot. 

CREATING AN OBJECT
==========

You will define your objects using Server.registerObject() method: 

	Server.registerObject({
		name: "myobject_name",
		fields: {
			id: {
				type: "integer", 
				autoIncrement: true,
				unique: true
			},
			name: "string",
			description: "text"
		}, 
		index: ["name"]
	}); 

The code above will go into a js file, like "myobject.js". When siteboot loads your site, it will parse this file and automatically create an sql table called "myobject_name" with the colums that you have specified. The markdown of the fields is the same as Sequelize uses, except that we define types as strings instead of referencing Sequelize types. 

If you supply "update: true" flag in your site config then siteboot will also update the table structure for the objects. You have to boot your site once with update true in order to update the table structure if you add a field to an object. 

To access the above object within your application (or within a widget), you will use syntax that looks like this: 

	var pool = req.server.object("myobject_name"); 
	pool.find({name: "foobar"}).done(function(obj){
		console.log(obj.description); 
	}); 

Notice how the fields that you have defined in the object definition are now available as object properties. You can set a field like this: 

	obj.description = "A description"
	
To save an object to the database: 
	
	obj.save().done(function(){console.log("Done!");}); 
	
To delete an object: 

	obj.destroy().done(..); 
	
HOW SITEBOOT MAKES IT WORK
========

On the server side, you have the "res.document" object that is attached to every response object. You can access this document using SiteBoot jQuery (siteboot.$). All siteboot plugins add methods and extend this siteboot jquery object. You have to load your plugins with Server.regsiterPlugin() method. 

Then you define routes to your pages (like "/page/:page"). A route is a function that accepts two arguments: req and res. And has a third argument called "next": route(req, res). This method must return a promise. You write your response using res.write() or by modifying the res.document (provided by server.use(Server.dom) middleware). The final result is sent to the client. 

On the server you use jQuery to manipulate the dom. And there is a special method that you can define for objects called load(). This method should return a promise. This method will be called for each element that has it right before the route middleware sends the page to the client. Inside load() you can call async functions such as database access methods and construct the html for your control. 

MIDDLEWARE
==========

SiteBoot allows you to define middleware that will run for each request. You register a middleware like this: server.use(middleware); Middleware is a function with signature middleware(req, res, next); This allows for adding any number of extra functionality within plugins for siteboot. 

Order of loading your files matters. Think carefully about file dependencies and load files in the right order. Usually all files are concatenated into one single js file that becomes your plugin or website code. 

TEMPLATES
========

All templates in siteboot reside in separate HTML files. Usually in the "/html/" folder. When you define your server side jQuery function for your control, you can load the template using fs.readFileSync(__dirname+"/html/template.html") code. And then you assign the html to the control within jquery. After that you can do anything to this html using server side jQuery, like setting field values etc. 

Mustache is no longer used, well almost - mustache is used for template localization simply because it's a very simple way to localize static strings within the templates. All mustache code is replaced after the whole page is rendered. 

WIDGETS AND SERVER SIDE RENDER
===========================

You can do really cool things like insert widgets into your post content. Then in your client side code you replace the widget with jQuery and retreive a rendered version from the server using the "view-render <viewclass>" server command. You can run server commands just like command line in linux - and you always get a JSON object in return. 

COMMANDS
=======

SiteBoot client code usually communicates with the server through a predefined command line interface. On the server, widgets register commands. On the client the client code calls server.exec() to run an async command on the server. This is done with ajax. Standardized command access allows for fine grained access control to server resources. We can write a middleware that will act like a firewall and filter commands if user is not logged in. Pretty neat! 

On the client: 

	server.exec("command", [args]).done(function(data){
		// do things with the result of the command. 
		alert(data.message); 
	}); 

Register a server side command on the server: 

	Server.registerCommand({
		name: "command", 
		method: function(req, res){
			var ret = req.server.defer(); 
			ret.resolve({foo: "This is a message"}); 
			return ret.promise; 
		}
	}); 

WRITING PLUGINS
========

You can extend the Server object in any way you like. Also the exported siteboot.$ jQuery object is available for adding jQuery methods. 

CONTRIBUTING
========

Many siteboot plugins can be improved. Particularly currently the security module is under development and there needs to be proper access control implemented. SiteBoot will have both a firewall that operates by filtering post and get arguments and a more broad user access control based on roles. This is currently high priority on the list. 

You can contribute by sending me an email to: 

	martin@fortmax.se

License
========

SiteBoot - The Node.js Web Framework Copyright (C) 2013 Martin K. Schröder

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see http://www.gnu.org/licenses/.

Contact
========

SiteBoot is developed by Fortmax AB in Sweden. If you have any questions, feel free to send us an email to info@fortmax.se. 
