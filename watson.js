function watson(map, input, cb) {
	var action;
	/* 
	Step 1 Call Watson With Question
	*/
	conversation.message({
	    workspace_id: at_xpath(map, 'watson/@workspace_id', 1),
	    input: { 'text':input.text },
	    context: input.context
	}, function(e, watsonresponse) {
		if(e) { cb(e.message); return; }
		/*
		WCS decided action.....map it to which query server to use 
		*/				
		if(!(action = at_xpath(map, "watson/*[@repsonse='" + (action = watsonresponse.output.action) 
			+ "']"))) { cb('Unknown Watson Response ' + action); return; }
		action = action.nodeName;
		/* 
		Step 2 Execute Suitable Elastic Query
		*/
		query(map, action, watsonresponse, function(e, hits) {
			/* 
			Step 3 Use Watson To Humanize Elastic Query Answer 
			*/
			conversation.message({
			    workspace_id: WORKSPACE_ID,
			    input: { 'text': input.text },
			    context: ElasticContext(map, action, hits, watsonresponse.context)
			}, function(e, response) {
			    if(e) { cb(e.message); return; }
			    /*
			    Step 4 Return Answer For Question
			    */
			    cb('', JSON.stringify(response)); //.replace(/\'/g, ""));
			});
		});
	});
}
/*
ElasticAttribute: Return attribute name in elastic for attribute name in watson 
*/
function ElasticAttribute(map, action, watsonattribute) {
	var a; return (a = at_xpath(map, action + "/attributes/*[@watson='" 
		+ watsonattribute + "']")) ? a.getAttribute('elastic') : '';
}
/*
ContextAttribute: Return attribute name in context for attribute name in elastic
*/
function ContextAttribute(map, action, elasticattribute) {
	var a; return (a = at_xpath(map, action + "/attributes/*[@elastic='" 
		+ elasticattribute + "']")) ? a.nodeName : '';
}
/*
ElasticContext: Consume elastic response to populate context object before formatting human readable 
*/
function ElasticContext(map, action, hits, context) {
	var a, i, k, attributes, response = [];
	for(i = 0; i < hits.total; i++) {
		response.push(attributes = {});
		for(k in (a = hits.hits[i]._source)) context[ContextAttribute(k)] = a[k];
	}
	context.RES_EVENT_COUNT = hits.total;
	//conext.RES_EVENT_URL = ?;
	return context;
}
