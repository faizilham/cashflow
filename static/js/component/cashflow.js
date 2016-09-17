(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['cashflow'] = template({"1":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : {};

  return "<tr class=\"entry\" id='entry"
    + alias2(alias1(((stack1 = blockParams[0][0]) != null ? stack1.id : stack1), depth0))
    + "' data-id=\""
    + alias2(alias1(((stack1 = blockParams[0][0]) != null ? stack1.id : stack1), depth0))
    + "\">\r\n	<td class=\"entry-date col1\" >"
    + alias2(alias1(((stack1 = blockParams[0][0]) != null ? stack1.entry_date : stack1), depth0))
    + "</td>\r\n	<td class=\"col1 center\">"
    + alias2(alias1(((stack1 = blockParams[0][0]) != null ? stack1.account : stack1), depth0))
    + "</td>\r\n\r\n"
    + ((stack1 = helpers["with"].call(alias3,helpers.lookup.call(alias3,(depths[1] != null ? depths[1].categories : depths[1]),((stack1 = blockParams[0][0]) != null ? stack1.category_id : stack1),{"name":"lookup","hash":{},"data":data,"blockParams":blockParams}),{"name":"with","hash":{},"fn":container.program(2, data, 1, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams})) != null ? stack1 : "")
    + "\r\n	<td class=\"col4\">"
    + alias2(alias1(((stack1 = blockParams[0][0]) != null ? stack1.details : stack1), depth0))
    + "</td>\r\n	<td class=\"actiontd col5\">\r\n		<a href=\"#\" class=\"rowaction\"><span class=\"glyphicon glyphicon-edit\" aria-hidden=\"true\"></span></a>\r\n		<a href=\"#\" class=\"rowaction\" onclick='deleteEntry("
    + alias2(alias1(((stack1 = blockParams[0][0]) != null ? stack1.id : stack1), depth0))
    + ", \""
    + alias2(alias1(((stack1 = blockParams[0][0]) != null ? stack1.account : stack1), depth0))
    + "\", "
    + alias2(alias1(((stack1 = blockParams[0][0]) != null ? stack1.flow : stack1), depth0))
    + ", "
    + alias2(alias1(((stack1 = blockParams[0][0]) != null ? stack1.amount : stack1), depth0))
    + ")'><span class=\"glyphicon glyphicon-remove\" aria-hidden=\"true\"></span></a>\r\n	</td>\r\n\r\n</tr>\r\n";
},"2":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return "		\r\n\r\n"
    + ((stack1 = helpers["if"].call(alias1,(helpers.iscredit || (depth0 && depth0.iscredit) || helpers.helperMissing).call(alias1,blockParams[1][0],{"name":"iscredit","hash":{},"data":data,"blockParams":blockParams}),{"name":"if","hash":{},"fn":container.program(3, data, 0, blockParams),"inverse":container.program(5, data, 0, blockParams),"data":data,"blockParams":blockParams})) != null ? stack1 : "");
},"3":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression;

  return "			<td class=\"col1 center\">Credit</td>\r\n			<td class=\"col2\">["
    + alias2(alias1(((stack1 = blockParams[1][0]) != null ? stack1.group : stack1), depth0))
    + "] "
    + alias2(alias1(((stack1 = blockParams[1][0]) != null ? stack1.name : stack1), depth0))
    + "</td>\r\n			<td class=\"credit cashtext col3\">"
    + alias2((helpers.formatMoney || (depth0 && depth0.formatMoney) || helpers.helperMissing).call(depth0 != null ? depth0 : {},((stack1 = blockParams[2][0]) != null ? stack1.amount : stack1),{"name":"formatMoney","hash":{},"data":data,"blockParams":blockParams}))
    + "</td>\r\n";
},"5":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression;

  return "			<td class=\"col1 center\">Debit</td>\r\n			<td class=\"col2\">["
    + alias2(alias1(((stack1 = blockParams[1][0]) != null ? stack1.group : stack1), depth0))
    + "] "
    + alias2(alias1(((stack1 = blockParams[1][0]) != null ? stack1.name : stack1), depth0))
    + "</td>\r\n			<td class=\"debit cashtext col3\">&#40;"
    + alias2((helpers.formatMoney || (depth0 && depth0.formatMoney) || helpers.helperMissing).call(depth0 != null ? depth0 : {},((stack1 = blockParams[2][0]) != null ? stack1.amount : stack1),{"name":"formatMoney","hash":{},"data":data,"blockParams":blockParams}))
    + "&#41;</td>\r\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1;

  return ((stack1 = helpers.each.call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.entries : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 1, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams})) != null ? stack1 : "");
},"useData":true,"useDepths":true,"useBlockParams":true});
})();