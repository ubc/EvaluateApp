# Possible Future Improvements

- [LTI Integration](#lti-integration)
- [Pre-Written Clients](#pre-written-clients)
- [Additional Metric Types](#additional-metric-types)
- [Persistent Transactions](#persistent-transactions)
- [Additional Data sent to LRS](#additional-data-sent-to-lrs)
- [Better Valuelist Sorting](#better-valuelist-sorting)
- [No-Javascript Fallbacks](#no-javascript-fallbacks)
- [Handle Unsorted Contexts](#handle-unsorted-contexts)
- [Native Data Displays](#native-data-displays)

## LTI Integration
As this platform reached version 1.0.0, the LTI integration feature was stripped out. This was a major simplification move, however there might be a good basis for including it.

A future improvement could examine this and add it if appropriate.

These NodeJS modules would be invaluable in implementing LTI Integration
[Passport](https://www.npmjs.com/package/passport)
[Passport LTI](https://www.npmjs.com/package/passport-lti)

## Pre-Written Clients
Implementing a client for the Evaluate Server is quite easy. A simple wrapper could be developed for various languages, and included in the repository.

We already have a good example of a php client here with the [Evaluate Wordpress Plugin](https://github.com/ubc/EvaluatePlugin/blob/master/includes/class-evaluate-connector.php).

Further details about how to implement a client can be found in the [Client Developer Documentation](./Developers.md)

## Additional Metric Types
Although the current metric types should cover most scenarios. Others could be added.

Details on how to do that can be found in the [Evaluate Developers Documentation](./Maintainers.md#adding-a-new-metric-type)

## Persistent Transactions
Currently transactions are stored in memory. When the server shuts down or crashes, all current transactons will be lost.

This behaviour is rarely problematic, but if desired it could be improved by storing transactions in the database. (Note the probably performance hit though)

Adding this feature would be fairly straightforward.
 * First, create a new model in the `models` folder to store the transaction.
 * Change `includes/transactions.js` so that it utilizes the new model to store and retrieve transactions.

## Additional Data sent to LRS
At the moment, only votes are being sent to the LRS. We could also send other data such as Metric creation, or perhaps the first time a context is rated, or when a context score reaches a certain threshold.

To do this, we should create new functions in `includes/lrs.js` similar to the `send_vote` function. This should be set up to automatically supply most of the parameters.

Consule the [xAPI Spec](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md) for details on what data needs to be sent to the LRS.

## Better Valuelist Sorting

Currently the Valuelist metric type uses a simple average sorting method. For reasons explained by [this article](http://www.evanmiller.org/how-not-to-sort-by-average-rating.html), that is a bad idea.

This could be improved by using a Bayesian Average, or some other formula.

You can look at the `metric-types/range/functions.js` for an example of an implementation of the Bayesian Average formula.

## No-Javascript Fallbacks

Currently the system does not work without JavaScript. Although JavaScript is a reasonable expectation in this day and age, we could improve this.

Currently the `/vote`, `/save`, and `/destroy` routes only work with AJAX. However, a simple change could make them work for GET requests as well, followed by a redirect back to the the `/embed` or `/edit` page.

For example the `/vote` path could be implemented with a new handler which looks something like this.
```javascript
router.get( '/vote/:transaction_id', function( req, res, next ) {
	// Get the vote data.
	var vote = req.query;

	// Perform normal saving actions.
	// ...

	// Redirect the request back to the /embed path.
	var transaction_id = TRANSACTION.create( '/embed', req.params.transaction );
	res.redirect( '/embed/' + transaction_id );
} );
```

Note however that the above solution does not user `TRANSACTION.renew(...)` which would allow unlimited vote renewals. That is an issue which will also need to be addressed.

Finally just make sure that when you click on a vote, there is an appropriate link that will load `/vote/:transaction_id` 

## Handle Unsorted Contexts

Right now the `/metrics/sort/:api_key` route will only include contexts which have been rated in the sorting.

This is a major flaw as it entirely defeats the purpose of the [Better Metric Sorting](./Maintainers.md#metric-sorting) that we use. By not including the unrated contexts in our sorting, we force the end user to choose a location for them.

Instead we need to define a default sorting value for unsorted contexts. This value should vary based on different metric settings. (Particularly with the Bayesian average, used by the Range metric type)

## Native Data Displays

The current platform only provides raw data using the `/data/:api_key` route. This means that every client has to parse and display the data themselves.

In most cases the client displays will not differ much. We could offer a generic data display, much like our Metric editor, using the `/data/list/:transaction_id` route. Or any other routes.
