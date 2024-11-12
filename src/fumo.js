const c = require('./config')
const Discord = require('discord.js')
const amiami = require("./amiami")
const state = require("./state")

const config = c.getConfig()

const client = new Discord.Client(
	{ 
		intents: 
		[
			Discord.GatewayIntentBits.Guilds, 
			//Discord.GatewayIntentBits.MessageContent,
			Discord.GatewayIntentBits.GuildMessageReactions,
			Discord.GatewayIntentBits.GuildMessages,
			Discord.GatewayIntentBits.GuildEmojisAndStickers,
			Discord.GatewayIntentBits.DirectMessages
		] 
	}
)

client.on(
	"ready", 
	async () => {
		console.log(`Fumo in. | ${client.user.tag}`)

		client.user.setActivity('fumos', { type: 'WATCHING' })

		console.log("Running on servers:")
		var guilds = client.guilds.cache.map(g => g)
		for(var i = 0; i < guilds.length; i += 1)
		{
			console.log(guilds[i].name + ": " + guilds[i].id)
		}

		var channel = client.channels.cache.get(config.channel_id)
		await channel.send("ᗜ‿ᗜ")

		var itemBatches = []
		for (var i = 0; i < config.searches.length; i += 1)
		{
			itemBatches[i] = await amiami.search(config.searches[i])
		}

		var items = processItems(itemBatches)
		console.log(items)

		var stateReport = state.compare(getDate(), items)
		var threadMessage = await channel.send(getReportMessage(items, stateReport))
		var thread = await createThread(threadMessage)

		await printStatus(thread, items, stateReport)
		state.save(getDate(), items)
	}
)

function getReportMessage(items, stateReport)
{
	const noNewFumosMessage = `No new fumos today but **${items.length}** fumos are still available. ᗜˬᗜ`
	const noFumosMessage = `You cannot buy any fumos at all today. ᗜ˰ᗜ`

	if (items.length == 0)
	{
		return noFumosMessage
	}
	if (stateReport.firstRun || stateReport.newItems.length == 0)
	{
		return noNewFumosMessage
	}
	var newFumosMessage = `# BREAKING FUMO NEWS: ${stateReport.newItems.length} new fumos are available. ᗜ‿ᗜ`
	if (stateReport.newItems.length == 1)
	{
		newFumosMessage = `# BREAKING FUMO NEWS: 1 new fumo is available. ᗜ‿ᗜ`
	}

	newFumosMessage += "\n```"
	for(var i = 0; i < stateReport.newItems.length; i += 1)
	{
		newFumosMessage += `\n${stateReport.newItems[i].gname}`
	}
	newFumosMessage += "\n```"

	return newFumosMessage
}

client.login(config.discord_token)

function getDate()
{
	const date = new Date()
	
	const day = String(date.getDate()).padStart(2, '0')
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const year = date.getFullYear()
	
	return `${day}-${month}-${year}`
}

async function createThread(message)
{
	const date = getDate()

	var thread = await message.startThread(
		{
			name: 'FUMO NEWS ' + date,
			autoArchiveDuration: 60,
			type: 'GUILD_PUBLIC_THREAD',
			reason: 'fumo'
		}
	)

	return thread
}


// Merges all searches into a single list, 
// filters out closed orders and non-whitelisted makers.
function processItems(itemBatches)
{
	var items = []

	for(var i = 0 ; i < itemBatches.length; i += 1)
	{
		for(var k = 0 ; k < itemBatches[i].length; k += 1)
		{
			var availability = getAvailability(itemBatches[i][k])
			if (availability.includes("Closed") || !isWhitelistedMaker(itemBatches[i][k]))
			{
				continue
			}

			items[items.length] = itemBatches[i][k]
		}
	}

	return items
}

// Filters out any makers we're not interested in.
function isWhitelistedMaker(item)
{
	// Empty or missing whitelist allows everything through.
	if (config.makers_whitelist == undefined || config.makers_whitelist == null)
	{
		return true
	}
	if (config.makers_whitelist.length == 0)
	{
		return true
	}
	for(var i = 0; i < config.makers_whitelist.length; i += 1)
	{
		if (item.maker_name.toLowerCase() == config.makers_whitelist[i].toLowerCase())
		{
			return true
		}
	}
	return false
}

async function printStatus(channel, items, stateReport)
{
	for(var i = items.length - 1; i >= 0; i -= 1)
	{
		var isNew = stateReport.newItems.indexOf(items[i]) >= 0

		const attachment = new Discord.AttachmentBuilder(`https://img.amiami.com${items[i].thumb_url}`, 'image.jpg');
		var msg = `**${items[i].gname}**`
		+ `\n### [${getAvailability(items[i])}](https://www.amiami.com/eng/detail/?gcode=${items[i].gcode})`
		+ ` (**${items[i].c_price_taxed}JPY**)`
		if (isNew)
		{
			msg = "# NEW: " + msg
		}
		await channel.send({ content: msg, files: [attachment] })
	}
}

function getAvailability(item)
{
	var isSale = item['saleitem'] == 1
	var isLimited = item['list_store_bonus'] == 1 || item['list_amiami_limited'] == 1
	var isPreowned = item['condition_flg'] == 1
	var isPreorder = item['preorderitem'] == 1
	var isBackorder = item['list_backorder_available'] == 1
	var isClosed = item['order_closed_flg'] == 1

	if (isClosed)
	{
		if (isPreorder)
		{
				return "Pre-order Closed"
		}
		if (isBackorder)
		{
				return "Back-order Closed"
		}
		return "Order Closed"
	}
	if (isPreorder)
	{
			return "Pre-order"
	}
	if (isBackorder)
	{
			return "Back-order"
	}
	if (isPreowned)
	{
			return "Pre-owned"
	}
	if (isLimited)
	{
			return "Limited"
	}
	if (isSale)
	{
			return "On Sale"
	}
	return "Buy Now"
}
