# Possible Future Improvements

- [LTI Integration](#)
- [Pre-Written Clients](#)
- [Additional Metric Types](#)
- [Persistent Transactions](#)
- [Additional Data sent to LRS](#)

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

Details on how to do that can be found in the [Evaluate Developers Documentation](./Maintainer.md)

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
