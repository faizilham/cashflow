#!python

from flask import Flask, render_template, request
from database import Database
from helpers import format_money, Cache
import api, yaml

config = None
with open("config.yml", 'r') as f:
	config = yaml.load(f)

app = Flask(__name__)
app.config['DEBUG'] = True
app.config['TEMPLATES_AUTO_RELOAD'] = True

db = Database(config["dbpath"])
cache = Cache(db)

apiroute = api.construct_blueprint(db, cache)
app.register_blueprint(apiroute, url_prefix='/api')

def get_entries(form={}):
	query = {
		"orderby": [("entry_date", True), ("id", True)]
	}

	if form.get("minid"): query["minid"] = form.get("minid")
	if form.get("datefirst"): query["date_first"] = form.get("datefirst")
	if form.get("datelast"): query["date_last"] = form.get("datelast")

	return db.getEntries(**query)

@app.route("/")
def index_page():
	accounts = db.getAccounts()

	cashflow = get_entries(request.args)

	for account in accounts:
		account["current"] = sum((entry["flow"] * entry["amount"]) for entry in cashflow if entry["account"] == account["name"])

	return render_template("index.html", format_money=format_money, cashflow=cashflow, categories=cache.categories, categoryDict=cache.categoryDict, accounts=accounts)

@app.route("/entrylist")
def entrylist_page():
	cashflow = get_entries(request.args)

	return render_template("render_cashflow.html", format_money=format_money, cashflow=cashflow, categoryDict=cache.categoryDict)
	
if __name__ == "__main__":
	app.run(port=config["port"])
