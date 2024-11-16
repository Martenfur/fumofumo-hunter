const fs = require("fs")

const stateFileName = "src/.state.json"

function load()
{
	if (!fs.existsSync(stateFileName))
	{
		return { empty: true }
	}
	const data = fs.readFileSync(stateFileName, "utf8")
	return JSON.parse(data)
}

function save(dateString, items)
{
	var state = {
		date: dateString,
		items: [],
		empty: false
	}

	for(var i = 0; i < items.length; i += 1)
	{
		state.items[i] = items[i]
	}

	fs.writeFileSync(stateFileName, JSON.stringify(state, null, 4))
}

function compare(dateString, items)
{
	var state = load()
	if (state.empty)
	{
		return {
			firstRun: true,
			newItems: [],
			dayChanged: true
		}
	}
	var report = {
		dayChanged: (state.date != dateString),
		firstRun: false,
		newItems: []
	}

	for(var i = 0; i < items.length; i += 1)
	{
		var hasItem = false
		for(var k = 0; k < state.items.length; k += 1)
		{
			if (state.items[k].gcode == items[i].gcode)
			{
				hasItem = true
			}
		}

		if (!hasItem)
		{
			report.newItems[report.newItems.length] = items[i]
		}
	}

	return report
}

exports.load = load
exports.save = save
exports.compare = compare
