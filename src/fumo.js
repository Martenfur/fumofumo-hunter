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

var channel = null

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

		channel = client.channels.cache.get(config.channel_id)
		await channel.send("ᗜ‿ᗜ")

		run()
	}
)

async function run()
{
	var itemBatches = []
	for (var i = 0; i < config.searches.length; i += 1)
	{
		var result = await amiami.search(config.searches[i])
		if (result != null)
		{
			itemBatches[itemBatches.length] = result
		}
		else
		{
			console.log("Something went wrong retrieving data from Amiami!")
			setTimeout(run, config.check_delay_minutes * 60 * 1000)
			return
		}
	}

	var items = processItems(itemBatches)
	console.log(items)

	var stateReport = state.compare(getDate(), items)
	if (stateReport.dayChanged || stateReport.newItems.length > 0 || stateReport.removedItems.length > 0)
	{
		var reportMessage = getReportMessage(items, stateReport)
		var messageContent = {
			content: reportMessage.message,
			files: []
		}
		for(var i = 0; i < reportMessage.images.length; i += 1)
		{
			messageContent.files[messageContent.files.length] = new Discord.AttachmentBuilder(`https://img.amiami.com${reportMessage.images[i]}`, 'image.jpg')
			if (messageContent.files.length >= 10)
			{
				break
			}
		}
		var threadMessage = null
		try
		{
			threadMessage = await channel.send(messageContent)
		}
		catch(e)
		{
			console.log(e)
			threadMessage = await channel.send(messageContent.content)
		}
		var thread = await createThread(threadMessage)

		await printStatus(thread, items, stateReport)
		state.save(getDate(), items)
	}

	setTimeout(run, config.check_delay_minutes * 60 * 1000)
}

function getReportMessage(items, stateReport)
{
	const noNewFumosMessage = `No new fumos today but **${items.length}** fumos are still available. ᗜˬᗜ`
	const noFumosMessage = `You cannot buy any fumos at all today. ᗜ˰ᗜ`

	if (items.length == 0)
	{
		return { message: noFumosMessage, images: [] }
	}
	if (stateReport.firstRun || (stateReport.newItems.length == 0 && stateReport.removedItems.length == 0))
	{
		return { message: noNewFumosMessage, images: [] }
	}
	// Not the best idea to jsut go with @everyone but who cares tbh.
	var images = []
	var msg = ""

	if (stateReport.newItems.length > 0)
	{
		msg += `@everyone\n# BREAKING FUMO NEWS: ${stateReport.newItems.length} new fumos are available. ᗜ‿ᗜ`
		if (stateReport.newItems.length == 1)
		{
			msg = `@everyone\n# BREAKING FUMO NEWS: 1 new fumo is available. ᗜ‿ᗜ`
		}

		msg += "\n```"
		for(var i = 0; i < stateReport.newItems.length; i += 1)
		{
			msg += `\n${stateReport.newItems[i].gname}`
			images[images.length] = stateReport.newItems[i].thumb_url
		}
		msg += "\n```"
	}
	if (stateReport.removedItems.length > 0)
	{
		msg += "\n"
		if (stateReport.newItems.length > 0)
		{
			msg += "Also "
		}
		if (stateReport.removedItems.length == 1)
		{
			msg += `1 fumo was removed from sale. ᗜ˰ᗜ`
		}
		else
		{
			msg += `${stateReport.removedItems.length} fumos were removed from sale. ᗜ˰ᗜ`
		}

		msg += "\n```"
		for(var i = 0; i < stateReport.removedItems.length; i += 1)
		{
			msg += `\n${stateReport.removedItems[i].gname}`
			images[images.length] = stateReport.removedItems[i].thumb_url
		}
		msg += "\n```"
	}

	return { message: msg, images: images }
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


