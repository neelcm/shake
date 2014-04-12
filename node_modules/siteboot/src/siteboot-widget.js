var JSON = require("JSON"); 

Server(function(){
	Widget.prototype._model = {}; 
	
	Widget.prototype.param = function(name, value){
		if(value){
			this._model[name] = value; 
		} else {
			return this._model[name]; 
		}
	}
	
	Widget.prototype.post = function(req){
		var r = this.server.defer(); 
		var self = this; 
		
		if(!req.can("admin")){
			r.resolve(JSON.stringify({error: "Need admin!"})); 
			return r.promise; 
		}
		
		console.debug("Widget.post().."); 
		if("action" in req.args && req.args["action"] == "save-property"){
			var name = req.args["property_name"]; 
			var value = req.args["property_value"]; 
			if(name){
				var props = self.server.pool.get("res.property"); 
				props.find({
					object_type: req.args["object_type"]||self.object._object_name, 
					object_id: req.args["object_id"]||self.object.id, 
					name: name,
					language: req.session.language || null
				}, {
					object_type: req.args["object_type"]||self.object._object_name, 
					object_id: req.args["object_id"]||self.object.id, 
					name: name, 
					language: req.session.language || null
				}).done(function(prop){
					if(prop){
						prop.value = value; 
						prop.save().done(done); 
					} else {
						done(); 
					}
				}); 
			} else {
				done(); 
			}
		} else if("action" in req.args && req.args["action"] == "get-property"){
			var name = req.args["property_name"]; 
			var value = req.args["property_value"]; 
			if(name){
				var props = self.server.pool.get("res.property"); 
				props.find({
					object_type: req.args["object_type"]||self.object._object_name, 
					object_id: req.args["object_id"]||self.object.id, 
					name: name,
					language: req.session.language || null
				}).done(function(prop){
					if(prop){
						done(prop.value); 
					} else {
						done(); 
					}
				}); 
			} else {
				done(); 
			}
		} else {
			done(); 
		}
		function done(ret){
			r.resolve(ret); 
		}
		
		return r.promise; 
	}

	Widget.prototype.render = function(req){
		var r = this.server.defer(); 
		r.resolve(this._model); 
		return r.promise; 
	}
}); 

		
/** Weld together parts of the template. Return promise and resolve it once welding is done. Welding might involve time consuming io operations so it's an asynchronous operation. **/

$.fn.weld = function(data){
	var ret = $.Deferred(); 
	var self = this; 
	
	async.eachSeries(Object.keys(data), function(key, next){
		var d = data[key]; 
		async.series([
			function(next){
				if(Object.prototype.toString.call(d) == "[object Array]"){
					var nd = []; 
					console.log("Rendering array for "+key); 
					async.eachSeries(d, function(e, next){
						console.log("Waiting for item.."); 
						e.done(function(obj){
							nd.push(obj.html()); 
							next();
						}); 
					}, function(){
						d = nd.join(); 
						next(); 
					}); 
				} else if((typeof d) == "object" && "done" in d && (typeof d.done) == "function"){
					console.log("Waiting for widget "+key+" to render.."); 
					d.done(function(obj){
						d = obj.html(); 
						next(); 
					}); 
				} else {
					next(); 
				}
			}
		], function(){
			self.each(function(i, sel){
				$(sel).find(["#"+key, "."+key].join(",")).each(function(i, e){
					e = $(e); 
					var type = e.prop("tagName");
					
					console.log("TYPE: "+type); 
					
					var val = ((typeof d) == "object" && "html" in d && (typeof d.html) == "function")?d.html():d; 
					
					if(type == "INPUT" || type == "TEXTAREA")
						e.val(val); 
					else if(type == "SELECT"){
						e.find("option").each(function(i, o){
							$(o).removeAttr("selected"); 
							if($(o).val() == val)
								$(o).attr("selected", true); 
						}); 
					}
					else 
						e.html(val); 
				}); 
			}); 
			next(); 
		}); 
	}, function(){
		ret.resolve(); 
	}); 
	return ret.promise(); 
}

Server.registerCommand({
	name: "view-render",
	method: function(req, res, type){
		var ret = req.server.defer(); 
		var elem = $("<html>"); 
		if(type in $.fn && (typeof $.fn[type]) == "function"){
			$.fn[type].call(elem); 
			if(elem.load && (typeof elem.load) == "function"){
				var result = elem.load(req, res);
				if("done" in result){
					result.done(function(){
						done(); 
					}); 
				} else {
					done(); 
				}
			} else {
				done(); 
			}
		} else {
			ret.resolve({error: "Unknown type of element ("+type+")"}); 
		}
		function done(){
			var html = mustache.render(elem.html(), {
				"__": function(){
					return function(text){
						return req.__(text); 
					}
				}
			}); 
			ret.resolve({html: html}); 
		}
		return ret.promise; 
	}
}); 

Client(function(){
	$.fn.view_client_render = function(){
		return this.each(function(){
			var self = $(this); 
			var type = self.attr("data-client-render"); 
			server.exec("view-render", [type]).done(function(data){
				self.html(data.html);
				if(type in $.fn){
					$.fn[type].call(self); 
				}
			}); 
		}); 
	}
	$(document).ready(function(){
		$("[data-client-render]").each(function(){
			$(this).view_client_render(); 
		}); 
	}); 
}); 
