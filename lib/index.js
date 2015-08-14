/*jslint node:true, nomen: true */
'use strict';
/*
    Copyright 2015 Enigma Marketing Services Limited

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

var slugify = require('./slugify'),
    Obj,
    dummyLogger;


dummyLogger = {
    debug: function () {
        return false;
    },
    trace: function () {
        return false;
    },
    info: function () {
        return false;
    },
    error: function () {
        return false;
    }
};

function getRandomNumber() {
    var r = Math.round(Math.random() * 10000 - 1);
    r = r.toString();

    while (r.length < 4) {
        r = '0' + r;
    }

    return r;
}

Obj = function (mongoSchema, options) {
    var self = this;

    self.setOptions(options);

    self.logger = (options.logger === false ? dummyLogger : options.logger || console);

    // grab the Model from the current connection
    mongoSchema.on('init', function (Model) {
        self.Model = Model;
    });

    mongoSchema.pre('validate', function (next) {
        var doc = this,
            err;

        if (!self.Model) {
            err = new Error('Model is not loaded. Unable to slugify.');
            self.logger.error(err);
            return next(err);
        }

        // discard the provided slug so it is always updated
        if (self.opts.overwrite) {
            self.discardCurrentSlug(doc);
        }

        self.setUniqueSlug(doc, function (err, doc) {
            if (err) {
                self.logger.error(err);
            }

            self.logger.info('Slugged ' + doc[self.opts.source] + ' into ' + doc[self.opts.target]);
            next(err);
        });
    });
};

Obj.prototype.opts = null;
Obj.prototype.logger = null;

Obj.prototype.setOptions = function (options) {
    var self = this,
        opts = options || {};

    self.opts = {};
    self.opts.source = opts.source || 'title';
    self.opts.target = opts.target || 'slug';
    self.opts.overwrite = opts.overwrite || true;
    self.opts.maxTries = parseInt(opts.maxTries, 10) || 100;

    self.opts.logger = opts.logger || {
        error: console.error
    };
};

Obj.prototype.discardCurrentSlug = function (doc) {
    var self = this,
        source = doc[self.opts.source],
        currentSlug = doc[self.opts.target],
        newSlug = slugify(source.toLowerCase());
    // slugs are similar
    // either slugs are equal 
    // or current is my-slug-1234 and new my-slug
    // either way, we shouldn't delete it or a new random
    // number will be asigned and a new URL issued to the page
    if (currentSlug.indexOf(newSlug) === 0) {
        return;
    }
    // source was changed. will generate a different slug
    doc[self.opts.target] = null;
};

Obj.prototype.setUniqueSlug = function (doc, cb, tries) {
    var self = this,
        numTries = tries + 1 || 1,
        err,
        source;

    if (doc[self.opts.target] === null || doc[self.opts.target] === undefined || doc[self.opts.target] === '') {
        source = doc[self.opts.source];

        if (source === undefined) {
            err = new Error('Unable to access property ' + self.opts.source);
            return cb(err);
        }
        self.logger.debug('Slugging source' + source);
    } else {
        // we will slugify it again to ensure we don't have any invalid characters
        source = doc[self.opts.target];
        self.logger.debug('Re-slugging target' + source);
    }

    doc.slug = slugify(source.toLowerCase());

    self.checkSlugColision(doc, function (err, isDuplicated) {
        var target = doc[self.opts.target];

        if (err) {
            return cb(err);
        }

        if (isDuplicated) {
            self.logger.debug('Duplicated target ' + target + '. num tries: ' + numTries);

            if (numTries > self.opts.maxTries) {
                err = new Error('Max Tries reached ' + numTries);
                return cb(err);
            }

            target = target.replace(/-[0-9]{4}$/, '');
            target += '-' + getRandomNumber();
            doc[self.opts.target] = target;

            return self.setUniqueSlug(doc, cb, numTries);
        }

        cb(null, doc);
    });
};

Obj.prototype.checkSlugColision = function (doc, cb) {
    var self = this,
        q = {
            _id: { // discard this document
                $ne: doc._id
            }
        };

    q[self.opts.target] = doc[self.opts.target];

    self.Model.findOne(q, function (err, doc) {
        if (err) {
            return cb(err);
        }

        cb(null, (doc ? true : false));
    });
};

module.exports = function (mongoSchema, options) {
    var obj = new Obj(mongoSchema, options);

    return obj;
};