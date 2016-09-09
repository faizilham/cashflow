import sqlite3
import time

TRANSFER_IN_ID = 10000
TRANSFER_OUT_ID = 20000
ADMIN_IN_ID = 100
ADMIN_OUT_ID = 200

def getID():
	return int(time.time() * 1000)

def getFlow(_id):
	if _id < TRANSFER_IN_ID:
		return 1 if _id < ADMIN_OUT_ID else -1
	else:
		return 1 if _id < TRANSFER_OUT_ID else -1


class Database(object):
	def __init__(self, dbpath):
		self.dbpath = dbpath
		self.conn = sqlite3.connect(self.dbpath)

		#c = self.conn.cursor()
		#c.execute("CREATE TABLE IF NOT EXISTS test(id)")
		#self.conn.commit()

	### connection primitives
	def cursor(self):
		return self.conn.cursor()

	def commit(self):
		self.conn.commit()

	def close(self):
		self.conn.close()

	### writes
	def addExpense(self, datetxt, account, category_id, amount, details=None):
		c = self.cursor(); _id = getID()
		
		data = (_id, datetxt, account, -1, category_id, amount, details)
		c.execute("INSERT INTO cashflow VALUES (?, ?, ?, ?, ?, ?, ?)", data)
		self.commit()

	def addIncome(self, datetxt, account, category_id, amount, details=None):
		c = self.cursor(); _id = getID()
		
		data = (_id, datetxt, account, 1, category_id, amount, details)
		c.execute("INSERT INTO cashflow VALUES (?, ?, ?, ?, ?, ?, ?)", data)
		self.commit()

	def transfer(self, datetxt, account_from, account_to, amount, details=None):
		c = self.cursor(); 
		id_out = getID()
		id_in = id_out + 1
		
		data_out = (id_out, datetxt, account_from, -1, TRANSFER_OUT_ID, amount, details)
		data_in = (id_in, datetxt, account_to, 1, TRANSFER_IN_ID, amount, details)

		c.execute("INSERT INTO cashflow VALUES (?, ?, ?, ?, ?, ?, ?)", data_out)
		c.execute("INSERT INTO cashflow VALUES (?, ?, ?, ?, ?, ?, ?)", data_in)
		self.commit()

	### reads
	def getCategories(self):
		c = self.cursor()

		c.execute("SELECT id, name, description FROM categories WHERE super=0 ORDER BY id ASC")
		return [{"id": row[0], "name": row[1], "description": row[2], "flow": getFlow(row[0])} for row in c.fetchall()]

	def getCategoryGroups(self):
		c = self.cursor()

		c.execute("SELECT id, name, description FROM categories WHERE super=1 ORDER BY id ASC")
		return [{"id": row[0], "name": row[1], "description": row[2], "flow": getFlow(row[0])} for row in c.fetchall()]

	def getAccounts(self):
		c = self.cursor()

		c.execute("SELECT * FROM accounts ORDER BY position ASC")
		return [{"name": row[0], "position": row[1], "description": row[2]} for row in c.fetchall()]
		

"""
tables & indexes

CREATE TABLE IF NOT EXISTS `accounts` ( 
	`name` TEXT NOT NULL, 
	`position` INTEGER NOT NULL UNIQUE, 
	`description` TEXT, PRIMARY KEY(`name`)
)

CREATE TABLE IF NOT EXISTS `cashflow` (
	`id`	INTEGER NOT NULL,
	`date`	TEXT NOT NULL,
	`account`	TEXT NOT NULL,
	`flow`	INTEGER NOT NULL,
	`category_id`	INTEGER NOT NULL,
	`amount`	INTEGER NOT NULL,
	`details`	TEXT,
	PRIMARY KEY(`id`)
)

CREATE TABLE IF NOT EXISTS `categories` (
	`id` INTEGER NOT NULL, 
	`name` TEXT NOT NULL,
	`super` INTEGER NOT NULL DEFAULT 0,
	`description` TEXT,
	PRIMARY KEY(`id`)
)

CREATE INDEX IF NOT EXISTS `cashflow_date` ON `cashflow` (`date` ASC)
CREATE INDEX IF NOT EXISTS `cashflow_category` ON `cashflow` (`category_id` )
CREATE INDEX `categories_index` ON `categories` (`id` ASC,`super` DESC)

"""