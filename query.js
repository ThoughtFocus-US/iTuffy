query(map, action, watsonresponse, cb) {
	var elastic if(!elastic = at_xpath(map, "elastic/" + action)) {
		cb("Elastic Not Found " + action);
		return;
	}
	require('request')({ method: 'POST', 
		uri: 'https://' + elastic.getAttribute('username') + ':'
			+ elastic.getAttribute('password') + '@' + elastic.getAttribute('host') + elastic.getAttribute('index'), 
		json: true, encoding: null, rejectUnauthorized: false, headers : {"Content-Type": "application/json"},
		body: ElasticQuery(map, action, watsonresponse) }, function(e, eres, ebody) {
		cb('', ebody.hits);
	});
}

/*
ElasticQuery: Return elastic json query object from contextAttribtues in Watson response 
Match query for the action that has all the contextAttribtues. Return null if no query matches.
*/
function ElasticQuery(map, action, watsonresponse) {	
	var a, k, i, leni, arri, response, queryroot, json; 
	json = function(querynode, response) {
		var attribute, j = {};
		if(querynode) j[querynode.nodeName] = (attribute = querynode.getAttribute('attribute')) 
			? response[attribute] : json(querynode.firstChild);
		return j;
	};
	for(k in watsonresponse.output) {
		if(a = ElasticAttribute(map, action, k)) response[a] = watsonresponse.output[k];
	}
	for(queryroot = at_xpath(map, action).firstChild; queryroot; queryroot = queryroot.nextSibling) {
		if(queryroot.nodeName != 'query') continue;
		for(i = 0, leni = (arri = xpath(queryroot, ".//*[@attribute]")); i < leni; i++) {
			if(!response[arri[i].getAttribute('attribute')]) break;
		}
		if(i == leni) return json(queryroot, response);
	}
	return null;
}
