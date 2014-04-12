$(document).ready(function(){
	server.call = function(obj, func, args, cb){
		args = args||{}; 
		$.post("/", {
			rcpt: obj, 
			object_id: args["id"]||-1, 
			func: "rpc_"+func, 
			arguments: JSON.stringify(args)
		}, function(data){
			alert(data); 
			cb(data); 
		}); 
	}
}); 
