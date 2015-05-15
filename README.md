# Lackey Mongoose Slugify

Ensures there is an (human readable) unique slug for every document.

By defaut the **title** property will be used to generate the slug and the **slug** property to save it. By providing extra options we can change this behaviour. In case of duplicated slugs a four digit random number will be appended to the generated slug.

This module is part of the [Lackey CMS](http://lackey.io).

## Install

	npm install lackey-mongoose-slugify --save

## Basic Usage

In your mongoose model definition just add:

	var slugify = require('lackey-mongoose-slugify');

	mongoSchema.plugin(slugify);

Then a POST request with this data:
	
	POST {
		title: 'My test page',
		description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet velit nisl. Sed in mollis turpis. Nam in interdum metus, commodo consectetur augue.'
	}

will create a document like this:

	{
		title: 'My test page',
		slug: 'my-test-page'
		description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet velit nisl. Sed in mollis turpis. Nam in interdum metus, commodo consectetur augue.'
	}

## Providing Extra Options

	var slugify = require('lackey-mongoose-slugify'),
		slugifyOptions = {
			source: 'name',
			target: 'url',
			overwrite: true,
			logger: console,
			maxTries: 100
		};

	mongoSchema.plugin(slugify, slugifyOptions);

### source
The property used to generate the slug. Default is *title*

### target
The property used to save the generated slug. Default is *slug*

### overwrite
Overwrite a slug if any is provided? By default, yes. We discard any provided slug property and a new slug will be generated on every save. If you need to allow your users to provide their own slugs change the option to false. In case a null or empty slug is provided a new one will always be generated.

Although it won't genereate a new slug from the source property when the option is true, slugs will still be checked against duplicates and a random number will be added if any colision occours.

### logger
By default, only errors will be logged to console. If you wish to provide your own logger just submit one that implements (some of) the following methods:
	- info
	- error
	- debug

The existence of the methods will be checked before trying to use them. Providing false, null, {} or any other similar object will disable the logger.

### maxTries
The maximum number of times we try to generate an unique random number for a given duplicated slug. Defaults to 100.

## Notes
The plugin assumes the property *_id* is used as the document identifier. 
