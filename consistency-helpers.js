function _isObject(obj) {
  return obj === Object(obj);
}

function makeConsistent(obj) {
  if (_isObject(obj)) {
    if (obj.structuredExample) {
      if (typeof obj.examples === 'undefined') {
        obj.examples = [];
      }

      obj.examples.push(obj.structuredExample);
      delete obj.example;
      delete obj.structuredExample;
    }

    if (obj.examples && obj.examples.length) {
      obj.examples = obj.examples.map(example => {
        if (!example.value) {
          return { value: example };
        }
        if (!example.displayName && example.name) {
          example.displayName = example.name;
        }
        return example;
      });
    }

    // Give each security scheme a displayName if it isn't already set
    if (obj.securitySchemes) {
      Object.keys(obj.securitySchemes).forEach(schemeName => {
        const scheme = obj.securitySchemes[schemeName];
        scheme.displayName = scheme.displayName || scheme.name;
      });
    }

    if (Array.isArray(obj.securedBy)) {
      if (
        obj.securedBy.length === 0 ||
        obj.securedBy.every(scheme => scheme === null)
      ) {
        // The RAML 1.0 spec allows that:
        //  "A securedBy node containing null as the array component indicates
        //   the method can be called without applying any security scheme."
        delete obj.securedBy;
      } else {
        // Guarantee that all elements of the securedBy array are either null or
        // objects containing a schemeName property (and an optional scopes property)
        obj.securedBy = obj.securedBy.map(scheme => {
          if (scheme === null) {
            return null;
          }
          if (typeof scheme === 'string') {
            return { schemeName: scheme };
          }
          const schemeName = Object.keys(scheme)[0];
          return Object.assign({ schemeName }, scheme[schemeName] || {});
        });
      }
    }

    // Fix inconsistency between request headers and response headers from raml-1-parser.
    // https://github.com/raml-org/raml-js-parser-2/issues/582
    if (Array.isArray(obj.headers)) {
      obj.headers.forEach(hdr => {
        if (typeof hdr.key === 'undefined' && hdr.name) {
          hdr.key = hdr.name;
        }
      });
    }

    Object.keys(obj).forEach(key => makeConsistent(obj[key]));
  } else if (Array.isArray(obj)) {
    obj.forEach(makeConsistent);
  }

  return obj;
}

module.exports = makeConsistent;
