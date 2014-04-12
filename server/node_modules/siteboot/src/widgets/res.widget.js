var JSON = require("JSON"); 
var crypto = require("crypto"); 
/*
var Widget = function(x, object){
	this.server = x; 
	this.object = object;  
}

Widget.prototype.post = function(req){
	var ret = this.server.defer(); 
	var self = this; 
	
	if("get_code" in req.args && req.args["name"]){
		var widgets = self.server.pool.get("res.widget"); 
		widgets.find({name: req.args["name"]}).done(function(widget){
			ret.resolve(widget.code); 
		}); 
	} else {
		ret.resolve(); 
	}
	
	return ret.promise; 
}

Widget.prototype.render = function(req){
	var result = this.server.defer(); 
	var self = this; 
	
	this.server.render("res.widget", {}, req).done(function(html){
		result.resolve(html); 
	}); 
	
	return result.promise; 
}


exports.module = {
	type: Widget, 
	model: "res.widget"
}
*/
