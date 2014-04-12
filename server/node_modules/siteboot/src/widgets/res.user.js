var JSON = require("JSON"); 
var crypto = require("crypto"); 

/* ******************
 * Official view for editing the res.user objects. 
 * ******************/
Widget.prototype.res_user = function(){
	var Widget = function(x, object){
		this.server = x; 
		this.object = object;  
	}

	Widget.prototype.post = function(req){
		var ret = this.server.defer(); 
		var self = this; 
		
		if("logout" in req.args ){
			if(req.session.user){
				req.session.user_id = null; 
				req.session.save().done(function(){
					delete req.session.user; 
					req.session.user = null; 
					ret.resolve({
						headers: {
							"Location": "/"
						}, 
						data: JSON.stringify({success: "Successfully logged out!"})
					}); 
				}); 
			} else {
				console.debug("Logout: user not logged in!"); 
				ret.resolve({
					headers: {
						"Location": "/"
					}, 
					data: JSON.stringify({success: "You are not logged in!"})
				}); 
			}
			return ret.promise; 
		}
		
		if(!req.session.user || !req.args["id"] || 
			(req.session.user.id != req.args["id"])){
			console.debug("User ID passed in post does not match ID of currently logged in user! ("+req.session.user.id+" != "+req.args["id"]+")"); 
			ret.resolve(JSON.stringify({error: "Forbidden!"})); 
			return ret.promise; 
		}
		
		
		var users = self.server.pool.get("res.user"); 
		users.find({id: req.args["id"]}).done(function(user){
			if(!user){
				ret.resolve(JSON.stringify({error: "User ID "+req.args["id"]+" not found!"})); 
				return ret.promise; 
			}
			
			delete req.args["id"]; 
			delete req.args["hash"]; 
			
			if("save-user" in req.args){
				console.debug("Saving user values!"); 
				
				user.setValues(req.args); 
				
				if(req.args["password"]){
					if(req.args["password"] != req.args["password2"]){
						ret.resolve(JSON.stringify({error: req.__("user.msg.passwords.dont.match")})); 
						return; 
					}
					var new_hash = crypto.createHash("sha1").update(req.args["password"]).digest("hex"); 
					var old_hash = crypto.createHash("sha1").update(req.args["old_password"]).digest("hex"); 
					if(old_hash != user.hash){
						ret.resolve(JSON.stringify({error: req.__("user.msg.wrong.password")})); 
						return; 
					}
					user.hash = new_hash; 
				}
				
				user.save().done(function(){
					ret.resolve(JSON.stringify({success: "Success!"})); 
				}); 
			}
		}); 
		return ret.promise; 
	}

	Widget.prototype.render = function(req){
		var result = this.server.defer(); 
		var self = this; 
		
		this.server.render("res.user", {}, req).done(function(html){
			result.resolve(html); 
		}); 
		
		return result.promise; 
	}
}

exports.module = {
	type: Widget, 
	model: "res.user"
}
