# Usage Instructions for Evaluate Developers

Since you will be working with the entire code base - you should familiarize yourself with the documentation for [System Administrators](./Administrators.md) and [Client Developers](./Developers.md)

- [Code Philosophies](#code-philosophies)
- [Major Libraries Used](#major-libraries-used)
- [Code Structure](#code-structure)
- [Security](#security)
  - [API Keys](#api-keys)
  - [Transactions](#transactions)
- [Control Flow](#control-flow)
- [Adding a new Metric Type](#adding-a-new-metric-type)
- [The Concept of Blueprints / Rubrics](#the-concept-of-blueprints--rubrics)
- [Learning Record Store](#learning-record-store)
- [Database](#database)
- [Metric Sorting](#metric-sorting)
- [Future Improvements](#future-improvements)

## Code Philosophies

In the design of this code base care has been taken to make it as extensible and maintainable as possible. Consequently...
 * Each file has a clearly defined purpose.
 * Definitions for metric types are entirely encompassed in the 'metric-types' folder.
 * Whenever possible features are confined to one file, to make it easy to change.
 * All configuration of the application is done in `config.js`

## Major Libraries Used
 * [Express](http://expressjs.com/) - a library for implementing our HTTP server.
 * [Sequelize](http://docs.sequelizejs.com/en/latest/) - handles the database.
 * [Jade](http://jade-lang.com/) - an HTML preprocessor.
 * [Less](http://lesscss.org/) - a CSS preprocessor.
 * [adl-xapiwrapper](https://www.npmjs.com/package/adl-xapiwrapper) - a library for communicating with a [Learning Record Store](https://en.wikipedia.org/wiki/Learning_Record_Store).

## Code Structure

Here I'll go into an overview of how the code is structured, giving a brief explanation of each file.

 * `bin` - This folder contains different start-up scripts, although for the moment there is only one.
   * `www` - This file initializes the application as a web server.
 * `includes` - General code which doesn't fit in any other folder.
   * `database.js` - Initializes the database connection
   * `lrs.js` - Initializes the LRS connection, and provides functions for interacting with it.
   * `transaction.js` - Provides functions for handling 
   * `util.js` - Provides (mostly) generic utility functions for use elsewhere in the codebase.
 * `metric-types` - Contains definitions for all the metrics
   * `index.js` - Automatically reads and collates all the metric types.
   * `[metric-type]` - One folder for every metric type
     * `display.jade` - This defines html and javascript for the front-end display of the metric.
     * `options.jade` - This defines form elements for editing a metric of this type
     * `functions.js` - Provides several specific functions for handling voting and saving of the metric type.
 * `models` - These files define database tables
   * `index.js` - Sets up relationships between the models.
   * `metric.js` - A database table for storing metrics, the building blocks of our system.
   * `blueprint.js` - A database table for storing rubric blueprints. Essentially a metric of metrics.
   * `submetric.js` - A database table for storing blueprint components.
   * `score.js` - A database table for caching scorings. One scoring for every Metric/Context combination.
   * `vote.js` - A database table for storing user votes.
 * `public` - This folder contains static files which are accessible over HTTP. Namely CSS and Javascript files.
   * `fontello` - Contains code for a css font, which is used for the icons in the metrics. [fontello.com](http://fontello.com/)
   * `images` - A folder for images used by our app.
   * `javascripts` - Front end javascript
     * `editor-blueprint.js` - Included when the user edits a blueprint. Makes submetrics work.
     * `editor.js` - Included when the user edits either a blueprint or a metric. Makes saving, deleting, and form controls work.
     * `metric-rubric.js` - Included when a Rubric metric-type is rendered. Makes submetrics work.
     * `metric.js` - Included when any metric-type is rendered. Makes voting work.
   * `less` - The raw less stylesheets. These are the stylesheets you should edit.
     * `editor.less` - Styling for the editors.
     * `metric.less` - Styling for front-end metric display.
   * `stylesheets` - The compiled CSS. These files are automatically generated and used by our application.
 * `routes` - These files define all the valid HTTP paths for our server.
   * `index.js` - Defines the /auth, /vote, and /embed paths.
   * `blueprints.js` - Defines all the /blueprints/* paths.
   * `data.js` - Defines all the /data/* paths.
   * `metrics.js` - Defines all the /metrics/* paths.
   * `xapi.js` - Defines a few special /xapi/* paths, which provide definitions for some custom xapi extensions.
 * `app.js` - This file initializes the Express server, and orchestrates the application overall. It sets up the routes.
 * `config.js` - The configuration for our server.

## Security

The Evaluate platform is secured primarily using API keys. This should be a UUID which is issued to each client, and kept strictly secret.

### API Keys

All clients who wish to make use of the Evaluate Server will need to be issued an API Key. Whenever a client initiates an interaction with Evaluate, it will need to provide that API key.

The API key is used for verify their identity, and also to filter data so that they don't see metrics which are defined by other clients.

### Transactions

Some interactions with the server require more than one page load. In this situation you need the end user to be able to initiate a request to the server. (Such as when a user votes)

If we provided the API key to the end user, that would be a major security flaw. So instead a temporary transaction can be generated using the API key and given to the front end.

Each transaction has an API endpoint, and some data associated with it to ensure that the user only uses the transaction for it's intended purpose.

An example of this system in action can be found in the [Client Developer Documentation](./Developer.md)

## Control Flow

A typical request follows these steps.
 1. app.js receives the initial request, and the Param functions (initialized in app.js, and defined in util.js) are applied.
   * The param handlers will perform security checks, and retrieve transaction data.
 2. Control passes to one of the `/route/*` files, and it's appropriate handler.
 3. The handler will use the one or more of the models defined in `/models` to retrieve data from the database.
 4. The handler will either perform some modification to the database, or it will return some HTML or JSON.

## Adding a new Metric Type

Adding new metric types to the system is simple. The best thing to do is to look at one of the existing metric types (except Rubric, which is a special case), and duplicate it's code. 

All you need to do is create a folder in the `metric-types` folder. This folder must contain
* display.jade - Which defines the front-end display of the metric.
* options.jade - Which defines the editor for the metric type.
* functions.js - Which defines several functions for handling voting and editing for this metric type.

## The Concept of Blueprints / Rubrics

Among the Metric types there is one special type, called a Rubric. This is essentially a Metric of Metrics, and is defined using a special model called a "Blueprint"

Blueprints can be edited in much the same way as a Metric, but defines a list of metrics instead of a single metric. The blueprint can then be selected for use on any Rubric-type metric. Not, that in the user interface Rubric is used to refer to both Blueprints and Rubrics. Since from a user standpoint the distinction does not need to be made.

However, in the codebase a Rubric and a Blueprint are two different concepts, and are treated as such.
* A Rubric is a metric type.
* A Blueprint is a database model, which defines several submetrics.

## Learning Record Store

Evaluate provides the ability to record voting events to a [Learning Record Store](https://en.wikipedia.org/wiki/Learning_Record_Store).

All the code for this is contained in `includes/lrs.js`, which provides a single `send_vote` function. That function is called in `routes/index.js` to make the magic happen.

Additionally we had to extend the [xAPI](https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md) (Which is the specification used by LRS) to provide some extra attributes. The xAPI requires that we define these attributes with a link to human readable information. That information is provided using the routes in `routes/xapi.js`

## Database

The database code is implemented using the [Sequelize](http://docs.sequelizejs.com/en/latest/) library. Initial set up is performed in `includes/database.js`

However the actual table definitions are located in the `models` folder. These database tables are automatically generated if they don't already exist, and can be used as defined in the Sequelize documentation.

## Metric Sorting

In most cases using a simple average is not a good method for sorting. For the Two Way and Range metrics we use special formulas to calculate the sorting. Namely a Wilson score and a Bayesian Average, respectively.

The reasoning for this is well explained by this article: [How Now to Sort by Average Rating](http://www.evanmiller.org/how-not-to-sort-by-average-rating.html)

## Future Improvements

The system is fully functional, but improvements can always be made. I've prepared a list of possible improvements in the [Improvements.md](./Improvements.md) file.
