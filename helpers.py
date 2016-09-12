SUBCATEGORY_SIZE = 100

def format_money(amount):
	return ""

class Cache(object):
	def __init__(self, db):
		self.db = db
		self.reloadAccounts()
		self.reloadCategories()

	def reloadAccounts(self):
		self.accounts = self.db.getAccounts()

	def reloadCategories(self):
		self.groups = {}
		for group in self.db.getCategoryGroups():
			self.groups[group["id"]] = group

		self.categories = []
		self.categoryDict = {}
		for category in self.db.getCategories():
			_id = category["id"]

			category["group"] = self.groups[int(_id / SUBCATEGORY_SIZE)]["name"]
			self.categoryDict[_id] = category
			self.categories.append(category)
