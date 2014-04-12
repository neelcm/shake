Server.prototype.send_email = function(options, next){
	var path         = require('path'); 
	var emailTemplates = require('email-templates'); 
	var nodemailer     = require('nodemailer');
	var self = this; 
	
	next = next||function(){}; 
	
	if(!options.to || !options.from || !options.template){
		console.error("Mailer: You must specify both to, from and template in options: "+JSON.stringify(options)); 
		next(""); 
		return; 
	}
	options.subject = options.subject||"(no subject)"; 
	
	var tpl = {
		path: __dirname+"/mailer_templates", 
		template: "default"
	}
	
	emailTemplates(tpl.path, function(err, template) {
		if (err) {
			console.log(err);
			return; 
		} 
		var transportBatch = nodemailer.createTransport("SMTP", self.config.mailer.smtp);
		
		var Render = function(data) {
			this.data = data;
			this.send = function(err, html, text) {
				if (err) {
					console.log(err);
					next(""); 
					return; 
				} 
				
				// send the email
				transportBatch.sendMail({
					from: options.from,
					to: options.to,
					subject: options.subject,
					html: html,
					generateTextFromHTML: true
				}, function(err, responseStatus) {
					if (err) {
						console.log(err);
					} else {
						console.log(responseStatus.message);
					}
					
					next(html); 
				});
			};
			this.batch = function(batch) {
				try{
					batch(this.data, "mailer_templates", this.send);
				} catch(e){
					console.log("ERROR WHILE SENDING EMAILS: "+e+"\n"+e.stack); 
					next(""); 
				}
			};
		};
		
		console.debug("Using mailer template: "+tpl.path+"/"+tpl.template); 
		
		// Load the template and send the emails
		template(tpl.template, true, function(err, batch) {
			var render = new Render(options.data||{});
			render.batch(batch);
		});
	});
}
