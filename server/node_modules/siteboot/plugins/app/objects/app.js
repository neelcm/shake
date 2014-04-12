function App(){
	
}

exports.model = {
	constructor: App,
	name: "app.app",
	fields: {
		id: {
			type: "integer",
			primaryKey: true,
			autoIncrement: true
		},
		name: "string", 
		status: "string", 
		current_md5: "string", // checksum of currently installed version
		fetch_url: "string",
		git_url: "string"
	},
	index: ["name"]
}
