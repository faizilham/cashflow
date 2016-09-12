#!python

from flask import Flask, request, render_template, abort
from database import Database
from helpers import format_money, Cache
import yaml

config = None
with open("config.yml", 'r') as f:
	config = yaml.load(f)

app = Flask(__name__)
app.config['DEBUG'] = True
app.config['TEMPLATES_AUTO_RELOAD'] = True

db = Database(config["dbpath"])
cache = Cache(db)

def test():
	return "hello"

@app.route("/", methods=['POST'])
def addn():
	return "ok"

@app.route("/add")
def add():
	return "ok"

@app.route("/")
def hello():
	return render_template('index.html', format_money=format_money, cashflow=[], categories=cache.categories, accounts=cache.accounts)

if __name__ == "__main__":
	app.run(port=config["port"])
	db.close()
