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

def construct_blueprint(db, cache):

	api = Blueprint('api', __name__)

	@api.route("/entries", methods=['POST'])
	def addEntry():
		data = request.form
		db.addEntry(data["date"], data["account"], int(data["flow"]), int(data["category"]), int(data["amount"]), data["desc"])

		return reply(True)



	return api