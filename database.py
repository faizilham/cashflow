import sqlite3
import time

TRANSFER_IN_ID = 10000
TRANSFER_OUT_ID = 20000
ADMIN_IN_ID = 100
ADMIN_OUT_ID = 200
SUBCATEGORY_SIZE = 100

def getID():
	return int(time.time() * 1000)

def getFlow(_id):
	if _id < TRANSFER_IN_ID:
		return 1 if _id < ADMIN_OUT_ID else -1
	else:
		return 1 if _id < TRANSFER_OUT_ID else -1

def entryObject(row):
	return { 
		"id": row[0], 
		"entry_date": row[1], 
		"account": row[2], 
		"flow": row[3], 
		"category_id": row[4], 
		"amount": row[5], 
		"details": row[6], 
	}


class Database(object):
	def __init__(self, dbpath):
		self.dbpath = dbpath
		

		#c = self.conn.cursor()
		#c.execute("CREATE TABLE IF NOT EXISTS test(id)")
		#self.conn.commit()

	### connection primitives
	def cursor(self):
		conn = sqlite3.connect(self.dbpath)
		return conn.cursor()

	def commitclose(self, c):
		conn = c.connection
		conn.commit()
		conn.close()

	def close(self, c):
		conn = c.connection
		conn.close()

	### writes
	def addExpense(self, datetxt, account, category_id, amount, details=None):
		c = self.cursor(); _id = getID()
		
		data = (_id, datetxt, account, -1, category_id, amount, details)
		c.execute("INSERT INTO cashflow VALUES (?, ?, ?, ?, ?, ?, ?)", data)

		data = (amount, account)
		c.execute("UPDATE accounts SET fund = fund - ? WHERE name = ?", data)
		self.commitclose(c)

		return _id

	def addIncome(self, datetxt, account, category_id, amount, details=None):
		c = self.cursor(); _id = getID()
		
		data = (_id, datetxt, account, 1, category_id, amount, details)
		c.execute("INSERT INTO cashflow VALUES (?, ?, ?, ?, ?, ?, ?)", data)

		data = (amount, account)
		c.execute("UPDATE accounts SET fund = fund + ? WHERE name = ?", data)
		self.commitclose(c)

		return _id

	def transfer(self, datetxt, account_from, account_to, amount, details=None):
		c = self.cursor(); 
		id_out = getID()
		id_in = id_out + 1
		
		data_out = (id_out, datetxt, account_from, -1, TRANSFER_OUT_ID, amount, details)
		data_in = (id_in, datetxt, account_to, 1, TRANSFER_IN_ID, amount, details)

		c.execute("INSERT INTO cashflow VALUES (?, ?, ?, ?, ?, ?, ?)", data_out)
		c.execute("INSERT INTO cashflow VALUES (?, ?, ?, ?, ?, ?, ?)", data_in)
		self.commitclose(c)

		return id_out, id_in

	def deleteEntry(self, _id):
		c = self.cursor();
		
		querydata = (_id,)
		c.execute ("SELECT * FROM cashflow WHERE id = ?", querydata)
		row = c.fetchone()

		print(_id, row)

		if not row:
			self.close(c)
			return False
		
		entry = entryObject(row)
		flow, amount, account = entry["flow"], entry["amount"], entry["account"]

		c.execute("DELETE FROM cashflow WHERE id = ?", querydata)

		querydata = (flow * amount, account)
		c.execute("UPDATE accounts SET fund = fund - ? WHERE name = ?", querydata)

		self.commitclose(c)

		return True

	### reads
	def getCategories(self):
		c = self.cursor()

		c.execute("SELECT id, name, description FROM categories WHERE super=0 ORDER BY id ASC")
		result = [{"id": row[0], "name": row[1], "description": row[2], "flow": getFlow(row[0])} for row in c.fetchall()]

		self.close(c)

		return result

	def getCategoryGroups(self):
		c = self.cursor()

		c.execute("SELECT id, name, description FROM categories WHERE super=1 ORDER BY id ASC")
		result = [{"id": row[0], "name": row[1], "description": row[2], "flow": getFlow(row[0])} for row in c.fetchall()]

		self.close(c)

		return result

	def getAccounts(self):
		c = self.cursor()

		c.execute("SELECT * FROM accounts ORDER BY position ASC")
		result = [{"name": row[0], "position": row[1], "fund": row[2], "description": row[3]} for row in c.fetchall()]

		self.close(c)

		return result

	def getEntries(self, minid=None, maxid=None, date_first=None, date_last=None, flow=None, category_id=None, limit=None, orderby=[]):

		conditions = []

		def addCondition(condition_text):
			conditions.append("(" + condition_text + ")")

		start_category, end_category = None, None

		if (date_first and date_last):
			addCondition("entry_date BETWEEN :datefirst AND :datelast")
		elif (date_first):
			addCondition("entry_date >= :datefirst")
		elif (date_last):
			addCondition("entry_date <= :datelast")

		if (minid): addCondition("id > :minid")

		if (maxid): addCondition("id < :maxid")

		if (flow):	addCondition("flow = :flow")

		if (category_id):
			if (category_id < TRANSFER_IN_ID):
				start_category = category_id * SUBCATEGORY_SIZE;
				end_category = (category_id + 1) * SUBCATEGORY_SIZE - 1;
				addCondition("category_id BETWEEN :start_category AND :end_category")
			else:
				addCondition("category_id = :category_id")

		querytext = "SELECT * FROM cashflow"

		if len(conditions):
			querytext += " WHERE "
			querytext += " AND ".join(conditions)

		if len(orderby):
			querytext += " ORDER BY "
			
			for i in range(len(orderby)):
				column = orderby[i]
				ascending = True

				if isinstance(column, tuple):
					column, ascending = column

				querytext += column + (" ASC" if ascending else " DESC")

				if i < len(orderby) - 1: querytext += ", "


		if limit:
			querytext += " LIMIT :limit"

		c = self.cursor()

		data = { 
			"datefirst": date_first, "datelast": date_last, "flow": flow, 
			"category_id": category_id, "start_category": start_category, 
			"end_category": end_category, "limit": limit, "minid": minid,
			"maxid": maxid
		}

		c.execute(querytext, data)
		result = [entryObject(row) for row in c.fetchall()]

		self.close(c)

		return result
		

"""
tables & indexes

CREATE TABLE IF NOT EXISTS `cashflow` (
	`id`	INTEGER NOT NULL,
	`entry_date`	TEXT NOT NULL,
	`account`	TEXT NOT NULL,
	`flow`	INTEGER NOT NULL,
	`category_id`	INTEGER NOT NULL,
	`amount`	INTEGER NOT NULL,
	`details`	TEXT,
	PRIMARY KEY(`id`)
)

CREATE TABLE IF NOT EXISTS `accounts` ( 
	`name` TEXT NOT NULL, 
	`position` INTEGER NOT NULL, 
	`fund` INTEGER NOT NULL, 
	`description` TEXT, PRIMARY KEY(`name`)
)

CREATE TABLE IF NOT EXISTS `categories` (
	`id` INTEGER NOT NULL, 
	`name` TEXT NOT NULL,
	`super` INTEGER NOT NULL DEFAULT 0,
	`description` TEXT,
	PRIMARY KEY(`id`)
)

CREATE INDEX IF NOT EXISTS `cashflow_date` ON `cashflow` (`entry_date` ASC)
CREATE INDEX IF NOT EXISTS `cashflow_category` ON `cashflow` (`category_id` )
CREATE INDEX IF NOT EXISTS `cashflow_search` ON `cashflow` (`id` DESC,`entry_date` DESC)
CREATE INDEX IF NOT EXISTS `categories_index` ON `categories` (`id` ASC,`super` DESC)


"""