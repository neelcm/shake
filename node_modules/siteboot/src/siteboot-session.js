
ServerObject.prototype.res_session = function(){
	this.__create = this.create; 
	this.create = function(opts){
		var self = this; 
		var ret = self.server.defer(); 
		
		if(!opts) opts={};
		opts.sid = opts.sid||String(crypto.createHash("sha1").update(String(Math.random())).digest("hex")); 
		
		self.__create.call(self, opts).done(function(session){
			ret.resolve(session); 
		});  
		return ret.promise; 
	}	

	this.__browse = this.browse; 
	this.browse = function(ids){
		var self = this; 
		var ret = self.server.defer(); 
		
		self.__browse.call(self, ids).done(function(sessions){
			var result = []; 
			async.forEachSeries(sessions, function(s, next){
				if(s.user_id){
					var users = self.server.object("res_user"); 
					users.find({id: s.user_id}).done(function(user){
						s.user = user; 
						result.push(s); 
						next(); 
					}); 
				} else {
					result.push(s); 
					next(); 
				}
			}, function(){
				ret.resolve(result); 
			}); 
		}); 
		
		return ret.promise; 
	}

	this.__toJSON = this.toJSON; 
	this.toJSON = function(){
		var obj = this.__toJSON.call(this); 
		obj.user = this.user; 
		return obj; 
	}

	this.__reload = this.reload; 
	this.reload = function(){
		var ret = this.server.defer(); 
		this.__reload.call(this).done(function(){
			if(this.user){
				this.user.reload().done(function(){
					ret.resolve();
				}); 
			} else {
				ret.resolve(); 
			}
		}); 
		return ret.promise;  
	}
}

Server.registerObject({
	name: "res_session",
	fields: {
		id: {
			type: "integer",
			primaryKey: true,
			autoIncrement: true
		},
		user_id: {
			type: "integer",
			referencesKey: "id",
			referencesTable: "users"
		}, 
		sid: "string", 
		language: "string"
	},
	index: ["sid"]
}); 

Server.session = function(){
	var self = this; 
	this.cache = {}; 
	
	return function(req, res, next){
		var sid = req.cookies["session"]; 
		console.debug("Looking up session: "+sid); 
		// the perfect solution for multiple simultaneous requests coming in at the same time for the same session. 
		if(!self.cache[sid]){
			self.cache[sid] = {
				sid: sid, 
				session: null, 
				promise: function(){
					if(this.session) this.session.reload(); 
					if(!this._promise){
						this._promise = Q.defer(); 
						var ret = this._promise; 
						var sessions = req.server.object("res_session"); 
						if(!sessions){
							console.error("Sessions not supported!"); 
							ret.resolve(); 
							return ret.promise; 
						}
						sessions.find({sid: this.sid}).done(function(session){
							if(!session){
								sessions.create({language: "en"}).done(function(session){
									console.debug("Created new session in database with sid: "+session.sid);
									ret.resolve(session); 
								}); 
							} else {
								console.debug("Loaded existing session: "+session.sid);
								ret.resolve(session); 
							}
						}); 
						return ret.promise; 
					} else {
						return this._promise.promise; 
					}
				}
			}
		} 
		self.cache[sid].promise().done(function(session){
			if(!session){
				//req.session = self.cache.sessions[sid].session; 
				console.error("Could not get session from database!"); 
				next(); 
				return; 
			}
			session.reload().done(function(){
				req.session = session; 
				// set up session locale
				var i = Object.create(i18n); 
				var lang = req.language = req.session.language = (req.args["lang"]||req.session.language||"en"); 
				
				i.configure({
					locales: ["en", "se"],
					directory: self.config.site_path+"/lang",
					defaultLocale: lang
				}); 
				req.__ = i.__; 
				
				console.debug("Setting session sid cookie: "+session.sid); 
				res.cookies["session"] = session.sid+"; path=/"; 
			
				session.save().done(function(){
					next(); 
				}); 
			}); 
		}); 
	}
}

function setSessionTimeout(session){
	if("timeout" in session)
		clearTimeout(session.timeout); 
	session.timeout = setTimeout(function(){
		console.debug("Removing session object for "+session.sid); 
		server.emitAsync("session_destroy", session, function(){
			session.object.destroy(); 
			delete cache.sessions[session.sid];
		}); 
	}, 60000*(config.session_ttl||20)); 
}; 
