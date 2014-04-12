
Server._commands = {}

Server.registerCommand = function(command, func){
	var type = Object.prototype.toString.call(command); 
	if(type == "[object String]"){
		if(!command || !func) throw Error("Must supply command and func argument!"); 
		
		if(command in Server._commands) throw Error("Can't register duplicate command for "+command);
		Server._commands[command] = {
			name: command, 
			method: func
		}
	} else if(type == "[object Object]"){
		if(!command.name || !command.method) throw Error("Must specify name and method when registering a command!"); 
		if(command.name in Server._commands) throw Error("Can't register duplicate command for "+command.name);
		Server._commands[command.name] = command; 
	}
}
Server.console = function(){
	var self = this; 
	
	this.console = {
		commands: {},
		exec: function(cmd, args){
			var ret = Q.defer(); 
			console.log("(null console): "+cmd+"("+args+") ");
			if(cmd in this.commands){
				this.commands[cmd].call(this, args).done(function(data){
					 ret.resolve(data); 
				}); 
			} else {
				ret.resolve({error: "Command "+cmd+" not found on the server!"}); 
			}
			return ret.promise; 
		}, 
		
		
	}
	
	return function(req, res, next){
		req.command = function(cmd, args){
			var user = (this.session.user)?this.session.user.username:"(guest)"; 
			console.log(user+" > "+cmd+" : "+args); 
			return self.console.exec(cmd, args); 
		}
		
		if(req.post && req.post.fields["command"]){
			var fields = req.post.fields; 
			var arguments = []; 
			try {
				arguments = JSON.parse(fields["args"]||fields["args[]"]);
			} catch(e){
				arguments = [fields["args"]||fields["args[]"]];
			}
			
			console.log("ARGS: "+JSON.stringify(arguments)); 
			//try { req.args["argv"] = JSON.parse(req.args["args[]"]); } catch(e){}
			if(Object.prototype.toString.call(arguments) != "[object Array]"){
				arguments = [arguments]; 
			}
			
			res.writeHead(200, {
				"Content-Type": "application/json"
			}); 
			
			var command = fields["command"]; 
			if(command in Server._commands){
				console.log("COMMAND: "+command+" language "+req.language); 
				Server._commands[command].method.apply(this, [req, res].concat(arguments)).done(function(obj){
					res.write(JSON.stringify(obj||{})); 
					res.end(); 
				});  
			} else {
				console.error("Unknown command: "+command); 
				res.end(JSON.stringify({error: "Unknown command"})); 
			}
		} else {
			next(); 
		}
	}
}

$.fn.dropdown_console = function(){
	var html = null; 
	return this.each(function(){
		$(this).html(fs.readFileSync(__dirname+"/html/console.html")+""); 
	}); 
}

Client.ready(function(){
	
	server.exec = function(command, args){
		var ret = $.Deferred(); 
		
		$.post("/", {
			command: command, 
			args: JSON.stringify(args)
		}, function(data){
			ret.resolve(data); 
		}); 
		
		return ret.promise(); 
	}

	var commands = {
		website: function(a, b){
			var ret = $.Deferred(); 
			this.echo("Command: "+a+"; "+b); 
			setTimeout(function(){
				ret.resolve(); 
			}, 1000); 
			return ret.promise(); 
		},
		reload: function(){
			var ret = $.Deferred(); 
			this.echo("Reloading..."); 
			window.location.reload(); 
			ret.resolve(); 
			return ret.promise(); 
		}
	}; 
	
	if($('.siteboot-terminal').length){
		var term = $('.siteboot-terminal').terminal(function(command, term){
			var cr = /^\s*([a-zA-Z0-9_-]+)(.*?)$/; 
			var ar = /(["][^"]*["]|[^\s]*)/gi; 
			var cm = cr.exec(command); 
			var args = []; 
			var cmd = cm[1]; 
			if(cm.length > 1){
				args = cm[2].match(ar).filter(function(x){
					if(x == "") return false; 
					return true;
				}).map(function(x){
					return x.replace(/"/g, ""); 
				}); 
			}
			
			if(cmd in commands){
				term.pause(); 
				commands[cmd].apply(term, args).done(function(data){
					term.resume(); 
				}); 
			} else {
				// otherwise send the command to the server
				term.pause(); 
				
				$.post(window.location.path, {
					rcpt: "console", 
					command: cmd, 
					args: args
				}, function(data){
					term.resume(); 
					
					if(!data){
						term.error("Could not communicate with server!"); 
						return; 
					}
					
					if(data.error){
						term.error(data.error); 
					} else {
						term.echo(JSON.stringify(data)); 
					}
				}); 
				
			}
		}, {
			greetings: 'Command console',
			name: 'command_console',
			height: 300,
			prompt: ((session.user)?session.user.username:"(guest)")+" > "
		});
		term.disable(); 
		X.console = {
			log: function(msg){
				this.term.echo(msg); 
			}
		}
		X.console.term = term; 
		
		var disabled = true; 
		$("body").on("keypress", function (e) {
				if(e.which == 167 && disabled){ // § key
					term.enable(); 
					$(".siteboot-terminal").slideDown();
					disabled = false; 
					return false;  
				} else if(e.which == 167 && !disabled){
					term.disable(); 
					$(".siteboot-terminal").slideUp(); 
					disabled = true; 
					return false; 
				}
		});
	}
});
