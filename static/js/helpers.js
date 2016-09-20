function formatMoney(amount){
	var negative = false;
	if (amount < 0){
		negative = true;
		amount = -amount;
	}

	amount = Math.round(amount);

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

function frequencyFormat(val, unit, plural){
	if (!plural) plural = unit + "s";

	var e = 0.0000000001;

	if (Math.abs(val) < e) return "Never";

	var d = 1 / val;
	if (Math.abs(d - 1) < e){
		return "Everyday";
	} else if (d < 1) {
		return (Math.round(100*val)/100) + " times a " + unit;
	} else {
		return "Every " + (Math.round(100*d)/100) + " " + plural;						
	}
}

function frequencyFormatShort(val, unit, plural){
	if (!plural) plural = unit + "s";

	var e = 0.0000000001;

	if (Math.abs(val) < e) return "Never";

	var d = 1 / val;
	if (Math.abs(d - 1) < e){
		return "Per day";
	} else if (d < 1) {
		return (Math.round(100*val)/100) + " per " + unit;
	} else {
		return "Per " + (Math.round(100*d)/100) + " " + plural;						
	}
}

function percentageFormat(val){
	return (Math.round(100*val)/100) + "%";
}

function findWithAttr(array, attr, value) {
	for(var i = 0; i < array.length; i += 1) {
		if(array[i][attr] === value) {
			return i;
		}
	}
	return -1;
}

function hsv_to_rgb(h, s, v){
	var h_i = Math.floor(h*6);
	var f = h*6 - h_i;

	var p = v * (1 - s);
	var q = v * (1 - f*s);
	var t = v * (1 - (1 - f) * s);
	var rgb;

	switch(h_i){
		case 0: rgb = [v, t, p]; break;
		case 1: rgb = [q, v, p]; break;
		case 2: rgb = [p, v, t]; break;
		case 3: rgb = [p, q, v]; break;
		case 4: rgb = [t, p, v]; break;
		case 5: rgb = [v, p, q]; break;
	}

	return "#" + rgb.map(function(c){return Math.floor(c*256).toString(16);}).join("");
}

function getRandomColor() {
    var phi_conjugate = 0.618033988749895;
    var h = (Math.random() + phi_conjugate) % 1;
    var s = 0.7
    var v = 0.8 + (Math.random()*0.1);

    return hsv_to_rgb(h, s, v);
}


Handlebars.registerHelper("iscredit", function(entry){
	return entry.flow > 0;
});

Handlebars.registerHelper("formatMoney", formatMoney);