const fs = require("fs")

function getConfig()
{
	const data = fs.readFileSync("src/config.json", "utf8")
	return JSON.parse(data)
}


exports.getConfig = getConfig