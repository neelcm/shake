var Q = require("q"); 
var crypto = require("crypto"); 
var async = require("async"); 

function Widget(obj){
	this._object = obj; 
	return this.super.constructor.call(this); 
}

Server.registerObject({
	constructor: Widget,
	name: "res_widget",
	fields: {
		id: {
			type: "integer",
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: "string",
			unique: true
		}, 
		type: "string", // widget type (as in js class)
		code: "text", // widget html 
		parent: "string", // name of widget that the widget is subclassed from
		original_template: "string" // path to the original template
	}
}); 
