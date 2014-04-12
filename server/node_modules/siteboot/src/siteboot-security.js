var Security = function(x){
	this.server = x; 
}

Security.prototype.isAllowed = function(req){
	var ret = this.server.defer(); 
	
	// allow all requests
	ret.resolve(true); 
	
	return ret.promise; 
}

exports.SecurityPolicy = Security; 
