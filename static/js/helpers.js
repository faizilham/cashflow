function formatMoney(amount){
	var negative = false;
	if (amount < 0){
		negative = true;
		amount = -amount;
	}

	stramount = "";
	while (amount >= 1000) {
		thousands = String(amount % 1000)

		if (thousands.length == 2) thousands = "0" + thousands
		else if (thousands.length == 1) thousands = "00" + thousands

		stramount = "," + thousands + stramount
		amount = Math.floor(amount / 1000)
	}

	stramount = "Rp. " + Math.floor(amount) + stramount;

	if (negative){
		stramount = "(" + stramount + ")";
	}

	return stramount;
}

function findWithAttr(array, attr, value) {
	for(var i = 0; i < array.length; i += 1) {
		if(array[i][attr] === value) {
			return i;
		}
	}
	return -1;
}

Handlebars.registerHelper("iscredit", function(entry){
	return entry.flow > 0;
});

Handlebars.registerHelper("formatMoney", formatMoney);