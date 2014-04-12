Server(function(){
	ServerObject.prototype._create = function(name, o){
		var obj = this.server.object(name); 
		obj._object = o; 
		return obj; 
	}

	ServerObject.prototype._loadProperties = function(opts){
		var self = this; 
		var ret = self.server.defer(); 
		
		self.properties = {}; 
		self._properties_orig = {}; 
		
		var props = self.server.object("res_property"); 
		
		// prevent infinite loop of getting properties of properties
		if(props._object_name === this._object_name) {
			ret.resolve(); 
			return ret.promise; 
		}
		
		var search = {object_type: this._object_name, object_id: self.id}; 
		if(opts && opts.language)
			search.language = opts.language; 
		else
			search.language = "en"; 
			
		props.search(search).done(function(ids){
			props.browse(ids).done(function(ps){
				ps.map(function(x){
					self.properties[x.name] = x.value;
					self._properties_orig[x.name] = x.value;
				}); 
				ret.resolve(); 
			}); 
		}); 
		
		return ret.promise; 
	}

	/**
	 * Use this method to initialize the object CLASS.
	 * This method is called only once, right after the object class is loaded.
	 * */
	ServerObject.prototype.init = function(){
		var ret = Q.defer(); 
		ret.resolve(); 
		return ret.promise; 
	}

	ServerObject.prototype.initInstance = function(opts){
		var ret = this.server.defer(); 
		var self = this; 
		
		this._loadProperties(opts).done(function(){
			if(opts && opts.language) self.language = opts.language; 
			ret.resolve(); 
		}); 
		
		return ret.promise; 
	}

	ServerObject.prototype.create = function(opts){
		var result = Q.defer(); 
		var self = this; 
		this._table.create(opts).success(function(o, created){
			var obj = self._create(self._object_name, o); 
			console.debug("ServerObject::create()"); 
			obj.initInstance(opts).done(function(){
				result.resolve(obj); 
			}); 
		}).error(function(err){
			console.error(err); 
			result.resolve(); 
		}); 
		return result.promise; 
	}

	ServerObject.prototype.remove = function(ids){
		var result = Q.defer(); 
		var where = {where: ["id in (?)", ids]}; 
		if(ids && ids.length){
			this._table.findAll(where).success(function(objs){
				async.forEach(objs, function(obj, next){
					obj.destroy().success(function(){
						next(); 
					}); 
				}, function(){
					result.resolve(); 
				}); 
			}); 
		} else {
			console.error("Zero length ids list passed to remove()"); 
			result.resolve(); 
		}
		
		return result.promise; 
	}

	ServerObject.prototype.search = function(opts, context){
		var result = Q.defer(); 
		var self = this; 
		
		if(opts){
			var search = {}; 
			Object.keys(opts).map(function(x){
				if(x in self._table.rawAttributes)
					search[x] = opts[x]; 
			}); 
			this._table.findAll({where: search}).success(finish); 
		} else {
			this._table.findAll().success(finish);
		}
		function finish(objs){
			var ret = [];
			if(objs)
				ret = objs.map(function(x){return x.id}); 
			result.resolve(ret); 
		}
		return result.promise; 
	}

	ServerObject.prototype.find = function(opts, vals){
		var ret = Q.defer(); 
		var self = this; 
		
		self.search(opts).done(function(ids){
			if(ids.length == 0){
				if(vals){
					self.create(vals, opts).done(function(obj){
						ret.resolve(obj); 
					}); 
				} else {
					ret.resolve(null); 
				}
			} else {
				self.browse([ids[0]], opts).done(function(objs){
					if(objs.length){
						ret.resolve(objs[0]); 
					}
					else
						ret.resolve(null); 
				});
			}
		}); 
		return ret.promise; 
	}

	ServerObject.prototype.browse = function(ids, opts){
		var result = Q.defer(); 
		var self = this; 
		
		var argtype = Object.prototype.toString.call(ids); 
		var where = null; 
		
		if( argtype === "[object Array]" && ids.length)
			where = {where: ["id in (?)", ids]}; 
		else if(argtype === "[object Array]" && !ids.length){
			result.resolve([]); 
			return result.promise; 
		}
		else if(argtype === "[object Number]")
			where = {where: ["id = ?", ids]}; 
		else if(argtype === "[object Object]" && ids != null)
			where = {where: where}
		else if(argtype === "[object Object]" && ids == null){
			result.resolve([]); 
			return result.promise; 
		}
		else if(argtype === "[object Undefined]" || !ids || !ids.length)
			where = null; 
		
		function done(objs){
			console.debug("Found "+objs.length+" objects.."); 
			var list = []; 
			async.forEachSeries(objs, function(x, next){
				var obj = self._create(self._object_name, x); 
				obj.initInstance(opts).done(function(){
					list.push(obj); 
					next(); 
				}); 
			}, function(){
				result.resolve(list); 
			}); 
		}
		if(where){
			self._table.findAll(where).success(function(objs){
				done(objs); 
			}); 
		} else {
			self._table.findAll().success(function(objs){
				done(objs); 
			}); 
		}
		
		return result.promise; 
	}

	ServerObject.prototype.save = function(){
		var ret = this.server.defer(); 
		if(this._object){
			// TODO: check if the item was already changed by someone else 
			//console.debug("Writing attributes: "+Object.keys(this._write)); 
			//console.debug("Object: "+JSON.stringify(this._object.values)); 
			this._object.save(Object.keys(this._write)).success(function(){
				ret.resolve(); 
			}).error(function(){
				ret.reject(); 
			}); 
			
			this._write = {}; 
		} else {
			ret.reject(); 
		}
		return ret.promise; 
	}

	ServerObject.prototype.reload = function(){
		var ret = this.server.defer(); 
		
		this._object.reload().success(function(){
			ret.resolve(); 
		}); 
		
		return ret.promise; 
	}

	ServerObject.prototype.destroy = function(){
		var ret = this.server.defer(); 
		if(this._object){
			this._object.destroy().success(function(){
				ret.resolve(); 
			}).error(function(err){
				ret.reject(err); 
			}); 
		} else {
			ret.reject("ServerObject.destroy(): _object is null!"); 
		}
		return ret.promise; 
	}

	// Used for for example setting form values
	ServerObject.prototype.update = function(vals){
		var ret = this.server.defer(); 
		var self = this; 
		
		if(self._object && vals){
			Object.keys(vals).map(function(k){
				if(self._object && k in self._object.values){
					//console.debug("Setting key "+k); 
					self[k] = vals[k]; 
				}
			}); 
			self.save().done(function(){
				var props = self.server.object("res_property"); 
				async.eachSeries(Object.keys(vals.properties||{}), function(prop, next){
					props.find({
						object_type: self._object_name,
						object_id: self.id,
						name: prop,
						language: self.language
					}).done(function(o){
						if(o){
							o.value = vals.properties[prop]; 
							o.save().done(function(){
								next(); 
							}); 
						} else {
							next(); 
						}
					}); 
				}, function(){
					ret.resolve(); 
				}); 
			}); 
		} else {
			ret.resolve(); 
		}
		
		return ret.promise; 
	}

	ServerObject.prototype.toJSON = function(){
		var obj = {}; 
		var self = this; 
		Object.keys(self._object.values).map(function(x){obj[x] = self._object.values[x]});
		return obj; 
	}
}); 

/** 
 * GET object by id. 
 * Arguments: <object_type> <object_id>
 * Returns: JSON representation of object
 **/
 
Server.registerCommand({
	name: "object-get", 
	method: function(req, res, type, id){
		var ret = req.server.defer(); 
		
		if(type && id){
			var posts = req.server.object(type); 
			posts.find({id: id, language: req.language}).done(function(p){
				if(!p){
					ret.resolve({error: "Object with id "+args[1]+" not found!"}); 
				} else {
					var obj = Object.create(p._object.values); 
					obj.properties = p.properties; 
					ret.resolve(obj); 
				}
			}); 
		} else {
			ret.resolve({error: "Wrong number of arguments to command"}); 
		}
		
		return ret.promise; 
	}
}); 

/**
 * UPDATE object by id
 * Arguments: <object_type> <OBJECT> 
 * Return: {success|error}
 * Note: OBJECT must be a json representation of the object
 **/
 
Server.registerCommand({
	name: "object-update", 
	method: function(req, res, type, data){
		var ret = req.server.defer(); 
		
		if(type && data){
			var pool = req.server.object(type); 
			pool.find({id: data.id, language: req.language}).done(function(p){
				if(p){
					//console.debug("Will update object with id: "+p.id); 
					p.update(data).done(function(){
						ret.resolve({success: "Successfully updated object id "+data.id}); 
					}); 
				} else {
					ret.resolve({error: "Object id "+data.id+" not found!"}); 
				}
			}); 
		} else {
			ret.resolve({error: "Wrong arguments. Expecting [type, data]"}); 
		}
		
		return ret.promise; 
	}
}); 
