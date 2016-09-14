#!python

from flask import Flask, render_template
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

def render_entries(template):
	query = {
		"orderby": "date",
		"asc": False
	}

	cashflow = db.getEntries(orderby="date", asc=False)
	return render_template(template, format_money=format_money, cashflow=cashflow, categories=cache.categories, categoryDict=cache.categoryDict, accounts=cache.accounts)

@app.route("/")
def index_page():
	return render_entries('index.html')

@app.route("/entrylist")
def entrylist_page():
	return render_entries('render_cashflow.html')
	
if __name__ == "__main__":
	app.run(port=config["port"])
