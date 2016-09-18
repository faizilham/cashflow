#!python

from flask import Flask, render_template, request
from database import Database
from helpers import format_money, Cache
import api, yaml, json

config = None
with open("config.yml", 'r') as f:
	config = yaml.load(f)

app = Flask(__name__)
app.config['DEBUG'] = config.get("debug")
app.config['TEMPLATES_AUTO_RELOAD'] = True

db = Database(config["dbpath"])
cache = Cache(db)

apiroute = api.construct_blueprint(db, cache)
app.register_blueprint(apiroute, url_prefix='/api')

@app.route("/")
def index_page():
	accounts = db.getAccounts()

	cashflow = api.get_entries(db, request.args)

	for account in accounts:
		account["current"] = sum((entry["flow"] * entry["amount"]) for entry in cashflow if entry["account"] == account["name"])

	return render_template("index.html", format_money=format_money, stringify=json.dumps, cashflow=cashflow, categories=cache.categories, groups=cache.groups, categoryDict=cache.categoryDict, accounts=accounts)

if __name__ == "__main__":
	app.run(port=config["port"])
