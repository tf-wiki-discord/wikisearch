# wikisearch
Hi! My name is Rad, and I wanna tell you all about the Transformers!
A search bot for the TFWiki Discord!

Currently deployed on Fly.io:
https://fly.io/apps/radbot/monitoring

Formerly deployed on Heroku:
https://dashboard.heroku.com/apps/tf-wiki-discord-search

Make sure you set the dyno to "worker: index js" as otherwise it will crash, thinking this is a web server and being unable to find the proper port.
