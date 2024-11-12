# Fumo Stalker

![img](img/fumo.png "fumo")

This Discord bot tracks fumo sales on [amiami.com](https://amiami.com) and pings when new fumos appear.

## Setup

### Installation

You can host fumo stalker yourself. In order to do that, modify `config.json` with your data:

```
{
	"searches": 
	[
		"touhou fumofumo plush",
		"touhou mini plush"
	],
	"makers_whitelist": 
	[
		"Gift",
		"Amiami"
	],
	"check_delay_minutes": 30,
	"channel_id": "<channel-id-where-bot-will-post>",
	"discord_token": "<your-discord-bot-token>"
}

```

`searches` - determines what the bot searches for on Amiami.

`makers_whitelist` - filters out everything not made by listed makers. Leave empty to allow all makers.

`check_delay_munites` - how often the bot checks new stock in minutes. Note that this doesn't mean the bot will post more frequently - posts will only appear once a day or when new stock appears.

`channel_id` - id of the channel where the bot will be posting.

`discord_token` - your bot's discord token.

On first run, use:

```
sudo npm install -g npm
```

After that, you should install `forever` npm module that enables autorestarting in case of crashes.

### Running manually

**Note that running as a service is the preferred method!!!**

Run foxlet from root repo's directory with this command:

```
forever src/fumo.js
```

You can also run the bot directly without `forever` (but it won't restart after crashing):

```
node src/fumo.js
```

### Running as a service (Linux)

Running as a service enables the bot to run in the background and start automatically after reboots.

1. Create a new service file:
   `sudo nano /etc/systemd/system/fumo.service`
2. Paste this into it:

```ini
[Unit]
Description = fumo
After = network.target

[Service]
WorkingDirectory=/home/pi/fumo
ExecStart = forever src/fumo.js

[Install]
WantedBy = multi-user.target
```

3. `sudo systemctl daemon-reload`
4. `sudo systemctl enable fumo.service`
5. `sudo systemctl start fumo.service`

If you make any changes to the service file, run:

```bash
sudo systemctl daemon-reload
sudo systemctl stop fumo.service
```

If you want to stop the service:

```bash
sudo systemctl stop fumo.service
```

If you want to check the logs:

```bash
sudo systemctl status fumo.service
```
