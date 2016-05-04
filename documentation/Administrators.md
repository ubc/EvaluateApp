# Usage Instructions for Server Administrators

This document contains information on how to set up and maintain an Evaluate Installation.

- [Installation](#installation)
- [Issuing an API Key](#issuing-an-api-key)
- [Debugging an issue](#debugging-an-issue)

## Installation

To install Evaluate follow these steps.
 1. Install [NodeJS](https://nodejs.org/en/)
 2. Set up a database using one of the following dialects: PostgreSQL, MySQL, MariaDB, SQLite or MSSQL.
 3. Download the repository onto your computer. (Only the 'app' folder is necessary)
 4. Navigate to the 'app' folder
 5. Configure json in [config.js](../app/config) (The sample file is annotated and explains all the variables)
 6. Run `npm start` (in the 'app' folder)

## Issuing an API Key

Issuing a new API Key for a new service is as simple as adding it to the list of API Keys in config.js

## Debugging an issue

If desired you can run the server using `DEBUG=eval:* npm start` which will display all debug output.

You can also pipe the output into log files using this command: `DEBUG=eval:* npm start > output.log 2> error.log`

If you wish to narrow down the kind of DEBUG output you receive you can replace the `*` with one of these options:
 * `lrs` for messages related to the Learning Record Store
 * `security` for messages related to Transactions
 * `voting` for messages related to the parsing and storage of votes.
 * `metrics` for messages related to creating/saving/deleting metrics.
 * `blueprints` for messages related to creating/saving/deleting blueprints. (aka Rubrics)
