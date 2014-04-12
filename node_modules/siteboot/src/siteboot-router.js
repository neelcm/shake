Server.router = function(){
	this._routes = {}; 
	var self = this; 
	
	this.route = function(path, func){
		this._routes[path] = func; 
	}
	
	
	var RunRoute = function(req, res){
		var route = null; 
		var ret = this.defer(); 
		
		var path = req.path; 
		async.eachSeries(Object.keys(self._routes), function(key, next){
			if(key == path){
				self._routes[key](req, res).done(function(){
					// if it was processed then resolve and don't continue
					ret.resolve(); 
				}, function(){
					// if promise was rejected then try next
					next();
				}); 
				return; 
			}
			
			var groups = []; 
			var args = {}; 
			var rx = "^"+key.replace(/\:(\w+)/g, function(match, name){
				groups.push(name); 
				return "([^/]+)"; 
			})+"$"; 
			//rx = rx.replace(/\//g, "\\/"); 
			//console.log("Resolve route: "+path+", will use regex: "+rx+": "+path.search(rx)+": "+groups); 
			rx = new RegExp(rx, "g"); 
			var matches = rx.exec(path); 
			if(matches){
				//console.log("Matches: "+JSON.stringify(matches)); 
				var params = {}; 
				var pc = 1; 
				groups.map(function(x){req.args[x] = matches[pc++];}); 
				self._routes[key](req, res).done(function(){
					// if it was processed then resolve and don't continue
					ret.resolve(); 
				}, function(){
					// if promise was rejected then try next
					next();
				}); 
			} else {
				next();
			}
		}, function(){
			ret.reject(); 
		}); 
		return ret.promise;
	}

	return function(req, res, next){
		var session = req.session; 

		console.log("GET: "+req.path); 
		
		res.meta = {
			title_template: "{{title}}",
			title: ""
		}; 
		
		RunRoute(req, res).done(function(){
			var queue = []; 
			$(req.document).find("*").each(function(i, e){
				if("load" in e && (typeof e.load) == "function"){
					queue.push(e); 
				}
			}); 
			
			async.eachSeries(queue, function(e, next){
				e.load(req, res).done(function(){
					next();
				}); 
			}, function(){
				var root = fs.readFileSync(__dirname+"/html/root.html").toString(); 
				var page = mustache.render(root, {
					title: mustache.render(res.meta.title_template, res.meta), 
					content: mustache.render(req.document.body.innerHTML, {
						"__": function(){
							return function(text){
								return req.__(text); 
							}
						}
					})
				}); 
				console.log("Sending back root.."); 
				res.writeHead(200, {
					"Set-Cookie": Object.keys(res.cookies).map(function(x){return x+"="+res.cookies[x];}).reduce(function(a, b){return a+"\n"+b;}, "")
				}); 
				res.write(page); 
				res.end(); 
			}); 
		}, function(){
			next(); 
		}); 
	}
}
