var Source = function(){
	
}

exports.model = {
	constructor: Source,
	name: "app.source",
	fields: {
		id: {
			type: "integer",
			primaryKey: true,
			autoIncrement: true
		},
		package_list_url: "string",
	},
	index: ["package_list_url"]
}
