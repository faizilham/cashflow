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

	account_dict = {}

	for i, account in enumerate(accounts):
		account["current-credit"] = 0
		account["current-debit"] = 0
		account["current"] = 0
		account_dict[account["name"]] = account

	for entry in cashflow:
		acc_name = entry["account"]
		flow_name = "credit" if entry["flow"] == 1 else "debit"

		account_dict[acc_name]["current-" + flow_name] += entry["flow"] * entry["amount"]
		account_dict[acc_name]["current"] += entry["flow"] * entry["amount"]

	return render_template("index.html", format_money=format_money, stringify=json.dumps, cashflow=cashflow, categories=cache.categories, groups=cache.groups, categoryDict=cache.categoryDict, accounts=accounts, accountDict=account_dict)

if __name__ == "__main__":
	app.run(port=config["port"])
