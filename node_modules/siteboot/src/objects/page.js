var Q = require("q"); 
var crypto = require("crypto"); 
var async = require("async"); 

Server(function(){
	ServerObject.prototype.res_page = function(){
		this.res_page_create = this.create; 
		this.create = function(opts){
			var ret = this.server.defer(); 
			// skip errors for page creation
			this.res_page_create.call(this, opts).done(function(){
				ret.resolve(); 
			}, function(){
				ret.resolve(); 
			}); 
			return ret.promise; 
		}
	}
	
	Server.registerObject({
		name: "res_page",
		fields: {
			id: {
				type: "integer",
				primaryKey: true,
				autoIncrement: true
			},
			path: {
				type: "string",
				unique: true
			}, 
			template: {
				type: "string"
			}, 
			title_template: "string", 
			widget_ids: {
				type: "integer",
				referencesKey: "id",
				referencesTable: "widgets"
			}
		}
	}); 
}); 
