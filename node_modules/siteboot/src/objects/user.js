var Q = require("q"); 
var crypto = require("crypto"); 

Server(function(){
	ServerObject.prototype.res_user = function(){
		this.register = function(opts){
			console.debug("Registering new user "+opts.username); 
			var r = this.server.defer(); 
			this.create(opts).done(function(user){
				if(!user){
					console.error("User by the name of "+opts.username+" already exists!"); 
					r.reject("User by the name of "+opts.username+" already exists!"); 
				} else {
					console.log("Created new user "+opts.username); 
					r.resolve(user); 
				}
			}); 
			return r.promise; 
		}

		this.login = function(opts){
			var self = this; 
			var result = Q.defer(); 
			var username = opts.username; 
			var password = opts.password; 
			var session = opts.session; 
			var hash = opts.hash; 
			
			console.debug("Logging in user "+username+"..."); 
			// hash the password
			hash = hash || crypto.createHash("sha1").update(password).digest("hex"); 
			
			self.find({username: username}).done(function(user){
				if(user){
					var u = user; 
					console.debug("Logging in user "+u.hash+" with "+hash); 
					if(u.hash == hash){
						session["user"] = user; 
						session.user_id = user.id; 
						session.save().done(function(){
							result.resolve(u); 
						}); 
					} else {
						result.reject("Wrong username or password!"); 
					}
				} else {
					console.error("User "+username+" not found!"); 
					result.resolve(); 
				}
			}); 
			return result.promise; 
		}

		this.logout = function(){
			var ret = this.server.defer(); 
			ret.resolve(); 
			return ret.promise; 
		}

		this.can = function(perm){
			if(!perm) return false; 
			var perms = {}; 
			this.caps.split(",").map(function(y){
				perms[y] = true; 
			}); 
			return perm in perms; 
		}
	}
	
	Server.registerObject({
		name: "res_user",
		fields: {
			id: {
				type: "integer",
				primaryKey: true,
				autoIncrement: true
			},
			username: {
				type: "string",
				/*validate: {
					is: ["^[a-z0-9A-Z_\-\.]+$", ""]
				}*/
			}, 
			company: "string", 
			ssn: "string", 
			first_name: "string", 
			last_name: "string", 
			contact_address: "string", 
			billing_address: "string",
			billing_period: {
				type: "integer"
			},
			billing_plan: "string",
			billing_email: "string", 
			email: {
				type: "string",
				allowNull: false
			},
			phone: "string", 
			hash: "string",
			caps: "string", 
			role: "string"
		},
		index: ["username"]
	}); 
	
		
	Server.registerCommand({
		name: "user-login", 
		help: __("Login user"),
		arguments: {
			username: __("Your login name"), 
			password: __("Your password")
		}, 
		method: function(req, res, username, pass){
			var user = req.server.object("res_user"); 
			var ret = req.server.defer();
			
			user.login({
				username: username||"guest", 
				password: pass||"", 
				session: req.session
			}).done(function(success){
				if(success) 
					ret.resolve({success: "User successfully logged in!"}); 
				else 
					ret.resolve({error: "Wrong username or password!"});
			}, function(err){
				ret.resolve({error: "Login failed: "+err}); 
			}); 
			return ret.promise; 
		}
	}); 

	Server.registerCommand({
		name: "user-register", 
		help: __("Register a new account"), 
		method: function(req, res){
			var user = req.server.object("res_user");
			user.create({
				username: (req.args["email"])?req.args.email.replace("[@\.]", "_"):"",
				email: req.args["email"],
				first_name: req.args["first_name"], 
				last_name: req.args["last_name"], 
				role: "admin", 
				hash: crypto.createHash("sha1").update(req.args["password"]).digest('hex')||""
			}).done(function(u){
				if(!u){
					ret.data = JSON.stringify({error: "Could not create user!"});
					result.resolve(ret); 
					return; 
				}
				
				console.debug("Created new user "+req.args["username"]); 
				user.login({
					username: u.username, 
					password: req.args["password"], 
					session: req.session
				}).done(function(success){
					ret.data = JSON.stringify({success: "User successfully registered!"});
					result.resolve(ret); 
				}); 
			}, function(err){
				console.error("Could not create new user!"); 
				ret.data = JSON.stringify({error: err});
				result.resolve(ret); 
			});  
		}
	}); 

	Server.registerCommand({
		name: "whoami",
		help: __("Show information about currently logged in user."),
		method: function(req, res){
			var ret = req.server.defer(); 
			
			ret.resolve({
				success: (req.session && req.session.user)?req.session.user.username:""
			}); 
			
			ret.resolve(); 
			return ret.promise; 
		}
	}); 

}); 
