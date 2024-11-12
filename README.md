# foxlet

Your local retarded bot.

## Setup

### Installation

You can host foxlet either on Heroku or yourself. If you host it yourself, add a `.env` file to the repo root with the following content:

```
AUTOPOST_CHANNEL_ID=discord_channel_id
DISCORD_TOKEN=bot_token
VAULT=local_storage_path
OWNER=855155221448884324
MEME_DIR=path/to/your/memes/
PUBLIC_MEME_LINK=url
PRANK_DIR=path/to/frame
PROTECTED_THREAD=thread_id_to_protect
PROTECTED_THREAD_ARCHIVE_DIR=/path/to/archive/

```

On first run, use:

```
sudo npm install -g npm
```

After that, you should install `forever` npm module that enables autorestarting in case of crashes.

Run foxlet from root repo's directory with this command:

`forever src/foxlet.js`

### Running manually

You can manually run foxlet by using `screen` command.

1. `screen -R -D`
2. `cd ~/foxlet` (or your foxlet checkout directory of choice)
3. `forever src/foxlet.js`
4. Press `Ctrl+A`, `Ctrl+D`

Note that this will not make foxlet autostart on boot.

### Running as a service

1. Create a new service file:
   `sudo nano /etc/systemd/system/foxlet.service`
2. Paste this into it:

```ini
[Unit]
Description = Your local retarded bot.
After = network.target

[Service]
WorkingDirectory=/home/pi/foxlet
ExecStart = forever src/foxlet.js

[Install]
WantedBy = multi-user.target
```

3. `sudo systemctl daemon-reload`
4. `sudo systemctl enable foxlet.service`
5. `sudo systemctl start foxlet.service`

If you make any changes to the service file, run:

```bash
sudo systemctl daemon-reload
sudo systemctl stop foxlet.service
```

If you want to stop the service:

```bash
sudo systemctl stop foxlet.service
```

If you want to check the logs:

```bash
sudo systemctl status foxlet.service
```
