from flask import Blueprint, request, make_response
import json

def reply(data, message=None, status=200):
	response_data = {}

	if data:
		response_data["data"] = data

	if status >= 400:
		response_data["message"] = message

	response = make_response(json.dumps(response_data), status)
	response.headers["Content-Type"] = "application/json"

	return response

def get_entries(db, form={}):
	query = {
		"orderby": [("entry_date", True), ("id", True)]
	}

	if form.get("minid"): query["minid"] = form.get("minid")
	if form.get("datefirst"): query["date_first"] = form.get("datefirst")
	if form.get("datelast"): query["date_last"] = form.get("datelast")

	return db.getEntries(**query)

def construct_blueprint(db, cache):

	api = Blueprint('api', __name__)

	@api.route("/entries", methods=['GET'])
	def getEntries():
		return reply(get_entries(db, request.args))

	@api.route("/entries", methods=['POST'])
	def addEntry():

		flow = int(request.form.get("flow"))
		date = request.form.get("date")
		account = request.form.get("account")
		category = int(request.form.get("category"))
		amount = int(request.form.get("amount"))
		details = request.form.get("details")

		if (flow > 0):
			db.addIncome(date, account, category, amount, details)
		else:
			db.addExpense(date, account, category, amount, details)

		return reply(True)

	@api.route("/entries/transfer", methods=['POST'])
	def addTransferEntry():

		date = request.form.get("date")
		account_from = request.form.get("account_from")
		account_to = request.form.get("account_to")
		amount = int(request.form.get("amount"))
		details = request.form.get("details")

		details_prefix = u"[{0} >> {1}]".format(account_from, account_to)
		details = details_prefix if not details else "{0} {1}".format(details_prefix, details)

		db.transfer(date, account_from, account_to, amount, details)

		return reply(True)

	@api.route("/entries/<_id>/delete", methods=['POST'])
	def deleteEntry(_id):
		result = db.deleteEntry(_id)

		if (result): return reply(True)
		else: return reply(None, "Entry not found")



	return api