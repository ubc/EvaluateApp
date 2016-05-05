# EvaluateApp
A nodejs application that provides content rating as a service.

Essentially Evaluate is a NodeJS server which provides metrics that can be embedded onto your site. Each client site is issued an API key, which it uses to communicate with the server.

## Features
* Various rating types - One-Way, Two-Way, Poll, Range, and Valuelist
* Rubrics - Essentially a metric composed of various submetrics.
* Learning Record Store integration - Vote events are sent to the LRS.

## Documentation
* [For Server Administrators](./documentation/Administrators.md) - How to install and configure Evaluate
* [For Client Developers](./documentation/Developers.md) - How to interface with Evaluate
* [For Evaluate Developers](./documentation/Maintainers.md) - How the code is structured, and how to maintain it.
