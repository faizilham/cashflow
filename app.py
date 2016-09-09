#!python

from flask import Flask
from database import Database
import yaml

config = None
with open("config.yml", 'r') as f:
	config = yaml.load(f)

app = Flask(__name__)
db = Database(config["dbpath"])

@app.route("/add")
def add():
	return "ok"

@app.route("/")
def hello():
	return "Hello World!"

if __name__ == "__main__":
	app.run(port=config["port"])
	db.close()
