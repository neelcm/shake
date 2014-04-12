var fs = require("fs"); 

var config = {
	database: {
		"hostname": "db_host",
		"user": "db_user",
		"password": "db_password",
		"database": "db_name"
	},
	server_port: 8000,
	theme: "livesite",
	klarna: {
		shop_id: "klarna_eid",
		secret_key: "klarna_secret",
	},
	paypal: {
		checkout_url: "paypal_webscr_url",
		seller_email: "payson_seller_email"
	},
	payson: {
		checkout_url: "payson_merchant_url",
		seller_email: "seller email",
		agent_id: "payson_id",
		secret_key: "payson_key"
	}
}

exports.save = function(){
	var fs = require('fs');
	fs.writeFile("config-local.js", "exports.config = "+JSON.stringify(exports.config, null, "\t"), function(err) {
			if(err) {
					console.log(err);
			} else {
					console.log("Config: New configuration was saved successfully to config-local.js");
			}
	}); 
}

if(fs.existsSync("config-local.js")){
	try {
		exports.config = require("./config-local").config;
	} catch(e){
		console.log("WARNING: config-local.js is not found! Using values from config.js!"); 
	}
} else {
	exports.config = config;
}

