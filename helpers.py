SUBCATEGORY_SIZE = 100

def format_money(amount):
	negative = False
	if amount < 0:
		negative = True
		amount = -amount

	stramount = ""
	while amount >= 1000:
		thousands = str(amount % 1000)

		if len(thousands) == 2: thousands = "0" + thousands
		elif len(thousands) == 1: thousands = "00" + thousands

		stramount = "," + thousands + stramount
		amount = int(amount / 1000)

	stramount = "Rp. " + str(amount) + stramount;

	if negative:
		stramount = "(" + stramount + ")"
	
	return stramount

class Cache(object):
	def __init__(self, db):
		self.db = db
		self.reloadCategories()

	def reloadCategories(self):
		self.groups = {}
		for group in self.db.getCategoryGroups():
			self.groups[group["id"]] = group

		self.categories = []
		self.categoryDict = {}
		for category in self.db.getCategories():
			_id = category["id"]
			g_id = int(_id / SUBCATEGORY_SIZE)

			category["group_id"] = g_id
			category["group"] = self.groups[g_id]["name"]
			self.categoryDict[_id] = category
			self.categories.append(category)
