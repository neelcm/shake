Server(function(){
	Server.prototype.RenderWidget = function(name, req){
		var ret = this.defer(); 
		var self = this; 
		
		console.debug("Rendering widget "+name); 
		var widget = self.widget(name); 
		if(!widget){
			ret.resolve({
					object: {},
					html: "Widget not found!"
				}); 
			return ret.promise; 
		}
		widget.render(req).done(function(obj){
			var type = Object.prototype.toString.call(obj); 
			if(!obj || (type != "[object Object]")){
				console.error("Error while rendering "+name+" - returned object is not an object! ("+type+")"); 
				ret.resolve({
					object: {},
					html: "Undefined"
				});
				return; 
			}
			
			console.log(widget.html.html()); 
			self.RenderFragmentsRaw(widget.html.html(), obj, req).done(function(html){
				ret.resolve({
					object: obj,
					html: html
				}); 
			}); 
		}); 
		
		/*
		var widgets = self.server.pool.get("res.widget"); 
		console.debug("RenderWidget: "+name); 
		widgets.find({name: name, language: req.language}).done(function(w){
			if(!w){
				ret.resolve({
					object: {},
					html: "Widget not found!"
				});
				return; 
			}
			var widget = self.CreateWidget(w.type, w); 
			widget.render(req).done(function(obj){
				var type = Object.prototype.toString.call(obj); 
				if(!obj || (type != "[object Object]")){
					console.error("Error while rendering "+name+" - returned object is not an object! ("+type+")"); 
					ret.resolve({
						object: {},
						html: "Undefined"
					});
					return; 
				}
				
				self.RenderFragmentsRaw(w.code, obj, req).done(function(html){
					ret.resolve({
						object: obj,
						html: html
					}); 
				}); 
			}, function(result){
				ret.reject(result); 
			}); 
		});
				*/				
		return ret.promise; 
	}

	Server.prototype.RenderFragments = function(template, fragments, context){
		return this.RenderFragmentsRaw(forms[template], fragments, context); 
	}

	Server.prototype.RenderFragmentsRaw = function(template, fragments, context){
		var proms = []; 
		var result = Q.defer();  
		var self = this; 
		
		var data = {}; 
		if(!fragments) fragments = {}; 
		
		Object.keys(fragments).map(function(x){
			if(fragments[x] && typeof fragments[x] == "object" && "done" in fragments[x]){
				proms.push([x, fragments[x] ]); 
			} else {
				data[x] = fragments[x]; 
			}
		}); 
		// render all promises
		async.eachSeries(proms, function(x, next){
			//console.debug("Rendering fragment "+x[0]+" for "+template); 
			var timeout = setTimeout(function(){
				console.error("Rendering timed out for "+x[0]);
				data[x[0]] = "Timed out!"; 
				next(); 
			}, 2000); 
			x[1].done(function(obj){
				//console.debug("Done rendering fragment "+x[0]+" for "+template); 
				clearTimeout(timeout); 
				data[x[0]] = obj.html; 
				next(); 
			}); 
		}, function(){
			data["__"] = function(){
				return function(text){
					if(context && context.__)
						return context.__.apply(context, arguments); 
					else 
						return text + "(untranslated)"; 
				}
			}
			var html = mustache.render(template||"", data); 
			
			// parse out the embedded widgets
			// syntax {{@<widgetclass> arg1="value" arg2="value"}}
			var tr = /\[\[\s*([\.0-9a-zA-Z:_]+)(.*?)\]\]/g;
			var results = {}; 
			var proms = {}; 
			
			html = html.replace(tr, function(){
				var argparse = /([^\s]+)=(["][^"]*["]|[^\s]*)/g; 
				
				var request = {}; 
				Object.keys(context).map(function(x){request[x] = context[x];}); 
				var args = {}; 
				Object.keys(context.args).map(function(x){args[x] = context.args[x];}); 
				
				while(m = argparse.exec(arguments[2])){
					console.log("Adding argument "+m[1]+": "+m[2].replace(/\"/g, "")); 
					args[m[1]] = m[2].replace(/\"/g, ""); 
				}
				results[arguments[1]] = args; 
				var view = "view_"+arguments[3]; 
				
				console.debug("Adding to render queue: "+arguments[0]); 
				//proms[view] = self.CreateWidget(arguments[1], args).render(context); 
				request.args = args; 
				
				proms[view] = self.RenderWidget(arguments[1], request); 
				
				return "{{{"+view+"}}}"; 
			}); 
			//}
			// at this point the html contains all translated labels and the only thing that is left to do is replace the inserted tags with the actual content. In order to do that, we need to loop through the content to be rendered, render it, and then to run render on the result. 
			if(Object.keys(proms).length){
				// Only render if there is something to render
				self.RenderFragmentsRaw(html, proms, context).done(function(html){
					result.resolve(html); 
					//wrap_result(html); 
				}); 
			} else {
				//wrap_result(html);
				result.resolve(html); 
			}
			function wrap_result(html){
				//result.resolve(html); 
				result.resolve(mustache.render(forms["widget.wrapper"], {
					content: html
				})); 
			}
		}); 
		return result.promise; 
	}

}); 
