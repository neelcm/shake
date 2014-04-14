var express     = require('express');
var MemoryStore = express.session.MemoryStore;
var app         = express();

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(app.router);
    app.use(express.session({
        store: new MemoryStore(),
        secret: 'secret',
        key: 'bla'
    }));
});

app.get('/reset', function(req, res){
	app.set('firstName', 'null');
	app.set('secondName', 'null');
	app.set('jsonToReturn', 'null');
	app.set('retval', 'vamsi');
    console.log('init session name = ' + app.get('firstName'));
    res.end("Session restarted!");
});



app.get('/vamsi', function(req, res){

	if(app.get('jsonToReturn') == 'null') {


		if(app.get('firstName') == 'null') {
			app.set('firstName', 'vamsi');
			console.log('first shake: ' + app.get('firstName'));

			res.json({
	    			'list': [{
			            'name': 'x',
			            'phone': 'x',
			            'email': 'x'
	    				}]
		 	});
		}

		else {
			
			app.set('secondName', 'vamsi');

			app.set('jsonToReturn', 'vamsi');

			//console.log('first shake (should be a name): ' + app.get('firstName'));
			console.log('second shake: ' + app.get('secondName'));

			if(app.get('firstName') == 'neel') {
				res.json({
	    			'list': [{
			            'name': 'Neel Mouleeswaran',
			            'phone': '408-318-3895',
			            'email': 'moulees2@illinois.edu'
	    				}]
				 	});
			}

			else if(app.get('firstName') == 'vamsi') {
				res.json({
	    			'list': [{
			            'name': 'Vamsi Ponnapalli',
			            'phone': '732-425-2913',
			            'email': 'ponnapa2@illinois.edu'
	    				}]
				 	});
			}

			else if(app.get('firstName') == 'sully') {
			res.json({
    			'list': [{
		            'name': 'Jeremy Sullivan',
		            'phone': '847-275-2410',
		            'email': 'jsulli2@illinois.edu'
    				}]
			 	});
			}

			else if(app.get('firstName') == app.get('secondName')) {
				
				res.json({
	    			'list': [{
			            'name': 'Neel Mouleeswaran',
			            'phone': '408-318-3895',
			            'email': 'moulees2@illinois.edu'
	    				}]
				 	});

				app.set('retval', 'vamsi');

				console.log("resolved conflict! - vamsi");
			}

			else {
				res.send("ERROR!");
			}

			app.set('firstName', 'null');
			app.set('secondName', 'null');

		}

	}


	else {
		// return the jsontoreturn
		if(app.get('jsonToReturn') == 'neel') {
				res.json({
	    			'list': [{
			            'name': 'Neel Mouleeswaran',
			            'phone': '408-318-3895',
			            'email': 'moulees2@illinois.edu'
	    				}]
				 	});
		}

		else if(app.get('jsonToReturn') == 'sully') {
			res.json({
    			'list': [{
		            'name': 'Jeremy Sullivan',
		            'phone': '847-275-2410',
		            'email': 'jsulli2@illinois.edu'
    				}]
			 	});
		}

		app.set('jsonToReturn', 'null');
		app.set('firstName', 'null');
		app.set('secondName', 'null');
	}

	
  	res.send('hello vamsi');
});

app.get('/neel', function(req, res){

	if(app.get('jsonToReturn') == 'null') {


		if(app.get('firstName') == 'null') {
			app.set('firstName', 'neel');
			console.log('first shake: ' + app.get('firstName'));

			res.json({
	    			'list': [{
			            'name': 'x',
			            'phone': 'x',
			            'email': 'x'
	    				}]
		 	});
		}

		else {
			
			app.set('secondName', 'neel');

			app.set('jsonToReturn', 'neel');

			//console.log('first shake (should be a name): ' + app.get('firstName'));
			console.log('second shake: ' + app.get('secondName'));

			if(app.get('firstName') == 'vamsi') {
				res.json({
	    			'list': [{
			            'name': 'Vamsi Ponnapalli',
			            'phone': '732-425-2913',
			            'email': 'ponnapa2@illinois.edu'
	    				}]
				 	});
			}

			else if(app.get('firstName') == 'sully') {
			res.json({
    			'list': [{
		            'name': 'Jeremy Sullivan',
		            'phone': '847-275-2410',
		            'email': 'jsulli2@illinois.edu'
    				}]
			 	});
			}

			else if(app.get('firstName') == app.get('secondName')) {
				
				if(app.get('retval') == 'vamsi') {

					res.json({
	    			'list': [{
			            'name': 'Vamsi Ponnapalli',
			            'phone': '732-425-2913',
			            'email': 'ponnapa2@illinois.edu'
	    				}]
				 	});

				 	//app.set('retval', 'sully');
				}
	
				else {

					res.json({
		    			'list': [{
			            'name': 'Jeremy Sullivan',
			            'phone': '847-275-2410',
			            'email': 'jsulli2@illinois.edu'
	    				}]
				 	});

					//app.set('retval', 'vamsi');

				} 

				
			}

			else {
				res.send("ERROR!");
			}

			app.set('firstName', 'null');
			app.set('secondName', 'null');
		}

	}

	else {
		
		// return the jsontoreturn
		if(app.get('jsonToReturn') == 'vamsi') {
				res.json({
	    			'list': [{
			            'name': 'Vamsi Ponnapalli',
			            'phone': '732-425-2913',
			            'email': 'ponnapa2@illinois.edu'
	    				}]
				 	});
			}

		else if(app.get('jsonToReturn') == 'sully') {
			res.json({
    			'list': [{
		            'name': 'Jeremy Sullivan',
		            'phone': '847-275-2410',
		            'email': 'jsulli2@illinois.edu'
    				}]
			 	});
		}

		app.set('jsonToReturn', 'null');
		app.set('firstName', 'null');
		app.set('secondName', 'null');
	}

	
  	res.send('hello neel');


});

app.get('/sully', function(req, res){
	

	if(app.get('jsonToReturn') == 'null') {


		if(app.get('firstName') == 'null') {
			app.set('firstName', 'sully');
			console.log('first shake: ' + app.get('firstName'));

			res.json({
	    			'list': [{
			            'name': 'x',
			            'phone': 'x',
			            'email': 'x'
	    				}]
		 	});
		}

		else {
			
			app.set('secondName', 'sully');

			app.set('jsonToReturn', 'sully');

			//console.log('first shake (should be a name): ' + app.get('firstName'));
			console.log('second shake: ' + app.get('secondName'));

			if(app.get('firstName') == 'neel') {
					
				app.set('retval', 'sully');

				res.json({
	    			'list': [{
			            'name': 'Neel Mouleeswaran',
			            'phone': '408-318-3895',
			            'email': 'moulees2@illinois.edu'
	    				}]
				 	});

			}

			else if(app.get('firstName') == 'vamsi') {
				
				app.set('retval', 'sully');

				res.json({
	    			'list': [{
			            'name': 'Vamsi Ponnapalli',
			            'phone': '732-425-2913',
			            'email': 'ponnapa2@illinois.edu'
	    				}]
				 	});

				
			}

			// else if(app.get('firstName') == app.get('secondName')) {
				
			// 	res.json({
	  //   			'list': [{
			//             'name': 'Neel Mouleeswaran',
			//             'phone': '408-318-3895',
			//             'email': 'moulees2@illinois.edu'
	  //   				}]
			// 	 	});
			// }

			else {
				res.send("ERROR!");
			}

			app.set('firstName', 'null');
			app.set('secondName', 'null');

		}

	}


	else {
		// return the jsontoreturn
		if(app.get('jsonToReturn') == 'neel') {
				res.json({
	    			'list': [{
			            'name': 'Neel Mouleeswaran',
			            'phone': '408-318-3895',
			            'email': 'moulees2@illinois.edu'
	    				}]
				 	});
		}

		else if(app.get('jsonToReturn') == 'vamsi') {
			res.json({
	    			'list': [{
			            'name': 'Vamsi Ponnapalli',
			            'phone': '732-425-2913',
			            'email': 'ponnapa2@illinois.edu'
	    				}]
			});
		}

		app.set('jsonToReturn', 'null');
		app.set('firstName', 'null');
		app.set('secondName', 'null');
	}

	
  	res.send('hello sully');

});

app.listen(3000);
