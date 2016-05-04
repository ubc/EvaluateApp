# Usage Instructions for Client Developers

These instructions are for people who are looking to write code to interface with an Evaluate Server.

Overall the method is very simple. All authentication is done using an api key, which should be provided to you by the Administrator of your Evaluate Server.

You can access the system by making requests to various paths on the server. All accesses will only provide access to data which is associated with your API Key.

### Example Request - Embed a Metric
```php
$api_key = "4bfb4e2a-405d-4a85-872f-32764604f9cd";
$query = http_build_query( array(
	'metric_id'  => "51dc334f-e206-47f1-98eb-56f5e0cb7f99",
	'context_id' => "http://example.com/hello-world#anchor",
	'user_id'    => 45,
) );

$transaction_id = file_get_contents( "http://localhost:3000/auth/" . $api_key . "?" . $query );
$embed_url = "http://localhost:3000/embed/" . $transaction_id;
```
```html
<iframe src="<?php echo $embed_url; ?>"></iframe>
```
a
Each request is made to one of the endpoints below. Some endpoints can be accessed directly with an api key. While others require you to first establish a transaction. The reason for this is to avoid the API key being leaked to your end user.

The api key or transaction id should be appended to the endpoint path, as noted below. All endpoints use appropriate HTTP status codes when responding.

- [Public Endpoints](#public-endpoints)
	- [Request Transaction ID  /auth/:api_key](#request-transaction-id--authapi_key)
	- [Embed Metric  /embed/:transaction_id](#embed-metric--embedtransaction_id)
	- [Sort Contexts  /metrics/sort/:api_key](#sort-contexts--metricssortapi_key)
	- [List Metrics  /metrics/list/:api_key](#list-metrics--metricslistapi_key)
	- [Edit Metric  /metrics/edit/:transaction_id](#edit-metric--metricsedittransaction_id)
	- [List Blueprints  /blueprints/list/:api_key](#list-blueprints--blueprintslistapi_key)
	- [Edit Blueprint  /blueprints/edit/:transaction_id](#edit-blueprint--blueprintsedittransaction_id)
	- [Request Voting Data  /data/:api_key](#request-voting-data--dataapi_key)
- [Hidden Endpoints](#hidden-endpoints)
	- [Vote  /vote/:transaction_id](#vote--votetransaction_id)
	- [Delete Metric  /metrics/destroy/:transaction_id](#delete-metric--metricsdestroytransaction_id)
	- [Save Metric  /metrics/save/:transaction_id](#save-metric--metricssavetransaction_id)
	- [Delete Blueprint  /blueprints/destroy/:transaction_id](#delete-blueprint--blueprintsdestroytransaction_id)
	- [Save Blueprint  /blueprints/save/:transaction_id](#save-blueprint--blueprintssavetransaction_id)

## Public Endpoints
These are the paths that you will likely want to use in your system.

### Request Transaction ID  /auth/:api_key
**Method:** GET  
**Response:** UUID (v4)  
**Query Parameters:**
* **path**, The endpoint which you want to create a transaction for. eg. "/embed" or "/metrics/edit"
* **payload**, This data will be used when the transaction is redeemed. Consult the access points below for what information should be included here. It is different for every path.

Returns a Transaction ID for the given path.

### Embed Metric  /embed/:transaction_id
**Method:** GET  
**Response:** HTML  
**Transaction Payload:**
* **metric_id**, The UUID of the metric which you wish to embed.
* **context_id**, (optional) The url which is to be rated. If not provided, a simple preview of the metric will be rendered.
* **user_id**, (optional) The user ID to associate with votes made on this embed. If not provided, the user will not be able to vote.
* **preview**, (optional) If this value is equal to 'preview' voting will be disallowed (even if context_id and user_id have been provided).
* **stylesheet**, (optional) The url of a CSS file to insert into the html.
* Additionally all "/vote" parameters should be provided, if voting is allowed.

Renders a metric. Intended for use in an iframe.

### Sort Contexts  /metrics/sort/:api_key
**Method:** GET  
**Response:** JSON  
**Query Parameters:**
* **contexts**, An array of context IDs which you want sorted.
* **metric_id**, The metric to use for sorting.

Sorts a list of contexts depending on how they are rated by a certain metric.
The sorted lists will be returned as a json array.

### List Metrics  /metrics/list/:api_key
**Method:** GET  
**Response:** JSON  
**Query Parameters:** None

Returns a json of all metrics, which are associated with your api key.

### Edit Metric  /metrics/edit/:transaction_id
**Method:** GET  
**Response:** HTML  
**Transaction Payload:**
* **metric_id**, The ID for the metric which you want to edit.
* **stylesheet**, (optional) The url of a CSS file to insert into the html.

Renders a form for editing/deleting a metric. Intended for use in an iframe.

### List Blueprints  /blueprints/list/:api_key
**Method:** GET  
**Response:** JSON  
**Query Parameters:** None

Returns a json of all blueprints, which are associated with your api key.

### Edit Blueprint  /blueprints/edit/:transaction_id
**Method:** GET  
**Response:** HTML  
**Transaction Payload:**
* **blueprint_id**, The ID for the blueprint which you want to edit.
* **stylesheet**, (optional) The url of a CSS file to insert into the html.

Renders a form for editing/deleting a blueprint. Intended for use in an iframe.

### Request Voting Data  /data/:api_key
**Method:** GET  
**Response:** JSON  
**Query Parameters:**
* **metric_id**, (optional) If provided, the data will be restricted to this metric.
* **context_id**, (optional) If provided, the data will be restricted to this context.

Retrieve lists of votes and scores, organized by metrics.


## Hidden Endpoints
These access points are available, but it is not necessary for you to support them, as they are used indirectly by the public access points.

### Vote  /vote/:transaction_id
**Method:** POST  
**Response:** UUID | `false`  
**Transaction Payload:**
* **metric_id**, The ID of the metric to vote on.
* **context_id**, The url of the context to vote on.
* **user_id**, The user ID to associate with this vote.
* **lrs**, (optional if not using lrs)
  * **username**, A display name for the user.
  * **homeurl**, The base url of the server where this user is registered.
  * **activity_name**, The name of the context which is being rated.
  * **activity_description**, A description of the context which is being rated.

Saves a vote to the system. Returns a renewed transaction id. Or false, if no renewal was possible.

### Delete Metric  /metrics/destroy/:transaction_id
**Method:** POST  
**Reponse:** `"inprogress"`  
**Transaction Payload:**
* **metrid_id**, The metric to be deleted.
**POST Body:** None

Removes a metric from the system.

### Save Metric  /metrics/save/:transaction_id
**Method:** POST  
**Response:** UUID | `false`  
**Transaction Payload:**
* **metric_id**, (optional) The ID of the metric to save. If not provided, then a new metric will be created.
**POST Body:**
* The attributes for the new metric. If you really want to use this end point. Examine [views/metrics/editor.jade](../views/metrics/editor) for the appropriate values.

Saves a metric. Returns a renewed transaction id. Or false, if no renewal was possible.

### Delete Blueprint  /blueprints/destroy/:transaction_id
**Method:** POST  
**Response:** `"inprogress"`  
**Transaction Payload:**
 * **blueprint_id**, The blueprint to be deleted.

Removes a blueprint from the system.

### Save Blueprint  /blueprints/save/:transaction_id
**Method:** POST  
**Response:** UUID | `false`  
**Transaction Payload:**
* **blueprint_id**, (optional) The ID of the blueprint to save. If not provided, then a new blueprint will be created.
**POST Body:**
* The attributes for the new blueprint. If you really want to use this end point. Examine [views/blueprints/editor.jade](../views/blueprints/editor) for the appropriate values.

Saves a blueprint. Returns a renewed transaction id. Or false, if no renewal was possible.
