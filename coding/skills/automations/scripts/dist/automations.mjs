#!/usr/bin/env node
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x2) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x2, {
  get: (a2, b2) => (typeof require !== "undefined" ? require : a2)[b2]
}) : x2)(function(x2) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x2 + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e3) {
    throw mod = 0, e3;
  }
};
var __copyProps = (to2, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to2, key) && key !== except)
        __defProp(to2, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to2;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@xmldom/xmldom/lib/conventions.js
var require_conventions = __commonJS({
  "node_modules/@xmldom/xmldom/lib/conventions.js"(exports) {
    "use strict";
    function find(list2, predicate, ac2) {
      if (ac2 === void 0) {
        ac2 = Array.prototype;
      }
      if (list2 && typeof ac2.find === "function") {
        return ac2.find.call(list2, predicate);
      }
      for (var i2 = 0; i2 < list2.length; i2++) {
        if (hasOwn(list2, i2)) {
          var item = list2[i2];
          if (predicate.call(void 0, item, i2, list2)) {
            return item;
          }
        }
      }
    }
    function freeze(object, oc2) {
      if (oc2 === void 0) {
        oc2 = Object;
      }
      if (oc2 && typeof oc2.getOwnPropertyDescriptors === "function") {
        object = oc2.create(null, oc2.getOwnPropertyDescriptors(object));
      }
      return oc2 && typeof oc2.freeze === "function" ? oc2.freeze(object) : object;
    }
    function hasOwn(object, key) {
      return Object.prototype.hasOwnProperty.call(object, key);
    }
    function assign(target, source) {
      if (target === null || typeof target !== "object") {
        throw new TypeError("target is not an object");
      }
      for (var key in source) {
        if (hasOwn(source, key)) {
          target[key] = source[key];
        }
      }
      return target;
    }
    var HTML_BOOLEAN_ATTRIBUTES = freeze({
      allowfullscreen: true,
      async: true,
      autofocus: true,
      autoplay: true,
      checked: true,
      controls: true,
      default: true,
      defer: true,
      disabled: true,
      formnovalidate: true,
      hidden: true,
      ismap: true,
      itemscope: true,
      loop: true,
      multiple: true,
      muted: true,
      nomodule: true,
      novalidate: true,
      open: true,
      playsinline: true,
      readonly: true,
      required: true,
      reversed: true,
      selected: true
    });
    function isHTMLBooleanAttribute(name) {
      return hasOwn(HTML_BOOLEAN_ATTRIBUTES, name.toLowerCase());
    }
    var HTML_VOID_ELEMENTS = freeze({
      area: true,
      base: true,
      br: true,
      col: true,
      embed: true,
      hr: true,
      img: true,
      input: true,
      link: true,
      meta: true,
      param: true,
      source: true,
      track: true,
      wbr: true
    });
    function isHTMLVoidElement(tagName) {
      return hasOwn(HTML_VOID_ELEMENTS, tagName.toLowerCase());
    }
    var HTML_RAW_TEXT_ELEMENTS = freeze({
      script: false,
      style: false,
      textarea: true,
      title: true
    });
    function isHTMLRawTextElement(tagName) {
      var key = tagName.toLowerCase();
      return hasOwn(HTML_RAW_TEXT_ELEMENTS, key) && !HTML_RAW_TEXT_ELEMENTS[key];
    }
    function isHTMLEscapableRawTextElement(tagName) {
      var key = tagName.toLowerCase();
      return hasOwn(HTML_RAW_TEXT_ELEMENTS, key) && HTML_RAW_TEXT_ELEMENTS[key];
    }
    function isHTMLMimeType(mimeType) {
      return mimeType === MIME_TYPE.HTML;
    }
    function hasDefaultHTMLNamespace(mimeType) {
      return isHTMLMimeType(mimeType) || mimeType === MIME_TYPE.XML_XHTML_APPLICATION;
    }
    var MIME_TYPE = freeze({
      /**
       * `text/html`, the only mime type that triggers treating an XML document as HTML.
       *
       * @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
       * @see https://en.wikipedia.org/wiki/HTML Wikipedia
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
       * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring
       *      WHATWG HTML Spec
       */
      HTML: "text/html",
      /**
       * `application/xml`, the standard mime type for XML documents.
       *
       * @see https://www.iana.org/assignments/media-types/application/xml IANA MimeType
       *      registration
       * @see https://tools.ietf.org/html/rfc7303#section-9.1 RFC 7303
       * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
       */
      XML_APPLICATION: "application/xml",
      /**
       * `text/xml`, an alias for `application/xml`.
       *
       * @see https://tools.ietf.org/html/rfc7303#section-9.2 RFC 7303
       * @see https://www.iana.org/assignments/media-types/text/xml IANA MimeType registration
       * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
       */
      XML_TEXT: "text/xml",
      /**
       * `application/xhtml+xml`, indicates an XML document that has the default HTML namespace,
       * but is parsed as an XML document.
       *
       * @see https://www.iana.org/assignments/media-types/application/xhtml+xml IANA MimeType
       *      registration
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument WHATWG DOM Spec
       * @see https://en.wikipedia.org/wiki/XHTML Wikipedia
       */
      XML_XHTML_APPLICATION: "application/xhtml+xml",
      /**
       * `image/svg+xml`,
       *
       * @see https://www.iana.org/assignments/media-types/image/svg+xml IANA MimeType registration
       * @see https://www.w3.org/TR/SVG11/ W3C SVG 1.1
       * @see https://en.wikipedia.org/wiki/Scalable_Vector_Graphics Wikipedia
       */
      XML_SVG_IMAGE: "image/svg+xml"
    });
    var _MIME_TYPES = Object.keys(MIME_TYPE).map(function(key) {
      return MIME_TYPE[key];
    });
    function isValidMimeType(mimeType) {
      return _MIME_TYPES.indexOf(mimeType) > -1;
    }
    var NAMESPACE = freeze({
      /**
       * The XHTML namespace.
       *
       * @see http://www.w3.org/1999/xhtml
       */
      HTML: "http://www.w3.org/1999/xhtml",
      /**
       * The SVG namespace.
       *
       * @see http://www.w3.org/2000/svg
       */
      SVG: "http://www.w3.org/2000/svg",
      /**
       * The `xml:` namespace.
       *
       * @see http://www.w3.org/XML/1998/namespace
       */
      XML: "http://www.w3.org/XML/1998/namespace",
      /**
       * The `xmlns:` namespace.
       *
       * @see https://www.w3.org/2000/xmlns/
       */
      XMLNS: "http://www.w3.org/2000/xmlns/"
    });
    exports.assign = assign;
    exports.find = find;
    exports.freeze = freeze;
    exports.HTML_BOOLEAN_ATTRIBUTES = HTML_BOOLEAN_ATTRIBUTES;
    exports.HTML_RAW_TEXT_ELEMENTS = HTML_RAW_TEXT_ELEMENTS;
    exports.HTML_VOID_ELEMENTS = HTML_VOID_ELEMENTS;
    exports.hasDefaultHTMLNamespace = hasDefaultHTMLNamespace;
    exports.hasOwn = hasOwn;
    exports.isHTMLBooleanAttribute = isHTMLBooleanAttribute;
    exports.isHTMLRawTextElement = isHTMLRawTextElement;
    exports.isHTMLEscapableRawTextElement = isHTMLEscapableRawTextElement;
    exports.isHTMLMimeType = isHTMLMimeType;
    exports.isHTMLVoidElement = isHTMLVoidElement;
    exports.isValidMimeType = isValidMimeType;
    exports.MIME_TYPE = MIME_TYPE;
    exports.NAMESPACE = NAMESPACE;
  }
});

// node_modules/@xmldom/xmldom/lib/errors.js
var require_errors = __commonJS({
  "node_modules/@xmldom/xmldom/lib/errors.js"(exports) {
    "use strict";
    var conventions = require_conventions();
    function extendError(constructor, writableName) {
      constructor.prototype = Object.create(Error.prototype, {
        constructor: { value: constructor },
        name: { value: constructor.name, enumerable: true, writable: writableName }
      });
    }
    var DOMExceptionName = conventions.freeze({
      /**
       * the default value as defined by the spec
       */
      Error: "Error",
      /**
       * @deprecated
       * Use RangeError instead.
       */
      IndexSizeError: "IndexSizeError",
      /**
       * @deprecated
       * Just to match the related static code, not part of the spec.
       */
      DomstringSizeError: "DomstringSizeError",
      HierarchyRequestError: "HierarchyRequestError",
      WrongDocumentError: "WrongDocumentError",
      InvalidCharacterError: "InvalidCharacterError",
      /**
       * @deprecated
       * Just to match the related static code, not part of the spec.
       */
      NoDataAllowedError: "NoDataAllowedError",
      NoModificationAllowedError: "NoModificationAllowedError",
      NotFoundError: "NotFoundError",
      NotSupportedError: "NotSupportedError",
      InUseAttributeError: "InUseAttributeError",
      InvalidStateError: "InvalidStateError",
      SyntaxError: "SyntaxError",
      InvalidModificationError: "InvalidModificationError",
      NamespaceError: "NamespaceError",
      /**
       * @deprecated
       * Use TypeError for invalid arguments,
       * "NotSupportedError" DOMException for unsupported operations,
       * and "NotAllowedError" DOMException for denied requests instead.
       */
      InvalidAccessError: "InvalidAccessError",
      /**
       * @deprecated
       * Just to match the related static code, not part of the spec.
       */
      ValidationError: "ValidationError",
      /**
       * @deprecated
       * Use TypeError instead.
       */
      TypeMismatchError: "TypeMismatchError",
      SecurityError: "SecurityError",
      NetworkError: "NetworkError",
      AbortError: "AbortError",
      /**
       * @deprecated
       * Just to match the related static code, not part of the spec.
       */
      URLMismatchError: "URLMismatchError",
      QuotaExceededError: "QuotaExceededError",
      TimeoutError: "TimeoutError",
      InvalidNodeTypeError: "InvalidNodeTypeError",
      DataCloneError: "DataCloneError",
      EncodingError: "EncodingError",
      NotReadableError: "NotReadableError",
      UnknownError: "UnknownError",
      ConstraintError: "ConstraintError",
      DataError: "DataError",
      TransactionInactiveError: "TransactionInactiveError",
      ReadOnlyError: "ReadOnlyError",
      VersionError: "VersionError",
      OperationError: "OperationError",
      NotAllowedError: "NotAllowedError",
      OptOutError: "OptOutError"
    });
    var DOMExceptionNames = Object.keys(DOMExceptionName);
    function isValidDomExceptionCode(value) {
      return typeof value === "number" && value >= 1 && value <= 25;
    }
    function endsWithError(value) {
      return typeof value === "string" && value.substring(value.length - DOMExceptionName.Error.length) === DOMExceptionName.Error;
    }
    function DOMException2(messageOrCode, nameOrMessage) {
      if (isValidDomExceptionCode(messageOrCode)) {
        this.name = DOMExceptionNames[messageOrCode];
        this.message = nameOrMessage || "";
      } else {
        this.message = messageOrCode;
        this.name = endsWithError(nameOrMessage) ? nameOrMessage : DOMExceptionName.Error;
      }
      if (Error.captureStackTrace) Error.captureStackTrace(this, DOMException2);
    }
    extendError(DOMException2, true);
    Object.defineProperties(DOMException2.prototype, {
      code: {
        enumerable: true,
        get: function() {
          var code = DOMExceptionNames.indexOf(this.name);
          if (isValidDomExceptionCode(code)) return code;
          return 0;
        }
      }
    });
    var ExceptionCode = {
      INDEX_SIZE_ERR: 1,
      DOMSTRING_SIZE_ERR: 2,
      HIERARCHY_REQUEST_ERR: 3,
      WRONG_DOCUMENT_ERR: 4,
      INVALID_CHARACTER_ERR: 5,
      NO_DATA_ALLOWED_ERR: 6,
      NO_MODIFICATION_ALLOWED_ERR: 7,
      NOT_FOUND_ERR: 8,
      NOT_SUPPORTED_ERR: 9,
      INUSE_ATTRIBUTE_ERR: 10,
      INVALID_STATE_ERR: 11,
      SYNTAX_ERR: 12,
      INVALID_MODIFICATION_ERR: 13,
      NAMESPACE_ERR: 14,
      INVALID_ACCESS_ERR: 15,
      VALIDATION_ERR: 16,
      TYPE_MISMATCH_ERR: 17,
      SECURITY_ERR: 18,
      NETWORK_ERR: 19,
      ABORT_ERR: 20,
      URL_MISMATCH_ERR: 21,
      QUOTA_EXCEEDED_ERR: 22,
      TIMEOUT_ERR: 23,
      INVALID_NODE_TYPE_ERR: 24,
      DATA_CLONE_ERR: 25
    };
    var entries = Object.entries(ExceptionCode);
    for (i2 = 0; i2 < entries.length; i2++) {
      key = entries[i2][0];
      DOMException2[key] = entries[i2][1];
    }
    var key;
    var i2;
    function ParseError(message, locator, cause) {
      this.message = message;
      this.locator = locator;
      this.cause = cause;
      if (Error.captureStackTrace) Error.captureStackTrace(this, ParseError);
    }
    extendError(ParseError);
    exports.DOMException = DOMException2;
    exports.DOMExceptionName = DOMExceptionName;
    exports.ExceptionCode = ExceptionCode;
    exports.ParseError = ParseError;
  }
});

// node_modules/@xmldom/xmldom/lib/grammar.js
var require_grammar = __commonJS({
  "node_modules/@xmldom/xmldom/lib/grammar.js"(exports) {
    "use strict";
    function detectUnicodeSupport(RegExpImpl) {
      try {
        if (typeof RegExpImpl !== "function") {
          RegExpImpl = RegExp;
        }
        var match = new RegExpImpl("\u{1D306}", "u").exec("\u{1D306}");
        return !!match && match[0].length === 2;
      } catch (error) {
      }
      return false;
    }
    var UNICODE_SUPPORT = detectUnicodeSupport();
    function chars(regexp) {
      if (regexp.source[0] !== "[") {
        throw new Error(regexp + " can not be used with chars");
      }
      return regexp.source.slice(1, regexp.source.lastIndexOf("]"));
    }
    function chars_without(regexp, search) {
      if (regexp.source[0] !== "[") {
        throw new Error("/" + regexp.source + "/ can not be used with chars_without");
      }
      if (!search || typeof search !== "string") {
        throw new Error(JSON.stringify(search) + " is not a valid search");
      }
      if (regexp.source.indexOf(search) === -1) {
        throw new Error('"' + search + '" is not is /' + regexp.source + "/");
      }
      if (search === "-" && regexp.source.indexOf(search) !== 1) {
        throw new Error('"' + search + '" is not at the first postion of /' + regexp.source + "/");
      }
      return new RegExp(regexp.source.replace(search, ""), UNICODE_SUPPORT ? "u" : "");
    }
    function reg(args) {
      var self = this;
      return new RegExp(
        Array.prototype.slice.call(arguments).map(function(part) {
          var isStr = typeof part === "string";
          if (isStr && self === void 0 && part === "|") {
            throw new Error("use regg instead of reg to wrap expressions with `|`!");
          }
          return isStr ? part : part.source;
        }).join(""),
        UNICODE_SUPPORT ? "u" : ""
      );
    }
    function regg(args) {
      if (arguments.length === 0) {
        throw new Error("no parameters provided");
      }
      return reg.apply(regg, ["(?:"].concat(Array.prototype.slice.call(arguments), [")"]));
    }
    var UNICODE_REPLACEMENT_CHARACTER = "\uFFFD";
    var Char = /[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;
    if (UNICODE_SUPPORT) {
      Char = reg("[", chars(Char), "\\u{10000}-\\u{10FFFF}", "]");
    }
    var InvalidChar = new RegExp("[^" + chars(Char) + "]", UNICODE_SUPPORT ? "u" : "");
    var _SChar = /[\x20\x09\x0D\x0A]/;
    var SChar_s = chars(_SChar);
    var S2 = reg(_SChar, "+");
    var S_OPT = reg(_SChar, "*");
    var NameStartChar = /[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
    if (UNICODE_SUPPORT) {
      NameStartChar = reg("[", chars(NameStartChar), "\\u{10000}-\\u{10FFFF}", "]");
    }
    var NameStartChar_s = chars(NameStartChar);
    var NameChar = reg("[", NameStartChar_s, chars(/[-.0-9\xB7]/), chars(/[\u0300-\u036F\u203F-\u2040]/), "]");
    var Name = reg(NameStartChar, NameChar, "*");
    var Name_exact = reg("^", Name, "$");
    var Nmtoken = reg(NameChar, "+");
    var EntityRef = reg("&", Name, ";");
    var CharRef = regg(/&#[0-9]+;|&#x[0-9a-fA-F]+;/);
    var Reference = regg(EntityRef, "|", CharRef);
    var PEReference = reg("%", Name, ";");
    var EntityValue = regg(
      reg('"', regg(/[^%&"]/, "|", PEReference, "|", Reference), "*", '"'),
      "|",
      reg("'", regg(/[^%&']/, "|", PEReference, "|", Reference), "*", "'")
    );
    var AttValue = regg('"', regg(/[^<&"]/, "|", Reference), "*", '"', "|", "'", regg(/[^<&']/, "|", Reference), "*", "'");
    var NCNameStartChar = chars_without(NameStartChar, ":");
    var NCNameChar = chars_without(NameChar, ":");
    var NCName = reg(NCNameStartChar, NCNameChar, "*");
    var NCName_exact = reg("^", NCName, "$");
    var QName = reg(NCName, regg(":", NCName), "?");
    var QName_exact = reg("^", QName, "$");
    var QName_group = reg("(", QName, ")");
    var SystemLiteral = regg(/"[^"]*"|'[^']*'/);
    var PI = reg(/^<\?/, "(", Name, ")", regg(S2, "(?!", _SChar, ")(", Char, "*?)"), "?", /\?>/);
    var PubidChar = /[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/;
    var PubidLiteral = regg('"', PubidChar, '*"', "|", "'", chars_without(PubidChar, "'"), "*'");
    var COMMENT_START = "<!--";
    var COMMENT_END = "-->";
    var Comment = reg(COMMENT_START, regg(chars_without(Char, "-"), "|", reg("-", chars_without(Char, "-"))), "*", COMMENT_END);
    var PCDATA = "#PCDATA";
    var Mixed = regg(
      reg(/\(/, S_OPT, PCDATA, regg(S_OPT, /\|/, S_OPT, QName), "*", S_OPT, /\)\*/),
      "|",
      reg(/\(/, S_OPT, PCDATA, S_OPT, /\)/)
    );
    var _children_quantity = /[?*+]?/;
    var children2 = reg(
      /\([^>]+\)/,
      _children_quantity
      /*regg(choice, '|', seq), _children_quantity*/
    );
    var contentspec = regg("EMPTY", "|", "ANY", "|", Mixed, "|", children2);
    var ELEMENTDECL_START = "<!ELEMENT";
    var elementdecl = reg(ELEMENTDECL_START, S2, regg(QName, "|", PEReference), S2, regg(contentspec, "|", PEReference), S_OPT, ">");
    var NotationType = reg("NOTATION", S2, /\(/, S_OPT, Name, regg(S_OPT, /\|/, S_OPT, Name), "*", S_OPT, /\)/);
    var Enumeration = reg(/\(/, S_OPT, Nmtoken, regg(S_OPT, /\|/, S_OPT, Nmtoken), "*", S_OPT, /\)/);
    var EnumeratedType = regg(NotationType, "|", Enumeration);
    var AttType = regg(/CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/, "|", EnumeratedType);
    var DefaultDecl = regg(/#REQUIRED|#IMPLIED/, "|", regg(regg("#FIXED", S2), "?", AttValue));
    var AttDef = regg(S2, Name, S2, AttType, S2, DefaultDecl);
    var ATTLIST_DECL_START = "<!ATTLIST";
    var AttlistDecl = reg(ATTLIST_DECL_START, S2, Name, AttDef, "*", S_OPT, ">");
    var ABOUT_LEGACY_COMPAT = "about:legacy-compat";
    var ABOUT_LEGACY_COMPAT_SystemLiteral = regg('"' + ABOUT_LEGACY_COMPAT + '"', "|", "'" + ABOUT_LEGACY_COMPAT + "'");
    var SYSTEM = "SYSTEM";
    var PUBLIC = "PUBLIC";
    var ExternalID = regg(regg(SYSTEM, S2, SystemLiteral), "|", regg(PUBLIC, S2, PubidLiteral, S2, SystemLiteral));
    var ExternalID_match = reg(
      "^",
      regg(
        regg(SYSTEM, S2, "(?<SystemLiteralOnly>", SystemLiteral, ")"),
        "|",
        regg(PUBLIC, S2, "(?<PubidLiteral>", PubidLiteral, ")", S2, "(?<SystemLiteral>", SystemLiteral, ")")
      )
    );
    var PubidLiteral_match = reg("^", PubidLiteral, "$");
    var SystemLiteral_match = reg("^", SystemLiteral, "$");
    var NDataDecl = regg(S2, "NDATA", S2, Name);
    var EntityDef = regg(EntityValue, "|", regg(ExternalID, NDataDecl, "?"));
    var ENTITY_DECL_START = "<!ENTITY";
    var GEDecl = reg(ENTITY_DECL_START, S2, Name, S2, EntityDef, S_OPT, ">");
    var PEDef = regg(EntityValue, "|", ExternalID);
    var PEDecl = reg(ENTITY_DECL_START, S2, "%", S2, Name, S2, PEDef, S_OPT, ">");
    var EntityDecl = regg(GEDecl, "|", PEDecl);
    var PublicID = reg(PUBLIC, S2, PubidLiteral);
    var NotationDecl = reg("<!NOTATION", S2, Name, S2, regg(ExternalID, "|", PublicID), S_OPT, ">");
    var Eq = reg(S_OPT, "=", S_OPT);
    var VersionNum = /1[.]\d+/;
    var VersionInfo = reg(S2, "version", Eq, regg("'", VersionNum, "'", "|", '"', VersionNum, '"'));
    var EncName = /[A-Za-z][-A-Za-z0-9._]*/;
    var EncodingDecl = regg(S2, "encoding", Eq, regg('"', EncName, '"', "|", "'", EncName, "'"));
    var SDDecl = regg(S2, "standalone", Eq, regg("'", regg("yes", "|", "no"), "'", "|", '"', regg("yes", "|", "no"), '"'));
    var XMLDecl = reg(/^<\?xml/, VersionInfo, EncodingDecl, "?", SDDecl, "?", S_OPT, /\?>/);
    var DOCTYPE_DECL_START = "<!DOCTYPE";
    var CDATA_START = "<![CDATA[";
    var CDATA_END = "]]>";
    var CDStart = /<!\[CDATA\[/;
    var CDEnd = /\]\]>/;
    var CData = reg(Char, "*?", CDEnd);
    var CDSect = reg(CDStart, CData);
    exports.chars = chars;
    exports.chars_without = chars_without;
    exports.detectUnicodeSupport = detectUnicodeSupport;
    exports.reg = reg;
    exports.regg = regg;
    exports.ABOUT_LEGACY_COMPAT = ABOUT_LEGACY_COMPAT;
    exports.ABOUT_LEGACY_COMPAT_SystemLiteral = ABOUT_LEGACY_COMPAT_SystemLiteral;
    exports.AttlistDecl = AttlistDecl;
    exports.CDATA_START = CDATA_START;
    exports.CDATA_END = CDATA_END;
    exports.CDSect = CDSect;
    exports.Char = Char;
    exports.Comment = Comment;
    exports.COMMENT_START = COMMENT_START;
    exports.COMMENT_END = COMMENT_END;
    exports.DOCTYPE_DECL_START = DOCTYPE_DECL_START;
    exports.elementdecl = elementdecl;
    exports.EntityDecl = EntityDecl;
    exports.EntityValue = EntityValue;
    exports.ExternalID = ExternalID;
    exports.ExternalID_match = ExternalID_match;
    exports.Name = Name;
    exports.Name_exact = Name_exact;
    exports.NCName_exact = NCName_exact;
    exports.NotationDecl = NotationDecl;
    exports.Reference = Reference;
    exports.PEReference = PEReference;
    exports.PI = PI;
    exports.PUBLIC = PUBLIC;
    exports.PubidLiteral = PubidLiteral;
    exports.PubidLiteral_match = PubidLiteral_match;
    exports.QName = QName;
    exports.QName_exact = QName_exact;
    exports.QName_group = QName_group;
    exports.S = S2;
    exports.SChar_s = SChar_s;
    exports.S_OPT = S_OPT;
    exports.SYSTEM = SYSTEM;
    exports.SystemLiteral = SystemLiteral;
    exports.SystemLiteral_match = SystemLiteral_match;
    exports.InvalidChar = InvalidChar;
    exports.UNICODE_REPLACEMENT_CHARACTER = UNICODE_REPLACEMENT_CHARACTER;
    exports.UNICODE_SUPPORT = UNICODE_SUPPORT;
    exports.XMLDecl = XMLDecl;
  }
});

// node_modules/@xmldom/xmldom/lib/dom.js
var require_dom = __commonJS({
  "node_modules/@xmldom/xmldom/lib/dom.js"(exports) {
    "use strict";
    var conventions = require_conventions();
    var find = conventions.find;
    var hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
    var hasOwn = conventions.hasOwn;
    var isHTMLMimeType = conventions.isHTMLMimeType;
    var isHTMLRawTextElement = conventions.isHTMLRawTextElement;
    var isHTMLVoidElement = conventions.isHTMLVoidElement;
    var MIME_TYPE = conventions.MIME_TYPE;
    var NAMESPACE = conventions.NAMESPACE;
    var PDC = /* @__PURE__ */ Symbol();
    var errors = require_errors();
    var DOMException2 = errors.DOMException;
    var DOMExceptionName = errors.DOMExceptionName;
    var g2 = require_grammar();
    function checkSymbol(symbol) {
      if (symbol !== PDC) {
        throw new TypeError("Illegal constructor");
      }
    }
    function notEmptyString(input) {
      return input !== "";
    }
    function splitOnASCIIWhitespace(input) {
      return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : [];
    }
    function orderedSetReducer(current, element) {
      if (!hasOwn(current, element)) {
        current[element] = true;
      }
      return current;
    }
    function toOrderedSet(input) {
      if (!input) return [];
      var list2 = splitOnASCIIWhitespace(input);
      return Object.keys(list2.reduce(orderedSetReducer, {}));
    }
    function arrayIncludes(list2) {
      return function(element) {
        return list2 && list2.indexOf(element) !== -1;
      };
    }
    function validateQualifiedName(qualifiedName) {
      if (!g2.QName_exact.test(qualifiedName)) {
        throw new DOMException2(DOMException2.INVALID_CHARACTER_ERR, 'invalid character in qualified name "' + qualifiedName + '"');
      }
    }
    function validateAndExtract(namespace, qualifiedName) {
      validateQualifiedName(qualifiedName);
      namespace = namespace || null;
      var prefix = null;
      var localName = qualifiedName;
      if (qualifiedName.indexOf(":") >= 0) {
        var splitResult = qualifiedName.split(":");
        prefix = splitResult[0];
        localName = splitResult[1];
      }
      if (prefix !== null && namespace === null) {
        throw new DOMException2(DOMException2.NAMESPACE_ERR, "prefix is non-null and namespace is null");
      }
      if (prefix === "xml" && namespace !== conventions.NAMESPACE.XML) {
        throw new DOMException2(DOMException2.NAMESPACE_ERR, 'prefix is "xml" and namespace is not the XML namespace');
      }
      if ((prefix === "xmlns" || qualifiedName === "xmlns") && namespace !== conventions.NAMESPACE.XMLNS) {
        throw new DOMException2(
          DOMException2.NAMESPACE_ERR,
          'either qualifiedName or prefix is "xmlns" and namespace is not the XMLNS namespace'
        );
      }
      if (namespace === conventions.NAMESPACE.XMLNS && prefix !== "xmlns" && qualifiedName !== "xmlns") {
        throw new DOMException2(
          DOMException2.NAMESPACE_ERR,
          'namespace is the XMLNS namespace and neither qualifiedName nor prefix is "xmlns"'
        );
      }
      return [namespace, prefix, localName];
    }
    function copy(src, dest) {
      for (var p2 in src) {
        if (hasOwn(src, p2)) {
          dest[p2] = src[p2];
        }
      }
    }
    function _extends(Class, Super) {
      var pt2 = Class.prototype;
      if (!(pt2 instanceof Super)) {
        let t2 = function() {
        };
        t2.prototype = Super.prototype;
        t2 = new t2();
        copy(pt2, t2);
        Class.prototype = pt2 = t2;
      }
      if (pt2.constructor != Class) {
        if (typeof Class != "function") {
          console.error("unknown Class:" + Class);
        }
        pt2.constructor = Class;
      }
    }
    var NodeType = {};
    var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
    var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
    var TEXT_NODE = NodeType.TEXT_NODE = 3;
    var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
    var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
    var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
    var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
    var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
    var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
    var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
    var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
    var NOTATION_NODE = NodeType.NOTATION_NODE = 12;
    var DocumentPosition = conventions.freeze({
      DOCUMENT_POSITION_DISCONNECTED: 1,
      DOCUMENT_POSITION_PRECEDING: 2,
      DOCUMENT_POSITION_FOLLOWING: 4,
      DOCUMENT_POSITION_CONTAINS: 8,
      DOCUMENT_POSITION_CONTAINED_BY: 16,
      DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32
    });
    function commonAncestor(a2, b2) {
      if (b2.length < a2.length) return commonAncestor(b2, a2);
      var c2 = null;
      for (var n2 in a2) {
        if (a2[n2] !== b2[n2]) return c2;
        c2 = a2[n2];
      }
      return c2;
    }
    function docGUID(doc) {
      if (!doc.guid) doc.guid = Math.random();
      return doc.guid;
    }
    function NodeList() {
    }
    NodeList.prototype = {
      /**
       * The number of nodes in the list. The range of valid child node indices is 0 to length-1
       * inclusive.
       *
       * @type {number}
       */
      length: 0,
      /**
       * Returns the item at `index`. If index is greater than or equal to the number of nodes in
       * the list, this returns null.
       *
       * @param index
       * Unsigned long Index into the collection.
       * @returns {Node | null}
       * The node at position `index` in the NodeList,
       * or null if that is not a valid index.
       */
      item: function(index) {
        return index >= 0 && index < this.length ? this[index] : null;
      },
      /**
       * Returns a string representation of the NodeList.
       *
       * Accepts the same `options` object as `XMLSerializer.prototype.serializeToString`
       * (`requireWellFormed`, `splitCDATASections`, `nodeFilter`). Passing a function is treated as
       * a legacy `nodeFilter` for backward compatibility.
       *
       * @param {Object | function} [options]
       * @param {boolean} [options.requireWellFormed=false]
       * @param {boolean} [options.splitCDATASections=true]
       * @param {function} [options.nodeFilter]
       * @returns {string}
       */
      toString: function(options) {
        var opts;
        if (typeof options === "function") {
          opts = { requireWellFormed: false, splitCDATASections: true, nodeFilter: options };
        } else if (!!options) {
          opts = {
            requireWellFormed: !!options.requireWellFormed,
            splitCDATASections: options.splitCDATASections !== false,
            nodeFilter: options.nodeFilter || null
          };
        } else {
          opts = { requireWellFormed: false, splitCDATASections: true, nodeFilter: null };
        }
        for (var buf = [], i2 = 0; i2 < this.length; i2++) {
          serializeToString(this[i2], buf, null, opts);
        }
        return buf.join("");
      },
      /**
       * Filters the NodeList based on a predicate.
       *
       * @param {function(Node): boolean} predicate
       * - A predicate function to filter the NodeList.
       * @returns {Node[]}
       * An array of nodes that satisfy the predicate.
       * @private
       */
      filter: function(predicate) {
        return Array.prototype.filter.call(this, predicate);
      },
      /**
       * Returns the first index at which a given node can be found in the NodeList, or -1 if it is
       * not present.
       *
       * @param {Node} item
       * - The Node item to locate in the NodeList.
       * @returns {number}
       * The first index of the node in the NodeList; -1 if not found.
       * @private
       */
      indexOf: function(item) {
        return Array.prototype.indexOf.call(this, item);
      }
    };
    NodeList.prototype[Symbol.iterator] = function() {
      var me2 = this;
      var index = 0;
      return {
        next: function() {
          if (index < me2.length) {
            return {
              value: me2[index++],
              done: false
            };
          } else {
            return {
              done: true
            };
          }
        },
        return: function() {
          return {
            done: true
          };
        }
      };
    };
    function LiveNodeList(node, refresh) {
      this._node = node;
      this._refresh = refresh;
      _updateLiveList(this);
    }
    function _updateLiveList(list2) {
      var inc = list2._node._inc || list2._node.ownerDocument._inc;
      if (list2._inc !== inc) {
        var ls2 = list2._refresh(list2._node);
        __set__(list2, "length", ls2.length);
        if (!list2.$$length || ls2.length < list2.$$length) {
          for (var i2 = ls2.length; i2 in list2; i2++) {
            if (hasOwn(list2, i2)) {
              delete list2[i2];
            }
          }
        }
        copy(ls2, list2);
        list2._inc = inc;
      }
    }
    LiveNodeList.prototype.item = function(i2) {
      _updateLiveList(this);
      return this[i2] || null;
    };
    _extends(LiveNodeList, NodeList);
    function NamedNodeMap() {
      this._nsIndex = /* @__PURE__ */ Object.create(null);
      this._noNsIndex = /* @__PURE__ */ Object.create(null);
    }
    function _findNodeIndex(list2, node) {
      var i2 = 0;
      while (i2 < list2.length) {
        if (list2[i2] === node) {
          return i2;
        }
        i2++;
      }
    }
    function _nnmBucket(map, namespaceURI, create) {
      if (!namespaceURI) {
        return map._noNsIndex;
      }
      var bucket = map._nsIndex[namespaceURI];
      if (!bucket && create) {
        bucket = map._nsIndex[namespaceURI] = /* @__PURE__ */ Object.create(null);
      }
      return bucket;
    }
    function _nnmIndexFind(map, namespaceURI, localName) {
      var bucket = _nnmBucket(map, namespaceURI, false);
      var found = bucket && bucket[localName];
      return found ? found : null;
    }
    function _nnmIndexAdd(map, attr) {
      _nnmBucket(map, attr.namespaceURI, true)[attr.localName] = attr;
    }
    function _nnmIndexRemove(map, attr) {
      var bucket = _nnmBucket(map, attr.namespaceURI, false);
      if (bucket) {
        delete bucket[attr.localName];
      }
    }
    function _addNamedNode(el2, list2, newAttr, oldAttr) {
      if (oldAttr) {
        list2[_findNodeIndex(list2, oldAttr)] = newAttr;
      } else {
        list2[list2.length] = newAttr;
        list2.length++;
      }
      _nnmIndexAdd(list2, newAttr);
      if (el2) {
        newAttr.ownerElement = el2;
        var doc = el2.ownerDocument;
        if (doc) {
          oldAttr && _onRemoveAttribute(doc, el2, oldAttr);
          _onAddAttribute(doc, el2, newAttr);
        }
      }
    }
    function _removeNamedNode(el2, list2, attr) {
      var i2 = _findNodeIndex(list2, attr);
      if (i2 >= 0) {
        var lastIndex = list2.length - 1;
        while (i2 <= lastIndex) {
          list2[i2] = list2[++i2];
        }
        list2.length = lastIndex;
        _nnmIndexRemove(list2, attr);
        if (el2) {
          var doc = el2.ownerDocument;
          if (doc) {
            _onRemoveAttribute(doc, el2, attr);
          }
          attr.ownerElement = null;
        }
      }
    }
    NamedNodeMap.prototype = {
      length: 0,
      item: NodeList.prototype.item,
      /**
       * Get an attribute by name. Note: Name is in lower case in case of HTML namespace and
       * document.
       *
       * @param {string} localName
       * The local name of the attribute.
       * @returns {Attr | null}
       * The attribute with the given local name, or null if no such attribute exists.
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-get-by-name
       */
      getNamedItem: function(localName) {
        if (this._ownerElement && this._ownerElement._isInHTMLDocumentAndNamespace()) {
          localName = localName.toLowerCase();
        }
        var i2 = 0;
        while (i2 < this.length) {
          var attr = this[i2];
          if (attr.nodeName === localName) {
            return attr;
          }
          i2++;
        }
        return null;
      },
      /**
       * Set an attribute.
       *
       * @param {Attr} attr
       * The attribute to set.
       * @returns {Attr | null}
       * The old attribute with the same local name and namespace URI as the new one, or null if no
       * such attribute exists.
       * @throws {DOMException}
       * With code:
       * - {@link INUSE_ATTRIBUTE_ERR} - If the attribute is already an attribute of another
       * element.
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-set
       */
      setNamedItem: function(attr) {
        var el2 = attr.ownerElement;
        if (el2 && el2 !== this._ownerElement) {
          throw new DOMException2(DOMException2.INUSE_ATTRIBUTE_ERR);
        }
        var oldAttr = _nnmIndexFind(this, attr.namespaceURI, attr.localName);
        if (oldAttr === attr) {
          return attr;
        }
        _addNamedNode(this._ownerElement, this, attr, oldAttr);
        return oldAttr;
      },
      /**
       * Set an attribute, replacing an existing attribute with the same local name and namespace
       * URI if one exists.
       *
       * @param {Attr} attr
       * The attribute to set.
       * @returns {Attr | null}
       * The old attribute with the same local name and namespace URI as the new one, or null if no
       * such attribute exists.
       * @throws {DOMException}
       * Throws a DOMException with the name "InUseAttributeError" if the attribute is already an
       * attribute of another element.
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-set
       */
      setNamedItemNS: function(attr) {
        return this.setNamedItem(attr);
      },
      /**
       * Removes an attribute specified by the local name.
       *
       * @param {string} localName
       * The local name of the attribute to be removed.
       * @returns {Attr}
       * The attribute node that was removed.
       * @throws {DOMException}
       * With code:
       * - {@link DOMException.NOT_FOUND_ERR} if no attribute with the given name is found.
       * @see https://dom.spec.whatwg.org/#dom-namednodemap-removenameditem
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-remove-by-name
       */
      removeNamedItem: function(localName) {
        var attr = this.getNamedItem(localName);
        if (!attr) {
          throw new DOMException2(DOMException2.NOT_FOUND_ERR, localName);
        }
        _removeNamedNode(this._ownerElement, this, attr);
        return attr;
      },
      /**
       * Removes an attribute specified by the namespace and local name.
       *
       * @param {string | null} namespaceURI
       * The namespace URI of the attribute to be removed.
       * @param {string} localName
       * The local name of the attribute to be removed.
       * @returns {Attr}
       * The attribute node that was removed.
       * @throws {DOMException}
       * With code:
       * - {@link DOMException.NOT_FOUND_ERR} if no attribute with the given namespace URI and local
       * name is found.
       * @see https://dom.spec.whatwg.org/#dom-namednodemap-removenameditemns
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-remove-by-namespace
       */
      removeNamedItemNS: function(namespaceURI, localName) {
        var attr = this.getNamedItemNS(namespaceURI, localName);
        if (!attr) {
          throw new DOMException2(DOMException2.NOT_FOUND_ERR, namespaceURI ? namespaceURI + " : " + localName : localName);
        }
        _removeNamedNode(this._ownerElement, this, attr);
        return attr;
      },
      /**
       * Get an attribute by namespace and local name.
       *
       * @param {string | null} namespaceURI
       * The namespace URI of the attribute.
       * @param {string} localName
       * The local name of the attribute.
       * @returns {Attr | null}
       * The attribute with the given namespace URI and local name, or null if no such attribute
       * exists.
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-get-by-namespace
       */
      getNamedItemNS: function(namespaceURI, localName) {
        if (!namespaceURI) {
          namespaceURI = null;
        }
        var i2 = 0;
        while (i2 < this.length) {
          var node = this[i2];
          if (node.localName === localName && node.namespaceURI === namespaceURI) {
            return node;
          }
          i2++;
        }
        return null;
      }
    };
    NamedNodeMap.prototype[Symbol.iterator] = function() {
      var me2 = this;
      var index = 0;
      return {
        next: function() {
          if (index < me2.length) {
            return {
              value: me2[index++],
              done: false
            };
          } else {
            return {
              done: true
            };
          }
        },
        return: function() {
          return {
            done: true
          };
        }
      };
    };
    function DOMImplementation() {
    }
    DOMImplementation.prototype = {
      /**
       * Test if the DOM implementation implements a specific feature and version, as specified in
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/core.html#DOMFeatures DOM Features}.
       *
       * The DOMImplementation.hasFeature() method returns a Boolean flag indicating if a given
       * feature is supported. The different implementations fairly diverged in what kind of
       * features were reported. The latest version of the spec settled to force this method to
       * always return true, where the functionality was accurate and in use.
       *
       * @deprecated
       * It is deprecated and modern browsers return true in all cases.
       * @function DOMImplementation#hasFeature
       * @param {string} feature
       * The name of the feature to test.
       * @param {string} [version]
       * This is the version number of the feature to test.
       * @returns {boolean}
       * Always returns true.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/hasFeature MDN
       * @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-5CED94D7 DOM Level 1 Core
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-hasfeature DOM Living Standard
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-5CED94D7 DOM Level 3 Core
       */
      hasFeature: function(feature, version) {
        return true;
      },
      /**
       * Creates a DOM Document object of the specified type with its document element. Note that
       * based on the {@link DocumentType}
       * given to create the document, the implementation may instantiate specialized
       * {@link Document} objects that support additional features than the "Core", such as "HTML"
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#DOM2HTML DOM Level 2 HTML}.
       * On the other hand, setting the {@link DocumentType} after the document was created makes
       * this very unlikely to happen. Alternatively, specialized {@link Document} creation methods,
       * such as createHTMLDocument
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#DOM2HTML DOM Level 2 HTML},
       * can be used to obtain specific types of {@link Document} objects.
       *
       * __It behaves slightly different from the description in the living standard__:
       * - There is no interface/class `XMLDocument`, it returns a `Document`
       * instance (with it's `type` set to `'xml'`).
       * - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
       *
       * @function DOMImplementation.createDocument
       * @param {string | null} namespaceURI
       * The
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-namespaceURI namespace URI}
       * of the document element to create or null.
       * @param {string | null} qualifiedName
       * The
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-qualifiedname qualified name}
       * of the document element to be created or null.
       * @param {DocumentType | null} [doctype=null]
       * The type of document to be created or null. When doctype is not null, its
       * {@link Node#ownerDocument} attribute is set to the document being created. Default is
       * `null`
       * @returns {Document}
       * A new {@link Document} object with its document element. If the NamespaceURI,
       * qualifiedName, and doctype are null, the returned {@link Document} is empty with no
       * document element.
       * @throws {DOMException}
       * With code:
       *
       * - `INVALID_CHARACTER_ERR`: Raised if the specified qualified name is not an XML name
       * according to {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#XML XML 1.0}.
       * - `NAMESPACE_ERR`: Raised if the qualifiedName is malformed, if the qualifiedName has a
       * prefix and the namespaceURI is null, or if the qualifiedName is null and the namespaceURI
       * is different from null, or if the qualifiedName has a prefix that is "xml" and the
       * namespaceURI is different from "{@link http://www.w3.org/XML/1998/namespace}"
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#Namespaces XML Namespaces},
       * or if the DOM implementation does not support the "XML" feature but a non-null namespace
       * URI was provided, since namespaces were defined by XML.
       * - `WRONG_DOCUMENT_ERR`: Raised if doctype has already been used with a different document
       * or was created from a different implementation.
       * - `NOT_SUPPORTED_ERR`: May be raised if the implementation does not support the feature
       * "XML" and the language exposed through the Document does not support XML Namespaces (such
       * as {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#HTML40 HTML 4.01}).
       * @since DOM Level 2.
       * @see {@link #createHTMLDocument}
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocument MDN
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument DOM Living Standard
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Level-2-Core-DOM-createDocument DOM
       *      Level 3 Core
       * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocument DOM
       *      Level 2 Core (initial)
       */
      createDocument: function(namespaceURI, qualifiedName, doctype) {
        var contentType = MIME_TYPE.XML_APPLICATION;
        if (namespaceURI === NAMESPACE.HTML) {
          contentType = MIME_TYPE.XML_XHTML_APPLICATION;
        } else if (namespaceURI === NAMESPACE.SVG) {
          contentType = MIME_TYPE.XML_SVG_IMAGE;
        }
        var doc = new Document(PDC, { contentType });
        doc.implementation = this;
        doc.childNodes = new NodeList();
        doc.doctype = doctype || null;
        if (doctype) {
          doc.appendChild(doctype);
        }
        if (qualifiedName) {
          var root = doc.createElementNS(namespaceURI, qualifiedName);
          doc.appendChild(root);
        }
        return doc;
      },
      /**
       * Creates an empty DocumentType node. Entity declarations and notations are not made
       * available. Entity reference expansions and default attribute additions do not occur.
       *
       * **This behavior is slightly different from the one in the specs**:
       * - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
       * - `publicId` and `systemId` contain the raw data including any possible quotes,
       *   so they can always be serialized back to the original value
       * - `internalSubset` contains the raw string between `[` and `]` if present,
       *   but is not parsed or validated in any form.
       *
       * @function DOMImplementation#createDocumentType
       * @param {string} qualifiedName
       * The {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-qualifiedname qualified
       * name} of the document type to be created.
       * @param {string} [publicId]
       * The external subset public identifier. Stored verbatim including surrounding quotes.
       * When serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
       * if the value is non-empty and does not match the XML `PubidLiteral` production
       * (W3C DOM Parsing §3.2.1.3; XML 1.0 production [12]). Creation-time validation is not
       * enforced — deferred to a future breaking release.
       * @param {string} [systemId]
       * The external subset system identifier. Stored verbatim including surrounding quotes.
       * When serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
       * if the value is non-empty and does not match the XML `SystemLiteral` production
       * (W3C DOM Parsing §3.2.1.3; XML 1.0 production [11]). Creation-time validation is not
       * enforced — deferred to a future breaking release.
       * @param {string} [internalSubset]
       * The internal subset or an empty string if it is not present. Stored verbatim.
       * When serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
       * if the value contains `"]>"`. Creation-time validation is not enforced.
       * @returns {DocumentType}
       * A new {@link DocumentType} node with {@link Node#ownerDocument} set to null.
       * @throws {DOMException}
       * With code:
       *
       * - `INVALID_CHARACTER_ERR`: Raised if the specified qualified name is not an XML name
       * according to {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#XML XML 1.0}.
       * - `NAMESPACE_ERR`: Raised if the qualifiedName is malformed.
       * - `NOT_SUPPORTED_ERR`: May be raised if the implementation does not support the feature
       * "XML" and the language exposed through the Document does not support XML Namespaces (such
       * as {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#HTML40 HTML 4.01}).
       * @since DOM Level 2.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocumentType
       *      MDN
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocumenttype DOM Living
       *      Standard
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Level-3-Core-DOM-createDocType DOM
       *      Level 3 Core
       * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocType DOM
       *      Level 2 Core
       * @see https://github.com/xmldom/xmldom/blob/master/CHANGELOG.md#050
       * @see https://www.w3.org/TR/DOM-Level-2-Core/#core-ID-Core-DocType-internalSubset
       * @prettierignore
       */
      createDocumentType: function(qualifiedName, publicId, systemId, internalSubset) {
        validateQualifiedName(qualifiedName);
        var node = new DocumentType(PDC);
        node.name = qualifiedName;
        node.nodeName = qualifiedName;
        node.publicId = publicId || "";
        node.systemId = systemId || "";
        node.internalSubset = internalSubset || "";
        node.childNodes = new NodeList();
        return node;
      },
      /**
       * Returns an HTML document, that might already have a basic DOM structure.
       *
       * __It behaves slightly different from the description in the living standard__:
       * - If the first argument is `false` no initial nodes are added (steps 3-7 in the specs are
       * omitted)
       * - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
       *
       * @param {string | false} [title]
       * A string containing the title to give the new HTML document.
       * @returns {Document}
       * The HTML document.
       * @since WHATWG Living Standard.
       * @see {@link #createDocument}
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createhtmldocument
       * @see https://dom.spec.whatwg.org/#html-document
       */
      createHTMLDocument: function(title) {
        var doc = new Document(PDC, { contentType: MIME_TYPE.HTML });
        doc.implementation = this;
        doc.childNodes = new NodeList();
        if (title !== false) {
          doc.doctype = this.createDocumentType("html");
          doc.doctype.ownerDocument = doc;
          doc.appendChild(doc.doctype);
          var htmlNode = doc.createElement("html");
          doc.appendChild(htmlNode);
          var headNode = doc.createElement("head");
          htmlNode.appendChild(headNode);
          if (typeof title === "string") {
            var titleNode = doc.createElement("title");
            titleNode.appendChild(doc.createTextNode(title));
            headNode.appendChild(titleNode);
          }
          htmlNode.appendChild(doc.createElement("body"));
        }
        return doc;
      }
    };
    function Node(symbol) {
      checkSymbol(symbol);
    }
    Node.prototype = {
      /**
       * The first child of this node.
       *
       * @type {Node | null}
       */
      firstChild: null,
      /**
       * The last child of this node.
       *
       * @type {Node | null}
       */
      lastChild: null,
      /**
       * The previous sibling of this node.
       *
       * @type {Node | null}
       */
      previousSibling: null,
      /**
       * The next sibling of this node.
       *
       * @type {Node | null}
       */
      nextSibling: null,
      /**
       * The parent node of this node.
       *
       * @type {Node | null}
       */
      parentNode: null,
      /**
       * The parent element of this node.
       *
       * @type {Element | null}
       */
      get parentElement() {
        return this.parentNode && this.parentNode.nodeType === this.ELEMENT_NODE ? this.parentNode : null;
      },
      /**
       * The child nodes of this node.
       *
       * @type {NodeList}
       */
      childNodes: null,
      /**
       * The document object associated with this node.
       *
       * @type {Document | null}
       */
      ownerDocument: null,
      /**
       * The value of this node.
       *
       * @type {string | null}
       */
      nodeValue: null,
      /**
       * The namespace URI of this node.
       *
       * @type {string | null}
       */
      namespaceURI: null,
      /**
       * The prefix of the namespace for this node.
       *
       * @type {string | null}
       */
      prefix: null,
      /**
       * The local part of the qualified name of this node.
       *
       * @type {string | null}
       */
      localName: null,
      /**
       * The baseURI is currently always `about:blank`,
       * since that's what happens when you create a document from scratch.
       *
       * @type {'about:blank'}
       */
      baseURI: "about:blank",
      /**
       * Is true if this node is part of a document.
       *
       * @type {boolean}
       */
      get isConnected() {
        var rootNode = this.getRootNode();
        return rootNode && rootNode.nodeType === rootNode.DOCUMENT_NODE;
      },
      /**
       * Checks whether `other` is an inclusive descendant of this node.
       *
       * @param {Node | null | undefined} other
       * The node to check.
       * @returns {boolean}
       * True if `other` is an inclusive descendant of this node; false otherwise.
       * @see https://dom.spec.whatwg.org/#dom-node-contains
       */
      contains: function(other) {
        if (!other) return false;
        var parent = other;
        do {
          if (this === parent) return true;
          parent = parent.parentNode;
        } while (parent);
        return false;
      },
      /**
       * @typedef GetRootNodeOptions
       * @property {boolean} [composed=false]
       */
      /**
       * Searches for the root node of this node.
       *
       * **This behavior is slightly different from the in the specs**:
       * - ignores `options.composed`, since `ShadowRoot`s are unsupported, always returns root.
       *
       * @param {GetRootNodeOptions} [options]
       * @returns {Node}
       * Root node.
       * @see https://dom.spec.whatwg.org/#dom-node-getrootnode
       * @see https://dom.spec.whatwg.org/#concept-shadow-including-root
       */
      getRootNode: function(options) {
        var parent = this;
        do {
          if (!parent.parentNode) {
            return parent;
          }
          parent = parent.parentNode;
        } while (parent);
      },
      /**
       * Checks whether the given node is equal to this node.
       *
       * Two nodes are equal when they have the same type, defining characteristics (for the type),
       * and the same childNodes. The comparison is iterative to avoid stack overflows on
       * deeply-nested trees. Attribute nodes of each Element pair are also pushed onto the stack
       * and compared the same way.
       *
       * @param {Node} [otherNode]
       * @returns {boolean}
       * @see https://dom.spec.whatwg.org/#concept-node-equals
       * @see ../docs/walk-dom.md.
       */
      isEqualNode: function(otherNode) {
        if (!otherNode) return false;
        var stack = [{ node: this, other: otherNode }];
        while (stack.length > 0) {
          var pair = stack.pop();
          var node = pair.node;
          var other = pair.other;
          if (node.nodeType !== other.nodeType) return false;
          switch (node.nodeType) {
            case node.DOCUMENT_TYPE_NODE:
              if (node.name !== other.name) return false;
              if (node.publicId !== other.publicId) return false;
              if (node.systemId !== other.systemId) return false;
              break;
            case node.ELEMENT_NODE:
              if (node.namespaceURI !== other.namespaceURI) return false;
              if (node.prefix !== other.prefix) return false;
              if (node.localName !== other.localName) return false;
              if (node.attributes.length !== other.attributes.length) return false;
              for (var i2 = 0; i2 < node.attributes.length; i2++) {
                var attr = node.attributes.item(i2);
                var otherAttr = other.getAttributeNodeNS(attr.namespaceURI, attr.localName);
                if (!otherAttr) return false;
                stack.push({ node: attr, other: otherAttr });
              }
              break;
            case node.ATTRIBUTE_NODE:
              if (node.namespaceURI !== other.namespaceURI) return false;
              if (node.localName !== other.localName) return false;
              if (node.value !== other.value) return false;
              break;
            case node.PROCESSING_INSTRUCTION_NODE:
              if (node.target !== other.target || node.data !== other.data) return false;
              break;
            case node.TEXT_NODE:
            case node.CDATA_SECTION_NODE:
            case node.COMMENT_NODE:
              if (node.data !== other.data) return false;
              break;
          }
          if (node.childNodes.length !== other.childNodes.length) return false;
          for (var i2 = node.childNodes.length - 1; i2 >= 0; i2--) {
            stack.push({ node: node.childNodes[i2], other: other.childNodes[i2] });
          }
        }
        return true;
      },
      /**
       * Checks whether or not the given node is this node.
       *
       * @param {Node} [otherNode]
       */
      isSameNode: function(otherNode) {
        return this === otherNode;
      },
      /**
       * Inserts a node before a reference node as a child of this node.
       *
       * @param {Node} newChild
       * The new child node to be inserted.
       * @param {Node | null} refChild
       * The reference node before which newChild will be inserted.
       * @returns {Node}
       * The new child node successfully inserted.
       * @throws {DOMException}
       * Throws a DOMException if inserting the node would result in a DOM tree that is not
       * well-formed, or if `child` is provided but is not a child of `parent`.
       * See {@link _insertBefore} for more details.
       * @since Modified in DOM L2
       */
      insertBefore: function(newChild, refChild) {
        return _insertBefore(this, newChild, refChild);
      },
      /**
       * Replaces an old child node with a new child node within this node.
       *
       * @param {Node} newChild
       * The new node that is to replace the old node.
       * If it already exists in the DOM, it is removed from its original position.
       * @param {Node} oldChild
       * The existing child node to be replaced.
       * @returns {Node}
       * Returns the replaced child node.
       * @throws {DOMException}
       * Throws a DOMException if replacing the node would result in a DOM tree that is not
       * well-formed, or if `oldChild` is not a child of `this`.
       * This can also occur if the pre-replacement validity assertion fails.
       * See {@link _insertBefore}, {@link Node.removeChild}, and
       * {@link assertPreReplacementValidityInDocument} for more details.
       * @see https://dom.spec.whatwg.org/#concept-node-replace
       */
      replaceChild: function(newChild, oldChild) {
        _insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
        if (oldChild) {
          this.removeChild(oldChild);
        }
      },
      /**
       * Removes an existing child node from this node.
       *
       * @param {Node} oldChild
       * The child node to be removed.
       * @returns {Node}
       * Returns the removed child node.
       * @throws {DOMException}
       * Throws a DOMException if `oldChild` is not a child of `this`.
       * See {@link _removeChild} for more details.
       */
      removeChild: function(oldChild) {
        return _removeChild(this, oldChild);
      },
      /**
       * Appends a child node to this node.
       *
       * @param {Node} newChild
       * The child node to be appended to this node.
       * If it already exists in the DOM, it is removed from its original position.
       * @returns {Node}
       * Returns the appended child node.
       * @throws {DOMException}
       * Throws a DOMException if appending the node would result in a DOM tree that is not
       * well-formed, or if `newChild` is not a valid Node.
       * See {@link insertBefore} for more details.
       */
      appendChild: function(newChild) {
        return this.insertBefore(newChild, null);
      },
      /**
       * Determines whether this node has any child nodes.
       *
       * @returns {boolean}
       * Returns true if this node has any child nodes, and false otherwise.
       */
      hasChildNodes: function() {
        return this.firstChild != null;
      },
      /**
       * Creates a copy of the calling node.
       *
       * @param {boolean} deep
       * If true, the contents of the node are recursively copied.
       * If false, only the node itself (and its attributes, if it is an element) are copied.
       * @returns {Node}
       * Returns the newly created copy of the node.
       * @throws {DOMException}
       * May throw a DOMException if operations within {@link Element#setAttributeNode} or
       * {@link Node#appendChild} (which are potentially invoked in this method) do not meet their
       * specific constraints.
       * @see {@link cloneNode}
       */
      cloneNode: function(deep) {
        return cloneNode(this.ownerDocument || this, this, deep);
      },
      /**
       * Puts the specified node and all of its subtree into a "normalized" form. In a normalized
       * subtree, no text nodes in the subtree are empty and there are no adjacent text nodes.
       *
       * Specifically, this method merges any adjacent text nodes (i.e., nodes for which `nodeType`
       * is `TEXT_NODE`) into a single node with the combined data. It also removes any empty text
       * nodes.
       *
       * This method iterativly traverses all child nodes to normalize all descendent nodes within
       * the subtree.
       *
       * @throws {DOMException}
       * May throw a DOMException if operations within removeChild or appendData (which are
       * potentially invoked in this method) do not meet their specific constraints.
       * @since Modified in DOM Level 2
       * @see {@link Node.removeChild}
       * @see {@link CharacterData.appendData}
       * @see ../docs/walk-dom.md.
       */
      normalize: function() {
        walkDOM(this, null, {
          enter: function(node) {
            var child = node.firstChild;
            while (child) {
              var next = child.nextSibling;
              if (next !== null && next.nodeType === TEXT_NODE && child.nodeType === TEXT_NODE) {
                var tail = [];
                var sibling = next;
                while (sibling !== null && sibling.nodeType === TEXT_NODE) {
                  tail.push(sibling.data);
                  sibling = sibling.nextSibling;
                }
                var removed = child.nextSibling;
                while (removed !== sibling) {
                  var following = removed.nextSibling;
                  removed.parentNode = null;
                  removed.previousSibling = null;
                  removed.nextSibling = null;
                  removed = following;
                }
                child.nextSibling = sibling;
                if (sibling !== null) {
                  sibling.previousSibling = child;
                } else {
                  node.lastChild = child;
                }
                child.appendData(tail.join(""));
                _onUpdateChild(node.ownerDocument, node);
                child = sibling;
              } else {
                child = next;
              }
            }
            return true;
          }
        });
      },
      /**
       * Checks whether the DOM implementation implements a specific feature and its version.
       *
       * @deprecated
       * Since `DOMImplementation.hasFeature` is deprecated and always returns true.
       * @param {string} feature
       * The package name of the feature to test. This is the same name that can be passed to the
       * method `hasFeature` on `DOMImplementation`.
       * @param {string} version
       * This is the version number of the package name to test.
       * @returns {boolean}
       * Returns true in all cases in the current implementation.
       * @since Introduced in DOM Level 2
       * @see {@link DOMImplementation.hasFeature}
       */
      isSupported: function(feature, version) {
        return this.ownerDocument.implementation.hasFeature(feature, version);
      },
      /**
       * Look up the prefix associated to the given namespace URI, starting from this node.
       * **The default namespace declarations are ignored by this method.**
       * See Namespace Prefix Lookup for details on the algorithm used by this method.
       *
       * **This behavior is different from the in the specs**:
       * - no node type specific handling
       * - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
       *
       * @param {string | null} namespaceURI
       * The namespace URI for which to find the associated prefix.
       * @returns {string | null}
       * The associated prefix, if found; otherwise, null.
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespacePrefix
       * @see https://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespacePrefixAlgo
       * @see https://dom.spec.whatwg.org/#dom-node-lookupprefix
       * @see https://github.com/xmldom/xmldom/issues/322
       * @prettierignore
       */
      lookupPrefix: function(namespaceURI) {
        var el2 = this;
        while (el2) {
          var map = el2._nsMap;
          if (map) {
            for (var n2 in map) {
              if (hasOwn(map, n2) && map[n2] === namespaceURI) {
                return n2;
              }
            }
          }
          el2 = el2.nodeType == ATTRIBUTE_NODE ? el2.ownerDocument : el2.parentNode;
        }
        return null;
      },
      /**
       * This function is used to look up the namespace URI associated with the given prefix,
       * starting from this node.
       *
       * **This behavior is different from the in the specs**:
       * - no node type specific handling
       * - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
       *
       * @param {string | null} prefix
       * The prefix for which to find the associated namespace URI.
       * @returns {string | null}
       * The associated namespace URI, if found; otherwise, null.
       * @since DOM Level 3
       * @see https://dom.spec.whatwg.org/#dom-node-lookupnamespaceuri
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespaceURI
       * @prettierignore
       */
      lookupNamespaceURI: function(prefix) {
        var el2 = this;
        while (el2) {
          var map = el2._nsMap;
          if (map) {
            if (hasOwn(map, prefix)) {
              return map[prefix];
            }
          }
          el2 = el2.nodeType == ATTRIBUTE_NODE ? el2.ownerDocument : el2.parentNode;
        }
        return null;
      },
      /**
       * Determines whether the given namespace URI is the default namespace.
       *
       * The function works by looking up the prefix associated with the given namespace URI. If no
       * prefix is found (i.e., the namespace URI is not registered in the namespace map of this
       * node or any of its ancestors), it returns `true`, implying the namespace URI is considered
       * the default.
       *
       * **This behavior is different from the in the specs**:
       * - no node type specific handling
       * - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
       *
       * @param {string | null} namespaceURI
       * The namespace URI to be checked.
       * @returns {boolean}
       * Returns true if the given namespace URI is the default namespace, false otherwise.
       * @since DOM Level 3
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-isDefaultNamespace
       * @see https://dom.spec.whatwg.org/#dom-node-isdefaultnamespace
       * @prettierignore
       */
      isDefaultNamespace: function(namespaceURI) {
        var prefix = this.lookupPrefix(namespaceURI);
        return prefix == null;
      },
      /**
       * Compares the reference node with a node with regard to their position in the document and
       * according to the document order.
       *
       * @param {Node} other
       * The node to compare the reference node to.
       * @returns {number}
       * Returns how the node is positioned relatively to the reference node according to the
       * bitmask. 0 if reference node and given node are the same.
       * @since DOM Level 3
       * @see https://www.w3.org/TR/2004/REC-DOM-Level-3-Core-20040407/core.html#Node3-compare
       * @see https://dom.spec.whatwg.org/#dom-node-comparedocumentposition
       */
      compareDocumentPosition: function(other) {
        if (this === other) return 0;
        var node1 = other;
        var node2 = this;
        var attr1 = null;
        var attr2 = null;
        if (node1 instanceof Attr) {
          attr1 = node1;
          node1 = attr1.ownerElement;
        }
        if (node2 instanceof Attr) {
          attr2 = node2;
          node2 = attr2.ownerElement;
          if (attr1 && node1 && node2 === node1) {
            for (var i2 = 0, attr; attr = node2.attributes[i2]; i2++) {
              if (attr === attr1)
                return DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
              if (attr === attr2)
                return DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
            }
          }
        }
        if (!node1 || !node2 || node2.ownerDocument !== node1.ownerDocument) {
          return DocumentPosition.DOCUMENT_POSITION_DISCONNECTED + DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + (docGUID(node2.ownerDocument) > docGUID(node1.ownerDocument) ? DocumentPosition.DOCUMENT_POSITION_FOLLOWING : DocumentPosition.DOCUMENT_POSITION_PRECEDING);
        }
        if (attr2 && node1 === node2) {
          return DocumentPosition.DOCUMENT_POSITION_CONTAINS + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
        }
        if (attr1 && node1 === node2) {
          return DocumentPosition.DOCUMENT_POSITION_CONTAINED_BY + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
        }
        var chain1 = [];
        var ancestor1 = node1.parentNode;
        while (ancestor1) {
          if (!attr2 && ancestor1 === node2) {
            return DocumentPosition.DOCUMENT_POSITION_CONTAINED_BY + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
          }
          chain1.push(ancestor1);
          ancestor1 = ancestor1.parentNode;
        }
        chain1.reverse();
        var chain2 = [];
        var ancestor2 = node2.parentNode;
        while (ancestor2) {
          if (!attr1 && ancestor2 === node1) {
            return DocumentPosition.DOCUMENT_POSITION_CONTAINS + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
          }
          chain2.push(ancestor2);
          ancestor2 = ancestor2.parentNode;
        }
        chain2.reverse();
        var ca2 = commonAncestor(chain1, chain2);
        for (var n2 in ca2.childNodes) {
          var child = ca2.childNodes[n2];
          if (child === node2) return DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
          if (child === node1) return DocumentPosition.DOCUMENT_POSITION_PRECEDING;
          if (chain2.indexOf(child) >= 0) return DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
          if (chain1.indexOf(child) >= 0) return DocumentPosition.DOCUMENT_POSITION_PRECEDING;
        }
        return 0;
      }
    };
    function _xmlEncoder(c2) {
      return c2 == "<" && "&lt;" || c2 == ">" && "&gt;" || c2 == "&" && "&amp;" || c2 == '"' && "&quot;" || "&#" + c2.charCodeAt() + ";";
    }
    copy(NodeType, Node);
    copy(NodeType, Node.prototype);
    copy(DocumentPosition, Node);
    copy(DocumentPosition, Node.prototype);
    function _visitNode(node, callback) {
      walkDOM(node, null, {
        enter: function(n2) {
          return callback(n2) ? walkDOM.STOP : true;
        }
      });
    }
    function walkDOM(node, context, callbacks) {
      var stack = [{ node, context, phase: walkDOM.ENTER }];
      while (stack.length > 0) {
        var frame = stack.pop();
        if (frame.phase === walkDOM.ENTER) {
          var childContext = callbacks.enter(frame.node, frame.context);
          if (childContext === walkDOM.STOP) {
            return walkDOM.STOP;
          }
          stack.push({ node: frame.node, context: childContext, phase: walkDOM.EXIT });
          if (childContext === null || childContext === void 0) {
            continue;
          }
          var child = frame.node.lastChild;
          while (child) {
            stack.push({ node: child, context: childContext, phase: walkDOM.ENTER });
            child = child.previousSibling;
          }
        } else {
          if (callbacks.exit) {
            callbacks.exit(frame.node, frame.context);
          }
        }
      }
    }
    walkDOM.STOP = /* @__PURE__ */ Symbol("walkDOM.STOP");
    walkDOM.ENTER = 0;
    walkDOM.EXIT = 1;
    function Document(symbol, options) {
      checkSymbol(symbol);
      var opt = options || {};
      this.ownerDocument = this;
      this.contentType = opt.contentType || MIME_TYPE.XML_APPLICATION;
      this.type = isHTMLMimeType(this.contentType) ? "html" : "xml";
    }
    function _onAddAttribute(doc, el2, newAttr) {
      doc && doc._inc++;
      var ns2 = newAttr.namespaceURI;
      if (ns2 === NAMESPACE.XMLNS) {
        el2._nsMap[newAttr.prefix ? newAttr.localName : ""] = newAttr.value;
      }
    }
    function _onRemoveAttribute(doc, el2, newAttr, remove) {
      doc && doc._inc++;
      var ns2 = newAttr.namespaceURI;
      if (ns2 === NAMESPACE.XMLNS) {
        delete el2._nsMap[newAttr.prefix ? newAttr.localName : ""];
      }
    }
    function _onUpdateChild(doc, parent, newChild) {
      if (doc && doc._inc) {
        doc._inc++;
        var childNodes = parent.childNodes;
        if (newChild && !newChild.nextSibling) {
          childNodes[childNodes.length++] = newChild;
        } else {
          var child = parent.firstChild;
          var i2 = 0;
          while (child) {
            childNodes[i2++] = child;
            child = child.nextSibling;
          }
          childNodes.length = i2;
          delete childNodes[childNodes.length];
        }
      }
    }
    function _removeChild(parentNode, child) {
      if (parentNode !== child.parentNode) {
        throw new DOMException2(DOMException2.NOT_FOUND_ERR, "child's parent is not parent");
      }
      var oldPreviousSibling = child.previousSibling;
      var oldNextSibling = child.nextSibling;
      if (oldPreviousSibling) {
        oldPreviousSibling.nextSibling = oldNextSibling;
      } else {
        parentNode.firstChild = oldNextSibling;
      }
      if (oldNextSibling) {
        oldNextSibling.previousSibling = oldPreviousSibling;
      } else {
        parentNode.lastChild = oldPreviousSibling;
      }
      _onUpdateChild(parentNode.ownerDocument, parentNode);
      child.parentNode = null;
      child.previousSibling = null;
      child.nextSibling = null;
      return child;
    }
    function hasValidParentNodeType(node) {
      return node && (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE);
    }
    function hasInsertableNodeType(node) {
      return node && (node.nodeType === Node.CDATA_SECTION_NODE || node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.DOCUMENT_TYPE_NODE || node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.PROCESSING_INSTRUCTION_NODE || node.nodeType === Node.TEXT_NODE);
    }
    function isDocTypeNode(node) {
      return node && node.nodeType === Node.DOCUMENT_TYPE_NODE;
    }
    function isElementNode(node) {
      return node && node.nodeType === Node.ELEMENT_NODE;
    }
    function isTextNode(node) {
      return node && node.nodeType === Node.TEXT_NODE;
    }
    function isElementInsertionPossible(doc, child) {
      var parentChildNodes = doc.childNodes || [];
      if (find(parentChildNodes, isElementNode) || isDocTypeNode(child)) {
        return false;
      }
      var docTypeNode = find(parentChildNodes, isDocTypeNode);
      return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
    }
    function isElementReplacementPossible(doc, child) {
      var parentChildNodes = doc.childNodes || [];
      function hasElementChildThatIsNotChild(node) {
        return isElementNode(node) && node !== child;
      }
      if (find(parentChildNodes, hasElementChildThatIsNotChild)) {
        return false;
      }
      var docTypeNode = find(parentChildNodes, isDocTypeNode);
      return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
    }
    function assertPreInsertionValidity1to5(parent, node, child) {
      if (!hasValidParentNodeType(parent)) {
        throw new DOMException2(DOMException2.HIERARCHY_REQUEST_ERR, "Unexpected parent node type " + parent.nodeType);
      }
      if (child && child.parentNode !== parent) {
        throw new DOMException2(DOMException2.NOT_FOUND_ERR, "child not in parent");
      }
      if (
        // 4. If `node` is not a DocumentFragment, DocumentType, Element, or CharacterData node, then throw a "HierarchyRequestError" DOMException.
        !hasInsertableNodeType(node) || // 5. If either `node` is a Text node and `parent` is a document,
        // the sax parser currently adds top level text nodes, this will be fixed in 0.9.0
        // || (node.nodeType === Node.TEXT_NODE && parent.nodeType === Node.DOCUMENT_NODE)
        // or `node` is a doctype and `parent` is not a document, then throw a "HierarchyRequestError" DOMException.
        isDocTypeNode(node) && parent.nodeType !== Node.DOCUMENT_NODE
      ) {
        throw new DOMException2(
          DOMException2.HIERARCHY_REQUEST_ERR,
          "Unexpected node type " + node.nodeType + " for parent node type " + parent.nodeType
        );
      }
    }
    function assertPreInsertionValidityInDocument(parent, node, child) {
      var parentChildNodes = parent.childNodes || [];
      var nodeChildNodes = node.childNodes || [];
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        var nodeChildElements = nodeChildNodes.filter(isElementNode);
        if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) {
          throw new DOMException2(DOMException2.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
        }
        if (nodeChildElements.length === 1 && !isElementInsertionPossible(parent, child)) {
          throw new DOMException2(DOMException2.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
        }
      }
      if (isElementNode(node)) {
        if (!isElementInsertionPossible(parent, child)) {
          throw new DOMException2(DOMException2.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
        }
      }
      if (isDocTypeNode(node)) {
        if (find(parentChildNodes, isDocTypeNode)) {
          throw new DOMException2(DOMException2.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
        }
        var parentElementChild = find(parentChildNodes, isElementNode);
        if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) {
          throw new DOMException2(DOMException2.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
        }
        if (!child && parentElementChild) {
          throw new DOMException2(DOMException2.HIERARCHY_REQUEST_ERR, "Doctype can not be appended since element is present");
        }
      }
    }
    function assertPreReplacementValidityInDocument(parent, node, child) {
      var parentChildNodes = parent.childNodes || [];
      var nodeChildNodes = node.childNodes || [];
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        var nodeChildElements = nodeChildNodes.filter(isElementNode);
        if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) {
          throw new DOMException2(DOMException2.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
        }
        if (nodeChildElements.length === 1 && !isElementReplacementPossible(parent, child)) {
          throw new DOMException2(DOMException2.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
        }
      }
      if (isElementNode(node)) {
        if (!isElementReplacementPossible(parent, child)) {
          throw new DOMException2(DOMException2.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
        }
      }
      if (isDocTypeNode(node)) {
        let hasDoctypeChildThatIsNotChild = function(node2) {
          return isDocTypeNode(node2) && node2 !== child;
        };
        if (find(parentChildNodes, hasDoctypeChildThatIsNotChild)) {
          throw new DOMException2(DOMException2.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
        }
        var parentElementChild = find(parentChildNodes, isElementNode);
        if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) {
          throw new DOMException2(DOMException2.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
        }
      }
    }
    function _insertBefore(parent, node, child, _inDocumentAssertion) {
      assertPreInsertionValidity1to5(parent, node, child);
      if (parent.nodeType === Node.DOCUMENT_NODE) {
        (_inDocumentAssertion || assertPreInsertionValidityInDocument)(parent, node, child);
      }
      var cp = node.parentNode;
      if (cp) {
        cp.removeChild(node);
      }
      if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
        var newFirst = node.firstChild;
        if (newFirst == null) {
          return node;
        }
        var newLast = node.lastChild;
      } else {
        newFirst = newLast = node;
      }
      var pre = child ? child.previousSibling : parent.lastChild;
      newFirst.previousSibling = pre;
      newLast.nextSibling = child;
      if (pre) {
        pre.nextSibling = newFirst;
      } else {
        parent.firstChild = newFirst;
      }
      if (child == null) {
        parent.lastChild = newLast;
      } else {
        child.previousSibling = newLast;
      }
      do {
        newFirst.parentNode = parent;
      } while (newFirst !== newLast && (newFirst = newFirst.nextSibling));
      _onUpdateChild(parent.ownerDocument || parent, parent, node);
      if (node.nodeType == DOCUMENT_FRAGMENT_NODE) {
        node.firstChild = node.lastChild = null;
      }
      return node;
    }
    Document.prototype = {
      /**
       * The implementation that created this document.
       *
       * @type DOMImplementation
       * @readonly
       */
      implementation: null,
      nodeName: "#document",
      nodeType: DOCUMENT_NODE,
      /**
       * The DocumentType node of the document.
       *
       * @type DocumentType
       * @readonly
       */
      doctype: null,
      documentElement: null,
      _inc: 1,
      insertBefore: function(newChild, refChild) {
        if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
          var child = newChild.firstChild;
          while (child) {
            var next = child.nextSibling;
            this.insertBefore(child, refChild);
            child = next;
          }
          return newChild;
        }
        _insertBefore(this, newChild, refChild);
        newChild.ownerDocument = this;
        if (this.documentElement === null && newChild.nodeType === ELEMENT_NODE) {
          this.documentElement = newChild;
        }
        return newChild;
      },
      removeChild: function(oldChild) {
        var removed = _removeChild(this, oldChild);
        if (removed === this.documentElement) {
          this.documentElement = null;
        }
        return removed;
      },
      replaceChild: function(newChild, oldChild) {
        _insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
        newChild.ownerDocument = this;
        if (oldChild) {
          this.removeChild(oldChild);
        }
        if (isElementNode(newChild)) {
          this.documentElement = newChild;
        }
      },
      /**
       * Imports a node from another document into this document, creating a new copy owned by this
       * document. The source node and its subtree are not modified.
       *
       * @param {Node} importedNode
       * The node to import.
       * @param {boolean} deep
       * If true, the contents of the node are recursively imported.
       * If false, only the node itself (and its attributes, if it is an element) are imported.
       * @returns {Node}
       * Returns the newly created import of the node.
       * @see {@link importNode}
       * @see {@link https://dom.spec.whatwg.org/#dom-document-importnode}
       */
      importNode: function(importedNode, deep) {
        return importNode(this, importedNode, deep);
      },
      // Introduced in DOM Level 2:
      getElementById: function(id3) {
        var rtv = null;
        _visitNode(this.documentElement, function(node) {
          if (node.nodeType == ELEMENT_NODE) {
            if (node.getAttribute("id") == id3) {
              rtv = node;
              return true;
            }
          }
        });
        return rtv;
      },
      /**
       * Creates a new `Element` that is owned by this `Document`.
       * In HTML Documents `localName` is the lower cased `tagName`,
       * otherwise no transformation is being applied.
       * When `contentType` implies the HTML namespace, it will be set as `namespaceURI`.
       *
       * __This implementation differs from the specification:__ - The provided name is not checked
       * against the `Name` production,
       * so no related error will be thrown.
       * - There is no interface `HTMLElement`, it is always an `Element`.
       * - There is no support for a second argument to indicate using custom elements.
       *
       * @param {string} tagName
       * @returns {Element}
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
       * @see https://dom.spec.whatwg.org/#dom-document-createelement
       * @see https://dom.spec.whatwg.org/#concept-create-element
       */
      createElement: function(tagName) {
        var node = new Element(PDC);
        node.ownerDocument = this;
        if (this.type === "html") {
          tagName = tagName.toLowerCase();
        }
        if (hasDefaultHTMLNamespace(this.contentType)) {
          node.namespaceURI = NAMESPACE.HTML;
        }
        node.nodeName = tagName;
        node.tagName = tagName;
        node.localName = tagName;
        node.childNodes = new NodeList();
        var attrs = node.attributes = new NamedNodeMap();
        attrs._ownerElement = node;
        return node;
      },
      /**
       * @returns {DocumentFragment}
       */
      createDocumentFragment: function() {
        var node = new DocumentFragment(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        return node;
      },
      /**
       * @param {string} data
       * @returns {Text}
       */
      createTextNode: function(data) {
        var node = new Text(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.appendData(data);
        return node;
      },
      /**
       * @param {string} data
       * @returns {Comment}
       * @see https://dom.spec.whatwg.org/#dom-document-createcomment
       * @see https://www.w3.org/TR/xml/#NT-Comment XML 1.0 production [15]
       * @see https://www.w3.org/TR/DOM-Parsing/#dfn-concept-serialize-xml §3.2.1.3
       *
       *      Note: no validation is performed at creation time. When the resulting document is
       *      serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
       *      if the comment data contains `--` anywhere, ends with `-`, or contains characters
       *      outside the XML Char production (W3C DOM Parsing §3.2.1.3). Without that option the
       *      data is emitted verbatim.
       */
      createComment: function(data) {
        var node = new Comment(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.appendData(data);
        return node;
      },
      /**
       * Returns a new CDATASection node whose data is `data`.
       *
       * __This implementation differs from the specification:__ - calling this method on an HTML
       * document does not throw `NotSupportedError`.
       *
       * @param {string} data
       * @returns {CDATASection}
       * @throws {DOMException}
       * With code `INVALID_CHARACTER_ERR` if `data` contains `"]]>"`.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createCDATASection
       * @see https://dom.spec.whatwg.org/#dom-document-createcdatasection
       */
      createCDATASection: function(data) {
        if (data.indexOf("]]>") !== -1) {
          throw new DOMException2(DOMException2.INVALID_CHARACTER_ERR, 'data contains "]]>"');
        }
        var node = new CDATASection(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.appendData(data);
        return node;
      },
      /**
       * Returns a ProcessingInstruction node whose target is target and data is data.
       *
       * __This behavior is slightly different from the in the specs__:
       * - it does not do any input validation on the arguments and doesn't throw
       * "InvalidCharacterError".
       *
       * Note: When the resulting document is serialized with `requireWellFormed: true`, the
       * serializer throws `InvalidStateError` if `.target` is not a valid XML `NCName` (a `Name`
       * with no colon) or is an ASCII case-insensitive match for `"xml"`, or if `.data` contains
       * `?>` or characters outside the XML Char production (W3C DOM Parsing §3.2.1.7). Without that
       * option the target and data are emitted verbatim.
       *
       * @param {string} target
       * @param {string} data
       * @returns {ProcessingInstruction}
       * @see https://developer.mozilla.org/docs/Web/API/Document/createProcessingInstruction
       * @see https://dom.spec.whatwg.org/#dom-document-createprocessinginstruction
       * @see https://www.w3.org/TR/DOM-Parsing/#dfn-concept-serialize-xml §3.2.1.7
       */
      createProcessingInstruction: function(target, data) {
        var node = new ProcessingInstruction(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.nodeName = node.target = target;
        node.nodeValue = node.data = data;
        return node;
      },
      /**
       * Creates an `Attr` node that is owned by this document.
       * In HTML Documents `localName` is the lower cased `name`,
       * otherwise no transformation is being applied.
       *
       * __This implementation differs from the specification:__ - The provided name is not checked
       * against the `Name` production,
       * so no related error will be thrown.
       *
       * @param {string} name
       * @returns {Attr}
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createAttribute
       * @see https://dom.spec.whatwg.org/#dom-document-createattribute
       */
      createAttribute: function(name) {
        if (!g2.QName_exact.test(name)) {
          throw new DOMException2(DOMException2.INVALID_CHARACTER_ERR, 'invalid character in name "' + name + '"');
        }
        if (this.type === "html") {
          name = name.toLowerCase();
        }
        return this._createAttribute(name);
      },
      _createAttribute: function(name) {
        var node = new Attr(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.name = name;
        node.nodeName = name;
        node.localName = name;
        node.specified = true;
        return node;
      },
      /**
       * Creates an EntityReference object.
       * The current implementation does not fill the `childNodes` with those of the corresponding
       * `Entity`
       *
       * The `name` is validated against the XML `Name` production at creation time; an invalid name
       * throws `InvalidCharacterError`. When the resulting node is serialized with
       * `requireWellFormed: true`, the serializer re-validates `nodeName` against the XML `Name`
       * production and throws `InvalidStateError` if a later `nodeName` mutation made it invalid;
       * without that option the name is emitted verbatim.
       *
       * __This implementation differs from the specification:__ xmldom does not expand entities —
       * the parser resolves entity references inline and never constructs `EntityReference` nodes,
       * so this method is the only producer.
       *
       * @deprecated
       * In DOM Level 4.
       * @param {string} name
       * The name of the entity to reference. No namespace well-formedness checks are performed.
       * @returns {EntityReference}
       * @throws {DOMException}
       * With code `INVALID_CHARACTER_ERR` when `name` is not a valid XML `Name`.
       * @throws {DOMException}
       * with code `NOT_SUPPORTED_ERR` when the document is of type `html`
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-392B75AE
       */
      createEntityReference: function(name) {
        if (!g2.Name_exact.test(name)) {
          throw new DOMException2(DOMException2.INVALID_CHARACTER_ERR, 'not a valid xml name "' + name + '"');
        }
        if (this.type === "html") {
          throw new DOMException2("document is an html document", DOMExceptionName.NotSupportedError);
        }
        var node = new EntityReference(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.nodeName = name;
        return node;
      },
      // Introduced in DOM Level 2:
      /**
       * @param {string} namespaceURI
       * @param {string} qualifiedName
       * @returns {Element}
       */
      createElementNS: function(namespaceURI, qualifiedName) {
        var validated = validateAndExtract(namespaceURI, qualifiedName);
        var node = new Element(PDC);
        var attrs = node.attributes = new NamedNodeMap();
        node.childNodes = new NodeList();
        node.ownerDocument = this;
        node.nodeName = qualifiedName;
        node.tagName = qualifiedName;
        node.namespaceURI = validated[0];
        node.prefix = validated[1];
        node.localName = validated[2];
        attrs._ownerElement = node;
        return node;
      },
      // Introduced in DOM Level 2:
      /**
       * @param {string} namespaceURI
       * @param {string} qualifiedName
       * @returns {Attr}
       */
      createAttributeNS: function(namespaceURI, qualifiedName) {
        var validated = validateAndExtract(namespaceURI, qualifiedName);
        var node = new Attr(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.nodeName = qualifiedName;
        node.name = qualifiedName;
        node.specified = true;
        node.namespaceURI = validated[0];
        node.prefix = validated[1];
        node.localName = validated[2];
        return node;
      }
    };
    _extends(Document, Node);
    function Element(symbol) {
      checkSymbol(symbol);
      this._nsMap = /* @__PURE__ */ Object.create(null);
    }
    Element.prototype = {
      nodeType: ELEMENT_NODE,
      /**
       * The attributes of this element.
       *
       * @type {NamedNodeMap | null}
       */
      attributes: null,
      getQualifiedName: function() {
        return this.prefix ? this.prefix + ":" + this.localName : this.localName;
      },
      _isInHTMLDocumentAndNamespace: function() {
        return this.ownerDocument.type === "html" && this.namespaceURI === NAMESPACE.HTML;
      },
      /**
       * Implementaton of Level2 Core function hasAttributes.
       *
       * @returns {boolean}
       * True if attribute list is not empty.
       * @see https://www.w3.org/TR/DOM-Level-2-Core/#core-ID-NodeHasAttrs
       */
      hasAttributes: function() {
        return !!(this.attributes && this.attributes.length);
      },
      hasAttribute: function(name) {
        return !!this.getAttributeNode(name);
      },
      /**
       * Returns element’s first attribute whose qualified name is `name`, and `null`
       * if there is no such attribute.
       *
       * @param {string} name
       * @returns {string | null}
       */
      getAttribute: function(name) {
        var attr = this.getAttributeNode(name);
        return attr ? attr.value : null;
      },
      getAttributeNode: function(name) {
        if (this._isInHTMLDocumentAndNamespace()) {
          name = name.toLowerCase();
        }
        return this.attributes.getNamedItem(name);
      },
      /**
       * Sets the value of element’s first attribute whose qualified name is qualifiedName to value.
       *
       * @param {string} name
       * @param {string} value
       */
      setAttribute: function(name, value) {
        if (this._isInHTMLDocumentAndNamespace()) {
          name = name.toLowerCase();
        }
        var attr = this.getAttributeNode(name);
        if (attr) {
          attr.value = attr.nodeValue = "" + value;
        } else {
          attr = this.ownerDocument._createAttribute(name);
          attr.value = attr.nodeValue = "" + value;
          this.setAttributeNode(attr);
        }
      },
      removeAttribute: function(name) {
        var attr = this.getAttributeNode(name);
        attr && this.removeAttributeNode(attr);
      },
      setAttributeNode: function(newAttr) {
        return this.attributes.setNamedItem(newAttr);
      },
      setAttributeNodeNS: function(newAttr) {
        return this.attributes.setNamedItemNS(newAttr);
      },
      removeAttributeNode: function(oldAttr) {
        return this.attributes.removeNamedItem(oldAttr.nodeName);
      },
      //get real attribute name,and remove it by removeAttributeNode
      removeAttributeNS: function(namespaceURI, localName) {
        var old = this.getAttributeNodeNS(namespaceURI, localName);
        old && this.removeAttributeNode(old);
      },
      hasAttributeNS: function(namespaceURI, localName) {
        return this.getAttributeNodeNS(namespaceURI, localName) != null;
      },
      /**
       * Returns element’s attribute whose namespace is `namespaceURI` and local name is
       * `localName`,
       * or `null` if there is no such attribute.
       *
       * @param {string} namespaceURI
       * @param {string} localName
       * @returns {string | null}
       */
      getAttributeNS: function(namespaceURI, localName) {
        var attr = this.getAttributeNodeNS(namespaceURI, localName);
        return attr ? attr.value : null;
      },
      /**
       * Sets the value of element’s attribute whose namespace is `namespaceURI` and local name is
       * `localName` to value.
       *
       * @param {string} namespaceURI
       * @param {string} qualifiedName
       * @param {string} value
       * @see https://dom.spec.whatwg.org/#dom-element-setattributens
       */
      setAttributeNS: function(namespaceURI, qualifiedName, value) {
        var validated = validateAndExtract(namespaceURI, qualifiedName);
        var localName = validated[2];
        var attr = this.getAttributeNodeNS(namespaceURI, localName);
        if (attr) {
          attr.value = attr.nodeValue = "" + value;
        } else {
          attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
          attr.value = attr.nodeValue = "" + value;
          this.setAttributeNode(attr);
        }
      },
      getAttributeNodeNS: function(namespaceURI, localName) {
        return this.attributes.getNamedItemNS(namespaceURI, localName);
      },
      /**
       * Returns a LiveNodeList of all child elements which have **all** of the given class name(s).
       *
       * Returns an empty list if `classNames` is an empty string or only contains HTML white space
       * characters.
       *
       * Warning: This returns a live LiveNodeList.
       * Changes in the DOM will reflect in the array as the changes occur.
       * If an element selected by this array no longer qualifies for the selector,
       * it will automatically be removed. Be aware of this for iteration purposes.
       *
       * @param {string} classNames
       * Is a string representing the class name(s) to match; multiple class names are separated by
       * (ASCII-)whitespace.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByClassName
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByClassName
       * @see https://dom.spec.whatwg.org/#concept-getelementsbyclassname
       */
      getElementsByClassName: function(classNames) {
        var classNamesSet = toOrderedSet(classNames);
        return new LiveNodeList(this, function(base) {
          var ls2 = [];
          if (classNamesSet.length > 0) {
            _visitNode(base, function(node) {
              if (node !== base && node.nodeType === ELEMENT_NODE) {
                var nodeClassNames = node.getAttribute("class");
                if (nodeClassNames) {
                  var matches = classNames === nodeClassNames;
                  if (!matches) {
                    var nodeClassNamesSet = toOrderedSet(nodeClassNames);
                    matches = classNamesSet.every(arrayIncludes(nodeClassNamesSet));
                  }
                  if (matches) {
                    ls2.push(node);
                  }
                }
              }
            });
          }
          return ls2;
        });
      },
      /**
       * Returns a LiveNodeList of elements with the given qualifiedName.
       * Searching for all descendants can be done by passing `*` as `qualifiedName`.
       *
       * All descendants of the specified element are searched, but not the element itself.
       * The returned list is live, which means it updates itself with the DOM tree automatically.
       * Therefore, there is no need to call `Element.getElementsByTagName()`
       * with the same element and arguments repeatedly if the DOM changes in between calls.
       *
       * When called on an HTML element in an HTML document,
       * `getElementsByTagName` lower-cases the argument before searching for it.
       * This is undesirable when trying to match camel-cased SVG elements (such as
       * `<linearGradient>`) in an HTML document.
       * Instead, use `Element.getElementsByTagNameNS()`,
       * which preserves the capitalization of the tag name.
       *
       * `Element.getElementsByTagName` is similar to `Document.getElementsByTagName()`,
       * except that it only searches for elements that are descendants of the specified element.
       *
       * @param {string} qualifiedName
       * @returns {LiveNodeList}
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagName
       * @see https://dom.spec.whatwg.org/#concept-getelementsbytagname
       */
      getElementsByTagName: function(qualifiedName) {
        var isHTMLDocument = (this.nodeType === DOCUMENT_NODE ? this : this.ownerDocument).type === "html";
        var lowerQualifiedName = qualifiedName.toLowerCase();
        return new LiveNodeList(this, function(base) {
          var ls2 = [];
          _visitNode(base, function(node) {
            if (node === base || node.nodeType !== ELEMENT_NODE) {
              return;
            }
            if (qualifiedName === "*") {
              ls2.push(node);
            } else {
              var nodeQualifiedName = node.getQualifiedName();
              var matchingQName = isHTMLDocument && node.namespaceURI === NAMESPACE.HTML ? lowerQualifiedName : qualifiedName;
              if (nodeQualifiedName === matchingQName) {
                ls2.push(node);
              }
            }
          });
          return ls2;
        });
      },
      getElementsByTagNameNS: function(namespaceURI, localName) {
        return new LiveNodeList(this, function(base) {
          var ls2 = [];
          _visitNode(base, function(node) {
            if (node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === "*" || node.namespaceURI === namespaceURI) && (localName === "*" || node.localName == localName)) {
              ls2.push(node);
            }
          });
          return ls2;
        });
      }
    };
    Document.prototype.getElementsByClassName = Element.prototype.getElementsByClassName;
    Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
    Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
    _extends(Element, Node);
    function Attr(symbol) {
      checkSymbol(symbol);
      this.namespaceURI = null;
      this.prefix = null;
      this.ownerElement = null;
    }
    Attr.prototype.nodeType = ATTRIBUTE_NODE;
    _extends(Attr, Node);
    function CharacterData(symbol) {
      checkSymbol(symbol);
    }
    CharacterData.prototype = {
      data: "",
      substringData: function(offset, count) {
        return this.data.substring(offset, offset + count);
      },
      appendData: function(text) {
        text = this.data + text;
        this.nodeValue = this.data = text;
        this.length = text.length;
      },
      insertData: function(offset, text) {
        this.replaceData(offset, 0, text);
      },
      deleteData: function(offset, count) {
        this.replaceData(offset, count, "");
      },
      replaceData: function(offset, count, text) {
        var start = this.data.substring(0, offset);
        var end = this.data.substring(offset + count);
        text = start + text + end;
        this.nodeValue = this.data = text;
        this.length = text.length;
      }
    };
    _extends(CharacterData, Node);
    function Text(symbol) {
      checkSymbol(symbol);
    }
    Text.prototype = {
      nodeName: "#text",
      nodeType: TEXT_NODE,
      splitText: function(offset) {
        var text = this.data;
        var newText = text.substring(offset);
        text = text.substring(0, offset);
        this.data = this.nodeValue = text;
        this.length = text.length;
        var newNode = this.ownerDocument.createTextNode(newText);
        if (this.parentNode) {
          this.parentNode.insertBefore(newNode, this.nextSibling);
        }
        return newNode;
      }
    };
    _extends(Text, CharacterData);
    function Comment(symbol) {
      checkSymbol(symbol);
    }
    Comment.prototype = {
      nodeName: "#comment",
      nodeType: COMMENT_NODE
    };
    _extends(Comment, CharacterData);
    function CDATASection(symbol) {
      checkSymbol(symbol);
    }
    CDATASection.prototype = {
      nodeName: "#cdata-section",
      nodeType: CDATA_SECTION_NODE
    };
    _extends(CDATASection, Text);
    function DocumentType(symbol) {
      checkSymbol(symbol);
    }
    DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
    _extends(DocumentType, Node);
    function Notation(symbol) {
      checkSymbol(symbol);
    }
    Notation.prototype.nodeType = NOTATION_NODE;
    _extends(Notation, Node);
    function Entity(symbol) {
      checkSymbol(symbol);
    }
    Entity.prototype.nodeType = ENTITY_NODE;
    _extends(Entity, Node);
    function EntityReference(symbol) {
      checkSymbol(symbol);
    }
    EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
    _extends(EntityReference, Node);
    function DocumentFragment(symbol) {
      checkSymbol(symbol);
    }
    DocumentFragment.prototype.nodeName = "#document-fragment";
    DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;
    _extends(DocumentFragment, Node);
    function ProcessingInstruction(symbol) {
      checkSymbol(symbol);
    }
    ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
    _extends(ProcessingInstruction, CharacterData);
    function XMLSerializer() {
    }
    XMLSerializer.prototype.serializeToString = function(node, options) {
      return nodeSerializeToString.call(node, options);
    };
    Node.prototype.toString = nodeSerializeToString;
    function nodeSerializeToString(options) {
      var opts;
      if (typeof options === "function") {
        opts = { requireWellFormed: false, splitCDATASections: true, nodeFilter: options };
      } else if (options != null) {
        opts = {
          requireWellFormed: !!options.requireWellFormed,
          splitCDATASections: options.splitCDATASections !== false,
          nodeFilter: options.nodeFilter || null
        };
      } else {
        opts = { requireWellFormed: false, splitCDATASections: true, nodeFilter: null };
      }
      var buf = [];
      var refNode = this.nodeType === DOCUMENT_NODE && this.documentElement || this;
      var prefix = refNode.prefix;
      var uri = refNode.namespaceURI;
      if (uri && prefix == null) {
        var prefix = refNode.lookupPrefix(uri);
        if (prefix == null) {
          var visibleNamespaces = [
            { namespace: uri, prefix: null }
            //{namespace:uri,prefix:''}
          ];
        }
      }
      serializeToString(this, buf, visibleNamespaces, opts);
      return buf.join("");
    }
    function needNamespaceDefine(node, isHTML, visibleNamespaces) {
      var prefix = node.prefix || "";
      var uri = node.namespaceURI;
      if (!uri) {
        return false;
      }
      if (prefix === "xml" && uri === NAMESPACE.XML || uri === NAMESPACE.XMLNS) {
        return false;
      }
      var i2 = visibleNamespaces.length;
      while (i2--) {
        var ns2 = visibleNamespaces[i2];
        if (ns2.prefix === prefix) {
          return ns2.namespace !== uri;
        }
      }
      return true;
    }
    function addSerializedAttribute(buf, qualifiedName, value, requireWellFormed) {
      if (requireWellFormed && !g2.QName_exact.test(qualifiedName)) {
        throw new DOMException2(
          'The attribute name "' + qualifiedName + '" is not a valid XML QName',
          DOMExceptionName.InvalidStateError
        );
      }
      buf.push(" ", qualifiedName, '="', value.replace(/[<>&"\t\n\r]/g, _xmlEncoder), '"');
    }
    function serializeToString(node, buf, visibleNamespaces, opts) {
      if (!visibleNamespaces) {
        visibleNamespaces = [];
      }
      var nodeFilter = opts.nodeFilter;
      var requireWellFormed = opts.requireWellFormed;
      var splitCDATASections = opts.splitCDATASections;
      var doc = node.nodeType === DOCUMENT_NODE ? node : node.ownerDocument;
      var isHTML = doc.type === "html";
      walkDOM(
        node,
        { ns: visibleNamespaces },
        {
          enter: function(n2, ctx) {
            var namespaces = ctx.ns;
            if (nodeFilter) {
              n2 = nodeFilter(n2);
              if (n2) {
                if (typeof n2 == "string") {
                  buf.push(n2);
                  return null;
                }
              } else {
                return null;
              }
            }
            switch (n2.nodeType) {
              case ELEMENT_NODE:
                var attrs = n2.attributes;
                var len = attrs.length;
                var nodeName = n2.tagName;
                var prefixedNodeName = nodeName;
                if (!isHTML && !n2.prefix && n2.namespaceURI) {
                  var defaultNS;
                  for (var ai2 = 0; ai2 < attrs.length; ai2++) {
                    if (attrs.item(ai2).name === "xmlns") {
                      defaultNS = attrs.item(ai2).value;
                      break;
                    }
                  }
                  if (!defaultNS) {
                    for (var nsi = namespaces.length - 1; nsi >= 0; nsi--) {
                      var nsEntry = namespaces[nsi];
                      if (nsEntry.prefix === "" && nsEntry.namespace === n2.namespaceURI) {
                        defaultNS = nsEntry.namespace;
                        break;
                      }
                    }
                  }
                  if (defaultNS !== n2.namespaceURI) {
                    for (var nsi = namespaces.length - 1; nsi >= 0; nsi--) {
                      var nsEntry = namespaces[nsi];
                      if (nsEntry.namespace === n2.namespaceURI) {
                        if (nsEntry.prefix) {
                          prefixedNodeName = nsEntry.prefix + ":" + nodeName;
                        }
                        break;
                      }
                    }
                  }
                }
                if (requireWellFormed && !g2.QName_exact.test(prefixedNodeName)) {
                  throw new DOMException2(
                    'The element name "' + prefixedNodeName + '" is not a valid XML QName',
                    DOMExceptionName.InvalidStateError
                  );
                }
                buf.push("<", prefixedNodeName);
                var childNamespaces = namespaces.slice();
                for (var i2 = 0; i2 < len; i2++) {
                  var attr = attrs.item(i2);
                  if (attr.prefix == "xmlns") {
                    childNamespaces.push({
                      prefix: attr.localName,
                      namespace: attr.value
                    });
                  } else if (attr.nodeName == "xmlns") {
                    childNamespaces.push({ prefix: "", namespace: attr.value });
                  }
                }
                for (var i2 = 0; i2 < len; i2++) {
                  var attr = attrs.item(i2);
                  if (needNamespaceDefine(attr, isHTML, childNamespaces)) {
                    var attrPrefix = attr.prefix || "";
                    var uri = attr.namespaceURI;
                    addSerializedAttribute(buf, attrPrefix ? "xmlns:" + attrPrefix : "xmlns", uri, requireWellFormed);
                    childNamespaces.push({ prefix: attrPrefix, namespace: uri });
                  }
                  var filteredAttr = nodeFilter ? nodeFilter(attr) : attr;
                  if (filteredAttr) {
                    if (typeof filteredAttr === "string") {
                      buf.push(filteredAttr);
                    } else {
                      addSerializedAttribute(buf, filteredAttr.name, filteredAttr.value, requireWellFormed);
                    }
                  }
                }
                if (nodeName === prefixedNodeName && needNamespaceDefine(n2, isHTML, childNamespaces)) {
                  var nodePrefix = n2.prefix || "";
                  var uri = n2.namespaceURI;
                  addSerializedAttribute(buf, nodePrefix ? "xmlns:" + nodePrefix : "xmlns", uri, requireWellFormed);
                  childNamespaces.push({ prefix: nodePrefix, namespace: uri });
                }
                var canCloseTag = !n2.firstChild;
                if (canCloseTag && (isHTML || n2.namespaceURI === NAMESPACE.HTML)) {
                  canCloseTag = isHTMLVoidElement(nodeName);
                }
                if (canCloseTag) {
                  buf.push("/>");
                  return null;
                }
                buf.push(">");
                if (isHTML && isHTMLRawTextElement(nodeName)) {
                  var child = n2.firstChild;
                  while (child) {
                    if (child.data) {
                      buf.push(child.data);
                    } else {
                      serializeToString(child, buf, childNamespaces.slice(), opts);
                    }
                    child = child.nextSibling;
                  }
                  buf.push("</", prefixedNodeName, ">");
                  return null;
                }
                return { ns: childNamespaces, tag: prefixedNodeName };
              case DOCUMENT_NODE:
              case DOCUMENT_FRAGMENT_NODE:
                if (requireWellFormed && n2.nodeType === DOCUMENT_NODE && n2.documentElement == null) {
                  throw new DOMException2("The Document has no documentElement", DOMExceptionName.InvalidStateError);
                }
                return { ns: namespaces };
              case ATTRIBUTE_NODE:
                addSerializedAttribute(buf, n2.name, n2.value, requireWellFormed);
                return null;
              case TEXT_NODE:
                if (requireWellFormed && g2.InvalidChar.test(n2.data)) {
                  throw new DOMException2(
                    "The Text node data contains characters outside the XML Char production",
                    DOMExceptionName.InvalidStateError
                  );
                }
                buf.push(n2.data.replace(/[<&>]/g, _xmlEncoder));
                return null;
              case CDATA_SECTION_NODE:
                if (requireWellFormed && n2.data.indexOf("]]>") !== -1) {
                  throw new DOMException2('The CDATASection data contains "]]>"', DOMExceptionName.InvalidStateError);
                }
                if (splitCDATASections) {
                  buf.push(g2.CDATA_START, n2.data.replace(/]]>/g, "]]]]><![CDATA[>"), g2.CDATA_END);
                } else {
                  buf.push(g2.CDATA_START, n2.data, g2.CDATA_END);
                }
                return null;
              case COMMENT_NODE:
                if (requireWellFormed) {
                  if (g2.InvalidChar.test(n2.data)) {
                    throw new DOMException2(
                      "The comment node data contains characters outside the XML Char production",
                      DOMExceptionName.InvalidStateError
                    );
                  }
                  if (n2.data.indexOf("--") !== -1 || n2.data[n2.data.length - 1] === "-") {
                    throw new DOMException2(
                      'The comment node data contains "--" or ends with "-"',
                      DOMExceptionName.InvalidStateError
                    );
                  }
                }
                buf.push(g2.COMMENT_START, n2.data, g2.COMMENT_END);
                return null;
              case DOCUMENT_TYPE_NODE:
                var pubid = n2.publicId;
                var sysid = n2.systemId;
                if (requireWellFormed) {
                  if (!g2.Name_exact.test(n2.name)) {
                    throw new DOMException2(
                      'The doctype name "' + n2.name + '" is not a valid XML Name',
                      DOMExceptionName.InvalidStateError
                    );
                  }
                  if (pubid && !g2.PubidLiteral_match.test(pubid)) {
                    throw new DOMException2("DocumentType publicId is not a valid PubidLiteral", DOMExceptionName.InvalidStateError);
                  }
                  if (sysid && sysid !== "." && !g2.SystemLiteral_match.test(sysid)) {
                    throw new DOMException2("DocumentType systemId is not a valid SystemLiteral", DOMExceptionName.InvalidStateError);
                  }
                  if (n2.internalSubset && n2.internalSubset.indexOf("]>") !== -1) {
                    throw new DOMException2('DocumentType internalSubset contains "]>"', DOMExceptionName.InvalidStateError);
                  }
                }
                buf.push(g2.DOCTYPE_DECL_START, " ", n2.name);
                if (pubid) {
                  buf.push(" ", g2.PUBLIC, " ", pubid);
                  if (sysid && sysid !== ".") {
                    buf.push(" ", sysid);
                  }
                } else if (sysid && sysid !== ".") {
                  buf.push(" ", g2.SYSTEM, " ", sysid);
                }
                if (n2.internalSubset) {
                  buf.push(" [", n2.internalSubset, "]");
                }
                buf.push(">");
                return null;
              case PROCESSING_INSTRUCTION_NODE:
                if (requireWellFormed) {
                  if (!g2.NCName_exact.test(n2.target) || n2.target.toLowerCase() === "xml") {
                    throw new DOMException2(
                      'The processing instruction target "' + n2.target + '" is not a valid XML NCName or is reserved',
                      DOMExceptionName.InvalidStateError
                    );
                  }
                  if (g2.InvalidChar.test(n2.data)) {
                    throw new DOMException2(
                      "The ProcessingInstruction data contains characters outside the XML Char production",
                      DOMExceptionName.InvalidStateError
                    );
                  }
                  if (n2.data.indexOf("?>") !== -1) {
                    throw new DOMException2('The ProcessingInstruction data contains "?>"', DOMExceptionName.InvalidStateError);
                  }
                }
                buf.push("<?", n2.target, " ", n2.data, "?>");
                return null;
              case ENTITY_REFERENCE_NODE:
                if (requireWellFormed && !g2.Name_exact.test(n2.nodeName)) {
                  throw new DOMException2(
                    'The entity reference name "' + n2.nodeName + '" is not a valid XML Name',
                    DOMExceptionName.InvalidStateError
                  );
                }
                buf.push("&", n2.nodeName, ";");
                return null;
              //case ENTITY_NODE:
              //case NOTATION_NODE:
              default:
                buf.push("??", n2.nodeName);
                return null;
            }
          },
          exit: function(n2, childCtx) {
            if (childCtx && childCtx.tag) {
              buf.push("</", childCtx.tag, ">");
            }
          }
        }
      );
    }
    function importNode(doc, node, deep) {
      var destRoot;
      walkDOM(node, null, {
        enter: function(srcNode, destParent) {
          var destNode = srcNode.cloneNode(false);
          destNode.ownerDocument = doc;
          destNode.parentNode = null;
          if (destParent === null) {
            destRoot = destNode;
          } else {
            destParent.appendChild(destNode);
          }
          var shouldDeep = srcNode.nodeType === ATTRIBUTE_NODE || deep;
          return shouldDeep ? destNode : null;
        }
      });
      return destRoot;
    }
    function cloneNode(doc, node, deep) {
      var destRoot;
      walkDOM(node, null, {
        enter: function(srcNode, destParent) {
          var destNode = new srcNode.constructor(PDC);
          for (var n2 in srcNode) {
            if (hasOwn(srcNode, n2)) {
              var v2 = srcNode[n2];
              if (typeof v2 != "object") {
                if (v2 != destNode[n2]) {
                  destNode[n2] = v2;
                }
              }
            }
          }
          if (srcNode.childNodes) {
            destNode.childNodes = new NodeList();
          }
          destNode.ownerDocument = doc;
          var shouldDeep = deep;
          switch (destNode.nodeType) {
            case ELEMENT_NODE:
              var attrs = srcNode.attributes;
              var attrs2 = destNode.attributes = new NamedNodeMap();
              var len = attrs.length;
              attrs2._ownerElement = destNode;
              for (var i2 = 0; i2 < len; i2++) {
                destNode.setAttributeNode(cloneNode(doc, attrs.item(i2), true));
              }
              break;
            case ATTRIBUTE_NODE:
              shouldDeep = true;
          }
          if (destParent !== null) {
            destParent.appendChild(destNode);
          } else {
            destRoot = destNode;
          }
          return shouldDeep ? destNode : null;
        }
      });
      return destRoot;
    }
    function __set__(object, key, value) {
      object[key] = value;
    }
    function childrenRefresh(node) {
      var ls2 = [];
      var child = node.firstChild;
      while (child) {
        if (child.nodeType === ELEMENT_NODE) {
          ls2.push(child);
        }
        child = child.nextSibling;
      }
      return ls2;
    }
    try {
      if (Object.defineProperty) {
        Object.defineProperty(LiveNodeList.prototype, "length", {
          get: function() {
            _updateLiveList(this);
            return this.$$length;
          }
        });
        Object.defineProperty(Node.prototype, "textContent", {
          get: function() {
            if (this.nodeType === ELEMENT_NODE || this.nodeType === DOCUMENT_FRAGMENT_NODE) {
              var buf = [];
              walkDOM(this, null, {
                enter: function(n2) {
                  if (n2.nodeType === ELEMENT_NODE || n2.nodeType === DOCUMENT_FRAGMENT_NODE) {
                    return true;
                  }
                  if (n2.nodeType === PROCESSING_INSTRUCTION_NODE || n2.nodeType === COMMENT_NODE) {
                    return null;
                  }
                  buf.push(n2.nodeValue);
                }
              });
              return buf.join("");
            }
            return this.nodeValue;
          },
          set: function(data) {
            switch (this.nodeType) {
              case ELEMENT_NODE:
              case DOCUMENT_FRAGMENT_NODE:
                while (this.firstChild) {
                  this.removeChild(this.firstChild);
                }
                if (data || String(data)) {
                  this.appendChild(this.ownerDocument.createTextNode(data));
                }
                break;
              default:
                this.data = data;
                this.value = data;
                this.nodeValue = data;
            }
          }
        });
        Object.defineProperty(CharacterData.prototype, "data", {
          get: function() {
            return this._data != null ? this._data : "";
          },
          set: function(v2) {
            this._data = v2;
            this.length = typeof v2 === "string" ? v2.length : 0;
          }
        });
        Object.defineProperty(CharacterData.prototype, "nodeValue", {
          get: function() {
            return this.data;
          },
          set: function(v2) {
            this.data = v2;
          },
          enumerable: true,
          configurable: true
        });
        Object.defineProperty(Element.prototype, "children", {
          get: function() {
            return new LiveNodeList(this, childrenRefresh);
          }
        });
        Object.defineProperty(Document.prototype, "children", {
          get: function() {
            return new LiveNodeList(this, childrenRefresh);
          }
        });
        Object.defineProperty(DocumentFragment.prototype, "children", {
          get: function() {
            return new LiveNodeList(this, childrenRefresh);
          }
        });
        __set__ = function(object, key, value) {
          object["$$" + key] = value;
        };
      }
    } catch (e3) {
    }
    exports._updateLiveList = _updateLiveList;
    exports.Attr = Attr;
    exports.CDATASection = CDATASection;
    exports.CharacterData = CharacterData;
    exports.Comment = Comment;
    exports.Document = Document;
    exports.DocumentFragment = DocumentFragment;
    exports.DocumentType = DocumentType;
    exports.DOMImplementation = DOMImplementation;
    exports.Element = Element;
    exports.Entity = Entity;
    exports.EntityReference = EntityReference;
    exports.LiveNodeList = LiveNodeList;
    exports.NamedNodeMap = NamedNodeMap;
    exports.Node = Node;
    exports.NodeList = NodeList;
    exports.Notation = Notation;
    exports.Text = Text;
    exports.ProcessingInstruction = ProcessingInstruction;
    exports.walkDOM = walkDOM;
    exports.XMLSerializer = XMLSerializer;
  }
});

// node_modules/@xmldom/xmldom/lib/entities.js
var require_entities = __commonJS({
  "node_modules/@xmldom/xmldom/lib/entities.js"(exports) {
    "use strict";
    var freeze = require_conventions().freeze;
    exports.XML_ENTITIES = freeze({
      amp: "&",
      apos: "'",
      gt: ">",
      lt: "<",
      quot: '"'
    });
    exports.HTML_ENTITIES = freeze({
      Aacute: "\xC1",
      aacute: "\xE1",
      Abreve: "\u0102",
      abreve: "\u0103",
      ac: "\u223E",
      acd: "\u223F",
      acE: "\u223E\u0333",
      Acirc: "\xC2",
      acirc: "\xE2",
      acute: "\xB4",
      Acy: "\u0410",
      acy: "\u0430",
      AElig: "\xC6",
      aelig: "\xE6",
      af: "\u2061",
      Afr: "\u{1D504}",
      afr: "\u{1D51E}",
      Agrave: "\xC0",
      agrave: "\xE0",
      alefsym: "\u2135",
      aleph: "\u2135",
      Alpha: "\u0391",
      alpha: "\u03B1",
      Amacr: "\u0100",
      amacr: "\u0101",
      amalg: "\u2A3F",
      AMP: "&",
      amp: "&",
      And: "\u2A53",
      and: "\u2227",
      andand: "\u2A55",
      andd: "\u2A5C",
      andslope: "\u2A58",
      andv: "\u2A5A",
      ang: "\u2220",
      ange: "\u29A4",
      angle: "\u2220",
      angmsd: "\u2221",
      angmsdaa: "\u29A8",
      angmsdab: "\u29A9",
      angmsdac: "\u29AA",
      angmsdad: "\u29AB",
      angmsdae: "\u29AC",
      angmsdaf: "\u29AD",
      angmsdag: "\u29AE",
      angmsdah: "\u29AF",
      angrt: "\u221F",
      angrtvb: "\u22BE",
      angrtvbd: "\u299D",
      angsph: "\u2222",
      angst: "\xC5",
      angzarr: "\u237C",
      Aogon: "\u0104",
      aogon: "\u0105",
      Aopf: "\u{1D538}",
      aopf: "\u{1D552}",
      ap: "\u2248",
      apacir: "\u2A6F",
      apE: "\u2A70",
      ape: "\u224A",
      apid: "\u224B",
      apos: "'",
      ApplyFunction: "\u2061",
      approx: "\u2248",
      approxeq: "\u224A",
      Aring: "\xC5",
      aring: "\xE5",
      Ascr: "\u{1D49C}",
      ascr: "\u{1D4B6}",
      Assign: "\u2254",
      ast: "*",
      asymp: "\u2248",
      asympeq: "\u224D",
      Atilde: "\xC3",
      atilde: "\xE3",
      Auml: "\xC4",
      auml: "\xE4",
      awconint: "\u2233",
      awint: "\u2A11",
      backcong: "\u224C",
      backepsilon: "\u03F6",
      backprime: "\u2035",
      backsim: "\u223D",
      backsimeq: "\u22CD",
      Backslash: "\u2216",
      Barv: "\u2AE7",
      barvee: "\u22BD",
      Barwed: "\u2306",
      barwed: "\u2305",
      barwedge: "\u2305",
      bbrk: "\u23B5",
      bbrktbrk: "\u23B6",
      bcong: "\u224C",
      Bcy: "\u0411",
      bcy: "\u0431",
      bdquo: "\u201E",
      becaus: "\u2235",
      Because: "\u2235",
      because: "\u2235",
      bemptyv: "\u29B0",
      bepsi: "\u03F6",
      bernou: "\u212C",
      Bernoullis: "\u212C",
      Beta: "\u0392",
      beta: "\u03B2",
      beth: "\u2136",
      between: "\u226C",
      Bfr: "\u{1D505}",
      bfr: "\u{1D51F}",
      bigcap: "\u22C2",
      bigcirc: "\u25EF",
      bigcup: "\u22C3",
      bigodot: "\u2A00",
      bigoplus: "\u2A01",
      bigotimes: "\u2A02",
      bigsqcup: "\u2A06",
      bigstar: "\u2605",
      bigtriangledown: "\u25BD",
      bigtriangleup: "\u25B3",
      biguplus: "\u2A04",
      bigvee: "\u22C1",
      bigwedge: "\u22C0",
      bkarow: "\u290D",
      blacklozenge: "\u29EB",
      blacksquare: "\u25AA",
      blacktriangle: "\u25B4",
      blacktriangledown: "\u25BE",
      blacktriangleleft: "\u25C2",
      blacktriangleright: "\u25B8",
      blank: "\u2423",
      blk12: "\u2592",
      blk14: "\u2591",
      blk34: "\u2593",
      block: "\u2588",
      bne: "=\u20E5",
      bnequiv: "\u2261\u20E5",
      bNot: "\u2AED",
      bnot: "\u2310",
      Bopf: "\u{1D539}",
      bopf: "\u{1D553}",
      bot: "\u22A5",
      bottom: "\u22A5",
      bowtie: "\u22C8",
      boxbox: "\u29C9",
      boxDL: "\u2557",
      boxDl: "\u2556",
      boxdL: "\u2555",
      boxdl: "\u2510",
      boxDR: "\u2554",
      boxDr: "\u2553",
      boxdR: "\u2552",
      boxdr: "\u250C",
      boxH: "\u2550",
      boxh: "\u2500",
      boxHD: "\u2566",
      boxHd: "\u2564",
      boxhD: "\u2565",
      boxhd: "\u252C",
      boxHU: "\u2569",
      boxHu: "\u2567",
      boxhU: "\u2568",
      boxhu: "\u2534",
      boxminus: "\u229F",
      boxplus: "\u229E",
      boxtimes: "\u22A0",
      boxUL: "\u255D",
      boxUl: "\u255C",
      boxuL: "\u255B",
      boxul: "\u2518",
      boxUR: "\u255A",
      boxUr: "\u2559",
      boxuR: "\u2558",
      boxur: "\u2514",
      boxV: "\u2551",
      boxv: "\u2502",
      boxVH: "\u256C",
      boxVh: "\u256B",
      boxvH: "\u256A",
      boxvh: "\u253C",
      boxVL: "\u2563",
      boxVl: "\u2562",
      boxvL: "\u2561",
      boxvl: "\u2524",
      boxVR: "\u2560",
      boxVr: "\u255F",
      boxvR: "\u255E",
      boxvr: "\u251C",
      bprime: "\u2035",
      Breve: "\u02D8",
      breve: "\u02D8",
      brvbar: "\xA6",
      Bscr: "\u212C",
      bscr: "\u{1D4B7}",
      bsemi: "\u204F",
      bsim: "\u223D",
      bsime: "\u22CD",
      bsol: "\\",
      bsolb: "\u29C5",
      bsolhsub: "\u27C8",
      bull: "\u2022",
      bullet: "\u2022",
      bump: "\u224E",
      bumpE: "\u2AAE",
      bumpe: "\u224F",
      Bumpeq: "\u224E",
      bumpeq: "\u224F",
      Cacute: "\u0106",
      cacute: "\u0107",
      Cap: "\u22D2",
      cap: "\u2229",
      capand: "\u2A44",
      capbrcup: "\u2A49",
      capcap: "\u2A4B",
      capcup: "\u2A47",
      capdot: "\u2A40",
      CapitalDifferentialD: "\u2145",
      caps: "\u2229\uFE00",
      caret: "\u2041",
      caron: "\u02C7",
      Cayleys: "\u212D",
      ccaps: "\u2A4D",
      Ccaron: "\u010C",
      ccaron: "\u010D",
      Ccedil: "\xC7",
      ccedil: "\xE7",
      Ccirc: "\u0108",
      ccirc: "\u0109",
      Cconint: "\u2230",
      ccups: "\u2A4C",
      ccupssm: "\u2A50",
      Cdot: "\u010A",
      cdot: "\u010B",
      cedil: "\xB8",
      Cedilla: "\xB8",
      cemptyv: "\u29B2",
      cent: "\xA2",
      CenterDot: "\xB7",
      centerdot: "\xB7",
      Cfr: "\u212D",
      cfr: "\u{1D520}",
      CHcy: "\u0427",
      chcy: "\u0447",
      check: "\u2713",
      checkmark: "\u2713",
      Chi: "\u03A7",
      chi: "\u03C7",
      cir: "\u25CB",
      circ: "\u02C6",
      circeq: "\u2257",
      circlearrowleft: "\u21BA",
      circlearrowright: "\u21BB",
      circledast: "\u229B",
      circledcirc: "\u229A",
      circleddash: "\u229D",
      CircleDot: "\u2299",
      circledR: "\xAE",
      circledS: "\u24C8",
      CircleMinus: "\u2296",
      CirclePlus: "\u2295",
      CircleTimes: "\u2297",
      cirE: "\u29C3",
      cire: "\u2257",
      cirfnint: "\u2A10",
      cirmid: "\u2AEF",
      cirscir: "\u29C2",
      ClockwiseContourIntegral: "\u2232",
      CloseCurlyDoubleQuote: "\u201D",
      CloseCurlyQuote: "\u2019",
      clubs: "\u2663",
      clubsuit: "\u2663",
      Colon: "\u2237",
      colon: ":",
      Colone: "\u2A74",
      colone: "\u2254",
      coloneq: "\u2254",
      comma: ",",
      commat: "@",
      comp: "\u2201",
      compfn: "\u2218",
      complement: "\u2201",
      complexes: "\u2102",
      cong: "\u2245",
      congdot: "\u2A6D",
      Congruent: "\u2261",
      Conint: "\u222F",
      conint: "\u222E",
      ContourIntegral: "\u222E",
      Copf: "\u2102",
      copf: "\u{1D554}",
      coprod: "\u2210",
      Coproduct: "\u2210",
      COPY: "\xA9",
      copy: "\xA9",
      copysr: "\u2117",
      CounterClockwiseContourIntegral: "\u2233",
      crarr: "\u21B5",
      Cross: "\u2A2F",
      cross: "\u2717",
      Cscr: "\u{1D49E}",
      cscr: "\u{1D4B8}",
      csub: "\u2ACF",
      csube: "\u2AD1",
      csup: "\u2AD0",
      csupe: "\u2AD2",
      ctdot: "\u22EF",
      cudarrl: "\u2938",
      cudarrr: "\u2935",
      cuepr: "\u22DE",
      cuesc: "\u22DF",
      cularr: "\u21B6",
      cularrp: "\u293D",
      Cup: "\u22D3",
      cup: "\u222A",
      cupbrcap: "\u2A48",
      CupCap: "\u224D",
      cupcap: "\u2A46",
      cupcup: "\u2A4A",
      cupdot: "\u228D",
      cupor: "\u2A45",
      cups: "\u222A\uFE00",
      curarr: "\u21B7",
      curarrm: "\u293C",
      curlyeqprec: "\u22DE",
      curlyeqsucc: "\u22DF",
      curlyvee: "\u22CE",
      curlywedge: "\u22CF",
      curren: "\xA4",
      curvearrowleft: "\u21B6",
      curvearrowright: "\u21B7",
      cuvee: "\u22CE",
      cuwed: "\u22CF",
      cwconint: "\u2232",
      cwint: "\u2231",
      cylcty: "\u232D",
      Dagger: "\u2021",
      dagger: "\u2020",
      daleth: "\u2138",
      Darr: "\u21A1",
      dArr: "\u21D3",
      darr: "\u2193",
      dash: "\u2010",
      Dashv: "\u2AE4",
      dashv: "\u22A3",
      dbkarow: "\u290F",
      dblac: "\u02DD",
      Dcaron: "\u010E",
      dcaron: "\u010F",
      Dcy: "\u0414",
      dcy: "\u0434",
      DD: "\u2145",
      dd: "\u2146",
      ddagger: "\u2021",
      ddarr: "\u21CA",
      DDotrahd: "\u2911",
      ddotseq: "\u2A77",
      deg: "\xB0",
      Del: "\u2207",
      Delta: "\u0394",
      delta: "\u03B4",
      demptyv: "\u29B1",
      dfisht: "\u297F",
      Dfr: "\u{1D507}",
      dfr: "\u{1D521}",
      dHar: "\u2965",
      dharl: "\u21C3",
      dharr: "\u21C2",
      DiacriticalAcute: "\xB4",
      DiacriticalDot: "\u02D9",
      DiacriticalDoubleAcute: "\u02DD",
      DiacriticalGrave: "`",
      DiacriticalTilde: "\u02DC",
      diam: "\u22C4",
      Diamond: "\u22C4",
      diamond: "\u22C4",
      diamondsuit: "\u2666",
      diams: "\u2666",
      die: "\xA8",
      DifferentialD: "\u2146",
      digamma: "\u03DD",
      disin: "\u22F2",
      div: "\xF7",
      divide: "\xF7",
      divideontimes: "\u22C7",
      divonx: "\u22C7",
      DJcy: "\u0402",
      djcy: "\u0452",
      dlcorn: "\u231E",
      dlcrop: "\u230D",
      dollar: "$",
      Dopf: "\u{1D53B}",
      dopf: "\u{1D555}",
      Dot: "\xA8",
      dot: "\u02D9",
      DotDot: "\u20DC",
      doteq: "\u2250",
      doteqdot: "\u2251",
      DotEqual: "\u2250",
      dotminus: "\u2238",
      dotplus: "\u2214",
      dotsquare: "\u22A1",
      doublebarwedge: "\u2306",
      DoubleContourIntegral: "\u222F",
      DoubleDot: "\xA8",
      DoubleDownArrow: "\u21D3",
      DoubleLeftArrow: "\u21D0",
      DoubleLeftRightArrow: "\u21D4",
      DoubleLeftTee: "\u2AE4",
      DoubleLongLeftArrow: "\u27F8",
      DoubleLongLeftRightArrow: "\u27FA",
      DoubleLongRightArrow: "\u27F9",
      DoubleRightArrow: "\u21D2",
      DoubleRightTee: "\u22A8",
      DoubleUpArrow: "\u21D1",
      DoubleUpDownArrow: "\u21D5",
      DoubleVerticalBar: "\u2225",
      DownArrow: "\u2193",
      Downarrow: "\u21D3",
      downarrow: "\u2193",
      DownArrowBar: "\u2913",
      DownArrowUpArrow: "\u21F5",
      DownBreve: "\u0311",
      downdownarrows: "\u21CA",
      downharpoonleft: "\u21C3",
      downharpoonright: "\u21C2",
      DownLeftRightVector: "\u2950",
      DownLeftTeeVector: "\u295E",
      DownLeftVector: "\u21BD",
      DownLeftVectorBar: "\u2956",
      DownRightTeeVector: "\u295F",
      DownRightVector: "\u21C1",
      DownRightVectorBar: "\u2957",
      DownTee: "\u22A4",
      DownTeeArrow: "\u21A7",
      drbkarow: "\u2910",
      drcorn: "\u231F",
      drcrop: "\u230C",
      Dscr: "\u{1D49F}",
      dscr: "\u{1D4B9}",
      DScy: "\u0405",
      dscy: "\u0455",
      dsol: "\u29F6",
      Dstrok: "\u0110",
      dstrok: "\u0111",
      dtdot: "\u22F1",
      dtri: "\u25BF",
      dtrif: "\u25BE",
      duarr: "\u21F5",
      duhar: "\u296F",
      dwangle: "\u29A6",
      DZcy: "\u040F",
      dzcy: "\u045F",
      dzigrarr: "\u27FF",
      Eacute: "\xC9",
      eacute: "\xE9",
      easter: "\u2A6E",
      Ecaron: "\u011A",
      ecaron: "\u011B",
      ecir: "\u2256",
      Ecirc: "\xCA",
      ecirc: "\xEA",
      ecolon: "\u2255",
      Ecy: "\u042D",
      ecy: "\u044D",
      eDDot: "\u2A77",
      Edot: "\u0116",
      eDot: "\u2251",
      edot: "\u0117",
      ee: "\u2147",
      efDot: "\u2252",
      Efr: "\u{1D508}",
      efr: "\u{1D522}",
      eg: "\u2A9A",
      Egrave: "\xC8",
      egrave: "\xE8",
      egs: "\u2A96",
      egsdot: "\u2A98",
      el: "\u2A99",
      Element: "\u2208",
      elinters: "\u23E7",
      ell: "\u2113",
      els: "\u2A95",
      elsdot: "\u2A97",
      Emacr: "\u0112",
      emacr: "\u0113",
      empty: "\u2205",
      emptyset: "\u2205",
      EmptySmallSquare: "\u25FB",
      emptyv: "\u2205",
      EmptyVerySmallSquare: "\u25AB",
      emsp: "\u2003",
      emsp13: "\u2004",
      emsp14: "\u2005",
      ENG: "\u014A",
      eng: "\u014B",
      ensp: "\u2002",
      Eogon: "\u0118",
      eogon: "\u0119",
      Eopf: "\u{1D53C}",
      eopf: "\u{1D556}",
      epar: "\u22D5",
      eparsl: "\u29E3",
      eplus: "\u2A71",
      epsi: "\u03B5",
      Epsilon: "\u0395",
      epsilon: "\u03B5",
      epsiv: "\u03F5",
      eqcirc: "\u2256",
      eqcolon: "\u2255",
      eqsim: "\u2242",
      eqslantgtr: "\u2A96",
      eqslantless: "\u2A95",
      Equal: "\u2A75",
      equals: "=",
      EqualTilde: "\u2242",
      equest: "\u225F",
      Equilibrium: "\u21CC",
      equiv: "\u2261",
      equivDD: "\u2A78",
      eqvparsl: "\u29E5",
      erarr: "\u2971",
      erDot: "\u2253",
      Escr: "\u2130",
      escr: "\u212F",
      esdot: "\u2250",
      Esim: "\u2A73",
      esim: "\u2242",
      Eta: "\u0397",
      eta: "\u03B7",
      ETH: "\xD0",
      eth: "\xF0",
      Euml: "\xCB",
      euml: "\xEB",
      euro: "\u20AC",
      excl: "!",
      exist: "\u2203",
      Exists: "\u2203",
      expectation: "\u2130",
      ExponentialE: "\u2147",
      exponentiale: "\u2147",
      fallingdotseq: "\u2252",
      Fcy: "\u0424",
      fcy: "\u0444",
      female: "\u2640",
      ffilig: "\uFB03",
      fflig: "\uFB00",
      ffllig: "\uFB04",
      Ffr: "\u{1D509}",
      ffr: "\u{1D523}",
      filig: "\uFB01",
      FilledSmallSquare: "\u25FC",
      FilledVerySmallSquare: "\u25AA",
      fjlig: "fj",
      flat: "\u266D",
      fllig: "\uFB02",
      fltns: "\u25B1",
      fnof: "\u0192",
      Fopf: "\u{1D53D}",
      fopf: "\u{1D557}",
      ForAll: "\u2200",
      forall: "\u2200",
      fork: "\u22D4",
      forkv: "\u2AD9",
      Fouriertrf: "\u2131",
      fpartint: "\u2A0D",
      frac12: "\xBD",
      frac13: "\u2153",
      frac14: "\xBC",
      frac15: "\u2155",
      frac16: "\u2159",
      frac18: "\u215B",
      frac23: "\u2154",
      frac25: "\u2156",
      frac34: "\xBE",
      frac35: "\u2157",
      frac38: "\u215C",
      frac45: "\u2158",
      frac56: "\u215A",
      frac58: "\u215D",
      frac78: "\u215E",
      frasl: "\u2044",
      frown: "\u2322",
      Fscr: "\u2131",
      fscr: "\u{1D4BB}",
      gacute: "\u01F5",
      Gamma: "\u0393",
      gamma: "\u03B3",
      Gammad: "\u03DC",
      gammad: "\u03DD",
      gap: "\u2A86",
      Gbreve: "\u011E",
      gbreve: "\u011F",
      Gcedil: "\u0122",
      Gcirc: "\u011C",
      gcirc: "\u011D",
      Gcy: "\u0413",
      gcy: "\u0433",
      Gdot: "\u0120",
      gdot: "\u0121",
      gE: "\u2267",
      ge: "\u2265",
      gEl: "\u2A8C",
      gel: "\u22DB",
      geq: "\u2265",
      geqq: "\u2267",
      geqslant: "\u2A7E",
      ges: "\u2A7E",
      gescc: "\u2AA9",
      gesdot: "\u2A80",
      gesdoto: "\u2A82",
      gesdotol: "\u2A84",
      gesl: "\u22DB\uFE00",
      gesles: "\u2A94",
      Gfr: "\u{1D50A}",
      gfr: "\u{1D524}",
      Gg: "\u22D9",
      gg: "\u226B",
      ggg: "\u22D9",
      gimel: "\u2137",
      GJcy: "\u0403",
      gjcy: "\u0453",
      gl: "\u2277",
      gla: "\u2AA5",
      glE: "\u2A92",
      glj: "\u2AA4",
      gnap: "\u2A8A",
      gnapprox: "\u2A8A",
      gnE: "\u2269",
      gne: "\u2A88",
      gneq: "\u2A88",
      gneqq: "\u2269",
      gnsim: "\u22E7",
      Gopf: "\u{1D53E}",
      gopf: "\u{1D558}",
      grave: "`",
      GreaterEqual: "\u2265",
      GreaterEqualLess: "\u22DB",
      GreaterFullEqual: "\u2267",
      GreaterGreater: "\u2AA2",
      GreaterLess: "\u2277",
      GreaterSlantEqual: "\u2A7E",
      GreaterTilde: "\u2273",
      Gscr: "\u{1D4A2}",
      gscr: "\u210A",
      gsim: "\u2273",
      gsime: "\u2A8E",
      gsiml: "\u2A90",
      Gt: "\u226B",
      GT: ">",
      gt: ">",
      gtcc: "\u2AA7",
      gtcir: "\u2A7A",
      gtdot: "\u22D7",
      gtlPar: "\u2995",
      gtquest: "\u2A7C",
      gtrapprox: "\u2A86",
      gtrarr: "\u2978",
      gtrdot: "\u22D7",
      gtreqless: "\u22DB",
      gtreqqless: "\u2A8C",
      gtrless: "\u2277",
      gtrsim: "\u2273",
      gvertneqq: "\u2269\uFE00",
      gvnE: "\u2269\uFE00",
      Hacek: "\u02C7",
      hairsp: "\u200A",
      half: "\xBD",
      hamilt: "\u210B",
      HARDcy: "\u042A",
      hardcy: "\u044A",
      hArr: "\u21D4",
      harr: "\u2194",
      harrcir: "\u2948",
      harrw: "\u21AD",
      Hat: "^",
      hbar: "\u210F",
      Hcirc: "\u0124",
      hcirc: "\u0125",
      hearts: "\u2665",
      heartsuit: "\u2665",
      hellip: "\u2026",
      hercon: "\u22B9",
      Hfr: "\u210C",
      hfr: "\u{1D525}",
      HilbertSpace: "\u210B",
      hksearow: "\u2925",
      hkswarow: "\u2926",
      hoarr: "\u21FF",
      homtht: "\u223B",
      hookleftarrow: "\u21A9",
      hookrightarrow: "\u21AA",
      Hopf: "\u210D",
      hopf: "\u{1D559}",
      horbar: "\u2015",
      HorizontalLine: "\u2500",
      Hscr: "\u210B",
      hscr: "\u{1D4BD}",
      hslash: "\u210F",
      Hstrok: "\u0126",
      hstrok: "\u0127",
      HumpDownHump: "\u224E",
      HumpEqual: "\u224F",
      hybull: "\u2043",
      hyphen: "\u2010",
      Iacute: "\xCD",
      iacute: "\xED",
      ic: "\u2063",
      Icirc: "\xCE",
      icirc: "\xEE",
      Icy: "\u0418",
      icy: "\u0438",
      Idot: "\u0130",
      IEcy: "\u0415",
      iecy: "\u0435",
      iexcl: "\xA1",
      iff: "\u21D4",
      Ifr: "\u2111",
      ifr: "\u{1D526}",
      Igrave: "\xCC",
      igrave: "\xEC",
      ii: "\u2148",
      iiiint: "\u2A0C",
      iiint: "\u222D",
      iinfin: "\u29DC",
      iiota: "\u2129",
      IJlig: "\u0132",
      ijlig: "\u0133",
      Im: "\u2111",
      Imacr: "\u012A",
      imacr: "\u012B",
      image: "\u2111",
      ImaginaryI: "\u2148",
      imagline: "\u2110",
      imagpart: "\u2111",
      imath: "\u0131",
      imof: "\u22B7",
      imped: "\u01B5",
      Implies: "\u21D2",
      in: "\u2208",
      incare: "\u2105",
      infin: "\u221E",
      infintie: "\u29DD",
      inodot: "\u0131",
      Int: "\u222C",
      int: "\u222B",
      intcal: "\u22BA",
      integers: "\u2124",
      Integral: "\u222B",
      intercal: "\u22BA",
      Intersection: "\u22C2",
      intlarhk: "\u2A17",
      intprod: "\u2A3C",
      InvisibleComma: "\u2063",
      InvisibleTimes: "\u2062",
      IOcy: "\u0401",
      iocy: "\u0451",
      Iogon: "\u012E",
      iogon: "\u012F",
      Iopf: "\u{1D540}",
      iopf: "\u{1D55A}",
      Iota: "\u0399",
      iota: "\u03B9",
      iprod: "\u2A3C",
      iquest: "\xBF",
      Iscr: "\u2110",
      iscr: "\u{1D4BE}",
      isin: "\u2208",
      isindot: "\u22F5",
      isinE: "\u22F9",
      isins: "\u22F4",
      isinsv: "\u22F3",
      isinv: "\u2208",
      it: "\u2062",
      Itilde: "\u0128",
      itilde: "\u0129",
      Iukcy: "\u0406",
      iukcy: "\u0456",
      Iuml: "\xCF",
      iuml: "\xEF",
      Jcirc: "\u0134",
      jcirc: "\u0135",
      Jcy: "\u0419",
      jcy: "\u0439",
      Jfr: "\u{1D50D}",
      jfr: "\u{1D527}",
      jmath: "\u0237",
      Jopf: "\u{1D541}",
      jopf: "\u{1D55B}",
      Jscr: "\u{1D4A5}",
      jscr: "\u{1D4BF}",
      Jsercy: "\u0408",
      jsercy: "\u0458",
      Jukcy: "\u0404",
      jukcy: "\u0454",
      Kappa: "\u039A",
      kappa: "\u03BA",
      kappav: "\u03F0",
      Kcedil: "\u0136",
      kcedil: "\u0137",
      Kcy: "\u041A",
      kcy: "\u043A",
      Kfr: "\u{1D50E}",
      kfr: "\u{1D528}",
      kgreen: "\u0138",
      KHcy: "\u0425",
      khcy: "\u0445",
      KJcy: "\u040C",
      kjcy: "\u045C",
      Kopf: "\u{1D542}",
      kopf: "\u{1D55C}",
      Kscr: "\u{1D4A6}",
      kscr: "\u{1D4C0}",
      lAarr: "\u21DA",
      Lacute: "\u0139",
      lacute: "\u013A",
      laemptyv: "\u29B4",
      lagran: "\u2112",
      Lambda: "\u039B",
      lambda: "\u03BB",
      Lang: "\u27EA",
      lang: "\u27E8",
      langd: "\u2991",
      langle: "\u27E8",
      lap: "\u2A85",
      Laplacetrf: "\u2112",
      laquo: "\xAB",
      Larr: "\u219E",
      lArr: "\u21D0",
      larr: "\u2190",
      larrb: "\u21E4",
      larrbfs: "\u291F",
      larrfs: "\u291D",
      larrhk: "\u21A9",
      larrlp: "\u21AB",
      larrpl: "\u2939",
      larrsim: "\u2973",
      larrtl: "\u21A2",
      lat: "\u2AAB",
      lAtail: "\u291B",
      latail: "\u2919",
      late: "\u2AAD",
      lates: "\u2AAD\uFE00",
      lBarr: "\u290E",
      lbarr: "\u290C",
      lbbrk: "\u2772",
      lbrace: "{",
      lbrack: "[",
      lbrke: "\u298B",
      lbrksld: "\u298F",
      lbrkslu: "\u298D",
      Lcaron: "\u013D",
      lcaron: "\u013E",
      Lcedil: "\u013B",
      lcedil: "\u013C",
      lceil: "\u2308",
      lcub: "{",
      Lcy: "\u041B",
      lcy: "\u043B",
      ldca: "\u2936",
      ldquo: "\u201C",
      ldquor: "\u201E",
      ldrdhar: "\u2967",
      ldrushar: "\u294B",
      ldsh: "\u21B2",
      lE: "\u2266",
      le: "\u2264",
      LeftAngleBracket: "\u27E8",
      LeftArrow: "\u2190",
      Leftarrow: "\u21D0",
      leftarrow: "\u2190",
      LeftArrowBar: "\u21E4",
      LeftArrowRightArrow: "\u21C6",
      leftarrowtail: "\u21A2",
      LeftCeiling: "\u2308",
      LeftDoubleBracket: "\u27E6",
      LeftDownTeeVector: "\u2961",
      LeftDownVector: "\u21C3",
      LeftDownVectorBar: "\u2959",
      LeftFloor: "\u230A",
      leftharpoondown: "\u21BD",
      leftharpoonup: "\u21BC",
      leftleftarrows: "\u21C7",
      LeftRightArrow: "\u2194",
      Leftrightarrow: "\u21D4",
      leftrightarrow: "\u2194",
      leftrightarrows: "\u21C6",
      leftrightharpoons: "\u21CB",
      leftrightsquigarrow: "\u21AD",
      LeftRightVector: "\u294E",
      LeftTee: "\u22A3",
      LeftTeeArrow: "\u21A4",
      LeftTeeVector: "\u295A",
      leftthreetimes: "\u22CB",
      LeftTriangle: "\u22B2",
      LeftTriangleBar: "\u29CF",
      LeftTriangleEqual: "\u22B4",
      LeftUpDownVector: "\u2951",
      LeftUpTeeVector: "\u2960",
      LeftUpVector: "\u21BF",
      LeftUpVectorBar: "\u2958",
      LeftVector: "\u21BC",
      LeftVectorBar: "\u2952",
      lEg: "\u2A8B",
      leg: "\u22DA",
      leq: "\u2264",
      leqq: "\u2266",
      leqslant: "\u2A7D",
      les: "\u2A7D",
      lescc: "\u2AA8",
      lesdot: "\u2A7F",
      lesdoto: "\u2A81",
      lesdotor: "\u2A83",
      lesg: "\u22DA\uFE00",
      lesges: "\u2A93",
      lessapprox: "\u2A85",
      lessdot: "\u22D6",
      lesseqgtr: "\u22DA",
      lesseqqgtr: "\u2A8B",
      LessEqualGreater: "\u22DA",
      LessFullEqual: "\u2266",
      LessGreater: "\u2276",
      lessgtr: "\u2276",
      LessLess: "\u2AA1",
      lesssim: "\u2272",
      LessSlantEqual: "\u2A7D",
      LessTilde: "\u2272",
      lfisht: "\u297C",
      lfloor: "\u230A",
      Lfr: "\u{1D50F}",
      lfr: "\u{1D529}",
      lg: "\u2276",
      lgE: "\u2A91",
      lHar: "\u2962",
      lhard: "\u21BD",
      lharu: "\u21BC",
      lharul: "\u296A",
      lhblk: "\u2584",
      LJcy: "\u0409",
      ljcy: "\u0459",
      Ll: "\u22D8",
      ll: "\u226A",
      llarr: "\u21C7",
      llcorner: "\u231E",
      Lleftarrow: "\u21DA",
      llhard: "\u296B",
      lltri: "\u25FA",
      Lmidot: "\u013F",
      lmidot: "\u0140",
      lmoust: "\u23B0",
      lmoustache: "\u23B0",
      lnap: "\u2A89",
      lnapprox: "\u2A89",
      lnE: "\u2268",
      lne: "\u2A87",
      lneq: "\u2A87",
      lneqq: "\u2268",
      lnsim: "\u22E6",
      loang: "\u27EC",
      loarr: "\u21FD",
      lobrk: "\u27E6",
      LongLeftArrow: "\u27F5",
      Longleftarrow: "\u27F8",
      longleftarrow: "\u27F5",
      LongLeftRightArrow: "\u27F7",
      Longleftrightarrow: "\u27FA",
      longleftrightarrow: "\u27F7",
      longmapsto: "\u27FC",
      LongRightArrow: "\u27F6",
      Longrightarrow: "\u27F9",
      longrightarrow: "\u27F6",
      looparrowleft: "\u21AB",
      looparrowright: "\u21AC",
      lopar: "\u2985",
      Lopf: "\u{1D543}",
      lopf: "\u{1D55D}",
      loplus: "\u2A2D",
      lotimes: "\u2A34",
      lowast: "\u2217",
      lowbar: "_",
      LowerLeftArrow: "\u2199",
      LowerRightArrow: "\u2198",
      loz: "\u25CA",
      lozenge: "\u25CA",
      lozf: "\u29EB",
      lpar: "(",
      lparlt: "\u2993",
      lrarr: "\u21C6",
      lrcorner: "\u231F",
      lrhar: "\u21CB",
      lrhard: "\u296D",
      lrm: "\u200E",
      lrtri: "\u22BF",
      lsaquo: "\u2039",
      Lscr: "\u2112",
      lscr: "\u{1D4C1}",
      Lsh: "\u21B0",
      lsh: "\u21B0",
      lsim: "\u2272",
      lsime: "\u2A8D",
      lsimg: "\u2A8F",
      lsqb: "[",
      lsquo: "\u2018",
      lsquor: "\u201A",
      Lstrok: "\u0141",
      lstrok: "\u0142",
      Lt: "\u226A",
      LT: "<",
      lt: "<",
      ltcc: "\u2AA6",
      ltcir: "\u2A79",
      ltdot: "\u22D6",
      lthree: "\u22CB",
      ltimes: "\u22C9",
      ltlarr: "\u2976",
      ltquest: "\u2A7B",
      ltri: "\u25C3",
      ltrie: "\u22B4",
      ltrif: "\u25C2",
      ltrPar: "\u2996",
      lurdshar: "\u294A",
      luruhar: "\u2966",
      lvertneqq: "\u2268\uFE00",
      lvnE: "\u2268\uFE00",
      macr: "\xAF",
      male: "\u2642",
      malt: "\u2720",
      maltese: "\u2720",
      Map: "\u2905",
      map: "\u21A6",
      mapsto: "\u21A6",
      mapstodown: "\u21A7",
      mapstoleft: "\u21A4",
      mapstoup: "\u21A5",
      marker: "\u25AE",
      mcomma: "\u2A29",
      Mcy: "\u041C",
      mcy: "\u043C",
      mdash: "\u2014",
      mDDot: "\u223A",
      measuredangle: "\u2221",
      MediumSpace: "\u205F",
      Mellintrf: "\u2133",
      Mfr: "\u{1D510}",
      mfr: "\u{1D52A}",
      mho: "\u2127",
      micro: "\xB5",
      mid: "\u2223",
      midast: "*",
      midcir: "\u2AF0",
      middot: "\xB7",
      minus: "\u2212",
      minusb: "\u229F",
      minusd: "\u2238",
      minusdu: "\u2A2A",
      MinusPlus: "\u2213",
      mlcp: "\u2ADB",
      mldr: "\u2026",
      mnplus: "\u2213",
      models: "\u22A7",
      Mopf: "\u{1D544}",
      mopf: "\u{1D55E}",
      mp: "\u2213",
      Mscr: "\u2133",
      mscr: "\u{1D4C2}",
      mstpos: "\u223E",
      Mu: "\u039C",
      mu: "\u03BC",
      multimap: "\u22B8",
      mumap: "\u22B8",
      nabla: "\u2207",
      Nacute: "\u0143",
      nacute: "\u0144",
      nang: "\u2220\u20D2",
      nap: "\u2249",
      napE: "\u2A70\u0338",
      napid: "\u224B\u0338",
      napos: "\u0149",
      napprox: "\u2249",
      natur: "\u266E",
      natural: "\u266E",
      naturals: "\u2115",
      nbsp: "\xA0",
      nbump: "\u224E\u0338",
      nbumpe: "\u224F\u0338",
      ncap: "\u2A43",
      Ncaron: "\u0147",
      ncaron: "\u0148",
      Ncedil: "\u0145",
      ncedil: "\u0146",
      ncong: "\u2247",
      ncongdot: "\u2A6D\u0338",
      ncup: "\u2A42",
      Ncy: "\u041D",
      ncy: "\u043D",
      ndash: "\u2013",
      ne: "\u2260",
      nearhk: "\u2924",
      neArr: "\u21D7",
      nearr: "\u2197",
      nearrow: "\u2197",
      nedot: "\u2250\u0338",
      NegativeMediumSpace: "\u200B",
      NegativeThickSpace: "\u200B",
      NegativeThinSpace: "\u200B",
      NegativeVeryThinSpace: "\u200B",
      nequiv: "\u2262",
      nesear: "\u2928",
      nesim: "\u2242\u0338",
      NestedGreaterGreater: "\u226B",
      NestedLessLess: "\u226A",
      NewLine: "\n",
      nexist: "\u2204",
      nexists: "\u2204",
      Nfr: "\u{1D511}",
      nfr: "\u{1D52B}",
      ngE: "\u2267\u0338",
      nge: "\u2271",
      ngeq: "\u2271",
      ngeqq: "\u2267\u0338",
      ngeqslant: "\u2A7E\u0338",
      nges: "\u2A7E\u0338",
      nGg: "\u22D9\u0338",
      ngsim: "\u2275",
      nGt: "\u226B\u20D2",
      ngt: "\u226F",
      ngtr: "\u226F",
      nGtv: "\u226B\u0338",
      nhArr: "\u21CE",
      nharr: "\u21AE",
      nhpar: "\u2AF2",
      ni: "\u220B",
      nis: "\u22FC",
      nisd: "\u22FA",
      niv: "\u220B",
      NJcy: "\u040A",
      njcy: "\u045A",
      nlArr: "\u21CD",
      nlarr: "\u219A",
      nldr: "\u2025",
      nlE: "\u2266\u0338",
      nle: "\u2270",
      nLeftarrow: "\u21CD",
      nleftarrow: "\u219A",
      nLeftrightarrow: "\u21CE",
      nleftrightarrow: "\u21AE",
      nleq: "\u2270",
      nleqq: "\u2266\u0338",
      nleqslant: "\u2A7D\u0338",
      nles: "\u2A7D\u0338",
      nless: "\u226E",
      nLl: "\u22D8\u0338",
      nlsim: "\u2274",
      nLt: "\u226A\u20D2",
      nlt: "\u226E",
      nltri: "\u22EA",
      nltrie: "\u22EC",
      nLtv: "\u226A\u0338",
      nmid: "\u2224",
      NoBreak: "\u2060",
      NonBreakingSpace: "\xA0",
      Nopf: "\u2115",
      nopf: "\u{1D55F}",
      Not: "\u2AEC",
      not: "\xAC",
      NotCongruent: "\u2262",
      NotCupCap: "\u226D",
      NotDoubleVerticalBar: "\u2226",
      NotElement: "\u2209",
      NotEqual: "\u2260",
      NotEqualTilde: "\u2242\u0338",
      NotExists: "\u2204",
      NotGreater: "\u226F",
      NotGreaterEqual: "\u2271",
      NotGreaterFullEqual: "\u2267\u0338",
      NotGreaterGreater: "\u226B\u0338",
      NotGreaterLess: "\u2279",
      NotGreaterSlantEqual: "\u2A7E\u0338",
      NotGreaterTilde: "\u2275",
      NotHumpDownHump: "\u224E\u0338",
      NotHumpEqual: "\u224F\u0338",
      notin: "\u2209",
      notindot: "\u22F5\u0338",
      notinE: "\u22F9\u0338",
      notinva: "\u2209",
      notinvb: "\u22F7",
      notinvc: "\u22F6",
      NotLeftTriangle: "\u22EA",
      NotLeftTriangleBar: "\u29CF\u0338",
      NotLeftTriangleEqual: "\u22EC",
      NotLess: "\u226E",
      NotLessEqual: "\u2270",
      NotLessGreater: "\u2278",
      NotLessLess: "\u226A\u0338",
      NotLessSlantEqual: "\u2A7D\u0338",
      NotLessTilde: "\u2274",
      NotNestedGreaterGreater: "\u2AA2\u0338",
      NotNestedLessLess: "\u2AA1\u0338",
      notni: "\u220C",
      notniva: "\u220C",
      notnivb: "\u22FE",
      notnivc: "\u22FD",
      NotPrecedes: "\u2280",
      NotPrecedesEqual: "\u2AAF\u0338",
      NotPrecedesSlantEqual: "\u22E0",
      NotReverseElement: "\u220C",
      NotRightTriangle: "\u22EB",
      NotRightTriangleBar: "\u29D0\u0338",
      NotRightTriangleEqual: "\u22ED",
      NotSquareSubset: "\u228F\u0338",
      NotSquareSubsetEqual: "\u22E2",
      NotSquareSuperset: "\u2290\u0338",
      NotSquareSupersetEqual: "\u22E3",
      NotSubset: "\u2282\u20D2",
      NotSubsetEqual: "\u2288",
      NotSucceeds: "\u2281",
      NotSucceedsEqual: "\u2AB0\u0338",
      NotSucceedsSlantEqual: "\u22E1",
      NotSucceedsTilde: "\u227F\u0338",
      NotSuperset: "\u2283\u20D2",
      NotSupersetEqual: "\u2289",
      NotTilde: "\u2241",
      NotTildeEqual: "\u2244",
      NotTildeFullEqual: "\u2247",
      NotTildeTilde: "\u2249",
      NotVerticalBar: "\u2224",
      npar: "\u2226",
      nparallel: "\u2226",
      nparsl: "\u2AFD\u20E5",
      npart: "\u2202\u0338",
      npolint: "\u2A14",
      npr: "\u2280",
      nprcue: "\u22E0",
      npre: "\u2AAF\u0338",
      nprec: "\u2280",
      npreceq: "\u2AAF\u0338",
      nrArr: "\u21CF",
      nrarr: "\u219B",
      nrarrc: "\u2933\u0338",
      nrarrw: "\u219D\u0338",
      nRightarrow: "\u21CF",
      nrightarrow: "\u219B",
      nrtri: "\u22EB",
      nrtrie: "\u22ED",
      nsc: "\u2281",
      nsccue: "\u22E1",
      nsce: "\u2AB0\u0338",
      Nscr: "\u{1D4A9}",
      nscr: "\u{1D4C3}",
      nshortmid: "\u2224",
      nshortparallel: "\u2226",
      nsim: "\u2241",
      nsime: "\u2244",
      nsimeq: "\u2244",
      nsmid: "\u2224",
      nspar: "\u2226",
      nsqsube: "\u22E2",
      nsqsupe: "\u22E3",
      nsub: "\u2284",
      nsubE: "\u2AC5\u0338",
      nsube: "\u2288",
      nsubset: "\u2282\u20D2",
      nsubseteq: "\u2288",
      nsubseteqq: "\u2AC5\u0338",
      nsucc: "\u2281",
      nsucceq: "\u2AB0\u0338",
      nsup: "\u2285",
      nsupE: "\u2AC6\u0338",
      nsupe: "\u2289",
      nsupset: "\u2283\u20D2",
      nsupseteq: "\u2289",
      nsupseteqq: "\u2AC6\u0338",
      ntgl: "\u2279",
      Ntilde: "\xD1",
      ntilde: "\xF1",
      ntlg: "\u2278",
      ntriangleleft: "\u22EA",
      ntrianglelefteq: "\u22EC",
      ntriangleright: "\u22EB",
      ntrianglerighteq: "\u22ED",
      Nu: "\u039D",
      nu: "\u03BD",
      num: "#",
      numero: "\u2116",
      numsp: "\u2007",
      nvap: "\u224D\u20D2",
      nVDash: "\u22AF",
      nVdash: "\u22AE",
      nvDash: "\u22AD",
      nvdash: "\u22AC",
      nvge: "\u2265\u20D2",
      nvgt: ">\u20D2",
      nvHarr: "\u2904",
      nvinfin: "\u29DE",
      nvlArr: "\u2902",
      nvle: "\u2264\u20D2",
      nvlt: "<\u20D2",
      nvltrie: "\u22B4\u20D2",
      nvrArr: "\u2903",
      nvrtrie: "\u22B5\u20D2",
      nvsim: "\u223C\u20D2",
      nwarhk: "\u2923",
      nwArr: "\u21D6",
      nwarr: "\u2196",
      nwarrow: "\u2196",
      nwnear: "\u2927",
      Oacute: "\xD3",
      oacute: "\xF3",
      oast: "\u229B",
      ocir: "\u229A",
      Ocirc: "\xD4",
      ocirc: "\xF4",
      Ocy: "\u041E",
      ocy: "\u043E",
      odash: "\u229D",
      Odblac: "\u0150",
      odblac: "\u0151",
      odiv: "\u2A38",
      odot: "\u2299",
      odsold: "\u29BC",
      OElig: "\u0152",
      oelig: "\u0153",
      ofcir: "\u29BF",
      Ofr: "\u{1D512}",
      ofr: "\u{1D52C}",
      ogon: "\u02DB",
      Ograve: "\xD2",
      ograve: "\xF2",
      ogt: "\u29C1",
      ohbar: "\u29B5",
      ohm: "\u03A9",
      oint: "\u222E",
      olarr: "\u21BA",
      olcir: "\u29BE",
      olcross: "\u29BB",
      oline: "\u203E",
      olt: "\u29C0",
      Omacr: "\u014C",
      omacr: "\u014D",
      Omega: "\u03A9",
      omega: "\u03C9",
      Omicron: "\u039F",
      omicron: "\u03BF",
      omid: "\u29B6",
      ominus: "\u2296",
      Oopf: "\u{1D546}",
      oopf: "\u{1D560}",
      opar: "\u29B7",
      OpenCurlyDoubleQuote: "\u201C",
      OpenCurlyQuote: "\u2018",
      operp: "\u29B9",
      oplus: "\u2295",
      Or: "\u2A54",
      or: "\u2228",
      orarr: "\u21BB",
      ord: "\u2A5D",
      order: "\u2134",
      orderof: "\u2134",
      ordf: "\xAA",
      ordm: "\xBA",
      origof: "\u22B6",
      oror: "\u2A56",
      orslope: "\u2A57",
      orv: "\u2A5B",
      oS: "\u24C8",
      Oscr: "\u{1D4AA}",
      oscr: "\u2134",
      Oslash: "\xD8",
      oslash: "\xF8",
      osol: "\u2298",
      Otilde: "\xD5",
      otilde: "\xF5",
      Otimes: "\u2A37",
      otimes: "\u2297",
      otimesas: "\u2A36",
      Ouml: "\xD6",
      ouml: "\xF6",
      ovbar: "\u233D",
      OverBar: "\u203E",
      OverBrace: "\u23DE",
      OverBracket: "\u23B4",
      OverParenthesis: "\u23DC",
      par: "\u2225",
      para: "\xB6",
      parallel: "\u2225",
      parsim: "\u2AF3",
      parsl: "\u2AFD",
      part: "\u2202",
      PartialD: "\u2202",
      Pcy: "\u041F",
      pcy: "\u043F",
      percnt: "%",
      period: ".",
      permil: "\u2030",
      perp: "\u22A5",
      pertenk: "\u2031",
      Pfr: "\u{1D513}",
      pfr: "\u{1D52D}",
      Phi: "\u03A6",
      phi: "\u03C6",
      phiv: "\u03D5",
      phmmat: "\u2133",
      phone: "\u260E",
      Pi: "\u03A0",
      pi: "\u03C0",
      pitchfork: "\u22D4",
      piv: "\u03D6",
      planck: "\u210F",
      planckh: "\u210E",
      plankv: "\u210F",
      plus: "+",
      plusacir: "\u2A23",
      plusb: "\u229E",
      pluscir: "\u2A22",
      plusdo: "\u2214",
      plusdu: "\u2A25",
      pluse: "\u2A72",
      PlusMinus: "\xB1",
      plusmn: "\xB1",
      plussim: "\u2A26",
      plustwo: "\u2A27",
      pm: "\xB1",
      Poincareplane: "\u210C",
      pointint: "\u2A15",
      Popf: "\u2119",
      popf: "\u{1D561}",
      pound: "\xA3",
      Pr: "\u2ABB",
      pr: "\u227A",
      prap: "\u2AB7",
      prcue: "\u227C",
      prE: "\u2AB3",
      pre: "\u2AAF",
      prec: "\u227A",
      precapprox: "\u2AB7",
      preccurlyeq: "\u227C",
      Precedes: "\u227A",
      PrecedesEqual: "\u2AAF",
      PrecedesSlantEqual: "\u227C",
      PrecedesTilde: "\u227E",
      preceq: "\u2AAF",
      precnapprox: "\u2AB9",
      precneqq: "\u2AB5",
      precnsim: "\u22E8",
      precsim: "\u227E",
      Prime: "\u2033",
      prime: "\u2032",
      primes: "\u2119",
      prnap: "\u2AB9",
      prnE: "\u2AB5",
      prnsim: "\u22E8",
      prod: "\u220F",
      Product: "\u220F",
      profalar: "\u232E",
      profline: "\u2312",
      profsurf: "\u2313",
      prop: "\u221D",
      Proportion: "\u2237",
      Proportional: "\u221D",
      propto: "\u221D",
      prsim: "\u227E",
      prurel: "\u22B0",
      Pscr: "\u{1D4AB}",
      pscr: "\u{1D4C5}",
      Psi: "\u03A8",
      psi: "\u03C8",
      puncsp: "\u2008",
      Qfr: "\u{1D514}",
      qfr: "\u{1D52E}",
      qint: "\u2A0C",
      Qopf: "\u211A",
      qopf: "\u{1D562}",
      qprime: "\u2057",
      Qscr: "\u{1D4AC}",
      qscr: "\u{1D4C6}",
      quaternions: "\u210D",
      quatint: "\u2A16",
      quest: "?",
      questeq: "\u225F",
      QUOT: '"',
      quot: '"',
      rAarr: "\u21DB",
      race: "\u223D\u0331",
      Racute: "\u0154",
      racute: "\u0155",
      radic: "\u221A",
      raemptyv: "\u29B3",
      Rang: "\u27EB",
      rang: "\u27E9",
      rangd: "\u2992",
      range: "\u29A5",
      rangle: "\u27E9",
      raquo: "\xBB",
      Rarr: "\u21A0",
      rArr: "\u21D2",
      rarr: "\u2192",
      rarrap: "\u2975",
      rarrb: "\u21E5",
      rarrbfs: "\u2920",
      rarrc: "\u2933",
      rarrfs: "\u291E",
      rarrhk: "\u21AA",
      rarrlp: "\u21AC",
      rarrpl: "\u2945",
      rarrsim: "\u2974",
      Rarrtl: "\u2916",
      rarrtl: "\u21A3",
      rarrw: "\u219D",
      rAtail: "\u291C",
      ratail: "\u291A",
      ratio: "\u2236",
      rationals: "\u211A",
      RBarr: "\u2910",
      rBarr: "\u290F",
      rbarr: "\u290D",
      rbbrk: "\u2773",
      rbrace: "}",
      rbrack: "]",
      rbrke: "\u298C",
      rbrksld: "\u298E",
      rbrkslu: "\u2990",
      Rcaron: "\u0158",
      rcaron: "\u0159",
      Rcedil: "\u0156",
      rcedil: "\u0157",
      rceil: "\u2309",
      rcub: "}",
      Rcy: "\u0420",
      rcy: "\u0440",
      rdca: "\u2937",
      rdldhar: "\u2969",
      rdquo: "\u201D",
      rdquor: "\u201D",
      rdsh: "\u21B3",
      Re: "\u211C",
      real: "\u211C",
      realine: "\u211B",
      realpart: "\u211C",
      reals: "\u211D",
      rect: "\u25AD",
      REG: "\xAE",
      reg: "\xAE",
      ReverseElement: "\u220B",
      ReverseEquilibrium: "\u21CB",
      ReverseUpEquilibrium: "\u296F",
      rfisht: "\u297D",
      rfloor: "\u230B",
      Rfr: "\u211C",
      rfr: "\u{1D52F}",
      rHar: "\u2964",
      rhard: "\u21C1",
      rharu: "\u21C0",
      rharul: "\u296C",
      Rho: "\u03A1",
      rho: "\u03C1",
      rhov: "\u03F1",
      RightAngleBracket: "\u27E9",
      RightArrow: "\u2192",
      Rightarrow: "\u21D2",
      rightarrow: "\u2192",
      RightArrowBar: "\u21E5",
      RightArrowLeftArrow: "\u21C4",
      rightarrowtail: "\u21A3",
      RightCeiling: "\u2309",
      RightDoubleBracket: "\u27E7",
      RightDownTeeVector: "\u295D",
      RightDownVector: "\u21C2",
      RightDownVectorBar: "\u2955",
      RightFloor: "\u230B",
      rightharpoondown: "\u21C1",
      rightharpoonup: "\u21C0",
      rightleftarrows: "\u21C4",
      rightleftharpoons: "\u21CC",
      rightrightarrows: "\u21C9",
      rightsquigarrow: "\u219D",
      RightTee: "\u22A2",
      RightTeeArrow: "\u21A6",
      RightTeeVector: "\u295B",
      rightthreetimes: "\u22CC",
      RightTriangle: "\u22B3",
      RightTriangleBar: "\u29D0",
      RightTriangleEqual: "\u22B5",
      RightUpDownVector: "\u294F",
      RightUpTeeVector: "\u295C",
      RightUpVector: "\u21BE",
      RightUpVectorBar: "\u2954",
      RightVector: "\u21C0",
      RightVectorBar: "\u2953",
      ring: "\u02DA",
      risingdotseq: "\u2253",
      rlarr: "\u21C4",
      rlhar: "\u21CC",
      rlm: "\u200F",
      rmoust: "\u23B1",
      rmoustache: "\u23B1",
      rnmid: "\u2AEE",
      roang: "\u27ED",
      roarr: "\u21FE",
      robrk: "\u27E7",
      ropar: "\u2986",
      Ropf: "\u211D",
      ropf: "\u{1D563}",
      roplus: "\u2A2E",
      rotimes: "\u2A35",
      RoundImplies: "\u2970",
      rpar: ")",
      rpargt: "\u2994",
      rppolint: "\u2A12",
      rrarr: "\u21C9",
      Rrightarrow: "\u21DB",
      rsaquo: "\u203A",
      Rscr: "\u211B",
      rscr: "\u{1D4C7}",
      Rsh: "\u21B1",
      rsh: "\u21B1",
      rsqb: "]",
      rsquo: "\u2019",
      rsquor: "\u2019",
      rthree: "\u22CC",
      rtimes: "\u22CA",
      rtri: "\u25B9",
      rtrie: "\u22B5",
      rtrif: "\u25B8",
      rtriltri: "\u29CE",
      RuleDelayed: "\u29F4",
      ruluhar: "\u2968",
      rx: "\u211E",
      Sacute: "\u015A",
      sacute: "\u015B",
      sbquo: "\u201A",
      Sc: "\u2ABC",
      sc: "\u227B",
      scap: "\u2AB8",
      Scaron: "\u0160",
      scaron: "\u0161",
      sccue: "\u227D",
      scE: "\u2AB4",
      sce: "\u2AB0",
      Scedil: "\u015E",
      scedil: "\u015F",
      Scirc: "\u015C",
      scirc: "\u015D",
      scnap: "\u2ABA",
      scnE: "\u2AB6",
      scnsim: "\u22E9",
      scpolint: "\u2A13",
      scsim: "\u227F",
      Scy: "\u0421",
      scy: "\u0441",
      sdot: "\u22C5",
      sdotb: "\u22A1",
      sdote: "\u2A66",
      searhk: "\u2925",
      seArr: "\u21D8",
      searr: "\u2198",
      searrow: "\u2198",
      sect: "\xA7",
      semi: ";",
      seswar: "\u2929",
      setminus: "\u2216",
      setmn: "\u2216",
      sext: "\u2736",
      Sfr: "\u{1D516}",
      sfr: "\u{1D530}",
      sfrown: "\u2322",
      sharp: "\u266F",
      SHCHcy: "\u0429",
      shchcy: "\u0449",
      SHcy: "\u0428",
      shcy: "\u0448",
      ShortDownArrow: "\u2193",
      ShortLeftArrow: "\u2190",
      shortmid: "\u2223",
      shortparallel: "\u2225",
      ShortRightArrow: "\u2192",
      ShortUpArrow: "\u2191",
      shy: "\xAD",
      Sigma: "\u03A3",
      sigma: "\u03C3",
      sigmaf: "\u03C2",
      sigmav: "\u03C2",
      sim: "\u223C",
      simdot: "\u2A6A",
      sime: "\u2243",
      simeq: "\u2243",
      simg: "\u2A9E",
      simgE: "\u2AA0",
      siml: "\u2A9D",
      simlE: "\u2A9F",
      simne: "\u2246",
      simplus: "\u2A24",
      simrarr: "\u2972",
      slarr: "\u2190",
      SmallCircle: "\u2218",
      smallsetminus: "\u2216",
      smashp: "\u2A33",
      smeparsl: "\u29E4",
      smid: "\u2223",
      smile: "\u2323",
      smt: "\u2AAA",
      smte: "\u2AAC",
      smtes: "\u2AAC\uFE00",
      SOFTcy: "\u042C",
      softcy: "\u044C",
      sol: "/",
      solb: "\u29C4",
      solbar: "\u233F",
      Sopf: "\u{1D54A}",
      sopf: "\u{1D564}",
      spades: "\u2660",
      spadesuit: "\u2660",
      spar: "\u2225",
      sqcap: "\u2293",
      sqcaps: "\u2293\uFE00",
      sqcup: "\u2294",
      sqcups: "\u2294\uFE00",
      Sqrt: "\u221A",
      sqsub: "\u228F",
      sqsube: "\u2291",
      sqsubset: "\u228F",
      sqsubseteq: "\u2291",
      sqsup: "\u2290",
      sqsupe: "\u2292",
      sqsupset: "\u2290",
      sqsupseteq: "\u2292",
      squ: "\u25A1",
      Square: "\u25A1",
      square: "\u25A1",
      SquareIntersection: "\u2293",
      SquareSubset: "\u228F",
      SquareSubsetEqual: "\u2291",
      SquareSuperset: "\u2290",
      SquareSupersetEqual: "\u2292",
      SquareUnion: "\u2294",
      squarf: "\u25AA",
      squf: "\u25AA",
      srarr: "\u2192",
      Sscr: "\u{1D4AE}",
      sscr: "\u{1D4C8}",
      ssetmn: "\u2216",
      ssmile: "\u2323",
      sstarf: "\u22C6",
      Star: "\u22C6",
      star: "\u2606",
      starf: "\u2605",
      straightepsilon: "\u03F5",
      straightphi: "\u03D5",
      strns: "\xAF",
      Sub: "\u22D0",
      sub: "\u2282",
      subdot: "\u2ABD",
      subE: "\u2AC5",
      sube: "\u2286",
      subedot: "\u2AC3",
      submult: "\u2AC1",
      subnE: "\u2ACB",
      subne: "\u228A",
      subplus: "\u2ABF",
      subrarr: "\u2979",
      Subset: "\u22D0",
      subset: "\u2282",
      subseteq: "\u2286",
      subseteqq: "\u2AC5",
      SubsetEqual: "\u2286",
      subsetneq: "\u228A",
      subsetneqq: "\u2ACB",
      subsim: "\u2AC7",
      subsub: "\u2AD5",
      subsup: "\u2AD3",
      succ: "\u227B",
      succapprox: "\u2AB8",
      succcurlyeq: "\u227D",
      Succeeds: "\u227B",
      SucceedsEqual: "\u2AB0",
      SucceedsSlantEqual: "\u227D",
      SucceedsTilde: "\u227F",
      succeq: "\u2AB0",
      succnapprox: "\u2ABA",
      succneqq: "\u2AB6",
      succnsim: "\u22E9",
      succsim: "\u227F",
      SuchThat: "\u220B",
      Sum: "\u2211",
      sum: "\u2211",
      sung: "\u266A",
      Sup: "\u22D1",
      sup: "\u2283",
      sup1: "\xB9",
      sup2: "\xB2",
      sup3: "\xB3",
      supdot: "\u2ABE",
      supdsub: "\u2AD8",
      supE: "\u2AC6",
      supe: "\u2287",
      supedot: "\u2AC4",
      Superset: "\u2283",
      SupersetEqual: "\u2287",
      suphsol: "\u27C9",
      suphsub: "\u2AD7",
      suplarr: "\u297B",
      supmult: "\u2AC2",
      supnE: "\u2ACC",
      supne: "\u228B",
      supplus: "\u2AC0",
      Supset: "\u22D1",
      supset: "\u2283",
      supseteq: "\u2287",
      supseteqq: "\u2AC6",
      supsetneq: "\u228B",
      supsetneqq: "\u2ACC",
      supsim: "\u2AC8",
      supsub: "\u2AD4",
      supsup: "\u2AD6",
      swarhk: "\u2926",
      swArr: "\u21D9",
      swarr: "\u2199",
      swarrow: "\u2199",
      swnwar: "\u292A",
      szlig: "\xDF",
      Tab: "	",
      target: "\u2316",
      Tau: "\u03A4",
      tau: "\u03C4",
      tbrk: "\u23B4",
      Tcaron: "\u0164",
      tcaron: "\u0165",
      Tcedil: "\u0162",
      tcedil: "\u0163",
      Tcy: "\u0422",
      tcy: "\u0442",
      tdot: "\u20DB",
      telrec: "\u2315",
      Tfr: "\u{1D517}",
      tfr: "\u{1D531}",
      there4: "\u2234",
      Therefore: "\u2234",
      therefore: "\u2234",
      Theta: "\u0398",
      theta: "\u03B8",
      thetasym: "\u03D1",
      thetav: "\u03D1",
      thickapprox: "\u2248",
      thicksim: "\u223C",
      ThickSpace: "\u205F\u200A",
      thinsp: "\u2009",
      ThinSpace: "\u2009",
      thkap: "\u2248",
      thksim: "\u223C",
      THORN: "\xDE",
      thorn: "\xFE",
      Tilde: "\u223C",
      tilde: "\u02DC",
      TildeEqual: "\u2243",
      TildeFullEqual: "\u2245",
      TildeTilde: "\u2248",
      times: "\xD7",
      timesb: "\u22A0",
      timesbar: "\u2A31",
      timesd: "\u2A30",
      tint: "\u222D",
      toea: "\u2928",
      top: "\u22A4",
      topbot: "\u2336",
      topcir: "\u2AF1",
      Topf: "\u{1D54B}",
      topf: "\u{1D565}",
      topfork: "\u2ADA",
      tosa: "\u2929",
      tprime: "\u2034",
      TRADE: "\u2122",
      trade: "\u2122",
      triangle: "\u25B5",
      triangledown: "\u25BF",
      triangleleft: "\u25C3",
      trianglelefteq: "\u22B4",
      triangleq: "\u225C",
      triangleright: "\u25B9",
      trianglerighteq: "\u22B5",
      tridot: "\u25EC",
      trie: "\u225C",
      triminus: "\u2A3A",
      TripleDot: "\u20DB",
      triplus: "\u2A39",
      trisb: "\u29CD",
      tritime: "\u2A3B",
      trpezium: "\u23E2",
      Tscr: "\u{1D4AF}",
      tscr: "\u{1D4C9}",
      TScy: "\u0426",
      tscy: "\u0446",
      TSHcy: "\u040B",
      tshcy: "\u045B",
      Tstrok: "\u0166",
      tstrok: "\u0167",
      twixt: "\u226C",
      twoheadleftarrow: "\u219E",
      twoheadrightarrow: "\u21A0",
      Uacute: "\xDA",
      uacute: "\xFA",
      Uarr: "\u219F",
      uArr: "\u21D1",
      uarr: "\u2191",
      Uarrocir: "\u2949",
      Ubrcy: "\u040E",
      ubrcy: "\u045E",
      Ubreve: "\u016C",
      ubreve: "\u016D",
      Ucirc: "\xDB",
      ucirc: "\xFB",
      Ucy: "\u0423",
      ucy: "\u0443",
      udarr: "\u21C5",
      Udblac: "\u0170",
      udblac: "\u0171",
      udhar: "\u296E",
      ufisht: "\u297E",
      Ufr: "\u{1D518}",
      ufr: "\u{1D532}",
      Ugrave: "\xD9",
      ugrave: "\xF9",
      uHar: "\u2963",
      uharl: "\u21BF",
      uharr: "\u21BE",
      uhblk: "\u2580",
      ulcorn: "\u231C",
      ulcorner: "\u231C",
      ulcrop: "\u230F",
      ultri: "\u25F8",
      Umacr: "\u016A",
      umacr: "\u016B",
      uml: "\xA8",
      UnderBar: "_",
      UnderBrace: "\u23DF",
      UnderBracket: "\u23B5",
      UnderParenthesis: "\u23DD",
      Union: "\u22C3",
      UnionPlus: "\u228E",
      Uogon: "\u0172",
      uogon: "\u0173",
      Uopf: "\u{1D54C}",
      uopf: "\u{1D566}",
      UpArrow: "\u2191",
      Uparrow: "\u21D1",
      uparrow: "\u2191",
      UpArrowBar: "\u2912",
      UpArrowDownArrow: "\u21C5",
      UpDownArrow: "\u2195",
      Updownarrow: "\u21D5",
      updownarrow: "\u2195",
      UpEquilibrium: "\u296E",
      upharpoonleft: "\u21BF",
      upharpoonright: "\u21BE",
      uplus: "\u228E",
      UpperLeftArrow: "\u2196",
      UpperRightArrow: "\u2197",
      Upsi: "\u03D2",
      upsi: "\u03C5",
      upsih: "\u03D2",
      Upsilon: "\u03A5",
      upsilon: "\u03C5",
      UpTee: "\u22A5",
      UpTeeArrow: "\u21A5",
      upuparrows: "\u21C8",
      urcorn: "\u231D",
      urcorner: "\u231D",
      urcrop: "\u230E",
      Uring: "\u016E",
      uring: "\u016F",
      urtri: "\u25F9",
      Uscr: "\u{1D4B0}",
      uscr: "\u{1D4CA}",
      utdot: "\u22F0",
      Utilde: "\u0168",
      utilde: "\u0169",
      utri: "\u25B5",
      utrif: "\u25B4",
      uuarr: "\u21C8",
      Uuml: "\xDC",
      uuml: "\xFC",
      uwangle: "\u29A7",
      vangrt: "\u299C",
      varepsilon: "\u03F5",
      varkappa: "\u03F0",
      varnothing: "\u2205",
      varphi: "\u03D5",
      varpi: "\u03D6",
      varpropto: "\u221D",
      vArr: "\u21D5",
      varr: "\u2195",
      varrho: "\u03F1",
      varsigma: "\u03C2",
      varsubsetneq: "\u228A\uFE00",
      varsubsetneqq: "\u2ACB\uFE00",
      varsupsetneq: "\u228B\uFE00",
      varsupsetneqq: "\u2ACC\uFE00",
      vartheta: "\u03D1",
      vartriangleleft: "\u22B2",
      vartriangleright: "\u22B3",
      Vbar: "\u2AEB",
      vBar: "\u2AE8",
      vBarv: "\u2AE9",
      Vcy: "\u0412",
      vcy: "\u0432",
      VDash: "\u22AB",
      Vdash: "\u22A9",
      vDash: "\u22A8",
      vdash: "\u22A2",
      Vdashl: "\u2AE6",
      Vee: "\u22C1",
      vee: "\u2228",
      veebar: "\u22BB",
      veeeq: "\u225A",
      vellip: "\u22EE",
      Verbar: "\u2016",
      verbar: "|",
      Vert: "\u2016",
      vert: "|",
      VerticalBar: "\u2223",
      VerticalLine: "|",
      VerticalSeparator: "\u2758",
      VerticalTilde: "\u2240",
      VeryThinSpace: "\u200A",
      Vfr: "\u{1D519}",
      vfr: "\u{1D533}",
      vltri: "\u22B2",
      vnsub: "\u2282\u20D2",
      vnsup: "\u2283\u20D2",
      Vopf: "\u{1D54D}",
      vopf: "\u{1D567}",
      vprop: "\u221D",
      vrtri: "\u22B3",
      Vscr: "\u{1D4B1}",
      vscr: "\u{1D4CB}",
      vsubnE: "\u2ACB\uFE00",
      vsubne: "\u228A\uFE00",
      vsupnE: "\u2ACC\uFE00",
      vsupne: "\u228B\uFE00",
      Vvdash: "\u22AA",
      vzigzag: "\u299A",
      Wcirc: "\u0174",
      wcirc: "\u0175",
      wedbar: "\u2A5F",
      Wedge: "\u22C0",
      wedge: "\u2227",
      wedgeq: "\u2259",
      weierp: "\u2118",
      Wfr: "\u{1D51A}",
      wfr: "\u{1D534}",
      Wopf: "\u{1D54E}",
      wopf: "\u{1D568}",
      wp: "\u2118",
      wr: "\u2240",
      wreath: "\u2240",
      Wscr: "\u{1D4B2}",
      wscr: "\u{1D4CC}",
      xcap: "\u22C2",
      xcirc: "\u25EF",
      xcup: "\u22C3",
      xdtri: "\u25BD",
      Xfr: "\u{1D51B}",
      xfr: "\u{1D535}",
      xhArr: "\u27FA",
      xharr: "\u27F7",
      Xi: "\u039E",
      xi: "\u03BE",
      xlArr: "\u27F8",
      xlarr: "\u27F5",
      xmap: "\u27FC",
      xnis: "\u22FB",
      xodot: "\u2A00",
      Xopf: "\u{1D54F}",
      xopf: "\u{1D569}",
      xoplus: "\u2A01",
      xotime: "\u2A02",
      xrArr: "\u27F9",
      xrarr: "\u27F6",
      Xscr: "\u{1D4B3}",
      xscr: "\u{1D4CD}",
      xsqcup: "\u2A06",
      xuplus: "\u2A04",
      xutri: "\u25B3",
      xvee: "\u22C1",
      xwedge: "\u22C0",
      Yacute: "\xDD",
      yacute: "\xFD",
      YAcy: "\u042F",
      yacy: "\u044F",
      Ycirc: "\u0176",
      ycirc: "\u0177",
      Ycy: "\u042B",
      ycy: "\u044B",
      yen: "\xA5",
      Yfr: "\u{1D51C}",
      yfr: "\u{1D536}",
      YIcy: "\u0407",
      yicy: "\u0457",
      Yopf: "\u{1D550}",
      yopf: "\u{1D56A}",
      Yscr: "\u{1D4B4}",
      yscr: "\u{1D4CE}",
      YUcy: "\u042E",
      yucy: "\u044E",
      Yuml: "\u0178",
      yuml: "\xFF",
      Zacute: "\u0179",
      zacute: "\u017A",
      Zcaron: "\u017D",
      zcaron: "\u017E",
      Zcy: "\u0417",
      zcy: "\u0437",
      Zdot: "\u017B",
      zdot: "\u017C",
      zeetrf: "\u2128",
      ZeroWidthSpace: "\u200B",
      Zeta: "\u0396",
      zeta: "\u03B6",
      Zfr: "\u2128",
      zfr: "\u{1D537}",
      ZHcy: "\u0416",
      zhcy: "\u0436",
      zigrarr: "\u21DD",
      Zopf: "\u2124",
      zopf: "\u{1D56B}",
      Zscr: "\u{1D4B5}",
      zscr: "\u{1D4CF}",
      zwj: "\u200D",
      zwnj: "\u200C"
    });
    exports.entityMap = exports.HTML_ENTITIES;
  }
});

// node_modules/@xmldom/xmldom/lib/sax.js
var require_sax = __commonJS({
  "node_modules/@xmldom/xmldom/lib/sax.js"(exports) {
    "use strict";
    var conventions = require_conventions();
    var g2 = require_grammar();
    var errors = require_errors();
    var isHTMLEscapableRawTextElement = conventions.isHTMLEscapableRawTextElement;
    var isHTMLMimeType = conventions.isHTMLMimeType;
    var isHTMLRawTextElement = conventions.isHTMLRawTextElement;
    var hasOwn = conventions.hasOwn;
    var NAMESPACE = conventions.NAMESPACE;
    var ParseError = errors.ParseError;
    var DOMException2 = errors.DOMException;
    var S_TAG = 0;
    var S_ATTR = 1;
    var S_ATTR_SPACE = 2;
    var S_EQ = 3;
    var S_ATTR_NOQUOT_VALUE = 4;
    var S_ATTR_END = 5;
    var S_TAG_SPACE = 6;
    var S_TAG_CLOSE = 7;
    function XMLReader() {
    }
    XMLReader.prototype = {
      parse: function(source, defaultNSMap, entityMap) {
        var domBuilder = this.domBuilder;
        domBuilder.startDocument();
        _copy(defaultNSMap, defaultNSMap = /* @__PURE__ */ Object.create(null));
        parse2(source, defaultNSMap, entityMap, domBuilder, this.errorHandler);
        domBuilder.endDocument();
      }
    };
    var ENTITY_REG = /&#?\w+;?/g;
    function parse2(source, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
      var isHTML = isHTMLMimeType(domBuilder.mimeType);
      if (source.indexOf(g2.UNICODE_REPLACEMENT_CHARACTER) >= 0) {
        errorHandler.warning("Unicode replacement character detected, source encoding issues?");
      }
      function fixedFromCharCode(code) {
        if (code > 65535) {
          code -= 65536;
          var surrogate1 = 55296 + (code >> 10), surrogate2 = 56320 + (code & 1023);
          return String.fromCharCode(surrogate1, surrogate2);
        } else {
          return String.fromCharCode(code);
        }
      }
      function entityReplacer(a3) {
        var complete = a3[a3.length - 1] === ";" ? a3 : a3 + ";";
        if (!isHTML && complete !== a3) {
          errorHandler.error("EntityRef: expecting ;");
          return a3;
        }
        var match = g2.Reference.exec(complete);
        if (!match || match[0].length !== complete.length) {
          errorHandler.error("entity not matching Reference production: " + a3);
          return a3;
        }
        var k2 = complete.slice(1, -1);
        if (hasOwn(entityMap, k2)) {
          return entityMap[k2];
        } else if (k2.charAt(0) === "#") {
          return fixedFromCharCode(parseInt(k2.substring(1).replace("x", "0x")));
        } else {
          errorHandler.error("entity not found:" + a3);
          return a3;
        }
      }
      function appendText(end2) {
        if (end2 > start) {
          var xt2 = source.substring(start, end2).replace(ENTITY_REG, entityReplacer);
          locator && position(start);
          domBuilder.characters(xt2, 0, end2 - start);
          start = end2;
        }
      }
      var lineStart = 0;
      var lineEnd = 0;
      var linePattern = /\r\n?|\n|$/g;
      var locator = domBuilder.locator;
      function position(p2, m2) {
        while (p2 >= lineEnd && (m2 = linePattern.exec(source))) {
          lineStart = lineEnd;
          lineEnd = m2.index + m2[0].length;
          locator.lineNumber++;
        }
        locator.columnNumber = p2 - lineStart + 1;
      }
      var parseStack = [{ currentNSMap: defaultNSMapCopy }];
      var unclosedTags = [];
      var start = 0;
      while (true) {
        try {
          var tagStart = source.indexOf("<", start);
          if (tagStart < 0) {
            if (!isHTML && unclosedTags.length > 0) {
              return errorHandler.fatalError("unclosed xml tag(s): " + unclosedTags.join(", "));
            }
            if (!source.substring(start).match(/^\s*$/)) {
              var doc = domBuilder.doc;
              var text = doc.createTextNode(source.substring(start));
              if (doc.documentElement) {
                return errorHandler.error("Extra content at the end of the document");
              }
              doc.appendChild(text);
              domBuilder.currentElement = text;
            }
            return;
          }
          if (tagStart > start) {
            var fromSource = source.substring(start, tagStart);
            if (!isHTML && unclosedTags.length === 0) {
              fromSource = fromSource.replace(new RegExp(g2.S_OPT.source, "g"), "");
              fromSource && errorHandler.error("Unexpected content outside root element: '" + fromSource + "'");
            }
            appendText(tagStart);
          }
          switch (source.charAt(tagStart + 1)) {
            case "/":
              var end = source.indexOf(">", tagStart + 2);
              var tagNameRaw = source.substring(tagStart + 2, end > 0 ? end : void 0);
              if (!tagNameRaw) {
                return errorHandler.fatalError("end tag name missing");
              }
              var endTagNameStrict = g2.reg("^", g2.QName_group, g2.S_OPT, "$");
              var tagNameMatch = end > 0 && endTagNameStrict.exec(tagNameRaw);
              if (!tagNameMatch) {
                var leadingTagNameMatch = end > 0 && g2.reg("^", g2.QName_group).exec(tagNameRaw);
                if (isHTML && leadingTagNameMatch) {
                  errorHandler.warning('end tag name contains invalid trailing characters: "' + tagNameRaw + '"');
                  tagNameMatch = leadingTagNameMatch;
                } else if (
                  // Backward compatibility, remove this whole `else if` arm in the next breaking release
                  // (XML then falls through to the `fatalError` below, for a clean mode split: XML fatal,
                  // HTML warning). A valid end-tag name followed by a line break and trailing content was
                  // silently accepted while `reg` still used the `m` flag; re-adding `m` here matches exactly
                  // those inputs, kept recoverable and reported.
                  leadingTagNameMatch && new RegExp(endTagNameStrict.source, endTagNameStrict.flags + "m").test(tagNameRaw)
                ) {
                  errorHandler.error('end tag name is followed by a line break and trailing content: "' + tagNameRaw + '"');
                  tagNameMatch = leadingTagNameMatch;
                } else {
                  return errorHandler.fatalError('end tag name contains invalid characters: "' + tagNameRaw + '"');
                }
              }
              if (!domBuilder.currentElement && !domBuilder.doc.documentElement) {
                return;
              }
              var currentTagName = unclosedTags[unclosedTags.length - 1] || domBuilder.currentElement.tagName || domBuilder.doc.documentElement.tagName || "";
              if (currentTagName !== tagNameMatch[1]) {
                var tagNameLower = tagNameMatch[1].toLowerCase();
                if (!isHTML || currentTagName.toLowerCase() !== tagNameLower) {
                  return errorHandler.fatalError('Opening and ending tag mismatch: "' + currentTagName + '" != "' + tagNameRaw + '"');
                }
              }
              var config = parseStack.pop();
              unclosedTags.pop();
              var localNSMap = config.localNSMap;
              domBuilder.endElement(config.uri, config.localName, currentTagName);
              if (localNSMap) {
                for (var prefix in localNSMap) {
                  if (hasOwn(localNSMap, prefix)) {
                    domBuilder.endPrefixMapping(prefix);
                  }
                }
              }
              end++;
              break;
            // end element
            case "?":
              locator && position(tagStart);
              end = parseProcessingInstruction(source, tagStart, domBuilder, errorHandler);
              break;
            case "!":
              locator && position(tagStart);
              end = parseDoctypeCommentOrCData(source, tagStart, domBuilder, errorHandler, isHTML);
              break;
            default:
              locator && position(tagStart);
              var el2 = new ElementAttributes();
              var currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
              var end = parseElementStartPart(source, tagStart, el2, currentNSMap, entityReplacer, errorHandler, isHTML);
              var len = el2.length;
              if (!el2.closed) {
                if (isHTML && conventions.isHTMLVoidElement(el2.tagName)) {
                  el2.closed = true;
                } else {
                  unclosedTags.push(el2.tagName);
                }
              }
              if (locator && len) {
                var locator2 = copyLocator(locator, {});
                for (var i2 = 0; i2 < len; i2++) {
                  var a2 = el2[i2];
                  position(a2.offset);
                  a2.locator = copyLocator(locator, {});
                }
                domBuilder.locator = locator2;
                if (appendElement(el2, domBuilder, currentNSMap)) {
                  parseStack.push(el2);
                }
                domBuilder.locator = locator;
              } else {
                if (appendElement(el2, domBuilder, currentNSMap)) {
                  parseStack.push(el2);
                }
              }
              if (isHTML && !el2.closed) {
                end = parseHtmlSpecialContent(source, end, el2.tagName, entityReplacer, domBuilder);
              } else {
                end++;
              }
          }
        } catch (e3) {
          if (e3 instanceof ParseError) {
            throw e3;
          } else if (e3 instanceof DOMException2) {
            return errorHandler.fatalError("Error constructing the DOM: " + e3.name + ": " + e3.message, e3);
          }
          errorHandler.error("element parse error: " + e3);
          end = -1;
        }
        if (end > start) {
          start = end;
        } else {
          appendText(Math.max(tagStart, start) + 1);
        }
      }
    }
    function copyLocator(f2, t2) {
      t2.lineNumber = f2.lineNumber;
      t2.columnNumber = f2.columnNumber;
      return t2;
    }
    function parseElementStartPart(source, start, el2, currentNSMap, entityReplacer, errorHandler, isHTML) {
      function addAttribute(qname, value2, startIndex) {
        if (hasOwn(el2.attributeNames, qname)) {
          return errorHandler.fatalError("Attribute " + qname + " redefined");
        }
        if (!isHTML && value2.indexOf("<") >= 0) {
          return errorHandler.fatalError("Unescaped '<' not allowed in attributes values");
        }
        el2.addValue(
          qname,
          // @see https://www.w3.org/TR/xml/#AVNormalize
          // since the xmldom sax parser does not "interpret" DTD the following is not implemented:
          // - recursive replacement of (DTD) entity references
          // - trimming and collapsing multiple spaces into a single one for attributes that are not of type CDATA
          value2.replace(/[\t\n\r]/g, " ").replace(ENTITY_REG, entityReplacer),
          startIndex
        );
      }
      var attrName;
      var value;
      var p2 = ++start;
      var s2 = S_TAG;
      while (true) {
        var c2 = source.charAt(p2);
        if (s2 === S_TAG && c2 === "<") {
          throw new Error("unexpected < in tag name: " + source.slice(start, p2));
        }
        switch (c2) {
          case "=":
            if (s2 === S_ATTR) {
              attrName = source.slice(start, p2);
              s2 = S_EQ;
            } else if (s2 === S_ATTR_SPACE) {
              s2 = S_EQ;
            } else {
              throw new Error("attribute equal must after attrName");
            }
            break;
          case "'":
          case '"':
            if (s2 === S_EQ || s2 === S_ATTR) {
              if (s2 === S_ATTR) {
                errorHandler.warning('attribute value must after "="');
                attrName = source.slice(start, p2);
              }
              start = p2 + 1;
              p2 = source.indexOf(c2, start);
              if (p2 > 0) {
                value = source.slice(start, p2);
                addAttribute(attrName, value, start - 1);
                s2 = S_ATTR_END;
              } else {
                throw new Error("attribute value no end '" + c2 + "' match");
              }
            } else if (s2 == S_ATTR_NOQUOT_VALUE) {
              value = source.slice(start, p2);
              addAttribute(attrName, value, start);
              errorHandler.warning('attribute "' + attrName + '" missed start quot(' + c2 + ")!!");
              start = p2 + 1;
              s2 = S_ATTR_END;
            } else {
              throw new Error('attribute value must after "="');
            }
            break;
          case "/":
            switch (s2) {
              case S_TAG:
                el2.setTagName(source.slice(start, p2));
              case S_ATTR_END:
              case S_TAG_SPACE:
              case S_TAG_CLOSE:
                s2 = S_TAG_CLOSE;
                el2.closed = true;
              case S_ATTR_NOQUOT_VALUE:
              case S_ATTR:
                break;
              case S_ATTR_SPACE:
                el2.closed = true;
                break;
              //case S_EQ:
              default:
                throw new Error("attribute invalid close char('/')");
            }
            break;
          case "":
            errorHandler.error("unexpected end of input");
            if (s2 == S_TAG) {
              el2.setTagName(source.slice(start, p2));
            }
            return p2;
          case ">":
            switch (s2) {
              case S_TAG:
                el2.setTagName(source.slice(start, p2));
              case S_ATTR_END:
              case S_TAG_SPACE:
              case S_TAG_CLOSE:
                break;
              //normal
              case S_ATTR_NOQUOT_VALUE:
              //Compatible state
              case S_ATTR:
                value = source.slice(start, p2);
                if (value.slice(-1) === "/") {
                  el2.closed = true;
                  value = value.slice(0, -1);
                }
              case S_ATTR_SPACE:
                if (s2 === S_ATTR_SPACE) {
                  value = attrName;
                }
                if (s2 == S_ATTR_NOQUOT_VALUE) {
                  errorHandler.warning('attribute "' + value + '" missed quot(")!');
                  addAttribute(attrName, value, start);
                } else {
                  if (!isHTML) {
                    errorHandler.warning('attribute "' + value + '" missed value!! "' + value + '" instead!!');
                  }
                  addAttribute(value, value, start);
                }
                break;
              case S_EQ:
                if (!isHTML) {
                  return errorHandler.fatalError(`AttValue: ' or " expected`);
                }
            }
            return p2;
          /*xml space '\x20' | #x9 | #xD | #xA; */
          case "\x80":
            c2 = " ";
          default:
            if (c2 <= " ") {
              switch (s2) {
                case S_TAG:
                  el2.setTagName(source.slice(start, p2));
                  s2 = S_TAG_SPACE;
                  break;
                case S_ATTR:
                  attrName = source.slice(start, p2);
                  s2 = S_ATTR_SPACE;
                  break;
                case S_ATTR_NOQUOT_VALUE:
                  var value = source.slice(start, p2);
                  errorHandler.warning('attribute "' + value + '" missed quot(")!!');
                  addAttribute(attrName, value, start);
                case S_ATTR_END:
                  s2 = S_TAG_SPACE;
                  break;
              }
            } else {
              switch (s2) {
                //case S_TAG:void();break;
                //case S_ATTR:void();break;
                //case S_ATTR_NOQUOT_VALUE:void();break;
                case S_ATTR_SPACE:
                  if (!isHTML) {
                    errorHandler.warning('attribute "' + attrName + '" missed value!! "' + attrName + '" instead2!!');
                  }
                  addAttribute(attrName, attrName, start);
                  start = p2;
                  s2 = S_ATTR;
                  break;
                case S_ATTR_END:
                  errorHandler.warning('attribute space is required"' + attrName + '"!!');
                case S_TAG_SPACE:
                  s2 = S_ATTR;
                  start = p2;
                  break;
                case S_EQ:
                  s2 = S_ATTR_NOQUOT_VALUE;
                  start = p2;
                  break;
                case S_TAG_CLOSE:
                  throw new Error("elements closed character '/' and '>' must be connected to");
              }
            }
        }
        p2++;
      }
    }
    function appendElement(el2, domBuilder, currentNSMap) {
      var tagName = el2.tagName;
      var localNSMap = null;
      var i2 = el2.length;
      while (i2--) {
        var a2 = el2[i2];
        var qName = a2.qName;
        var value = a2.value;
        var nsp = qName.indexOf(":");
        if (nsp > 0) {
          var prefix = a2.prefix = qName.slice(0, nsp);
          var localName = qName.slice(nsp + 1);
          var nsPrefix = prefix === "xmlns" && localName;
        } else {
          localName = qName;
          prefix = null;
          nsPrefix = qName === "xmlns" && "";
        }
        a2.localName = localName;
        if (nsPrefix !== false) {
          if (localNSMap == null) {
            localNSMap = /* @__PURE__ */ Object.create(null);
            currentNSMap = Object.create(currentNSMap);
          }
          currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
          a2.uri = NAMESPACE.XMLNS;
          domBuilder.startPrefixMapping(nsPrefix, value);
        }
      }
      var i2 = el2.length;
      while (i2--) {
        a2 = el2[i2];
        if (a2.prefix) {
          if (a2.prefix === "xml") {
            a2.uri = NAMESPACE.XML;
          }
          if (a2.prefix !== "xmlns") {
            a2.uri = currentNSMap[a2.prefix];
          }
        }
      }
      var nsp = tagName.indexOf(":");
      if (nsp > 0) {
        prefix = el2.prefix = tagName.slice(0, nsp);
        localName = el2.localName = tagName.slice(nsp + 1);
      } else {
        prefix = null;
        localName = el2.localName = tagName;
      }
      var ns2 = el2.uri = currentNSMap[prefix || ""];
      domBuilder.startElement(ns2, localName, tagName, el2);
      if (el2.closed) {
        domBuilder.endElement(ns2, localName, tagName);
        if (localNSMap) {
          for (prefix in localNSMap) {
            if (hasOwn(localNSMap, prefix)) {
              domBuilder.endPrefixMapping(prefix);
            }
          }
        }
      } else {
        el2.currentNSMap = currentNSMap;
        el2.localNSMap = localNSMap;
        return true;
      }
    }
    function parseHtmlSpecialContent(source, elStartEnd, tagName, entityReplacer, domBuilder) {
      var isEscapableRaw = isHTMLEscapableRawTextElement(tagName);
      if (isEscapableRaw || isHTMLRawTextElement(tagName)) {
        var closeTag = new RegExp("</" + tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ">", "ig");
        closeTag.lastIndex = elStartEnd;
        var match = closeTag.exec(source);
        var elEndStart = match ? match.index : -1;
        if (elEndStart < 0) {
          return elStartEnd + 1;
        }
        var text = source.substring(elStartEnd + 1, elEndStart);
        if (isEscapableRaw) {
          text = text.replace(ENTITY_REG, entityReplacer);
        }
        domBuilder.characters(text, 0, text.length);
        return elEndStart;
      }
      return elStartEnd + 1;
    }
    function _copy(source, target) {
      for (var n2 in source) {
        if (hasOwn(source, n2)) {
          target[n2] = source[n2];
        }
      }
    }
    function parseUtils(source, start) {
      var index = start;
      function char(n2) {
        n2 = n2 || 0;
        return source.charAt(index + n2);
      }
      function skip(n2) {
        n2 = n2 || 1;
        index += n2;
      }
      function skipBlanks() {
        var blanks = 0;
        while (index < source.length) {
          var c2 = char();
          if (c2 !== " " && c2 !== "\n" && c2 !== "	" && c2 !== "\r") {
            return blanks;
          }
          blanks++;
          skip();
        }
        return -1;
      }
      function substringFromIndex() {
        return source.substring(index);
      }
      function substringStartsWith(text) {
        return source.substring(index, index + text.length) === text;
      }
      function substringStartsWithCaseInsensitive(text) {
        return source.substring(index, index + text.length).toUpperCase() === text.toUpperCase();
      }
      function getMatch(args) {
        var expr = g2.reg("^", args);
        var match = expr.exec(substringFromIndex());
        if (match) {
          skip(match[0].length);
          return match[0];
        }
        return null;
      }
      return {
        char,
        getIndex: function() {
          return index;
        },
        getMatch,
        getSource: function() {
          return source;
        },
        skip,
        skipBlanks,
        substringFromIndex,
        substringStartsWith,
        substringStartsWithCaseInsensitive
      };
    }
    function parseDoctypeInternalSubset(p2, errorHandler) {
      function parsePI(p3, errorHandler2) {
        var match = g2.PI.exec(p3.substringFromIndex());
        if (!match) {
          return errorHandler2.fatalError("processing instruction is not well-formed at position " + p3.getIndex());
        }
        if (match[1].toLowerCase() === "xml") {
          return errorHandler2.fatalError(
            "xml declaration is only allowed at the start of the document, but found at position " + p3.getIndex()
          );
        }
        p3.skip(match[0].length);
        return match[0];
      }
      var source = p2.getSource();
      if (p2.char() === "[") {
        p2.skip(1);
        var intSubsetStart = p2.getIndex();
        while (p2.getIndex() < source.length) {
          p2.skipBlanks();
          if (p2.char() === "]") {
            var internalSubset = source.substring(intSubsetStart, p2.getIndex());
            p2.skip(1);
            return internalSubset;
          }
          var current = null;
          if (p2.char() === "<" && p2.char(1) === "!") {
            switch (p2.char(2)) {
              case "E":
                if (p2.char(3) === "L") {
                  current = p2.getMatch(g2.elementdecl);
                } else if (p2.char(3) === "N") {
                  current = p2.getMatch(g2.EntityDecl);
                }
                break;
              case "A":
                current = p2.getMatch(g2.AttlistDecl);
                break;
              case "N":
                current = p2.getMatch(g2.NotationDecl);
                break;
              case "-":
                current = p2.getMatch(g2.Comment);
                break;
            }
          } else if (p2.char() === "<" && p2.char(1) === "?") {
            current = parsePI(p2, errorHandler);
          } else if (p2.char() === "%") {
            current = p2.getMatch(g2.PEReference);
          } else {
            return errorHandler.fatalError("Error detected in Markup declaration");
          }
          if (!current) {
            return errorHandler.fatalError("Error in internal subset at position " + p2.getIndex());
          }
        }
        return errorHandler.fatalError("doctype internal subset is not well-formed, missing ]");
      }
    }
    function parseDoctypeCommentOrCData(source, start, domBuilder, errorHandler, isHTML) {
      var p2 = parseUtils(source, start);
      switch (isHTML ? p2.char(2).toUpperCase() : p2.char(2)) {
        case "-":
          var comment = p2.getMatch(g2.Comment);
          if (comment) {
            domBuilder.comment(comment, g2.COMMENT_START.length, comment.length - g2.COMMENT_START.length - g2.COMMENT_END.length);
            return p2.getIndex();
          } else {
            return errorHandler.fatalError("comment is not well-formed at position " + p2.getIndex());
          }
        case "[":
          var cdata = p2.getMatch(g2.CDSect);
          if (cdata) {
            if (!isHTML && !domBuilder.currentElement) {
              return errorHandler.fatalError("CDATA outside of element");
            }
            domBuilder.startCDATA();
            domBuilder.characters(cdata, g2.CDATA_START.length, cdata.length - g2.CDATA_START.length - g2.CDATA_END.length);
            domBuilder.endCDATA();
            return p2.getIndex();
          } else {
            return errorHandler.fatalError("Invalid CDATA starting at position " + start);
          }
        case "D": {
          if (domBuilder.doc && domBuilder.doc.documentElement) {
            return errorHandler.fatalError("Doctype not allowed inside or after documentElement at position " + p2.getIndex());
          }
          if (isHTML ? !p2.substringStartsWithCaseInsensitive(g2.DOCTYPE_DECL_START) : !p2.substringStartsWith(g2.DOCTYPE_DECL_START)) {
            return errorHandler.fatalError("Expected " + g2.DOCTYPE_DECL_START + " at position " + p2.getIndex());
          }
          p2.skip(g2.DOCTYPE_DECL_START.length);
          if (p2.skipBlanks() < 1) {
            return errorHandler.fatalError("Expected whitespace after " + g2.DOCTYPE_DECL_START + " at position " + p2.getIndex());
          }
          var doctype = {
            name: void 0,
            publicId: void 0,
            systemId: void 0,
            internalSubset: void 0
          };
          doctype.name = p2.getMatch(g2.Name);
          if (!doctype.name)
            return errorHandler.fatalError("doctype name missing or contains unexpected characters at position " + p2.getIndex());
          if (isHTML && doctype.name.toLowerCase() !== "html") {
            errorHandler.warning("Unexpected DOCTYPE in HTML document at position " + p2.getIndex());
          }
          p2.skipBlanks();
          if (p2.substringStartsWith(g2.PUBLIC) || p2.substringStartsWith(g2.SYSTEM)) {
            var match = g2.ExternalID_match.exec(p2.substringFromIndex());
            if (!match) {
              return errorHandler.fatalError("doctype external id is not well-formed at position " + p2.getIndex());
            }
            if (match.groups.SystemLiteralOnly !== void 0) {
              doctype.systemId = match.groups.SystemLiteralOnly;
            } else {
              doctype.systemId = match.groups.SystemLiteral;
              doctype.publicId = match.groups.PubidLiteral;
            }
            p2.skip(match[0].length);
          } else if (isHTML && p2.substringStartsWithCaseInsensitive(g2.SYSTEM)) {
            p2.skip(g2.SYSTEM.length);
            if (p2.skipBlanks() < 1) {
              return errorHandler.fatalError("Expected whitespace after " + g2.SYSTEM + " at position " + p2.getIndex());
            }
            doctype.systemId = p2.getMatch(g2.ABOUT_LEGACY_COMPAT_SystemLiteral);
            if (!doctype.systemId) {
              return errorHandler.fatalError(
                "Expected " + g2.ABOUT_LEGACY_COMPAT + " in single or double quotes after " + g2.SYSTEM + " at position " + p2.getIndex()
              );
            }
          }
          if (isHTML && doctype.systemId && !g2.ABOUT_LEGACY_COMPAT_SystemLiteral.test(doctype.systemId)) {
            errorHandler.warning("Unexpected doctype.systemId in HTML document at position " + p2.getIndex());
          }
          if (!isHTML) {
            p2.skipBlanks();
            doctype.internalSubset = parseDoctypeInternalSubset(p2, errorHandler);
          }
          p2.skipBlanks();
          if (p2.char() !== ">") {
            return errorHandler.fatalError("doctype not terminated with > at position " + p2.getIndex());
          }
          p2.skip(1);
          domBuilder.startDTD(doctype.name, doctype.publicId, doctype.systemId, doctype.internalSubset);
          domBuilder.endDTD();
          return p2.getIndex();
        }
        default:
          return errorHandler.fatalError('Not well-formed XML starting with "<!" at position ' + start);
      }
    }
    function parseProcessingInstruction(source, start, domBuilder, errorHandler) {
      var match = source.substring(start).match(g2.PI);
      if (!match) {
        return errorHandler.fatalError("Invalid processing instruction starting at position " + start);
      }
      if (match[1].toLowerCase() === "xml") {
        if (start > 0) {
          return errorHandler.fatalError(
            "processing instruction at position " + start + " is an xml declaration which is only at the start of the document"
          );
        }
        if (!g2.XMLDecl.test(source.substring(start))) {
          return errorHandler.fatalError("xml declaration is not well-formed");
        }
      }
      domBuilder.processingInstruction(match[1], match[2]);
      return start + match[0].length;
    }
    function ElementAttributes() {
      this.attributeNames = /* @__PURE__ */ Object.create(null);
    }
    ElementAttributes.prototype = {
      setTagName: function(tagName) {
        if (!g2.QName_exact.test(tagName)) {
          throw new Error("invalid tagName:" + tagName);
        }
        this.tagName = tagName;
      },
      addValue: function(qName, value, offset) {
        if (!g2.QName_exact.test(qName)) {
          throw new Error("invalid attribute:" + qName);
        }
        this.attributeNames[qName] = this.length;
        this[this.length++] = { qName, value, offset };
      },
      length: 0,
      getLocalName: function(i2) {
        return this[i2].localName;
      },
      getLocator: function(i2) {
        return this[i2].locator;
      },
      getQName: function(i2) {
        return this[i2].qName;
      },
      getURI: function(i2) {
        return this[i2].uri;
      },
      getValue: function(i2) {
        return this[i2].value;
      }
      //	,getIndex:function(uri, localName)){
      //		if(localName){
      //
      //		}else{
      //			var qName = uri
      //		}
      //	},
      //	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
      //	getType:function(uri,localName){}
      //	getType:function(i){},
    };
    exports.XMLReader = XMLReader;
    exports.parseUtils = parseUtils;
    exports.parseDoctypeCommentOrCData = parseDoctypeCommentOrCData;
  }
});

// node_modules/@xmldom/xmldom/lib/dom-parser.js
var require_dom_parser = __commonJS({
  "node_modules/@xmldom/xmldom/lib/dom-parser.js"(exports) {
    "use strict";
    var conventions = require_conventions();
    var dom = require_dom();
    var errors = require_errors();
    var entities = require_entities();
    var sax = require_sax();
    var DOMImplementation = dom.DOMImplementation;
    var hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
    var isHTMLMimeType = conventions.isHTMLMimeType;
    var isValidMimeType = conventions.isValidMimeType;
    var MIME_TYPE = conventions.MIME_TYPE;
    var NAMESPACE = conventions.NAMESPACE;
    var ParseError = errors.ParseError;
    var XMLReader = sax.XMLReader;
    function normalizeLineEndings(input) {
      return input.replace(/\r[\n\u0085]/g, "\n").replace(/[\r\u0085\u2028\u2029]/g, "\n");
    }
    function DOMParser2(options) {
      options = options || {};
      if (options.locator === void 0) {
        options.locator = true;
      }
      this.assign = options.assign || conventions.assign;
      this.domHandler = options.domHandler || DOMHandler;
      this.onError = options.onError || options.errorHandler;
      if (options.errorHandler && typeof options.errorHandler !== "function") {
        throw new TypeError("errorHandler object is no longer supported, switch to onError!");
      } else if (options.errorHandler) {
        options.errorHandler("warning", "The `errorHandler` option has been deprecated, use `onError` instead!", this);
      }
      this.normalizeLineEndings = options.normalizeLineEndings || normalizeLineEndings;
      this.locator = !!options.locator;
      this.xmlns = this.assign(/* @__PURE__ */ Object.create(null), options.xmlns);
    }
    DOMParser2.prototype.parseFromString = function(source, mimeType) {
      if (!isValidMimeType(mimeType)) {
        throw new TypeError('DOMParser.parseFromString: the provided mimeType "' + mimeType + '" is not valid.');
      }
      var defaultNSMap = this.assign(/* @__PURE__ */ Object.create(null), this.xmlns);
      var entityMap = entities.XML_ENTITIES;
      var defaultNamespace = defaultNSMap[""] || null;
      if (hasDefaultHTMLNamespace(mimeType)) {
        entityMap = entities.HTML_ENTITIES;
        defaultNamespace = NAMESPACE.HTML;
      } else if (mimeType === MIME_TYPE.XML_SVG_IMAGE) {
        defaultNamespace = NAMESPACE.SVG;
      }
      defaultNSMap[""] = defaultNamespace;
      defaultNSMap.xml = defaultNSMap.xml || NAMESPACE.XML;
      var domBuilder = new this.domHandler({
        mimeType,
        defaultNamespace,
        onError: this.onError
      });
      var locator = this.locator ? {} : void 0;
      if (this.locator) {
        domBuilder.setDocumentLocator(locator);
      }
      var sax2 = new XMLReader();
      sax2.errorHandler = domBuilder;
      sax2.domBuilder = domBuilder;
      var isXml = !conventions.isHTMLMimeType(mimeType);
      if (isXml && typeof source !== "string") {
        sax2.errorHandler.fatalError("source is not a string");
      }
      sax2.parse(this.normalizeLineEndings(String(source)), defaultNSMap, entityMap);
      if (!domBuilder.doc.documentElement) {
        sax2.errorHandler.fatalError("missing root element");
      }
      return domBuilder.doc;
    };
    function DOMHandler(options) {
      var opt = options || {};
      this.mimeType = opt.mimeType || MIME_TYPE.XML_APPLICATION;
      this.defaultNamespace = opt.defaultNamespace || null;
      this.cdata = false;
      this.currentElement = void 0;
      this.doc = void 0;
      this.locator = void 0;
      this.onError = opt.onError;
    }
    function position(locator, node) {
      node.lineNumber = locator.lineNumber;
      node.columnNumber = locator.columnNumber;
    }
    DOMHandler.prototype = {
      /**
       * Either creates an XML or an HTML document and stores it under `this.doc`.
       * If it is an XML document, `this.defaultNamespace` is used to create it,
       * and it will not contain any `childNodes`.
       * If it is an HTML document, it will be created without any `childNodes`.
       *
       * @see http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
       */
      startDocument: function() {
        var impl = new DOMImplementation();
        this.doc = isHTMLMimeType(this.mimeType) ? impl.createHTMLDocument(false) : impl.createDocument(this.defaultNamespace, "");
      },
      startElement: function(namespaceURI, localName, qName, attrs) {
        var doc = this.doc;
        var el2 = doc.createElementNS(namespaceURI, qName || localName);
        var len = attrs.length;
        appendElement(this, el2);
        this.currentElement = el2;
        this.locator && position(this.locator, el2);
        for (var i2 = 0; i2 < len; i2++) {
          var namespaceURI = attrs.getURI(i2);
          var value = attrs.getValue(i2);
          var qName = attrs.getQName(i2);
          var attr = doc.createAttributeNS(namespaceURI, qName);
          this.locator && position(attrs.getLocator(i2), attr);
          attr.value = attr.nodeValue = value;
          el2.setAttributeNode(attr);
        }
      },
      endElement: function(namespaceURI, localName, qName) {
        this.currentElement = this.currentElement.parentNode;
      },
      startPrefixMapping: function(prefix, uri) {
      },
      endPrefixMapping: function(prefix) {
      },
      processingInstruction: function(target, data) {
        var ins = this.doc.createProcessingInstruction(target, data);
        this.locator && position(this.locator, ins);
        appendElement(this, ins);
      },
      ignorableWhitespace: function(ch, start, length) {
      },
      characters: function(chars, start, length) {
        chars = _toString.apply(this, arguments);
        if (chars) {
          if (this.cdata) {
            var charNode = this.doc.createCDATASection(chars);
          } else {
            var charNode = this.doc.createTextNode(chars);
          }
          if (this.currentElement) {
            this.currentElement.appendChild(charNode);
          } else if (/^\s*$/.test(chars)) {
            this.doc.appendChild(charNode);
          }
          this.locator && position(this.locator, charNode);
        }
      },
      skippedEntity: function(name) {
      },
      endDocument: function() {
        this.doc.normalize();
      },
      /**
       * Stores the locator to be able to set the `columnNumber` and `lineNumber`
       * on the created DOM nodes.
       *
       * @param {Locator} locator
       */
      setDocumentLocator: function(locator) {
        if (locator) {
          locator.lineNumber = 0;
        }
        this.locator = locator;
      },
      //LexicalHandler
      comment: function(chars, start, length) {
        chars = _toString.apply(this, arguments);
        var comm = this.doc.createComment(chars);
        this.locator && position(this.locator, comm);
        appendElement(this, comm);
      },
      startCDATA: function() {
        this.cdata = true;
      },
      endCDATA: function() {
        this.cdata = false;
      },
      startDTD: function(name, publicId, systemId, internalSubset) {
        var impl = this.doc.implementation;
        if (impl && impl.createDocumentType) {
          var dt2 = impl.createDocumentType(name, publicId, systemId, internalSubset);
          this.locator && position(this.locator, dt2);
          appendElement(this, dt2);
          this.doc.doctype = dt2;
        }
      },
      reportError: function(level, message) {
        if (typeof this.onError === "function") {
          try {
            this.onError(level, message, this);
          } catch (e3) {
            throw new ParseError("Reporting " + level + ' "' + message + '" caused ' + e3, this.locator);
          }
        } else {
          console.error("[xmldom " + level + "]	" + message, _locator(this.locator));
        }
      },
      /**
       * @see http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
       */
      warning: function(message) {
        this.reportError("warning", message);
      },
      error: function(message) {
        this.reportError("error", message);
      },
      /**
       * This function reports a fatal error and throws a ParseError.
       *
       * @param {string} message
       * - The message to be used for reporting and throwing the error.
       * @param {Error} [cause]
       * The error that caused this fatal error, preserved as the thrown `ParseError`'s `cause`.
       * @returns {never}
       * This function always throws an error and never returns a value.
       * @throws {ParseError}
       * Always throws a ParseError with the provided message.
       */
      fatalError: function(message, cause) {
        this.reportError("fatalError", message);
        throw new ParseError(message, this.locator, cause);
      }
    };
    function _locator(l2) {
      if (l2) {
        return "\n@#[line:" + l2.lineNumber + ",col:" + l2.columnNumber + "]";
      }
    }
    function _toString(chars, start, length) {
      if (typeof chars == "string") {
        return chars.substr(start, length);
      } else {
        if (chars.length >= start + length || start) {
          return new java.lang.String(chars, start, length) + "";
        }
        return chars;
      }
    }
    "endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(
      /\w+/g,
      function(key) {
        DOMHandler.prototype[key] = function() {
          return null;
        };
      }
    );
    function appendElement(handler, node) {
      if (!handler.currentElement) {
        handler.doc.appendChild(node);
      } else {
        handler.currentElement.appendChild(node);
      }
    }
    function onErrorStopParsing(level) {
      if (level === "error") throw "onErrorStopParsing";
    }
    function onWarningStopParsing() {
      throw "onWarningStopParsing";
    }
    exports.__DOMHandler = DOMHandler;
    exports.DOMParser = DOMParser2;
    exports.normalizeLineEndings = normalizeLineEndings;
    exports.onErrorStopParsing = onErrorStopParsing;
    exports.onWarningStopParsing = onWarningStopParsing;
  }
});

// node_modules/@xmldom/xmldom/lib/index.js
var require_lib = __commonJS({
  "node_modules/@xmldom/xmldom/lib/index.js"(exports) {
    "use strict";
    var conventions = require_conventions();
    exports.assign = conventions.assign;
    exports.hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
    exports.isHTMLMimeType = conventions.isHTMLMimeType;
    exports.isValidMimeType = conventions.isValidMimeType;
    exports.MIME_TYPE = conventions.MIME_TYPE;
    exports.NAMESPACE = conventions.NAMESPACE;
    var errors = require_errors();
    exports.DOMException = errors.DOMException;
    exports.DOMExceptionName = errors.DOMExceptionName;
    exports.ExceptionCode = errors.ExceptionCode;
    exports.ParseError = errors.ParseError;
    var dom = require_dom();
    exports.Attr = dom.Attr;
    exports.CDATASection = dom.CDATASection;
    exports.CharacterData = dom.CharacterData;
    exports.Comment = dom.Comment;
    exports.Document = dom.Document;
    exports.DocumentFragment = dom.DocumentFragment;
    exports.DocumentType = dom.DocumentType;
    exports.DOMImplementation = dom.DOMImplementation;
    exports.Element = dom.Element;
    exports.Entity = dom.Entity;
    exports.EntityReference = dom.EntityReference;
    exports.LiveNodeList = dom.LiveNodeList;
    exports.NamedNodeMap = dom.NamedNodeMap;
    exports.Node = dom.Node;
    exports.NodeList = dom.NodeList;
    exports.Notation = dom.Notation;
    exports.ProcessingInstruction = dom.ProcessingInstruction;
    exports.Text = dom.Text;
    exports.XMLSerializer = dom.XMLSerializer;
    var domParser = require_dom_parser();
    exports.DOMParser = domParser.DOMParser;
    exports.normalizeLineEndings = domParser.normalizeLineEndings;
    exports.onErrorStopParsing = domParser.onErrorStopParsing;
    exports.onWarningStopParsing = domParser.onWarningStopParsing;
  }
});

// node_modules/xmlbuilder/lib/Utility.js
var require_Utility = __commonJS({
  "node_modules/xmlbuilder/lib/Utility.js"(exports, module) {
    (function() {
      var assign, getValue, isArray, isEmpty, isFunction, isObject, isPlainObject, hasProp = {}.hasOwnProperty;
      assign = function(target, ...sources) {
        var i2, key, len, source;
        if (isFunction(Object.assign)) {
          Object.assign.apply(null, arguments);
        } else {
          for (i2 = 0, len = sources.length; i2 < len; i2++) {
            source = sources[i2];
            if (source != null) {
              for (key in source) {
                if (!hasProp.call(source, key)) continue;
                target[key] = source[key];
              }
            }
          }
        }
        return target;
      };
      isFunction = function(val) {
        return !!val && Object.prototype.toString.call(val) === "[object Function]";
      };
      isObject = function(val) {
        var ref;
        return !!val && ((ref = typeof val) === "function" || ref === "object");
      };
      isArray = function(val) {
        if (isFunction(Array.isArray)) {
          return Array.isArray(val);
        } else {
          return Object.prototype.toString.call(val) === "[object Array]";
        }
      };
      isEmpty = function(val) {
        var key;
        if (isArray(val)) {
          return !val.length;
        } else {
          for (key in val) {
            if (!hasProp.call(val, key)) continue;
            return false;
          }
          return true;
        }
      };
      isPlainObject = function(val) {
        var ctor, proto;
        return isObject(val) && (proto = Object.getPrototypeOf(val)) && (ctor = proto.constructor) && typeof ctor === "function" && ctor instanceof ctor && Function.prototype.toString.call(ctor) === Function.prototype.toString.call(Object);
      };
      getValue = function(obj) {
        if (isFunction(obj.valueOf)) {
          return obj.valueOf();
        } else {
          return obj;
        }
      };
      module.exports.assign = assign;
      module.exports.isFunction = isFunction;
      module.exports.isObject = isObject;
      module.exports.isArray = isArray;
      module.exports.isEmpty = isEmpty;
      module.exports.isPlainObject = isPlainObject;
      module.exports.getValue = getValue;
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLDOMImplementation.js
var require_XMLDOMImplementation = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDOMImplementation.js"(exports, module) {
    (function() {
      var XMLDOMImplementation;
      module.exports = XMLDOMImplementation = class XMLDOMImplementation {
        // Tests if the DOM implementation implements a specific feature.
        // `feature` package name of the feature to test. In Level 1, the
        //           legal values are "HTML" and "XML" (case-insensitive).
        // `version` version number of the package name to test. 
        //           In Level 1, this is the string "1.0". If the version is 
        //           not specified, supporting any version of the feature will 
        //           cause the method to return true.
        hasFeature(feature, version) {
          return true;
        }
        // Creates a new document type declaration.
        // `qualifiedName` qualified name of the document type to be created
        // `publicId` public identifier of the external subset
        // `systemId` system identifier of the external subset
        createDocumentType(qualifiedName, publicId, systemId) {
          throw new Error("This DOM method is not implemented.");
        }
        // Creates a new document.
        // `namespaceURI` namespace URI of the document element to create
        // `qualifiedName` the qualified name of the document to be created
        // `doctype` the type of document to be created or null
        createDocument(namespaceURI, qualifiedName, doctype) {
          throw new Error("This DOM method is not implemented.");
        }
        // Creates a new HTML document.
        // `title` document title
        createHTMLDocument(title) {
          throw new Error("This DOM method is not implemented.");
        }
        // Returns a specialized object which implements the specialized APIs 
        // of the specified feature and version.
        // `feature` name of the feature requested.
        // `version` version number of the feature to test
        getFeature(feature, version) {
          throw new Error("This DOM method is not implemented.");
        }
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLDOMErrorHandler.js
var require_XMLDOMErrorHandler = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDOMErrorHandler.js"(exports, module) {
    (function() {
      var XMLDOMErrorHandler;
      module.exports = XMLDOMErrorHandler = class XMLDOMErrorHandler {
        // Initializes a new instance of `XMLDOMErrorHandler`
        constructor() {
        }
        // Called on the error handler when an error occurs.
        // `error` the error message as a string
        handleError(error) {
          throw new Error(error);
        }
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLDOMStringList.js
var require_XMLDOMStringList = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDOMStringList.js"(exports, module) {
    (function() {
      var XMLDOMStringList;
      module.exports = XMLDOMStringList = (function() {
        class XMLDOMStringList2 {
          // Initializes a new instance of `XMLDOMStringList`
          // This is just a wrapper around an ordinary
          // JS array.
          // `arr` the array of string values
          constructor(arr) {
            this.arr = arr || [];
          }
          // Returns the indexth item in the collection.
          // `index` index into the collection
          item(index) {
            return this.arr[index] || null;
          }
          // Test if a string is part of this DOMStringList.
          // `str` the string to look for
          contains(str) {
            return this.arr.indexOf(str) !== -1;
          }
        }
        ;
        Object.defineProperty(XMLDOMStringList2.prototype, "length", {
          get: function() {
            return this.arr.length;
          }
        });
        return XMLDOMStringList2;
      }).call(this);
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLDOMConfiguration.js
var require_XMLDOMConfiguration = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDOMConfiguration.js"(exports, module) {
    (function() {
      var XMLDOMConfiguration, XMLDOMErrorHandler, XMLDOMStringList;
      XMLDOMErrorHandler = require_XMLDOMErrorHandler();
      XMLDOMStringList = require_XMLDOMStringList();
      module.exports = XMLDOMConfiguration = (function() {
        class XMLDOMConfiguration2 {
          constructor() {
            var clonedSelf;
            this.defaultParams = {
              "canonical-form": false,
              "cdata-sections": false,
              "comments": false,
              "datatype-normalization": false,
              "element-content-whitespace": true,
              "entities": true,
              "error-handler": new XMLDOMErrorHandler(),
              "infoset": true,
              "validate-if-schema": false,
              "namespaces": true,
              "namespace-declarations": true,
              "normalize-characters": false,
              "schema-location": "",
              "schema-type": "",
              "split-cdata-sections": true,
              "validate": false,
              "well-formed": true
            };
            this.params = clonedSelf = Object.create(this.defaultParams);
          }
          // Gets the value of a parameter.
          // `name` name of the parameter
          getParameter(name) {
            if (this.params.hasOwnProperty(name)) {
              return this.params[name];
            } else {
              return null;
            }
          }
          // Checks if setting a parameter to a specific value is supported.
          // `name` name of the parameter
          // `value` parameter value
          canSetParameter(name, value) {
            return true;
          }
          // Sets the value of a parameter.
          // `name` name of the parameter
          // `value` new value or null if the user wishes to unset the parameter
          setParameter(name, value) {
            if (value != null) {
              return this.params[name] = value;
            } else {
              return delete this.params[name];
            }
          }
        }
        ;
        Object.defineProperty(XMLDOMConfiguration2.prototype, "parameterNames", {
          get: function() {
            return new XMLDOMStringList(Object.keys(this.defaultParams));
          }
        });
        return XMLDOMConfiguration2;
      }).call(this);
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/NodeType.js
var require_NodeType = __commonJS({
  "node_modules/xmlbuilder/lib/NodeType.js"(exports, module) {
    (function() {
      module.exports = {
        Element: 1,
        Attribute: 2,
        Text: 3,
        CData: 4,
        EntityReference: 5,
        EntityDeclaration: 6,
        ProcessingInstruction: 7,
        Comment: 8,
        Document: 9,
        DocType: 10,
        DocumentFragment: 11,
        NotationDeclaration: 12,
        // Numeric codes up to 200 are reserved to W3C for possible future use.
        // Following are types internal to this library:
        Declaration: 201,
        Raw: 202,
        AttributeDeclaration: 203,
        ElementDeclaration: 204,
        Dummy: 205
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLAttribute.js
var require_XMLAttribute = __commonJS({
  "node_modules/xmlbuilder/lib/XMLAttribute.js"(exports, module) {
    (function() {
      var NodeType, XMLAttribute, XMLNode;
      NodeType = require_NodeType();
      XMLNode = require_XMLNode();
      module.exports = XMLAttribute = (function() {
        class XMLAttribute2 {
          // Initializes a new instance of `XMLAttribute`
          // `parent` the parent node
          // `name` attribute target
          // `value` attribute value
          constructor(parent, name, value) {
            this.parent = parent;
            if (this.parent) {
              this.options = this.parent.options;
              this.stringify = this.parent.stringify;
            }
            if (name == null) {
              throw new Error("Missing attribute name. " + this.debugInfo(name));
            }
            this.name = this.stringify.name(name);
            this.value = this.stringify.attValue(value);
            this.type = NodeType.Attribute;
            this.isId = false;
            this.schemaTypeInfo = null;
          }
          // Creates and returns a deep clone of `this`
          clone() {
            return Object.create(this);
          }
          // Converts the XML fragment to string
          // `options.pretty` pretty prints the result
          // `options.indent` indentation for pretty print
          // `options.offset` how many indentations to add to every line for pretty print
          // `options.newline` newline sequence for pretty print
          toString(options) {
            return this.options.writer.attribute(this, this.options.writer.filterOptions(options));
          }
          // Returns debug string for this node
          debugInfo(name) {
            name = name || this.name;
            if (name == null) {
              return "parent: <" + this.parent.name + ">";
            } else {
              return "attribute: {" + name + "}, parent: <" + this.parent.name + ">";
            }
          }
          isEqualNode(node) {
            if (node.namespaceURI !== this.namespaceURI) {
              return false;
            }
            if (node.prefix !== this.prefix) {
              return false;
            }
            if (node.localName !== this.localName) {
              return false;
            }
            if (node.value !== this.value) {
              return false;
            }
            return true;
          }
        }
        ;
        Object.defineProperty(XMLAttribute2.prototype, "nodeType", {
          get: function() {
            return this.type;
          }
        });
        Object.defineProperty(XMLAttribute2.prototype, "ownerElement", {
          get: function() {
            return this.parent;
          }
        });
        Object.defineProperty(XMLAttribute2.prototype, "textContent", {
          get: function() {
            return this.value;
          },
          set: function(value) {
            return this.value = value || "";
          }
        });
        Object.defineProperty(XMLAttribute2.prototype, "namespaceURI", {
          get: function() {
            return "";
          }
        });
        Object.defineProperty(XMLAttribute2.prototype, "prefix", {
          get: function() {
            return "";
          }
        });
        Object.defineProperty(XMLAttribute2.prototype, "localName", {
          get: function() {
            return this.name;
          }
        });
        Object.defineProperty(XMLAttribute2.prototype, "specified", {
          get: function() {
            return true;
          }
        });
        return XMLAttribute2;
      }).call(this);
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLNamedNodeMap.js
var require_XMLNamedNodeMap = __commonJS({
  "node_modules/xmlbuilder/lib/XMLNamedNodeMap.js"(exports, module) {
    (function() {
      var XMLNamedNodeMap;
      module.exports = XMLNamedNodeMap = (function() {
        class XMLNamedNodeMap2 {
          // Initializes a new instance of `XMLNamedNodeMap`
          // This is just a wrapper around an ordinary
          // JS object.
          // `nodes` the object containing nodes.
          constructor(nodes) {
            this.nodes = nodes;
          }
          // Creates and returns a deep clone of `this`
          clone() {
            return this.nodes = null;
          }
          // DOM Level 1
          getNamedItem(name) {
            return this.nodes[name];
          }
          setNamedItem(node) {
            var oldNode;
            oldNode = this.nodes[node.nodeName];
            this.nodes[node.nodeName] = node;
            return oldNode || null;
          }
          removeNamedItem(name) {
            var oldNode;
            oldNode = this.nodes[name];
            delete this.nodes[name];
            return oldNode || null;
          }
          item(index) {
            return this.nodes[Object.keys(this.nodes)[index]] || null;
          }
          // DOM level 2 functions to be implemented later
          getNamedItemNS(namespaceURI, localName) {
            throw new Error("This DOM method is not implemented.");
          }
          setNamedItemNS(node) {
            throw new Error("This DOM method is not implemented.");
          }
          removeNamedItemNS(namespaceURI, localName) {
            throw new Error("This DOM method is not implemented.");
          }
        }
        ;
        Object.defineProperty(XMLNamedNodeMap2.prototype, "length", {
          get: function() {
            return Object.keys(this.nodes).length || 0;
          }
        });
        return XMLNamedNodeMap2;
      }).call(this);
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLElement.js
var require_XMLElement = __commonJS({
  "node_modules/xmlbuilder/lib/XMLElement.js"(exports, module) {
    (function() {
      var NodeType, XMLAttribute, XMLElement, XMLNamedNodeMap, XMLNode, getValue, isFunction, isObject, hasProp = {}.hasOwnProperty;
      ({ isObject, isFunction, getValue } = require_Utility());
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      XMLAttribute = require_XMLAttribute();
      XMLNamedNodeMap = require_XMLNamedNodeMap();
      module.exports = XMLElement = (function() {
        class XMLElement2 extends XMLNode {
          // Initializes a new instance of `XMLElement`
          // `parent` the parent node
          // `name` element name
          // `attributes` an object containing name/value pairs of attributes
          constructor(parent, name, attributes) {
            var child, j2, len, ref;
            super(parent);
            if (name == null) {
              throw new Error("Missing element name. " + this.debugInfo());
            }
            this.name = this.stringify.name(name);
            this.type = NodeType.Element;
            this.attribs = {};
            this.schemaTypeInfo = null;
            if (attributes != null) {
              this.attribute(attributes);
            }
            if (parent.type === NodeType.Document) {
              this.isRoot = true;
              this.documentObject = parent;
              parent.rootObject = this;
              if (parent.children) {
                ref = parent.children;
                for (j2 = 0, len = ref.length; j2 < len; j2++) {
                  child = ref[j2];
                  if (child.type === NodeType.DocType) {
                    child.name = this.name;
                    break;
                  }
                }
              }
            }
          }
          // Creates and returns a deep clone of `this`
          clone() {
            var att, attName, clonedSelf, ref;
            clonedSelf = Object.create(this);
            if (clonedSelf.isRoot) {
              clonedSelf.documentObject = null;
            }
            clonedSelf.attribs = {};
            ref = this.attribs;
            for (attName in ref) {
              if (!hasProp.call(ref, attName)) continue;
              att = ref[attName];
              clonedSelf.attribs[attName] = att.clone();
            }
            clonedSelf.children = [];
            this.children.forEach(function(child) {
              var clonedChild;
              clonedChild = child.clone();
              clonedChild.parent = clonedSelf;
              return clonedSelf.children.push(clonedChild);
            });
            return clonedSelf;
          }
          // Adds or modifies an attribute
          // `name` attribute name
          // `value` attribute value
          attribute(name, value) {
            var attName, attValue;
            if (name != null) {
              name = getValue(name);
            }
            if (isObject(name)) {
              for (attName in name) {
                if (!hasProp.call(name, attName)) continue;
                attValue = name[attName];
                this.attribute(attName, attValue);
              }
            } else {
              if (isFunction(value)) {
                value = value.apply();
              }
              if (this.options.keepNullAttributes && value == null) {
                this.attribs[name] = new XMLAttribute(this, name, "");
              } else if (value != null) {
                this.attribs[name] = new XMLAttribute(this, name, value);
              }
            }
            return this;
          }
          // Removes an attribute
          // `name` attribute name
          removeAttribute(name) {
            var attName, j2, len;
            if (name == null) {
              throw new Error("Missing attribute name. " + this.debugInfo());
            }
            name = getValue(name);
            if (Array.isArray(name)) {
              for (j2 = 0, len = name.length; j2 < len; j2++) {
                attName = name[j2];
                delete this.attribs[attName];
              }
            } else {
              delete this.attribs[name];
            }
            return this;
          }
          // Converts the XML fragment to string
          // `options.pretty` pretty prints the result
          // `options.indent` indentation for pretty print
          // `options.offset` how many indentations to add to every line for pretty print
          // `options.newline` newline sequence for pretty print
          // `options.allowEmpty` do not self close empty element tags
          toString(options) {
            return this.options.writer.element(this, this.options.writer.filterOptions(options));
          }
          // Aliases
          att(name, value) {
            return this.attribute(name, value);
          }
          a(name, value) {
            return this.attribute(name, value);
          }
          // DOM Level 1
          getAttribute(name) {
            if (this.attribs.hasOwnProperty(name)) {
              return this.attribs[name].value;
            } else {
              return null;
            }
          }
          setAttribute(name, value) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          getAttributeNode(name) {
            if (this.attribs.hasOwnProperty(name)) {
              return this.attribs[name];
            } else {
              return null;
            }
          }
          setAttributeNode(newAttr) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          removeAttributeNode(oldAttr) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          getElementsByTagName(name) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          // DOM Level 2
          getAttributeNS(namespaceURI, localName) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          setAttributeNS(namespaceURI, qualifiedName, value) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          removeAttributeNS(namespaceURI, localName) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          getAttributeNodeNS(namespaceURI, localName) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          setAttributeNodeNS(newAttr) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          getElementsByTagNameNS(namespaceURI, localName) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          hasAttribute(name) {
            return this.attribs.hasOwnProperty(name);
          }
          hasAttributeNS(namespaceURI, localName) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          // DOM Level 3
          setIdAttribute(name, isId) {
            if (this.attribs.hasOwnProperty(name)) {
              return this.attribs[name].isId;
            } else {
              return isId;
            }
          }
          setIdAttributeNS(namespaceURI, localName, isId) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          setIdAttributeNode(idAttr, isId) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          // DOM Level 4
          getElementsByTagName(tagname) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          getElementsByTagNameNS(namespaceURI, localName) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          getElementsByClassName(classNames) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          isEqualNode(node) {
            var i2, j2, ref;
            if (!super.isEqualNode(node)) {
              return false;
            }
            if (node.namespaceURI !== this.namespaceURI) {
              return false;
            }
            if (node.prefix !== this.prefix) {
              return false;
            }
            if (node.localName !== this.localName) {
              return false;
            }
            if (node.attribs.length !== this.attribs.length) {
              return false;
            }
            for (i2 = j2 = 0, ref = this.attribs.length - 1; 0 <= ref ? j2 <= ref : j2 >= ref; i2 = 0 <= ref ? ++j2 : --j2) {
              if (!this.attribs[i2].isEqualNode(node.attribs[i2])) {
                return false;
              }
            }
            return true;
          }
        }
        ;
        Object.defineProperty(XMLElement2.prototype, "tagName", {
          get: function() {
            return this.name;
          }
        });
        Object.defineProperty(XMLElement2.prototype, "namespaceURI", {
          get: function() {
            return "";
          }
        });
        Object.defineProperty(XMLElement2.prototype, "prefix", {
          get: function() {
            return "";
          }
        });
        Object.defineProperty(XMLElement2.prototype, "localName", {
          get: function() {
            return this.name;
          }
        });
        Object.defineProperty(XMLElement2.prototype, "id", {
          get: function() {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
        });
        Object.defineProperty(XMLElement2.prototype, "className", {
          get: function() {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
        });
        Object.defineProperty(XMLElement2.prototype, "classList", {
          get: function() {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
        });
        Object.defineProperty(XMLElement2.prototype, "attributes", {
          get: function() {
            if (!this.attributeMap || !this.attributeMap.nodes) {
              this.attributeMap = new XMLNamedNodeMap(this.attribs);
            }
            return this.attributeMap;
          }
        });
        return XMLElement2;
      }).call(this);
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLCharacterData.js
var require_XMLCharacterData = __commonJS({
  "node_modules/xmlbuilder/lib/XMLCharacterData.js"(exports, module) {
    (function() {
      var XMLCharacterData, XMLNode;
      XMLNode = require_XMLNode();
      module.exports = XMLCharacterData = (function() {
        class XMLCharacterData2 extends XMLNode {
          // Initializes a new instance of `XMLCharacterData`
          constructor(parent) {
            super(parent);
            this.value = "";
          }
          // Creates and returns a deep clone of `this`
          clone() {
            return Object.create(this);
          }
          // DOM level 1 functions to be implemented later
          substringData(offset, count) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          appendData(arg) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          insertData(offset, arg) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          deleteData(offset, count) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          replaceData(offset, count, arg) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          isEqualNode(node) {
            if (!super.isEqualNode(node)) {
              return false;
            }
            if (node.data !== this.data) {
              return false;
            }
            return true;
          }
        }
        ;
        Object.defineProperty(XMLCharacterData2.prototype, "data", {
          get: function() {
            return this.value;
          },
          set: function(value) {
            return this.value = value || "";
          }
        });
        Object.defineProperty(XMLCharacterData2.prototype, "length", {
          get: function() {
            return this.value.length;
          }
        });
        Object.defineProperty(XMLCharacterData2.prototype, "textContent", {
          get: function() {
            return this.value;
          },
          set: function(value) {
            return this.value = value || "";
          }
        });
        return XMLCharacterData2;
      }).call(this);
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLCData.js
var require_XMLCData = __commonJS({
  "node_modules/xmlbuilder/lib/XMLCData.js"(exports, module) {
    (function() {
      var NodeType, XMLCData, XMLCharacterData;
      NodeType = require_NodeType();
      XMLCharacterData = require_XMLCharacterData();
      module.exports = XMLCData = class XMLCData extends XMLCharacterData {
        // Initializes a new instance of `XMLCData`
        // `text` CDATA text
        constructor(parent, text) {
          super(parent);
          if (text == null) {
            throw new Error("Missing CDATA text. " + this.debugInfo());
          }
          this.name = "#cdata-section";
          this.type = NodeType.CData;
          this.value = this.stringify.cdata(text);
        }
        // Creates and returns a deep clone of `this`
        clone() {
          return Object.create(this);
        }
        // Converts the XML fragment to string
        // `options.pretty` pretty prints the result
        // `options.indent` indentation for pretty print
        // `options.offset` how many indentations to add to every line for pretty print
        // `options.newline` newline sequence for pretty print
        toString(options) {
          return this.options.writer.cdata(this, this.options.writer.filterOptions(options));
        }
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLComment.js
var require_XMLComment = __commonJS({
  "node_modules/xmlbuilder/lib/XMLComment.js"(exports, module) {
    (function() {
      var NodeType, XMLCharacterData, XMLComment;
      NodeType = require_NodeType();
      XMLCharacterData = require_XMLCharacterData();
      module.exports = XMLComment = class XMLComment extends XMLCharacterData {
        // Initializes a new instance of `XMLComment`
        // `text` comment text
        constructor(parent, text) {
          super(parent);
          if (text == null) {
            throw new Error("Missing comment text. " + this.debugInfo());
          }
          this.name = "#comment";
          this.type = NodeType.Comment;
          this.value = this.stringify.comment(text);
        }
        // Creates and returns a deep clone of `this`
        clone() {
          return Object.create(this);
        }
        // Converts the XML fragment to string
        // `options.pretty` pretty prints the result
        // `options.indent` indentation for pretty print
        // `options.offset` how many indentations to add to every line for pretty print
        // `options.newline` newline sequence for pretty print
        toString(options) {
          return this.options.writer.comment(this, this.options.writer.filterOptions(options));
        }
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLDeclaration.js
var require_XMLDeclaration = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDeclaration.js"(exports, module) {
    (function() {
      var NodeType, XMLDeclaration, XMLNode, isObject;
      ({ isObject } = require_Utility());
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      module.exports = XMLDeclaration = class XMLDeclaration extends XMLNode {
        // Initializes a new instance of `XMLDeclaration`
        // `parent` the document object
        // `version` A version number string, e.g. 1.0
        // `encoding` Encoding declaration, e.g. UTF-8
        // `standalone` standalone document declaration: true or false
        constructor(parent, version, encoding, standalone) {
          super(parent);
          if (isObject(version)) {
            ({ version, encoding, standalone } = version);
          }
          if (!version) {
            version = "1.0";
          }
          this.type = NodeType.Declaration;
          this.version = this.stringify.xmlVersion(version);
          if (encoding != null) {
            this.encoding = this.stringify.xmlEncoding(encoding);
          }
          if (standalone != null) {
            this.standalone = this.stringify.xmlStandalone(standalone);
          }
        }
        // Converts to string
        // `options.pretty` pretty prints the result
        // `options.indent` indentation for pretty print
        // `options.offset` how many indentations to add to every line for pretty print
        // `options.newline` newline sequence for pretty print
        toString(options) {
          return this.options.writer.declaration(this, this.options.writer.filterOptions(options));
        }
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLDTDAttList.js
var require_XMLDTDAttList = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDTDAttList.js"(exports, module) {
    (function() {
      var NodeType, XMLDTDAttList, XMLNode;
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      module.exports = XMLDTDAttList = class XMLDTDAttList extends XMLNode {
        // Initializes a new instance of `XMLDTDAttList`
        // `parent` the parent `XMLDocType` element
        // `elementName` the name of the element containing this attribute
        // `attributeName` attribute name
        // `attributeType` type of the attribute
        // `defaultValueType` default value type (either #REQUIRED, #IMPLIED,
        //                    #FIXED or #DEFAULT)
        // `defaultValue` default value of the attribute
        //                (only used for #FIXED or #DEFAULT)
        constructor(parent, elementName, attributeName, attributeType, defaultValueType, defaultValue) {
          super(parent);
          if (elementName == null) {
            throw new Error("Missing DTD element name. " + this.debugInfo());
          }
          if (attributeName == null) {
            throw new Error("Missing DTD attribute name. " + this.debugInfo(elementName));
          }
          if (!attributeType) {
            throw new Error("Missing DTD attribute type. " + this.debugInfo(elementName));
          }
          if (!defaultValueType) {
            throw new Error("Missing DTD attribute default. " + this.debugInfo(elementName));
          }
          if (defaultValueType.indexOf("#") !== 0) {
            defaultValueType = "#" + defaultValueType;
          }
          if (!defaultValueType.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)) {
            throw new Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT. " + this.debugInfo(elementName));
          }
          if (defaultValue && !defaultValueType.match(/^(#FIXED|#DEFAULT)$/)) {
            throw new Error("Default value only applies to #FIXED or #DEFAULT. " + this.debugInfo(elementName));
          }
          this.elementName = this.stringify.name(elementName);
          this.type = NodeType.AttributeDeclaration;
          this.attributeName = this.stringify.name(attributeName);
          this.attributeType = this.stringify.dtdAttType(attributeType);
          if (defaultValue) {
            this.defaultValue = this.stringify.dtdAttDefault(defaultValue);
          }
          this.defaultValueType = defaultValueType;
        }
        // Converts the XML fragment to string
        // `options.pretty` pretty prints the result
        // `options.indent` indentation for pretty print
        // `options.offset` how many indentations to add to every line for pretty print
        // `options.newline` newline sequence for pretty print
        toString(options) {
          return this.options.writer.dtdAttList(this, this.options.writer.filterOptions(options));
        }
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLDTDEntity.js
var require_XMLDTDEntity = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDTDEntity.js"(exports, module) {
    (function() {
      var NodeType, XMLDTDEntity, XMLNode, isObject;
      ({ isObject } = require_Utility());
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      module.exports = XMLDTDEntity = (function() {
        class XMLDTDEntity2 extends XMLNode {
          // Initializes a new instance of `XMLDTDEntity`
          // `parent` the parent `XMLDocType` element
          // `pe` whether this is a parameter entity or a general entity
          //      defaults to `false` (general entity)
          // `name` the name of the entity
          // `value` internal entity value or an object with external entity details
          // `value.pubID` public identifier
          // `value.sysID` system identifier
          // `value.nData` notation declaration
          constructor(parent, pe2, name, value) {
            super(parent);
            if (name == null) {
              throw new Error("Missing DTD entity name. " + this.debugInfo(name));
            }
            if (value == null) {
              throw new Error("Missing DTD entity value. " + this.debugInfo(name));
            }
            this.pe = !!pe2;
            this.name = this.stringify.name(name);
            this.type = NodeType.EntityDeclaration;
            if (!isObject(value)) {
              this.value = this.stringify.dtdEntityValue(value);
              this.internal = true;
            } else {
              if (!value.pubID && !value.sysID) {
                throw new Error("Public and/or system identifiers are required for an external entity. " + this.debugInfo(name));
              }
              if (value.pubID && !value.sysID) {
                throw new Error("System identifier is required for a public external entity. " + this.debugInfo(name));
              }
              this.internal = false;
              if (value.pubID != null) {
                this.pubID = this.stringify.dtdPubID(value.pubID);
              }
              if (value.sysID != null) {
                this.sysID = this.stringify.dtdSysID(value.sysID);
              }
              if (value.nData != null) {
                this.nData = this.stringify.dtdNData(value.nData);
              }
              if (this.pe && this.nData) {
                throw new Error("Notation declaration is not allowed in a parameter entity. " + this.debugInfo(name));
              }
            }
          }
          // Converts the XML fragment to string
          // `options.pretty` pretty prints the result
          // `options.indent` indentation for pretty print
          // `options.offset` how many indentations to add to every line for pretty print
          // `options.newline` newline sequence for pretty print
          toString(options) {
            return this.options.writer.dtdEntity(this, this.options.writer.filterOptions(options));
          }
        }
        ;
        Object.defineProperty(XMLDTDEntity2.prototype, "publicId", {
          get: function() {
            return this.pubID;
          }
        });
        Object.defineProperty(XMLDTDEntity2.prototype, "systemId", {
          get: function() {
            return this.sysID;
          }
        });
        Object.defineProperty(XMLDTDEntity2.prototype, "notationName", {
          get: function() {
            return this.nData || null;
          }
        });
        Object.defineProperty(XMLDTDEntity2.prototype, "inputEncoding", {
          get: function() {
            return null;
          }
        });
        Object.defineProperty(XMLDTDEntity2.prototype, "xmlEncoding", {
          get: function() {
            return null;
          }
        });
        Object.defineProperty(XMLDTDEntity2.prototype, "xmlVersion", {
          get: function() {
            return null;
          }
        });
        return XMLDTDEntity2;
      }).call(this);
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLDTDElement.js
var require_XMLDTDElement = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDTDElement.js"(exports, module) {
    (function() {
      var NodeType, XMLDTDElement, XMLNode;
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      module.exports = XMLDTDElement = class XMLDTDElement extends XMLNode {
        // Initializes a new instance of `XMLDTDElement`
        // `parent` the parent `XMLDocType` element
        // `name` element name
        // `value` element content (defaults to #PCDATA)
        constructor(parent, name, value) {
          super(parent);
          if (name == null) {
            throw new Error("Missing DTD element name. " + this.debugInfo());
          }
          if (!value) {
            value = "(#PCDATA)";
          }
          if (Array.isArray(value)) {
            value = "(" + value.join(",") + ")";
          }
          this.name = this.stringify.name(name);
          this.type = NodeType.ElementDeclaration;
          this.value = this.stringify.dtdElementValue(value);
        }
        // Converts the XML fragment to string
        // `options.pretty` pretty prints the result
        // `options.indent` indentation for pretty print
        // `options.offset` how many indentations to add to every line for pretty print
        // `options.newline` newline sequence for pretty print
        toString(options) {
          return this.options.writer.dtdElement(this, this.options.writer.filterOptions(options));
        }
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLDTDNotation.js
var require_XMLDTDNotation = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDTDNotation.js"(exports, module) {
    (function() {
      var NodeType, XMLDTDNotation, XMLNode;
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      module.exports = XMLDTDNotation = (function() {
        class XMLDTDNotation2 extends XMLNode {
          // Initializes a new instance of `XMLDTDNotation`
          // `parent` the parent `XMLDocType` element
          // `name` the name of the notation
          // `value` an object with external entity details
          // `value.pubID` public identifier
          // `value.sysID` system identifier
          constructor(parent, name, value) {
            super(parent);
            if (name == null) {
              throw new Error("Missing DTD notation name. " + this.debugInfo(name));
            }
            if (!value.pubID && !value.sysID) {
              throw new Error("Public or system identifiers are required for an external entity. " + this.debugInfo(name));
            }
            this.name = this.stringify.name(name);
            this.type = NodeType.NotationDeclaration;
            if (value.pubID != null) {
              this.pubID = this.stringify.dtdPubID(value.pubID);
            }
            if (value.sysID != null) {
              this.sysID = this.stringify.dtdSysID(value.sysID);
            }
          }
          // Converts the XML fragment to string
          // `options.pretty` pretty prints the result
          // `options.indent` indentation for pretty print
          // `options.offset` how many indentations to add to every line for pretty print
          // `options.newline` newline sequence for pretty print
          toString(options) {
            return this.options.writer.dtdNotation(this, this.options.writer.filterOptions(options));
          }
        }
        ;
        Object.defineProperty(XMLDTDNotation2.prototype, "publicId", {
          get: function() {
            return this.pubID;
          }
        });
        Object.defineProperty(XMLDTDNotation2.prototype, "systemId", {
          get: function() {
            return this.sysID;
          }
        });
        return XMLDTDNotation2;
      }).call(this);
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLDocType.js
var require_XMLDocType = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDocType.js"(exports, module) {
    (function() {
      var NodeType, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDocType, XMLNamedNodeMap, XMLNode, isObject;
      ({ isObject } = require_Utility());
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      XMLDTDAttList = require_XMLDTDAttList();
      XMLDTDEntity = require_XMLDTDEntity();
      XMLDTDElement = require_XMLDTDElement();
      XMLDTDNotation = require_XMLDTDNotation();
      XMLNamedNodeMap = require_XMLNamedNodeMap();
      module.exports = XMLDocType = (function() {
        class XMLDocType2 extends XMLNode {
          // Initializes a new instance of `XMLDocType`
          // `parent` the document object
          // `pubID` public identifier of the external subset
          // `sysID` system identifier of the external subset
          constructor(parent, pubID, sysID) {
            var child, i2, len, ref;
            super(parent);
            this.type = NodeType.DocType;
            if (parent.children) {
              ref = parent.children;
              for (i2 = 0, len = ref.length; i2 < len; i2++) {
                child = ref[i2];
                if (child.type === NodeType.Element) {
                  this.name = child.name;
                  break;
                }
              }
            }
            this.documentObject = parent;
            if (isObject(pubID)) {
              ({ pubID, sysID } = pubID);
            }
            if (sysID == null) {
              [sysID, pubID] = [pubID, sysID];
            }
            if (pubID != null) {
              this.pubID = this.stringify.dtdPubID(pubID);
            }
            if (sysID != null) {
              this.sysID = this.stringify.dtdSysID(sysID);
            }
          }
          // Creates an element type declaration
          // `name` element name
          // `value` element content (defaults to #PCDATA)
          element(name, value) {
            var child;
            child = new XMLDTDElement(this, name, value);
            this.children.push(child);
            return this;
          }
          // Creates an attribute declaration
          // `elementName` the name of the element containing this attribute
          // `attributeName` attribute name
          // `attributeType` type of the attribute (defaults to CDATA)
          // `defaultValueType` default value type (either #REQUIRED, #IMPLIED, #FIXED or
          //                    #DEFAULT) (defaults to #IMPLIED)
          // `defaultValue` default value of the attribute
          //                (only used for #FIXED or #DEFAULT)
          attList(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
            var child;
            child = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
            this.children.push(child);
            return this;
          }
          // Creates a general entity declaration
          // `name` the name of the entity
          // `value` internal entity value or an object with external entity details
          // `value.pubID` public identifier
          // `value.sysID` system identifier
          // `value.nData` notation declaration
          entity(name, value) {
            var child;
            child = new XMLDTDEntity(this, false, name, value);
            this.children.push(child);
            return this;
          }
          // Creates a parameter entity declaration
          // `name` the name of the entity
          // `value` internal entity value or an object with external entity details
          // `value.pubID` public identifier
          // `value.sysID` system identifier
          pEntity(name, value) {
            var child;
            child = new XMLDTDEntity(this, true, name, value);
            this.children.push(child);
            return this;
          }
          // Creates a NOTATION declaration
          // `name` the name of the notation
          // `value` an object with external entity details
          // `value.pubID` public identifier
          // `value.sysID` system identifier
          notation(name, value) {
            var child;
            child = new XMLDTDNotation(this, name, value);
            this.children.push(child);
            return this;
          }
          // Converts to string
          // `options.pretty` pretty prints the result
          // `options.indent` indentation for pretty print
          // `options.offset` how many indentations to add to every line for pretty print
          // `options.newline` newline sequence for pretty print
          toString(options) {
            return this.options.writer.docType(this, this.options.writer.filterOptions(options));
          }
          // Aliases
          ele(name, value) {
            return this.element(name, value);
          }
          att(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
            return this.attList(elementName, attributeName, attributeType, defaultValueType, defaultValue);
          }
          ent(name, value) {
            return this.entity(name, value);
          }
          pent(name, value) {
            return this.pEntity(name, value);
          }
          not(name, value) {
            return this.notation(name, value);
          }
          up() {
            return this.root() || this.documentObject;
          }
          isEqualNode(node) {
            if (!super.isEqualNode(node)) {
              return false;
            }
            if (node.name !== this.name) {
              return false;
            }
            if (node.publicId !== this.publicId) {
              return false;
            }
            if (node.systemId !== this.systemId) {
              return false;
            }
            return true;
          }
        }
        ;
        Object.defineProperty(XMLDocType2.prototype, "entities", {
          get: function() {
            var child, i2, len, nodes, ref;
            nodes = {};
            ref = this.children;
            for (i2 = 0, len = ref.length; i2 < len; i2++) {
              child = ref[i2];
              if (child.type === NodeType.EntityDeclaration && !child.pe) {
                nodes[child.name] = child;
              }
            }
            return new XMLNamedNodeMap(nodes);
          }
        });
        Object.defineProperty(XMLDocType2.prototype, "notations", {
          get: function() {
            var child, i2, len, nodes, ref;
            nodes = {};
            ref = this.children;
            for (i2 = 0, len = ref.length; i2 < len; i2++) {
              child = ref[i2];
              if (child.type === NodeType.NotationDeclaration) {
                nodes[child.name] = child;
              }
            }
            return new XMLNamedNodeMap(nodes);
          }
        });
        Object.defineProperty(XMLDocType2.prototype, "publicId", {
          get: function() {
            return this.pubID;
          }
        });
        Object.defineProperty(XMLDocType2.prototype, "systemId", {
          get: function() {
            return this.sysID;
          }
        });
        Object.defineProperty(XMLDocType2.prototype, "internalSubset", {
          get: function() {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
        });
        return XMLDocType2;
      }).call(this);
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLRaw.js
var require_XMLRaw = __commonJS({
  "node_modules/xmlbuilder/lib/XMLRaw.js"(exports, module) {
    (function() {
      var NodeType, XMLNode, XMLRaw;
      NodeType = require_NodeType();
      XMLNode = require_XMLNode();
      module.exports = XMLRaw = class XMLRaw extends XMLNode {
        // Initializes a new instance of `XMLRaw`
        // `text` raw text
        constructor(parent, text) {
          super(parent);
          if (text == null) {
            throw new Error("Missing raw text. " + this.debugInfo());
          }
          this.type = NodeType.Raw;
          this.value = this.stringify.raw(text);
        }
        // Creates and returns a deep clone of `this`
        clone() {
          return Object.create(this);
        }
        // Converts the XML fragment to string
        // `options.pretty` pretty prints the result
        // `options.indent` indentation for pretty print
        // `options.offset` how many indentations to add to every line for pretty print
        // `options.newline` newline sequence for pretty print
        toString(options) {
          return this.options.writer.raw(this, this.options.writer.filterOptions(options));
        }
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLText.js
var require_XMLText = __commonJS({
  "node_modules/xmlbuilder/lib/XMLText.js"(exports, module) {
    (function() {
      var NodeType, XMLCharacterData, XMLText;
      NodeType = require_NodeType();
      XMLCharacterData = require_XMLCharacterData();
      module.exports = XMLText = (function() {
        class XMLText2 extends XMLCharacterData {
          // Initializes a new instance of `XMLText`
          // `text` element text
          constructor(parent, text) {
            super(parent);
            if (text == null) {
              throw new Error("Missing element text. " + this.debugInfo());
            }
            this.name = "#text";
            this.type = NodeType.Text;
            this.value = this.stringify.text(text);
          }
          // Creates and returns a deep clone of `this`
          clone() {
            return Object.create(this);
          }
          // Converts the XML fragment to string
          // `options.pretty` pretty prints the result
          // `options.indent` indentation for pretty print
          // `options.offset` how many indentations to add to every line for pretty print
          // `options.newline` newline sequence for pretty print
          toString(options) {
            return this.options.writer.text(this, this.options.writer.filterOptions(options));
          }
          // DOM level 1 functions to be implemented later
          splitText(offset) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          // DOM level 3 functions to be implemented later
          replaceWholeText(content) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
        }
        ;
        Object.defineProperty(XMLText2.prototype, "isElementContentWhitespace", {
          get: function() {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
        });
        Object.defineProperty(XMLText2.prototype, "wholeText", {
          get: function() {
            var next, prev, str;
            str = "";
            prev = this.previousSibling;
            while (prev) {
              str = prev.data + str;
              prev = prev.previousSibling;
            }
            str += this.data;
            next = this.nextSibling;
            while (next) {
              str = str + next.data;
              next = next.nextSibling;
            }
            return str;
          }
        });
        return XMLText2;
      }).call(this);
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLProcessingInstruction.js
var require_XMLProcessingInstruction = __commonJS({
  "node_modules/xmlbuilder/lib/XMLProcessingInstruction.js"(exports, module) {
    (function() {
      var NodeType, XMLCharacterData, XMLProcessingInstruction;
      NodeType = require_NodeType();
      XMLCharacterData = require_XMLCharacterData();
      module.exports = XMLProcessingInstruction = class XMLProcessingInstruction extends XMLCharacterData {
        // Initializes a new instance of `XMLProcessingInstruction`
        // `parent` the parent node
        // `target` instruction target
        // `value` instruction value
        constructor(parent, target, value) {
          super(parent);
          if (target == null) {
            throw new Error("Missing instruction target. " + this.debugInfo());
          }
          this.type = NodeType.ProcessingInstruction;
          this.target = this.stringify.insTarget(target);
          this.name = this.target;
          if (value) {
            this.value = this.stringify.insValue(value);
          }
        }
        // Creates and returns a deep clone of `this`
        clone() {
          return Object.create(this);
        }
        // Converts the XML fragment to string
        // `options.pretty` pretty prints the result
        // `options.indent` indentation for pretty print
        // `options.offset` how many indentations to add to every line for pretty print
        // `options.newline` newline sequence for pretty print
        toString(options) {
          return this.options.writer.processingInstruction(this, this.options.writer.filterOptions(options));
        }
        isEqualNode(node) {
          if (!super.isEqualNode(node)) {
            return false;
          }
          if (node.target !== this.target) {
            return false;
          }
          return true;
        }
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLDummy.js
var require_XMLDummy = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDummy.js"(exports, module) {
    (function() {
      var NodeType, XMLDummy, XMLNode;
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      module.exports = XMLDummy = class XMLDummy extends XMLNode {
        // Initializes a new instance of `XMLDummy`
        // `XMLDummy` is a special node representing a node with 
        // a null value. Dummy nodes are created while recursively
        // building the XML tree. Simply skipping null values doesn't
        // work because that would break the recursive chain.
        constructor(parent) {
          super(parent);
          this.type = NodeType.Dummy;
        }
        // Creates and returns a deep clone of `this`
        clone() {
          return Object.create(this);
        }
        // Converts the XML fragment to string
        // `options.pretty` pretty prints the result
        // `options.indent` indentation for pretty print
        // `options.offset` how many indentations to add to every line for pretty print
        // `options.newline` newline sequence for pretty print
        toString(options) {
          return "";
        }
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLNodeList.js
var require_XMLNodeList = __commonJS({
  "node_modules/xmlbuilder/lib/XMLNodeList.js"(exports, module) {
    (function() {
      var XMLNodeList;
      module.exports = XMLNodeList = (function() {
        class XMLNodeList2 {
          // Initializes a new instance of `XMLNodeList`
          // This is just a wrapper around an ordinary
          // JS array.
          // `nodes` the array containing nodes.
          constructor(nodes) {
            this.nodes = nodes;
          }
          // Creates and returns a deep clone of `this`
          clone() {
            return this.nodes = null;
          }
          // DOM Level 1
          item(index) {
            return this.nodes[index] || null;
          }
        }
        ;
        Object.defineProperty(XMLNodeList2.prototype, "length", {
          get: function() {
            return this.nodes.length || 0;
          }
        });
        return XMLNodeList2;
      }).call(this);
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/DocumentPosition.js
var require_DocumentPosition = __commonJS({
  "node_modules/xmlbuilder/lib/DocumentPosition.js"(exports, module) {
    (function() {
      module.exports = {
        Disconnected: 1,
        Preceding: 2,
        Following: 4,
        Contains: 8,
        ContainedBy: 16,
        ImplementationSpecific: 32
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLNode.js
var require_XMLNode = __commonJS({
  "node_modules/xmlbuilder/lib/XMLNode.js"(exports, module) {
    (function() {
      var DocumentPosition, NodeType, XMLCData, XMLComment, XMLDeclaration, XMLDocType, XMLDummy, XMLElement, XMLNamedNodeMap, XMLNode, XMLNodeList, XMLProcessingInstruction, XMLRaw, XMLText, getValue, isEmpty, isFunction, isObject, hasProp = {}.hasOwnProperty, splice = [].splice;
      ({ isObject, isFunction, isEmpty, getValue } = require_Utility());
      XMLElement = null;
      XMLCData = null;
      XMLComment = null;
      XMLDeclaration = null;
      XMLDocType = null;
      XMLRaw = null;
      XMLText = null;
      XMLProcessingInstruction = null;
      XMLDummy = null;
      NodeType = null;
      XMLNodeList = null;
      XMLNamedNodeMap = null;
      DocumentPosition = null;
      module.exports = XMLNode = (function() {
        class XMLNode2 {
          // Initializes a new instance of `XMLNode`
          // `parent` the parent node
          constructor(parent1) {
            this.parent = parent1;
            if (this.parent) {
              this.options = this.parent.options;
              this.stringify = this.parent.stringify;
            }
            this.value = null;
            this.children = [];
            this.baseURI = null;
            if (!XMLElement) {
              XMLElement = require_XMLElement();
              XMLCData = require_XMLCData();
              XMLComment = require_XMLComment();
              XMLDeclaration = require_XMLDeclaration();
              XMLDocType = require_XMLDocType();
              XMLRaw = require_XMLRaw();
              XMLText = require_XMLText();
              XMLProcessingInstruction = require_XMLProcessingInstruction();
              XMLDummy = require_XMLDummy();
              NodeType = require_NodeType();
              XMLNodeList = require_XMLNodeList();
              XMLNamedNodeMap = require_XMLNamedNodeMap();
              DocumentPosition = require_DocumentPosition();
            }
          }
          // Sets the parent node of this node and its children recursively
          // `parent` the parent node
          setParent(parent) {
            var child, j2, len, ref1, results;
            this.parent = parent;
            if (parent) {
              this.options = parent.options;
              this.stringify = parent.stringify;
            }
            ref1 = this.children;
            results = [];
            for (j2 = 0, len = ref1.length; j2 < len; j2++) {
              child = ref1[j2];
              results.push(child.setParent(this));
            }
            return results;
          }
          // Creates a child element node
          // `name` node name or an object describing the XML tree
          // `attributes` an object containing name/value pairs of attributes
          // `text` element text
          element(name, attributes, text) {
            var childNode, item, j2, k2, key, lastChild, len, len1, val;
            lastChild = null;
            if (attributes === null && text == null) {
              [attributes, text] = [{}, null];
            }
            if (attributes == null) {
              attributes = {};
            }
            attributes = getValue(attributes);
            if (!isObject(attributes)) {
              [text, attributes] = [attributes, text];
            }
            if (name != null) {
              name = getValue(name);
            }
            if (Array.isArray(name)) {
              for (j2 = 0, len = name.length; j2 < len; j2++) {
                item = name[j2];
                lastChild = this.element(item);
              }
            } else if (isFunction(name)) {
              lastChild = this.element(name.apply());
            } else if (isObject(name)) {
              for (key in name) {
                if (!hasProp.call(name, key)) continue;
                val = name[key];
                if (isFunction(val)) {
                  val = val.apply();
                }
                if (!this.options.ignoreDecorators && this.stringify.convertAttKey && key.indexOf(this.stringify.convertAttKey) === 0) {
                  lastChild = this.attribute(key.substr(this.stringify.convertAttKey.length), val);
                } else if (!this.options.separateArrayItems && Array.isArray(val) && isEmpty(val)) {
                  lastChild = this.dummy();
                } else if (isObject(val) && isEmpty(val)) {
                  lastChild = this.element(key);
                } else if (!this.options.keepNullNodes && val == null) {
                  lastChild = this.dummy();
                } else if (!this.options.separateArrayItems && Array.isArray(val)) {
                  for (k2 = 0, len1 = val.length; k2 < len1; k2++) {
                    item = val[k2];
                    childNode = {};
                    childNode[key] = item;
                    lastChild = this.element(childNode);
                  }
                } else if (isObject(val)) {
                  if (!this.options.ignoreDecorators && this.stringify.convertTextKey && key.indexOf(this.stringify.convertTextKey) === 0) {
                    lastChild = this.element(val);
                  } else {
                    lastChild = this.element(key);
                    lastChild.element(val);
                  }
                } else {
                  lastChild = this.element(key, val);
                }
              }
            } else if (!this.options.keepNullNodes && text === null) {
              lastChild = this.dummy();
            } else {
              if (!this.options.ignoreDecorators && this.stringify.convertTextKey && name.indexOf(this.stringify.convertTextKey) === 0) {
                lastChild = this.text(text);
              } else if (!this.options.ignoreDecorators && this.stringify.convertCDataKey && name.indexOf(this.stringify.convertCDataKey) === 0) {
                lastChild = this.cdata(text);
              } else if (!this.options.ignoreDecorators && this.stringify.convertCommentKey && name.indexOf(this.stringify.convertCommentKey) === 0) {
                lastChild = this.comment(text);
              } else if (!this.options.ignoreDecorators && this.stringify.convertRawKey && name.indexOf(this.stringify.convertRawKey) === 0) {
                lastChild = this.raw(text);
              } else if (!this.options.ignoreDecorators && this.stringify.convertPIKey && name.indexOf(this.stringify.convertPIKey) === 0) {
                lastChild = this.instruction(name.substr(this.stringify.convertPIKey.length), text);
              } else {
                lastChild = this.node(name, attributes, text);
              }
            }
            if (lastChild == null) {
              throw new Error("Could not create any elements with: " + name + ". " + this.debugInfo());
            }
            return lastChild;
          }
          // Creates a child element node before the current node
          // `name` node name or an object describing the XML tree
          // `attributes` an object containing name/value pairs of attributes
          // `text` element text
          insertBefore(name, attributes, text) {
            var child, i2, newChild, refChild, removed;
            if (name != null ? name.type : void 0) {
              newChild = name;
              refChild = attributes;
              newChild.setParent(this);
              if (refChild) {
                i2 = children.indexOf(refChild);
                removed = children.splice(i2);
                children.push(newChild);
                Array.prototype.push.apply(children, removed);
              } else {
                children.push(newChild);
              }
              return newChild;
            } else {
              if (this.isRoot) {
                throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
              }
              i2 = this.parent.children.indexOf(this);
              removed = this.parent.children.splice(i2);
              child = this.parent.element(name, attributes, text);
              Array.prototype.push.apply(this.parent.children, removed);
              return child;
            }
          }
          // Creates a child element node after the current node
          // `name` node name or an object describing the XML tree
          // `attributes` an object containing name/value pairs of attributes
          // `text` element text
          insertAfter(name, attributes, text) {
            var child, i2, removed;
            if (this.isRoot) {
              throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
            }
            i2 = this.parent.children.indexOf(this);
            removed = this.parent.children.splice(i2 + 1);
            child = this.parent.element(name, attributes, text);
            Array.prototype.push.apply(this.parent.children, removed);
            return child;
          }
          // Deletes a child element node
          remove() {
            var i2, ref1;
            if (this.isRoot) {
              throw new Error("Cannot remove the root element. " + this.debugInfo());
            }
            i2 = this.parent.children.indexOf(this);
            splice.apply(this.parent.children, [i2, i2 - i2 + 1].concat(ref1 = [])), ref1;
            return this.parent;
          }
          // Creates a node
          // `name` name of the node
          // `attributes` an object containing name/value pairs of attributes
          // `text` element text
          node(name, attributes, text) {
            var child;
            if (name != null) {
              name = getValue(name);
            }
            attributes || (attributes = {});
            attributes = getValue(attributes);
            if (!isObject(attributes)) {
              [text, attributes] = [attributes, text];
            }
            child = new XMLElement(this, name, attributes);
            if (text != null) {
              child.text(text);
            }
            this.children.push(child);
            return child;
          }
          // Creates a text node
          // `value` element text
          text(value) {
            var child;
            if (isObject(value)) {
              this.element(value);
            }
            child = new XMLText(this, value);
            this.children.push(child);
            return this;
          }
          // Creates a CDATA node
          // `value` element text without CDATA delimiters
          cdata(value) {
            var child;
            child = new XMLCData(this, value);
            this.children.push(child);
            return this;
          }
          // Creates a comment node
          // `value` comment text
          comment(value) {
            var child;
            child = new XMLComment(this, value);
            this.children.push(child);
            return this;
          }
          // Creates a comment node before the current node
          // `value` comment text
          commentBefore(value) {
            var child, i2, removed;
            i2 = this.parent.children.indexOf(this);
            removed = this.parent.children.splice(i2);
            child = this.parent.comment(value);
            Array.prototype.push.apply(this.parent.children, removed);
            return this;
          }
          // Creates a comment node after the current node
          // `value` comment text
          commentAfter(value) {
            var child, i2, removed;
            i2 = this.parent.children.indexOf(this);
            removed = this.parent.children.splice(i2 + 1);
            child = this.parent.comment(value);
            Array.prototype.push.apply(this.parent.children, removed);
            return this;
          }
          // Adds unescaped raw text
          // `value` text
          raw(value) {
            var child;
            child = new XMLRaw(this, value);
            this.children.push(child);
            return this;
          }
          // Adds a dummy node
          dummy() {
            var child;
            child = new XMLDummy(this);
            return child;
          }
          // Adds a processing instruction
          // `target` instruction target
          // `value` instruction value
          instruction(target, value) {
            var insTarget, insValue, instruction, j2, len;
            if (target != null) {
              target = getValue(target);
            }
            if (value != null) {
              value = getValue(value);
            }
            if (Array.isArray(target)) {
              for (j2 = 0, len = target.length; j2 < len; j2++) {
                insTarget = target[j2];
                this.instruction(insTarget);
              }
            } else if (isObject(target)) {
              for (insTarget in target) {
                if (!hasProp.call(target, insTarget)) continue;
                insValue = target[insTarget];
                this.instruction(insTarget, insValue);
              }
            } else {
              if (isFunction(value)) {
                value = value.apply();
              }
              instruction = new XMLProcessingInstruction(this, target, value);
              this.children.push(instruction);
            }
            return this;
          }
          // Creates a processing instruction node before the current node
          // `target` instruction target
          // `value` instruction value
          instructionBefore(target, value) {
            var child, i2, removed;
            i2 = this.parent.children.indexOf(this);
            removed = this.parent.children.splice(i2);
            child = this.parent.instruction(target, value);
            Array.prototype.push.apply(this.parent.children, removed);
            return this;
          }
          // Creates a processing instruction node after the current node
          // `target` instruction target
          // `value` instruction value
          instructionAfter(target, value) {
            var child, i2, removed;
            i2 = this.parent.children.indexOf(this);
            removed = this.parent.children.splice(i2 + 1);
            child = this.parent.instruction(target, value);
            Array.prototype.push.apply(this.parent.children, removed);
            return this;
          }
          // Creates the xml declaration
          // `version` A version number string, e.g. 1.0
          // `encoding` Encoding declaration, e.g. UTF-8
          // `standalone` standalone document declaration: true or false
          declaration(version, encoding, standalone) {
            var doc, xmldec;
            doc = this.document();
            xmldec = new XMLDeclaration(doc, version, encoding, standalone);
            if (doc.children.length === 0) {
              doc.children.unshift(xmldec);
            } else if (doc.children[0].type === NodeType.Declaration) {
              doc.children[0] = xmldec;
            } else {
              doc.children.unshift(xmldec);
            }
            return doc.root() || doc;
          }
          // Creates the document type declaration
          // `pubID` the public identifier of the external subset
          // `sysID` the system identifier of the external subset
          dtd(pubID, sysID) {
            var child, doc, doctype, i2, j2, k2, len, len1, ref1, ref2;
            doc = this.document();
            doctype = new XMLDocType(doc, pubID, sysID);
            ref1 = doc.children;
            for (i2 = j2 = 0, len = ref1.length; j2 < len; i2 = ++j2) {
              child = ref1[i2];
              if (child.type === NodeType.DocType) {
                doc.children[i2] = doctype;
                return doctype;
              }
            }
            ref2 = doc.children;
            for (i2 = k2 = 0, len1 = ref2.length; k2 < len1; i2 = ++k2) {
              child = ref2[i2];
              if (child.isRoot) {
                doc.children.splice(i2, 0, doctype);
                return doctype;
              }
            }
            doc.children.push(doctype);
            return doctype;
          }
          // Gets the parent node
          up() {
            if (this.isRoot) {
              throw new Error("The root node has no parent. Use doc() if you need to get the document object.");
            }
            return this.parent;
          }
          // Gets the root node
          root() {
            var node;
            node = this;
            while (node) {
              if (node.type === NodeType.Document) {
                return node.rootObject;
              } else if (node.isRoot) {
                return node;
              } else {
                node = node.parent;
              }
            }
          }
          // Gets the node representing the XML document
          document() {
            var node;
            node = this;
            while (node) {
              if (node.type === NodeType.Document) {
                return node;
              } else {
                node = node.parent;
              }
            }
          }
          // Ends the document and converts string
          end(options) {
            return this.document().end(options);
          }
          // Gets the previous node
          prev() {
            var i2;
            i2 = this.parent.children.indexOf(this);
            if (i2 < 1) {
              throw new Error("Already at the first node. " + this.debugInfo());
            }
            return this.parent.children[i2 - 1];
          }
          // Gets the next node
          next() {
            var i2;
            i2 = this.parent.children.indexOf(this);
            if (i2 === -1 || i2 === this.parent.children.length - 1) {
              throw new Error("Already at the last node. " + this.debugInfo());
            }
            return this.parent.children[i2 + 1];
          }
          // Imports cloned root from another XML document
          // `doc` the XML document to insert nodes from
          importDocument(doc) {
            var child, clonedRoot, j2, len, ref1;
            clonedRoot = doc.root().clone();
            clonedRoot.parent = this;
            clonedRoot.isRoot = false;
            this.children.push(clonedRoot);
            if (this.type === NodeType.Document) {
              clonedRoot.isRoot = true;
              clonedRoot.documentObject = this;
              this.rootObject = clonedRoot;
              if (this.children) {
                ref1 = this.children;
                for (j2 = 0, len = ref1.length; j2 < len; j2++) {
                  child = ref1[j2];
                  if (child.type === NodeType.DocType) {
                    child.name = clonedRoot.name;
                    break;
                  }
                }
              }
            }
            return this;
          }
          // Returns debug string for this node
          debugInfo(name) {
            var ref1, ref2;
            name = name || this.name;
            if (name == null && !((ref1 = this.parent) != null ? ref1.name : void 0)) {
              return "";
            } else if (name == null) {
              return "parent: <" + this.parent.name + ">";
            } else if (!((ref2 = this.parent) != null ? ref2.name : void 0)) {
              return "node: <" + name + ">";
            } else {
              return "node: <" + name + ">, parent: <" + this.parent.name + ">";
            }
          }
          // Aliases
          ele(name, attributes, text) {
            return this.element(name, attributes, text);
          }
          nod(name, attributes, text) {
            return this.node(name, attributes, text);
          }
          txt(value) {
            return this.text(value);
          }
          dat(value) {
            return this.cdata(value);
          }
          com(value) {
            return this.comment(value);
          }
          ins(target, value) {
            return this.instruction(target, value);
          }
          doc() {
            return this.document();
          }
          dec(version, encoding, standalone) {
            return this.declaration(version, encoding, standalone);
          }
          e(name, attributes, text) {
            return this.element(name, attributes, text);
          }
          n(name, attributes, text) {
            return this.node(name, attributes, text);
          }
          t(value) {
            return this.text(value);
          }
          d(value) {
            return this.cdata(value);
          }
          c(value) {
            return this.comment(value);
          }
          r(value) {
            return this.raw(value);
          }
          i(target, value) {
            return this.instruction(target, value);
          }
          u() {
            return this.up();
          }
          // can be deprecated in a future release
          importXMLBuilder(doc) {
            return this.importDocument(doc);
          }
          // Adds or modifies an attribute.
          // `name` attribute name
          // `value` attribute value
          attribute(name, value) {
            throw new Error("attribute() applies to element nodes only.");
          }
          att(name, value) {
            return this.attribute(name, value);
          }
          a(name, value) {
            return this.attribute(name, value);
          }
          // Removes an attribute
          // `name` attribute name
          removeAttribute(name) {
            throw new Error("attribute() applies to element nodes only.");
          }
          // DOM level 1 functions to be implemented later
          replaceChild(newChild, oldChild) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          removeChild(oldChild) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          appendChild(newChild) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          hasChildNodes() {
            return this.children.length !== 0;
          }
          cloneNode(deep) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          normalize() {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          // DOM level 2
          isSupported(feature, version) {
            return true;
          }
          hasAttributes() {
            return this.attribs.length !== 0;
          }
          // DOM level 3 functions to be implemented later
          compareDocumentPosition(other) {
            var ref, res;
            ref = this;
            if (ref === other) {
              return 0;
            } else if (this.document() !== other.document()) {
              res = DocumentPosition.Disconnected | DocumentPosition.ImplementationSpecific;
              if (Math.random() < 0.5) {
                res |= DocumentPosition.Preceding;
              } else {
                res |= DocumentPosition.Following;
              }
              return res;
            } else if (ref.isAncestor(other)) {
              return DocumentPosition.Contains | DocumentPosition.Preceding;
            } else if (ref.isDescendant(other)) {
              return DocumentPosition.Contains | DocumentPosition.Following;
            } else if (ref.isPreceding(other)) {
              return DocumentPosition.Preceding;
            } else {
              return DocumentPosition.Following;
            }
          }
          isSameNode(other) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          lookupPrefix(namespaceURI) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          isDefaultNamespace(namespaceURI) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          lookupNamespaceURI(prefix) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          isEqualNode(node) {
            var i2, j2, ref1;
            if (node.nodeType !== this.nodeType) {
              return false;
            }
            if (node.children.length !== this.children.length) {
              return false;
            }
            for (i2 = j2 = 0, ref1 = this.children.length - 1; 0 <= ref1 ? j2 <= ref1 : j2 >= ref1; i2 = 0 <= ref1 ? ++j2 : --j2) {
              if (!this.children[i2].isEqualNode(node.children[i2])) {
                return false;
              }
            }
            return true;
          }
          getFeature(feature, version) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          setUserData(key, data, handler) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          getUserData(key) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          // Returns true if other is an inclusive descendant of node,
          // and false otherwise.
          contains(other) {
            if (!other) {
              return false;
            }
            return other === this || this.isDescendant(other);
          }
          // An object A is called a descendant of an object B, if either A is 
          // a child of B or A is a child of an object C that is a descendant of B.
          isDescendant(node) {
            var child, isDescendantChild, j2, len, ref1;
            ref1 = this.children;
            for (j2 = 0, len = ref1.length; j2 < len; j2++) {
              child = ref1[j2];
              if (node === child) {
                return true;
              }
              isDescendantChild = child.isDescendant(node);
              if (isDescendantChild) {
                return true;
              }
            }
            return false;
          }
          // An object A is called an ancestor of an object B if and only if
          // B is a descendant of A.
          isAncestor(node) {
            return node.isDescendant(this);
          }
          // An object A is preceding an object B if A and B are in the 
          // same tree and A comes before B in tree order.
          isPreceding(node) {
            var nodePos, thisPos;
            nodePos = this.treePosition(node);
            thisPos = this.treePosition(this);
            if (nodePos === -1 || thisPos === -1) {
              return false;
            } else {
              return nodePos < thisPos;
            }
          }
          // An object A is folllowing an object B if A and B are in the 
          // same tree and A comes after B in tree order.
          isFollowing(node) {
            var nodePos, thisPos;
            nodePos = this.treePosition(node);
            thisPos = this.treePosition(this);
            if (nodePos === -1 || thisPos === -1) {
              return false;
            } else {
              return nodePos > thisPos;
            }
          }
          // Returns the preorder position of the given node in the tree, or -1
          // if the node is not in the tree.
          treePosition(node) {
            var found, pos;
            pos = 0;
            found = false;
            this.foreachTreeNode(this.document(), function(childNode) {
              pos++;
              if (!found && childNode === node) {
                return found = true;
              }
            });
            if (found) {
              return pos;
            } else {
              return -1;
            }
          }
          // Depth-first preorder traversal through the XML tree
          foreachTreeNode(node, func) {
            var child, j2, len, ref1, res;
            node || (node = this.document());
            ref1 = node.children;
            for (j2 = 0, len = ref1.length; j2 < len; j2++) {
              child = ref1[j2];
              if (res = func(child)) {
                return res;
              } else {
                res = this.foreachTreeNode(child, func);
                if (res) {
                  return res;
                }
              }
            }
          }
        }
        ;
        Object.defineProperty(XMLNode2.prototype, "nodeName", {
          get: function() {
            return this.name;
          }
        });
        Object.defineProperty(XMLNode2.prototype, "nodeType", {
          get: function() {
            return this.type;
          }
        });
        Object.defineProperty(XMLNode2.prototype, "nodeValue", {
          get: function() {
            return this.value;
          }
        });
        Object.defineProperty(XMLNode2.prototype, "parentNode", {
          get: function() {
            return this.parent;
          }
        });
        Object.defineProperty(XMLNode2.prototype, "childNodes", {
          get: function() {
            if (!this.childNodeList || !this.childNodeList.nodes) {
              this.childNodeList = new XMLNodeList(this.children);
            }
            return this.childNodeList;
          }
        });
        Object.defineProperty(XMLNode2.prototype, "firstChild", {
          get: function() {
            return this.children[0] || null;
          }
        });
        Object.defineProperty(XMLNode2.prototype, "lastChild", {
          get: function() {
            return this.children[this.children.length - 1] || null;
          }
        });
        Object.defineProperty(XMLNode2.prototype, "previousSibling", {
          get: function() {
            var i2;
            i2 = this.parent.children.indexOf(this);
            return this.parent.children[i2 - 1] || null;
          }
        });
        Object.defineProperty(XMLNode2.prototype, "nextSibling", {
          get: function() {
            var i2;
            i2 = this.parent.children.indexOf(this);
            return this.parent.children[i2 + 1] || null;
          }
        });
        Object.defineProperty(XMLNode2.prototype, "ownerDocument", {
          get: function() {
            return this.document() || null;
          }
        });
        Object.defineProperty(XMLNode2.prototype, "textContent", {
          get: function() {
            var child, j2, len, ref1, str;
            if (this.nodeType === NodeType.Element || this.nodeType === NodeType.DocumentFragment) {
              str = "";
              ref1 = this.children;
              for (j2 = 0, len = ref1.length; j2 < len; j2++) {
                child = ref1[j2];
                if (child.textContent) {
                  str += child.textContent;
                }
              }
              return str;
            } else {
              return null;
            }
          },
          set: function(value) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
        });
        return XMLNode2;
      }).call(this);
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLStringifier.js
var require_XMLStringifier = __commonJS({
  "node_modules/xmlbuilder/lib/XMLStringifier.js"(exports, module) {
    (function() {
      var XMLStringifier, hasProp = {}.hasOwnProperty;
      module.exports = XMLStringifier = (function() {
        class XMLStringifier2 {
          // Initializes a new instance of `XMLStringifier`
          // `options.version` The version number string of the XML spec to validate against, e.g. 1.0
          // `options.noDoubleEncoding` whether existing html entities are encoded: true or false
          // `options.stringify` a set of functions to use for converting values to strings
          // `options.noValidation` whether values will be validated and escaped or returned as is
          // `options.invalidCharReplacement` a character to replace invalid characters and disable character validation
          constructor(options) {
            var key, ref, value;
            this.assertLegalChar = this.assertLegalChar.bind(this);
            this.assertLegalName = this.assertLegalName.bind(this);
            options || (options = {});
            this.options = options;
            if (!this.options.version) {
              this.options.version = "1.0";
            }
            ref = options.stringify || {};
            for (key in ref) {
              if (!hasProp.call(ref, key)) continue;
              value = ref[key];
              this[key] = value;
            }
          }
          // Defaults
          name(val) {
            if (this.options.noValidation) {
              return val;
            }
            return this.assertLegalName("" + val || "");
          }
          text(val) {
            if (this.options.noValidation) {
              return val;
            }
            return this.assertLegalChar(this.textEscape("" + val || ""));
          }
          cdata(val) {
            if (this.options.noValidation) {
              return val;
            }
            val = "" + val || "";
            val = val.replace("]]>", "]]]]><![CDATA[>");
            return this.assertLegalChar(val);
          }
          comment(val) {
            if (this.options.noValidation) {
              return val;
            }
            val = "" + val || "";
            if (val.match(/--/)) {
              throw new Error("Comment text cannot contain double-hypen: " + val);
            }
            return this.assertLegalChar(val);
          }
          raw(val) {
            if (this.options.noValidation) {
              return val;
            }
            return "" + val || "";
          }
          attValue(val) {
            if (this.options.noValidation) {
              return val;
            }
            return this.assertLegalChar(this.attEscape(val = "" + val || ""));
          }
          insTarget(val) {
            if (this.options.noValidation) {
              return val;
            }
            return this.assertLegalChar("" + val || "");
          }
          insValue(val) {
            if (this.options.noValidation) {
              return val;
            }
            val = "" + val || "";
            if (val.match(/\?>/)) {
              throw new Error("Invalid processing instruction value: " + val);
            }
            return this.assertLegalChar(val);
          }
          xmlVersion(val) {
            if (this.options.noValidation) {
              return val;
            }
            val = "" + val || "";
            if (!val.match(/1\.[0-9]+/)) {
              throw new Error("Invalid version number: " + val);
            }
            return val;
          }
          xmlEncoding(val) {
            if (this.options.noValidation) {
              return val;
            }
            val = "" + val || "";
            if (!val.match(/^[A-Za-z](?:[A-Za-z0-9._-])*$/)) {
              throw new Error("Invalid encoding: " + val);
            }
            return this.assertLegalChar(val);
          }
          xmlStandalone(val) {
            if (this.options.noValidation) {
              return val;
            }
            if (val) {
              return "yes";
            } else {
              return "no";
            }
          }
          dtdPubID(val) {
            if (this.options.noValidation) {
              return val;
            }
            return this.assertLegalChar("" + val || "");
          }
          dtdSysID(val) {
            if (this.options.noValidation) {
              return val;
            }
            return this.assertLegalChar("" + val || "");
          }
          dtdElementValue(val) {
            if (this.options.noValidation) {
              return val;
            }
            return this.assertLegalChar("" + val || "");
          }
          dtdAttType(val) {
            if (this.options.noValidation) {
              return val;
            }
            return this.assertLegalChar("" + val || "");
          }
          dtdAttDefault(val) {
            if (this.options.noValidation) {
              return val;
            }
            return this.assertLegalChar("" + val || "");
          }
          dtdEntityValue(val) {
            if (this.options.noValidation) {
              return val;
            }
            return this.assertLegalChar("" + val || "");
          }
          dtdNData(val) {
            if (this.options.noValidation) {
              return val;
            }
            return this.assertLegalChar("" + val || "");
          }
          assertLegalChar(str) {
            var regex, res;
            if (this.options.noValidation) {
              return str;
            }
            if (this.options.version === "1.0") {
              regex = /[\0-\x08\x0B\f\x0E-\x1F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g;
              if (this.options.invalidCharReplacement !== void 0) {
                str = str.replace(regex, this.options.invalidCharReplacement);
              } else if (res = str.match(regex)) {
                throw new Error(`Invalid character in string: ${str} at index ${res.index}`);
              }
            } else if (this.options.version === "1.1") {
              regex = /[\0\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g;
              if (this.options.invalidCharReplacement !== void 0) {
                str = str.replace(regex, this.options.invalidCharReplacement);
              } else if (res = str.match(regex)) {
                throw new Error(`Invalid character in string: ${str} at index ${res.index}`);
              }
            }
            return str;
          }
          assertLegalName(str) {
            var regex;
            if (this.options.noValidation) {
              return str;
            }
            str = this.assertLegalChar(str);
            regex = /^([:A-Z_a-z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])([\x2D\.0-:A-Z_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/;
            if (!str.match(regex)) {
              throw new Error(`Invalid character in name: ${str}`);
            }
            return str;
          }
          // Escapes special characters in text
          // See http://www.w3.org/TR/2000/WD-xml-c14n-20000119.html#charescaping
          // `str` the string to escape
          textEscape(str) {
            var ampregex;
            if (this.options.noValidation) {
              return str;
            }
            ampregex = this.options.noDoubleEncoding ? /(?!&(lt|gt|amp|apos|quot);)&/g : /&/g;
            return str.replace(ampregex, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#xD;");
          }
          // Escapes special characters in attribute values
          // See http://www.w3.org/TR/2000/WD-xml-c14n-20000119.html#charescaping
          // `str` the string to escape
          attEscape(str) {
            var ampregex;
            if (this.options.noValidation) {
              return str;
            }
            ampregex = this.options.noDoubleEncoding ? /(?!&(lt|gt|amp|apos|quot);)&/g : /&/g;
            return str.replace(ampregex, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/\t/g, "&#x9;").replace(/\n/g, "&#xA;").replace(/\r/g, "&#xD;");
          }
        }
        ;
        XMLStringifier2.prototype.convertAttKey = "@";
        XMLStringifier2.prototype.convertPIKey = "?";
        XMLStringifier2.prototype.convertTextKey = "#text";
        XMLStringifier2.prototype.convertCDataKey = "#cdata";
        XMLStringifier2.prototype.convertCommentKey = "#comment";
        XMLStringifier2.prototype.convertRawKey = "#raw";
        return XMLStringifier2;
      }).call(this);
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/WriterState.js
var require_WriterState = __commonJS({
  "node_modules/xmlbuilder/lib/WriterState.js"(exports, module) {
    (function() {
      module.exports = {
        None: 0,
        OpenTag: 1,
        InsideTag: 2,
        CloseTag: 3
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLWriterBase.js
var require_XMLWriterBase = __commonJS({
  "node_modules/xmlbuilder/lib/XMLWriterBase.js"(exports, module) {
    (function() {
      var NodeType, WriterState, XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLDummy, XMLElement, XMLProcessingInstruction, XMLRaw, XMLText, XMLWriterBase, assign, hasProp = {}.hasOwnProperty;
      ({ assign } = require_Utility());
      NodeType = require_NodeType();
      XMLDeclaration = require_XMLDeclaration();
      XMLDocType = require_XMLDocType();
      XMLCData = require_XMLCData();
      XMLComment = require_XMLComment();
      XMLElement = require_XMLElement();
      XMLRaw = require_XMLRaw();
      XMLText = require_XMLText();
      XMLProcessingInstruction = require_XMLProcessingInstruction();
      XMLDummy = require_XMLDummy();
      XMLDTDAttList = require_XMLDTDAttList();
      XMLDTDElement = require_XMLDTDElement();
      XMLDTDEntity = require_XMLDTDEntity();
      XMLDTDNotation = require_XMLDTDNotation();
      WriterState = require_WriterState();
      module.exports = XMLWriterBase = class XMLWriterBase {
        // Initializes a new instance of `XMLWriterBase`
        // `options.pretty` pretty prints the result
        // `options.indent` indentation string
        // `options.newline` newline sequence
        // `options.offset` a fixed number of indentations to add to every line
        // `options.width` maximum column width
        // `options.allowEmpty` do not self close empty element tags
        // 'options.dontPrettyTextNodes' if any text is present in node, don't indent or LF
        // `options.spaceBeforeSlash` add a space before the closing slash of empty elements
        constructor(options) {
          var key, ref, value;
          options || (options = {});
          this.options = options;
          ref = options.writer || {};
          for (key in ref) {
            if (!hasProp.call(ref, key)) continue;
            value = ref[key];
            this["_" + key] = this[key];
            this[key] = value;
          }
        }
        // Filters writer options and provides defaults
        // `options` writer options
        filterOptions(options) {
          var filteredOptions, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7;
          options || (options = {});
          options = assign({}, this.options, options);
          filteredOptions = {
            writer: this
          };
          filteredOptions.pretty = options.pretty || false;
          filteredOptions.allowEmpty = options.allowEmpty || false;
          filteredOptions.indent = (ref = options.indent) != null ? ref : "  ";
          filteredOptions.newline = (ref1 = options.newline) != null ? ref1 : "\n";
          filteredOptions.offset = (ref2 = options.offset) != null ? ref2 : 0;
          filteredOptions.width = (ref3 = options.width) != null ? ref3 : 0;
          filteredOptions.dontPrettyTextNodes = (ref4 = (ref5 = options.dontPrettyTextNodes) != null ? ref5 : options.dontprettytextnodes) != null ? ref4 : 0;
          filteredOptions.spaceBeforeSlash = (ref6 = (ref7 = options.spaceBeforeSlash) != null ? ref7 : options.spacebeforeslash) != null ? ref6 : "";
          if (filteredOptions.spaceBeforeSlash === true) {
            filteredOptions.spaceBeforeSlash = " ";
          }
          filteredOptions.suppressPrettyCount = 0;
          filteredOptions.user = {};
          filteredOptions.state = WriterState.None;
          return filteredOptions;
        }
        // Returns the indentation string for the current level
        // `node` current node
        // `options` writer options
        // `level` current indentation level
        indent(node, options, level) {
          var indentLevel;
          if (!options.pretty || options.suppressPrettyCount) {
            return "";
          } else if (options.pretty) {
            indentLevel = (level || 0) + options.offset + 1;
            if (indentLevel > 0) {
              return new Array(indentLevel).join(options.indent);
            }
          }
          return "";
        }
        // Returns the newline string
        // `node` current node
        // `options` writer options
        // `level` current indentation level
        endline(node, options, level) {
          if (!options.pretty || options.suppressPrettyCount) {
            return "";
          } else {
            return options.newline;
          }
        }
        attribute(att, options, level) {
          var r2;
          this.openAttribute(att, options, level);
          if (options.pretty && options.width > 0) {
            r2 = att.name + '="' + att.value + '"';
          } else {
            r2 = " " + att.name + '="' + att.value + '"';
          }
          this.closeAttribute(att, options, level);
          return r2;
        }
        cdata(node, options, level) {
          var r2;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r2 = this.indent(node, options, level) + "<![CDATA[";
          options.state = WriterState.InsideTag;
          r2 += node.value;
          options.state = WriterState.CloseTag;
          r2 += "]]>" + this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r2;
        }
        comment(node, options, level) {
          var r2;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r2 = this.indent(node, options, level) + "<!-- ";
          options.state = WriterState.InsideTag;
          r2 += node.value;
          options.state = WriterState.CloseTag;
          r2 += " -->" + this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r2;
        }
        declaration(node, options, level) {
          var r2;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r2 = this.indent(node, options, level) + "<?xml";
          options.state = WriterState.InsideTag;
          r2 += ' version="' + node.version + '"';
          if (node.encoding != null) {
            r2 += ' encoding="' + node.encoding + '"';
          }
          if (node.standalone != null) {
            r2 += ' standalone="' + node.standalone + '"';
          }
          options.state = WriterState.CloseTag;
          r2 += options.spaceBeforeSlash + "?>";
          r2 += this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r2;
        }
        docType(node, options, level) {
          var child, i2, len1, r2, ref;
          level || (level = 0);
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r2 = this.indent(node, options, level);
          r2 += "<!DOCTYPE " + node.root().name;
          if (node.pubID && node.sysID) {
            r2 += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
          } else if (node.sysID) {
            r2 += ' SYSTEM "' + node.sysID + '"';
          }
          if (node.children.length > 0) {
            r2 += " [";
            r2 += this.endline(node, options, level);
            options.state = WriterState.InsideTag;
            ref = node.children;
            for (i2 = 0, len1 = ref.length; i2 < len1; i2++) {
              child = ref[i2];
              r2 += this.writeChildNode(child, options, level + 1);
            }
            options.state = WriterState.CloseTag;
            r2 += "]";
          }
          options.state = WriterState.CloseTag;
          r2 += options.spaceBeforeSlash + ">";
          r2 += this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r2;
        }
        element(node, options, level) {
          var att, attLen, child, childNodeCount, firstChildNode, i2, j2, len, len1, len2, name, prettySuppressed, r2, ratt, ref, ref1, ref2, ref3, rline;
          level || (level = 0);
          prettySuppressed = false;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r2 = this.indent(node, options, level) + "<" + node.name;
          if (options.pretty && options.width > 0) {
            len = r2.length;
            ref = node.attribs;
            for (name in ref) {
              if (!hasProp.call(ref, name)) continue;
              att = ref[name];
              ratt = this.attribute(att, options, level);
              attLen = ratt.length;
              if (len + attLen > options.width) {
                rline = this.indent(node, options, level + 1) + ratt;
                r2 += this.endline(node, options, level) + rline;
                len = rline.length;
              } else {
                rline = " " + ratt;
                r2 += rline;
                len += rline.length;
              }
            }
          } else {
            ref1 = node.attribs;
            for (name in ref1) {
              if (!hasProp.call(ref1, name)) continue;
              att = ref1[name];
              r2 += this.attribute(att, options, level);
            }
          }
          childNodeCount = node.children.length;
          firstChildNode = childNodeCount === 0 ? null : node.children[0];
          if (childNodeCount === 0 || node.children.every(function(e3) {
            return (e3.type === NodeType.Text || e3.type === NodeType.Raw || e3.type === NodeType.CData) && e3.value === "";
          })) {
            if (options.allowEmpty) {
              r2 += ">";
              options.state = WriterState.CloseTag;
              r2 += "</" + node.name + ">" + this.endline(node, options, level);
            } else {
              options.state = WriterState.CloseTag;
              r2 += options.spaceBeforeSlash + "/>" + this.endline(node, options, level);
            }
          } else if (options.pretty && childNodeCount === 1 && (firstChildNode.type === NodeType.Text || firstChildNode.type === NodeType.Raw || firstChildNode.type === NodeType.CData) && firstChildNode.value != null) {
            r2 += ">";
            options.state = WriterState.InsideTag;
            options.suppressPrettyCount++;
            prettySuppressed = true;
            r2 += this.writeChildNode(firstChildNode, options, level + 1);
            options.suppressPrettyCount--;
            prettySuppressed = false;
            options.state = WriterState.CloseTag;
            r2 += "</" + node.name + ">" + this.endline(node, options, level);
          } else {
            if (options.dontPrettyTextNodes) {
              ref2 = node.children;
              for (i2 = 0, len1 = ref2.length; i2 < len1; i2++) {
                child = ref2[i2];
                if ((child.type === NodeType.Text || child.type === NodeType.Raw || child.type === NodeType.CData) && child.value != null) {
                  options.suppressPrettyCount++;
                  prettySuppressed = true;
                  break;
                }
              }
            }
            r2 += ">" + this.endline(node, options, level);
            options.state = WriterState.InsideTag;
            ref3 = node.children;
            for (j2 = 0, len2 = ref3.length; j2 < len2; j2++) {
              child = ref3[j2];
              r2 += this.writeChildNode(child, options, level + 1);
            }
            options.state = WriterState.CloseTag;
            r2 += this.indent(node, options, level) + "</" + node.name + ">";
            if (prettySuppressed) {
              options.suppressPrettyCount--;
            }
            r2 += this.endline(node, options, level);
            options.state = WriterState.None;
          }
          this.closeNode(node, options, level);
          return r2;
        }
        writeChildNode(node, options, level) {
          switch (node.type) {
            case NodeType.CData:
              return this.cdata(node, options, level);
            case NodeType.Comment:
              return this.comment(node, options, level);
            case NodeType.Element:
              return this.element(node, options, level);
            case NodeType.Raw:
              return this.raw(node, options, level);
            case NodeType.Text:
              return this.text(node, options, level);
            case NodeType.ProcessingInstruction:
              return this.processingInstruction(node, options, level);
            case NodeType.Dummy:
              return "";
            case NodeType.Declaration:
              return this.declaration(node, options, level);
            case NodeType.DocType:
              return this.docType(node, options, level);
            case NodeType.AttributeDeclaration:
              return this.dtdAttList(node, options, level);
            case NodeType.ElementDeclaration:
              return this.dtdElement(node, options, level);
            case NodeType.EntityDeclaration:
              return this.dtdEntity(node, options, level);
            case NodeType.NotationDeclaration:
              return this.dtdNotation(node, options, level);
            default:
              throw new Error("Unknown XML node type: " + node.constructor.name);
          }
        }
        processingInstruction(node, options, level) {
          var r2;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r2 = this.indent(node, options, level) + "<?";
          options.state = WriterState.InsideTag;
          r2 += node.target;
          if (node.value) {
            r2 += " " + node.value;
          }
          options.state = WriterState.CloseTag;
          r2 += options.spaceBeforeSlash + "?>";
          r2 += this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r2;
        }
        raw(node, options, level) {
          var r2;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r2 = this.indent(node, options, level);
          options.state = WriterState.InsideTag;
          r2 += node.value;
          options.state = WriterState.CloseTag;
          r2 += this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r2;
        }
        text(node, options, level) {
          var r2;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r2 = this.indent(node, options, level);
          options.state = WriterState.InsideTag;
          r2 += node.value;
          options.state = WriterState.CloseTag;
          r2 += this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r2;
        }
        dtdAttList(node, options, level) {
          var r2;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r2 = this.indent(node, options, level) + "<!ATTLIST";
          options.state = WriterState.InsideTag;
          r2 += " " + node.elementName + " " + node.attributeName + " " + node.attributeType;
          if (node.defaultValueType !== "#DEFAULT") {
            r2 += " " + node.defaultValueType;
          }
          if (node.defaultValue) {
            r2 += ' "' + node.defaultValue + '"';
          }
          options.state = WriterState.CloseTag;
          r2 += options.spaceBeforeSlash + ">" + this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r2;
        }
        dtdElement(node, options, level) {
          var r2;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r2 = this.indent(node, options, level) + "<!ELEMENT";
          options.state = WriterState.InsideTag;
          r2 += " " + node.name + " " + node.value;
          options.state = WriterState.CloseTag;
          r2 += options.spaceBeforeSlash + ">" + this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r2;
        }
        dtdEntity(node, options, level) {
          var r2;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r2 = this.indent(node, options, level) + "<!ENTITY";
          options.state = WriterState.InsideTag;
          if (node.pe) {
            r2 += " %";
          }
          r2 += " " + node.name;
          if (node.value) {
            r2 += ' "' + node.value + '"';
          } else {
            if (node.pubID && node.sysID) {
              r2 += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
            } else if (node.sysID) {
              r2 += ' SYSTEM "' + node.sysID + '"';
            }
            if (node.nData) {
              r2 += " NDATA " + node.nData;
            }
          }
          options.state = WriterState.CloseTag;
          r2 += options.spaceBeforeSlash + ">" + this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r2;
        }
        dtdNotation(node, options, level) {
          var r2;
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r2 = this.indent(node, options, level) + "<!NOTATION";
          options.state = WriterState.InsideTag;
          r2 += " " + node.name;
          if (node.pubID && node.sysID) {
            r2 += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
          } else if (node.pubID) {
            r2 += ' PUBLIC "' + node.pubID + '"';
          } else if (node.sysID) {
            r2 += ' SYSTEM "' + node.sysID + '"';
          }
          options.state = WriterState.CloseTag;
          r2 += options.spaceBeforeSlash + ">" + this.endline(node, options, level);
          options.state = WriterState.None;
          this.closeNode(node, options, level);
          return r2;
        }
        openNode(node, options, level) {
        }
        closeNode(node, options, level) {
        }
        openAttribute(att, options, level) {
        }
        closeAttribute(att, options, level) {
        }
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLStringWriter.js
var require_XMLStringWriter = __commonJS({
  "node_modules/xmlbuilder/lib/XMLStringWriter.js"(exports, module) {
    (function() {
      var XMLStringWriter, XMLWriterBase;
      XMLWriterBase = require_XMLWriterBase();
      module.exports = XMLStringWriter = class XMLStringWriter extends XMLWriterBase {
        // Initializes a new instance of `XMLStringWriter`
        // `options.pretty` pretty prints the result
        // `options.indent` indentation string
        // `options.newline` newline sequence
        // `options.offset` a fixed number of indentations to add to every line
        // `options.allowEmpty` do not self close empty element tags
        // 'options.dontPrettyTextNodes' if any text is present in node, don't indent or LF
        // `options.spaceBeforeSlash` add a space before the closing slash of empty elements
        constructor(options) {
          super(options);
        }
        document(doc, options) {
          var child, i2, len, r2, ref;
          options = this.filterOptions(options);
          r2 = "";
          ref = doc.children;
          for (i2 = 0, len = ref.length; i2 < len; i2++) {
            child = ref[i2];
            r2 += this.writeChildNode(child, options, 0);
          }
          if (options.pretty && r2.slice(-options.newline.length) === options.newline) {
            r2 = r2.slice(0, -options.newline.length);
          }
          return r2;
        }
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLDocument.js
var require_XMLDocument = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDocument.js"(exports, module) {
    (function() {
      var NodeType, XMLDOMConfiguration, XMLDOMImplementation, XMLDocument, XMLNode, XMLStringWriter, XMLStringifier, isPlainObject;
      ({ isPlainObject } = require_Utility());
      XMLDOMImplementation = require_XMLDOMImplementation();
      XMLDOMConfiguration = require_XMLDOMConfiguration();
      XMLNode = require_XMLNode();
      NodeType = require_NodeType();
      XMLStringifier = require_XMLStringifier();
      XMLStringWriter = require_XMLStringWriter();
      module.exports = XMLDocument = (function() {
        class XMLDocument2 extends XMLNode {
          // Initializes a new instance of `XMLDocument`
          // `options.keepNullNodes` whether nodes with null values will be kept
          //     or ignored: true or false
          // `options.keepNullAttributes` whether attributes with null values will be
          //     kept or ignored: true or false
          // `options.ignoreDecorators` whether decorator strings will be ignored when
          //     converting JS objects: true or false
          // `options.separateArrayItems` whether array items are created as separate
          //     nodes when passed as an object value: true or false
          // `options.noDoubleEncoding` whether existing html entities are encoded:
          //     true or false
          // `options.stringify` a set of functions to use for converting values to
          //     strings
          // `options.writer` the default XML writer to use for converting nodes to
          //     string. If the default writer is not set, the built-in XMLStringWriter
          //     will be used instead.
          constructor(options) {
            super(null);
            this.name = "#document";
            this.type = NodeType.Document;
            this.documentURI = null;
            this.domConfig = new XMLDOMConfiguration();
            options || (options = {});
            if (!options.writer) {
              options.writer = new XMLStringWriter();
            }
            this.options = options;
            this.stringify = new XMLStringifier(options);
          }
          // Ends the document and passes it to the given XML writer
          // `writer` is either an XML writer or a plain object to pass to the
          // constructor of the default XML writer. The default writer is assigned when
          // creating the XML document. Following flags are recognized by the
          // built-in XMLStringWriter:
          //   `writer.pretty` pretty prints the result
          //   `writer.indent` indentation for pretty print
          //   `writer.offset` how many indentations to add to every line for pretty print
          //   `writer.newline` newline sequence for pretty print
          end(writer) {
            var writerOptions;
            writerOptions = {};
            if (!writer) {
              writer = this.options.writer;
            } else if (isPlainObject(writer)) {
              writerOptions = writer;
              writer = this.options.writer;
            }
            return writer.document(this, writer.filterOptions(writerOptions));
          }
          // Converts the XML document to string
          // `options.pretty` pretty prints the result
          // `options.indent` indentation for pretty print
          // `options.offset` how many indentations to add to every line for pretty print
          // `options.newline` newline sequence for pretty print
          toString(options) {
            return this.options.writer.document(this, this.options.writer.filterOptions(options));
          }
          // DOM level 1 functions to be implemented later
          createElement(tagName) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          createDocumentFragment() {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          createTextNode(data) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          createComment(data) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          createCDATASection(data) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          createProcessingInstruction(target, data) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          createAttribute(name) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          createEntityReference(name) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          getElementsByTagName(tagname) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          // DOM level 2 functions to be implemented later
          importNode(importedNode, deep) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          createElementNS(namespaceURI, qualifiedName) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          createAttributeNS(namespaceURI, qualifiedName) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          getElementsByTagNameNS(namespaceURI, localName) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          getElementById(elementId) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          // DOM level 3 functions to be implemented later
          adoptNode(source) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          normalizeDocument() {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          renameNode(node, namespaceURI, qualifiedName) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          // DOM level 4 functions to be implemented later
          getElementsByClassName(classNames) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          createEvent(eventInterface) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          createRange() {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          createNodeIterator(root, whatToShow, filter) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
          createTreeWalker(root, whatToShow, filter) {
            throw new Error("This DOM method is not implemented." + this.debugInfo());
          }
        }
        ;
        Object.defineProperty(XMLDocument2.prototype, "implementation", {
          value: new XMLDOMImplementation()
        });
        Object.defineProperty(XMLDocument2.prototype, "doctype", {
          get: function() {
            var child, i2, len, ref;
            ref = this.children;
            for (i2 = 0, len = ref.length; i2 < len; i2++) {
              child = ref[i2];
              if (child.type === NodeType.DocType) {
                return child;
              }
            }
            return null;
          }
        });
        Object.defineProperty(XMLDocument2.prototype, "documentElement", {
          get: function() {
            return this.rootObject || null;
          }
        });
        Object.defineProperty(XMLDocument2.prototype, "inputEncoding", {
          get: function() {
            return null;
          }
        });
        Object.defineProperty(XMLDocument2.prototype, "strictErrorChecking", {
          get: function() {
            return false;
          }
        });
        Object.defineProperty(XMLDocument2.prototype, "xmlEncoding", {
          get: function() {
            if (this.children.length !== 0 && this.children[0].type === NodeType.Declaration) {
              return this.children[0].encoding;
            } else {
              return null;
            }
          }
        });
        Object.defineProperty(XMLDocument2.prototype, "xmlStandalone", {
          get: function() {
            if (this.children.length !== 0 && this.children[0].type === NodeType.Declaration) {
              return this.children[0].standalone === "yes";
            } else {
              return false;
            }
          }
        });
        Object.defineProperty(XMLDocument2.prototype, "xmlVersion", {
          get: function() {
            if (this.children.length !== 0 && this.children[0].type === NodeType.Declaration) {
              return this.children[0].version;
            } else {
              return "1.0";
            }
          }
        });
        Object.defineProperty(XMLDocument2.prototype, "URL", {
          get: function() {
            return this.documentURI;
          }
        });
        Object.defineProperty(XMLDocument2.prototype, "origin", {
          get: function() {
            return null;
          }
        });
        Object.defineProperty(XMLDocument2.prototype, "compatMode", {
          get: function() {
            return null;
          }
        });
        Object.defineProperty(XMLDocument2.prototype, "characterSet", {
          get: function() {
            return null;
          }
        });
        Object.defineProperty(XMLDocument2.prototype, "contentType", {
          get: function() {
            return null;
          }
        });
        return XMLDocument2;
      }).call(this);
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLDocumentCB.js
var require_XMLDocumentCB = __commonJS({
  "node_modules/xmlbuilder/lib/XMLDocumentCB.js"(exports, module) {
    (function() {
      var NodeType, WriterState, XMLAttribute, XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLDocument, XMLDocumentCB, XMLElement, XMLProcessingInstruction, XMLRaw, XMLStringWriter, XMLStringifier, XMLText, getValue, isFunction, isObject, isPlainObject, hasProp = {}.hasOwnProperty;
      ({ isObject, isFunction, isPlainObject, getValue } = require_Utility());
      NodeType = require_NodeType();
      XMLDocument = require_XMLDocument();
      XMLElement = require_XMLElement();
      XMLCData = require_XMLCData();
      XMLComment = require_XMLComment();
      XMLRaw = require_XMLRaw();
      XMLText = require_XMLText();
      XMLProcessingInstruction = require_XMLProcessingInstruction();
      XMLDeclaration = require_XMLDeclaration();
      XMLDocType = require_XMLDocType();
      XMLDTDAttList = require_XMLDTDAttList();
      XMLDTDEntity = require_XMLDTDEntity();
      XMLDTDElement = require_XMLDTDElement();
      XMLDTDNotation = require_XMLDTDNotation();
      XMLAttribute = require_XMLAttribute();
      XMLStringifier = require_XMLStringifier();
      XMLStringWriter = require_XMLStringWriter();
      WriterState = require_WriterState();
      module.exports = XMLDocumentCB = class XMLDocumentCB {
        // Initializes a new instance of `XMLDocumentCB`
        // `options.keepNullNodes` whether nodes with null values will be kept
        //     or ignored: true or false
        // `options.keepNullAttributes` whether attributes with null values will be
        //     kept or ignored: true or false
        // `options.ignoreDecorators` whether decorator strings will be ignored when
        //     converting JS objects: true or false
        // `options.separateArrayItems` whether array items are created as separate
        //     nodes when passed as an object value: true or false
        // `options.noDoubleEncoding` whether existing html entities are encoded:
        //     true or false
        // `options.stringify` a set of functions to use for converting values to
        //     strings
        // `options.writer` the default XML writer to use for converting nodes to
        //     string. If the default writer is not set, the built-in XMLStringWriter
        //     will be used instead.
        // `onData` the function to be called when a new chunk of XML is output. The
        //          string containing the XML chunk is passed to `onData` as its first
        //          argument, and the current indentation level as its second argument.
        // `onEnd`  the function to be called when the XML document is completed with
        //          `end`. `onEnd` does not receive any arguments.
        constructor(options, onData, onEnd) {
          var writerOptions;
          this.name = "?xml";
          this.type = NodeType.Document;
          options || (options = {});
          writerOptions = {};
          if (!options.writer) {
            options.writer = new XMLStringWriter();
          } else if (isPlainObject(options.writer)) {
            writerOptions = options.writer;
            options.writer = new XMLStringWriter();
          }
          this.options = options;
          this.writer = options.writer;
          this.writerOptions = this.writer.filterOptions(writerOptions);
          this.stringify = new XMLStringifier(options);
          this.onDataCallback = onData || function() {
          };
          this.onEndCallback = onEnd || function() {
          };
          this.currentNode = null;
          this.currentLevel = -1;
          this.openTags = {};
          this.documentStarted = false;
          this.documentCompleted = false;
          this.root = null;
        }
        // Creates a child element node from the given XMLNode
        // `node` the child node
        createChildNode(node) {
          var att, attName, attributes, child, i2, len, ref, ref1;
          switch (node.type) {
            case NodeType.CData:
              this.cdata(node.value);
              break;
            case NodeType.Comment:
              this.comment(node.value);
              break;
            case NodeType.Element:
              attributes = {};
              ref = node.attribs;
              for (attName in ref) {
                if (!hasProp.call(ref, attName)) continue;
                att = ref[attName];
                attributes[attName] = att.value;
              }
              this.node(node.name, attributes);
              break;
            case NodeType.Dummy:
              this.dummy();
              break;
            case NodeType.Raw:
              this.raw(node.value);
              break;
            case NodeType.Text:
              this.text(node.value);
              break;
            case NodeType.ProcessingInstruction:
              this.instruction(node.target, node.value);
              break;
            default:
              throw new Error("This XML node type is not supported in a JS object: " + node.constructor.name);
          }
          ref1 = node.children;
          for (i2 = 0, len = ref1.length; i2 < len; i2++) {
            child = ref1[i2];
            this.createChildNode(child);
            if (child.type === NodeType.Element) {
              this.up();
            }
          }
          return this;
        }
        // Creates a dummy node
        dummy() {
          return this;
        }
        // Creates a node
        // `name` name of the node
        // `attributes` an object containing name/value pairs of attributes
        // `text` element text
        node(name, attributes, text) {
          if (name == null) {
            throw new Error("Missing node name.");
          }
          if (this.root && this.currentLevel === -1) {
            throw new Error("Document can only have one root node. " + this.debugInfo(name));
          }
          this.openCurrent();
          name = getValue(name);
          if (attributes == null) {
            attributes = {};
          }
          attributes = getValue(attributes);
          if (!isObject(attributes)) {
            [text, attributes] = [attributes, text];
          }
          this.currentNode = new XMLElement(this, name, attributes);
          this.currentNode.children = false;
          this.currentLevel++;
          this.openTags[this.currentLevel] = this.currentNode;
          if (text != null) {
            this.text(text);
          }
          return this;
        }
        // Creates a child element node or an element type declaration when called
        // inside the DTD
        // `name` name of the node
        // `attributes` an object containing name/value pairs of attributes
        // `text` element text
        element(name, attributes, text) {
          var child, i2, len, oldValidationFlag, ref, root;
          if (this.currentNode && this.currentNode.type === NodeType.DocType) {
            this.dtdElement(...arguments);
          } else {
            if (Array.isArray(name) || isObject(name) || isFunction(name)) {
              oldValidationFlag = this.options.noValidation;
              this.options.noValidation = true;
              root = new XMLDocument(this.options).element("TEMP_ROOT");
              root.element(name);
              this.options.noValidation = oldValidationFlag;
              ref = root.children;
              for (i2 = 0, len = ref.length; i2 < len; i2++) {
                child = ref[i2];
                this.createChildNode(child);
                if (child.type === NodeType.Element) {
                  this.up();
                }
              }
            } else {
              this.node(name, attributes, text);
            }
          }
          return this;
        }
        // Adds or modifies an attribute
        // `name` attribute name
        // `value` attribute value
        attribute(name, value) {
          var attName, attValue;
          if (!this.currentNode || this.currentNode.children) {
            throw new Error("att() can only be used immediately after an ele() call in callback mode. " + this.debugInfo(name));
          }
          if (name != null) {
            name = getValue(name);
          }
          if (isObject(name)) {
            for (attName in name) {
              if (!hasProp.call(name, attName)) continue;
              attValue = name[attName];
              this.attribute(attName, attValue);
            }
          } else {
            if (isFunction(value)) {
              value = value.apply();
            }
            if (this.options.keepNullAttributes && value == null) {
              this.currentNode.attribs[name] = new XMLAttribute(this, name, "");
            } else if (value != null) {
              this.currentNode.attribs[name] = new XMLAttribute(this, name, value);
            }
          }
          return this;
        }
        // Creates a text node
        // `value` element text
        text(value) {
          var node;
          this.openCurrent();
          node = new XMLText(this, value);
          this.onData(this.writer.text(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        }
        // Creates a CDATA node
        // `value` element text without CDATA delimiters
        cdata(value) {
          var node;
          this.openCurrent();
          node = new XMLCData(this, value);
          this.onData(this.writer.cdata(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        }
        // Creates a comment node
        // `value` comment text
        comment(value) {
          var node;
          this.openCurrent();
          node = new XMLComment(this, value);
          this.onData(this.writer.comment(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        }
        // Adds unescaped raw text
        // `value` text
        raw(value) {
          var node;
          this.openCurrent();
          node = new XMLRaw(this, value);
          this.onData(this.writer.raw(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        }
        // Adds a processing instruction
        // `target` instruction target
        // `value` instruction value
        instruction(target, value) {
          var i2, insTarget, insValue, len, node;
          this.openCurrent();
          if (target != null) {
            target = getValue(target);
          }
          if (value != null) {
            value = getValue(value);
          }
          if (Array.isArray(target)) {
            for (i2 = 0, len = target.length; i2 < len; i2++) {
              insTarget = target[i2];
              this.instruction(insTarget);
            }
          } else if (isObject(target)) {
            for (insTarget in target) {
              if (!hasProp.call(target, insTarget)) continue;
              insValue = target[insTarget];
              this.instruction(insTarget, insValue);
            }
          } else {
            if (isFunction(value)) {
              value = value.apply();
            }
            node = new XMLProcessingInstruction(this, target, value);
            this.onData(this.writer.processingInstruction(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          }
          return this;
        }
        // Creates the xml declaration
        // `version` A version number string, e.g. 1.0
        // `encoding` Encoding declaration, e.g. UTF-8
        // `standalone` standalone document declaration: true or false
        declaration(version, encoding, standalone) {
          var node;
          this.openCurrent();
          if (this.documentStarted) {
            throw new Error("declaration() must be the first node.");
          }
          node = new XMLDeclaration(this, version, encoding, standalone);
          this.onData(this.writer.declaration(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        }
        // Creates the document type declaration
        // `root`  the name of the root node
        // `pubID` the public identifier of the external subset
        // `sysID` the system identifier of the external subset
        doctype(root, pubID, sysID) {
          this.openCurrent();
          if (root == null) {
            throw new Error("Missing root node name.");
          }
          if (this.root) {
            throw new Error("dtd() must come before the root node.");
          }
          this.currentNode = new XMLDocType(this, pubID, sysID);
          this.currentNode.rootNodeName = root;
          this.currentNode.children = false;
          this.currentLevel++;
          this.openTags[this.currentLevel] = this.currentNode;
          return this;
        }
        // Creates an element type declaration
        // `name` element name
        // `value` element content (defaults to #PCDATA)
        dtdElement(name, value) {
          var node;
          this.openCurrent();
          node = new XMLDTDElement(this, name, value);
          this.onData(this.writer.dtdElement(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        }
        // Creates an attribute declaration
        // `elementName` the name of the element containing this attribute
        // `attributeName` attribute name
        // `attributeType` type of the attribute (defaults to CDATA)
        // `defaultValueType` default value type (either #REQUIRED, #IMPLIED, #FIXED or
        //                    #DEFAULT) (defaults to #IMPLIED)
        // `defaultValue` default value of the attribute
        //                (only used for #FIXED or #DEFAULT)
        attList(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
          var node;
          this.openCurrent();
          node = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
          this.onData(this.writer.dtdAttList(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        }
        // Creates a general entity declaration
        // `name` the name of the entity
        // `value` internal entity value or an object with external entity details
        // `value.pubID` public identifier
        // `value.sysID` system identifier
        // `value.nData` notation declaration
        entity(name, value) {
          var node;
          this.openCurrent();
          node = new XMLDTDEntity(this, false, name, value);
          this.onData(this.writer.dtdEntity(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        }
        // Creates a parameter entity declaration
        // `name` the name of the entity
        // `value` internal entity value or an object with external entity details
        // `value.pubID` public identifier
        // `value.sysID` system identifier
        pEntity(name, value) {
          var node;
          this.openCurrent();
          node = new XMLDTDEntity(this, true, name, value);
          this.onData(this.writer.dtdEntity(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        }
        // Creates a NOTATION declaration
        // `name` the name of the notation
        // `value` an object with external entity details
        // `value.pubID` public identifier
        // `value.sysID` system identifier
        notation(name, value) {
          var node;
          this.openCurrent();
          node = new XMLDTDNotation(this, name, value);
          this.onData(this.writer.dtdNotation(node, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
          return this;
        }
        // Gets the parent node
        up() {
          if (this.currentLevel < 0) {
            throw new Error("The document node has no parent.");
          }
          if (this.currentNode) {
            if (this.currentNode.children) {
              this.closeNode(this.currentNode);
            } else {
              this.openNode(this.currentNode);
            }
            this.currentNode = null;
          } else {
            this.closeNode(this.openTags[this.currentLevel]);
          }
          delete this.openTags[this.currentLevel];
          this.currentLevel--;
          return this;
        }
        // Ends the document
        end() {
          while (this.currentLevel >= 0) {
            this.up();
          }
          return this.onEnd();
        }
        // Opens the current parent node
        openCurrent() {
          if (this.currentNode) {
            this.currentNode.children = true;
            return this.openNode(this.currentNode);
          }
        }
        // Writes the opening tag of the current node or the entire node if it has
        // no child nodes
        openNode(node) {
          var att, chunk, name, ref;
          if (!node.isOpen) {
            if (!this.root && this.currentLevel === 0 && node.type === NodeType.Element) {
              this.root = node;
            }
            chunk = "";
            if (node.type === NodeType.Element) {
              this.writerOptions.state = WriterState.OpenTag;
              chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + "<" + node.name;
              ref = node.attribs;
              for (name in ref) {
                if (!hasProp.call(ref, name)) continue;
                att = ref[name];
                chunk += this.writer.attribute(att, this.writerOptions, this.currentLevel);
              }
              chunk += (node.children ? ">" : "/>") + this.writer.endline(node, this.writerOptions, this.currentLevel);
              this.writerOptions.state = WriterState.InsideTag;
            } else {
              this.writerOptions.state = WriterState.OpenTag;
              chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + "<!DOCTYPE " + node.rootNodeName;
              if (node.pubID && node.sysID) {
                chunk += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
              } else if (node.sysID) {
                chunk += ' SYSTEM "' + node.sysID + '"';
              }
              if (node.children) {
                chunk += " [";
                this.writerOptions.state = WriterState.InsideTag;
              } else {
                this.writerOptions.state = WriterState.CloseTag;
                chunk += ">";
              }
              chunk += this.writer.endline(node, this.writerOptions, this.currentLevel);
            }
            this.onData(chunk, this.currentLevel);
            return node.isOpen = true;
          }
        }
        // Writes the closing tag of the current node
        closeNode(node) {
          var chunk;
          if (!node.isClosed) {
            chunk = "";
            this.writerOptions.state = WriterState.CloseTag;
            if (node.type === NodeType.Element) {
              chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + "</" + node.name + ">" + this.writer.endline(node, this.writerOptions, this.currentLevel);
            } else {
              chunk = this.writer.indent(node, this.writerOptions, this.currentLevel) + "]>" + this.writer.endline(node, this.writerOptions, this.currentLevel);
            }
            this.writerOptions.state = WriterState.None;
            this.onData(chunk, this.currentLevel);
            return node.isClosed = true;
          }
        }
        // Called when a new chunk of XML is output
        // `chunk` a string containing the XML chunk
        // `level` current indentation level
        onData(chunk, level) {
          this.documentStarted = true;
          return this.onDataCallback(chunk, level + 1);
        }
        // Called when the XML document is completed
        onEnd() {
          this.documentCompleted = true;
          return this.onEndCallback();
        }
        // Returns debug string
        debugInfo(name) {
          if (name == null) {
            return "";
          } else {
            return "node: <" + name + ">";
          }
        }
        // Node aliases
        ele() {
          return this.element(...arguments);
        }
        nod(name, attributes, text) {
          return this.node(name, attributes, text);
        }
        txt(value) {
          return this.text(value);
        }
        dat(value) {
          return this.cdata(value);
        }
        com(value) {
          return this.comment(value);
        }
        ins(target, value) {
          return this.instruction(target, value);
        }
        dec(version, encoding, standalone) {
          return this.declaration(version, encoding, standalone);
        }
        dtd(root, pubID, sysID) {
          return this.doctype(root, pubID, sysID);
        }
        e(name, attributes, text) {
          return this.element(name, attributes, text);
        }
        n(name, attributes, text) {
          return this.node(name, attributes, text);
        }
        t(value) {
          return this.text(value);
        }
        d(value) {
          return this.cdata(value);
        }
        c(value) {
          return this.comment(value);
        }
        r(value) {
          return this.raw(value);
        }
        i(target, value) {
          return this.instruction(target, value);
        }
        // Attribute aliases
        att() {
          if (this.currentNode && this.currentNode.type === NodeType.DocType) {
            return this.attList(...arguments);
          } else {
            return this.attribute(...arguments);
          }
        }
        a() {
          if (this.currentNode && this.currentNode.type === NodeType.DocType) {
            return this.attList(...arguments);
          } else {
            return this.attribute(...arguments);
          }
        }
        // DTD aliases
        // att() and ele() are defined above
        ent(name, value) {
          return this.entity(name, value);
        }
        pent(name, value) {
          return this.pEntity(name, value);
        }
        not(name, value) {
          return this.notation(name, value);
        }
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/XMLStreamWriter.js
var require_XMLStreamWriter = __commonJS({
  "node_modules/xmlbuilder/lib/XMLStreamWriter.js"(exports, module) {
    (function() {
      var NodeType, WriterState, XMLStreamWriter, XMLWriterBase, hasProp = {}.hasOwnProperty;
      NodeType = require_NodeType();
      XMLWriterBase = require_XMLWriterBase();
      WriterState = require_WriterState();
      module.exports = XMLStreamWriter = class XMLStreamWriter extends XMLWriterBase {
        // Initializes a new instance of `XMLStreamWriter`
        // `stream` output stream
        // `options.pretty` pretty prints the result
        // `options.indent` indentation string
        // `options.newline` newline sequence
        // `options.offset` a fixed number of indentations to add to every line
        // `options.allowEmpty` do not self close empty element tags
        // 'options.dontPrettyTextNodes' if any text is present in node, don't indent or LF
        // `options.spaceBeforeSlash` add a space before the closing slash of empty elements
        constructor(stream, options) {
          super(options);
          this.stream = stream;
        }
        endline(node, options, level) {
          if (node.isLastRootNode && options.state === WriterState.CloseTag) {
            return "";
          } else {
            return super.endline(node, options, level);
          }
        }
        document(doc, options) {
          var child, i2, j2, k2, len1, len2, ref, ref1, results;
          ref = doc.children;
          for (i2 = j2 = 0, len1 = ref.length; j2 < len1; i2 = ++j2) {
            child = ref[i2];
            child.isLastRootNode = i2 === doc.children.length - 1;
          }
          options = this.filterOptions(options);
          ref1 = doc.children;
          results = [];
          for (k2 = 0, len2 = ref1.length; k2 < len2; k2++) {
            child = ref1[k2];
            results.push(this.writeChildNode(child, options, 0));
          }
          return results;
        }
        cdata(node, options, level) {
          return this.stream.write(super.cdata(node, options, level));
        }
        comment(node, options, level) {
          return this.stream.write(super.comment(node, options, level));
        }
        declaration(node, options, level) {
          return this.stream.write(super.declaration(node, options, level));
        }
        docType(node, options, level) {
          var child, j2, len1, ref;
          level || (level = 0);
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          this.stream.write(this.indent(node, options, level));
          this.stream.write("<!DOCTYPE " + node.root().name);
          if (node.pubID && node.sysID) {
            this.stream.write(' PUBLIC "' + node.pubID + '" "' + node.sysID + '"');
          } else if (node.sysID) {
            this.stream.write(' SYSTEM "' + node.sysID + '"');
          }
          if (node.children.length > 0) {
            this.stream.write(" [");
            this.stream.write(this.endline(node, options, level));
            options.state = WriterState.InsideTag;
            ref = node.children;
            for (j2 = 0, len1 = ref.length; j2 < len1; j2++) {
              child = ref[j2];
              this.writeChildNode(child, options, level + 1);
            }
            options.state = WriterState.CloseTag;
            this.stream.write("]");
          }
          options.state = WriterState.CloseTag;
          this.stream.write(options.spaceBeforeSlash + ">");
          this.stream.write(this.endline(node, options, level));
          options.state = WriterState.None;
          return this.closeNode(node, options, level);
        }
        element(node, options, level) {
          var att, attLen, child, childNodeCount, firstChildNode, j2, len, len1, name, prettySuppressed, r2, ratt, ref, ref1, ref2, rline;
          level || (level = 0);
          this.openNode(node, options, level);
          options.state = WriterState.OpenTag;
          r2 = this.indent(node, options, level) + "<" + node.name;
          if (options.pretty && options.width > 0) {
            len = r2.length;
            ref = node.attribs;
            for (name in ref) {
              if (!hasProp.call(ref, name)) continue;
              att = ref[name];
              ratt = this.attribute(att, options, level);
              attLen = ratt.length;
              if (len + attLen > options.width) {
                rline = this.indent(node, options, level + 1) + ratt;
                r2 += this.endline(node, options, level) + rline;
                len = rline.length;
              } else {
                rline = " " + ratt;
                r2 += rline;
                len += rline.length;
              }
            }
          } else {
            ref1 = node.attribs;
            for (name in ref1) {
              if (!hasProp.call(ref1, name)) continue;
              att = ref1[name];
              r2 += this.attribute(att, options, level);
            }
          }
          this.stream.write(r2);
          childNodeCount = node.children.length;
          firstChildNode = childNodeCount === 0 ? null : node.children[0];
          if (childNodeCount === 0 || node.children.every(function(e3) {
            return (e3.type === NodeType.Text || e3.type === NodeType.Raw || e3.type === NodeType.CData) && e3.value === "";
          })) {
            if (options.allowEmpty) {
              this.stream.write(">");
              options.state = WriterState.CloseTag;
              this.stream.write("</" + node.name + ">");
            } else {
              options.state = WriterState.CloseTag;
              this.stream.write(options.spaceBeforeSlash + "/>");
            }
          } else if (options.pretty && childNodeCount === 1 && (firstChildNode.type === NodeType.Text || firstChildNode.type === NodeType.Raw || firstChildNode.type === NodeType.CData) && firstChildNode.value != null) {
            this.stream.write(">");
            options.state = WriterState.InsideTag;
            options.suppressPrettyCount++;
            prettySuppressed = true;
            this.writeChildNode(firstChildNode, options, level + 1);
            options.suppressPrettyCount--;
            prettySuppressed = false;
            options.state = WriterState.CloseTag;
            this.stream.write("</" + node.name + ">");
          } else {
            this.stream.write(">" + this.endline(node, options, level));
            options.state = WriterState.InsideTag;
            ref2 = node.children;
            for (j2 = 0, len1 = ref2.length; j2 < len1; j2++) {
              child = ref2[j2];
              this.writeChildNode(child, options, level + 1);
            }
            options.state = WriterState.CloseTag;
            this.stream.write(this.indent(node, options, level) + "</" + node.name + ">");
          }
          this.stream.write(this.endline(node, options, level));
          options.state = WriterState.None;
          return this.closeNode(node, options, level);
        }
        processingInstruction(node, options, level) {
          return this.stream.write(super.processingInstruction(node, options, level));
        }
        raw(node, options, level) {
          return this.stream.write(super.raw(node, options, level));
        }
        text(node, options, level) {
          return this.stream.write(super.text(node, options, level));
        }
        dtdAttList(node, options, level) {
          return this.stream.write(super.dtdAttList(node, options, level));
        }
        dtdElement(node, options, level) {
          return this.stream.write(super.dtdElement(node, options, level));
        }
        dtdEntity(node, options, level) {
          return this.stream.write(super.dtdEntity(node, options, level));
        }
        dtdNotation(node, options, level) {
          return this.stream.write(super.dtdNotation(node, options, level));
        }
      };
    }).call(exports);
  }
});

// node_modules/xmlbuilder/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/xmlbuilder/lib/index.js"(exports, module) {
    (function() {
      var NodeType, WriterState, XMLDOMImplementation, XMLDocument, XMLDocumentCB, XMLStreamWriter, XMLStringWriter, assign, isFunction;
      ({ assign, isFunction } = require_Utility());
      XMLDOMImplementation = require_XMLDOMImplementation();
      XMLDocument = require_XMLDocument();
      XMLDocumentCB = require_XMLDocumentCB();
      XMLStringWriter = require_XMLStringWriter();
      XMLStreamWriter = require_XMLStreamWriter();
      NodeType = require_NodeType();
      WriterState = require_WriterState();
      module.exports.create = function(name, xmldec, doctype, options) {
        var doc, root;
        if (name == null) {
          throw new Error("Root element needs a name.");
        }
        options = assign({}, xmldec, doctype, options);
        doc = new XMLDocument(options);
        root = doc.element(name);
        if (!options.headless) {
          doc.declaration(options);
          if (options.pubID != null || options.sysID != null) {
            doc.dtd(options);
          }
        }
        return root;
      };
      module.exports.begin = function(options, onData, onEnd) {
        if (isFunction(options)) {
          [onData, onEnd] = [options, onData];
          options = {};
        }
        if (onData) {
          return new XMLDocumentCB(options, onData, onEnd);
        } else {
          return new XMLDocument(options);
        }
      };
      module.exports.stringWriter = function(options) {
        return new XMLStringWriter(options);
      };
      module.exports.streamWriter = function(stream, options) {
        return new XMLStreamWriter(stream, options);
      };
      module.exports.implementation = new XMLDOMImplementation();
      module.exports.nodeType = NodeType;
      module.exports.writerState = WriterState;
    }).call(exports);
  }
});

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias;
    exports.isCollection = isCollection;
    exports.isDocument = isDocument;
    exports.isMap = isMap;
    exports.isNode = isNode;
    exports.isPair = isPair;
    exports.isScalar = isScalar;
    exports.isSeq = isSeq;
  }
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd2 = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd2 === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path) {
      const ctrl = callVisitor(key, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visit_(key, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i2 = 0; i2 < node.items.length; ++i2) {
            const ci2 = visit_(i2, node.items[i2], visitor, path);
            if (typeof ci2 === "number")
              i2 = ci2 - 1;
            else if (ci2 === BREAK)
              return BREAK;
            else if (ci2 === REMOVE) {
              node.items.splice(i2, 1);
              i2 -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = visit_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd2 = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd2 === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path) {
      const ctrl = await callVisitor(key, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visitAsync_(key, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i2 = 0; i2 < node.items.length; ++i2) {
            const ci2 = await visitAsync_(i2, node.items[i2], visitor, path);
            if (typeof ci2 === "number")
              i2 = ci2 - 1;
            else if (ci2 === BREAK)
              return BREAK;
            else if (ci2 === REMOVE) {
              node.items.splice(i2, 1);
              i2 -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path) {
      if (typeof visitor === "function")
        return visitor(key, node, path);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path);
      return void 0;
    }
    function replaceNode(key, path, node) {
      const parent = path[path.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt2 = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt2} parent`);
      }
    }
    exports.visit = visit;
    exports.visitAsync = visitAsync;
  }
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn2) => tn2.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn2) => tn2.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa2 = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa2}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i2 = 1; true; ++i2) {
        const name = `${prefix}${i2}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i2 = 0, len = val.length; i2 < len; ++i2) {
            const v0 = val[i2];
            const v1 = applyReviver(reviver, val, String(i2), v0);
            if (v1 === void 0)
              delete val[i2];
            else if (v1 !== v0)
              val[i2] = v1;
          }
        } else if (val instanceof Map) {
          for (const k2 of Array.from(val.keys())) {
            const v0 = val.get(k2);
            const v1 = applyReviver(reviver, val, k2, v0);
            if (v1 === void 0)
              val.delete(k2);
            else if (v1 !== v0)
              val.set(k2, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k2, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k2, v0);
            if (v1 === void 0)
              delete val[k2];
            else if (v1 !== v0)
              val[k2] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports.applyReviver = applyReviver;
  }
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v2, i2) => toJS(v2, String(i2), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports.toJS = toJS;
  }
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        if (found && ctx) {
          const { anchors: anchors2, doc: doc2, maxAliasCount } = ctx;
          let data = anchors2.get(found);
          if (!data) {
            toJS.toJS(found, null, ctx);
            data = anchors2.get(found);
          }
          if (data?.res === void 0) {
            const msg = "This should not happen: Alias anchor was not resolved?";
            throw new ReferenceError(msg);
          }
          if (maxAliasCount >= 0) {
            data.count += 1;
            if (data.aliasCount === 0)
              data.aliasCount = getAliasCount(doc2, found, anchors2);
            if (data.count * data.aliasCount > maxAliasCount) {
              const msg = "Excessive alias count indicates a resource exhaustion attack";
              throw new ReferenceError(msg);
            }
          }
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const source = this.resolve(ctx.doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        return ctx.anchors.get(source).res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c2 = getAliasCount(doc, item, anchors2);
          if (c2 > count)
            count = c2;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc2 = getAliasCount(doc, node.key, anchors2);
        const vc2 = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc2, vc2);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t2) => t2.tag === tagName);
        const tagObj = match.find((t2) => !t2.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t2) => t2.identify?.(value) && !t2.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports.createNode = createNode;
  }
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path, value) {
      let v2 = value;
      for (let i2 = path.length - 1; i2 >= 0; --i2) {
        const k2 = path[i2];
        if (typeof k2 === "number" && Number.isInteger(k2) && k2 >= 0) {
          const a2 = [];
          a2[k2] = v2;
          v2 = a2;
        } else {
          v2 = /* @__PURE__ */ new Map([[k2, v2]]);
        }
      }
      return createNode.createNode(v2, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it2) => identity.isNode(it2) || identity.isPair(it2) ? it2.clone(schema) : it2);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path, value) {
        if (isEmptyPath(path))
          this.add(value);
        else {
          const [key, ...rest] = path;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n2 = node.value;
          return n2 == null || allowScalar && identity.isScalar(n2) && n2.value == null && !n2.commentBefore && !n2.comment && !n2.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        const [key, ...rest] = path;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i2 = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i2 = consumeMoreIndentedLines(text, i2, indent.length);
        if (i2 !== -1)
          end = i2 + endStep;
      }
      for (let ch; ch = text[i2 += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i2;
          switch (text[i2 + 1]) {
            case "x":
              i2 += 3;
              break;
            case "u":
              i2 += 5;
              break;
            case "U":
              i2 += 9;
              break;
            default:
              i2 += 1;
          }
          escEnd = i2;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i2 = consumeMoreIndentedLines(text, i2, indent.length);
          end = i2 + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i2 + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i2;
          }
          if (i2 >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i2 += 1];
                overflow = true;
              }
              const j2 = i2 > escEnd + 1 ? i2 - 2 : escStart - 1;
              if (escapedFolds[j2])
                return text;
              folds.push(j2);
              escapedFolds[j2] = true;
              end = j2 + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i3 = 0; i3 < folds.length; ++i3) {
        const fold = folds[i3];
        const end2 = folds[i3 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i2, indent) {
      let end = i2;
      let start = i2 + 1;
      let ch = text[start];
      while (ch === " " || ch === "	") {
        if (i2 < start + indent) {
          ch = text[++i2];
        } else {
          do {
            ch = text[++i2];
          } while (ch && ch !== "\n");
          end = i2;
          start = i2 + 1;
          ch = text[start];
        }
      }
      return end;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i2 = 0, start = 0; i2 < strLen; ++i2) {
        if (str[i2] === "\n") {
          if (i2 - start > limit)
            return true;
          start = i2 + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str = "";
      let start = 0;
      for (let i2 = 0, ch = json[i2]; ch; ch = json[++i2]) {
        if (ch === " " && json[i2 + 1] === "\\" && json[i2 + 2] === "n") {
          str += json.slice(start, i2) + "\\ ";
          i2 += 1;
          start = i2;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i2 + 1]) {
            case "u":
              {
                str += json.slice(start, i2);
                const code = json.substr(i2 + 2, 4);
                switch (code) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str += "\\x" + code.substr(2);
                    else
                      str += json.substr(i2, 6);
                }
                i2 += 5;
                start = i2 + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i2 + 2] === '"' || json.length < minMultiLineLength) {
                i2 += 1;
              } else {
                str += json.slice(start, i2) + "\n\n";
                while (json[i2 + 2] === "\\" && json[i2 + 3] === "n" && json[i2 + 4] !== '"') {
                  str += "\n";
                  i2 += 2;
                }
                str += indent;
                if (json[i2 + 2] === " ")
                  str += "\\";
                i2 += 1;
                start = i2 + 1;
              }
              break;
            default:
              i2 += 1;
          }
      }
      str = start ? str + json.slice(start) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs2;
      if (singleQuote === false)
        qs2 = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs2 = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs2 = doubleQuotedString;
        else
          qs2 = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs2(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss2 = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss2.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss2.value, ctx) : blockString(ss2, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss2.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss2.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss2, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t2 = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t2);
        if (res === null)
          throw new Error(`Unsupported default string type ${t2}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t2) => t2.tag === item.tag);
        if (match.length > 0)
          return match.find((t2) => t2.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t2) => t2.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t2) => t2.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t2) => t2.format === item.format) ?? match.find((t2) => !t2.format);
      } else {
        obj = item;
        tagObj = tags.find((t2) => t2.nodeClass && obj instanceof t2.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o2) => tagObj = o2 });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws2 = " ";
      if (keyComment || vsb || vcb) {
        ws2 = vsb ? "\n" : "";
        if (vcb) {
          const cs2 = commentString(vcb);
          ws2 += `
${stringifyComment.indentComment(cs2, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws2 === "\n" && valueComment)
            ws2 = "\n\n";
        } else {
          ws2 += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws2 = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws2 = "";
      }
      str += ws2 + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports.stringifyPair = stringifyPair;
  }
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it2 of source.items)
          mergeValue(ctx, map, it2);
      else if (Array.isArray(source))
        for (const it2 of source)
          mergeValue(ctx, map, it2);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge;
  }
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k2 = createNode.createNode(key, void 0, ctx);
      const v2 = createNode.createNode(value, void 0, ctx);
      return new Pair(k2, v2);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_2, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify2(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i2 = 0; i2 < items.length; ++i2) {
        const item = items[i2];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str2);
      }
      let str;
      if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines[0];
        for (let i2 = 1; i2 < lines.length; ++i2) {
          const line = lines[i2];
          str += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i2 = 0; i2 < items.length; ++i2) {
        const item = items[i2];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
        if (i2 < items.length - 1) {
          str += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str += ",";
          }
        }
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines.push(str);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start;
          for (const line of lines)
            str += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic2 = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic2.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k2 = identity.isScalar(key) ? key.value : key;
      for (const it2 of items) {
        if (identity.isPair(it2)) {
          if (it2.key === key || it2.key === k2)
            return it2;
          if (identity.isScalar(it2.key) && it2.key.value === k2)
            return it2;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i2 = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i2 === -1)
            this.items.push(_pair);
          else
            this.items.splice(i2, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it2 = findPair(this.items, key);
        if (!it2)
          return false;
        const del = this.items.splice(this.items.indexOf(it2), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it2 = findPair(this.items, key);
        const node = it2?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_2, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports.map = map;
  }
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it2 = this.items[idx];
        return !keepScalar && identity.isScalar(it2) ? it2.value : it2;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_2, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i2 = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i2++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i2 = 0;
          for (let it2 of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it2 : String(i2++);
              it2 = replacer.call(obj, key, it2);
            }
            seq.items.push(createNode.createNode(it2, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports.seq = seq;
  }
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string;
  }
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n2 = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n2) && !n2.includes("e")) {
        let i2 = n2.indexOf(".");
        if (i2 < 0) {
          i2 = n2.length;
          n2 += ".";
        }
        let d2 = minFractionDigits - (n2.length - i2 - 1);
        while (d2-- > 0)
          n2 += "0";
      }
      return n2;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node.minFractionDigits = str.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i2 = 0; i2 < str.length; ++i2)
            buffer[i2] = str.charCodeAt(i2);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s2 = "";
          for (let i2 = 0; i2 < buf.length; ++i2)
            s2 += String.fromCharCode(buf[i2]);
          str = btoa(s2);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n2 = Math.ceil(str.length / lineWidth);
          const lines = new Array(n2);
          for (let i2 = 0, o2 = 0; i2 < n2; ++i2, o2 += lineWidth) {
            lines[i2] = str.substr(o2, lineWidth);
          }
          str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i2 = 0; i2 < seq.items.length; ++i2) {
          let item = seq.items[i2];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn2 = pair.value ?? pair.key;
              cn2.comment = cn2.comment ? `${item.comment}
${cn2.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i2] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i2 = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it2 of iterable) {
          if (typeof replacer === "function")
            it2 = replacer.call(iterable, String(i2++), it2);
          let key, value;
          if (Array.isArray(it2)) {
            if (it2.length === 2) {
              key = it2[0];
              value = it2[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it2}`);
          } else if (it2 && it2 instanceof Object) {
            const keys = Object.keys(it2);
            if (keys.length === 1) {
              key = keys[0];
              value = it2[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it2;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs;
    exports.resolvePairs = resolvePairs;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_2, ctx) {
        if (!ctx)
          return super.toJSON(_2);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f2 = str.substring(dot + 1).replace(/_/g, "");
          if (f2[f2.length - 1] === "0")
            node.minFractionDigits = f2.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n3 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n3 : n3;
      }
      const n2 = parseInt(str, radix);
      return sign === "-" ? -1 * n2 : n2;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_2, ctx) {
        return super.toJSON(_2, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num = (n2) => asBigInt ? BigInt(n2) : Number(n2);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p2) => res2 * num(60) + num(p2), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n2) => n2;
      if (typeof value === "bigint")
        num = (n2) => BigInt(n2);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n2) => String(n2).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d2 = parseSexagesimal(tz, false);
          if (Math.abs(d2) < 30)
            d2 *= 60;
          date -= 6e4 * d2;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a2, b2) => a2.key < b2.key ? -1 : a2.key > b2.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema;
  }
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs2 = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs2, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs2 = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs2, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs2 = commentString(doc.comment);
          if (cs2.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs2, ""));
          } else {
            lines.push(`... ${cs2}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc2 = doc.comment;
        if (dc2 && chompKeep)
          dc2 = dc2.replace(/^\n+/, "");
        if (dc2) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc2), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v2) => typeof v2 === "number" || v2 instanceof String || v2 instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k2 = this.createNode(key, null, options);
        const v2 = this.createNode(value, null, options);
        return new Pair.Pair(k2, v2);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        if (Collection.isEmptyPath(path)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        if (Collection.isEmptyPath(path))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path) {
        if (Collection.isEmptyPath(path))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        if (Collection.isEmptyPath(path)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s2 = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s2}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

// node_modules/yaml/dist/errors.js
var require_errors2 = __commonJS({
  "node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc2) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc2.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci2 = col - 1;
      let lineStr = src.substring(lc2.lineStarts[line - 1], lc2.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci2 >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci2 - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci2 -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci2))) {
        let prev = src.substring(lc2.lineStarts[line - 2], lc2.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci2));
        }
        const pointer = " ".repeat(ci2) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports.resolveProps = resolveProps;
  }
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st2 of key.end)
              if (st2.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it2 of key.items) {
            for (const st2 of it2.start)
              if (st2.type === "newline")
                return true;
            if (it2.sep) {
              for (const st2 of it2.sep)
                if (st2.type === "newline")
                  return true;
            }
            if (containsNewline(it2.key) || containsNewline(it2.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc2, onError) {
      if (fc2?.type === "flow-collection") {
        const end = fc2.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc2)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a2, b2) => a2 === b2 || identity.isScalar(a2) && identity.isScalar(b2) && a2.value === b2.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports.mapIncludes = mapIncludes;
  }
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs2, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs2.offset;
      let commentEnd = null;
      for (const { start, value } of bs2.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs2.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs2.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs2.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep + cb;
              sep = "";
              break;
            }
            case "newline":
              if (comment)
                sep += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports.resolveEnd = resolveEnd;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc2, onError, tag) {
      const isMap = fc2.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc2.offset + fc2.start.source.length;
      for (let i2 = 0; i2 < fc2.items.length; ++i2) {
        const collItem = fc2.items[i2];
        const { start, key, sep, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: fc2.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep && !value) {
            if (i2 === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i2 < fc2.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i2 === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st2 of start) {
              switch (st2.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st2.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc2.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep)
                for (const st2 of sep) {
                  if (st2 === valueProps.found)
                    break;
                  if (st2.type === "newline") {
                    onError(st2, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce2, ...ee2] = fc2.end;
      let cePos = offset;
      if (ce2?.source === expectedEnd)
        cePos = ce2.offset + ce2.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce2 && ce2.source.length !== 1)
          ee2.unshift(ce2);
      }
      if (ee2.length > 0) {
        const end = resolveEnd.resolveEnd(ee2, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc2.offset, cePos, end.offset];
      } else {
        coll.range = [fc2.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl2 } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl2 || nl2.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t2) => t2.tag === tagName && t2.collection === expType);
      if (!tag) {
        const kt2 = ctx.schema.knownTags[tagName];
        if (kt2?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt2, { default: false }));
          tag = kt2;
        } else {
          if (kt2) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt2.tag} used for ${expType} collection, but expects ${kt2.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports.composeCollection = composeCollection;
  }
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i2 = lines.length - 1; i2 >= 0; --i2) {
        const content = lines[i2][1];
        if (content === "" || content === "\r")
          chompStart = i2;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i2 = 0; i2 < chompStart; ++i2) {
        const [indent, content] = lines[i2];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i2;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i2 = lines.length - 1; i2 >= chompStart; --i2) {
        if (lines[i2][0].length > trimIndent)
          chompStart = i2 + 1;
      }
      let value = "";
      let sep = "";
      let prevMoreIndented = false;
      for (let i2 = 0; i2 < contentStart; ++i2)
        value += lines[i2][0].slice(trimIndent) + "\n";
      for (let i2 = contentStart; i2 < chompStart; ++i2) {
        let [indent, content] = lines[i2];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep === " ")
            sep = "\n";
          else if (!prevMoreIndented && sep === "\n")
            sep = "\n\n";
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep === "\n")
            value += "\n";
          else
            sep = "\n";
        } else {
          value += sep + content;
          sep = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i2 = chompStart; i2 < lines.length; ++i2)
            value += "\n" + lines[i2][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i2 = 1; i2 < source.length; ++i2) {
        const ch = source[i2];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n2 = Number(ch);
          if (!indent && n2)
            indent = n2;
          else if (error === -1)
            error = offset + i2;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i2 = 1; i2 < props.length; ++i2) {
        const token = props[i2];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts2 = token.source;
            if (ts2 && typeof ts2 === "string")
              length += ts2.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m2 = first.match(/^( *)/);
      const line0 = m2?.[1] ? [m2[1], first.slice(m2[1].length)] : ["", first];
      const lines = [line0];
      for (let i2 = 1; i2 < split.length; i2 += 2)
        lines.push([split[i2], split[i2 + 1]]);
      return lines;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re2 = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re2.comment,
        range: [offset, valueEnd, re2.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return unfoldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function unfoldLines(source) {
      const line = /(.*?)\r?\n/sy;
      let match = line.exec(source);
      if (!match)
        return source;
      let trimEnd, trimBoth;
      try {
        trimEnd = new RegExp("(?<![ 	])[ 	]+$");
        trimBoth = new RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
      } catch {
        trimEnd = /[ \t]+$/;
        trimBoth = /^[ \t]+|[ \t]+$/g;
      }
      let res = match[1].replace(trimEnd, "");
      let sep = " ";
      let pos = line.lastIndex;
      while (match = line.exec(source)) {
        const lm = match[1].replace(trimBoth, "");
        if (lm === "") {
          if (sep === "\n")
            res += sep;
          else
            sep = "\n";
        } else {
          res += sep + lm;
          sep = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i2 = 1; i2 < source.length - 1; ++i2) {
        const ch = source[i2];
        if (ch === "\r" && source[i2 + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i2);
          res += fold;
          i2 = offset;
        } else if (ch === "\\") {
          let next = source[++i2];
          const cc2 = escapeCodes[next];
          if (cc2)
            res += cc2;
          else if (next === "\n") {
            next = source[i2 + 1];
            while (next === " " || next === "	")
              next = source[++i2 + 1];
          } else if (next === "\r" && source[i2 + 1] === "\n") {
            next = source[++i2 + 1];
            while (next === " " || next === "	")
              next = source[++i2 + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i2 + 1, length, onError);
            i2 += length;
          } else {
            const raw = source.substr(i2 - 1, 2);
            onError(i2 - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i2;
          let next = source[i2 + 1];
          while (next === " " || next === "	")
            next = source[++i2 + 1];
          if (next !== "\n" && !(next === "\r" && source[i2 + 2] === "\n"))
            res += i2 > wsStart ? source.slice(wsStart, i2 + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc2 = source.substr(offset, length);
      const ok = cc2.length === length && /^[0-9a-fA-F]+$/.test(cc2);
      const code = ok ? parseInt(cc2, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt2 = schema.knownTags[tagName];
      if (kt2 && !kt2.collection) {
        schema.tags.push(Object.assign({}, kt2, { default: false, test: void 0 }));
        return kt2;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts2 = directives.tagString(tag.tag);
          const cs2 = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts2} or ${cs2}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i2 = pos - 1; i2 >= 0; --i2) {
          let st2 = before[i2];
          switch (st2.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st2.source.length;
              continue;
          }
          st2 = before[++i2];
          while (st2?.type === "space") {
            offset += st2.source.length;
            st2 = before[++i2];
          }
          break;
        }
      }
      return offset;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re2 = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re2.offset];
      if (re2.comment)
        alias.comment = re2.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re2 = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re2.comment)
        doc.comment = re2.comment;
      doc.range = [offset, contentEnd, re2.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors2();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i2 = 0; i2 < prelude.length; ++i2) {
        const source = prelude[i2];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i2 + 1]?.[0] !== "#")
              i2 += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc2 = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc2) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc2) && !dc2.flow && dc2.items.length > 0) {
            let it2 = dc2.items[0];
            if (identity.isPair(it2))
              it2 = it2.key;
            const cb = it2.commentBefore;
            it2.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc2.commentBefore;
            dc2.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i2 = 0; i2 < this.errors.length; ++i2)
            doc.errors.push(this.errors[i2]);
          for (let i2 = 0; i2 < this.warnings.length; ++i2)
            doc.warnings.push(this.warnings[i2]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc2 = this.doc.comment;
              this.doc.comment = dc2 ? `${dc2}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors2();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he2 = source.indexOf("\n");
          const head = source.substring(0, he2);
          const body = source.substring(he2 + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he2 = source.indexOf("\n");
      const head = source.substring(0, he2);
      const body = source.substring(he2 + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st2 of end)
          switch (st2.type) {
            case "space":
            case "comment":
              props.push(st2);
              break;
            case "newline":
              props.push(st2);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa2 = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa2 -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa2;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl2 = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl2] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st2) => st2.type === "space" || st2.type === "comment" || st2.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    var stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st2 of token.end)
            res += st2.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st2 of token.end)
              res += st2.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st2 of token.end)
              res += st2.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep, value }) {
      let res = "";
      for (const st2 of start)
        res += st2.source;
      if (key)
        res += stringifyToken(key);
      if (sep)
        for (const st2 of sep)
          res += st2.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path) => {
      let item = cst;
      for (const [field, index] of path) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path) => {
      const parent = visit.itemAtPath(cst, path.slice(0, -1));
      const field = path[path.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path, item, visitor) {
      let ctrl = visitor(item, path);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i2 = 0; i2 < token.items.length; ++i2) {
            const ci2 = _visit(Object.freeze(path.concat([[field, i2]])), token.items[i2], visitor);
            if (typeof ci2 === "number")
              i2 = ci2 - 1;
            else if (ci2 === BREAK)
              return BREAK;
            else if (ci2 === REMOVE) {
              token.items.splice(i2, 1);
              i2 -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
    }
    exports.visit = visit;
  }
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR;
    exports.isCollection = isCollection;
    exports.isScalar = isScalar;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i2 = this.pos;
        let ch = this.buffer[i2];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i2];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i2 + 1] === "\n";
        return false;
      }
      charAt(n2) {
        return this.buffer[this.pos + n2];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt2 = this.buffer.substr(offset, 3);
          if ((dt2 === "---" || dt2 === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n2) {
        return this.pos + n2 <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n2) {
        return this.buffer.substr(this.pos, n2);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs2 = line.indexOf("#");
          while (cs2 !== -1) {
            const ch = line[cs2 - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs2 - 1;
              break;
            } else {
              cs2 = line.indexOf("#", cs2 + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n2 = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n2);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s2 = this.peek(3);
          if ((s2 === "---" || s2 === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s2 === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n2 = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n2;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n2 = yield* this.pushIndicators();
        switch (line[n2]) {
          case "#":
            yield* this.pushCount(line.length - n2);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n2 += yield* this.parseBlockScalarHeader();
            n2 += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n2);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl2, sp;
        let indent = -1;
        do {
          nl2 = yield* this.pushNewline();
          if (nl2 > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl2 + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n2 = 0;
        while (line[n2] === ",") {
          n2 += yield* this.pushCount(1);
          n2 += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n2 += yield* this.pushIndicators();
        switch (line[n2]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n2);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote2 = this.charAt(0);
        let end = this.buffer.indexOf(quote2, this.pos + 1);
        if (quote2 === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n2 = 0;
            while (this.buffer[end - 1 - n2] === "\\")
              n2 += 1;
            if (n2 % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl2 = qb.indexOf("\n", this.pos);
        if (nl2 !== -1) {
          while (nl2 !== -1) {
            const cs2 = this.continueScalar(nl2 + 1);
            if (cs2 === -1)
              break;
            nl2 = qb.indexOf("\n", cs2);
          }
          if (nl2 !== -1) {
            end = nl2 - (qb[nl2 - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i2 = this.pos;
        while (true) {
          const ch = this.buffer[++i2];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl2 = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i3 = this.pos; ch = this.buffer[i3]; ++i3) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl2 = i3;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i3 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs2 = this.continueScalar(nl2 + 1);
            if (cs2 === -1)
              break;
            nl2 = this.buffer.indexOf("\n", cs2);
          } while (nl2 !== -1);
          if (nl2 === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl2 = this.buffer.length;
          }
        }
        let i2 = nl2 + 1;
        ch = this.buffer[i2];
        while (ch === " ")
          ch = this.buffer[++i2];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i2];
          nl2 = i2 - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i3 = nl2 - 1;
            let ch2 = this.buffer[i3];
            if (ch2 === "\r")
              ch2 = this.buffer[--i3];
            const lastChar = i3;
            while (ch2 === " ")
              ch2 = this.buffer[--i3];
            if (ch2 === "\n" && i3 >= this.pos && i3 + 1 + indent > lastChar)
              nl2 = i3;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl2 + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i2 = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i2]) {
          if (ch === ":") {
            const next = this.buffer[i2 + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i2;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i2 + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i2 += 1;
                ch = "\n";
                next = this.buffer[i2 + 1];
              } else
                end = i2;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs2 = this.continueScalar(i2 + 1);
              if (cs2 === -1)
                break;
              i2 = Math.max(i2, cs2 - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i2;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n2) {
        if (n2 > 0) {
          yield this.buffer.substr(this.pos, n2);
          this.pos += n2;
          return n2;
        }
        return 0;
      }
      *pushToIndex(i2, allowEmpty) {
        const s2 = this.buffer.slice(this.pos, i2);
        if (s2) {
          yield s2;
          this.pos += s2.length;
          return s2.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n2 = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n2 += yield* this.pushTag();
              n2 += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n2 += yield* this.pushUntil(isNotAnchorChar);
              n2 += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n2 += yield* this.pushCount(1);
                n2 += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n2;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i2 = this.pos + 2;
          let ch = this.buffer[i2];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i2];
          return yield* this.pushToIndex(ch === ">" ? i2 + 1 : i2, false);
        } else {
          let i2 = this.pos + 1;
          let ch = this.buffer[i2];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i2];
            else if (ch === "%" && hexDigits.has(this.buffer[i2 + 1]) && hexDigits.has(this.buffer[i2 + 2])) {
              ch = this.buffer[i2 += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i2, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i2 = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i2];
        } while (ch === " " || allowTabs && ch === "	");
        const n2 = i2 - this.pos;
        if (n2 > 0) {
          yield this.buffer.substr(this.pos, n2);
          this.pos = i2;
        }
        return n2;
      }
      *pushUntil(test) {
        let i2 = this.pos;
        let ch = this.buffer[i2];
        while (!test(ch))
          ch = this.buffer[++i2];
        return yield* this.pushToIndex(i2, false);
      }
    };
    exports.Lexer = Lexer;
  }
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter;
  }
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list2, type) {
      for (let i2 = 0; i2 < list2.length; ++i2)
        if (list2[i2].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list2) {
      for (let i2 = 0; i2 < list2.length; ++i2) {
        switch (list2[i2].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i2;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it2 = parent.items[parent.items.length - 1];
          return it2.sep ?? it2.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i2 = prev.length;
      loop: while (--i2 >= 0) {
        switch (prev[i2].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i2]?.type === "space") {
      }
      return prev.splice(i2, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i2 = 0; i2 < source.length; ++i2)
          target.push(source[i2]);
    }
    function fixFlowSeqItems(fc2) {
      if (fc2.start.type === "flow-seq-start") {
        for (const it2 of fc2.items) {
          if (it2.sep && !it2.value && !includesToken(it2.start, "explicit-key-ind") && !includesToken(it2.sep, "map-value-ind")) {
            if (it2.key)
              it2.value = it2.key;
            delete it2.key;
            if (isFlowToken(it2.value)) {
              if (it2.value.end)
                arrayPushArray(it2.value.end, it2.sep);
              else
                it2.value.end = it2.sep;
            } else
              arrayPushArray(it2.start, it2.sep);
            delete it2.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st2 = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st2;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n2) {
        return this.stack[this.stack.length - n2];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it2 = top.items[top.items.length - 1];
              if (it2.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it2.sep) {
                it2.value = token;
              } else {
                Object.assign(it2, { key: token, sep: [] });
                this.onKeyLine = !it2.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it2 = top.items[top.items.length - 1];
              if (it2.value)
                top.items.push({ start: [], value: token });
              else
                it2.value = token;
              break;
            }
            case "flow-collection": {
              const it2 = top.items[top.items.length - 1];
              if (!it2 || it2.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it2.sep)
                it2.value = token;
              else
                Object.assign(it2, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st2) => st2.type !== "comment" || st2.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep;
          if (scalar.end) {
            sep = scalar.end;
            sep.push(this.sourceToken);
            delete scalar.end;
          } else
            sep = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl2 = this.source.indexOf("\n") + 1;
              while (nl2 !== 0) {
                this.onNewLine(this.offset + nl2);
                nl2 = this.source.indexOf("\n", nl2) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it2 = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it2.value) {
              const end = "end" in it2.value ? it2.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it2.sep) {
              it2.sep.push(this.sourceToken);
            } else {
              it2.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it2.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it2.sep) {
              it2.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it2.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it2.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it2.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it2.sep || it2.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it2.sep && !it2.value) {
            const nl2 = [];
            for (let i2 = 0; i2 < it2.sep.length; ++i2) {
              const st2 = it2.sep[i2];
              switch (st2.type) {
                case "newline":
                  nl2.push(i2);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st2.indent > map.indent)
                    nl2.length = 0;
                  break;
                default:
                  nl2.length = 0;
              }
            }
            if (nl2.length >= 2)
              start = it2.sep.splice(nl2[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it2.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it2.sep) {
                it2.sep.push(this.sourceToken);
              } else {
                it2.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it2.sep && !it2.explicitKey) {
                it2.start.push(this.sourceToken);
                it2.explicitKey = true;
              } else if (atNextItem || it2.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it2.explicitKey) {
                if (!it2.sep) {
                  if (includesToken(it2.start, "newline")) {
                    Object.assign(it2, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it2.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it2.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it2.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it2.key) && !includesToken(it2.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it2.start);
                  const key = it2.key;
                  const sep = it2.sep;
                  sep.push(this.sourceToken);
                  delete it2.key;
                  delete it2.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep }]
                  });
                } else if (start.length > 0) {
                  it2.sep = it2.sep.concat(start, this.sourceToken);
                } else {
                  it2.sep.push(this.sourceToken);
                }
              } else {
                if (!it2.sep) {
                  Object.assign(it2, { key: null, sep: [this.sourceToken] });
                } else if (it2.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it2.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it2.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs2 = this.flowScalar(this.type);
              if (atNextItem || it2.value) {
                map.items.push({ start, key: fs2, sep: [] });
                this.onKeyLine = true;
              } else if (it2.sep) {
                this.stack.push(fs2);
              } else {
                Object.assign(it2, { key: fs2, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it2.explicitKey && it2.sep && !includesToken(it2.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it2 = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it2.value) {
              const end = "end" in it2.value ? it2.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it2.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it2.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it2.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it2.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it2.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it2.value || this.indent <= seq.indent)
              break;
            it2.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it2.value || includesToken(it2.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it2.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc2) {
        const it2 = fc2.items[fc2.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc2.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it2 || it2.sep)
                fc2.items.push({ start: [this.sourceToken] });
              else
                it2.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it2 || it2.value)
                fc2.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it2.sep)
                it2.sep.push(this.sourceToken);
              else
                Object.assign(it2, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it2 || it2.value)
                fc2.items.push({ start: [this.sourceToken] });
              else if (it2.sep)
                it2.sep.push(this.sourceToken);
              else
                it2.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs2 = this.flowScalar(this.type);
              if (!it2 || it2.value)
                fc2.items.push({ start: [], key: fs2, sep: [] });
              else if (it2.sep)
                this.stack.push(fs2);
              else
                Object.assign(it2, { key: fs2, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc2.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc2);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc2.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc2);
            const sep = fc2.end.splice(1, fc2.end.length);
            sep.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc2.offset,
              indent: fc2.indent,
              items: [{ start, key: fc2, sep }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc2);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl2 = this.source.indexOf("\n") + 1;
          while (nl2 !== 0) {
            this.onNewLine(this.offset + nl2);
            nl2 = this.source.indexOf("\n", nl2) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st2) => st2.type === "newline" || st2.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors2();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse2(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports.parse = parse2;
    exports.parseAllDocuments = parseAllDocuments;
    exports.parseDocument = parseDocument;
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors2();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports.Composer = composer.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity.isAlias;
    exports.isCollection = identity.isCollection;
    exports.isDocument = identity.isDocument;
    exports.isMap = identity.isMap;
    exports.isNode = identity.isNode;
    exports.isPair = identity.isPair;
    exports.isScalar = identity.isScalar;
    exports.isSeq = identity.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit.visit;
    exports.visitAsync = visit.visitAsync;
  }
});

// node_modules/@zukhruf/fs/dist/atomic-write.js
import { chmod, rm, writeFile } from "node:fs/promises";

// node_modules/@zukhruf/fs/dist/draft.js
import { randomUUID } from "node:crypto";
var draftOf = (path) => `${path}.${randomUUID()}.tmp`;
var draftSuffixLength = draftOf("").length;

// node_modules/@zukhruf/fs/dist/replace-file.js
import { rename } from "node:fs/promises";

// node_modules/@zukhruf/async/dist/backoff.js
var Backoff = class {
  #initial;
  #multiplier;
  #max;
  #jitter;
  #random;
  constructor(options) {
    const { initial, multiplier, max, jitter } = options;
    if (!(initial > 0))
      throw new RangeError(`initial must be a positive number of milliseconds, not ${initial}`);
    if (!(multiplier >= 1 && Number.isFinite(multiplier)))
      throw new RangeError(`multiplier must be a finite number of 1 or more, not ${multiplier}`);
    if (!(max >= initial && Number.isFinite(max)))
      throw new RangeError(`max must be a finite number of initial (${initial}) or more, not ${max}`);
    if (jitter.kind === "ratio" && !(jitter.ratio > 0 && jitter.ratio <= 1))
      throw new RangeError(`ratio must be above 0 and at most 1, not ${jitter.ratio}`);
    this.#initial = initial;
    this.#multiplier = multiplier;
    this.#max = max;
    this.#jitter = jitter;
    this.#random = options.random ?? Math.random;
  }
  /**
   * The wait in milliseconds before the next retry. `retries` is the number
   * of retries before this wait: 0 before the first retry.
   */
  duration(retries) {
    if (!(Number.isInteger(retries) && retries >= 0))
      throw new RangeError(`retries must be an integer of 0 or more, not ${retries}`);
    const d2 = Math.min(this.#max, this.#initial * this.#multiplier ** retries);
    switch (this.#jitter.kind) {
      case "none":
        return d2;
      case "ratio":
        return d2 + d2 * this.#jitter.ratio * (2 * this.#random() - 1);
      case "full":
        return this.#random() * d2;
      case "equal":
        return d2 / 2 + this.#random() * d2 / 2;
    }
  }
};

// node_modules/@zukhruf/async/dist/delay.js
import { addAbortListener as addAbortListener2 } from "node:events";

// node_modules/@zukhruf/async/dist/until-aborted.js
import { addAbortListener } from "node:events";
function untilAborted(promise, signal) {
  if (!signal)
    return promise;
  return new Promise((resolve, reject) => {
    const listening = addAbortListener(signal, () => reject(signal.reason));
    promise.then((value) => {
      listening[Symbol.dispose]();
      resolve(value);
    }, (error) => {
      listening[Symbol.dispose]();
      reject(error);
    });
  });
}

// node_modules/@zukhruf/async/dist/delay.js
var TIMER_MAX = 2 ** 31 - 1;
async function delay(ms2, options) {
  const end = options.clock.performance.now() + ms2;
  let left = ms2;
  while (left > TIMER_MAX) {
    await wait(TIMER_MAX, options);
    left = end - options.clock.performance.now();
  }
  await wait(left, options);
}
function wait(ms2, { clock, signal, ref }) {
  const { promise, resolve } = Promise.withResolvers();
  const timer = clock.setTimeout(resolve, ms2);
  if (ref === false)
    unref(timer);
  if (!signal)
    return promise;
  const listening = addAbortListener2(signal, () => clock.clearTimeout(timer));
  return untilAborted(promise, signal).finally(() => listening[Symbol.dispose]());
}
function unref(timer) {
  if (typeof timer === "object" && timer !== null && "unref" in timer && typeof timer.unref === "function") {
    timer.unref();
  }
}

// node_modules/@zukhruf/async/dist/poll.js
async function poll(attempt, { interval, signal, clock, deadline, ref }) {
  for (; ; ) {
    const value = await attempt();
    if (value !== void 0)
      return value;
    if (deadline !== void 0 && clock.performance.now() >= deadline) {
      return void 0;
    }
    await delay(interval, { clock, signal, ref });
  }
}

// node_modules/@zukhruf/fs/dist/errno.js
function isErrno(error, code) {
  return Error.isError(error) && "code" in error && error.code === code;
}

// node_modules/@zukhruf/fs/dist/patiently.js
var WINDOWS_PATIENCE = 1e3;
var WINDOWS_BACKOFF = new Backoff({
  initial: 5,
  multiplier: 2,
  max: 100,
  jitter: { kind: "none" }
});
function isRefusedForNow(error) {
  return process.platform === "win32" && ["EPERM", "EACCES", "EBUSY"].some((code) => isErrno(error, code));
}
async function patiently(operation, { clock }) {
  const started = clock.performance.now();
  for (let attempt = 0; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isRefusedForNow(error) || clock.performance.now() - started > WINDOWS_PATIENCE)
        throw error;
      await delay(WINDOWS_BACKOFF.duration(attempt), {
        clock,
        signal: void 0
      });
    }
  }
}

// node_modules/@zukhruf/fs/dist/replace-file.js
function replaceFile(draft, path, clock) {
  return patiently(() => rename(draft, path), { clock });
}

// node_modules/@zukhruf/fs/dist/atomic-write.js
async function atomicWrite(path, content, { clock, mode }) {
  const draft = draftOf(path);
  try {
    await writeFile(draft, content, { mode });
    if (mode !== void 0)
      await chmod(draft, mode);
    await replaceFile(draft, path, clock);
  } catch (error) {
    await rm(draft, { force: true });
    throw error;
  }
}

// node_modules/@zukhruf/sqlite-open/dist/open.js
import { DatabaseSync } from "node:sqlite";

// node_modules/@zukhruf/sqlite-open/dist/write-ahead-log.js
var sizeLimit = 64 * 1024 * 1024;

// node_modules/@zukhruf/sqlite-open/dist/persistent-write-ahead-log.js
var lib = new URL("../lib/", import.meta.url);

// node_modules/@zukhruf/launchd/dist/errors.js
var LaunchdError = class extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "LaunchdError";
  }
};
var LaunchctlError = class extends LaunchdError {
  /** The arguments after /bin/launchctl, such as ['kickstart', '-p', 'gui/501/com.example.sync']. */
  args;
  /** `launchctl error <code>` decodes it. */
  exitCode;
  stderr;
  constructor(args, exitCode, stderr) {
    super(`launchctl ${args.join(" ")} exited ${exitCode}: ${stderr.trim()}`);
    this.name = "LaunchctlError";
    this.args = args;
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
};
var ServiceNotFoundError = class extends LaunchctlError {
  target;
  constructor(args, exitCode, stderr, target) {
    super(args, exitCode, stderr);
    this.name = "ServiceNotFoundError";
    this.target = target;
  }
};
var PermissionDeniedError = class extends LaunchdError {
  constructor(cause) {
    super(cause.message, { cause });
    this.name = "PermissionDeniedError";
  }
};
var LaunchdUnavailableError = class extends LaunchdError {
  constructor(cause) {
    super(`/bin/launchctl did not start: ${cause.message}`, { cause });
    this.name = "LaunchdUnavailableError";
  }
};

// node_modules/@zukhruf/launchd/dist/job/absolute-path.js
import { posix } from "node:path";
function isAbsolutePath(path) {
  return posix.isAbsolute(path);
}

// node_modules/@zukhruf/launchd/dist/launchd/launchd.js
import { statSync } from "node:fs";
import { homedir, userInfo } from "node:os";
import { join as join2 } from "node:path";

// node_modules/@zukhruf/launchd/dist/job/job-file.js
import { mkdir, readFile, readdir, rm as rm2 } from "node:fs/promises";
import { join } from "node:path";

// node_modules/plist/dist/parse.js
var import_xmldom = __toESM(require_lib(), 1);

// node_modules/plist/dist/build.js
var import_xmlbuilder = __toESM(require_lib2(), 1);
function uint8ArrayToBase64(bytes) {
  let binary = "";
  for (let i2 = 0; i2 < bytes.length; i2++) {
    binary += String.fromCharCode(bytes[i2]);
  }
  return btoa(binary);
}
function build(obj, opts) {
  const XMLHDR = {
    version: "1.0",
    encoding: "UTF-8"
  };
  const XMLDTD = {
    pubid: "-//Apple//DTD PLIST 1.0//EN",
    sysid: "http://www.apple.com/DTDs/PropertyList-1.0.dtd"
  };
  const headless = opts?.headless === true;
  const createOptions = { headless };
  if (opts?.invalidCharReplacement !== void 0) {
    createOptions.invalidCharReplacement = opts.invalidCharReplacement;
  }
  const doc = import_xmlbuilder.default.create("plist", createOptions);
  if (!headless) {
    doc.dec(XMLHDR.version, XMLHDR.encoding);
    doc.dtd(XMLDTD.pubid, XMLDTD.sysid);
  }
  doc.att("version", "1.0");
  walk_obj(obj, doc);
  const xmlToStringOptions = {
    ...opts,
    pretty: opts?.pretty !== false
  };
  return doc.end(xmlToStringOptions);
}
function walk_obj(next, next_child) {
  if (typeof next === "undefined") {
    return;
  } else if (Array.isArray(next)) {
    next_child = next_child.ele("array");
    for (let i2 = 0; i2 < next.length; i2++) {
      walk_obj(next[i2], next_child);
    }
  } else if (next instanceof ArrayBuffer) {
    next_child.ele("data").raw(uint8ArrayToBase64(new Uint8Array(next)));
  } else if (ArrayBuffer.isView(next)) {
    const bytes = next instanceof Uint8Array ? next : new Uint8Array(next.buffer, next.byteOffset, next.byteLength);
    next_child.ele("data").raw(uint8ArrayToBase64(bytes));
  } else if (typeof next === "object" && next !== null && !(next instanceof Date)) {
    next_child = next_child.ele("dict");
    for (const prop in next) {
      if (Object.hasOwn(next, prop)) {
        const val = next[prop];
        if (val === void 0 || val === null)
          continue;
        next_child.ele("key").txt(prop);
        walk_obj(val, next_child);
      }
    }
  } else if (typeof next === "number") {
    const tag_type = Number.isInteger(next) && Math.abs(next) < 1e21 ? "integer" : "real";
    next_child.ele(tag_type).txt(next.toString());
  } else if (typeof next === "bigint") {
    next_child.ele("integer").txt(next.toString());
  } else if (next instanceof Date) {
    next_child.ele("date").txt(new Date(next).toISOString().replace(/\.000Z$/, "Z"));
  } else if (typeof next === "boolean") {
    next_child.ele(next ? "true" : "false");
  } else if (typeof next === "string") {
    next_child.ele("string").txt(next);
  }
}

// node_modules/@zukhruf/launchd/dist/job/job-file.js
var EXTENSION = ".plist";
var JobFile = class _JobFile {
  label;
  path;
  #folder;
  /** Throws a RangeError for a label that is not one file name, so the file stays in the folder. */
  constructor(folder, label) {
    if (!_JobFile.#isFileName(label)) {
      throw new RangeError(`A label names its job file, so it must be one file name: ${JSON.stringify(label)}`);
    }
    this.label = label;
    this.path = join(folder, `${label}${EXTENSION}`);
    this.#folder = folder;
  }
  /** The labels of the job files in the folder, sorted. No folder: none. */
  static async labels(folder) {
    let names;
    try {
      names = await readdir(folder);
    } catch (error) {
      if (isErrno(error, "ENOENT"))
        return [];
      throw error;
    }
    return names.filter((name) => name.endsWith(EXTENSION)).map((name) => name.slice(0, -EXTENSION.length)).filter((label) => _JobFile.#isFileName(label)).toSorted();
  }
  /** The bytes of the job file of a job, with the keys of each dictionary sorted. */
  static render(job) {
    return build(_JobFile.#sorted(job));
  }
  /** Whether the file holds these bytes. No file: false. */
  async holds(content) {
    try {
      return await readFile(this.path, "utf8") === content;
    } catch (error) {
      if (isErrno(error, "ENOENT"))
        return false;
      throw error;
    }
  }
  /** Makes the folder, and replaces the file in one step, with mode 0644. */
  async write(content, clock) {
    try {
      await mkdir(this.#folder, { recursive: true });
      await atomicWrite(this.path, content, { clock, mode: 420 });
    } catch (error) {
      throw _JobFile.#denied(error);
    }
  }
  /** Removes the file. No file: nothing to do. */
  async remove() {
    try {
      await rm2(this.path, { force: true });
    } catch (error) {
      throw _JobFile.#denied(error);
    }
  }
  static #denied(error) {
    return Error.isError(error) && (isErrno(error, "EACCES") || isErrno(error, "EPERM")) ? new PermissionDeniedError(error) : error;
  }
  static #isFileName(label) {
    return label !== "" && label !== "." && label !== ".." && !label.includes("/") && !label.includes("\0");
  }
  // An array keeps its order: it has a meaning in ProgramArguments. An
  // undefined value becomes null, which plist renders as no key (ADR 0008).
  static #sorted(value) {
    if (Array.isArray(value))
      return value.map((item) => _JobFile.#sorted(item));
    if (typeof value === "object" && value !== null) {
      return Object.fromEntries(Object.keys(value).toSorted().map((key) => [key, _JobFile.#sorted(Reflect.get(value, key))]));
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return value;
    }
    return null;
  }
};

// node_modules/@zukhruf/launchd/dist/launchctl/launchctl.js
import { execFile } from "node:child_process";
var NOT_PERMITTED = 1;
var NO_SUCH_PROCESS = 3;
var IN_PROGRESS = 36;
var SERVICE_NOT_FOUND = 113;
var PID = /^\tpid = (\d+)$/m;
var LAST_EXIT_CODE = /^\tlast exit code = (\d+)/m;
var Launchctl = class {
  /** 113 is a service that the domain does not have. */
  async print(target, signal) {
    const args = ["print", target];
    const answer = await this.#run(args, signal);
    if (answer.exitCode === SERVICE_NOT_FOUND)
      return { state: "not loaded" };
    this.#succeeded(args, answer);
    const pid = PID.exec(answer.stdout)?.[1];
    const code = LAST_EXIT_CODE.exec(answer.stdout)?.[1];
    const lastExitStatus = code === void 0 ? void 0 : Number(code);
    return pid === void 0 ? { state: "not running", lastExitStatus } : { state: "running", pid: Number(pid), lastExitStatus };
  }
  /** true when launchd has forgotten the service; false while the bootout goes on. */
  async bootout(target, signal) {
    const args = ["bootout", target];
    const answer = await this.#run(args, signal);
    if (answer.exitCode === NO_SUCH_PROCESS)
      return true;
    if (answer.exitCode === 0 || answer.exitCode === IN_PROGRESS)
      return false;
    throw this.#error(args, answer);
  }
  async bootstrap(domain, file, signal) {
    const args = ["bootstrap", domain, file];
    this.#succeeded(args, await this.#run(args, signal));
  }
  async enable(target, signal) {
    const args = ["enable", target];
    this.#succeeded(args, await this.#run(args, signal));
  }
  async disable(target, signal) {
    const args = ["disable", target];
    this.#succeeded(args, await this.#run(args, signal));
  }
  /** The PID that `-p` prints. */
  async kickstart(target, kill, signal) {
    const args = ["kickstart", ...kill ? ["-k"] : [], "-p", target];
    const answer = await this.#run(args, signal);
    this.#found(args, answer, target);
    return Number(answer.stdout);
  }
  async kill(target, processSignal, signal) {
    const args = ["kill", String(processSignal), target];
    this.#found(args, await this.#run(args, signal), target);
  }
  #found(args, answer, target) {
    if (answer.exitCode === SERVICE_NOT_FOUND) {
      throw new ServiceNotFoundError(args, answer.exitCode, answer.stderr, target);
    }
    this.#succeeded(args, answer);
  }
  #succeeded(args, answer) {
    if (answer.exitCode !== 0)
      throw this.#error(args, answer);
  }
  #error(args, answer) {
    const error = new LaunchctlError(args, answer.exitCode, answer.stderr);
    return answer.exitCode === NOT_PERMITTED ? new PermissionDeniedError(error) : error;
  }
  // A cancel stops the wait, not the subcommand, as a cancel of the bootout
  // wait leaves launchd to finish the bootout (ADR 0004).
  #run(args, signal) {
    const { promise, resolve, reject } = Promise.withResolvers();
    execFile("/bin/launchctl", args, { encoding: "utf8" }, (error, stdout, stderr) => {
      if (error === null)
        resolve({ exitCode: 0, stdout, stderr });
      else if (typeof error.code === "number") {
        resolve({ exitCode: error.code, stdout, stderr });
      } else if (isErrno(error, "ENOENT")) {
        reject(new LaunchdUnavailableError(error));
      } else
        reject(error);
    });
    return untilAborted(promise, signal);
  }
};

// node_modules/@zukhruf/launchd/dist/service/service.js
var Service = class {
  label;
  /** The job file: <folder>/<label>.plist. */
  file;
  /** The service-target: <domain>/<label>, such as 'gui/501/com.example.sync'. */
  target;
  #domain;
  #jobFile;
  #launchctl;
  #clock;
  constructor(jobFile, domain, launchctl, clock) {
    this.label = jobFile.label;
    this.file = jobFile.path;
    this.target = `${domain}/${jobFile.label}`;
    this.#domain = domain;
    this.#jobFile = jobFile;
    this.#launchctl = launchctl;
    this.#clock = clock;
  }
  /** One `launchctl print <target>`: exit code 113 and the lines `pid =` and `last exit code =`. */
  state({ signal } = {}) {
    return this.#launchctl.print(this.target, signal);
  }
  /** Runs the service now (`kickstart -p`). With `kill`, kills the process that runs first (`-k`). Gives the PID of the new process, or of the process that runs. */
  kickstart({ kill = false, signal } = {}) {
    return this.#launchctl.kickstart(this.target, kill, signal);
  }
  /** Sends a process signal, by name or number, to the process of the service. */
  kill(processSignal, { signal } = {}) {
    return this.#launchctl.kill(this.target, processSignal, signal);
  }
  /** Enables the service: launchd may load it again. */
  enable({ signal } = {}) {
    return this.#launchctl.enable(this.target, signal);
  }
  /** Disables the service: launchd does not load it until enable(), also after a restart. */
  disable({ signal } = {}) {
    return this.#launchctl.disable(this.target, signal);
  }
  /** Loads the job file into the domain. */
  bootstrap({ signal } = {}) {
    return this.#launchctl.bootstrap(this.#domain, this.file, signal);
  }
  /** Removes the service from the domain, and waits until launchd forgets it. The job file stays. */
  async bootout({ signal } = {}) {
    await poll(async () => await this.#launchctl.bootout(this.target, signal) ? true : void 0, { interval: 1e3, signal, clock: this.#clock });
  }
  /** bootout(), then removes the job file. Resolves when neither is there. */
  async uninstall(options = {}) {
    await this.bootout(options);
    await this.#jobFile.remove();
  }
};

// node_modules/@zukhruf/launchd/dist/launchd/launchd.js
var Launchd = class _Launchd {
  /** The domain-target: 'gui/501', 'user/501' or 'system'. */
  domain;
  /** The absolute path of the folder of the job files. */
  folder;
  #clock;
  #launchctl = new Launchctl();
  constructor(domain, folder, clock) {
    this.domain = domain;
    this.folder = folder;
    this.#clock = clock;
  }
  /** This user's agents: gui/<uid> when this uid owns /dev/console, else user/<uid>. The folder is Library/LaunchAgents under $HOME (ADR 0005). */
  static agents({ clock }) {
    const { uid } = userInfo();
    const atConsole = statSync("/dev/console").uid === uid;
    return new _Launchd(atConsole ? `gui/${uid}` : `user/${uid}`, join2(homedir(), "Library", "LaunchAgents"), clock);
  }
  /** The daemons of the system domain, in /Library/LaunchDaemons. A change needs root. */
  static daemons({ clock }) {
    return new _Launchd("system", "/Library/LaunchDaemons", clock);
  }
  /** The reconcile: writes <folder>/<Label>.plist when its bytes differ, boots out the old service, enables, bootstraps. */
  async install(job, options = {}) {
    const jobFile = new JobFile(this.folder, job.Label);
    const service = this.#service(jobFile);
    const content = JobFile.render(job);
    if (await jobFile.holds(content)) {
      if ((await service.state(options)).state !== "not loaded") {
        return service;
      }
    } else {
      await service.bootout(options);
      await jobFile.write(content, this.#clock);
    }
    await service.enable(options);
    await service.bootstrap(options);
    return service;
  }
  /** The handle of a label in this domain. Reads nothing and runs nothing. */
  service(label) {
    return this.#service(new JobFile(this.folder, label));
  }
  /** A handle for each <folder>/*.plist, with the label from the file name, sorted. No folder gives []. */
  async installed({ signal } = {}) {
    const labels = await untilAborted(JobFile.labels(this.folder), signal);
    return labels.map((label) => this.service(label));
  }
  #service(jobFile) {
    return new Service(jobFile, this.domain, this.#launchctl, this.#clock);
  }
};

// node_modules/rrule-temporal/dist/src-DOMrjyRf.js
var e = (e3, t2) => `Non-positive ${e3}: ${t2}`;
var t = (e3, t2) => `Non-finite ${e3}: ${t2}`;
var n = (e3) => `Cannot convert bigint to ${e3}`;
var r = (e3, t2, n2, r2) => i(e3, t2) + `; must be between ${n2}-${r2}`;
var i = (e3, t2) => `Invalid ${e3}: ${t2}`;
function a(e3) {
  return e3 === void 0 ? /* @__PURE__ */ Object.create(null) : f(e3);
}
function o(e3, r2 = `number`) {
  if (typeof e3 == `bigint`) throw TypeError(n(r2));
  if (e3 = Number(e3), !Number.isFinite(e3)) throw RangeError(t(r2, e3));
  return e3;
}
function s(e3, t2) {
  return Math.trunc(o(e3, t2)) || 0;
}
function c(e3, t2) {
  return l(s(e3, t2), t2);
}
function l(t2, n2 = `number`) {
  if (t2 <= 0) throw RangeError(e(n2, t2));
  return t2;
}
function u(e3, t2, n2) {
  return Math.min(Math.max(e3, t2), n2);
}
function d(e3) {
  return e3 !== null && (typeof e3 == `object` || typeof e3 == `function`);
}
function f(e3) {
  if (!d(e3)) throw TypeError(`Invalid object`);
  return e3;
}
var p = i;
var m = (e3) => `Missing ${e3}`;
var h = (e3) => `No valid fields: ` + e3.join();
var g = (e3, t2, n2) => i(e3, t2) + `; must be ` + Object.keys(n2).join();
var _ = (e3) => `Missing year` + (e3 ? `/era/eraYear` : ``);
var v = `Invalid leap month`;
var ee = (e3) => i(`Calendar`, e3);
var te = (e3) => i(`TimeZone`, e3);
var ne = (e3) => `Cannot parse: ${e3}`;
var re = (e3) => `Invalid substring: ${e3}`;
var ie = u;
var y = d;
function b(e3) {
  throw RangeError(e3);
}
function x(e3) {
  throw TypeError(e3);
}
function ae(e3, t2, n2, r2, i2) {
  return oe(t2, ((e4, t3) => {
    let n3 = e4[t3];
    return n3 === void 0 && x(m(t3)), n3;
  })(e3, t2), n2, r2, i2);
}
function oe(e3, t2, n2, i2, a2, o2) {
  let s2 = ie(t2, n2, i2);
  return a2 && t2 !== s2 && b(((e4, t3, n3, i3, a3) => a3 ? r(e4, a3[t3], a3[n3], a3[i3]) : r(e4, t3, n3, i3))(e3, t2, n2, i2, o2)), s2;
}
function se(e3, t2 = Map) {
  let n2 = new t2();
  return (t3, ...r2) => {
    if (n2.has(t3)) return n2.get(t3);
    let i2 = e3(t3, ...r2);
    return n2.set(t3, i2), i2;
  };
}
var ce = (e3) => le({ name: e3 }, 1);
var le = (e3, t2) => de((e4) => ({ value: e4, configurable: 1, writable: !t2 }), e3);
var ue = (e3) => ({ [Symbol.toStringTag]: { value: e3, configurable: 1 } });
function de(e3, t2) {
  let n2 = {};
  for (let r2 in t2) n2[r2] = e3(t2[r2], r2);
  return n2;
}
function fe(e3, t2) {
  let n2 = {};
  for (let r2 of e3) n2[r2] = t2;
  return n2;
}
function pe(e3) {
  let t2 = {};
  for (let n2 of e3) t2[n2] = (e4) => e4[n2];
  return t2;
}
function S(e3, t2, n2 = /* @__PURE__ */ Object.create(null)) {
  for (let r2 of e3) n2[r2] = t2[r2];
  return n2;
}
function me(e3, t2, n2) {
  for (let r2 of e3) if (t2[r2] !== n2[r2]) return 0;
  return 1;
}
function he(e3, t2, n2) {
  let r2 = { ...n2 };
  for (let n3 = 0; n3 < t2; n3++) r2[e3[n3]] = 0;
  return r2;
}
function C(e3, ...t2) {
  return (...n2) => e3(...t2, ...n2);
}
function ge() {
}
function _e(e3) {
  return e3[0].toUpperCase() + e3.substring(1);
}
function w(...e3) {
  return [].concat(...e3).sort();
}
function ve(e3) {
  return RegExp(`^${e3}$`, `i`);
}
function ye(e3) {
  return parseInt(e3.padEnd(9, `0`));
}
function be(e3) {
  return e3 && e3 !== `+` ? -1 : 1;
}
function xe(e3) {
  return e3 === void 0 ? 0 : parseInt(e3);
}
function Se(e3, t2) {
  return String(t2).padStart(e3, `0`);
}
var Ce = C(Se, 2);
function T(e3, t2) {
  return Math.sign(e3 - t2);
}
function E(e3, t2) {
  return e3 < t2 ? -1 : e3 > t2 ? 1 : 0;
}
function we(e3, t2) {
  let n2 = e3 / t2;
  return e3 % t2 < 0n ? n2 - 1n : n2;
}
function Te(e3, t2) {
  let n2 = we(e3, t2);
  return [n2, e3 - n2 * t2];
}
function Ee(e3, t2) {
  return [Math.floor(e3 / t2), De(e3, t2)];
}
function De(e3, t2) {
  return (e3 % t2 + t2) % t2;
}
function Oe(e3, t2) {
  return Math.trunc(e3 / t2) || 0;
}
function ke(e3, t2) {
  return e3 % t2 || 0;
}
function Ae(e3, t2 = 1) {
  return t2 * (0.5 + e3 / 5);
}
function je(e3) {
  return Math.abs(e3 % 1) === 0.5;
}
var Me = { bce: -1, ce: 0 };
function Ne(e3) {
  let t2 = e3.normalize(`NFD`).toLowerCase().replace(/[^a-z0-9]/g, ``);
  return t2 === `bc` || t2 === `b` ? `bce` : t2 === `ad` || t2 === `a` ? `ce` : t2;
}
function Pe(e3) {
  return e3 === void 0 ? `iso8601` : e3 === 0 ? `gregory` : e3.id;
}
var Fe = /^M(\d{2})(L?)$/;
function Ie(e3) {
  let t2 = Fe.exec(e3);
  return t2 || b(((e4) => `Invalid monthCode: ${e4}`)(e3)), [parseInt(t2[1]), !!t2[2]];
}
function Le(e3, t2) {
  return `M` + Ce(e3) + (t2 ? `L` : ``);
}
function Re(e3, t2, n2) {
  return e3 + (t2 || n2 && e3 >= n2 ? 1 : 0);
}
function ze(e3, t2) {
  return e3 - (t2 && e3 >= t2 ? 1 : 0);
}
var Be = { nanosecond: 0, microsecond: 1, millisecond: 2, second: 3, minute: 4, hour: 5, day: 6, week: 7, month: 8, year: 9 };
var Ve = Object.keys(Be);
var He = 864e5;
var Ue = 1e3;
var We = 1e6;
var Ge = 1e9;
var Ke = 6e10;
var qe = 36e11;
var Je = 864e11;
var Ye = [1, Ue, We, Ge, Ke, qe, Je];
var Xe = BigInt(Ue);
var Ze = BigInt(We);
var Qe = BigInt(Ge);
var $e = BigInt(Ke);
var et = BigInt(qe);
var D = BigInt(Je);
function tt(e3, t2) {
  let n2 = Number(e3 / D), r2 = Number(e3 % D);
  return Je / t2 * n2 + (Math.trunc(r2 / t2) + r2 % t2 / t2);
}
var O = Ve.slice(0, 6);
var nt = pe(O);
var rt = [`year`];
var it = [`day`];
var at = [`day`, `month`, `year`];
var ot = [`offset`];
var st = [`timeZone`];
var ct = [`era`, `eraYear`];
var lt = [`era`, `eraYear`, `year`];
var ut = [`month`, `monthCode`];
var dt = [`day`, `month`, `monthCode`];
var ft = w(O);
var pt = w(ct, rt);
var mt = w(ut, rt);
var ht = w(ct, mt);
var gt = w([`monthCode`], rt);
var _t = w(ct, gt);
var vt = w(it, [`monthCode`]);
var yt = w(it, mt);
var bt = w(it, ct, mt);
var xt = w(yt, O);
var St = w(bt, O);
var Ct = w(yt, O, ot);
var wt = w(bt, O, ot);
var Tt = w(yt, O, ot, st);
var Et = w(bt, O, ot, st);
var Dt = w(it, gt);
var Ot = w(it, ct, gt);
var kt = fe(O, 0);
function At(e3) {
  return Mt(e3, 1), e3;
}
var jt = { hour: 23, minute: 59, second: 59 };
function Mt(e3, t2) {
  let n2 = {};
  for (let r2 of O) n2[r2] = oe(r2, e3[r2], 0, jt[r2] || 999, t2);
  return n2;
}
function Nt(e3) {
  return Ft(e3) * Ge + It(e3);
}
function Pt(e3) {
  return 1e3 * Ft(e3) + e3.millisecond;
}
function Ft(e3) {
  return 3600 * e3.hour + 60 * e3.minute + e3.second;
}
function It(e3) {
  return e3.millisecond * We + e3.microsecond * Ue + e3.nanosecond;
}
function Lt(e3) {
  let [t2, n2] = Ee(e3, Je);
  return [Rt(n2), t2];
}
function Rt(e3) {
  let [t2, n2] = Ee(e3, We), [r2, i2] = Ee(n2, Ue);
  return zt(t2, r2, i2);
}
function zt(e3, t2 = 0, n2 = 0) {
  let [r2, i2] = Ee(e3, 36e5), [a2, o2] = Ee(i2, 6e4), [s2, c2] = Ee(o2, 1e3);
  return { hour: r2, minute: a2, second: s2, millisecond: c2, microsecond: t2, nanosecond: n2 };
}
function Bt(e3) {
  let [t2, n2] = Te(e3, Qe);
  return [Number(t2), Number(n2)];
}
function Vt(e3) {
  return Ut(e3) + BigInt(Nt(e3));
}
function Ht(e3) {
  return Wt(e3) + Pt(e3);
}
function Ut(e3) {
  return BigInt(Gt(e3)) * D;
}
function Wt(e3) {
  return 864e5 * Gt(e3);
}
function Gt(e3) {
  return Kt(e3.year, e3.month, e3.day);
}
function Kt(e3, t2 = 1, n2 = 1) {
  let r2 = t2 - 1;
  return e3 += Math.floor(r2 / 12), t2 = De(r2, 12), Date.UTC(e3 % 400 - 400, t2, 0) / 864e5 + 146097 * (Oe(e3, 400) + 1) + n2;
}
function qt(e3) {
  let [t2, n2] = Te(e3, D);
  return { ...Yt(Number(t2)), ...Rt(Number(n2)) };
}
function Jt(e3, t2 = 0, n2 = 0) {
  let [r2, i2] = Ee(e3, 864e5);
  return { ...Yt(r2), ...zt(i2, t2, n2) };
}
function Yt(e3) {
  let t2 = new Date(864e5 * De(e3, 146097));
  return { year: t2.getUTCFullYear() + 400 * Math.floor(e3 / 146097), month: t2.getUTCMonth() + 1, day: t2.getUTCDate() };
}
function Xt(e3, t2) {
  return Math.trunc((t2 - e3) / 864e5);
}
function Zt(e3) {
  return [e3, 0];
}
function Qt(e3, t2) {
  if (!t2) return { year: 1972, month: e3 };
}
function $t(e3, t2, n2) {
  return { year: e3, month: t2, day: n2 };
}
function en(e3, t2) {
  switch (t2) {
    case 2:
      return nn(e3) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
  }
  return 31;
}
function tn(e3) {
  return nn(e3) ? 366 : 365;
}
function nn(e3) {
  return e3 % 4 == 0 && (e3 % 100 != 0 || e3 % 400 == 0);
}
function rn(e3, t2, n2) {
  return e3 += Oe(n2, 12), (t2 += ke(n2, 12)) < 1 ? (e3--, t2 += 12) : t2 > 12 && (e3++, t2 -= 12), { year: e3, month: t2 };
}
function an(e3, t2, n2, r2) {
  return 12 * (n2 - e3) + r2 - t2;
}
function on(e3) {
  return De(Kt(e3.year, e3.month, e3.day) + 4, 7) || 7;
}
function sn(e3) {
  return Kt(e3.year, e3.month, e3.day) - Kt(e3.year) + 1;
}
function cn(e3) {
  let t2 = e3.year, n2 = Math.floor((sn(e3) - on(e3) + 10) / 7), r2 = ln(t2);
  return n2 < 1 ? n2 = r2 = ln(--t2) : n2 > r2 && (n2 = 1, r2 = ln(++t2)), { weekOfYear: n2, yearOfWeek: t2, Ie: r2 };
}
function ln(e3) {
  let t2 = on({ year: e3, month: 1, day: 1 });
  return t2 === 4 || t2 === 3 && nn(e3) ? 53 : 52;
}
function un({ year: e3 }) {
  return e3 < 1 ? { era: `bce`, eraYear: 1 - e3 } : { era: `ce`, eraYear: e3 };
}
function dn(e3) {
  return fn(e3), At(e3);
}
function fn(e3) {
  return mn(e3, 1), e3;
}
function pn(e3) {
  return me(at, e3, mn(e3));
}
function mn(e3, t2) {
  let { year: n2 } = e3, r2 = ae(e3, `month`, 1, 12, t2);
  return { year: n2, month: r2, day: ae(e3, `day`, 1, en(n2, r2), t2) };
}
function k(e3, t2) {
  return e3 ? e3.ie(t2) : t2;
}
function hn(e3, t2, n2) {
  return e3 ? e3.O(t2, n2) : Zt(n2);
}
function gn(e3, t2) {
  return e3 === 0 ? un(t2) : e3 ? e3.h(t2) : {};
}
function _n(e3, t2, n2, r2) {
  return e3 ? e3.je(t2, n2, r2) : $t(t2, n2, r2);
}
function vn(e3, t2) {
  return e3 ? e3.k(t2) : 12;
}
function yn(e3, t2, n2) {
  return e3 ? e3.p(t2, n2) : en(t2, n2);
}
function bn(e3, t2) {
  let { year: n2, month: r2 } = k(e3, t2), [i2, a2] = hn(e3, n2, r2);
  return Le(i2, a2);
}
function xn(e3, t2) {
  let { year: n2 } = k(e3, t2);
  return e3 ? e3.u(n2) : nn(n2);
}
function Sn(e3, t2) {
  let { year: n2 } = k(e3, t2);
  return vn(e3, n2);
}
function Cn(e3, t2) {
  let { year: n2, month: r2 } = k(e3, t2);
  return yn(e3, n2, r2);
}
function wn(e3, t2) {
  let { year: n2 } = k(e3, t2);
  return e3 ? e3.j(n2) : tn(n2);
}
function Tn(e3, t2) {
  if (!e3) return sn(t2);
  let { year: n2 } = k(e3, t2), r2 = _n(e3, n2, 1, 1);
  return Gt(t2) - Gt(r2) + 1;
}
function En(e3, t2) {
  return e3 === void 0 ? cn(t2).weekOfYear : void 0;
}
function Dn(e3, t2) {
  return e3 === void 0 ? cn(t2).yearOfWeek : void 0;
}
var A = Ve.map((e3) => e3 + `s`);
var On = pe(A);
var kn = w(A);
var An = A.slice(0, 6);
var jn = A.slice(6);
var Mn = jn.slice(1);
var Nn = A.reduce((e3, t2, n2) => (e3[t2] = n2, e3), {});
var j = fe(A, 0);
var Pn = fe(An, 0);
var Fn = C(he, A);
function In(e3, t2) {
  return t2 ?? b(m(e3)), t2;
}
var M = C(Ln, `string`);
function Ln(e3, t2, n2 = e3) {
  return typeof t2 !== e3 && x(p(n2, t2)), t2;
}
function Rn(e3, t2 = `number`) {
  return Number.isInteger(e3) || b(((e4, t3) => `Non-integer ${e4}: ${t3}`)(t2, e3)), e3 || 0;
}
function zn(e3) {
  return typeof e3 == `symbol` && x(`Cannot convert Symbol to string`), String(e3);
}
function Bn(e3, t2) {
  return d(e3) ? String(e3) : M(e3, t2);
}
function Vn(e3) {
  return typeof e3 == `boolean` ? BigInt(e3 ? 1 : 0) : typeof e3 == `string` ? BigInt(e3) : (typeof e3 != `bigint` && x(`Invalid bigint: ${e3}`), e3);
}
function Hn(e3, t2) {
  return Rn(o(e3, t2), t2);
}
function Un(e3, t2) {
  return typeof e3 == `string` ? ((e4, t3) => {
    let n2 = /* @__PURE__ */ Object.create(null);
    return n2[e4] = t3, n2;
  })(t2, e3) : f(e3);
}
var Wn = `smallestUnit`;
var Gn = { constrain: 0, reject: 1 };
var Kn = { compatible: 0, reject: 1, earlier: 2, later: 3 };
var qn = { reject: 0, use: 1, prefer: 2, ignore: 3 };
var Jn = { auto: 0, never: 1, critical: 2, always: 3 };
var Yn = { auto: 0, never: 1, critical: 2 };
var Xn = { auto: 0, never: 1 };
var Zn = { floor: 0, halfFloor: 1, ceil: 2, halfCeil: 3, trunc: 4, halfTrunc: 5, expand: 6, halfExpand: 7, halfEven: 8 };
var Qn = [Math.floor, (e3) => je(e3) ? Math.floor(e3) : Math.round(e3), Math.ceil, (e3) => je(e3) ? Math.ceil(e3) : Math.round(e3), Math.trunc, (e3) => je(e3) ? Math.trunc(e3) || 0 : Math.round(e3), (e3) => e3 < 0 ? Math.floor(e3) : Math.ceil(e3), (e3) => Math.sign(e3) * Math.round(Math.abs(e3)) || 0, (e3) => je(e3) ? (e3 = Math.trunc(e3) || 0) + e3 % 2 : Math.round(e3)];
var $n = { previous: -1, next: 1 };
function er(e3) {
  let t2 = e3.roundingIncrement;
  return t2 === void 0 ? 1 : s(t2, `roundingIncrement`);
}
function tr(e3) {
  let t2 = e3.fractionalSecondDigits;
  if (t2 !== void 0) {
    if (typeof t2 != `number`) {
      if (zn(t2) === `auto`) return;
      b(p(`fractionalSecondDigits`, t2));
    }
    t2 = oe(`fractionalSecondDigits`, Math.floor(t2), 0, 9, 1);
  }
  return t2;
}
function nr(e3, t2, n2 = 0, r2) {
  let i2 = t2[e3];
  if (i2 === void 0) return r2 ? n2 : void 0;
  if (i2 = zn(i2), i2 === `auto`) return r2 ? n2 : null;
  let a2 = Be[i2];
  return a2 === void 0 && (a2 = Nn[i2]), a2 === void 0 && b(g(e3, i2, Be)), a2;
}
function rr(e3, t2, n2, r2 = 0) {
  let i2 = n2[e3];
  if (i2 === void 0) return r2;
  let a2 = zn(i2), o2 = t2[a2];
  return o2 === void 0 && b(g(e3, a2, t2)), o2;
}
var ir = C(nr, Wn);
var ar = C(nr, `largestUnit`);
var or = C(nr, `unit`);
var sr = C(rr, `overflow`, Gn);
var cr = C(rr, `disambiguation`, Kn);
var lr = C(rr, `offset`, qn);
var ur = C(rr, `calendarName`, Jn);
var dr = C(rr, `timeZoneName`, Yn);
var fr = C(rr, `offset`, Xn);
var pr = C(rr, `roundingMode`, Zn);
var mr = C(rr, `direction`, $n);
function hr(e3, t2, n2, r2) {
  let i2 = r2 ? Je : Ye[t2 + 1];
  if (i2) {
    let n3 = Ye[t2];
    i2 % ((e3 = oe(`roundingIncrement`, e3, 1, i2 / n3 - (r2 ? 0 : 1), 1)) * n3) && b(p(`roundingIncrement`, e3));
  } else e3 = oe(`roundingIncrement`, e3, 1, n2 ? 10 ** 9 : 1, 1);
  return e3;
}
function gr(e3, t2, n2, r2) {
  return t2 != null && oe(e3, t2, n2, r2, 1, Ve), t2;
}
function _r(e3, t2) {
  t2 > e3 && b(`smallestUnit > largestUnit`);
}
function vr(e3, t2, n2, r2 = 9, i2 = 0, o2 = 4) {
  t2 = a(t2);
  let s2 = ar(t2, i2), c2 = er(t2), l2 = pr(t2, o2), u2 = ir(t2, i2, 1);
  return s2 = gr(`largestUnit`, s2, i2, r2), u2 = gr(Wn, u2, i2, r2), s2 == null ? s2 = Math.max(n2, u2) : _r(s2, u2), c2 = hr(c2, u2, 1), e3 && (l2 = ((e4) => e4 < 4 ? (e4 + 2) % 4 : e4)(l2)), [s2, u2, c2, l2];
}
function yr(e3, t2 = 6, n2) {
  let r2 = er(e3 = Un(e3, Wn)), i2 = pr(e3, 7), a2 = ir(e3);
  return a2 = In(Wn, a2), a2 = gr(Wn, a2, 0, t2), r2 = hr(r2, a2, void 0, n2), [a2, r2, i2];
}
function N(e3, t2) {
  return S(at, e3, S(O, t2));
}
function P(e3) {
  return e3 === void 0 ? 0 : sr(f(e3));
}
function br(e3, t2 = 0) {
  e3 = a(e3);
  let n2 = cr(e3), r2 = lr(e3, t2);
  return [sr(e3), r2, n2];
}
var xr = BigInt(1e8) * D;
var Sr = BigInt(-1e8) * D;
var Cr = Sr - D;
var wr = -3261848;
function Tr(e3) {
  let t2 = 12 * e3.year + e3.month;
  return (t2 < wr || t2 > 3309129) && b(`Out-of-bounds date`), e3;
}
function Er(e3, t2 = 1) {
  return Or(Ut(e3), t2), e3;
}
function Dr(e3) {
  let t2 = Ut(e3);
  return Or(t2), t2 !== Cr || Nt(e3) || b(`Out-of-bounds date`), e3;
}
function Or(e3, t2 = 1) {
  (e3 < (t2 ? Cr : Sr) || e3 > xr) && b(`Out-of-bounds date`);
}
function kr(e3) {
  return (e3 < Sr || e3 > xr) && b(`Out-of-bounds date`), e3;
}
function Ar(e3, t2) {
  return kr(Ut(e3) + BigInt(Nt(e3) - t2));
}
function jr(e3) {
  return { epochNanoseconds: e3 };
}
function Mr(e3, t2, n2) {
  return { calendar: n2, timeZone: t2, epochNanoseconds: e3 };
}
function Nr(e3, t2) {
  return S(O, e3, F(e3, t2));
}
function F(e3, t2) {
  return S(at, e3, { calendar: t2 });
}
function Pr(e3) {
  return S(O, e3);
}
function I(e3) {
  return S(A, e3, { sign: na(e3) });
}
function Fr(e3) {
  return t2 = e3.epochNanoseconds, Number(we(t2, Ze));
  var t2;
}
function Ir(e3) {
  return e3.epochNanoseconds;
}
function Lr(e3, t2, n2) {
  let r2 = da(t2), [i2, a2] = ((e4, t3) => {
    let n3 = t3((e4 = Un(e4, `unit`)).relativeTo), r3 = or(e4);
    return r3 = In(`unit`, r3), [r3, n3];
  })(n2, e3);
  if (!a2 && Ji(Math.max(i2, r2), a2)) return zr(t2, i2);
  if (a2 || b(`Missing relativeTo`), !t2.sign && Ji(i2, a2)) return 0;
  let o2 = Hi(a2), s2 = o2.G(o2.i, t2);
  Gi(o2, s2);
  let c2 = o2.re(o2.i, s2, i2);
  return Ji(i2, a2) ? zr(c2, i2) : Rr(c2, o2.V(s2), i2, o2);
}
function Rr(e3, t2, n2, r2) {
  let i2 = na(e3) || 1, a2 = Br(Fn(n2, e3), n2, i2, r2, t2), o2 = a2.ae, s2 = a2.de, c2 = Number(s2 - o2), l2 = Number(t2 - o2);
  return a2.ye[A[n2]] + l2 / c2 * i2;
}
function zr(e3, t2) {
  return tt(aa(e3), Ye[t2]);
}
function Br(e3, t2, n2, r2, i2) {
  let a2 = A[t2], o2 = e3, s2 = 0, c2 = Vr(o2, a2, n2, r2);
  return i2 && !((e4, t3, n3, r3) => r3 > 0 ? E(t3, e4) <= 0 && E(e4, n3) <= 0 : E(n3, e4) <= 0 && E(e4, t3) <= 0)(i2, c2.ae, c2.de, Math.sign(n2)) && (o2 = { ...e3, [a2]: e3[a2] + n2 }, s2 = 1, c2 = Vr(o2, a2, n2, r2)), { ...c2, ye: o2, He: s2 };
}
function Vr(e3, t2, n2, r2) {
  let i2 = { ...e3, [t2]: e3[t2] + n2 };
  return { ae: Ui(r2, e3), de: Ui(r2, i2), Ae: i2 };
}
function Hr(e3, t2, n2) {
  let r2 = n2 - t2, i2 = e3 - t2;
  if (!i2) return 0;
  let a2 = i2 < 0n ? -i2 : i2, o2 = r2 < 0n ? -r2 : r2, s2 = E(i2, 0n) === E(r2, 0n) ? 1 : -1;
  return E(a2, o2) <= 0 ? a2 === o2 ? s2 : Ae(E(2n * a2, o2), s2) : Number(i2) / Number(r2);
}
function Ur(e3, t2, n2, r2) {
  let { epochNanoseconds: i2 } = e3, { timeZone: a2, calendar: o2 } = e3;
  if (t2 === 0 && n2 === 1) return { epochNanoseconds: i2, timeZone: a2, calendar: o2 };
  if (t2 === 6) {
    let t3 = N(L(e3), kt), n3 = N(yi(t3, 1), kt), o3 = di(a2, t3), s2 = di(a2, n3);
    i2 = ri(Hr(i2, o3, s2), r2) ? s2 : o3;
  } else {
    let o3 = L(e3), s2 = o3.offsetNanoseconds;
    i2 = li(a2, Kr(o3, Yr(t2, n2), r2), s2, 2, 0, 1);
  }
  return { epochNanoseconds: i2, timeZone: a2, calendar: o2 };
}
function Wr(e3) {
  let { timeZone: t2 } = e3, n2 = N(L(e3), kt), r2 = N(yi(n2, 1), kt), i2 = di(t2, n2);
  return tt(di(t2, r2) - i2, qe);
}
function Gr(e3) {
  let { timeZone: t2, calendar: n2 } = e3;
  return Mr(di(t2, N(L(e3), kt)), t2, n2);
}
function Kr(e3, t2, n2) {
  let [r2, i2] = qr(e3, t2, n2), a2 = N(yi(e3, i2), r2);
  return Dr(a2), a2;
}
function qr(e3, t2, n2) {
  return Lt(ni(Nt(e3), t2, n2));
}
function Jr(e3) {
  return ni(e3, Ke, 7);
}
function Yr(e3, t2) {
  return Ye[e3] * t2;
}
function Xr(e3, t2) {
  return BigInt(Ye[e3]) * BigInt(t2);
}
function Zr(e3, t2, n2) {
  let r2 = Math.min(da(e3), 6);
  return ca($r(aa(e3), BigInt(t2), n2), r2);
}
function Qr(e3, t2, n2, r2, i2, a2, o2) {
  if (r2 === 0 && i2 === 1) return e3;
  let s2 = na(e3) || 1, [c2, l2, u2] = (Ji(r2, o2.i) ? Wi(o2.i) && r2 < 6 && n2 >= 6 ? ai : ii : oi)(s2, e3, t2, n2, r2, i2, a2, o2);
  return u2 && r2 !== 7 && (c2 = ((e4, t3, n3, r3, i3, a3) => {
    for (let o3 = r3 + 1; o3 <= n3; o3++) {
      if (o3 === 7 && n3 !== 7) continue;
      let r4 = Fn(o3, e4);
      r4[A[o3]] += i3;
      let s3 = E(t3, Ui(a3, r4));
      if (s3 && s3 !== i3) break;
      e4 = r4;
    }
    return e4;
  })(c2, l2, n2, Math.max(6, r2), s2, o2)), c2;
}
function $r(e3, t2, n2) {
  return ti(e3, t2, n2, e3 / t2 % 2n);
}
function ei(e3, t2, n2) {
  let [r2, i2] = Te(e3, D), a2 = r2 * D;
  return a2 + ti(i2, t2, n2, (a2 / t2 + i2 / t2) % 2n);
}
function ti(e3, t2, n2, r2) {
  let i2 = e3 / t2, a2 = e3 % t2, o2 = 0;
  a2 && (o2 = Ae(E(2n * (a2 < 0n ? -a2 : a2), t2), Math.sign(Number(a2))));
  let s2 = ri(Number(r2) + o2, n2);
  return (i2 - r2 + BigInt(s2)) * t2;
}
function ni(e3, t2, n2) {
  return ri(e3 / t2, n2) * t2;
}
function ri(e3, t2) {
  return Qn[t2](e3);
}
function ii(e3, t2, n2, r2, i2, a2, o2) {
  let s2 = aa(t2), c2 = $r(s2, Xr(i2, a2), o2), l2 = c2 - s2, u2 = Math.sign(Number(c2 / D) - Number(s2 / D)) === e3, d2 = ca(c2, Math.min(r2, 6));
  return [{ ...t2, ...d2 }, n2 + l2, u2];
}
function ai(e3, t2, n2, r2, i2, a2, o2, s2) {
  let c2 = Number(oa(t2)), l2 = Yr(i2, a2), u2 = ni(c2, l2, o2), d2 = Br({ ...t2, ...Pn }, 6, e3, s2, n2), f2 = d2.ae, p2 = d2.de, m2 = u2 - Number(p2 - f2), h2 = 0;
  m2 && Math.sign(m2) !== e3 ? n2 = f2 + BigInt(u2) : (h2 += e3, u2 = ni(m2, l2, o2), n2 = p2 + BigInt(u2));
  let g2 = la(u2);
  return [{ ...t2, ...g2, days: t2.days + h2 }, n2, !!h2];
}
function oi(e3, t2, n2, r2, i2, a2, o2, s2) {
  let c2 = A[i2], l2 = Fn(i2, t2);
  i2 === 7 && (t2 = { ...t2, weeks: t2.weeks + Math.trunc(t2.days / 7) }), l2[c2] = Oe(t2[c2], a2) * a2;
  let u2 = Br(l2, i2, a2 * e3, s2, n2), d2 = u2.ae, f2 = u2.de, p2 = Hr(n2, d2, f2), m2 = u2.ye[c2], h2 = u2.Ae[c2], g2 = ni(m2 + p2 * e3 * a2, a2, o2), _2 = g2 === h2;
  return l2[c2] = g2, [l2, _2 ? f2 : d2, u2.He || _2];
}
function si(e3, t2) {
  return e3.timeZone.U(e3.epochNanoseconds, ((e4) => {
    let t3 = mr(Un(e4, `direction`), 0);
    return t3 || b(p(`direction`, t3)), t3;
  })(t2));
}
var L = se(ci, WeakMap);
function ci(e3) {
  let { epochNanoseconds: t2, timeZone: n2 } = e3, r2 = n2.C(t2);
  return { ...qt(t2 + BigInt(r2)), offsetNanoseconds: r2 };
}
function li(e3, t2, n2, r2 = 0, i2 = 0, a2, o2) {
  if (n2 !== void 0 && r2 === 1 && (r2 === 1 || o2)) return Ar(t2, n2);
  r2 !== 2 && r2 !== 0 || Er(t2, 0);
  let s2 = e3.R(t2);
  if (n2 !== void 0 && r2 !== 3) {
    let e4 = ((e5, t3, n3, r3) => {
      let i3 = Vt(t3);
      r3 && (n3 = Jr(n3));
      for (let t4 of e5) {
        let e6 = Number(i3 - t4);
        if (r3 && (e6 = Jr(e6)), e6 === n3) return t4;
      }
    })(s2, t2, n2, a2);
    if (e4 !== void 0) return e4;
    r2 === 0 && b(`Invalid TimeZone offset`);
  }
  return o2 ? Vt(t2) : ui(e3, t2, i2, s2);
}
function ui(e3, t2, n2 = 0, r2 = e3.R(t2)) {
  if (r2.length === 1) return r2[0];
  if (n2 === 1 && b(`Ambiguous offset`), r2.length) return r2[n2 === 3 ? 1 : 0];
  let i2 = Vt(t2), a2 = ((e4, t3) => {
    let n3 = e4.C(t3 - D);
    return ((e5) => (e5 > 864e11 && b(`Out-of-bounds TimeZone gap`), e5))(e4.C(t3 + D) - n3);
  })(e3, i2), o2 = qt(i2 + BigInt(a2 * (n2 === 2 ? -1 : 1)));
  return (r2 = e3.R(o2))[n2 === 2 ? 0 : r2.length - 1];
}
function di(e3, t2) {
  let n2 = e3.R(t2);
  if (n2.length) return n2[0];
  let r2 = Vt(t2) - D;
  return e3.U(r2, 1);
}
function fi(e3, t2, n2, r2, i2) {
  let a2 = P(i2);
  return r2.sign && da(r2) < 8 && b(`Cannot use small units`), _i(t2, bi(t2, Er(_i(t2, n2)), e3 ? R(r2) : r2, a2));
}
function pi(e3, t2) {
  return kr(e3 + (ua(n2 = t2) && b(`Cannot use large units`), oa(n2)));
  var n2;
}
function mi(e3, t2, n2) {
  let { calendar: r2, epochNanoseconds: i2, timeZone: a2 } = e3, o2 = oa(t2), s2 = i2;
  if (ua(t2)) {
    let i3 = L(e3);
    s2 = ui(a2, N(gi(r2, i3, { ...t2, ...Pn }, n2), i3)) + o2;
  } else s2 += o2, P(n2);
  return { ...e3, epochNanoseconds: kr(s2) };
}
function hi(e3, t2, n2, r2) {
  let [i2, a2] = vi(t2, n2), o2 = N(gi(e3, t2, { ...n2, ...Pn, days: n2.days + a2 }, r2), i2);
  return Dr(o2), o2;
}
function gi(e3, t2, n2, r2) {
  if (n2.years || n2.months || n2.weeks) return bi(e3, t2, n2, P(r2));
  P(r2);
  let i2 = n2.days + Number(oa(n2) / D);
  return i2 ? Er(yi(t2, i2)) : t2;
}
function _i(e3, t2) {
  return yi(t2, 1 - k(e3, t2).day);
}
function vi(e3, t2) {
  let n2 = oa(t2), r2 = Number(n2 / D), i2 = Number(n2 % D), [a2, o2] = Lt(Nt(e3) + i2);
  return [a2, r2 + o2];
}
function yi(e3, t2) {
  return t2 ? Yt(Gt(e3) + t2) : e3;
}
function bi(e3, t2, n2, r2) {
  let { years: i2, months: a2, weeks: o2, days: s2 } = n2, c2;
  if (s2 += Number(oa(n2) / D), i2 || a2) c2 = xi(e3, t2, i2, a2, r2);
  else {
    if (!o2 && !s2) return t2;
    c2 = t2;
  }
  return (o2 || s2) && (c2 = yi(c2, 7 * o2 + s2)), Er(c2);
}
function xi(e3, t2, n2, r2, i2) {
  let { year: a2, month: o2, day: s2 } = k(e3, t2);
  if (n2) {
    let [t3, r3] = hn(e3, a2, o2);
    a2 += n2, o2 = Si(e3, t3, r3, e3 ? e3.q(a2) : void 0, i2), o2 = oe(`month`, o2, 1, vn(e3, a2), i2);
  }
  if (r2) {
    let t3 = e3 ? e3.N(a2, o2, r2) : rn(a2, o2, r2);
    ({ year: a2, month: o2 } = t3);
  }
  return s2 = oe(`day`, s2, 1, yn(e3, a2, o2), i2), _n(e3, a2, o2, s2);
}
function Si(e3, t2, n2, r2, i2) {
  if (n2) {
    let n3 = e3 ? e3.m : void 0;
    return r2 !== void 0 && (n3 < 0 || r2 === t2 + 1) ? r2 : (i2 === 1 && b(v), n3 < 0 ? -n3 : t2);
  }
  return Re(t2, 0, r2);
}
function Ci(e3, t2) {
  return Pe(e3) !== Pe(t2) && b(`Mismatching Calendars`), e3;
}
function wi(e3, t2) {
  return e3.o !== t2.o && b(`Mismatching TimeZones`), e3;
}
function Ti(e3) {
  return e3.timeZone.id;
}
function Ei(e3, t2, n2, r2) {
  let [i2, a2, o2, s2] = vr(e3, r2, 3, 5), c2 = zi(t2.epochNanoseconds, n2.epochNanoseconds, i2, a2, o2, s2);
  return I(e3 ? R(c2) : c2);
}
function Di(e3, t2, n2, r2, i2) {
  let [a2, o2, s2, c2] = vr(e3, i2, 5), l2 = n2.epochNanoseconds, u2 = r2.epochNanoseconds, d2;
  return E(u2, l2) ? a2 < 6 ? d2 = zi(l2, u2, a2, o2, s2, c2) : (d2 = Ni(wi(n2.timeZone, r2.timeZone), t2, n2, r2, a2), d2 = Qr(d2, u2, a2, o2, s2, c2, Vi(n2, Ir, mi))) : d2 = j, I(e3 ? R(d2) : d2);
}
function Oi(e3, t2, n2, r2, i2) {
  let [a2, o2, s2, c2] = vr(e3, i2, 6), l2 = Vt(n2), u2 = Vt(r2), d2 = E(u2, l2), f2;
  return d2 ? a2 <= 6 ? f2 = zi(l2, u2, a2, o2, s2, c2) : (f2 = Fi(t2, n2, r2, d2, a2), f2 = Qr(f2, u2, a2, o2, s2, c2, Vi(n2, Vt, C(hi, t2)))) : f2 = j, I(e3 ? R(f2) : f2);
}
function ki(e3, t2, n2, r2, i2) {
  let [a2, o2, s2, c2] = vr(e3, i2, 6, 9, 6);
  return ji(e3, t2, n2, r2, a2, o2, s2, c2);
}
function Ai(e3, t2, n2, r2, i2) {
  let [a2, o2, s2, c2] = vr(e3, i2, 9, 9, 8), l2 = _i(t2, n2), u2 = _i(t2, r2);
  return Li(l2, u2) ? ji(e3, t2, Er(l2), Er(u2), a2, o2, s2, c2, 8) : I(j);
}
function ji(e3, t2, n2, r2, i2, a2, o2, s2, c2 = 6) {
  let l2 = Ut(n2), u2 = Ut(r2), d2;
  return E(u2, l2) ? i2 === 6 ? d2 = zi(l2, u2, i2, a2, o2, s2) : (d2 = Ii(t2, n2, r2, i2), a2 === c2 && o2 === 1 || (d2 = Qr(d2, u2, i2, a2, o2, s2, Vi(n2, Ut, C(gi, t2))))) : d2 = j, I(e3 ? R(d2) : d2);
}
function Mi(e3, t2, n2, r2) {
  let [i2, a2, o2, s2] = vr(e3, r2, 5, 5), c2 = ni(Nt(n2) - Nt(t2), Yr(a2, o2), s2), l2 = { ...j, ...la(c2, i2) };
  return I(e3 ? R(l2) : l2);
}
function Ni(e3, t2, n2, r2, i2) {
  let a2 = E(r2.epochNanoseconds, n2.epochNanoseconds);
  if (!a2) return j;
  if (i2 < 6) return { ...j, ...ca(r2.epochNanoseconds - n2.epochNanoseconds, i2) };
  if (!Li(L(n2), L(r2))) return { ...j, ...ca(r2.epochNanoseconds - n2.epochNanoseconds, 5) };
  let [o2, s2, c2] = Ri(e3, n2, r2, a2);
  return { ...i2 === 6 ? { ...j, days: Bi(o2, s2) } : Ii(t2, o2, s2, i2), ...la(c2) };
}
function Pi(e3, t2, n2, r2) {
  let i2 = Vt(t2), a2 = Vt(n2), o2 = E(a2, i2);
  return o2 ? r2 <= 6 ? { ...j, ...ca(a2 - i2, r2) } : Fi(e3, t2, n2, o2, r2) : j;
}
function Fi(e3, t2, n2, r2, i2) {
  let a2 = n2, o2 = Nt(n2) - Nt(t2);
  return Math.sign(o2) === -r2 && (a2 = yi(n2, -r2), o2 += 864e11 * r2), { ...Ii(e3, t2, a2, i2), ...la(o2) };
}
function Ii(e3, t2, n2, r2) {
  if (r2 <= 7) {
    let e4 = Bi(t2, n2);
    return r2 === 7 ? { ...j, weeks: Oe(e4, 7), days: ke(e4, 7) } : { ...j, days: e4 };
  }
  let i2 = k(e3, t2), a2 = k(e3, n2);
  if (r2 === 8) {
    let { year: r3, month: o3, day: s3 } = i2, { year: c3, month: l3, day: u3 } = a2, d3 = Math.sign(T(c3, r3) || T(l3, o3) || Bi(t2, n2)), f3 = 0, p3 = 0;
    if (d3) {
      f3 = e3 ? e3.ne(r3, o3, c3, l3) : an(r3, o3, c3, l3);
      let i3 = xi(e3, t2, 0, f3, 0);
      d3 * T(s3, u3) > 0 && (f3 -= d3, i3 = xi(e3, t2, 0, f3, 0)), p3 = Bi(i3, n2);
    }
    return { ...j, months: f3, days: p3 };
  }
  let { year: o2, month: s2, day: c2 } = i2, { year: l2, month: u2, day: d2 } = a2, f2 = l2 - o2, p2 = u2 - s2, m2 = d2 - c2;
  if (f2 || p2) {
    let t3 = Math.sign(f2 || p2), n3 = yn(e3, l2, u2), r3 = 0;
    if (Math.sign(d2 - c2) === -t3) {
      let i3 = n3, a3 = e3 ? e3.N(l2, u2, -t3) : rn(l2, u2, -t3);
      ({ year: l2, month: u2 } = a3), f2 = l2 - o2, p2 = u2 - s2, n3 = yn(e3, l2, u2), r3 = t3 < 0 ? -i3 : n3;
    }
    if (m2 = d2 - Math.min(c2, n3) + r3, f2) {
      let [n4, r4] = hn(e3, o2, s2), [i3, a3] = hn(e3, l2, u2), c3 = e3 ? e3.m : void 0;
      if (p2 = c3 !== void 0 && r4 && !a3 && (c3 < 0 ? t3 > 0 && i3 === -c3 : t3 < 0 && i3 === n4) ? 0 : i3 - n4 || Number(a3) - Number(r4), Math.sign(p2) === -t3) {
        let i4 = t3 < 0 && -vn(e3, l2);
        l2 -= t3, f2 = l2 - o2, p2 = u2 - Si(e3, n4, r4, e3 ? e3.q(l2) : void 0, 0) + (i4 || vn(e3, l2));
      } else if (e3) {
        let t4 = Si(e3, n4, r4, e3.q(l2), 0);
        p2 = e3.ne(l2, t4, l2, u2);
      }
    }
  }
  return { ...j, years: f2, months: p2, days: m2 };
}
function Li(e3, t2) {
  return T(e3.year, t2.year) || T(e3.month, t2.month) || T(e3.day, t2.day);
}
function Ri(e3, t2, n2, r2) {
  let i2 = L(t2), a2 = L(n2), o2 = n2.epochNanoseconds, s2 = 0, c2 = Nt(a2) - Nt(i2);
  Math.sign(c2) === -r2 && s2++;
  let l2 = s2 + (r2 > 0 ? 1 : 0);
  for (; s2 <= l2; s2++) {
    let t3 = yi(a2, s2 * -r2), n3 = ui(e3, N(t3, i2));
    if (E(o2, n3) !== -r2) return [i2, t3, Number(o2 - n3)];
  }
}
function zi(e3, t2, n2, r2, i2, a2) {
  return { ...j, ...ca($r(t2 - e3, Xr(r2, i2), a2), n2) };
}
function Bi(e3, t2) {
  return Gt(t2) - Gt(e3);
}
function Vi(e3, t2, n2) {
  return { i: e3, V: t2, G: n2 };
}
function Hi(e3) {
  let { calendar: t2 } = e3;
  if (Wi(e3)) {
    let { timeZone: n2 } = e3;
    return { i: e3, V: Ir, G: mi, re: C(Ni, n2, t2) };
  }
  return { i: Ki(e3), V: Vt, G: C(hi, t2), re: C(Pi, t2) };
}
function Ui(e3, t2) {
  return e3.V(e3.G(e3.i, t2));
}
function Wi(e3) {
  return `timeZone` in e3;
}
function Gi(e3, t2) {
  Wi(e3.i) || (qi(e3.i), qi(t2));
}
function Ki(e3) {
  return N(e3, `hour` in e3 ? e3 : kt);
}
function qi(e3) {
  Dr(Ki(e3));
}
function Ji(e3, t2) {
  return e3 <= 6 - (t2 && Wi(t2) ? 1 : 0);
}
function Yi(e3, t2, n2) {
  let r2 = {};
  for (let i2 = t2; i2 >= 0; i2--) {
    let t3 = Ye[i2];
    r2[n2[i2]] = Oe(e3, t3), e3 = ke(e3, t3);
  }
  return r2;
}
var Xi = 2 ** 53;
function Zi(e3, t2, n2, r2, i2) {
  let o2 = e3(a(i2).relativeTo), s2 = Math.max(da(n2), da(r2));
  if (Ji(s2, o2)) return Qi(t2, n2, r2, s2);
  o2 || b(`Missing relativeTo`), t2 && (r2 = R(r2));
  let c2 = Hi(o2), l2 = c2.G(c2.i, n2), u2 = c2.G(l2, r2);
  return I(c2.re(c2.i, u2, s2));
}
function Qi(e3, t2, n2, r2) {
  return I(ra(((e4, t3, n3, r3) => {
    let i2 = aa(e4) + aa(t3) * BigInt(r3 ? -1 : 1);
    return Number.isFinite(Number(i2 / D)) || b(`Out-of-bounds date`), { ...j, ...ca(i2, n3) };
  })(t2, n2, r2, e3)));
}
function $i(e3, t2, n2) {
  let r2 = da(t2), [i2, a2, o2, s2, c2] = ((e4, t3, n3) => {
    e4 = Un(e4, Wn);
    let r3 = ar(e4), i3 = n3(e4.relativeTo), a3 = er(e4), o3 = pr(e4, 7), s3 = ir(e4);
    return r3 === void 0 && s3 === void 0 && b(`Required smallestUnit or largestUnit`), s3 ??= 0, r3 ??= Math.max(s3, t3), _r(r3, s3), a3 = hr(a3, s3, 1), a3 > 1 && s3 > 5 && r3 !== s3 && b(`For calendar units with roundingIncrement > 1, use largestUnit = smallestUnit`), [r3, s3, a3, o3, i3];
  })(n2, r2, e3);
  if (!c2 && Math.max(r2, i2) <= 6) return I(ra(((e4, t3, n3, r3, i3) => {
    let a3 = $r(aa(e4), Xr(n3, r3), i3);
    return { ...j, ...ca(a3, t3) };
  })(t2, i2, a2, o2, s2)));
  let l2 = c2 && Wi(c2) && i2 >= 6 && a2 < 6;
  if (!t2.sign && !l2) return t2;
  c2 || b(`Missing relativeTo`);
  let u2 = Hi(c2), d2 = u2.G(u2.i, t2);
  Gi(u2, d2);
  let f2 = u2.re(u2.i, d2, i2);
  return f2 = Qr(f2, u2.V(d2), i2, a2, o2, s2, u2), I(f2);
}
function ea(e3) {
  return e3.sign === -1 ? ta(e3) : e3;
}
function ta(e3) {
  return I(R(e3));
}
function R(e3) {
  let t2 = {};
  for (let n2 of A) t2[n2] = -1 * e3[n2] || 0;
  return t2;
}
function na(e3, t2 = A) {
  let n2 = 0;
  for (let r2 of t2) {
    let t3 = Math.sign(e3[r2]);
    t3 && (n2 && n2 !== t3 && b(`Cannot mix duration signs`), n2 = t3);
  }
  return n2;
}
function ra(e3) {
  for (let t3 of Mn) oe(t3, e3[t3], -4294967295, 4294967295, 1);
  let t2 = aa(e3);
  return ia(Number(t2 / Qe)), e3;
}
function ia(e3) {
  Number.isSafeInteger(e3) || b(`Out-of-bounds duration`);
}
function aa(e3) {
  return BigInt(e3.days) * D + oa(e3);
}
function oa(e3) {
  return BigInt(e3.hours) * et + BigInt(e3.minutes) * $e + sa(e3);
}
function sa(e3) {
  return BigInt(e3.seconds) * Qe + BigInt(e3.milliseconds) * Ze + BigInt(e3.microseconds) * Xe + BigInt(e3.nanoseconds);
}
function ca(e3, t2 = 6) {
  let n2 = Number(e3 / D), r2 = Number(e3 % D), i2 = Ye[t2], a2 = t2 <= 3 ? Number(e3 / BigInt(i2)) : Je / i2 * n2 + Oe(r2, i2);
  Number.isFinite(a2) || b(`Out-of-bounds date`), t2 <= 3 && Math.abs(a2) / (Ge / Ye[t2]) >= Xi && b(`Out-of-bounds date`);
  let o2 = Yi(r2, t2, A);
  return o2[A[t2]] = a2, o2;
}
function la(e3, t2 = 5) {
  return Yi(e3, t2, A);
}
function ua(e3) {
  return !!na(e3, jn);
}
function da(e3) {
  let t2 = 9;
  for (; t2 > 0 && !e3[A[t2]]; t2--) ;
  return t2;
}
function fa(e3, t2) {
  return E(e3.epochNanoseconds, t2.epochNanoseconds);
}
function pa(e3, t2) {
  return E(e3.epochNanoseconds, t2.epochNanoseconds);
}
function ma(e3, t2, n2, r2) {
  let i2 = e3(a(r2).relativeTo), o2 = Math.max(da(t2), da(n2));
  if (me(A, t2, n2)) return 0;
  if (Ji(o2, i2)) return E(aa(t2), aa(n2));
  i2 || b(`Missing relativeTo`);
  let s2 = Hi(i2);
  return E(Ui(s2, t2), Ui(s2, n2));
}
function ha(e3, t2) {
  return ga(e3, t2) || _a(e3, t2);
}
function ga(e3, t2) {
  return T(Gt(e3), Gt(t2));
}
function _a(e3, t2) {
  return T(Nt(e3), Nt(t2));
}
function va(e3, t2) {
  return !fa(e3, t2);
}
function ya(e3, t2) {
  return !pa(e3, t2) && e3.timeZone.o === t2.timeZone.o && e3.calendar === t2.calendar;
}
function ba(e3, t2) {
  return !ha(e3, t2) && e3.calendar === t2.calendar;
}
function xa(e3, t2) {
  return !ga(e3, t2) && e3.calendar === t2.calendar;
}
function Sa(e3, t2) {
  return !ga(e3, t2) && e3.calendar === t2.calendar;
}
function Ca(e3, t2) {
  return !ga(e3, t2) && e3.calendar === t2.calendar;
}
function wa(e3, t2) {
  return !_a(e3, t2);
}
function Ta(e3) {
  return e3 === 0 ? Me : e3 ? e3.l : void 0;
}
function z(e3, t2, n2 = t2) {
  return Ta(e3) ? n2 : t2;
}
function Ea(e3, t2) {
  let n2 = e3 || void 0, r2 = Ta(e3), { era: i2, eraYear: a2, year: o2 } = t2;
  if (o2 !== void 0 && (o2 = s(o2, `year`)), a2 !== void 0 && (a2 = s(a2, `eraYear`)), i2 !== void 0 || a2 !== void 0) {
    i2 !== void 0 && a2 !== void 0 || x(`Mismatching era/eraYear`), r2 || b(`Forbidden era/eraYear`);
    let e4 = Ne(i2), t3 = r2[e4];
    t3 === void 0 && b(((e5) => `Invalid era: ${e5}`)(i2));
    let s2 = n2?.te ? n2.te(a2, e4, t3) : ka(a2, t3);
    o2 !== void 0 && o2 !== s2 && b(`Mismatching year/eraYear`), o2 = s2;
  } else o2 === void 0 && x(_(r2));
  return o2;
}
function Da(e3, t2, n2, r2, i2) {
  let { month: a2, monthCode: o2 } = t2;
  if (o2 !== void 0) {
    let t3 = ((e4, t4, n3, r3, i3 = Ie(t4)) => {
      let a3 = e4 ? e4.q(n3) : void 0, [o3, s2] = i3, c2 = Re(o3, s2, a3);
      if (s2) {
        let t5 = e4 ? e4.m : void 0;
        t5 === void 0 && b(v), t5 > 0 ? (c2 > t5 && b(v), a3 !== c2 && (r3 === 1 && b(v), c2 = Re(o3, 0, a3))) : (c2 !== -t5 && b(v), a3 === void 0 && r3 === 1 && b(v));
      }
      return c2;
    })(e3, o2, n2, r2, i2);
    a2 !== void 0 && a2 !== t3 && b(`Mismatching month/monthCode`), a2 = t3, r2 = 1;
  } else a2 === void 0 && x(`Missing month/monthCode`);
  return oe(`month`, a2, 1, vn(e3, n2), r2);
}
function Oa(e3, t2, n2, r2, i2) {
  return ae(t2, `day`, 1, yn(e3, r2, n2), i2);
}
function ka(e3, t2) {
  return (t2 + e3) * (Math.sign(t2) || 1) || 0;
}
function Aa(e3, t2) {
  return Mt(S(O, { ...kt, ...e3 }), t2);
}
var ja = ve(`([+-])(\\d{2})(?::?(\\d{2})(?::?(\\d{2})(?:[.,](\\d{1,9}))?)?)?`);
function Ma(e3) {
  let t2 = Na(e3);
  return t2 === void 0 && b(ne(e3)), t2;
}
function Na(e3, t2) {
  let n2 = ja.exec(e3);
  if (n2 && ((e4) => ((e5) => {
    e5[0] !== `T` && e5[0] !== `t` || (e5 = e5.slice(1));
    let t3 = e5.search(/[.,]/), n3 = t3 < 0 ? e5 : e5.slice(0, t3), r2 = n3.split(`:`);
    return r2.length === 1 ? /^(?:\d{2}|\d{4}|\d{6})$/i.test(n3) : (r2.length === 2 || r2.length === 3) && r2.every((e6) => e6.length === 2 && /^\d{2}$/i.test(e6));
  })(e4.slice(1)))(n2[0])) return ((e4, t3) => {
    let n3 = e4[4] || e4[5];
    return t3 && n3 && b(re(n3)), r2 = (xe(e4[2]) * qe + xe(e4[3]) * Ke + xe(e4[4]) * Ge + ye(e4[5] || ``)) * be(e4[1]), Math.abs(r2) >= 864e11 && b(`Out-of-bounds offset`), r2;
    var r2;
  })(n2, t2);
}
var Pa = { era: Bn, month: c, monthCode(e3, t2 = `monthCode`) {
  return ((e4, t3) => {
    if (typeof e4 == `string`) return e4;
    if (e4 && typeof e4 == `object`) {
      let n2 = e4.toString;
      if (typeof n2 == `function`) return M(n2.call(e4), t3);
    }
    return M(e4, t3);
  })(e3, t2);
}, day: c };
var Fa = fe(O, s);
var Ia = fe(A, Hn);
var La = { offset(e3) {
  return Ma(Bn(e3));
} };
var Ra = Object.assign({}, Pa, Fa);
var za = Object.assign({}, Ra, La);
function B(e3, t2, n2, r2, i2 = !r2) {
  let a2 = {}, o2 = 0;
  for (let i3 of t2) {
    let t3 = e3[i3];
    if (t3 !== void 0) {
      o2 = 1;
      let e4 = n2[i3];
      e4 && (t3 = e4(t3, i3)), a2[i3] = t3;
    } else r2 && r2.includes(i3) && x(m(i3));
  }
  return i2 && !o2 && x(h(t2)), a2;
}
function Ba(e3, t2 = kt, n2) {
  let r2 = N(e3, t2);
  return Dr(r2), Nr(r2, n2);
}
function Va(e3, t2, n2) {
  return Ua(e3, t2, Ga(e3, t2), P(n2));
}
function Ha(e3, t2, n2) {
  let r2 = Ga(e3, t2), i2 = n2();
  return [Ua(e3, t2, r2, i2[0]), ...i2];
}
function Ua(e3, t2, n2, r2) {
  let i2 = n2[1], a2 = Da(e3, t2, i2, r2, n2[0]);
  return F(Er(_n(e3, i2, a2, Oa(e3, t2, a2, i2, r2))), e3);
}
function Wa(e3) {
  if (e3.monthCode !== void 0) return Ie(e3.monthCode);
}
function Ga(e3, t2) {
  let n2 = Ta(e3);
  return t2.year !== void 0 || t2.era !== void 0 && t2.eraYear !== void 0 || x(_(n2)), t2.monthCode === void 0 && t2.month === void 0 && x(`Missing month/monthCode`), t2.day === void 0 && x(m(`day`)), [Wa(t2), Ea(e3, t2)];
}
function Ka(e3, t2, n2) {
  let r2 = Ta(e3);
  t2.year !== void 0 || t2.era !== void 0 && t2.eraYear !== void 0 || x(_(r2)), t2.monthCode === void 0 && t2.month === void 0 && x(`Missing month/monthCode`);
  let i2 = Wa(t2), a2 = Ea(e3, t2);
  return F(Tr(_n(e3, a2, Da(e3, t2, a2, P(n2), i2), 1)), e3);
}
function qa(e3, t2, n2) {
  let r2 = e3 === void 0, i2 = Ta(e3);
  t2.day === void 0 && x(m(`day`)), r2 || t2.month === void 0 || t2.year !== void 0 || t2.era !== void 0 && t2.eraYear !== void 0 || x(_(i2));
  let a2 = Wa(t2), o2 = t2.eraYear !== void 0 || t2.year !== void 0 ? Ea(e3, t2) : void 0, s2 = P(n2), c2, l2, u2;
  if (o2 === void 0 && r2 && (o2 = 1972), o2 !== void 0) {
    r2 || Er(_n(e3, o2, 1, 1));
    let n3 = Da(e3, t2, o2, s2, a2);
    c2 = Oa(e3, t2, n3, o2, s2), [l2, u2] = hn(e3, o2, n3);
  } else {
    t2.monthCode === void 0 && x(`Missing month/monthCode`), [l2, u2] = a2;
    let n3 = e3 ? e3.ge : 1972;
    if (n3 !== void 0) c2 = Oa(e3, t2, Da(e3, t2, n3, s2, a2), n3, s2);
    else {
      let n4 = s2 === 0 && e3 ? e3.ke?.(l2, u2, t2.day) : void 0;
      c2 = n4 === void 0 ? t2.day : n4;
    }
  }
  u2 && ((e3 && e3.Z?.[l2]) ?? 1 / 0) < t2.day && (s2 === 1 && b(v), u2 = 0, c2 = ie(t2.day, 1, (e3 && e3.X) ?? 1 / 0));
  let d2 = e3 ? e3.v(l2, !!u2, c2) : Qt(l2, !!u2);
  for (; !d2 && s2 === 0 && c2 > 1; ) c2--, d2 = e3 ? e3.v(l2, !!u2, c2) : Qt(l2, !!u2);
  d2 || b(`Cannot guess year`);
  let { year: f2, month: p2 } = d2;
  return F(Er(_n(e3, f2, p2, c2)), e3);
}
var Ja = Intl.DateTimeFormat;
function Ya(e3, t2) {
  t2 < -864e13 && b(`Out-of-bounds date`);
  let n2 = e3.formatToParts(t2), r2 = {};
  for (let e4 of n2) r2[e4.type] = e4.value;
  return r2;
}
var Xa = { El_Aaiun: 17, Tucuman: 12, Tirane: 11, Riga: 10, Simferopol: 9, Vienna: 9, Tunis: 8, Boa_Vista: 6, Fortaleza: 6, Maceio: 6, Noronha: 6, Recife: 6, Gaza: 6, Hebron: 6, DeNoronha: 6 };
var Za = -388152e4;
function Qa(e3, t2 = 4) {
  let n2 = tr(e3);
  return [pr(e3, 4), ...to(gr(Wn, ir(e3), 0, t2), n2)];
}
function $a(e3) {
  return ur(a(e3));
}
function eo(e3, t2) {
  return Qa(a(e3), t2);
}
function to(e3, t2) {
  return e3 == null ? [t2 === void 0 ? 1 : 10 ** (9 - t2), t2] : [Ye[e3], e3 < 4 ? 9 - 3 * e3 : -1];
}
function no(e3, t2, n2) {
  let [r2, i2, o2, s2] = ((e4) => {
    let t3 = tr(e4 = a(e4)), n3 = pr(e4, 4), r3 = ir(e4);
    return [e4.timeZone, n3, ...to(gr(Wn, r3, 0, 4), t3)];
  })(n2), c2 = r2 !== void 0;
  return ((e4, t3, n3, r3, i3, a2) => {
    n3 = ei(n3, BigInt(i3), r3);
    let o3 = t3.C(n3);
    return ho(qt(n3 + BigInt(o3)), a2) + (e4 ? bo(Jr(o3)) : `Z`);
  })(c2, Po(c2 ? e3(r2) : `UTC`), t2.epochNanoseconds, i2, o2, s2);
}
function ro(e3, t2) {
  let n2 = ((e4) => {
    e4 = a(e4);
    let t3 = ur(e4), n3 = tr(e4), r2 = fr(e4), i2 = pr(e4, 4), o2 = ir(e4);
    return [t3, dr(e4), r2, i2, ...to(gr(Wn, o2, 0, 4), n3)];
  })(t2);
  return ((e4, t3, n3, r2, i2, a2, o2, s2, c2, l2) => {
    r2 = ei(r2, BigInt(c2), s2);
    let u2 = n3.C(r2);
    return ho(qt(r2 + BigInt(u2)), l2) + bo(Jr(u2), o2) + xo(t3, a2) + So(e4, i2);
  })(e3.calendar, e3.timeZone.id, e3.timeZone, e3.epochNanoseconds, ...n2);
}
function io(e3, t2) {
  let n2 = ((e4) => (e4 = a(e4), [ur(e4), ...Qa(e4)]))(t2);
  return ((e4, t3, n3, r2, i2, a2) => ho(Kr(t3, i2, r2), a2) + So(e4, n3))(e3.calendar, e3, ...n2);
}
function ao(e3, t2) {
  return n2 = e3.calendar, r2 = e3, i2 = $a(t2), go(r2) + So(n2, i2);
  var n2, r2, i2;
}
function oo(e3, t2) {
  return co(e3.calendar, _o, e3, $a(t2));
}
function so(e3, t2) {
  return co(e3.calendar, vo, e3, $a(t2));
}
function co(e3, t2, n2, r2) {
  return r2 === 1 ? e3 === void 0 ? t2(n2) : go(n2) : r2 > 1 || r2 === 0 && e3 !== void 0 ? go(n2) + Co(Pe(e3), r2 === 2) : t2(n2);
}
function lo(e3, t2) {
  return ((e4, t3, n2, r2) => yo(qr(e4, n2, t3)[0], r2))(e3, ...eo(t2));
}
function uo(e3, t2) {
  let [n2, r2, i2] = eo(t2, 3);
  return r2 > 1 && ra(e3 = { ...e3, ...Zr(e3, r2, n2) }), fo(e3, i2);
}
function fo(e3, t2) {
  let { sign: n2 } = e3, r2 = n2 === -1 ? R(e3) : e3, { hours: i2, minutes: a2 } = r2, o2 = sa(r2), s2 = Number(o2 / Qe), c2 = Number(o2 % Qe);
  ia(s2);
  let l2 = To(c2, t2), u2 = t2 >= 0 || !n2 || l2;
  return (n2 < 0 ? `-` : ``) + `P` + po({ Y: mo(r2.years), M: mo(r2.months), W: mo(r2.weeks), D: mo(r2.days) }) + (i2 || a2 || s2 || u2 ? `T` + po({ H: mo(i2), M: mo(a2), S: mo(s2, u2) + l2 }) : ``);
}
function po(e3) {
  let t2 = [];
  for (let n2 in e3) {
    let r2 = e3[n2];
    r2 && t2.push(r2, n2);
  }
  return t2.join(``);
}
function mo(e3, t2) {
  if (!e3 && !t2) return ``;
  let n2 = /* @__PURE__ */ Object.create(null);
  return n2.useGrouping = 0, e3.toLocaleString(`fullwide`, n2);
}
function ho(e3, t2) {
  return go(e3) + `T` + yo(e3, t2);
}
function go(e3) {
  return _o(e3) + `-` + Ce(e3.day);
}
function _o(e3) {
  let { year: t2 } = e3;
  return (t2 < 0 || t2 > 9999 ? Eo(t2) + Se(6, Math.abs(t2)) : Se(4, t2)) + `-` + Ce(e3.month);
}
function vo(e3) {
  return Ce(e3.month) + `-` + Ce(e3.day);
}
function yo(e3, t2) {
  let n2 = [Ce(e3.hour), Ce(e3.minute)];
  return t2 !== -1 && n2.push(Ce(e3.second) + ((e4, t3, n3, r2) => To(e4 * We + t3 * Ue + n3, r2))(e3.millisecond, e3.microsecond, e3.nanosecond, t2)), n2.join(`:`);
}
function bo(e3, t2 = 0) {
  if (t2 === 1) return ``;
  let [n2, r2] = Ee(Math.abs(e3), qe), [i2, a2] = Ee(r2, Ke), [o2, s2] = Ee(a2, Ge);
  return Eo(e3) + Ce(n2) + `:` + Ce(i2) + (o2 || s2 ? `:` + Ce(o2) + To(s2) : ``);
}
function xo(e3, t2) {
  return t2 === 1 ? `` : `[` + (t2 === 2 ? `!` : ``) + e3 + `]`;
}
function So(e3, t2) {
  return t2 > 1 || t2 === 0 && e3 !== void 0 ? Co(Pe(e3), t2 === 2) : ``;
}
function Co(e3, t2) {
  return `[` + (t2 ? `!` : ``) + `u-ca=` + e3 + `]`;
}
var wo = /0+$/;
function To(e3, t2) {
  let n2 = Se(9, e3);
  return n2 = t2 === void 0 ? n2.replace(wo, ``) : n2.slice(0, t2), n2 ? `.` + n2 : ``;
}
function Eo(e3) {
  return e3 < 0 ? `-` : `+`;
}
var Do = /^(AC|AE|AG|AR|AS|BE|BS|CA|CN|CS|CT|EA|EC|IE|IS|JS|MI|NE|NS|PL|PN|PR|PS|SS|VS)T$/;
var Oo = /[^\w\/:+-]+/;
function ko(e3) {
  return Ao(M(e3));
}
function Ao(e3) {
  return jo(e3).id;
}
function jo(e3) {
  let t2 = e3.toUpperCase(), n2 = ((e4) => {
    let t3 = Na(e4, 1);
    if (t3 !== void 0) return { id: bo(t3), _: t3, o: t3 };
  })(t2);
  return n2 ? { kind: `fixed`, ...n2 } : Mo(t2 === `UTC` ? `UTC` : ((e4) => (Oo.test(e4) && b(te(e4)), Do.test(e4) && b(`Forbidden ICU TimeZone`), e4.toLowerCase().split(`/`).map((e5, t3) => (e5.length <= 3 || /\d/.test(e5)) && !/etc|yap/.test(e5) ? e5.toUpperCase() : e5.replace(/baja|dumont|[a-z]+/g, (e6, n3) => e6.length <= 2 && !t3 || e6 === `in` || e6 === `chat` ? e6.toUpperCase() : e6.length > 2 || !n3 ? _e(e6).replace(/island|noronha|murdo|rivadavia|urville/, _e) : e6)).join(`/`)))(e3));
}
var Mo = se((e3) => {
  if (e3 === `UTC`) return { kind: `utc`, id: e3, o: e3 };
  let t2 = No(e3.toUpperCase());
  return { kind: `named`, id: e3, format: t2, o: t2.resolvedOptions().timeZone };
});
var No = se((e3) => new Ja(`en-u-hc-h23`, { calendar: `iso8601`, timeZone: e3, era: `short`, year: `numeric`, month: `numeric`, day: `numeric`, hour: `numeric`, minute: `numeric`, second: `numeric` }));
function Po(e3) {
  let t2 = jo(e3);
  return Fo(t2.id, t2);
}
var Fo = se((e3, t2) => t2.kind === `named` ? new Lo(e3, t2.o, t2.format) : new Io(e3, t2.o, t2.kind === `fixed` ? t2._ : 0));
var Io = class {
  constructor(e3, t2, n2) {
    this.id = e3, this.o = t2, this._ = n2;
  }
  C() {
    return this._;
  }
  R(e3) {
    return [Ar(e3, this._)];
  }
  U() {
  }
};
var Lo = class {
  constructor(e3, t2, n2) {
    this.id = e3, this.o = t2, this.qe = ((e4, t3) => {
      let n3 = se(e4), r2 = se(zo), i2 = 86400 * t3;
      function a2(e5) {
        let [t4, a3] = Bo(e5, i2), s2 = Vo(t4), c2 = Vo(a3), l2 = n3(s2), u2 = n3(c2);
        return l2 === u2 ? l2 : o2(r2(s2, c2), l2, u2, e5);
      }
      function o2(t4, n4, r3, i3) {
        let a3, o3;
        for (; (i3 === void 0 || (a3 = i3 < t4[0] ? n4 : i3 >= t4[1] ? r3 : void 0) === void 0) && (o3 = t4[1] - t4[0]); ) {
          let n5 = t4[0] + Math.floor(o3 / 2);
          e4(n5) === r3 ? t4[1] = n5 : t4[0] = n5 + 1;
        }
        return a3;
      }
      return { Ee(e5) {
        let t4 = a2(e5 - 86400), n4 = a2(e5 + 86400), r3 = e5 - t4, i3 = e5 - n4;
        if (t4 === n4) return [r3];
        let o3 = a2(r3);
        return o3 === a2(i3) ? [e5 - o3] : t4 > n4 ? [r3, i3] : [];
      }, De: a2, U: function e5(t4, a3) {
        if (a3 > 0 && t4 >= 864e10) return;
        if (a3 < 0) {
          if (t4 <= Za) return;
          let n4 = Ro() + 94867200;
          if (t4 > n4) return e5(n4, -1);
        }
        let [s2, c2] = Bo(a3 > 0 ? Math.max(t4, Za) : t4, i2), l2 = i2 * a3, u2 = a3 > 0 ? Math.max(t4, Ro()) + 94867200 : Za, d2 = () => a3 < 0 ? c2 > u2 : s2 < u2;
        for (; d2(); ) {
          let e6 = Vo(s2), i3 = Vo(c2), u3 = n3(e6), d3 = n3(i3);
          if (u3 !== d3) {
            let n4 = r2(e6, i3);
            o2(n4, u3, d3);
            let s3 = n4[0];
            if ((T(s3, t4) || 1) === a3) return s3;
          }
          s2 += l2, c2 += l2;
        }
      } };
    })(/* @__PURE__ */ ((e4) => (t3) => {
      let n3 = Ya(e4, 1e3 * t3);
      return 86400 * Kt(((e5) => {
        let t4 = e5.relatedYear;
        if (t4 !== void 0) return parseInt(t4);
        let n4 = parseInt(e5.year);
        return e5.era !== void 0 && Ne(e5.era) === `bce` ? 1 - n4 : n4;
      })(n3), parseInt(n3.month), parseInt(n3.day)) + 3600 * parseInt(n3.hour) + 60 * parseInt(n3.minute) + parseInt(n3.second) - t3;
    })(n2), ((e4) => Xa[e4.split(`/`).pop()] || 60)(e3));
  }
  C(e3) {
    return this.qe.De(((e4) => Bt(e4)[0])(e3)) * Ge;
  }
  R(e3) {
    let t2 = 86400 * Gt(e3) + Ft(e3), n2 = It(e3);
    return this.qe.Ee(t2).map((e4) => kr(BigInt(e4) * Qe + BigInt(n2)));
  }
  U(e3, t2) {
    let [n2, r2] = Bt(e3), i2 = this.qe.U(n2 + (t2 > 0 || r2 ? 1 : 0), t2);
    if (i2 !== void 0) return BigInt(i2) * Qe;
  }
};
function Ro() {
  return Math.floor(Date.now() / 1e3);
}
function zo(e3, t2) {
  return [e3, t2];
}
function Bo(e3, t2) {
  let n2 = Math.floor(e3 / t2) * t2;
  return [n2, n2 + t2];
}
function Vo(e3) {
  return ie(e3, -1e10, 864e10);
}
function Ho(e3, t2, n2) {
  let r2 = B(n2, z(t2, Tt, Et), za, [], 0);
  if (r2.timeZone !== void 0) {
    let n3 = Va(t2, r2), i2 = Aa(r2), a2 = Po(e3(r2.timeZone));
    return { epochNanoseconds: li(a2, N(n3, i2), r2.offset), timeZone: a2, calendar: t2 };
  }
  return Va(t2, r2);
}
function Uo(e3, t2, n2, r2) {
  let i2 = B(n2, z(t2, Tt, Et), za, st, 0), a2 = e3(i2.timeZone), [o2, s2, c2, l2] = Ha(t2, i2, () => br(r2)), u2 = Aa(i2, s2), d2 = Po(a2);
  return Mr(li(d2, N(o2, u2), i2.offset, c2, l2), d2, t2);
}
function Wo(e3, t2, n2) {
  let r2 = B(t2, z(e3, xt, St), Ra, [], 0), [i2, a2] = Ha(e3, r2, () => [P(n2)]);
  return Ba(i2, Aa(r2, a2), e3);
}
function Go(e3, t2, n2, r2 = []) {
  return Va(e3, B(t2, z(e3, yt, bt), Pa, r2), n2);
}
function Ko(e3, t2, n2, r2) {
  return Ka(e3, B(t2, z(e3, mt, ht), Pa, r2), n2);
}
function qo(e3, t2, n2, r2) {
  let i2 = B(n2, z(e3, yt, bt), Pa, it, 0);
  return t2 && i2.month !== void 0 && i2.monthCode === void 0 && i2.year === void 0 && (i2.year = 1972), qa(e3, i2, r2);
}
function Jo(e3, t2) {
  return Aa(B(e3, ft, Fa, [], 1), P(t2));
}
function Yo(e3) {
  let t2 = B(e3, kn, Ia);
  return I(ra({ ...j, ...t2 }));
}
function Xo(e3) {
  b(ne(e3));
}
function Zo(e3) {
  let t2 = Ts(e3 = Bn(e3)), n2;
  return t2 || Xo(e3), t2.F ? n2 = 0 : t2.offset ? n2 = Ma(t2.offset) : Xo(e3), t2.timeZoneId && Na(t2.timeZoneId, 1), dn(t2), jr(Ar(t2, n2));
}
function Qo(e3, t2) {
  let n2 = Ts(M(e3));
  return n2 || Xo(e3), n2.timeZoneId ? ps(n2, t2, void 0) : (n2.F && Xo(e3), hs(n2, t2));
}
function $o(e3, t2, n2) {
  let r2 = Ts(M(e3));
  return r2 && r2.timeZoneId || Xo(e3), ps(r2, t2, n2);
}
function es(e3, t2) {
  let n2 = Ts(M(e3));
  return n2 && !n2.F || Xo(e3), ms(n2, t2);
}
function ts(e3, t2) {
  let n2 = us(ls(M(e3)), void 0, t2);
  return F(n2, n2.calendar);
}
function ns(e3, t2) {
  let n2 = Es(M(e3));
  if (n2) return rs(n2), F(Tr(fn(n2)), t2(n2.calendarId));
  let r2 = us(ls(e3), ds, t2), { calendar: i2 } = r2;
  return F(_i(i2, r2), i2);
}
function rs(e3) {
  e3.calendarId !== `iso8601` && b(re(e3.calendarId));
}
function is(e3, t2) {
  let n2 = Ds(M(e3));
  if (n2) return rs(n2), F(fn(n2), t2(n2.calendarId));
  let r2 = us(ls(e3), fs, t2), { calendar: i2 } = r2, { year: a2, month: o2, day: s2 } = k(i2, r2), [c2, l2] = hn(i2, a2, o2), { year: u2, month: d2 } = ((e4, t3, n3, r3) => {
    let i3 = e4 ? e4.v(t3, n3, r3) : Qt(t3, n3);
    return i3 || b(`Cannot guess year`), i3;
  })(i2, c2, l2, s2);
  return F(Er(_n(i2, u2, d2, s2)), i2);
}
function as(e3) {
  let t2 = ((e4) => {
    let t3 = Os(e4);
    return t3 ? (js(t3[13]), ks(t3, 1)) : void 0;
  })(e3 = M(e3)), n2;
  return t2 || (t2 = Ts(e3), t2 ? (t2.fe || Xo(e3), t2.F && b(re(`Z`)), rs(t2)) : Xo(e3)), (n2 = Es(e3)) && pn(n2) && Xo(e3), (n2 = Ds(e3)) && pn(n2) && Xo(e3), Pr(At(t2));
}
function os(e3) {
  let t2 = ((e4) => {
    let t3 = ws.exec(e4);
    return t3 ? ((e5) => {
      let t4 = 0, n2 = 0, r2 = 0, i2 = { years: a2(e5[2]), months: a2(e5[3]), weeks: a2(e5[4]), days: a2(e5[5]), hours: a2(e5[6], e5[7], 5), minutes: a2(e5[8], e5[9], 4), seconds: a2(e5[10], e5[11], 3), ...Yi(r2, 2, A) };
      return t4 || b(h(A)), be(e5[1]) < 0 && (i2 = R(i2)), i2;
      function a2(e6, i3, a3) {
        let o2 = 0, s2 = 0;
        return a3 && ([o2, r2] = Ee(r2, Ye[a3])), e6 !== void 0 && (n2 && b(re(e6)), s2 = ((e7) => {
          let t5 = parseInt(e7);
          return Number.isFinite(t5) || b(re(e7)), t5;
        })(e6), t4 = 1, i3 && (r2 = ye(i3) * (Ye[a3] / Ge), n2 = 1)), o2 + s2;
      }
    })(t3) : void 0;
  })(M(e3));
  return t2 || Xo(e3), I(ra(t2));
}
function ss(e3) {
  let t2 = Ts(e3) || Es(e3) || Ds(e3);
  if (t2) return t2.calendarId;
  let n2 = Os(e3);
  return n2 ? js(n2[13]).calendarId : e3;
}
function cs(e3) {
  let t2 = Ts(e3);
  return t2 && (t2.timeZoneId || t2.F && `UTC` || t2.offset) || e3;
}
function ls(e3) {
  let t2 = Ts(e3);
  return t2 && !t2.F || Xo(e3), t2;
}
function us(e3, t2, n2) {
  return t2 && e3.calendarId === `iso8601` ? (fn(e3), e3.fe && At(e3), hs(t2(e3), n2)) : e3.fe ? ms(e3, n2) : hs(e3, n2);
}
function ds(e3) {
  let t2 = 12 * e3.year + e3.month === wr ? 20 : 1;
  return { ...e3, day: t2 };
}
function fs(e3) {
  return { ...e3, year: 1972 };
}
function ps(e3, t2, n2) {
  let r2 = Po(Ao(e3.timeZoneId)), i2;
  if (dn(e3), e3.fe) {
    let t3 = e3.offset ? Ma(e3.offset) : void 0, [, o2, s2] = br(n2);
    i2 = li(r2, e3, t3, o2, s2, !(r2._ || e3.offset === void 0 || (a2 = e3.offset, a2.replace(/\D/g, ``).length > 4)), e3.F);
  } else br(n2), i2 = di(r2, e3);
  var a2;
  return kr(i2), Mr(i2, r2, t2(e3.calendarId));
}
function ms(e3, t2) {
  return dn(e3), Dr(e3), { ...N(e3, e3), calendar: t2(e3.calendarId) };
}
function hs(e3, t2) {
  return fn(e3), Er(e3), { calendar: t2(e3.calendarId), year: e3.year, month: e3.month, day: e3.day };
}
function gs(e3) {
  return `(\\d{2})(?:(:?)(\\d{2})(?:\\${e3}(\\d{2})(?:[.,](\\d{1,9}))?)?)?`;
}
function _s(e3) {
  return `([+-])` + gs(e3);
}
var vs = `(?:(?:([+-])(\\d{6}))|(\\d{4}))(-?)(\\d{2})\\4(\\d{2})(?:[T ]` + gs(8) + `(Z|` + _s(15) + `)?)?`;
var ys = ve(`(?:(?:([+-])(\\d{6}))|(\\d{4}))-?(\\d{2})((?:\\[(!?)([^\\]]*)\\]){0,9})`);
var bs = ve(`(?:--)?(\\d{2})-?(\\d{2})((?:\\[(!?)([^\\]]*)\\]){0,9})`);
var xs = ve(vs + `((?:\\[(!?)([^\\]]*)\\]){0,9})`);
var Ss = ve(`T?` + gs(2) + `(${_s(9)})?((?:\\[(!?)([^\\]]*)\\]){0,9})`);
var Cs = RegExp(`\\[(!?)([^\\]]*)\\]`, `g`);
var ws = ve(`([+-])?P(\\d+Y)?(\\d+M)?(\\d+W)?(\\d+D)?(?:T(?:(\\d+)(?:[.,](\\d{1,9}))?H)?(?:(\\d+)(?:[.,](\\d{1,9}))?M)?(?:(\\d+)(?:[.,](\\d{1,9}))?S)?)?`);
function Ts(e3) {
  let t2 = xs.exec(e3);
  return t2 ? ((e4) => {
    let t3 = e4[12], n2 = (t3 || ``).toUpperCase() === `Z`;
    return { year: As(e4), month: parseInt(e4[5]), day: parseInt(e4[6]), ...ks(e4, 7), ...js(e4[19]), fe: !!e4[7], F: n2, offset: n2 ? void 0 : t3 };
  })(t2) : void 0;
}
function Es(e3) {
  let t2 = ys.exec(e3);
  if (t2) return ((e4) => ({ year: As(e4), month: parseInt(e4[4]), day: 1, ...js(e4[5]) }))(t2);
}
function Ds(e3) {
  let t2 = bs.exec(e3);
  return t2 ? ((e4) => ({ year: 1972, month: parseInt(e4[1]), day: parseInt(e4[2]), ...js(e4[3]) }))(t2) : void 0;
}
function Os(e3) {
  let t2 = Ss.exec(e3);
  if (t2) return t2[6] && Ma(t2[6]), t2;
}
function ks(e3, t2) {
  let n2 = xe(e3[t2 + 3]);
  return { ...Lt(ye(e3[t2 + 4] || ``))[0], hour: xe(e3[t2]), minute: xe(e3[t2 + 2]), second: n2 === 60 ? 59 : n2 };
}
function As(e3) {
  let t2 = be(e3[1]), n2 = parseInt(e3[2] || e3[3]);
  return t2 < 0 && !n2 && b(re(-0)), t2 * n2;
}
function js(e3) {
  let t2, n2, r2 = [];
  return e3.replace(Cs, (e4, i2, a2) => {
    let o2 = !!i2, [s2, c2] = a2.split(`=`).reverse();
    return c2 ? c2 === `u-ca` ? (r2.push(s2.toLowerCase()), t2 ||= o2) : (o2 || /[A-Z]/.test(c2)) && b(re(e4)) : (n2 && b(re(e4)), n2 = s2), ``;
  }), r2.length > 1 && t2 && b(re(e3)), { timeZoneId: n2, calendarId: r2[0] || `iso8601` };
}
function Ms(e3, t2, n2) {
  let r2 = Object.assign(/* @__PURE__ */ Object.create(null), t2);
  return Ns(r2, n2, ut), Ta(e3) && (Ns(r2, n2, lt), e3 && e3.le && Ns(r2, n2, dt, ct)), r2;
}
function Ns(e3, t2, n2, r2) {
  let i2 = 0, a2 = [];
  for (let e4 of n2) t2[e4] === void 0 ? a2.push(e4) : i2 = 1;
  if (Object.assign(e3, t2), i2) for (let t3 of r2 || a2) delete e3[t3];
}
function Ps(e3, t2, n2) {
  let { calendar: r2, timeZone: i2 } = e3, a2 = z(r2, Ct, wt), o2 = L(e3), { year: s2, month: c2, day: l2 } = k(r2, o2), u2 = { year: s2, monthCode: Vs(r2, s2, c2), day: l2, hour: o2.hour, minute: o2.minute, second: o2.second, millisecond: o2.millisecond, microsecond: o2.microsecond, nanosecond: o2.nanosecond, offset: o2.offsetNanoseconds }, d2 = B(t2, a2, za), f2 = Ms(r2, u2, d2), p2 = { ...u2, ...d2 }, [m2, h2, g2, _2] = Ha(r2, f2, () => br(n2, 2));
  return Mr(li(i2, N(m2, Mt(p2, h2)), p2.offset, g2, _2), i2, r2);
}
function Fs(e3, t2, n2) {
  let { calendar: r2 } = e3, i2 = z(r2, xt, St), { year: a2, month: o2, day: s2 } = k(r2, e3), c2 = { year: a2, monthCode: Vs(r2, a2, o2), day: s2, hour: e3.hour, minute: e3.minute, second: e3.second, millisecond: e3.millisecond, microsecond: e3.microsecond, nanosecond: e3.nanosecond }, l2 = B(t2, i2, Ra), u2 = Ms(r2, c2, l2), d2 = { ...c2, ...l2 }, [f2, p2] = Ha(r2, u2, () => [P(n2)]);
  return Ba(f2, Mt(d2, p2), r2);
}
function Is(e3, t2, n2) {
  let { calendar: r2 } = e3, i2 = z(r2, yt, bt), { year: a2, month: o2, day: s2 } = k(r2, e3);
  return Va(r2, Ms(r2, { year: a2, monthCode: Vs(r2, a2, o2), day: s2 }, B(t2, i2, Pa)), n2);
}
function Ls(e3, t2, n2) {
  let { calendar: r2 } = e3, i2 = z(r2, mt, ht), { year: a2, month: o2 } = k(r2, e3);
  return Ka(r2, Ms(r2, { year: a2, monthCode: Vs(r2, a2, o2) }, B(t2, i2, Pa)), n2);
}
function Rs(e3, t2, n2) {
  let { calendar: r2 } = e3, i2 = z(r2, yt, bt), { year: a2, month: o2, day: s2 } = k(r2, e3);
  return qa(r2, Ms(r2, { monthCode: Vs(r2, a2, o2), day: s2 }, B(t2, i2, Pa)), n2);
}
function zs(e3, t2, n2) {
  return ((e4, t3, n3) => Aa({ ...S(ft, e4), ...B(t3, ft, Fa) }, P(n3)))(e3, t2, n2);
}
function Bs(e3, t2) {
  return I((n2 = e3, r2 = t2, ra({ ...n2, ...B(r2, kn, Ia) })));
  var n2, r2;
}
function Vs(e3, t2, n2) {
  let [r2, i2] = hn(e3, t2, n2);
  return Le(r2, i2);
}
function Hs(e3, t2, n2) {
  return Mr(e3.epochNanoseconds, t2, n2);
}
function Us(e3) {
  return jr(e3.epochNanoseconds);
}
function Ws(e3) {
  return Nr(L(e3), e3.calendar);
}
function Gs(e3) {
  return F(L(e3), e3.calendar);
}
function Ks(e3) {
  return Pr(L(e3));
}
function qs(e3, t2, n2) {
  return Mr(kr(((e4, t3, n3) => ui(e4, t3, ((e5) => cr(a(e5)))(n3)))(t2, e3, n2)), t2, e3.calendar);
}
function Js(e3, t2, n2, r2) {
  let i2 = e3(r2.timeZone), a2 = r2.plainTime, o2 = a2 === void 0 ? void 0 : t2(a2), s2 = Po(i2), c2;
  return c2 = o2 ? ui(s2, N(n2, o2)) : di(s2, N(n2, kt)), Mr(c2, s2, n2.calendar);
}
function Ys(e3, t2, n2) {
  return $s(e3, S(z(e3, gt, _t), t2), B(f(n2), it, Pa, []));
}
function Xs(e3, t2, n2) {
  let r2 = z(e3, rt, pt);
  return $s(e3, S(vt, t2), B(f(n2), r2, Pa, []));
}
function Zs(e3, t2) {
  return qa(e3, B(t2, vt, Pa));
}
function Qs(e3, t2, n2) {
  return Ka(e3, B(t2, z(e3, gt, _t), Pa), n2);
}
function $s(e3, t2, n2) {
  let r2 = z(e3, Dt, Ot), i2 = Ms(e3, t2, n2);
  return i2 = B(i2, r2, Pa, []), Va(e3, i2);
}
function ec(e3) {
  return jr(kr(BigInt(Hn(e3)) * Ze));
}
function tc(e3) {
  return jr(kr(Vn(e3)));
}
function nc(e3) {
  return e3.timeZone = `UTC`, [`full`, `long`].includes(e3.timeStyle) && (e3.timeStyle = `medium`), e3;
}
function rc(e3, t2) {
  return e3.timeZone !== void 0 && x(`Cannot specify TimeZone`), e3.timeZone = t2, e3;
}
function ic(e3, t2, n2) {
  let r2 = e3.resolvedOptions().calendar;
  !n2 && t2.calendar === void 0 || Pe(t2.calendar) === r2 || b(`Mismatching Calendars`);
}
function ac(e3, t2, n2, r2, i2) {
  let a2 = new Set(e3), o2 = new Set(t2), s2 = new Set(n2);
  return (e4, t3) => {
    let n3 = ((e5, t4, n4, r3) => {
      let i3 = { dateStyle: void 0, timeStyle: void 0, me: {}, pe: {}, xe: {}, oe: 0, ue: 0 };
      for (let a3 of Object.keys(e5)) {
        let o3 = e5[a3];
        o3 === void 0 || r3.has(a3) || (t4.has(a3) ? a3 === `dateStyle` ? i3.dateStyle = o3 : a3 === `timeStyle` ? i3.timeStyle = o3 : i3.me[a3] = o3 : a3 === `era` ? i3.pe[a3] = o3 : n4.has(a3) ? a3 === `dateStyle` || a3 === `timeStyle` ? i3.ue = 1 : i3.oe = 1 : i3.xe[a3] = o3);
      }
      return i3;
    })(e4, a2, o2, s2), c2 = n3.dateStyle !== void 0, l2 = n3.timeStyle !== void 0, u2 = c2 || l2, d2 = Object.keys(n3.me).length > 0, f2 = n3.oe || n3.ue, p2 = d2 || c2 || l2, m2 = Object.keys(n3.pe).length > 0, h2 = d2 || m2 || n3.oe;
    (!t3 && f2 || t3 && f2 && !p2 || u2 && h2) && x(`Invalid formatting options`);
    let g2 = {};
    return u2 || p2 || Object.assign(g2, r2), Object.assign(g2, n3.me, n3.pe, n3.xe), c2 && (i2 ? Object.assign(g2, i2[n3.dateStyle]) : g2.dateStyle = n3.dateStyle), l2 && (g2.timeStyle = n3.timeStyle), g2;
  };
}
var oc = { year: `numeric`, month: `numeric`, day: `numeric` };
var sc = { hour: `numeric`, minute: `numeric`, second: `numeric` };
var cc = Object.assign({}, oc, sc);
var lc = Object.assign({}, cc, { timeZoneName: `short` });
var uc = { year: `numeric`, month: `numeric` };
var dc = { month: `numeric`, day: `numeric` };
var fc = [`weekday`, `year`, `month`, `day`, `dateStyle`];
var pc = [`dayPeriod`, `hour`, `minute`, `second`, `fractionalSecondDigits`, `timeStyle`];
var mc = fc.concat(pc);
var hc = [`weekday`, `day`].concat(pc);
var gc = [`weekday`, `year`].concat(pc);
var _c = ac(mc, [], [], cc);
var vc = ac(mc, [], [], lc);
var yc = ac(mc, [], [`timeZoneName`], cc);
var bc = ac(fc, pc, [`timeZoneName`], oc);
var xc = ac(pc, fc, [`timeZoneName`, `era`], sc);
var Sc = ac([`year`, `month`, `dateStyle`], hc, [`timeZoneName`], uc, { full: { year: `numeric`, month: `long` }, long: { year: `numeric`, month: `long` }, medium: { year: `numeric`, month: `short` }, short: { year: `2-digit`, month: `numeric` } });
var Cc = ac([`month`, `day`, `dateStyle`], gc, [`timeZoneName`, `era`], dc, { full: { month: `long`, day: `numeric` }, long: { month: `long`, day: `numeric` }, medium: { month: `short`, day: `numeric` }, short: { month: `numeric`, day: `numeric` } });
function wc(e3, t2) {
  let { timeZone: n2 } = e3, r2 = L(e3), { offsetNanoseconds: i2 } = r2, a2 = t2 || kt, o2;
  return o2 = t2 ? li(n2, N(r2, a2), i2, 2) : di(n2, N(r2, a2)), Mr(o2, n2, e3.calendar);
}
function Tc(e3) {
  let t2 = Ec(), n2 = e3.C(t2);
  return qt(t2 + BigInt(n2));
}
function Ec() {
  return BigInt(Date.now()) * Ze;
}
function Dc() {
  return new Ja().resolvedOptions().timeZone;
}
var Oc = `PlainYearMonth`;
var kc = `PlainMonthDay`;
var Ac = `PlainDate`;
var jc = `PlainDateTime`;
var Mc = `PlainTime`;
var Nc = `ZonedDateTime`;
var Pc = `Instant`;
var Fc = `Duration`;
function Ic(e3, t2, n2, ...r2) {
  Object.defineProperties(t2, ce(e3)), Object.defineProperties(t2.prototype, ue(`Temporal.` + e3));
  for (let e4 of r2) Lc(t2.prototype, n2, e4);
  return t2;
}
function Lc(e3, t2, n2) {
  Object.defineProperties(e3, de((e4) => ({ get() {
    return e4(t2(this));
  }, configurable: 1 }), n2));
}
var Rc = ge.name === `noop` ? (e3) => {
  Object.defineProperty(e3, `_str_`, { value: e3.toJSON() });
} : ge;
function zc() {
  x(`Invalid calling context`);
}
function Bc() {
  x(`Cannot use valueOf`);
}
var Vc = { era(e3) {
  return gn(e3.calendar, e3).era;
}, eraYear(e3) {
  return gn(e3.calendar, e3).eraYear;
}, year(e3) {
  return k(e3.calendar, e3).year;
}, month(e3) {
  return k(e3.calendar, e3).month;
}, monthCode(e3) {
  return bn(e3.calendar, e3);
} };
var Hc = { era(e3) {
  return gn(e3.calendar, e3).era;
}, eraYear(e3) {
  return gn(e3.calendar, e3).eraYear;
}, year(e3) {
  return k(e3.calendar, e3).year;
}, month(e3) {
  return k(e3.calendar, e3).month;
}, monthCode(e3) {
  return bn(e3.calendar, e3);
}, day(e3) {
  return k(e3.calendar, e3).day;
} };
var Uc = { monthCode(e3) {
  return bn(e3.calendar, e3);
}, day(e3) {
  return k(e3.calendar, e3).day;
} };
var Wc = { daysInMonth(e3) {
  return Cn(e3.calendar, e3);
}, daysInYear(e3) {
  return wn(e3.calendar, e3);
}, monthsInYear(e3) {
  return Sn(e3.calendar, e3);
}, inLeapYear(e3) {
  return xn(e3.calendar, e3);
} };
var Gc = { dayOfWeek(e3) {
  return on(e3);
}, dayOfYear(e3) {
  return Tn(e3.calendar, e3);
}, weekOfYear(e3) {
  return En(e3.calendar, e3);
}, yearOfWeek(e3) {
  return Dn(e3.calendar, e3);
}, daysInWeek() {
  return 7;
}, daysInMonth(e3) {
  return Cn(e3.calendar, e3);
}, daysInYear(e3) {
  return wn(e3.calendar, e3);
}, monthsInYear(e3) {
  return Sn(e3.calendar, e3);
}, inLeapYear(e3) {
  return xn(e3.calendar, e3);
} };
function Kc(e3) {
  return pe(Object.keys(e3));
}
Kc(Wc), Kc(Gc);
function qc(e3) {
  let t2 = e3.ve || 0;
  function n2(e4) {
    return e4 - t2;
  }
  function r2(e4) {
    return e4 + t2;
  }
  return { l: e3.l, ge: 1972 + t2, le: e3.le, ie(e4) {
    return { ...e4, year: r2(e4.year) };
  }, je(e4, t3, r3) {
    return $t(n2(e4), t3, r3);
  }, se(e4, t3, r3) {
    return Kt(n2(e4), t3, r3) * He;
  }, O(e4, t3) {
    return Zt(t3);
  }, v(e4, t3) {
    let n3 = Qt(e4, t3);
    return n3 && { year: r2(n3.year), month: n3.month };
  }, u(e4) {
    return nn(n2(e4));
  }, k() {
    return 12;
  }, p(e4, t3) {
    return en(n2(e4), t3);
  }, j(e4) {
    return tn(n2(e4));
  }, q() {
  }, h(t3) {
    return e3.h?.(t3, r2(t3.year)) || {};
  }, N(e4, t3, i2) {
    let a2 = rn(n2(e4), t3, i2);
    return { year: r2(a2.year), month: a2.month };
  }, ne(e4, t3, r3, i2) {
    return an(n2(e4), t3, n2(r3), i2);
  } };
}
function Jc(e3, t2) {
  let n2 = Yc(e3);
  return { m: t2.m, Z: t2.Z, X: t2.X, ie: n2.he, je: C(Zc, n2), se: C(Qc, n2), O: C($c, n2, t2.m), v: C(ol, n2, t2.m, t2.Ce), u: C(tl, n2, t2.m), k: C(il, n2), p: C(rl, n2), j: C(nl, n2), q: C(el, n2, t2.m), h: C(al, n2), N: C(sl, n2), ne: C(cl, n2) };
}
function Yc(e3) {
  let t2 = ((e4) => new Ja(`en-u-hc-h23`, { calendar: e4, timeZone: `UTC`, era: `short`, year: `numeric`, month: `short`, day: `numeric` }))(e3);
  function n2(e4) {
    return { ...Xc(n3 = Ya(t2, e4)), month: 0, Fe: n3.month, day: parseInt(n3.day) };
    var n3;
  }
  let r2 = ((e4) => {
    let t3 = e4(0).year - 1970;
    return se(function(n3) {
      let r3 = Kt(n3 - t3) * He, i2, a2 = 0, o2 = [], s2 = [];
      do
        r3 += 400 * He;
      while ((i2 = e4(r3)).year <= n3);
      do
        r3 += (1 - i2.day) * He, i2.year === n3 && (o2.push(r3), s2.push(i2.Fe)), r3 -= He, (++a2 > 500 || r3 < -864e13) && b();
      while ((i2 = e4(r3)).year >= n3);
      return { $: o2.reverse(), we: s2.reverse() };
    });
  })(n2);
  return { he: ((e4, t3) => se((n3) => {
    let r3 = Wt(n3), i2 = e4(r3);
    return { ...i2, month: ll(t3, i2.year, r3) };
  }, WeakMap))(n2, r2), K: r2 };
}
function Xc(e3) {
  return { era: void 0, eraYear: void 0, year: parseInt(e3.relatedYear || e3.year) };
}
function Zc(e3, t2, n2, r2) {
  return Jt(Qc(e3, t2, n2, r2));
}
function Qc(e3, t2, n2 = 1, r2 = 1) {
  return e3.K(t2).$[n2 - 1] + (r2 - 1) * He;
}
function $c(e3, t2, n2, r2) {
  let i2 = el(e3, t2, n2);
  return [ze(r2, i2), i2 === r2];
}
function el(e3, t2, n2) {
  if (t2 === void 0) return;
  let r2 = e3.K(n2).we;
  if (r2.length <= 12) return;
  if (t2 < 0) return -t2;
  for (let e4 = 1; e4 < r2.length; e4++) if (r2[e4] === r2[e4 - 1]) return e4 + 1;
  for (let e4 = 0; e4 < r2.length; e4++) if (/bis$/i.test(r2[e4])) return e4 + 1;
  let i2 = e3.K(n2 - 1).we;
  for (let e4 = 0; e4 < r2.length; e4++) if (r2[e4] !== i2[e4]) return e4 + 1;
}
function tl(e3, t2, n2) {
  if (t2 !== void 0) return il(e3, n2) > 12;
  let r2 = nl(e3, n2);
  return r2 > nl(e3, n2 - 1) || r2 > nl(e3, n2 + 1);
}
function nl(e3, t2) {
  return Xt(Qc(e3, t2), Qc(e3, t2 + 1));
}
function rl(e3, t2, n2) {
  let { $: r2 } = e3.K(t2), i2 = n2 + 1, a2 = r2;
  return i2 > r2.length && (i2 = 1, a2 = e3.K(t2 + 1).$), Xt(r2[n2 - 1], a2[i2 - 1]);
}
function il(e3, t2) {
  return e3.K(t2).$.length;
}
function al(e3, t2) {
  let n2 = e3.he(t2);
  return { era: n2.era, eraYear: n2.eraYear };
}
function ol(e3, t2, n2, r2, i2, a2) {
  let o2 = n2?.(r2, i2, a2) || 1972, { year: s2, month: c2, day: l2 } = e3.he({ year: o2, month: 12, day: 31 }), u2 = el(e3, t2, s2), d2 = ze(c2, u2), f2 = c2 === u2;
  (T(r2, d2) || T(Number(i2), Number(f2)) || T(a2, l2)) === 1 && s2--;
  for (let n3 = 0; n3 < 100; n3++) {
    let o3 = s2 - n3, c3 = el(e3, t2, o3), l3 = Re(r2, i2, c3);
    if (i2 === (l3 === c3) && a2 <= rl(e3, o3, l3)) return { year: o3, month: l3 };
  }
}
function sl(e3, t2, n2, r2) {
  if (r2) if (Number.isSafeInteger(n2 += r2) || b(`Out-of-bounds date`), r2 < 0) for (; n2 < 1; ) n2 += il(e3, --t2);
  else {
    let r3;
    for (; n2 > (r3 = il(e3, t2)); ) n2 -= r3, t2++;
  }
  return { year: t2, month: n2 };
}
function cl(e3, t2, n2, r2, i2) {
  let a2 = T(t2, r2) || T(n2, i2);
  if (!a2) return 0;
  if (t2 === r2) return i2 - n2;
  if (a2 < 0) {
    let a3 = il(e3, t2) - n2 + i2;
    for (let n3 = t2 + 1; n3 < r2; n3++) a3 += il(e3, n3);
    return a3;
  }
  return -cl(e3, r2, i2, t2, n2);
}
function ll(e3, t2, n2) {
  let { $: r2 } = e3(t2);
  for (let e4 = r2.length - 1; e4 >= 0; e4--) if (n2 >= r2[e4]) return e4 + 1;
  b();
}
var ul = 2440588;
function dl(e3) {
  let t2 = e3.J(2441683), n2 = se((t3) => e3.J(Gt(t3) + 2440588), WeakMap);
  function r2(t3, n3) {
    let r3 = e3.q?.(t3);
    return [ze(n3, r3), n3 === r3];
  }
  return { l: e3.l, m: e3.m, Z: e3.Z, X: e3.X, ge: e3.ge, te: e3.te, ke: e3.ke, ie: n2, je(t3, n3, r3) {
    return Yt(e3.L(t3, n3, r3) - 2440588);
  }, se(t3, n3 = 1, r3 = 1) {
    return (e3.L(t3, n3, r3) - 2440588) * He;
  }, O(t3, n3) {
    return (e3.O || r2)(t3, n3);
  }, v(n3, i2, a2) {
    return e3.v?.(n3, i2, a2) || ((n4, i3, a3) => {
      i3 = !!i3;
      let o2 = e3.ge || t2.year, [s2, c2] = r2(t2.year, t2.month);
      (T(n4, s2) || T(Number(i3), Number(c2)) || T(a3, t2.day)) === 1 && o2--;
      for (let t3 = 0; t3 < 100; t3++) for (let r3 of [o2 - t3, o2 + t3]) {
        let t4 = e3.q?.(r3), o3 = Re(n4, i3, t4);
        if (o3 <= e3.k(r3) && i3 === (o3 === t4) && a3 <= e3.p(r3, o3)) return { year: r3, month: o3 };
      }
    })(n3, i2, a2);
  }, u: e3.u, k: e3.k, p: e3.p, j: e3.j, q: e3.q || ge, h(t3) {
    let r3 = n2(t3);
    return e3.h ? e3.h(r3) : { era: r3.era, eraYear: r3.eraYear };
  }, N(t3, n3, r3) {
    return ((e4, t4, n4, r4) => {
      if (r4) if (Number.isSafeInteger(n4 += r4) || b(`Out-of-bounds date`), r4 < 0) for (; n4 < 1; ) n4 += e4(--t4);
      else {
        let r5;
        for (; n4 > (r5 = e4(t4)); ) n4 -= r5, t4++;
      }
      return { year: t4, month: n4 };
    })(e3.k, t3, n3, r3);
  }, ne(t3, n3, r3, i2) {
    return fl(e3.k, t3, n3, r3, i2);
  } };
}
function fl(e3, t2, n2, r2, i2) {
  let a2 = T(t2, r2) || T(n2, i2);
  if (!a2) return 0;
  if (t2 === r2) return i2 - n2;
  if (a2 < 0) {
    let a3 = e3(t2) - n2 + i2;
    for (let n3 = t2 + 1; n3 < r2; n3++) a3 += e3(n3);
    return a3;
  }
  return -fl(e3, r2, i2, t2, n2);
}
var pl = { be: 0 };
var ml = { m: 13, Z: { 1: 0, 2: 29, 8: 29, 9: 29, 10: 29, 11: 29, 12: 0 }, X: 30, Ce(e3, t2, n2) {
  if (t2) switch (e3) {
    case 1:
      return 1651;
    case 2:
      return n2 < 30 ? 1947 : 1765;
    case 3:
      return n2 < 30 ? 1966 : 1955;
    case 4:
      return n2 < 30 ? 1963 : 1944;
    case 5:
      return n2 < 30 ? 1971 : 1952;
    case 6:
      return n2 < 30 ? 1960 : 1941;
    case 7:
      return n2 < 30 ? 1968 : 1938;
    case 8:
      return n2 < 30 ? 1957 : 1718;
    case 9:
      return 2014;
    case 10:
      return 1984;
    case 11:
      return n2 < 29 ? 2033 : 2034;
    case 12:
      return 1890;
  }
  return 1972;
} };
function hl(e3) {
  return Jc(e3, ml);
}
var gl = { am: 0 };
var _l = { am: 0, aa: 0 };
var vl = { aa: 0 };
function yl(e3, t2, n2 = 0, r2 = 0) {
  return dl({ l: t2, te(e4, t3, n3) {
    return t3 === `aa` && r2 ? e4 - 5500 : ka(e4, n3);
  }, ke(e4, t3, n3) {
    return ie(n3, 1, t3 || e4 !== 13 ? 30 : 6);
  }, J(t3) {
    let [r3, i2, a2] = ((e4, t4) => {
      let n3 = Math.floor((4 * (t4 - e4) + 3) / 1461), r4 = 1 + Math.floor((t4 - bl(e4, n3, 1, 1)) / 30);
      return [n3, r4, t4 + 1 - bl(e4, n3, r4, 1)];
    })(e3, t3);
    return { year: r3 + n2, month: i2, day: a2 };
  }, L(t3, r3, i2) {
    return bl(e3, t3 - n2, r3, i2);
  }, p(e4, t3) {
    return ((e5, t4) => t4 % 13 == 0 ? xl(e5) + 5 : 30)(e4 - n2, t3);
  }, j(e4) {
    return 365 + xl(e4 - n2);
  }, k() {
    return 13;
  }, u(e4) {
    return this.j(e4) > 365;
  }, h({ year: e4 }) {
    return n2 ? { era: `aa`, eraYear: e4 } : r2 && e4 <= 0 ? { era: `aa`, eraYear: e4 + 5500 } : { era: `am`, eraYear: e4 };
  } });
}
function bl(e3, t2, n2, r2) {
  return e3 + 365 * t2 + Math.floor(t2 / 4) + 30 * (n2 - 1) + r2 - 1;
}
function xl(e3) {
  return Math.floor(De(e3, 4) / 3);
}
var Sl = { am: 0 };
function Cl(e3) {
  return De(7 * e3 + 1, 19) < 7;
}
function wl(e3) {
  let t2 = Math.floor((235 * e3 - 234) / 19), n2 = 29 * t2 + Math.floor((12084 + 13753 * t2) / 25920);
  return De(3 * (n2 + 1), 7) < 3 && (n2 += 1), n2;
}
function Tl(e3) {
  return wl(e3) + ((e4) => {
    let t2 = wl(e4 - 1), n2 = wl(e4);
    return wl(e4 + 1) - n2 === 356 ? 2 : n2 - t2 === 382 ? 1 : 0;
  })(e3);
}
function El(e3) {
  return Tl(e3 + 1) - Tl(e3);
}
function Dl(e3, t2) {
  let n2 = t2 >= 6 && !Cl(e3) ? t2 + 1 : t2;
  if (n2 === 4 || n2 === 7 || n2 === 9 || n2 === 11 || n2 === 13) return 29;
  let r2 = ((e4) => {
    let t3 = El(e4);
    return t3 > 380 && (t3 -= 30), t3 === 353 ? 0 : t3 === 354 ? 1 : 2;
  })(e3);
  return n2 === 2 ? r2 === 2 ? 30 : 29 : n2 === 3 ? r2 === 0 ? 29 : 30 : n2 === 6 ? Cl(e3) ? 30 : 0 : 30;
}
var Ol = { shaka: 0 };
var kl = [1392, 1390, 1391, 1392, 1391, 1392, 1389, 1392, 1392, 1390, 1391, 1390];
function Al(e3, t2, n2) {
  return dl({ l: { bh: -1, ah: 0 }, J: e3, L: t2, p(e4, t3) {
    return n2 && Pl(e4) ? rl(n2, e4, t3) : ((e5, t4) => 29 + t4 % 2 + (t4 === 12 && Nl(e5) ? 1 : 0))(e4, t3);
  }, j(e4) {
    return n2 && Pl(e4) ? nl(n2, e4) : Nl(e4) ? 355 : 354;
  }, k() {
    return 12;
  }, u(e4) {
    return this.j(e4) > 354;
  }, v(e4, t3, r2) {
    let i2 = n2 && !t3 && r2 === 30 && kl[e4 - 1];
    return n2 && i2 ? { year: i2, month: e4 } : void 0;
  }, h({ year: e4 }) {
    return e4 < 1 ? { era: `bh`, eraYear: 1 - e4 } : { era: `ah`, eraYear: e4 };
  } });
}
function jl(e3, t2, n2, r2) {
  return r2 + Math.ceil(29.5 * (n2 - 1)) + 354 * (t2 - 1) + Math.floor((3 + 11 * t2) / 30) + e3 - 1;
}
function Ml(e3, t2) {
  let n2 = Math.floor((30 * (t2 - e3) + 10646) / 10631), r2 = Math.min(12, Math.ceil((t2 - (29 + jl(e3, n2, 1, 1))) / 29.5) + 1);
  return { year: n2, month: r2, day: t2 - jl(e3, n2, r2, 1) + 1 };
}
function Nl(e3) {
  return De(14 + 11 * e3, 30) < 11;
}
function Pl(e3) {
  return e3 >= 1300 && e3 <= 1600;
}
function Fl(e3, t2) {
  let n2 = t2 - 1948440;
  if (n2 < 460322 || n2 >= 566987) return Ml(1948440, t2);
  let { year: r2, month: i2, day: a2 } = e3.he(Yt(t2 - ul));
  return { year: r2, month: i2, day: a2 };
}
function Il(e3, t2, n2, r2) {
  return Pl(t2) ? Qc(e3, t2, n2, r2) / He + ul : jl(1948440, t2, n2, r2);
}
var Ll = Object.assign({}, Me, { meiji: 1867, taisho: 1911, showa: 1925, heisei: 1988, reiwa: 2018 });
function Rl(e3) {
  let t2 = Gt(e3), n2 = t2 >= 18017 ? `reiwa` : t2 >= 6947 ? `heisei` : t2 >= -15713 ? `showa` : t2 >= -20974 ? `taisho` : t2 >= -35428 ? `meiji` : void 0;
  return n2 ? { era: n2, eraYear: e3.year - Ll[n2] } : un(e3);
}
var zl = { ap: 0 };
var Bl = [0, 31, 62, 93, 124, 155, 186, 216, 246, 276, 306, 336];
function Vl(e3) {
  return De(25 * e3 + 11, 33) < 8;
}
var Hl = { broc: -1, roc: 0 };
var Ul = [`buddhist`, () => qc({ ve: 543, l: pl, h(e3, t2) {
  return { era: `be`, eraYear: t2 };
} })];
var Wl = [`chinese`, hl];
var Gl = [`coptic`, () => yl(1824665, gl)];
var Kl = [`dangi`, hl];
var ql = new Map([Ul, Wl, Gl, Kl, [`ethiopic`, () => yl(1723856, _l, 0, 1)], [`ethioaa`, () => yl(1723856, vl, 5500)], [`hebrew`, () => dl({ l: Sl, m: -6, J(e3) {
  let t2 = e3 - 347997, n2 = Math.floor((25920 * t2 / 765433 * 19 + 234) / 235) + 1, r2 = Tl(n2), i2 = Math.floor(t2 - r2);
  for (; i2 < 1; ) n2--, r2 = Tl(n2), i2 = Math.floor(t2 - r2);
  let a2 = 1, o2 = 0;
  for (; o2 < i2; ) o2 += Dl(n2, a2), a2++;
  return a2--, o2 -= Dl(n2, a2), { year: n2, month: a2, day: i2 - o2 };
}, L(e3, t2, n2) {
  let r2 = Tl(e3);
  for (let n3 = 1; n3 < t2; n3++) r2 += Dl(e3, n3);
  return r2 + n2 + 347997;
}, p: Dl, j: El, k(e3) {
  return Cl(e3) ? 13 : 12;
}, u: Cl, q(e3) {
  return Cl(e3) ? 6 : void 0;
}, O(e3, t2) {
  return Cl(e3) && t2 === 6 ? [5, 1] : [t2 - (Cl(e3) && t2 > 6 ? 1 : 0), 0];
}, v(e3, t2, n2) {
  return t2 && e3 === 5 && n2 <= 30 ? { year: 5730, month: 6 } : void 0;
}, h({ year: e3 }) {
  return { era: `am`, eraYear: e3 };
} })], [`indian`, function() {
  return dl({ l: Ol, J(e3) {
    let t2 = Yt(e3 - ul), n2 = t2.year - 78, r2 = e3 - (Kt(t2.year, 1, 1) + ul), i2;
    if (r2 < 80 ? (n2--, i2 = nn(t2.year - 1) ? 31 : 30, r2 += i2 + 155 + 90 + 10) : (i2 = nn(t2.year) ? 31 : 30, r2 -= 80), r2 < i2) return { year: n2, month: 1, day: r2 + 1 };
    let a2 = r2 - i2;
    return a2 < 155 ? { year: n2, month: Math.floor(a2 / 31) + 2, day: a2 % 31 + 1 } : (a2 -= 155, { year: n2, month: Math.floor(a2 / 30) + 7, day: a2 % 30 + 1 });
  }, L(e3, t2, n2) {
    let r2 = e3 + 78, i2, a2;
    return nn(r2) ? (i2 = 31, a2 = Kt(r2, 3, 21) + ul) : (i2 = 30, a2 = Kt(r2, 3, 22) + ul), t2 === 1 || (a2 += i2 + 31 * Math.min(t2 - 2, 5), t2 >= 8 && (a2 += 30 * (t2 - 7))), a2 + n2 - 1;
  }, p(e3, t2) {
    return t2 === 1 && nn(e3 + 78) || t2 >= 2 && t2 <= 6 ? 31 : 30;
  }, j(e3) {
    return nn(e3 + 78) ? 366 : 365;
  }, k() {
    return 12;
  }, u(e3) {
    return this.j(e3) > 365;
  }, h({ year: e3 }) {
    return { era: `shaka`, eraYear: e3 };
  } });
}], [`japanese`, () => qc({ l: Ll, le: 1, h: Rl })], [`islamic-civil`, () => Al(C(Ml, 1948440), C(jl, 1948440))], [`islamic-tbla`, () => Al(C(Ml, 1948439), C(jl, 1948439))], [`islamic-umalqura`, (e3) => {
  let t2 = Yc(e3);
  return Al(C(Fl, t2), C(Il, t2), t2);
}], [`persian`, () => dl({ l: zl, J(e3) {
  let t2 = e3 - 1948320, n2 = 1 + Math.floor((33 * t2 + 3) / 12053), r2 = t2 - (365 * (n2 - 1) + Math.floor((8 * n2 + 21) / 33)), i2 = Math.floor(r2 < 216 ? r2 / 31 : (r2 - 6) / 30);
  return { year: n2, month: i2 + 1, day: r2 - Bl[i2] + 1 };
}, L(e3, t2, n2) {
  return 1948319 + 365 * (e3 - 1) + Math.floor((8 * e3 + 21) / 33) + Bl[t2 - 1] + n2;
}, p(e3, t2) {
  return t2 <= 6 ? 31 : t2 <= 11 || Vl(e3) ? 30 : 29;
}, j(e3) {
  return Vl(e3) ? 366 : 365;
}, k() {
  return 12;
}, u: Vl, h({ year: e3 }) {
  return { era: `ap`, eraYear: e3 };
} })], [`roc`, () => qc({ ve: -1911, l: Hl, h(e3, t2) {
  return t2 < 1 ? { era: `broc`, eraYear: 1 - t2 } : { era: `roc`, eraYear: t2 };
} })]]);
var Jl = { islamic: 1, "islamic-rgsa": 1 };
var Yl = { "ethiopic-amete-alem": `ethioaa`, islamicc: `islamic-civil` };
var Xl = se((e3, t2) => {
  let n2 = t2(e3);
  return n2.id = e3, n2;
});
function Zl(e3) {
  let t2 = Ql(e3);
  return t2 || b(ee(e3)), Xl(...t2);
}
function Ql(e3) {
  Jl[e3] && b(ee(e3));
  let t2 = Yl[e3] || e3, n2 = ql.get(t2);
  return n2 && [t2, n2];
}
function $l(e3) {
  let t2 = M(e3).toLowerCase();
  return t2 === `iso8601` ? void 0 : t2 === `gregory` ? 0 : Zl(t2);
}
function eu(e3 = `iso8601`) {
  return $l(e3);
}
var tu = /* @__PURE__ */ new WeakMap();
var nu = Ic(Nc, class {
  constructor(e3, t2, n2 = void 0) {
    let r2 = kr(Vn(e3)), i2 = Po(ko(t2)), a2 = eu(n2);
    ou(this, Mr(r2, i2, a2));
  }
  static from(e3, t2 = void 0) {
    return V(au(e3, t2));
  }
  static compare(e3, t2) {
    return pa(au(e3), au(t2));
  }
  get calendarId() {
    return Pe(H(this).calendar);
  }
  get timeZoneId() {
    return H(this).timeZone.id;
  }
  get epochMilliseconds() {
    return Fr(H(this));
  }
  get epochNanoseconds() {
    return Ir(H(this));
  }
  get offset() {
    return bo(L(H(this)).offsetNanoseconds);
  }
  get offsetNanoseconds() {
    return L(H(this)).offsetNanoseconds;
  }
  get hoursInDay() {
    return Wr(H(this));
  }
  with(e3, t2 = void 0) {
    return V(Ps(H(this), ju(e3), t2));
  }
  withCalendar(e3) {
    return V({ ...H(this), calendar: ed(e3) });
  }
  withTimeZone(e3) {
    return V({ ...H(this), timeZone: Po(su(e3)) });
  }
  withPlainTime(e3 = void 0) {
    return V(wc(H(this), Ru(e3)));
  }
  add(e3, t2 = void 0) {
    return V(mi(H(this), K(e3), t2));
  }
  subtract(e3, t2 = void 0) {
    return V(mi(H(this), R(K(e3)), t2));
  }
  until(e3, t2 = void 0) {
    let n2 = H(this), r2 = au(e3);
    return G(I(Di(0, Ci(n2.calendar, r2.calendar), n2, r2, t2)));
  }
  since(e3, t2 = void 0) {
    let n2 = H(this), r2 = au(e3);
    return G(I(Di(1, Ci(n2.calendar, r2.calendar), n2, r2, t2)));
  }
  round(e3) {
    let t2 = H(this), [n2, r2, i2] = yr(e3);
    return V(Ur(t2, n2, r2, i2));
  }
  startOfDay() {
    return V(Gr(H(this)));
  }
  equals(e3) {
    return ya(H(this), au(e3));
  }
  toInstant() {
    return uu(Us(H(this)));
  }
  toPlainDateTime() {
    return Hu(Ws(H(this)));
  }
  toPlainDate() {
    return Ju(Gs(H(this)));
  }
  toPlainTime() {
    return Pu(Ks(H(this)));
  }
  toLocaleString(e3 = void 0, t2 = {}) {
    let n2 = H(this), r2 = new Ja(e3, rc(vc(t2), Ti(n2)));
    return ic(r2, n2), r2.format(Fr(n2));
  }
  toString(e3 = void 0) {
    return ro(H(this), e3);
  }
  toJSON() {
    return ro(H(this));
  }
  getTimeZoneTransition(e3) {
    let t2 = H(this), n2 = si(t2, e3);
    return n2 ? V({ ...t2, epochNanoseconds: n2 }) : null;
  }
  valueOf() {
    return Bc();
  }
}, ru, Hc, Gc, nt);
function V(e3) {
  return ou(Object.create(nu.prototype), e3);
}
function H(e3) {
  return iu(e3) || zc();
}
function ru(e3) {
  let t2 = H(e3);
  return { ...L(t2), calendar: t2.calendar };
}
function iu(e3) {
  return tu.get(e3);
}
function au(e3, t2) {
  if (y(e3)) {
    let n2 = iu(e3);
    return n2 ? (br(t2), n2) : Uo(su, Qu(e3), e3, t2);
  }
  return $o(e3, $l, t2);
}
function ou(e3, t2) {
  return tu.set(e3, t2), Rc(e3), e3;
}
function su(e3) {
  if (y(e3)) {
    let t2 = iu(e3);
    return t2 || x(te(e3)), t2.timeZone.id;
  }
  return ((e4) => Ao(cs(M(e4))))(e3);
}
var cu = /* @__PURE__ */ new WeakMap();
var lu = Ic(Pc, class {
  constructor(e3) {
    let t2 = kr(Vn(e3));
    hu(this, jr(t2));
  }
  static from(e3) {
    return uu(pu(e3));
  }
  static fromEpochMilliseconds(e3) {
    return uu(ec(e3));
  }
  static fromEpochNanoseconds(e3) {
    return uu(tc(e3));
  }
  static compare(e3, t2) {
    return fa(pu(e3), pu(t2));
  }
  get epochMilliseconds() {
    return Fr(du(this));
  }
  get epochNanoseconds() {
    return Ir(du(this));
  }
  add(e3) {
    return uu(jr(pi(du(this).epochNanoseconds, K(e3))));
  }
  subtract(e3) {
    return uu(jr(pi(du(this).epochNanoseconds, R(K(e3)))));
  }
  until(e3, t2 = void 0) {
    return G(Ei(0, du(this), pu(e3), t2));
  }
  since(e3, t2 = void 0) {
    return G(Ei(1, du(this), pu(e3), t2));
  }
  round(e3) {
    let t2 = du(this), [n2, r2, i2] = yr(e3, 5, 1);
    return uu(jr(ei(t2.epochNanoseconds, Xr(n2, r2), i2)));
  }
  equals(e3) {
    return va(du(this), pu(e3));
  }
  toZonedDateTimeISO(e3) {
    return V(Hs(du(this), Po(su(e3))));
  }
  toLocaleString(e3 = void 0, t2 = {}) {
    let n2 = du(this);
    return new Ja(e3, _c(t2)).format(Fr(n2));
  }
  toString(e3 = void 0) {
    return no(su, du(this), e3);
  }
  toJSON() {
    return no(su, du(this));
  }
  valueOf() {
    return Bc();
  }
});
function uu(e3) {
  return hu(Object.create(lu.prototype), e3);
}
function du(e3) {
  return fu(e3) || zc();
}
function fu(e3) {
  return cu.get(e3);
}
function pu(e3) {
  if (y(e3)) {
    let t2 = fu(e3);
    if (t2) return t2;
    let n2 = iu(e3);
    if (n2) return jr(n2.epochNanoseconds);
  }
  return Zo(e3);
}
var { toTemporalInstant: mu } = { toTemporalInstant() {
  let e3 = Date.prototype.valueOf.call(this);
  return uu(jr(BigInt(Rn(e3)) * Ze));
} };
function hu(e3, t2) {
  return cu.set(e3, t2), Rc(e3), e3;
}
var gu = /* @__PURE__ */ new WeakMap();
var _u = Ic(kc, class {
  constructor(e3, t2, n2 = void 0, r2) {
    let i2 = s(e3), a2 = s(t2), o2 = eu(n2), c2 = Er(fn({ year: s(r2 ?? 1972), month: i2, day: a2 }));
    Su(this, F(c2, o2));
  }
  static from(e3, t2 = void 0) {
    return vu(xu(e3, t2));
  }
  get calendarId() {
    return Pe(yu(this).calendar);
  }
  with(e3, t2 = void 0) {
    return vu(Rs(yu(this), ju(e3), t2));
  }
  equals(e3) {
    return Ca(yu(this), xu(e3));
  }
  toPlainDate(e3) {
    return Ju(Xs(yu(this).calendar, this, e3));
  }
  toLocaleString(e3 = void 0, t2 = {}) {
    let n2 = yu(this), r2 = new Ja(e3, nc(Cc(t2)));
    return ic(r2, n2, 1), r2.format(Wt(n2));
  }
  toString(e3 = void 0) {
    return so(yu(this), e3);
  }
  toJSON() {
    return so(yu(this));
  }
  valueOf() {
    return Bc();
  }
}, yu, Uc);
function vu(e3) {
  return Su(Object.create(_u.prototype), e3);
}
function yu(e3) {
  return bu(e3) || zc();
}
function bu(e3) {
  return gu.get(e3);
}
function xu(e3, t2) {
  if (y(e3)) {
    let n3 = bu(e3);
    if (n3) return P(t2), n3;
    let r2 = $u(e3);
    return qo(r2 === void 0 ? void 0 : r2, r2 === void 0, e3, t2);
  }
  let n2 = is(e3, $l);
  return P(t2), n2;
}
function Su(e3, t2) {
  return gu.set(e3, t2), Rc(e3), e3;
}
var Cu = /* @__PURE__ */ new WeakMap();
var wu = Ic(Oc, class {
  constructor(e3, t2, n2 = void 0, r2) {
    let i2 = s(e3), a2 = s(t2), o2 = eu(n2), c2 = Tr(fn({ year: i2, month: a2, day: s(r2 ?? 1) }));
    ku(this, F(c2, o2));
  }
  static from(e3, t2 = void 0) {
    return Tu(Ou(e3, t2));
  }
  static compare(e3, t2) {
    return ga(Ou(e3), Ou(t2));
  }
  get calendarId() {
    return Pe(Eu(this).calendar);
  }
  with(e3, t2 = void 0) {
    return Tu(Ls(Eu(this), ju(e3), t2));
  }
  add(e3, t2 = void 0) {
    let n2 = Eu(this);
    return Tu(F(fi(0, n2.calendar, n2, K(e3), t2), n2.calendar));
  }
  subtract(e3, t2 = void 0) {
    let n2 = Eu(this);
    return Tu(F(fi(1, n2.calendar, n2, K(e3), t2), n2.calendar));
  }
  until(e3, t2 = void 0) {
    let n2 = Eu(this), r2 = Ou(e3);
    return G(Ai(0, Ci(n2.calendar, r2.calendar), n2, r2, t2));
  }
  since(e3, t2 = void 0) {
    let n2 = Eu(this), r2 = Ou(e3);
    return G(Ai(1, Ci(n2.calendar, r2.calendar), n2, r2, t2));
  }
  equals(e3) {
    return Sa(Eu(this), Ou(e3));
  }
  toPlainDate(e3) {
    return Ju(Ys(Eu(this).calendar, this, e3));
  }
  toLocaleString(e3 = void 0, t2 = {}) {
    let n2 = Eu(this), r2 = new Ja(e3, nc(Sc(t2)));
    return ic(r2, n2, 1), r2.format(Wt(n2));
  }
  toString(e3 = void 0) {
    return oo(Eu(this), e3);
  }
  toJSON() {
    return oo(Eu(this));
  }
  valueOf() {
    return Bc();
  }
}, Eu, Vc, Wc);
function Tu(e3) {
  return ku(Object.create(wu.prototype), e3);
}
function Eu(e3) {
  return Du(e3) || zc();
}
function Du(e3) {
  return Cu.get(e3);
}
function Ou(e3, t2) {
  if (y(e3)) {
    let n3 = Du(e3);
    return n3 ? (P(t2), n3) : Ko(Qu(e3), e3, t2);
  }
  let n2 = ns(e3, $l);
  return P(t2), n2;
}
function ku(e3, t2) {
  return Cu.set(e3, t2), Rc(e3), e3;
}
function Au(e3) {
  if (!y(e3)) return;
  let t2 = fu(e3);
  return t2 ? [Pc, t2] : (t2 = iu(e3), t2 ? [Nc, t2] : (t2 = Uu(e3), t2 ? [jc, t2] : (t2 = Yu(e3), t2 ? [Ac, t2] : (t2 = Iu(e3), t2 ? [Mc, t2] : (t2 = Du(e3), t2 ? [Oc, t2] : (t2 = bu(e3), t2 ? [kc, t2] : (t2 = id(e3), t2 ? [Fc, t2] : void 0)))))));
}
function ju(e3) {
  return (Au(e3) || e3.calendar !== void 0 || e3.timeZone !== void 0) && x(`Invalid bag`), e3;
}
var Mu = /* @__PURE__ */ new WeakMap();
var Nu = Ic(Mc, class {
  constructor(e3 = 0, t2 = 0, n2 = 0, r2 = 0, i2 = 0, a2 = 0) {
    zu(this, At(de(s, { hour: e3, minute: t2, second: n2, millisecond: r2, microsecond: i2, nanosecond: a2 })));
  }
  static from(e3, t2 = void 0) {
    return Pu(Lu(e3, t2));
  }
  static compare(e3, t2) {
    return _a(Lu(e3), Lu(t2));
  }
  with(e3, t2 = void 0) {
    return Pu(zs(Fu(this), ju(e3), t2));
  }
  add(e3) {
    return Pu(vi(Fu(this), K(e3))[0]);
  }
  subtract(e3) {
    return Pu(vi(Fu(this), R(K(e3)))[0]);
  }
  until(e3, t2 = void 0) {
    return G(Mi(0, Fu(this), Lu(e3), t2));
  }
  since(e3, t2 = void 0) {
    return G(Mi(1, Fu(this), Lu(e3), t2));
  }
  round(e3) {
    let t2 = Fu(this), [n2, r2, i2] = yr(e3, 5);
    return Pu(qr(t2, Yr(n2, r2), i2)[0]);
  }
  equals(e3) {
    return wa(Fu(this), Lu(e3));
  }
  toLocaleString(e3 = void 0, t2 = {}) {
    let n2 = Fu(this);
    return new Ja(e3, nc(xc(t2))).format(Pt(n2));
  }
  toString(e3 = void 0) {
    return lo(Fu(this), e3);
  }
  toJSON() {
    return lo(Fu(this));
  }
  valueOf() {
    return Bc();
  }
}, Fu, nt);
function Pu(e3) {
  return zu(Object.create(Nu.prototype), e3);
}
function Fu(e3) {
  return Iu(e3) || zc();
}
function Iu(e3) {
  return Mu.get(e3);
}
function Lu(e3, t2) {
  if (y(e3)) {
    let n3 = Iu(e3);
    if (n3) return P(t2), n3;
    let r2 = Uu(e3);
    if (r2) return P(t2), Pr(r2);
    let i2 = iu(e3);
    return i2 ? (P(t2), Ks(i2)) : Jo(e3, t2);
  }
  let n2 = as(e3);
  return P(t2), n2;
}
function Ru(e3) {
  return e3 === void 0 ? void 0 : Lu(e3);
}
function zu(e3, t2) {
  return Mu.set(e3, t2), Rc(e3), e3;
}
var Bu = /* @__PURE__ */ new WeakMap();
var Vu = Ic(jc, class {
  constructor(e3, t2, n2, r2 = 0, i2 = 0, a2 = 0, o2 = 0, c2 = 0, l2 = 0, u2 = void 0) {
    let d2 = Dr(dn(de(s, { year: e3, month: t2, day: n2, hour: r2, minute: i2, second: a2, millisecond: o2, microsecond: c2, nanosecond: l2 }))), f2 = eu(u2);
    Gu(this, Nr(d2, f2));
  }
  static from(e3, t2 = void 0) {
    return Hu(Wu(e3, t2));
  }
  static compare(e3, t2) {
    return ha(Wu(e3), Wu(t2));
  }
  get calendarId() {
    return Pe(U(this).calendar);
  }
  with(e3, t2 = void 0) {
    return Hu(Fs(U(this), ju(e3), t2));
  }
  withCalendar(e3) {
    return Hu(Nr(U(this), ed(e3)));
  }
  withPlainTime(e3 = void 0) {
    let t2 = U(this);
    return Hu(Ba(t2, Ru(e3), t2.calendar));
  }
  add(e3, t2 = void 0) {
    let n2 = U(this);
    return Hu(Nr(hi(n2.calendar, n2, K(e3), t2), n2.calendar));
  }
  subtract(e3, t2 = void 0) {
    let n2 = U(this);
    return Hu(Nr(hi(n2.calendar, n2, R(K(e3)), t2), n2.calendar));
  }
  until(e3, t2 = void 0) {
    let n2 = U(this), r2 = Wu(e3);
    return G(Oi(0, Ci(n2.calendar, r2.calendar), n2, r2, t2));
  }
  since(e3, t2 = void 0) {
    let n2 = U(this), r2 = Wu(e3);
    return G(Oi(1, Ci(n2.calendar, r2.calendar), n2, r2, t2));
  }
  round(e3) {
    let t2 = U(this), [n2, r2, i2] = yr(e3);
    return Hu(Nr(Kr(t2, Yr(n2, r2), i2), t2.calendar));
  }
  equals(e3) {
    return ba(U(this), Wu(e3));
  }
  toZonedDateTime(e3, t2 = void 0) {
    return V(qs(U(this), Po(su(e3)), t2));
  }
  toPlainDate() {
    let e3 = U(this);
    return Ju(F(e3, e3.calendar));
  }
  toPlainTime() {
    return Pu(Pr(U(this)));
  }
  toLocaleString(e3 = void 0, t2 = {}) {
    let n2 = U(this), r2 = new Ja(e3, nc(yc(t2)));
    return ic(r2, n2), r2.format(Ht(n2));
  }
  toString(e3 = void 0) {
    return io(U(this), e3);
  }
  toJSON() {
    return io(U(this));
  }
  valueOf() {
    return Bc();
  }
}, U, Hc, Gc, nt);
function Hu(e3) {
  return Gu(Object.create(Vu.prototype), e3);
}
function U(e3) {
  return Uu(e3) || zc();
}
function Uu(e3) {
  return Bu.get(e3);
}
function Wu(e3, t2) {
  if (y(e3)) {
    let n3 = Uu(e3);
    if (n3) return P(t2), n3;
    let r2 = Yu(e3);
    if (r2) return P(t2), Nr(N(r2, kt), r2.calendar);
    let i2 = iu(e3);
    return i2 ? (P(t2), Ws(i2)) : Wo(Qu(e3), e3, t2);
  }
  let n2 = es(e3, $l);
  return P(t2), n2;
}
function Gu(e3, t2) {
  return Bu.set(e3, t2), Rc(e3), e3;
}
var Ku = /* @__PURE__ */ new WeakMap();
var qu = Ic(Ac, class {
  constructor(e3, t2, n2, r2 = void 0) {
    let i2 = Er(fn(de(s, { year: e3, month: t2, day: n2 }))), a2 = eu(r2);
    Zu(this, F(i2, a2));
  }
  static from(e3, t2 = void 0) {
    return Ju(Xu(e3, t2));
  }
  static compare(e3, t2) {
    return ga(Xu(e3), Xu(t2));
  }
  get calendarId() {
    return Pe(W(this).calendar);
  }
  with(e3, t2 = void 0) {
    return Ju(Is(W(this), ju(e3), t2));
  }
  withCalendar(e3) {
    return Ju(F(W(this), ed(e3)));
  }
  add(e3, t2 = void 0) {
    let n2 = W(this);
    return Ju(F(gi(n2.calendar, n2, K(e3), t2), n2.calendar));
  }
  subtract(e3, t2 = void 0) {
    let n2 = W(this);
    return Ju(F(gi(n2.calendar, n2, R(K(e3)), t2), n2.calendar));
  }
  until(e3, t2 = void 0) {
    let n2 = W(this), r2 = Xu(e3);
    return G(ki(0, Ci(n2.calendar, r2.calendar), n2, r2, t2));
  }
  since(e3, t2 = void 0) {
    let n2 = W(this), r2 = Xu(e3);
    return G(ki(1, Ci(n2.calendar, r2.calendar), n2, r2, t2));
  }
  equals(e3) {
    return xa(W(this), Xu(e3));
  }
  toZonedDateTime(e3) {
    let t2 = y(e3) ? { timeZone: e3.timeZone, plainTime: e3.plainTime } : { timeZone: e3 };
    return V(Js(su, Lu, W(this), t2));
  }
  toPlainDateTime(e3 = void 0) {
    let t2 = W(this);
    return Hu(Ba(t2, Ru(e3), t2.calendar));
  }
  toPlainYearMonth() {
    return Tu(Qs(W(this).calendar, this));
  }
  toPlainMonthDay() {
    return vu(Zs(W(this).calendar, this));
  }
  toLocaleString(e3 = void 0, t2 = {}) {
    let n2 = W(this), r2 = new Ja(e3, nc(bc(t2)));
    return ic(r2, n2), r2.format(Wt(n2));
  }
  toString(e3 = void 0) {
    return ao(W(this), e3);
  }
  toJSON() {
    return ao(W(this));
  }
  valueOf() {
    return Bc();
  }
}, W, Hc, Gc);
function Ju(e3) {
  return Zu(Object.create(qu.prototype), e3);
}
function W(e3) {
  return Yu(e3) || zc();
}
function Yu(e3) {
  return Ku.get(e3);
}
function Xu(e3, t2) {
  if (y(e3)) {
    let n3 = Yu(e3);
    if (n3) return P(t2), n3;
    let r2 = Uu(e3);
    if (r2) return P(t2), F(r2, r2.calendar);
    let i2 = iu(e3);
    return i2 ? (P(t2), Gs(i2)) : Go(Qu(e3), e3, t2);
  }
  let n2 = ts(e3, $l);
  return P(t2), n2;
}
function Zu(e3, t2) {
  return Ku.set(e3, t2), Rc(e3), e3;
}
function Qu(e3) {
  let t2 = $u(e3);
  return t2 === void 0 ? void 0 : t2;
}
function $u(e3) {
  let { calendar: t2 } = e3;
  if (t2 !== void 0) return ed(t2);
}
function ed(e3) {
  if (y(e3)) {
    let t2 = Yu(e3) || Uu(e3) || iu(e3) || bu(e3) || Du(e3);
    return t2 || x(ee(e3)), t2.calendar;
  }
  return ((e4) => $l(ss(M(e4))))(e3);
}
var td = /* @__PURE__ */ new WeakMap();
var nd = Ic(Fc, class {
  constructor(e3 = 0, t2 = 0, n2 = 0, r2 = 0, i2 = 0, a2 = 0, o2 = 0, s2 = 0, c2 = 0, l2 = 0) {
    let u2 = ra(de(Hn, { years: e3, months: t2, weeks: n2, days: r2, hours: i2, minutes: a2, seconds: o2, milliseconds: s2, microseconds: c2, nanoseconds: l2 }));
    od(this, I(u2));
  }
  static from(e3) {
    return G(K(e3));
  }
  static compare(e3, t2, n2 = void 0) {
    return ma(ad, K(e3), K(t2), n2);
  }
  get sign() {
    return rd(this).sign;
  }
  get blank() {
    return !rd(this).sign;
  }
  with(e3) {
    return G(Bs(rd(this), e3));
  }
  negated() {
    return G(ta(rd(this)));
  }
  abs() {
    return G(ea(rd(this)));
  }
  add(e3, t2 = void 0) {
    return G(Zi(ad, 0, rd(this), K(e3), t2));
  }
  subtract(e3, t2 = void 0) {
    return G(Zi(ad, 1, rd(this), K(e3), t2));
  }
  round(e3) {
    return G($i(ad, rd(this), e3));
  }
  total(e3) {
    return Lr(ad, rd(this), e3);
  }
  toLocaleString(e3 = void 0, t2) {
    let n2 = rd(this);
    return Intl.DurationFormat ? new Intl.DurationFormat(e3, t2).format(n2) : uo(n2, t2);
  }
  toString(e3 = void 0) {
    return uo(rd(this), e3);
  }
  toJSON() {
    return uo(rd(this));
  }
  valueOf() {
    return Bc();
  }
}, rd, On);
function G(e3) {
  return od(Object.create(nd.prototype), e3);
}
function rd(e3) {
  return id(e3) || zc();
}
function id(e3) {
  return td.get(e3);
}
function K(e3) {
  return y(e3) ? id(e3) || Yo(e3) : os(e3);
}
function ad(e3) {
  if (e3 !== void 0) {
    if (y(e3)) {
      let t2 = iu(e3);
      if (t2) return t2;
      let n2 = Yu(e3);
      if (n2) return n2;
      let r2 = Uu(e3);
      return r2 ? F(r2, r2.calendar) : Ho(su, Qu(e3), e3);
    }
    return Qo(e3, $l);
  }
}
function od(e3, t2) {
  return td.set(e3, t2), Rc(e3), e3;
}
var sd = Object.defineProperties({}, { ...ue(`Temporal.Now`), ...le({ timeZoneId() {
  return Dc();
}, instant() {
  return uu(jr(Ec()));
}, zonedDateTimeISO(e3 = Dc()) {
  let t2 = Po(su(e3));
  return V(Mr(Ec(), t2));
}, plainDateTimeISO(e3 = Dc()) {
  return Hu(Nr(Tc(Po(su(e3)))));
}, plainDateISO(e3 = Dc()) {
  return Ju(F(Tc(Po(su(e3)))));
}, plainTimeISO(e3 = Dc()) {
  return Pu(Pr(Tc(Po(su(e3)))));
} }) });
var cd = Object.defineProperties({}, { ...ue(`Temporal`), ...le({ PlainYearMonth: wu, PlainMonthDay: _u, PlainDate: qu, PlainTime: Nu, PlainDateTime: Vu, ZonedDateTime: nu, Instant: lu, Duration: nd, Now: sd }) });
var q = globalThis.Temporal ?? cd;
var ld = q !== cd;
var ud = 1e3;
var dd = 864e5;
180 * dd;
var fd = 400 * dd;
var pd = 30 * 36e5;
var md = 864e13;
function hd(e3) {
  if (e3 === `UTC` || e3 === `Etc/UTC` || e3 === `Etc/GMT`) return 0;
  let t2 = /^([+-])(\d{2}):?(\d{2})(?::?(\d{2}))?$/.exec(e3);
  return t2 ? (t2[1] === `-` ? -1 : 1) * ((Number(t2[2]) * 60 + Number(t2[3])) * 60 + Number(t2[4] ?? 0)) * ud : null;
}
var gd = class {
  constructor(e3) {
    this.tzid = e3, this.transitions = [], this.offsets = [], this.coverStart = 0, this.coverEnd = 0, this.covered = false, this.fixedOffsetMs = hd(e3);
  }
  zonedAt(e3) {
    return new q.ZonedDateTime(BigInt(e3) * 1000000n, this.tzid);
  }
  ensureCoverage(e3, t2) {
    if (this.fixedOffsetMs !== null || this.covered && e3 >= this.coverStart && t2 <= this.coverEnd) return;
    let n2 = !this.covered || e3 < this.coverStart ? e3 - fd : this.coverStart, r2 = !this.covered || t2 > this.coverEnd ? t2 + fd : this.coverEnd;
    if (n2 = Math.max(n2, Math.min(e3, -md)), r2 = Math.min(r2, Math.max(t2, md)), n2 = Math.floor(n2 / ud) * ud, r2 = Math.ceil(r2 / ud) * ud, this.covered) {
      if (n2 < this.coverStart) {
        let e4 = this.scan(n2, this.coverStart);
        this.transitions = e4.transitions.concat(this.transitions), this.offsets = e4.offsets.concat(this.offsets.slice(1));
      }
      if (r2 > this.coverEnd) {
        let e4 = this.scan(this.coverEnd, r2);
        this.transitions = this.transitions.concat(e4.transitions), this.offsets = this.offsets.concat(e4.offsets.slice(1));
      }
    } else {
      let e4 = this.scan(n2, r2);
      this.transitions = e4.transitions, this.offsets = e4.offsets;
    }
    this.coverStart = n2, this.coverEnd = r2, this.covered = true;
  }
  scan(e3, t2) {
    let n2 = this.zonedAt(e3), r2 = [], i2 = [n2.offsetNanoseconds / 1e6];
    for (; ; ) {
      let e4 = n2.getTimeZoneTransition(`next`);
      if (e4) {
        if (e4.epochMilliseconds > t2) break;
        r2.push(e4.epochMilliseconds), i2.push(e4.offsetNanoseconds / 1e6), n2 = e4;
        continue;
      }
      if (ld) break;
      let a2 = Math.ceil((Math.max(n2.epochMilliseconds, Date.now()) + 15552e6) / ud) * ud;
      if (a2 >= t2 || a2 > md) break;
      let o2 = this.zonedAt(a2), s2 = i2[i2.length - 1];
      if (o2.offsetNanoseconds / 1e6 !== s2) {
        let e5 = n2.epochMilliseconds, t3 = a2;
        for (; t3 - e5 > ud; ) {
          let n3 = e5 + Math.floor((t3 - e5) / 2 / ud) * ud;
          n3 <= e5 && (n3 = e5 + ud), this.zonedAt(n3).offsetNanoseconds / 1e6 === s2 ? e5 = n3 : t3 = n3;
        }
        r2.push(t3), i2.push(this.zonedAt(t3).offsetNanoseconds / 1e6);
      }
      n2 = o2;
    }
    return { transitions: r2, offsets: i2 };
  }
  offsetMsAt(e3) {
    if (this.fixedOffsetMs !== null) return this.fixedOffsetMs;
    this.ensureCoverage(e3, e3);
    let t2 = this.transitions, n2 = 0, r2 = t2.length;
    for (; n2 < r2; ) {
      let i2 = n2 + r2 >> 1;
      t2[i2] <= e3 ? n2 = i2 + 1 : r2 = i2;
    }
    return this.offsets[n2];
  }
  nextTransitionAfter(e3, t2) {
    if (this.fixedOffsetMs !== null) return;
    this.ensureCoverage(e3, t2);
    let n2 = this.transitions, r2 = 0, i2 = n2.length;
    for (; r2 < i2; ) {
      let t3 = r2 + i2 >> 1;
      n2[t3] <= e3 ? r2 = t3 + 1 : i2 = t3;
    }
    let a2 = n2[r2];
    return a2 !== void 0 && a2 <= t2 ? a2 : void 0;
  }
  epochMsForWall(e3) {
    if (this.fixedOffsetMs !== null) return { epochMs: e3 - this.fixedOffsetMs, pushed: false };
    this.ensureCoverage(e3 - pd, e3 + pd);
    let t2 = this.offsetMsAt(e3 - pd), n2 = e3 - t2;
    if (this.offsetMsAt(n2) === t2) return { epochMs: n2, pushed: false };
    let r2 = this.offsetMsAt(e3 + pd), i2 = e3 - r2;
    return this.offsetMsAt(i2) === r2 ? { epochMs: i2, pushed: false } : { epochMs: n2, pushed: true };
  }
  timeOfDayMayHitGap(e3, t2, n2) {
    if (this.fixedOffsetMs !== null) return false;
    this.ensureCoverage(t2, n2);
    let r2 = this.transitions, i2 = 0, a2 = r2.length;
    for (; i2 < a2; ) {
      let e4 = i2 + a2 >> 1;
      r2[e4] < t2 ? i2 = e4 + 1 : a2 = e4;
    }
    for (let t3 = i2; t3 < r2.length && r2[t3] <= n2; t3++) {
      let n3 = r2[t3], i3 = this.offsets[t3], a3 = this.offsets[t3 + 1] - i3;
      if (a3 <= 0) continue;
      let o2 = e3 - ((n3 + i3) % dd + dd) % dd;
      if (o2 >= 0 ? o2 < a3 : o2 + dd < a3) return true;
    }
    return false;
  }
};
var _d = /* @__PURE__ */ new Map();
function vd(e3) {
  let t2 = _d.get(e3);
  return t2 || (t2 = new gd(e3), _d.set(e3, t2)), t2;
}
var yd = [`YEARLY`, `MONTHLY`, `WEEKLY`, `DAILY`, `HOURLY`, `MINUTELY`, `SECONDLY`];
var bd = [`MO`, `TU`, `WE`, `TH`, `FR`, `SA`, `SU`];
var J = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 };
var xd = new Set(yd);
var Sd = new Set(bd);
var Cd = RegExp(`^([+-]?\\d{1,2})?(${bd.join(`|`)})$`);
var wd = RegExp(`(${bd.join(`|`)})$`);
var Td = 1e3;
var Ed = 60 * Td;
var Dd = 60 * Ed;
var Y = 24 * Dd;
var Od = 7 * Y;
var kd = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var Ad = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
var X = BigInt(1e6);
var jd = BigInt(1e9);
var Md = BigInt(60) * jd;
var Nd = BigInt(60) * Md;
var Pd = BigInt(24) * Nd;
var Fd = BigInt(7) * Pd;
var Id = 864e13;
var Ld = 1e3;
function Rd(e3, t2) {
  let n2 = Math.abs(e3), r2 = Math.abs(t2);
  for (; r2 !== 0; ) {
    let e4 = n2 % r2;
    n2 = r2, r2 = e4;
  }
  return n2;
}
function zd(e3) {
  for (let t2 = 1; t2 < e3.length; t2++) if (!(e3[t2] > e3[t2 - 1])) return false;
  return true;
}
function Bd(e3) {
  let t2 = 0;
  for (let n2 of e3 ?? []) t2 |= 1 << n2 - 1;
  return t2;
}
function Vd(e3, t2) {
  return e3 === 0 || (e3 & 1 << t2 - 1) != 0;
}
function Hd(e3, t2) {
  let n2 = e3 / t2;
  return e3 % t2 < 0n ? n2 - 1n : n2;
}
function Ud(e3, t2) {
  return -Hd(-e3, t2);
}
function Wd(e3, t2) {
  return Number(t2 ? Hd(e3, X) + 1n : Ud(e3, X));
}
function Gd(e3, t2) {
  return Number(t2 ? Ud(e3, X) - 1n : Hd(e3, X));
}
function Z(e3) {
  return Number.isSafeInteger(e3) && e3 >= -Id && e3 <= Id;
}
function Kd(e3, t2, n2) {
  let r2 = e3 - (t2 <= 2 ? 1 : 0), i2 = Math.floor(r2 / 400), a2 = r2 - i2 * 400, o2 = t2 + (t2 > 2 ? -3 : 9), s2 = Math.floor((153 * o2 + 2) / 5) + n2 - 1, c2 = a2 * 365 + Math.floor(a2 / 4) - Math.floor(a2 / 100) + s2;
  return i2 * 146097 + c2 - 719468;
}
function qd(e3) {
  let t2 = e3 + 719468, n2 = Math.floor(t2 / 146097), r2 = t2 - n2 * 146097, i2 = Math.floor((r2 - Math.floor(r2 / 1460) + Math.floor(r2 / 36524) - Math.floor(r2 / 146096)) / 365), a2 = r2 - (365 * i2 + Math.floor(i2 / 4) - Math.floor(i2 / 100)), o2 = Math.floor((5 * a2 + 2) / 153), s2 = o2 + (o2 < 10 ? 3 : -9);
  return { year: i2 + n2 * 400 + (s2 <= 2 ? 1 : 0), month: s2 };
}
function Jd(e3) {
  return ((e3 + 3) % 7 + 7) % 7 + 1;
}
function Q(e3, t2) {
  return (e3 - 1 + t2 % 7 + 7) % 7 + 1;
}
function $(e3) {
  let t2 = e3.toUpperCase().match(wd)?.[1];
  return !t2 || !Sd.has(t2) ? null : t2;
}
function Yd(e3) {
  let t2 = e3.toUpperCase().match(Cd);
  if (!t2) return null;
  let n2 = t2[1] ? parseInt(t2[1], 10) : 0, r2 = t2[2];
  return !r2 || !Sd.has(r2) ? null : { ord: n2, weekday: r2 };
}
function Xd(e3) {
  return typeof e3 == `object` && !!e3 && typeof e3.timeZoneId == `string` && typeof e3.toString == `function`;
}
function Zd(e3) {
  let t2 = e3.epochNanoseconds;
  return typeof t2 == `bigint` ? t2 : void 0;
}
function Qd(e3, t2) {
  if (!Xd(e3)) throw Error(`${t2} must be a ZonedDateTime`);
  if (e3 instanceof q.ZonedDateTime) return e3;
  try {
    let t3 = Zd(e3);
    if (t3 !== void 0) {
      let n2 = e3.calendarId;
      return new q.ZonedDateTime(t3, e3.timeZoneId, typeof n2 == `string` ? n2 : `iso8601`);
    }
    return q.ZonedDateTime.from(e3.toString());
  } catch {
    throw Error(`${t2} must be a ZonedDateTime`);
  }
}
function $d(e3, t2) {
  if (e3 instanceof Date) {
    let t3 = e3.getTime();
    return Number.isFinite(t3) || e3.toISOString(), BigInt(t3) * X;
  }
  if (!Xd(e3)) throw Error(`${t2} must be a ZonedDateTime`);
  return Zd(e3) ?? Qd(e3, t2).epochNanoseconds;
}
function ef(e3, t2) {
  if (e3?.length) return e3.map((e4) => Qd(e4, t2));
}
function tf(e3) {
  return typeof e3.rruleString == `string`;
}
function nf(e3, t2) {
  let n2 = [...e3 ?? [], ...ef(t2, `Manual date`) ?? []];
  return n2.length > 0 ? n2 : void 0;
}
function rf(e3) {
  return e3.replace(/\r?\n[ \t]/g, ``);
}
function af(e3, t2, n2) {
  let r2 = n2 === `DATE` || !e3.includes(`T`), i2 = `${e3.slice(0, 4)}-${e3.slice(4, 6)}-${e3.slice(6, 8)}`;
  if (r2) return q.PlainDate.from(i2).toZonedDateTime({ timeZone: t2 });
  if (e3.endsWith(`Z`)) {
    let n3 = `${i2}T${e3.slice(9, 15)}Z`;
    return q.Instant.from(n3).toZonedDateTimeISO(t2 || `UTC`);
  } else {
    let n3 = `${i2}T${e3.slice(9)}`;
    return q.PlainDateTime.from(n3).toZonedDateTime(t2);
  }
}
function of(e3, t2, n2) {
  let r2 = [];
  for (let i2 of e3) {
    let e4 = sf(i2, t2);
    if (!e4) continue;
    let a2 = e4.tzid || n2, o2 = e4.value.split(`,`);
    r2.push(...o2.map((t3) => af(t3, a2, e4.valueType)));
  }
  return r2;
}
function sf(e3, t2) {
  let n2 = e3.indexOf(`:`);
  if (n2 === -1) return null;
  let r2 = e3.slice(0, n2), i2 = e3.slice(n2 + 1), [a2, ...o2] = r2.split(`;`);
  if (a2?.toUpperCase() !== t2) return null;
  let s2, c2;
  for (let e4 of o2) {
    let t3 = e4.indexOf(`=`);
    if (t3 === -1) continue;
    let n3 = e4.slice(0, t3).toUpperCase(), r3 = e4.slice(t3 + 1), i3 = r3.startsWith(`"`) && r3.endsWith(`"`) ? r3.slice(1, -1) : r3;
    n3 === `VALUE` ? s2 = i3.toUpperCase() : n3 === `TZID` && (c2 = i3);
  }
  return { valueType: s2, tzid: c2, value: i2 };
}
function cf(e3, t2, n2) {
  let r2 = e3.trim();
  if (n2 && !/^[+-]?\d+$/.test(r2)) throw Error(`Invalid ${t2} value: ${e3}`);
  return parseInt(r2, 10);
}
function lf(e3, t2 = false, n2 = false, r2 = `number`) {
  let i2 = e3.split(`,`).map((e4) => cf(e4, r2, n2));
  return t2 ? i2.sort((e4, t3) => e4 - t3) : i2;
}
function uf(e3, t2 = false) {
  return e3.split(`,`).map((e4) => {
    let n2 = e4.trim();
    if (/^\d+L$/i.test(n2)) return n2.toUpperCase();
    let r2 = cf(n2, `BYMONTH`, t2);
    return /^M\d{2}L?$/i.test(n2) ? n2 : r2;
  });
}
function df(e3, t2, n2, r2 = false) {
  let i2 = rf(e3).trim(), a2, o2 = t2, s2 = `DATE-TIME`, c2 = false, l2 = false, u2, d2 = [], f2 = [];
  if (/^DTSTART/im.test(i2)) {
    let e4 = i2.split(/\s+/), n3 = e4.find((e5) => e5.match(/^DTSTART/i)), r3 = e4.find((e5) => e5.match(/^RRULE:/i)), p3 = e4.filter((e5) => e5.match(/^EXDATE/i)), m3 = e4.filter((e5) => e5.match(/^RDATE/i)), h3 = sf(n3, `DTSTART`);
    if (!h3) throw Error(`Invalid DTSTART in ICS snippet`);
    let { valueType: g2, tzid: _2, value: v2 } = h3;
    s2 = (g2 || (v2?.includes(`T`) ? `DATE-TIME` : `DATE`)).toUpperCase() === `DATE` ? `DATE` : `DATE-TIME`, c2 = !!_2, l2 = !!v2?.endsWith(`Z`), a2 = af(v2, _2 ?? t2 ?? o2 ?? `UTC`, s2), o2 = _2 ?? a2.timeZoneId ?? t2 ?? o2 ?? `UTC`, u2 = r3, d2 = of(p3, `EXDATE`, o2 ?? `UTC`), f2 = of(m3, `RDATE`, o2 ?? `UTC`);
  } else a2 = n2 ? Qd(n2, `dtstart`) : void 0, u2 = i2, a2 && (o2 = a2.timeZoneId, s2 = `DATE-TIME`, c2 = true, l2 = a2.timeZoneId === `UTC`);
  let p2 = u2 ? u2.replace(/^RRULE:/i, ``).split(`;`) : [], m2 = { dtstart: a2, tzid: o2, exDate: d2.length > 0 ? d2 : void 0, rDate: f2.length > 0 ? f2 : void 0 }, h2;
  for (let e4 of p2) {
    let [t3, n3] = e4.split(`=`);
    if (t3) switch (t3.toUpperCase()) {
      case `RSCALE`:
        n3 && (m2.rscale = n3.toUpperCase(), h2 && !m2.skip && (m2.skip = h2, h2 = void 0));
        break;
      case `SKIP`: {
        let e5 = (n3 || ``).toUpperCase();
        if (![`OMIT`, `BACKWARD`, `FORWARD`].includes(e5)) throw Error(`Invalid SKIP value: ${n3}`);
        m2.rscale ? m2.skip = e5 : h2 = e5;
        break;
      }
      case `FREQ`:
        m2.freq = n3.toUpperCase();
        break;
      case `INTERVAL`:
        m2.interval = cf(n3, `INTERVAL`, r2);
        break;
      case `COUNT`:
        if (!r2 && /^\+?infinity$/i.test(n3.trim())) break;
        m2.count = cf(n3, `COUNT`, r2);
        break;
      case `UNTIL`: {
        let e5 = n3.includes(`T`);
        if (s2 === `DATE`) {
          if (e5) throw Error(`UNTIL rule part MUST have the same value type as DTSTART`);
          m2.until = af(n3, o2 || `UTC`, `DATE`);
          break;
        }
        if (!e5) {
          if (r2) throw Error(`UNTIL rule part MUST have the same value type as DTSTART`);
          let e6 = af(n3, o2 || `UTC`, `DATE`).with({ hour: 23, minute: 59, second: 59, millisecond: 0, microsecond: 0, nanosecond: 0 });
          m2.until = c2 || l2 ? e6.withTimeZone(`UTC`) : e6;
          break;
        }
        if ((c2 || l2) && !n3.endsWith(`Z`)) throw Error(`UNTIL rule part MUST always be specified as a date with UTC time`);
        m2.until = af(n3, o2 || `UTC`, `DATE-TIME`);
        break;
      }
      case `BYHOUR`:
        m2.byHour = lf(n3, true, r2, `BYHOUR`);
        break;
      case `BYMINUTE`:
        m2.byMinute = lf(n3, true, r2, `BYMINUTE`);
        break;
      case `BYSECOND`:
        m2.bySecond = lf(n3, true, r2, `BYSECOND`);
        break;
      case `BYDAY`:
        m2.byDay = n3.split(`,`).map((e5) => e5.toUpperCase());
        break;
      case `BYMONTH`:
        m2.byMonth = uf(n3, r2);
        break;
      case `BYMONTHDAY`:
        m2.byMonthDay = lf(n3, false, r2, `BYMONTHDAY`);
        break;
      case `BYYEARDAY`:
        m2.byYearDay = lf(n3, false, r2, `BYYEARDAY`);
        break;
      case `BYWEEKNO`:
        m2.byWeekNo = lf(n3, false, r2, `BYWEEKNO`);
        break;
      case `BYSETPOS`:
        m2.bySetPos = lf(n3, false, r2, `BYSETPOS`);
        break;
      case `WKST`:
        m2.wkst = n3?.toUpperCase();
        break;
    }
  }
  if (h2 && !m2.rscale) throw Error(`SKIP MUST NOT be present unless RSCALE is present`);
  return h2 && m2.rscale && !m2.skip && (m2.skip = h2), m2;
}
var ff = class e2 {
  static {
    this.rscaleCalendarSupport = {};
  }
  static normalizeToPolyfill(e3) {
    return Qd(e3, `Date`);
  }
  toPublicDate(e3) {
    if (!e3) return null;
    let t2 = this.outputTemporal?.ZonedDateTime;
    if (!t2 || t2 === q.ZonedDateTime) return e3;
    if (this.outputConstructorFastPathAvailable !== false) try {
      let n2 = new t2(e3.epochNanoseconds, e3.timeZoneId, e3.calendarId);
      return this.outputConstructorFastPathAvailable = true, n2;
    } catch {
      this.outputConstructorFastPathAvailable = false;
    }
    return t2.from(e3.toString());
  }
  toPublicDates(e3) {
    return !this.outputTemporal || this.outputTemporal.ZonedDateTime === q.ZonedDateTime ? e3 : e3.map((e4) => this.toPublicDate(e4));
  }
  constructor(t2) {
    this.outputTemporal = t2.temporal;
    let n2;
    if (tf(t2)) {
      let r2 = df(t2.rruleString, t2.tzid, t2.dtstart, t2.strict ?? false);
      if (!r2.dtstart) throw Error(`dtstart is required - provide it either in rruleString or as a separate parameter`);
      let i2 = e2.normalizeToPolyfill(r2.dtstart);
      this.tzid = r2.tzid ?? t2.tzid ?? `UTC`, this.originalDtstart = i2, n2 = { ...r2, dtstart: i2, rDate: nf(r2.rDate, t2.rDate), exDate: nf(r2.exDate, t2.exDate), count: t2.count ?? r2.count, until: t2.until ? e2.normalizeToPolyfill(t2.until) : r2.until, strict: t2.strict, maxIterations: t2.maxIterations, maxCandidateEvaluations: t2.maxCandidateEvaluations, includeDtstart: t2.includeDtstart, cache: t2.cache, temporal: t2.temporal, tzid: this.tzid };
    } else {
      let e3 = Qd(t2.dtstart, `Manual dtstart`);
      n2 = { ...t2, dtstart: e3, until: t2.until ? Qd(t2.until, `Manual until`) : void 0, rDate: ef(t2.rDate, `Manual rDate`), exDate: ef(t2.exDate, `Manual exDate`) }, n2.tzid = n2.tzid || e3.timeZoneId, this.tzid = n2.tzid, this.originalDtstart = e3;
    }
    if (!n2.freq) throw Error(`RRULE must include FREQ`);
    if (n2.interval = n2.interval ?? 1, !(n2.interval > 0)) throw Error(`Cannot create RRule: interval must be greater than 0`);
    if (!Number.isInteger(Number(n2.interval))) throw Error(`Cannot create RRule: interval must be an integer`);
    if (n2.count === null && (n2.count = void 0), n2.count !== void 0 && Number.isNaN(Number(n2.count))) throw Error(`Cannot create RRule: count must be a number`);
    if (this.opts = this.sanitizeOpts(n2), this.maxIterations = n2.maxIterations ?? 1e4, this.maxCandidateEvaluations = n2.maxCandidateEvaluations ?? 1e6, !Number.isSafeInteger(this.maxCandidateEvaluations) || this.maxCandidateEvaluations <= 0) throw Error(`maxCandidateEvaluations must be a positive safe integer`);
    this.includeDtstart = n2.includeDtstart ?? false, this.parsedByDayTokens = this.buildParsedByDayTokens(this.opts.byDay), this.simpleByDayIsoDays = this.buildByDayIsoDays(this.parsedByDayTokens, false), this.allByDayIsoDays = this.buildByDayIsoDays(this.parsedByDayTokens, true), this.hasOrdinalByDay = this.parsedByDayTokens?.some((e3) => e3.ord !== 0) ?? false, this.canUseEpochMillisecondsPrecisionFlag = this.originalDtstart.microsecond === 0 && this.originalDtstart.nanosecond === 0 && (!this.opts.until || this.opts.until.microsecond === 0 && this.opts.until.nanosecond === 0), this.timeSlotOffsetsMs = this.buildTimeSlotOffsetsMs(), this.hasUniqueTimeSlotOffsets = this.timeSlotOffsetsMs === void 0 || new Set(this.timeSlotOffsetsMs).size === this.timeSlotOffsetsMs.length, this.numericByMonths = this.opts.byMonth?.filter((e3) => typeof e3 == `number`);
  }
  buildParsedByDayTokens(e3) {
    if (!e3?.length) return;
    let t2 = e3.map((e4) => {
      let t3 = Yd(e4);
      return t3 ? { ord: t3.ord, weekday: t3.weekday, isoDay: J[t3.weekday] } : null;
    }).filter((e4) => e4 !== null);
    return t2.length > 0 ? t2 : void 0;
  }
  buildByDayIsoDays(e3, t2) {
    if (!e3?.length) return;
    let n2 = e3.filter((e4) => t2 || e4.ord === 0).map((e4) => e4.isoDay);
    if (n2.length) return [...new Set(n2)].sort((e4, t3) => e4 - t3);
  }
  sanitizeNumericArray(e3, t2, n2, r2 = false, i2 = false) {
    if (!e3) return;
    let a2 = [], o2 = /* @__PURE__ */ new Set();
    for (let i3 of e3) Number.isInteger(i3) && i3 >= t2 && i3 <= n2 && (r2 || i3 !== 0) && !o2.has(i3) && (o2.add(i3), a2.push(i3));
    if (a2.length !== 0) return i2 ? a2.sort((e4, t3) => e4 - t3) : a2;
  }
  sanitizeByDay(e3) {
    let t2 = [], n2 = /* @__PURE__ */ new Set();
    for (let r2 of e3 ?? []) {
      if (!r2 || typeof r2 != `string`) continue;
      let e4 = r2.toUpperCase(), i2 = Yd(e4);
      if (!i2 || i2.ord === 0 && /^[+-]?\d/.test(e4)) throw Error(`Invalid BYDAY value: ${r2}`);
      n2.has(e4) || (n2.add(e4), t2.push(e4));
    }
    return t2.length > 0 ? t2 : void 0;
  }
  enforceStrictRfc(e3) {
    if (!e3.strict) return;
    let t2 = e3.freq;
    if (e3.count !== void 0 && e3.until !== void 0) throw Error(`COUNT and UNTIL MUST NOT occur in the same recurrence rule`);
    if (e3.byWeekNo && t2 !== `YEARLY`) throw Error(`BYWEEKNO MUST NOT be used unless FREQ=YEARLY`);
    if (e3.byYearDay && [`DAILY`, `WEEKLY`, `MONTHLY`].includes(t2)) throw Error(`BYYEARDAY MUST NOT be used when FREQ is DAILY, WEEKLY, or MONTHLY`);
    if (e3.byMonthDay && t2 === `WEEKLY`) throw Error(`BYMONTHDAY MUST NOT be used when FREQ is WEEKLY`);
    let n2 = (e3.byDay ?? []).some((e4) => /^[+-]?\d/.test(e4));
    if (n2 && ![`MONTHLY`, `YEARLY`].includes(t2)) throw Error(`BYDAY with numeric value MUST NOT be used unless FREQ is MONTHLY or YEARLY`);
    if (n2 && t2 === `YEARLY` && e3.byWeekNo) throw Error(`BYDAY with numeric value MUST NOT be used with FREQ=YEARLY when BYWEEKNO is present`);
    let r2 = !!(e3.byDay || e3.byMonth || e3.byMonthDay || e3.byYearDay || e3.byWeekNo || e3.byHour || e3.byMinute || e3.bySecond);
    if (e3.bySetPos && !r2) throw Error(`BYSETPOS MUST be used with another BYxxx rule part`);
  }
  sanitizeOpts(e3) {
    if (!xd.has(e3.freq)) throw Error(`Invalid FREQ value: ${e3.freq}`);
    if (e3.byDay = this.sanitizeByDay(e3.byDay), e3.wkst) {
      let t2 = e3.wkst.toUpperCase();
      if (!Sd.has(t2)) throw Error(`Invalid WKST value: ${e3.wkst}`);
      e3.wkst = t2;
    }
    if (e3.byMonth) {
      let t2 = e3.byMonth.filter((e4) => typeof e4 == `number`), n2 = e3.byMonth.filter((e4) => typeof e4 == `string`).map((e4) => e4.toUpperCase()), r2 = this.sanitizeNumericArray(t2, 1, 12, false, false) ?? [], i2 = [.../* @__PURE__ */ new Set([...r2, ...n2])];
      e3.byMonth = i2.length > 0 ? i2 : void 0;
    }
    if (e3.rscale && !e3.skip && (e3.skip = `OMIT`), e3.byMonthDay = this.sanitizeNumericArray(e3.byMonthDay, -31, 31, false, false), e3.byYearDay = this.sanitizeNumericArray(e3.byYearDay, -366, 366, false, false), e3.byWeekNo = this.sanitizeNumericArray(e3.byWeekNo, -53, 53, false, false), e3.byHour = this.sanitizeNumericArray(e3.byHour, 0, 23, true, true), e3.byMinute = this.sanitizeNumericArray(e3.byMinute, 0, 59, true, true), e3.bySecond = this.sanitizeNumericArray(e3.bySecond, 0, 59, true, true), e3.bySetPos) {
      if (e3.bySetPos.some((e4) => e4 === 0)) throw Error(`bySetPos may not contain 0`);
      e3.bySetPos = this.sanitizeNumericArray(e3.bySetPos, -1 / 0, 1 / 0, false, false);
    }
    return this.enforceStrictRfc(e3), e3;
  }
  rawAdvance(e3) {
    let { freq: t2, interval: n2 } = this.opts;
    switch (t2) {
      case `DAILY`:
        return e3.add({ days: n2 });
      case `WEEKLY`:
        return e3.add({ weeks: n2 });
      case `MONTHLY`:
        return e3.add({ months: n2 });
      case `YEARLY`:
        return e3.add({ years: n2 });
      case `HOURLY`: {
        let t3 = e3.hour, r2 = e3.add({ hours: n2 });
        return r2.hour === t3 && n2 === 1 && (r2 = r2.add({ hours: n2 })), r2;
      }
      case `MINUTELY`:
        return e3.add({ minutes: n2 });
      case `SECONDLY`:
        return e3.add({ seconds: n2 });
      default:
        throw Error(`Unsupported FREQ: ${t2}`);
    }
  }
  expandByTime(e3) {
    if (!this.opts.byHour && !this.opts.byMinute && !this.opts.bySecond) return [e3];
    let t2 = this.opts.byHour ?? [e3.hour], n2 = this.opts.byMinute ?? [e3.minute], r2 = this.opts.bySecond ?? [e3.second];
    if (t2.length === 1 && n2.length === 1 && r2.length === 1) {
      let i3 = t2[0], a2 = n2[0], o2 = r2[0];
      if (i3 === e3.hour && a2 === e3.minute && o2 === e3.second) return [e3];
      let s2 = this.resolveGeneratedTime(e3.toPlainDateTime().with({ hour: i3, minute: a2, second: o2 }));
      return s2 ? [s2] : [];
    }
    let i2 = [];
    for (let a2 of t2) for (let t3 of n2) for (let n3 of r2) {
      let r3 = this.resolveGeneratedTime(e3.toPlainDateTime().with({ hour: a2, minute: t3, second: n3 }));
      r3 && i2.push(r3);
    }
    return i2.sort((e4, t3) => q.ZonedDateTime.compare(e4, t3));
  }
  localDateKey(e3) {
    return `${e3.calendarId}:${e3.year}:${e3.month}:${e3.day}`;
  }
  sortedUniqueDateCandidates(e3) {
    let t2 = /* @__PURE__ */ new Map();
    for (let n2 of e3) {
      let e4 = this.localDateKey(n2);
      t2.has(e4) || t2.set(e4, n2);
    }
    return [...t2.values()].sort((e4, t3) => q.PlainDate.compare(e4, t3));
  }
  resolveGeneratedTime(e3) {
    let t2 = this.originalDtstart, n2 = this.originalPlainDtstart ??= t2.toPlainDateTime();
    if (t2.timeZoneId === this.generationTimeZone && e3.equals(n2)) return t2;
    let r2 = t2.timeZoneId === this.generationTimeZone ? t2 : t2.withTimeZone(this.generationTimeZone);
    r2.calendarId !== e3.calendarId && (r2 = r2.withCalendar(e3.calendarId));
    let i2 = r2.with({ year: e3.year, month: e3.month, day: e3.day, hour: e3.hour, minute: e3.minute, second: e3.second, millisecond: e3.millisecond, microsecond: e3.microsecond, nanosecond: e3.nanosecond }, { offset: `ignore`, overflow: `reject` });
    return i2.toPlainDateTime().equals(e3) ? i2 : null;
  }
  get generationTimeZone() {
    return this.opts.rscale && [`CHINESE`, `HEBREW`, `INDIAN`].includes(this.opts.rscale) ? this.tzid : this.originalDtstart.timeZoneId;
  }
  timeOfDayNanoseconds(e3) {
    return ((e3.hour * 60 * 60 + e3.minute * 60 + e3.second) * 1e3 + e3.millisecond) * 1e6 + e3.microsecond * 1e3 + e3.nanosecond;
  }
  timeSlotNanoseconds(e3, t2, n2, r2) {
    return ((t2 * 60 * 60 + n2 * 60 + r2) * 1e3 + e3.millisecond) * 1e6 + e3.microsecond * 1e3 + e3.nanosecond;
  }
  needsSortedTimeFallback(e3) {
    try {
      let t2 = e3.startOfDay();
      return t2.add({ days: 1 }).startOfDay().epochNanoseconds - t2.epochNanoseconds !== BigInt(864e11);
    } catch {
      return true;
    }
  }
  createCandidateWorkBudget() {
    return { evaluated: 0, seenOccurrences: /* @__PURE__ */ new Set() };
  }
  recordCandidateEvaluation(e3, t2 = 1) {
    e3.evaluated += t2, this.assertCandidateBudget(e3.evaluated);
  }
  assertFastPathBudget(e3) {
    this.assertCandidateBudget(e3[0] === this.originalDtstart ? e3.length - 1 : e3.length);
  }
  assertCandidateBudget(e3) {
    if (e3 > this.maxCandidateEvaluations) throw Error(`Maximum candidate evaluations (${this.maxCandidateEvaluations}) exceeded in all()`);
  }
  visitTimeSlots(e3, t2, n2, r2, i2, a2 = this.createCandidateWorkBudget()) {
    let o2 = this.opts.byHour ?? [this.originalDtstart.hour], s2 = this.opts.byMinute ?? [this.originalDtstart.minute], c2 = this.opts.bySecond ?? [this.originalDtstart.second], l2 = e3.toPlainDateTime(this.originalDtstart.toPlainTime()), u2 = (e4, t3, n3) => this.resolveGeneratedTime(l2.with({ hour: e4, minute: t3, second: n3 }));
    if (o2.length === 1 && s2.length === 1 && c2.length === 1) {
      this.recordCandidateEvaluation(a2);
      let e4 = u2(o2[0], s2[0], c2[0]);
      return !e4 || r2 && q.ZonedDateTime.compare(e4, r2) < 0 || i2 && q.ZonedDateTime.compare(e4, i2) > 0 ? true : n2(e4);
    }
    if (this.needsSortedTimeFallback(l2.toZonedDateTime(this.generationTimeZone))) {
      let e4 = [];
      for (let t3 of o2) for (let n3 of s2) for (let o3 of c2) {
        this.recordCandidateEvaluation(a2);
        let s3 = u2(t3, n3, o3);
        s3 && (r2 && q.ZonedDateTime.compare(s3, r2) < 0 || i2 && q.ZonedDateTime.compare(s3, i2) > 0 || e4.push(s3));
      }
      e4.sort((e5, t3) => q.ZonedDateTime.compare(e5, t3));
      let l3, d3 = t2 === 1 ? 0 : e4.length - 1, f3 = t2 === 1 ? e4.length : -1;
      for (let r3 = d3; r3 !== f3; r3 += t2) {
        let t3 = e4[r3];
        if (t3.epochNanoseconds !== l3 && (l3 = t3.epochNanoseconds, !n2(t3))) return false;
      }
      return true;
    }
    let d2 = r2 ? this.timeOfDayNanoseconds(r2) : void 0, f2 = i2 ? this.timeOfDayNanoseconds(i2) : void 0, p2 = t2 === 1 ? 0 : o2.length - 1, m2 = t2 === 1 ? o2.length : -1;
    for (let e4 = p2; e4 !== m2; e4 += t2) {
      let r3 = o2[e4], i3 = t2 === 1 ? 0 : s2.length - 1, l3 = t2 === 1 ? s2.length : -1;
      for (let e5 = i3; e5 !== l3; e5 += t2) {
        let i4 = s2[e5], o3 = t2 === 1 ? 0 : c2.length - 1, l4 = t2 === 1 ? c2.length : -1;
        for (let e6 = o3; e6 !== l4; e6 += t2) {
          let t3 = c2[e6], o4 = this.timeSlotNanoseconds(this.originalDtstart, r3, i4, t3);
          if (d2 !== void 0 && o4 < d2 || f2 !== void 0 && o4 > f2) continue;
          this.recordCandidateEvaluation(a2);
          let s3 = u2(r3, i4, t3);
          if (s3 && !n2(s3)) return false;
        }
      }
    }
    return true;
  }
  visitDateTimeCandidates(e3, t2, n2, r2, i2, a2 = this.createCandidateWorkBudget()) {
    let o2 = this.sortedUniqueDateCandidates(e3);
    if (!o2.length) return true;
    let s2 = o2[0], c2 = r2?.withTimeZone(this.generationTimeZone).withCalendar(s2.calendarId), l2 = i2?.withTimeZone(this.generationTimeZone).withCalendar(s2.calendarId), u2 = c2?.toPlainDate(), d2 = l2?.toPlainDate(), f2 = t2 === 1 ? 0 : o2.length - 1, p2 = t2 === 1 ? o2.length : -1, m2;
    for (let e4 = f2; e4 !== p2; e4 += t2) {
      let r3 = o2[e4], i3 = r3;
      if (u2 && q.PlainDate.compare(i3, u2) < 0 || d2 && q.PlainDate.compare(i3, d2) > 0) continue;
      let s3 = u2 && q.PlainDate.compare(i3, u2) === 0, f3 = d2 && q.PlainDate.compare(i3, d2) === 0;
      if (!this.visitTimeSlots(r3, t2, (e5) => e5.epochNanoseconds === m2 ? true : (m2 = e5.epochNanoseconds, n2(e5)), s3 ? c2 : void 0, f3 ? l2 : void 0, a2)) return false;
    }
    return true;
  }
  visitPeriodCandidates(e3, t2, n2, r2, i2 = this.createCandidateWorkBudget()) {
    let a2 = this.opts.bySetPos;
    if (!a2?.length) return this.visitDateTimeCandidates(e3, 1, t2, n2, r2, i2);
    let o2 = new Set(a2.filter((e4) => e4 > 0)), s2 = new Set(a2.filter((e4) => e4 < 0).map((e4) => -e4)), c2 = /* @__PURE__ */ new Map();
    if (o2.size > 0) {
      let t3 = 0;
      for (let e4 of o2) t3 = Math.max(t3, e4);
      let n3 = 0;
      this.visitDateTimeCandidates(e3, 1, (e4) => (n3 += 1, o2.has(n3) && c2.set(e4.epochNanoseconds, e4), n3 < t3), void 0, void 0, i2);
    }
    if (s2.size > 0) {
      let t3 = 0;
      for (let e4 of s2) t3 = Math.max(t3, e4);
      let n3 = 0;
      this.visitDateTimeCandidates(e3, -1, (e4) => (n3 += 1, s2.has(n3) && c2.set(e4.epochNanoseconds, e4), n3 < t3), void 0, void 0, i2);
    }
    let l2 = [...c2.values()].sort((e4, t3) => q.ZonedDateTime.compare(e4, t3));
    for (let e4 of l2) if (!(n2 && q.ZonedDateTime.compare(e4, n2) < 0) && !(r2 && q.ZonedDateTime.compare(e4, r2) > 0) && !t2(e4)) return false;
    return true;
  }
  visitUtcPeriodCandidates(e3, t2, n2, r2, i2) {
    let a2 = this.timeSlotOffsetsMs;
    if (this.tzid !== `UTC` || this.originalDtstart.timeZoneId !== `UTC` || ![`iso8601`, `gregory`].includes(e3.calendarId) || this.opts.rscale !== void 0 || this.opts.byYearDay || this.opts.byWeekNo || this.opts.byMonth?.some((e4) => typeof e4 != `number`) || !a2?.length || !this.hasUniqueTimeSlotOffsets || !Number.isSafeInteger(this.opts.interval) || e3.year <= -271821 || e3.year >= 275760 || !(this.opts.byDay || this.opts.byMonthDay)) return null;
    let o2;
    if (this.opts.freq === `MONTHLY`) {
      let t3 = Kd(e3.year, e3.month, 1);
      o2 = this.generateMonthlyOccurrenceDaysUtc(e3.year, e3.month).map((e4) => t3 + e4 - 1);
    } else if (this.opts.freq === `YEARLY`) {
      if (this.hasOrdinalByDay && !this.numericByMonths?.length && (this.opts.byMonthDay || this.parsedByDayTokens?.some((e4) => e4.ord === 0 || Math.abs(e4.ord) > 52))) return null;
      o2 = this.generateYearlyOccurrenceDaysUtc(e3.year);
    } else return null;
    let s2 = o2.length * a2.length, c2 = (e4) => o2[Math.floor(e4 / a2.length)] * Y + a2[e4 % a2.length], l2 = (e4) => {
      let t3 = 0, n3 = s2;
      for (; t3 < n3; ) {
        let r3 = t3 + Math.floor((n3 - t3) / 2);
        c2(r3) < e4 ? t3 = r3 + 1 : n3 = r3;
      }
      return t3;
    }, u2 = n2 ? l2(Number(Ud(n2.epochNanoseconds, X))) : 0, d2 = r2 ? l2(Number(Hd(r2.epochNanoseconds, X)) + 1) : s2, f2 = (n3) => t2(new q.ZonedDateTime(BigInt(c2(n3)) * X, `UTC`, e3.calendarId)), p2 = this.opts.bySetPos;
    if (p2?.length) {
      let e4 = 0, t3 = 0, n3 = /* @__PURE__ */ new Set();
      for (let r3 of p2) {
        r3 > 0 ? e4 = Math.max(e4, r3) : t3 = Math.max(t3, -r3);
        let i3 = r3 > 0 ? r3 - 1 : s2 + r3;
        i3 >= 0 && i3 < s2 && n3.add(i3);
      }
      this.recordCandidateEvaluation(i2, Math.min(s2, e4) + Math.min(s2, t3));
      for (let e5 of [...n3].sort((e6, t4) => e6 - t4)) if (e5 >= u2 && e5 < d2 && !f2(e5)) return false;
    } else for (let e4 = u2; e4 < d2; e4++) if (this.recordCandidateEvaluation(i2), !f2(e4)) return false;
    return true;
  }
  nextCandidateSameDate(e3) {
    let { freq: t2, interval: n2 = 1, byHour: r2, byMinute: i2, bySecond: a2 } = this.opts;
    if (r2?.length && !r2.includes(e3.hour)) {
      let n3 = r2.find((t3) => t3 > e3.hour);
      return (n3 === void 0 ? e3.add({ days: 1 }) : e3).with({ hour: n3 ?? r2[0], minute: i2?.[0] ?? (t2 === `HOURLY` ? this.originalDtstart.minute : 0), second: a2?.[0] ?? (t2 === `SECONDLY` ? 0 : this.originalDtstart.second) });
    }
    if (t2 === `HOURLY` && r2 && r2.length === 1) return this.applyTimeOverride(e3.add({ days: n2 }));
    if (t2 === `MINUTELY` && i2 && i2.length === 1) {
      let t3 = e3.add({ hours: n2 });
      return r2?.length && !r2.includes(t3.hour) ? this.nextCandidateSameDate(t3) : t3.with({ minute: i2[0], second: a2?.[0] ?? t3.second });
    }
    if (a2 && a2.length > 1) {
      let t3 = a2.indexOf(e3.second);
      if (t3 !== -1 && t3 < a2.length - 1) return e3.with({ second: a2[t3 + 1] });
    }
    if (t2 === `MINUTELY` && r2 && r2.length > 1 && !i2) {
      let t3 = e3.add({ minutes: n2 });
      if (r2.includes(t3.hour)) return t3.with({ second: a2 ? a2[0] : e3.second });
      let i3 = r2.find((t4) => t4 > e3.hour) || r2[0];
      return i3 && i3 > e3.hour ? e3.with({ hour: i3, minute: 0, second: a2 ? a2[0] : e3.second }) : this.applyTimeOverride(e3.add({ days: 1 }));
    }
    if (t2 === `SECONDLY`) {
      let t3 = e3;
      if (a2 && a2.length > 0) {
        let e4 = a2.find((e5) => e5 > t3.second);
        if (e4 !== void 0) return t3.with({ second: e4 });
        t3 = t3.with({ second: a2[0] }).add({ minutes: 1 });
      } else t3 = t3.add({ seconds: n2 });
      if (i2 && i2.length > 0 && (!i2.includes(t3.minute) || t3.minute === e3.minute && t3.second < e3.second)) {
        let e4 = i2.find((e5) => e5 > t3.minute);
        if (e4 !== void 0) return t3.with({ minute: e4, second: a2 ? a2[0] : 0 });
        t3 = t3.with({ minute: i2[0], second: a2 ? a2[0] : 0 }).add({ hours: 1 });
      }
      if (r2 && r2.length > 0 && (!r2.includes(t3.hour) || t3.hour === e3.hour && t3.minute < e3.minute)) {
        let e4 = r2.find((e5) => e5 > t3.hour);
        if (e4 !== void 0) return t3.with({ hour: e4, minute: i2 ? i2[0] : 0, second: a2 ? a2[0] : 0 });
        t3 = t3.with({ hour: r2[0], minute: i2 ? i2[0] : 0, second: a2 ? a2[0] : 0 }).add({ days: 1 });
      }
      return t3;
    }
    if (i2 && i2.length > 1) {
      let o2 = i2.indexOf(e3.minute);
      if (o2 !== -1 && o2 < i2.length - 1) return e3.with({ minute: i2[o2 + 1], second: a2 ? a2[0] : e3.second });
      if (t2 === `MINUTELY` && o2 === i2.length - 1) {
        if (r2 && r2.length > 0) {
          let t3 = r2.indexOf(e3.hour);
          return t3 !== -1 && t3 < r2.length - 1 ? e3.with({ hour: r2[t3 + 1], minute: i2[0], second: a2 ? a2[0] : e3.second }) : this.applyTimeOverride(e3.add({ days: 1 }));
        }
        return e3.add({ hours: n2 }).with({ minute: i2[0], second: a2 ? a2[0] : e3.second });
      }
    }
    if (r2 && r2.length > 1) {
      let t3 = r2.find((t4) => t4 > e3.hour);
      if (t3 !== void 0) return e3.with({ hour: t3, minute: i2 ? i2[0] : e3.minute, second: a2 ? a2[0] : e3.second });
    }
    return t2 === `HOURLY` && r2 && r2.length > 1 ? this.applyTimeOverride(e3.add({ days: 1 })) : this.applyTimeOverride(this.rawAdvance(e3));
  }
  applyTimeOverride(e3) {
    let { freq: t2, byHour: n2, byMinute: r2, bySecond: i2 } = this.opts, a2 = t2 === `DAILY` || t2 === `WEEKLY` || t2 === `MONTHLY` || t2 === `YEARLY`;
    if (!n2 && !r2 && !i2 && !a2) return e3;
    let o2 = {};
    return n2 ? o2.hour = n2[0] : a2 && (o2.hour = this.originalDtstart.hour), r2 ? o2.minute = r2[0] : a2 && (o2.minute = this.originalDtstart.minute), i2 ? o2.second = i2[0] : a2 && (o2.second = this.originalDtstart.second), a2 && o2.hour === e3.hour && o2.minute === e3.minute && o2.second === e3.second ? e3 : e3.with(o2);
  }
  computeFirst() {
    let e3 = this.originalDtstart;
    if (this.opts.byWeekNo?.length && [`DAILY`, `HOURLY`, `MINUTELY`, `SECONDLY`].includes(this.opts.freq)) {
      let t3 = this.opts.byWeekNo[0], n3 = e3.year;
      for (; n3 <= e3.year + 10; ) {
        let r3 = e3.with({ year: n3, month: 1, day: 1 }), i2 = e3.with({ year: n3, month: 12, day: 31 }), a2 = false;
        if (t3 > 0) {
          let e4 = 52;
          (r3.dayOfWeek === 4 || i2.dayOfWeek === 4) && (e4 = 53), a2 = t3 <= e4;
        } else {
          let e4 = 52;
          (r3.dayOfWeek === 4 || i2.dayOfWeek === 4) && (e4 = 53), a2 = -t3 <= e4;
        }
        if (a2) {
          let n4 = r3.add({ days: (4 - r3.dayOfWeek + 7) % 7 }), a3;
          if (t3 > 0) a3 = n4.subtract({ days: 3 }).add({ weeks: t3 - 1 });
          else {
            let e4 = r3.dayOfWeek === 4 || i2.dayOfWeek === 4 ? 53 : 52;
            a3 = n4.subtract({ days: 3 }).add({ weeks: e4 + t3 });
          }
          if (this.opts.byDay?.length) {
            let t4 = J, n5 = this.opts.byDay.map((e4) => $(e4)).filter((e4) => e4 !== null).map((e4) => t4[e4]).filter(Boolean);
            if (n5.length) {
              let t5 = n5.map((e4) => {
                let t6 = (e4 - a3.dayOfWeek + 7) % 7;
                return a3.add({ days: t6 });
              }).sort((e4, t6) => q.ZonedDateTime.compare(e4, t6))[0];
              if (t5 && q.ZonedDateTime.compare(t5, this.originalDtstart) >= 0) {
                e3 = t5;
                break;
              }
            }
          } else if (q.ZonedDateTime.compare(a3, this.originalDtstart) >= 0) {
            e3 = a3;
            break;
          }
        }
        n3++;
      }
    }
    if (this.opts.byDay?.length && !this.opts.byWeekNo) {
      let t3 = J;
      if (this.opts.byDay.some((e4) => /^[+-]?\d/.test(e4)) && this.opts.byMonth && (this.opts.freq === `MINUTELY` || this.opts.freq === `SECONDLY`)) {
        let t4 = this.opts.byMonth.filter((e4) => typeof e4 == `number`).sort((e4, t5) => e4 - t5), n3 = false;
        for (let r3 = e3.year; r3 <= e3.year + 10 && !n3; r3++) for (let i2 of t4) {
          if (r3 === e3.year && i2 < e3.month) continue;
          let t5 = e3.with({ year: r3, month: i2, day: 1 }), a2 = this.generateMonthlyOccurrences(t5);
          for (let t6 of a2) if (q.ZonedDateTime.compare(t6, e3) >= 0) {
            e3 = t6.toPlainDate().equals(e3.toPlainDate()) ? t6 : this.applyTimeOverride(t6.with({ hour: 0, minute: 0, second: 0 })), n3 = true;
            break;
          }
          if (n3) break;
        }
      } else {
        let n3, r3 = this.opts.byDay.map((e4) => $(e4)).filter((e4) => e4 !== null);
        if (this.opts.freq === `DAILY` && r3.length === this.opts.byDay.length) {
          let i2 = this.findFirstMatchingDailyStep(e3.dayOfWeek, this.opts.interval, r3.map((e4) => t3[e4]));
          n3 = i2 === null ? [] : [i2 * this.opts.interval];
        } else n3 = r3.map((n4) => (t3[n4] - e3.dayOfWeek + 7) % 7);
        n3.length && (e3 = e3.add({ days: Math.min(...n3) }));
      }
    }
    let { byHour: t2, byMinute: n2, bySecond: r2 } = this.opts;
    if (this.opts.freq === `HOURLY` && !t2 && q.ZonedDateTime.compare(e3.with({ hour: 0, minute: 0, second: 0, microsecond: 0, nanosecond: 0 }), this.originalDtstart) > 0 && (e3 = e3.with({ hour: 0, minute: 0, second: 0, microsecond: 0, nanosecond: 0 })), this.opts.freq === `MINUTELY` && !n2 && q.ZonedDateTime.compare(e3.with({ hour: 0, minute: 0, second: 0, microsecond: 0, nanosecond: 0 }), this.originalDtstart) > 0 && (e3 = e3.with({ hour: 0, minute: 0, second: 0, microsecond: 0, nanosecond: 0 })), this.opts.freq === `SECONDLY` && this.opts.byWeekNo?.length && !r2 && q.ZonedDateTime.compare(e3.with({ hour: 0, minute: 0, second: 0, microsecond: 0, nanosecond: 0 }), this.originalDtstart) > 0 && (e3 = e3.with({ hour: 0, minute: 0, second: 0, microsecond: 0, nanosecond: 0 })), t2 || n2 || r2) {
      let t3 = this.expandByTime(e3);
      for (let e4 of t3) if (q.ZonedDateTime.compare(e4, this.originalDtstart) >= 0) return e4;
      e3 = this.applyTimeOverride(this.rawAdvance(e3));
    }
    return e3;
  }
  matchesByDay(e3) {
    let { byDay: t2, freq: n2 } = this.opts;
    if (!t2) return true;
    if (!this.hasOrdinalByDay) return this.simpleByDayIsoDays?.includes(e3.dayOfWeek) ?? false;
    for (let t3 of this.parsedByDayTokens ?? []) {
      if (n2 === `DAILY` && e3.dayOfWeek === t3.isoDay) return true;
      if (t3.ord === 0) {
        if (e3.dayOfWeek === t3.isoDay) return true;
        continue;
      }
      let r2 = e3.month, i2 = e3.with({ day: 1 }), a2 = [];
      for (; i2.month === r2; ) i2.dayOfWeek === t3.isoDay && a2.push(i2.day), i2 = i2.add({ days: 1 });
      if (a2[t3.ord > 0 ? t3.ord - 1 : a2.length + t3.ord] === e3.day) return true;
    }
    return false;
  }
  matchesByMonth(e3) {
    let { byMonth: t2 } = this.opts;
    if (!t2) return true;
    let n2 = t2.filter((e4) => typeof e4 == `number`);
    return n2.length === 0 ? true : n2.includes(e3.month);
  }
  matchesNumericConstraint(e3, t2, n2) {
    return t2.some((t3) => e3 === (t3 > 0 ? t3 : n2 + t3 + 1));
  }
  matchesByMonthDay(e3) {
    let { byMonthDay: t2 } = this.opts;
    if (!t2) return true;
    let n2 = e3.with({ day: 1 }).add({ months: 1 }).subtract({ days: 1 }).day;
    return this.matchesNumericConstraint(e3.day, t2, n2);
  }
  matchesByHour(e3) {
    return !this.opts.byHour || this.opts.byHour.includes(e3.hour);
  }
  matchesByMinute(e3) {
    let { byMinute: t2 } = this.opts;
    return t2 ? t2.includes(e3.minute) : true;
  }
  matchesBySecond(e3) {
    let { bySecond: t2 } = this.opts;
    return t2 ? t2.includes(e3.second) : true;
  }
  matchesAll(e3) {
    return this.matchesByMonth(e3) && this.matchesByWeekNo(e3) && this.matchesByYearDay(e3) && this.matchesByMonthDay(e3) && this.matchesByDay(e3) && this.matchesByHour(e3) && this.matchesByMinute(e3) && this.matchesBySecond(e3);
  }
  matchesByYearDay(e3) {
    let { byYearDay: t2 } = this.opts;
    if (!t2) return true;
    let n2 = e3.dayOfYear, r2 = this.lastByYearDay(e3);
    return this.matchesNumericConstraint(n2, t2, r2);
  }
  lastByYearDay(e3) {
    return e3.with({ month: 12, day: 31 }).dayOfYear;
  }
  getIsoWeekInfo(e3) {
    let t2 = `toPlainDate` in e3 ? e3.toPlainDate() : e3, n2 = t2.add({ days: 4 - t2.dayOfWeek }), r2 = n2.year, i2 = t2.with({ year: r2, month: 1, day: 1 }), a2 = i2.add({ days: (4 - i2.dayOfWeek + 7) % 7 }), o2 = n2.since(a2).days;
    return { week: Math.floor(o2 / 7) + 1, year: r2 };
  }
  matchesByWeekNo(e3) {
    let { byWeekNo: t2 } = this.opts;
    if (!t2) return true;
    let { week: n2, year: r2 } = this.getIsoWeekInfo(e3), i2 = e3.with({ year: r2, month: 1, day: 1 }), a2 = i2.inLeapYear, o2 = i2.dayOfWeek === 4 || a2 && i2.dayOfWeek === 3 ? 53 : 52;
    return t2.some((e4) => e4 > 0 ? n2 === e4 : n2 === o2 + e4 + 1);
  }
  hasPossibleYearDayWeekNoCombination() {
    if (!this.opts.byYearDay || !this.opts.byWeekNo) return true;
    let e3 = this.originalDtstart.with({ year: 2e3, month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
    for (let t2 = 0; t2 < 400; t2++) {
      let t3 = e3.daysInYear;
      for (let n2 of this.opts.byYearDay) {
        let r2 = n2 > 0 ? n2 : t3 + n2 + 1;
        if (r2 >= 1 && r2 <= t3 && this.matchesByWeekNo(e3.add({ days: r2 - 1 }))) return true;
      }
      e3 = e3.add({ years: 1 });
    }
    return false;
  }
  yearlyDaysNeverMatch() {
    let { freq: e3, byYearDay: t2, byWeekNo: n2, byDay: r2, byMonthDay: i2, byMonth: a2, bySetPos: o2, interval: s2 = 1 } = this.opts;
    if (e3 !== `YEARLY` || n2 || !(r2 || i2) || ![`iso8601`, `gregory`].includes(this.originalDtstart.calendarId) || !t2 && !(this.hasOrdinalByDay && !a2)) return false;
    if (this.yearlyDaysNeverMatchCache === void 0) {
      let { byHour: e4, byMinute: t3, bySecond: n3 } = this.opts, r3 = (e4?.length || 1) * (t3?.length || 1) * (n3?.length || 1), i3 = o2?.length ? Math.min(...o2.map((e5) => Math.abs(e5))) : 1, a3 = true;
      try {
        let e5 = this.originalDtstart.toPlainDate().with({ month: 1, day: 1 });
        for (let t4 = 0; a3 && t4 < 400; t4++) a3 = this.generateYearlyDateCandidates(e5.add({ years: t4 * s2 })).length * r3 < i3;
      } catch {
        a3 = false;
      }
      this.yearlyDaysNeverMatchCache = a3;
    }
    return this.yearlyDaysNeverMatchCache;
  }
  options() {
    let { dtstart: e3, until: t2, rDate: n2, exDate: r2, temporal: i2, ...a2 } = this.cloneOptions();
    return { ...a2, ...this.outputTemporal ? { temporal: this.outputTemporal } : {}, dtstart: this.toPublicDate(e3), until: t2 ? this.toPublicDate(t2) : void 0, rDate: n2 ? this.toPublicDates(n2) : void 0, exDate: r2 ? this.toPublicDates(r2) : void 0 };
  }
  cloneOptions() {
    let { byHour: e3, byMinute: t2, bySecond: n2, byDay: r2, byMonth: i2, byMonthDay: a2, byYearDay: o2, byWeekNo: s2, bySetPos: c2, rDate: l2, exDate: u2, ...d2 } = this.opts;
    return { ...d2, byHour: e3 ? [...e3] : void 0, byMinute: t2 ? [...t2] : void 0, bySecond: n2 ? [...n2] : void 0, byDay: r2 ? [...r2] : void 0, byMonth: i2 ? [...i2] : void 0, byMonthDay: a2 ? [...a2] : void 0, byYearDay: o2 ? [...o2] : void 0, byWeekNo: s2 ? [...s2] : void 0, bySetPos: c2 ? [...c2] : void 0, rDate: l2 ? [...l2] : void 0, exDate: u2 ? [...u2] : void 0 };
  }
  cloneUpdateOptions(e3) {
    let t2 = {};
    return Object.prototype.hasOwnProperty.call(e3, `byHour`) && (t2.byHour = Array.isArray(e3.byHour) ? [...e3.byHour] : e3.byHour), Object.prototype.hasOwnProperty.call(e3, `byMinute`) && (t2.byMinute = Array.isArray(e3.byMinute) ? [...e3.byMinute] : e3.byMinute), Object.prototype.hasOwnProperty.call(e3, `bySecond`) && (t2.bySecond = Array.isArray(e3.bySecond) ? [...e3.bySecond] : e3.bySecond), Object.prototype.hasOwnProperty.call(e3, `byDay`) && (t2.byDay = Array.isArray(e3.byDay) ? [...e3.byDay] : e3.byDay), Object.prototype.hasOwnProperty.call(e3, `byMonth`) && (t2.byMonth = Array.isArray(e3.byMonth) ? [...e3.byMonth] : e3.byMonth), Object.prototype.hasOwnProperty.call(e3, `byMonthDay`) && (t2.byMonthDay = Array.isArray(e3.byMonthDay) ? [...e3.byMonthDay] : e3.byMonthDay), Object.prototype.hasOwnProperty.call(e3, `byYearDay`) && (t2.byYearDay = Array.isArray(e3.byYearDay) ? [...e3.byYearDay] : e3.byYearDay), Object.prototype.hasOwnProperty.call(e3, `byWeekNo`) && (t2.byWeekNo = Array.isArray(e3.byWeekNo) ? [...e3.byWeekNo] : e3.byWeekNo), Object.prototype.hasOwnProperty.call(e3, `bySetPos`) && (t2.bySetPos = Array.isArray(e3.bySetPos) ? [...e3.bySetPos] : e3.bySetPos), Object.prototype.hasOwnProperty.call(e3, `rDate`) && (t2.rDate = Array.isArray(e3.rDate) ? [...e3.rDate] : e3.rDate), Object.prototype.hasOwnProperty.call(e3, `exDate`) && (t2.exDate = Array.isArray(e3.exDate) ? [...e3.exDate] : e3.exDate), t2;
  }
  with(t2) {
    return new e2({ ...this.cloneOptions(), ...t2, ...this.cloneUpdateOptions(t2), tzid: t2.tzid ?? this.opts.tzid, dtstart: t2.dtstart ?? this.opts.dtstart });
  }
  dtstartIsOccurrence() {
    if (this.dtstartIsOccurrenceCache !== void 0) return this.dtstartIsOccurrenceCache;
    let t2 = this.matchesAll(this.originalDtstart);
    if (t2 && this.opts.bySetPos?.length) {
      let n2 = new e2({ ...this.opts, temporal: this.outputTemporal, dtstart: this.originalDtstart, includeDtstart: false, rDate: void 0, exDate: void 0 }), r2;
      try {
        n2.allInternal((e3) => (r2 = e3.epochNanoseconds, false));
      } catch {
      }
      t2 = r2 === this.originalDtstart.epochNanoseconds;
    }
    return this.dtstartIsOccurrenceCache = t2, t2;
  }
  addDtstartIfNeeded(e3, t2) {
    if (this.includeDtstart && !this.dtstartIsOccurrence()) {
      if (t2 && this.isExcluded(this.originalDtstart)) return true;
      if (t2 && !t2(this.originalDtstart, e3.length) || (e3.push(this.originalDtstart), this.shouldBreakForCountLimit(e3.length))) return false;
    }
    return true;
  }
  canUseUtcLinearFastPath(e3) {
    if (e3 || !this.canUseUtcCalendarFastPaths() || this.opts.rscale || this.opts.byMonth || this.opts.byMonthDay || this.opts.byYearDay || this.opts.byWeekNo || this.opts.bySetPos) return false;
    switch (this.opts.freq) {
      case `DAILY`:
        return !this.hasOrdinalByDay && (!this.opts.byHour || this.canUseEpochMillisecondsPrecisionFlag) && (!this.opts.byMinute || this.canUseEpochMillisecondsPrecisionFlag) && (!this.opts.bySecond || this.canUseEpochMillisecondsPrecisionFlag);
      case `HOURLY`:
      case `MINUTELY`:
      case `SECONDLY`:
        return !this.opts.byDay && !this.opts.byHour && !this.opts.byMinute && !this.opts.bySecond;
      default:
        return false;
    }
  }
  canUseUtcWeeklyFastPath(e3) {
    return !e3 && this.canUseUtcCalendarFastPaths() && this.opts.freq === `WEEKLY` && !this.opts.rscale && !this.opts.byMonth && !this.opts.byMonthDay && !this.opts.byYearDay && !this.opts.byWeekNo && !this.opts.bySetPos && (!this.opts.byHour || this.canUseEpochMillisecondsPrecisionFlag) && (!this.opts.byMinute || this.canUseEpochMillisecondsPrecisionFlag) && (!this.opts.bySecond || this.canUseEpochMillisecondsPrecisionFlag) && !this.hasOrdinalByDay;
  }
  canUseUtcMonthlyFastPath(e3) {
    return !e3 && this.canUseUtcCalendarFastPaths() && this.opts.freq === `MONTHLY` && !this.opts.rscale && !this.opts.byYearDay && !this.opts.byWeekNo && this.canUseEpochMillisecondsPrecisionFlag && this.hasSingleExpandedTimeSlot() && !!(this.opts.byDay || this.opts.byMonthDay);
  }
  utcZdtFromEpochNanoseconds(e3) {
    return new q.ZonedDateTime(e3, `UTC`, this.originalDtstart.calendarId);
  }
  utcZdtFromEpochMilliseconds(e3) {
    return this.utcZdtFromEpochNanoseconds(BigInt(e3) * X);
  }
  canUseUtcCalendarFastPaths() {
    return this.tzid === `UTC` && this.originalDtstart.timeZoneId === this.tzid && [`iso8601`, `gregory`].includes(this.originalDtstart.calendarId);
  }
  canUseUtcEpochMillisecondsPrecision() {
    return this.canUseEpochMillisecondsPrecisionFlag;
  }
  buildTimeSlotOffsetsMs() {
    if (!this.canUseEpochMillisecondsPrecisionFlag) return;
    let e3 = this.opts.byHour ?? [this.originalDtstart.hour], t2 = this.opts.byMinute ?? [this.originalDtstart.minute], n2 = this.opts.bySecond ?? [this.originalDtstart.second], r2 = this.originalDtstart.millisecond, i2 = [];
    for (let a2 of e3) for (let e4 of t2) for (let t3 of n2) i2.push(((a2 * 60 + e4) * 60 + t3) * Td + r2);
    return i2;
  }
  createNumericQueryPlan(e3, t2, n2, r2) {
    let i2 = n2(0), a2 = n2(t2 - 1);
    if (!i2 || !a2 || !Z(i2.epochMilliseconds) || !Z(a2.epochMilliseconds) || i2.epochMilliseconds > a2.epochMilliseconds) return null;
    let o2 = (e4, t3, i3) => {
      if (r2) return Math.max(0, Math.min(i3, r2(e4, t3)));
      let a3 = 0, o3 = i3;
      for (; a3 < o3; ) {
        let r3 = a3 + Math.floor((o3 - a3) / 2), i4 = n2(r3);
        if (!i4) {
          o3 = r3;
          continue;
        }
        let s3 = BigInt(i4.epochMilliseconds) * X;
        (t3 ? s3 > e4 : s3 >= e4) ? o3 = r3 : a3 = r3 + 1;
      }
      return a3;
    }, s2 = this.opts.until?.epochNanoseconds, c2 = s2 === void 0 ? t2 : o2(s2, true, t2);
    return { kind: e3, count: c2, maximumCount: t2, select: (e4) => !Number.isSafeInteger(e4) || e4 < 0 || e4 >= t2 ? null : n2(e4), lowerBound: (e4, t3) => o2(e4, t3, c2) };
  }
  buildFixedStepNumericQueryPlan(e3) {
    let t2;
    switch (this.opts.freq) {
      case `HOURLY`:
        t2 = Dd;
        break;
      case `MINUTELY`:
        t2 = Ed;
        break;
      case `SECONDLY`:
        t2 = Td;
        break;
      default:
        return null;
    }
    if (![`UTC`, `Etc/UTC`, `Etc/GMT`].includes(this.tzid) && !/^[-+]\d{2}:?\d{2}(?::?\d{2})?$/.test(this.tzid) && this.opts.freq === `HOURLY` && this.opts.interval === 1) return null;
    let n2 = this.originalDtstart.epochMilliseconds, r2 = t2 * this.opts.interval;
    if (!Number.isSafeInteger(r2) || r2 <= 0) return null;
    let i2 = (e4) => {
      let t3 = n2 + e4 * r2;
      return Z(t3) ? { epochMilliseconds: t3, periodIndex: e4, occurrenceIndex: e4 } : null;
    }, a2 = BigInt(n2) * X, o2 = BigInt(r2) * X, s2 = BigInt(e3);
    return this.createNumericQueryPlan(`fixed-step`, e3, i2, (t3, n3) => {
      let r3 = t3 - a2, i3 = n3 ? Hd(r3, o2) + 1n : Ud(r3, o2);
      return i3 <= 0n ? 0 : i3 >= s2 ? e3 : Number(i3);
    });
  }
  resolveNumericWallMilliseconds(e3) {
    if (!Z(e3)) return null;
    if (this.tzid === `UTC`) return e3;
    let t2 = this.getZoneResolver().epochMsForWall(e3);
    return t2.pushed || !Z(t2.epochMs) ? null : t2.epochMs;
  }
  numericQueryGapHazard(e3, t2) {
    if (this.tzid === `UTC`) return false;
    let n2 = this.originalDtstart.epochMilliseconds;
    return 200 * 366 * Y, t2 - n2 > 632448e7 ? true : this.getZoneResolver().timeOfDayMayHitGap(e3, n2 - Y, t2 + Y);
  }
  buildDailyNumericQueryPlan(e3) {
    let t2 = this.opts.interval, n2 = this.originalDtstart.epochMilliseconds, r2 = this.tzid === `UTC` ? n2 : this.wallMsOf(this.originalDtstart), i2 = Math.floor(r2 / Y), a2 = Jd(i2), o2 = Bd(this.simpleByDayIsoDays);
    if (!(this.opts.byHour || this.opts.byMinute || this.opts.bySecond)) {
      let n3 = r2 - i2 * Y, s3 = this.simpleByDayIsoDays?.length ? this.findFirstMatchingDailyStep(a2, t2, this.simpleByDayIsoDays) : 0;
      if (s3 === null) return null;
      let c3 = 7 / Rd(t2, 7), l3 = [];
      for (let e4 = 0; e4 < c3; e4++) Vd(o2, Q(a2, (s3 + e4) * t2)) && l3.push(e4);
      if (l3.length === 0) return null;
      let u3 = this.createNumericQueryPlan(`daily`, e3, (e4) => {
        let n4 = Math.floor(e4 / l3.length), i3 = e4 % l3.length, a3 = n4 * c3 + l3[i3], o3 = (s3 + a3) * t2;
        if (!Number.isSafeInteger(a3) || !Number.isSafeInteger(o3)) return null;
        let u4 = r2 + o3 * Y, d4 = this.resolveNumericWallMilliseconds(u4);
        return d4 === null ? null : { epochMilliseconds: d4, periodIndex: a3, occurrenceIndex: e4 };
      }), d3 = u3?.select(e3 - 1);
      return d3 && this.numericQueryGapHazard(n3, d3.epochMilliseconds) ? null : u3;
    }
    let s2 = this.timeSlotOffsetsMs;
    if (!s2?.length || !this.hasUniqueTimeSlotOffsets || !zd(s2)) return null;
    let c2 = s2.length, l2 = this.simpleByDayIsoDays?.length ? this.findFirstMatchingDailyStep(a2, t2, this.simpleByDayIsoDays) : 0;
    if (l2 === null) return null;
    let u2 = l2 * t2, d2 = i2 + u2, f2 = Q(a2, u2), p2 = 7 / Rd(t2, 7), m2 = c2;
    if (Vd(o2, f2)) {
      let e4 = this.numericFirstPeriodSkip(c2, (e5) => d2 * Y + s2[e5]);
      if (e4 === null) return null;
      m2 = e4;
    }
    let h2 = c2 - m2, g2 = [];
    for (let e4 = 0; e4 < p2; e4++) Vd(o2, Q(f2, (1 + e4) * t2)) && g2.push(e4);
    let _2 = g2.length * c2;
    if (h2 === 0 && _2 === 0) return null;
    let v2 = this.createNumericQueryPlan(`daily`, e3, (e4) => {
      if (e4 < h2) {
        let t3 = this.resolveNumericWallMilliseconds(d2 * Y + s2[m2 + e4]);
        return t3 === null ? null : { epochMilliseconds: t3, periodIndex: 0, occurrenceIndex: e4 };
      }
      if (_2 === 0) return null;
      let n3 = e4 - h2, r3 = Math.floor(n3 / _2), a3 = n3 % _2, o3 = g2[Math.floor(a3 / c2)], l3 = 1 + r3 * p2 + o3, f3 = u2 + l3 * t2;
      if (!Number.isSafeInteger(l3) || !Number.isSafeInteger(f3)) return null;
      let v3 = (i2 + f3) * Y + s2[a3 % c2], ee3 = this.resolveNumericWallMilliseconds(v3);
      return ee3 === null ? null : { epochMilliseconds: ee3, periodIndex: l3, occurrenceIndex: e4 };
    }), ee2 = v2?.select(e3 - 1);
    return ee2 && s2.some((e4) => this.numericQueryGapHazard(e4, ee2.epochMilliseconds)) ? null : v2;
  }
  buildWeeklyNumericQueryPlan(e3) {
    let t2 = this.timeSlotOffsetsMs;
    if (!t2?.length || !this.hasUniqueTimeSlotOffsets || !zd(t2)) return null;
    let n2 = t2.length, r2 = this.originalDtstart.epochMilliseconds, i2 = this.tzid === `UTC` ? r2 : this.wallMsOf(this.originalDtstart), a2 = Math.floor(i2 / Y), o2 = Jd(a2), s2 = J[$(this.opts.wkst || `MO`) ?? `MO`] ?? 1, c2 = (this.opts.byDay ? [...this.allByDayIsoDays ?? []] : [o2]).map((e4) => (e4 - s2 + 7) % 7).sort((e4, t3) => e4 - t3);
    if (c2.length === 0 || !zd(c2)) return null;
    let l2 = a2 - (o2 - s2 + 7) % 7, u2 = c2.length * n2, d2 = (e4, r3) => (e4 + c2[Math.floor(r3 / n2)]) * Y + t2[r3 % n2], f2 = this.numericFirstPeriodSkip(u2, (e4) => d2(l2, e4));
    if (f2 === null) return null;
    let p2 = u2 - f2, m2 = this.createNumericQueryPlan(`weekly`, e3, (e4) => {
      if (e4 < p2) {
        let t4 = this.resolveNumericWallMilliseconds(d2(l2, f2 + e4));
        return t4 === null ? null : { epochMilliseconds: t4, periodIndex: 0, occurrenceIndex: e4 };
      }
      let t3 = e4 - p2, n3 = 1 + Math.floor(t3 / u2), r3 = n3 * this.opts.interval * 7;
      if (!Number.isSafeInteger(n3) || !Number.isSafeInteger(r3)) return null;
      let i3 = d2(l2 + r3, t3 % u2), a3 = this.resolveNumericWallMilliseconds(i3);
      return a3 === null ? null : { epochMilliseconds: a3, periodIndex: n3, occurrenceIndex: e4 };
    }), h2 = m2?.select(e3 - 1);
    return h2 && t2.some((e4) => this.numericQueryGapHazard(e4, h2.epochMilliseconds)) ? null : m2;
  }
  buildMonthlyNumericQueryPlan(e3) {
    let t2 = this.opts.interval;
    if (!this.timeSlotOffsetsMs?.length || !this.hasUniqueTimeSlotOffsets || this.opts.byMonth?.some((e4) => typeof e4 != `number`) || this.opts.bySetPos && new Set(this.opts.bySetPos).size !== this.opts.bySetPos.length) return null;
    let n2 = this.originalDtstart.year * 12 + (this.originalDtstart.month - 1);
    return this.buildCalendarNumericQueryPlan(`monthly`, e3, 4800 / Rd(t2, 4800), (e4) => {
      let r2 = e4 * t2, i2 = n2 + r2;
      if (!Number.isSafeInteger(r2) || !Number.isSafeInteger(i2)) return null;
      let { year: a2, month: o2 } = this.monthIndexToYearMonth(i2), s2 = this.generateMonthlyOccurrenceDaysUtc(a2, o2);
      if (s2.length === 0) return s2;
      let c2 = Kd(a2, o2, 1);
      return Z(c2 * Y) ? s2.map((e5) => c2 + e5 - 1) : [];
    });
  }
  numericPeriodShape(e3) {
    if (!e3 || !zd(e3)) return null;
    let t2 = e3.length * this.timeSlotOffsetsMs.length, n2 = this.opts.bySetPos;
    if (!n2?.length || t2 === 0) return { days: e3, candidates: t2, count: t2 };
    let r2 = [];
    for (let e4 of n2) {
      let n3 = e4 > 0 ? e4 - 1 : t2 + e4;
      n3 >= 0 && n3 < t2 && r2.push(n3);
    }
    if (r2.length > 1) {
      r2.sort((e5, t3) => e5 - t3);
      let e4 = 1;
      for (let t3 = 1; t3 < r2.length; t3++) r2[t3] !== r2[e4 - 1] && (r2[e4++] = r2[t3]);
      r2.length = e4;
    }
    return { days: e3, candidates: t2, count: r2.length, selected: r2 };
  }
  numericPeriodWall(e3, t2) {
    let n2 = this.timeSlotOffsetsMs, r2 = e3.selected ? e3.selected[t2] : t2;
    return e3.days[Math.floor(r2 / n2.length)] * Y + n2[r2 % n2.length];
  }
  numericFirstPeriodSkip(e3, t2) {
    let n2 = this.originalDtstart.epochMilliseconds;
    if (e3 === 0) return 0;
    if (this.tzid === `UTC`) {
      if (!Z(t2(0)) || !Z(t2(e3 - 1))) return null;
      let r3 = 0, i2 = e3;
      for (; r3 < i2; ) {
        let e4 = r3 + Math.floor((i2 - r3) / 2);
        t2(e4) >= n2 ? i2 = e4 : r3 = e4 + 1;
      }
      return r3;
    }
    let r2 = e3;
    for (let i2 = 0; i2 < e3; i2++) {
      let a2 = this.resolveNumericWallMilliseconds(t2(i2));
      if (a2 === null) return null;
      if (a2 >= n2) r2 === e3 && (r2 = i2);
      else if (r2 !== e3) return null;
    }
    return r2;
  }
  buildCalendarNumericQueryPlan(e3, t2, n2, r2, i2 = false) {
    let a2 = this.timeSlotOffsetsMs;
    if (!zd(a2)) return null;
    let o2, s2 = (e4) => {
      if (o2?.periodIndex === e4) return o2.shape;
      let t3 = this.numericPeriodShape(r2(e4));
      return t3 && (o2 = { periodIndex: e4, shape: t3 }), t3;
    }, c2 = s2(0);
    if (!c2 || i2 && this.yearlyCandidateEvaluationCount(c2.candidates) > this.maxCandidateEvaluations) return null;
    let l2 = this.numericFirstPeriodSkip(c2.count, (e4) => this.numericPeriodWall(c2, e4));
    if (l2 === null) return null;
    let u2 = c2.count - l2, d2 = Math.max(0, t2 - u2), f2 = [0], p2 = [0];
    for (let e4 = 0; e4 < n2 && f2.at(-1) < d2; e4++) {
      let t3 = s2(1 + e4);
      if (!t3) return null;
      f2.push(f2[e4] + t3.count), i2 && p2.push(p2[e4] + this.yearlyCandidateEvaluationCount(t3.candidates));
    }
    let m2 = f2.length - 1 === n2, h2 = f2.at(-1);
    if (h2 === 0 && u2 < t2) return null;
    if (i2) {
      let e4 = this.yearlyCandidateEvaluationCount(c2.candidates);
      if (m2 && d2 > 0) {
        let t3 = Math.floor(d2 / h2), n3 = d2 % h2;
        if (e4 += t3 * p2.at(-1), n3 > 0) {
          let t4 = 1;
          for (; f2[t4] < n3; ) t4 += 1;
          e4 += p2[t4];
        }
      } else e4 += p2.at(-1);
      if (e4 > this.maxCandidateEvaluations) return null;
    }
    let g2 = this.createNumericQueryPlan(e3, t2, (e4) => {
      let t3 = 0, r3 = c2, i3 = l2 + e4;
      if (e4 >= u2) {
        if (h2 === 0) return null;
        let a4 = e4 - u2, o3 = m2 ? Math.floor(a4 / h2) : 0, c3 = m2 ? a4 % h2 : a4;
        if (c3 >= h2) return null;
        let l3 = 1, d3 = f2.length - 1;
        for (; l3 < d3; ) {
          let e5 = l3 + Math.floor((d3 - l3) / 2);
          f2[e5] > c3 ? d3 = e5 : l3 = e5 + 1;
        }
        let p3 = l3 - 1;
        if (t3 = 1 + o3 * n2 + p3, !Number.isSafeInteger(t3)) return null;
        let g3 = s2(t3);
        if (!g3 || (r3 = g3, i3 = c3 - f2[p3], i3 >= r3.count)) return null;
      }
      let a3 = this.resolveNumericWallMilliseconds(this.numericPeriodWall(r3, i3));
      return a3 === null ? null : { epochMilliseconds: a3, periodIndex: t3, occurrenceIndex: e4 };
    }), _2 = g2?.select(t2 - 1);
    return _2 && a2.some((e4) => this.numericQueryGapHazard(e4, _2.epochMilliseconds)) ? null : g2;
  }
  generateYearlyOccurrenceDaysUtc(e3) {
    let t2 = !!(this.opts.byDay || this.opts.byMonthDay);
    this.numericByMonths?.length;
    let n2 = this.numericByMonths?.length ? [...this.numericByMonths].sort((e4, t3) => e4 - t3) : t2 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [this.originalDtstart.month], r2 = [];
    if (this.hasOrdinalByDay && !this.numericByMonths?.length) {
      let t3 = this.isGregorianLeapYear(e3) ? 366 : 365, n3 = this.gregorianIsoDayOfWeek(e3, 1, 1), i2 = Q(n3, t3 - 1), a2 = /* @__PURE__ */ new Set();
      for (let e4 of this.parsedByDayTokens ?? []) {
        if (e4.ord === 0) continue;
        let r3 = e4.ord > 0 ? 1 + (e4.isoDay - n3 + 7) % 7 + 7 * (e4.ord - 1) : t3 - (i2 - e4.isoDay + 7) % 7 + 7 * (e4.ord + 1);
        r3 >= 1 && r3 <= t3 && a2.add(r3);
      }
      for (let t4 of [...a2].sort((e4, t5) => e4 - t5)) {
        let n4 = t4, i3 = 1;
        for (; n4 > this.daysInGregorianMonth(e3, i3); ) n4 -= this.daysInGregorianMonth(e3, i3), i3 += 1;
        r2.push({ month: i3, day: n4 });
      }
    } else for (let i2 of n2) {
      let n3;
      n3 = t2 ? this.generateMonthlyOccurrenceDaysUtc(e3, i2) : this.originalDtstart.day <= this.daysInGregorianMonth(e3, i2) ? [this.originalDtstart.day] : [];
      for (let e4 of n3) r2.push({ month: i2, day: e4 });
    }
    return r2.map(({ month: t3, day: n3 }) => Kd(e3, t3, n3));
  }
  generateYearlyOccurrenceEpochsUtc(e3) {
    let t2 = this.timeSlotOffsetsMs;
    if (!t2?.length) return [];
    let n2 = [];
    for (let r3 of this.generateYearlyOccurrenceDaysUtc(e3)) {
      let e4 = r3 * Y;
      if (!Z(e4)) return [];
      for (let r4 of t2) n2.push(e4 + r4);
    }
    if (n2.sort((e4, t3) => e4 - t3), !this.opts.bySetPos?.length) return n2;
    let r2 = this.applyBySetPosToSortedList(n2).sort((e4, t3) => e4 - t3);
    return r2.filter((e4, t3) => t3 === 0 || e4 !== r2[t3 - 1]);
  }
  yearlyCandidateEvaluationCount(e3) {
    let t2 = this.opts.bySetPos;
    if (!t2?.length) return e3;
    let n2 = 0, r2 = 0;
    for (let e4 of t2) e4 > 0 ? n2 = Math.max(n2, e4) : r2 = Math.max(r2, -e4);
    return Math.min(e3, n2) + Math.min(e3, r2);
  }
  buildYearlyNumericQueryPlan(e3) {
    let t2 = this.opts.interval, n2 = this.timeSlotOffsetsMs;
    if (!n2?.length || !this.hasUniqueTimeSlotOffsets || this.opts.byMonth?.some((e4) => typeof e4 != `number`) || this.opts.byYearDay || this.opts.byWeekNo) return null;
    let r2 = !!(this.opts.byDay || this.opts.byMonthDay), i2 = !!this.opts.byMonth && !r2;
    if (!this.opts.byMonth && !r2 && n2.length !== 1 || i2 && (n2.length !== 1 || this.opts.bySetPos) || this.hasOrdinalByDay && !this.numericByMonths?.length && (this.opts.byMonthDay || this.parsedByDayTokens?.some((e4) => e4.ord === 0))) return null;
    let a2 = this.originalDtstart.year;
    return this.buildCalendarNumericQueryPlan(`yearly`, e3, 400 / Rd(t2, 400), (e4) => {
      let n3 = e4 * t2, r3 = a2 + n3;
      if (!Number.isSafeInteger(n3) || !Number.isSafeInteger(r3)) return null;
      let i3 = this.generateYearlyOccurrenceDaysUtc(r3);
      return i3.every((e5) => Z(e5 * Y)) ? i3 : [];
    }, r2);
  }
  buildNumericQueryPlan() {
    let e3 = this.opts.count, t2 = this.opts.interval;
    if (e3 === void 0 || !Number.isSafeInteger(e3) || e3 <= 0 || !Number.isSafeInteger(t2) || t2 <= 0 || !Number.isSafeInteger(this.maxIterations) || this.maxIterations <= 0 || this.maxCandidateEvaluations !== 1e6 || this.includeDtstart || this.opts.rscale !== void 0 || !this.canUseEpochMillisecondsPrecisionFlag || this.originalDtstart.timeZoneId !== this.tzid || ![`iso8601`, `gregory`].includes(this.originalDtstart.calendarId)) return null;
    let n2 = !!(this.opts.byMonth || this.opts.byMonthDay || this.opts.byYearDay || this.opts.byWeekNo || this.opts.bySetPos);
    switch (this.opts.freq) {
      case `HOURLY`:
      case `MINUTELY`:
      case `SECONDLY`:
        return n2 || this.opts.byDay || this.opts.byHour || this.opts.byMinute || this.opts.bySecond ? null : this.buildFixedStepNumericQueryPlan(e3);
      case `DAILY`:
        return n2 || this.hasOrdinalByDay || !this.hasUniqueTimeSlotOffsets ? null : this.buildDailyNumericQueryPlan(e3);
      case `WEEKLY`:
        return n2 || this.hasOrdinalByDay || !this.hasUniqueTimeSlotOffsets ? null : this.buildWeeklyNumericQueryPlan(e3);
      case `MONTHLY`:
        return this.opts.byYearDay || this.opts.byWeekNo || !(this.opts.byDay || this.opts.byMonthDay) || !this.hasUniqueTimeSlotOffsets ? null : this.buildMonthlyNumericQueryPlan(e3);
      case `YEARLY`:
        return this.buildYearlyNumericQueryPlan(e3);
      default:
        return null;
    }
  }
  getNumericQueryPlan() {
    if (this.numericQueryPlanCache !== void 0) return this.numericQueryPlanCache;
    try {
      this.numericQueryPlanCache = this.buildNumericQueryPlan(), this.numericQueryPlanCache && this.tzid !== `UTC` && this.resolveNumericWallMilliseconds(this.wallMsOf(this.originalDtstart)) !== this.originalDtstart.epochMilliseconds && (this.numericQueryPlanCache = null);
    } catch {
      this.numericQueryPlanCache = null;
    }
    return this.numericQueryPlanCache;
  }
  buildPeriodQueryPlan() {
    let e3 = this.opts.interval;
    if (this.opts.count !== void 0 || !Number.isSafeInteger(e3) || e3 <= 0 || !Number.isSafeInteger(this.maxIterations) || this.maxIterations <= 32 || this.maxCandidateEvaluations !== 1e6 || this.includeDtstart || this.opts.rscale !== void 0 || !this.canUseEpochMillisecondsPrecisionFlag || this.originalDtstart.timeZoneId !== this.tzid || ![`iso8601`, `gregory`].includes(this.originalDtstart.calendarId)) return null;
    let { freq: t2, byDay: n2, byMonth: r2, byMonthDay: i2, byYearDay: a2, byWeekNo: o2, bySetPos: s2 } = this.opts, c2 = !!(r2 || i2 || a2 || o2 || s2), l2 = !!(this.opts.byHour || this.opts.byMinute || this.opts.bySecond), u2 = this.tzid === `UTC` ? this.originalDtstart.epochMilliseconds : this.wallMsOf(this.originalDtstart), d2 = Math.floor(u2 / Y), f2 = this.timeSlotOffsetsMs;
    switch (t2) {
      case `HOURLY`:
      case `MINUTELY`:
      case `SECONDLY`: {
        if (c2 || n2 || l2 || ![`UTC`, `Etc/UTC`, `Etc/GMT`].includes(this.tzid) && !/^[-+]\d{2}:?\d{2}(?::?\d{2})?$/.test(this.tzid) && t2 === `HOURLY` && e3 === 1) return null;
        let r3 = (t2 === `HOURLY` ? Dd : t2 === `MINUTELY` ? Ed : Td) * e3;
        return Number.isSafeInteger(r3) ? { stepMilliseconds: r3, candidatesPerPeriod: 1, periodOfWall: () => 0, wallsForPeriod: () => null } : null;
      }
      case `DAILY`: {
        if (c2 || this.hasOrdinalByDay || !f2?.length || !this.hasUniqueTimeSlotOffsets) return null;
        let t3 = this.simpleByDayIsoDays;
        if (t3?.length && this.findFirstMatchingDailyStep(Jd(d2), e3, t3) === null) return null;
        let n3 = Bd(t3);
        return { candidatesPerPeriod: f2.length, periodOfWall: (t4) => Math.floor((Math.floor(t4 / Y) - d2) / e3), wallsForPeriod: (t4) => {
          let r3 = d2 + t4 * e3;
          return Number.isSafeInteger(r3) ? Vd(n3, Jd(r3)) ? f2.map((e4) => r3 * Y + e4) : [] : null;
        } };
      }
      case `WEEKLY`: {
        if (c2 || this.hasOrdinalByDay || !f2?.length || !this.hasUniqueTimeSlotOffsets) return null;
        let t3 = Jd(d2), r3 = J[$(this.opts.wkst || `MO`) ?? `MO`] ?? 1, i3 = (n2 ? [...this.allByDayIsoDays ?? []] : [t3]).map((e4) => (e4 - r3 + 7) % 7).sort((e4, t4) => e4 - t4);
        if (i3.length === 0) return null;
        let a3 = i3.flatMap((e4) => f2.map((t4) => e4 * Y + t4)), o3 = d2 - (t3 - r3 + 7) % 7, s3 = 7 * e3;
        return { candidatesPerPeriod: a3.length, periodOfWall: (e4) => Math.floor((Math.floor(e4 / Y) - o3) / s3), wallsForPeriod: (e4) => {
          let t4 = o3 + e4 * s3;
          return Number.isSafeInteger(t4) ? a3.map((e5) => t4 * Y + e5) : null;
        } };
      }
      case `MONTHLY`: {
        if (a2 || o2 || !f2?.length || !this.hasUniqueTimeSlotOffsets || r2?.some((e4) => typeof e4 != `number`)) return null;
        let t3 = this.originalDtstart.year * 12 + (this.originalDtstart.month - 1), n3 = (n4) => {
          let r3 = t3 + n4 * e3;
          if (!Number.isSafeInteger(r3)) return null;
          let i3 = this.monthIndexToYearMonth(r3);
          return Z(Kd(i3.year, i3.month, 1) * Y) ? i3 : null;
        };
        return { candidatesPerPeriod: 62 * f2.length, periodOfWall: (n4) => {
          let { year: r3, month: i3 } = qd(Math.floor(n4 / Y));
          return Math.floor((r3 * 12 + i3 - 1 - t3) / e3);
        }, wallsForPeriod: (e4) => {
          let t4 = n3(e4);
          return t4 && this.generateMonthlyOccurrenceEpochsUtc(t4.year, t4.month);
        }, rankedPeriodWallSpan: s2 ? (e4) => {
          let t4 = n3(e4);
          if (!t4) return null;
          let r3 = Kd(t4.year, t4.month, 1) * Y;
          return [r3, r3 + this.daysInGregorianMonth(t4.year, t4.month) * Y];
        } : void 0 };
      }
      case `YEARLY`: {
        if (a2 || o2 || !f2?.length || !this.hasUniqueTimeSlotOffsets || r2?.some((e4) => typeof e4 != `number`) || !(n2 || i2) && (f2.length !== 1 || r2 && s2) || this.hasOrdinalByDay && !this.numericByMonths?.length && (i2 || this.parsedByDayTokens?.some((e4) => e4.ord === 0 || Math.abs(e4.ord) > 52))) return null;
        let t3 = this.originalDtstart.year, c3 = (n3) => {
          let r3 = t3 + n3 * e3;
          return Number.isSafeInteger(r3) && r3 > -271821 && r3 < 275760 ? r3 : null;
        };
        return { candidatesPerPeriod: 2 * 366 * f2.length, periodOfWall: (n3) => Math.floor((qd(Math.floor(n3 / Y)).year - t3) / e3), wallsForPeriod: (e4) => {
          let t4 = c3(e4);
          return t4 === null ? null : this.generateYearlyOccurrenceEpochsUtc(t4);
        }, rankedPeriodWallSpan: s2 ? (e4) => {
          let t4 = c3(e4);
          return t4 === null ? null : [Kd(t4, 1, 1) * Y, Kd(t4 + 1, 1, 1) * Y];
        } : void 0 };
      }
    }
    return null;
  }
  getPeriodQueryPlan() {
    if (this.periodQueryPlanCache !== void 0) return this.periodQueryPlanCache;
    try {
      this.periodQueryPlanCache = this.buildPeriodQueryPlan(), this.periodQueryPlanCache && this.tzid !== `UTC` && this.resolveNumericWallMilliseconds(this.wallMsOf(this.originalDtstart)) !== this.originalDtstart.epochMilliseconds && (this.periodQueryPlanCache = null);
    } catch {
      this.periodQueryPlanCache = null;
    }
    return this.periodQueryPlanCache;
  }
  findFirstMatchingDailyStep(e3, t2, n2) {
    let r2 = e3;
    for (let e4 = 0; e4 < 7; e4++) {
      if (n2.includes(r2)) return e4;
      r2 = Q(r2, t2);
    }
    return null;
  }
  firstExpandedEpochMs(e3) {
    let t2 = this.originalDtstart.epochMilliseconds;
    return e3 ? Math.max(t2, e3.epochMilliseconds) : t2;
  }
  allUtcFastPath(e3, t2) {
    if (this.canUseUtcLinearFastPath(e3)) switch (this.opts.freq) {
      case `DAILY`:
        return this.opts.byHour || this.opts.byMinute || this.opts.bySecond ? this.hasUniqueTimeSlotOffsets ? this._allUtcDailyExpanded(t2) : null : this._allUtcDailySimple();
      case `HOURLY`:
        return this._allUtcFixedStepSimple(Nd * BigInt(this.opts.interval));
      case `MINUTELY`:
        return this._allUtcFixedStepSimple(Md * BigInt(this.opts.interval));
      case `SECONDLY`:
        return this._allUtcFixedStepSimple(jd * BigInt(this.opts.interval));
    }
    return this.canUseUtcMonthlyFastPath(e3) ? this._allUtcMonthlyByDayOrMonthDay() : this.canUseUtcWeeklyFastPath(e3) ? this.opts.byHour || this.opts.byMinute || this.opts.bySecond ? this.hasUniqueTimeSlotOffsets ? this._allUtcWeeklyExpanded(t2) : null : this._allUtcWeeklySimple() : null;
  }
  _allUtcFixedStepSimple(e3) {
    let t2 = [];
    if (!this.addDtstartIfNeeded(t2)) return t2;
    let n2 = 0;
    if (this.canUseUtcEpochMillisecondsPrecision()) {
      let r3 = this.originalDtstart.epochMilliseconds, i3 = Number(e3 / X), a2 = this.opts.until?.epochMilliseconds;
      for (; ; ) {
        if (++n2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
        if (a2 !== void 0 && r3 > a2 || (t2.push(this.utcZdtFromEpochMilliseconds(r3)), this.shouldBreakForCountLimit(t2.length))) break;
        r3 += i3;
      }
      return t2;
    }
    let r2 = this.originalDtstart.epochNanoseconds, i2 = this.opts.until?.epochNanoseconds;
    for (; ; ) {
      if (++n2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      if (i2 !== void 0 && r2 > i2 || (t2.push(this.utcZdtFromEpochNanoseconds(r2)), this.shouldBreakForCountLimit(t2.length))) break;
      r2 += e3;
    }
    return t2;
  }
  _allUtcDailySimple() {
    let e3 = [];
    if (!this.addDtstartIfNeeded(e3)) return e3;
    let t2 = this.opts.interval, n2 = this.simpleByDayIsoDays, r2 = 0;
    if (this.canUseUtcEpochMillisecondsPrecision()) {
      let i3 = t2 * Y, a3 = this.opts.until?.epochMilliseconds, o3 = this.originalDtstart.epochMilliseconds, s3 = this.originalDtstart.dayOfWeek;
      if (n2?.length) {
        let r3 = this.findFirstMatchingDailyStep(s3, t2, n2);
        if (r3 === null) return e3;
        o3 += r3 * i3, s3 = Q(s3, r3 * t2);
      }
      for (; ; ) {
        if (++r2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
        if (a3 !== void 0 && o3 > a3 || (!n2 || n2.includes(s3)) && (e3.push(this.utcZdtFromEpochMilliseconds(o3)), this.assertFastPathBudget(e3), this.shouldBreakForCountLimit(e3.length))) break;
        o3 += i3, s3 = Q(s3, t2);
      }
      return e3;
    }
    let i2 = BigInt(t2) * Pd, a2 = this.opts.until?.epochNanoseconds, o2 = this.originalDtstart.epochNanoseconds, s2 = this.originalDtstart.dayOfWeek;
    if (n2?.length) {
      let r3 = this.findFirstMatchingDailyStep(s2, t2, n2);
      if (r3 === null) return e3;
      o2 += BigInt(r3) * i2, s2 = Q(s2, r3 * t2);
    }
    for (; ; ) {
      if (++r2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      if (a2 !== void 0 && o2 > a2 || (!n2 || n2.includes(s2)) && (e3.push(this.utcZdtFromEpochNanoseconds(o2)), this.assertFastPathBudget(e3), this.shouldBreakForCountLimit(e3.length))) break;
      o2 += i2, s2 = Q(s2, t2);
    }
    return e3;
  }
  _allUtcDailyExpanded(e3) {
    let t2 = [];
    if (!this.addDtstartIfNeeded(t2)) return t2;
    let n2 = this.timeSlotOffsetsMs, r2 = this.originalDtstart.epochMilliseconds, i2 = this.firstExpandedEpochMs(e3), a2 = this.opts.until?.epochMilliseconds, o2 = this.opts.interval, s2 = this.simpleByDayIsoDays, c2 = Math.floor(r2 / Y), l2 = this.originalDtstart.dayOfWeek;
    if (s2?.length) {
      let e4 = this.findFirstMatchingDailyStep(l2, o2, s2);
      if (e4 === null) return t2;
      let n3 = e4 * o2;
      c2 += n3, l2 = Q(l2, n3);
    }
    let u2 = 0;
    for (; ; ) {
      if (++u2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      if (!s2 || s2.includes(l2)) {
        let e4 = c2 * Y;
        for (let r3 of n2) {
          let n3 = e4 + r3;
          if (!(n3 < i2) && (a2 !== void 0 && n3 > a2 || (t2.push(this.utcZdtFromEpochMilliseconds(n3)), this.assertFastPathBudget(t2), this.shouldBreakForCountLimit(t2.length)))) return t2;
        }
      }
      c2 += o2, l2 = Q(l2, o2);
    }
  }
  _allUtcWeeklySimple() {
    let e3 = [];
    if (!this.addDtstartIfNeeded(e3)) return e3;
    let t2 = this.originalDtstart, n2 = J[$(this.opts.wkst || `MO`) ?? `MO`] ?? 1, r2 = (this.opts.byDay ? [...this.allByDayIsoDays ?? []] : [t2.dayOfWeek]).map((e4) => (e4 - n2 + 7) % 7).sort((e4, t3) => e4 - t3), i2 = (t2.dayOfWeek - n2 + 7) % 7, a2 = 0;
    if (this.canUseUtcEpochMillisecondsPrecision()) {
      let n3 = t2.epochMilliseconds, o3 = this.opts.until?.epochMilliseconds, s3 = this.opts.interval * Od, c3 = n3 - i2 * Y;
      for (; ; ) {
        if (++a2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
        for (let t3 of r2) {
          let r3 = c3 + t3 * Y;
          if (!(r3 < n3) && (o3 !== void 0 && r3 > o3 || (e3.push(this.utcZdtFromEpochMilliseconds(r3)), this.assertFastPathBudget(e3), this.shouldBreakForCountLimit(e3.length)))) return e3;
        }
        c3 += s3;
      }
    }
    let o2 = t2.epochNanoseconds, s2 = this.opts.until?.epochNanoseconds, c2 = BigInt(this.opts.interval) * Fd, l2 = o2 - BigInt(i2) * Pd;
    for (; ; ) {
      if (++a2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      for (let t3 of r2) {
        let n3 = l2 + BigInt(t3) * Pd;
        if (!(n3 < o2) && (s2 !== void 0 && n3 > s2 || (e3.push(this.utcZdtFromEpochNanoseconds(n3)), this.assertFastPathBudget(e3), this.shouldBreakForCountLimit(e3.length)))) return e3;
      }
      l2 += c2;
    }
  }
  _allUtcWeeklyExpanded(e3) {
    let t2 = [];
    if (!this.addDtstartIfNeeded(t2)) return t2;
    let n2 = this.originalDtstart, r2 = n2.epochMilliseconds, i2 = this.firstExpandedEpochMs(e3), a2 = Math.floor(r2 / Y), o2 = this.opts.until?.epochMilliseconds, s2 = this.timeSlotOffsetsMs, c2 = J[$(this.opts.wkst || `MO`) ?? `MO`] ?? 1, l2 = (this.opts.byDay ? [...this.allByDayIsoDays ?? []] : [n2.dayOfWeek]).map((e4) => (e4 - c2 + 7) % 7).sort((e4, t3) => e4 - t3), u2 = (n2.dayOfWeek - c2 + 7) % 7, d2 = this.opts.interval * 7, f2 = a2 - u2, p2 = 0;
    for (; ; ) {
      if (++p2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      for (let e4 of l2) {
        let n3 = (f2 + e4) * Y;
        for (let e5 of s2) {
          let r3 = n3 + e5;
          if (!(r3 < i2) && (o2 !== void 0 && r3 > o2 || (t2.push(this.utcZdtFromEpochMilliseconds(r3)), this.assertFastPathBudget(t2), this.shouldBreakForCountLimit(t2.length)))) return t2;
        }
      }
      f2 += d2;
    }
  }
  hasSingleExpandedTimeSlot() {
    if (this.timeSlotOffsetsMs) return this.timeSlotOffsetsMs.length === 1;
    let e3 = this.opts.byHour ?? [this.originalDtstart.hour], t2 = this.opts.byMinute ?? [this.originalDtstart.minute], n2 = this.opts.bySecond ?? [this.originalDtstart.second];
    return e3.length === 1 && t2.length === 1 && n2.length === 1;
  }
  buildMonthlyOccurrenceOnDay(e3, t2) {
    let n2 = e3.day === t2 ? e3 : e3.with({ day: t2 });
    return this.applyTimeOverride(n2);
  }
  applyBySetPosToSortedList(e3) {
    let { bySetPos: t2 } = this.opts;
    if (!t2 || !t2.length || e3.length === 0) return e3;
    let n2 = [], r2 = e3.length;
    for (let i2 of t2) {
      let t3 = i2 > 0 ? i2 - 1 : r2 + i2;
      t3 >= 0 && t3 < r2 && n2.push(e3[t3]);
    }
    return n2;
  }
  generateMonthlyOccurrenceDays(e3) {
    let { byDay: t2, byMonth: n2, byMonthDay: r2 } = this.opts, i2 = e3.day === 1 ? e3 : e3.with({ day: 1 });
    if (n2 && !n2.includes(e3.month)) return [];
    let a2 = i2.add({ months: 1 }).subtract({ days: 1 }).day, o2 = [];
    if (r2 && r2.length > 0 && (o2 = r2.map((e4) => e4 > 0 ? e4 : a2 + e4 + 1).filter((e4) => e4 >= 1 && e4 <= a2), o2 = [...new Set(o2)].sort((e4, t3) => e4 - t3)), !t2 && r2 && r2.length > 0) return o2;
    if (!t2) return [e3.day];
    let s2 = this.parsedByDayTokens;
    if (!s2?.length) return [];
    let c2 = i2.dayOfWeek, l2 = (c2 - 1 + a2 - 1) % 7 + 1, u2 = /* @__PURE__ */ new Set();
    for (let { ord: e4, isoDay: t3 } of s2) if (e4 === 0) {
      let e5 = 1 + (t3 - c2 + 7) % 7;
      for (; e5 <= a2; ) u2.add(e5), e5 += 7;
    } else {
      let n3;
      n3 = e4 > 0 ? 1 + (t3 - c2 + 7) % 7 + 7 * (e4 - 1) : a2 - (l2 - t3 + 7) % 7 + 7 * (e4 + 1), n3 >= 1 && n3 <= a2 && u2.add(n3);
    }
    let d2 = [...u2].sort((e4, t3) => e4 - t3);
    if (r2 && r2.length > 0) {
      if (o2.length === 0) return [];
      let e4 = new Set(o2);
      d2 = d2.filter((t3) => e4.has(t3));
    }
    return d2;
  }
  isGregorianLeapYear(e3) {
    return e3 % 4 == 0 && (e3 % 100 != 0 || e3 % 400 == 0);
  }
  daysInGregorianMonth(e3, t2) {
    return t2 === 2 && this.isGregorianLeapYear(e3) ? 29 : kd[t2 - 1];
  }
  gregorianIsoDayOfWeek(e3, t2, n2) {
    let r2 = e3;
    t2 < 3 && --r2;
    let i2 = ((r2 + Math.floor(r2 / 4) - Math.floor(r2 / 100) + Math.floor(r2 / 400) + Ad[t2 - 1] + n2) % 7 + 7) % 7;
    return i2 === 0 ? 7 : i2;
  }
  monthIndexToYearMonth(e3) {
    let t2 = Math.floor(e3 / 12);
    return { year: t2, month: e3 - t2 * 12 + 1 };
  }
  generateMonthlyOccurrenceDaysUtc(e3, t2) {
    if (this.numericByMonths && this.numericByMonths.length > 0 && !this.numericByMonths.includes(t2)) return [];
    let n2 = this.opts.byMonthDay, r2 = this.opts.byDay, i2 = this.daysInGregorianMonth(e3, t2), a2 = [];
    if (n2 && n2.length > 0 && (a2 = n2.map((e4) => e4 > 0 ? e4 : i2 + e4 + 1).filter((e4) => e4 >= 1 && e4 <= i2), a2 = [...new Set(a2)].sort((e4, t3) => e4 - t3)), !r2 && n2 && n2.length > 0) return a2;
    if (!r2) {
      let e4 = this.originalDtstart.day;
      return e4 >= 1 && e4 <= i2 ? [e4] : [];
    }
    let o2 = this.parsedByDayTokens;
    if (!o2?.length) return [];
    let s2 = this.gregorianIsoDayOfWeek(e3, t2, 1), c2 = Q(s2, i2 - 1), l2 = /* @__PURE__ */ new Set();
    for (let { ord: e4, isoDay: t3 } of o2) if (e4 === 0) {
      let e5 = 1 + (t3 - s2 + 7) % 7;
      for (; e5 <= i2; ) l2.add(e5), e5 += 7;
    } else {
      let n3;
      n3 = e4 > 0 ? 1 + (t3 - s2 + 7) % 7 + 7 * (e4 - 1) : i2 - (c2 - t3 + 7) % 7 + 7 * (e4 + 1), n3 >= 1 && n3 <= i2 && l2.add(n3);
    }
    let u2 = [...l2].sort((e4, t3) => e4 - t3);
    if (n2 && n2.length > 0) {
      if (a2.length === 0) return [];
      let e4 = new Set(a2);
      u2 = u2.filter((t3) => e4.has(t3));
    }
    return u2;
  }
  generateMonthlyOccurrenceEpochsUtc(e3, t2) {
    let n2 = this.generateMonthlyOccurrenceDaysUtc(e3, t2);
    if (n2.length === 0) return [];
    let r2 = Kd(e3, t2, 1) * Y;
    if (!Z(r2)) return [];
    let i2 = this.timeSlotOffsetsMs ?? [0];
    if (this.opts.bySetPos && this.opts.bySetPos.length > 0) {
      if (i2.length === 1) {
        let e5 = this.applyBySetPosToSortedList(n2).sort((e6, t5) => e6 - t5), t4 = i2[0];
        return e5.filter((t5, n3) => n3 === 0 || t5 !== e5[n3 - 1]).map((e6) => r2 + (e6 - 1) * Y + t4);
      }
      let e4 = [];
      for (let t4 of n2) {
        let n3 = r2 + (t4 - 1) * Y;
        for (let t5 of i2) e4.push(n3 + t5);
      }
      let t3 = this.applyBySetPosToSortedList(e4).sort((e5, t4) => e5 - t4);
      return t3.filter((e5, n3) => n3 === 0 || e5 !== t3[n3 - 1]);
    }
    let a2 = [];
    for (let e4 of n2) {
      let t3 = r2 + (e4 - 1) * Y;
      for (let e5 of i2) a2.push(t3 + e5);
    }
    return a2;
  }
  _allUtcMonthlyByDayOrMonthDay() {
    let e3 = [], t2 = this.originalDtstart.epochMilliseconds, n2 = this.opts.until?.epochMilliseconds, r2 = 0;
    if (!this.addDtstartIfNeeded(e3)) return e3;
    let i2 = this.opts.until?.withTimeZone(this.tzid).withCalendar(`iso8601`), a2 = i2 ? i2.year * 12 + i2.month - 1 : void 0, o2 = this.originalDtstart.year * 12 + (this.originalDtstart.month - 1);
    for (; ; ) {
      if (a2 !== void 0 && o2 > a2) return e3;
      if (++r2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      let { year: i3, month: s2 } = this.monthIndexToYearMonth(o2), c2 = this.generateMonthlyOccurrenceEpochsUtc(i3, s2);
      for (let r3 of c2) if (!(r3 < t2) && (n2 !== void 0 && r3 > n2 || (e3.push(this.utcZdtFromEpochMilliseconds(r3)), this.assertFastPathBudget(e3), this.shouldBreakForCountLimit(e3.length)))) return e3;
      o2 += this.opts.interval;
    }
  }
  getZoneResolver() {
    return this.zoneResolver ??= vd(this.tzid);
  }
  zdtFromEpochMs(e3) {
    if (ld || this.tzid === `UTC`) return new q.ZonedDateTime(BigInt(e3) * X, this.tzid, this.originalDtstart.calendarId);
    let t2 = this.emitAnchorZdt;
    return t2 ? t2.add({ milliseconds: e3 - t2.epochMilliseconds }) : (t2 = this.emitAnchorZdt = new q.ZonedDateTime(BigInt(e3) * X, this.tzid, this.originalDtstart.calendarId), t2);
  }
  wallMsOf(e3) {
    return e3.epochMilliseconds + e3.offsetNanoseconds / 1e6;
  }
  canUseTzEpochFastPaths(e3) {
    return !(e3 || this.tzid === `UTC` || this.originalDtstart.timeZoneId !== this.tzid || this.opts.freq === `YEARLY` || this.opts.rscale || ![`iso8601`, `gregory`].includes(this.originalDtstart.calendarId) || !this.canUseEpochMillisecondsPrecisionFlag || this.resolveNumericWallMilliseconds(this.wallMsOf(this.originalDtstart)) !== this.originalDtstart.epochMilliseconds);
  }
  tzFastPathGapHazard(e3) {
    let t2 = this.originalDtstart.epochMilliseconds, n2;
    if (this.opts.until) n2 = this.opts.until.epochMilliseconds;
    else if (this.opts.count !== void 0) {
      let e4 = this.tzFastPathCountSpanMs(this.opts.count);
      if (e4 === void 0) return true;
      n2 = t2 + e4 + 30 * Y;
    } else return true;
    return 150 * 366 * Y, n2 - t2 > 474336e7 ? true : this.getZoneResolver().timeOfDayMayHitGap(e3, t2 - Y, n2 + Y);
  }
  tzFastPathCountSpanMs(e3) {
    let t2 = this.opts.interval, n2 = this.timeSlotOffsetsMs?.length ?? 1, r2 = this.wallMsOf(this.originalDtstart);
    switch (this.opts.freq) {
      case `DAILY`: {
        let i2 = this.simpleByDayIsoDays, a2 = i2?.length ? 7 / Rd(t2, 7) : 1, o2 = a2;
        if (i2?.length) {
          let e4 = Jd(Math.floor(r2 / Y));
          o2 = 0;
          for (let n3 = 0; n3 < a2; n3++) i2.includes(Q(e4, n3 * t2)) && o2++;
          if (o2 === 0) return 0;
        }
        return (Math.ceil(e3 / (o2 * n2)) + 1) * a2 * t2 * Y;
      }
      case `WEEKLY`: {
        let r3 = this.opts.byDay ? this.allByDayIsoDays?.length ?? 0 : 1;
        return r3 === 0 ? 0 : (Math.ceil(e3 / (r3 * n2)) + 1) * t2 * Od;
      }
    }
  }
  allTzEpochFastPath(e3, t2) {
    if (!this.canUseTzEpochFastPaths(e3)) return null;
    let n2 = !this.opts.byMonth && !this.opts.byMonthDay && !this.opts.byYearDay && !this.opts.byWeekNo && !this.opts.bySetPos;
    if (n2) switch (this.opts.freq) {
      case `DAILY`:
        if (!this.hasOrdinalByDay) return this.opts.byHour || this.opts.byMinute || this.opts.bySecond ? this.hasUniqueTimeSlotOffsets ? this._allTzDailyExpanded(t2) : null : this._allTzDailySimple();
        break;
      case `HOURLY`:
      case `MINUTELY`:
      case `SECONDLY`:
        if (!this.opts.byDay && !this.opts.byHour && !this.opts.byMinute && !this.opts.bySecond) {
          let e4 = this.opts.freq === `HOURLY` ? Dd : this.opts.freq === `MINUTELY` ? Ed : Td;
          return this._allTzFixedStepSimple(e4 * this.opts.interval);
        }
        break;
    }
    return this.opts.freq === `MONTHLY` && !this.opts.byYearDay && !this.opts.byWeekNo && this.hasSingleExpandedTimeSlot() && (this.opts.byDay || this.opts.byMonthDay) ? this._allTzMonthlyByDayOrMonthDay() : this.opts.freq === `WEEKLY` && n2 && !this.hasOrdinalByDay && this.hasUniqueTimeSlotOffsets ? this.opts.byHour || this.opts.byMinute || this.opts.bySecond ? this._allTzWeeklyExpanded(t2) : this._allTzWeeklySimple() : null;
  }
  _allTzDailySimple() {
    let e3 = [];
    if (!this.addDtstartIfNeeded(e3)) return e3;
    let t2 = this.getZoneResolver(), n2 = this.wallMsOf(this.originalDtstart), r2 = Math.floor(n2 / Y), i2 = n2 - r2 * Y;
    if (this.tzFastPathGapHazard(i2)) return null;
    let a2 = this.opts.interval, o2 = this.simpleByDayIsoDays, s2 = this.opts.until?.epochMilliseconds, c2 = Jd(r2);
    if (o2?.length) {
      let t3 = this.findFirstMatchingDailyStep(c2, a2, o2);
      if (t3 === null) return e3;
      r2 += t3 * a2, c2 = Q(c2, t3 * a2);
    }
    let l2 = 0;
    for (; ; ) {
      if (++l2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      if (!o2 || o2.includes(c2)) {
        let n3 = t2.epochMsForWall(r2 * Y + i2);
        if (n3.pushed) return null;
        if (s2 !== void 0 && n3.epochMs > s2 || (e3.push(this.zdtFromEpochMs(n3.epochMs)), this.assertFastPathBudget(e3), this.shouldBreakForCountLimit(e3.length))) break;
      }
      r2 += a2, c2 = Q(c2, a2);
    }
    return e3;
  }
  _allTzDailyExpanded(e3) {
    let t2 = [];
    if (!this.addDtstartIfNeeded(t2)) return t2;
    let n2 = this.getZoneResolver(), r2 = this.firstExpandedEpochMs(e3), i2 = this.wallMsOf(this.originalDtstart), a2 = this.timeSlotOffsetsMs;
    for (let e4 of a2) if (this.tzFastPathGapHazard(e4)) return null;
    let o2 = this.opts.interval, s2 = this.simpleByDayIsoDays, c2 = this.opts.until?.epochMilliseconds, l2 = Math.floor(i2 / Y), u2 = Jd(l2);
    if (s2?.length) {
      let e4 = this.findFirstMatchingDailyStep(u2, o2, s2);
      if (e4 === null) return t2;
      let n3 = e4 * o2;
      l2 += n3, u2 = Q(u2, n3);
    }
    let d2 = 0;
    for (; ; ) {
      if (++d2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      if (!s2 || s2.includes(u2)) {
        let e4 = l2 * Y;
        for (let i3 of a2) {
          let a3 = n2.epochMsForWall(e4 + i3);
          if (a3.pushed) return null;
          if (!(a3.epochMs < r2) && (c2 !== void 0 && a3.epochMs > c2 || (t2.push(this.zdtFromEpochMs(a3.epochMs)), this.assertFastPathBudget(t2), this.shouldBreakForCountLimit(t2.length)))) return t2;
        }
      }
      l2 += o2, u2 = Q(u2, o2);
    }
  }
  _allTzFixedStepSimple(e3) {
    let t2 = [];
    if (!this.addDtstartIfNeeded(t2)) return t2;
    let n2 = this.getZoneResolver(), r2 = this.opts.until?.epochMilliseconds, i2 = this.opts.freq === `HOURLY` && this.opts.interval === 1, a2 = (e4) => {
      let t3 = e4 + n2.offsetMsAt(e4);
      return Math.floor((t3 % Y + Y) % Y / Dd);
    }, o2 = this.originalDtstart.epochMilliseconds, s2 = 0;
    for (; ; ) {
      if (++s2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      if (r2 !== void 0 && o2 > r2 || (t2.push(this.zdtFromEpochMs(o2)), this.shouldBreakForCountLimit(t2.length))) break;
      let n3 = o2 + e3;
      i2 && a2(n3) === a2(o2) && (n3 += e3), o2 = n3;
    }
    return t2;
  }
  _allTzWeeklySimple() {
    let e3 = [];
    if (!this.addDtstartIfNeeded(e3)) return e3;
    let t2 = this.getZoneResolver(), n2 = this.originalDtstart, r2 = n2.epochMilliseconds, i2 = this.wallMsOf(n2), a2 = Math.floor(i2 / Y), o2 = i2 - a2 * Y;
    if (this.tzFastPathGapHazard(o2)) return null;
    let s2 = Jd(a2), c2 = J[$(this.opts.wkst || `MO`) ?? `MO`] ?? 1, l2 = (this.opts.byDay ? [...this.allByDayIsoDays ?? []] : [s2]).map((e4) => (e4 - c2 + 7) % 7).sort((e4, t3) => e4 - t3), u2 = (s2 - c2 + 7) % 7, d2 = this.opts.until?.epochMilliseconds, f2 = this.opts.interval * 7, p2 = a2 - u2, m2 = 0;
    for (; ; ) {
      if (++m2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      for (let n3 of l2) {
        let i3 = t2.epochMsForWall((p2 + n3) * Y + o2);
        if (i3.pushed) return null;
        if (!(i3.epochMs < r2) && (d2 !== void 0 && i3.epochMs > d2 || (e3.push(this.zdtFromEpochMs(i3.epochMs)), this.assertFastPathBudget(e3), this.shouldBreakForCountLimit(e3.length)))) return e3;
      }
      p2 += f2;
    }
  }
  _allTzWeeklyExpanded(e3) {
    let t2 = [];
    if (!this.addDtstartIfNeeded(t2)) return t2;
    let n2 = this.getZoneResolver(), r2 = this.originalDtstart, i2 = this.firstExpandedEpochMs(e3), a2 = this.wallMsOf(r2), o2 = Math.floor(a2 / Y), s2 = this.timeSlotOffsetsMs;
    for (let e4 of s2) if (this.tzFastPathGapHazard(e4)) return null;
    let c2 = Jd(o2), l2 = J[$(this.opts.wkst || `MO`) ?? `MO`] ?? 1, u2 = (this.opts.byDay ? [...this.allByDayIsoDays ?? []] : [c2]).map((e4) => (e4 - l2 + 7) % 7).sort((e4, t3) => e4 - t3), d2 = (c2 - l2 + 7) % 7, f2 = this.opts.until?.epochMilliseconds, p2 = this.opts.interval * 7, m2 = o2 - d2, h2 = 0;
    for (; ; ) {
      if (++h2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      for (let e4 of u2) {
        let r3 = (m2 + e4) * Y;
        for (let e5 of s2) {
          let a3 = n2.epochMsForWall(r3 + e5);
          if (a3.pushed) return null;
          if (!(a3.epochMs < i2) && (f2 !== void 0 && a3.epochMs > f2 || (t2.push(this.zdtFromEpochMs(a3.epochMs)), this.assertFastPathBudget(t2), this.shouldBreakForCountLimit(t2.length)))) return t2;
        }
      }
      m2 += p2;
    }
  }
  _allTzMonthlyByDayOrMonthDay() {
    let e3 = [];
    if (!this.addDtstartIfNeeded(e3)) return e3;
    let t2 = this.getZoneResolver(), n2 = this.originalDtstart.epochMilliseconds, r2 = this.opts.until?.epochMilliseconds, i2 = this.opts.bySetPos ? this.timeSlotOffsetsMs[0] : void 0, a2 = this.opts.until?.withTimeZone(this.tzid).withCalendar(`iso8601`), o2 = a2 ? a2.year * 12 + a2.month - 1 : void 0, s2 = this.originalDtstart.year * 12 + (this.originalDtstart.month - 1), c2 = 0;
    for (; ; ) {
      if (o2 !== void 0 && s2 > o2) return e3;
      if (++c2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      let { year: a3, month: l2 } = this.monthIndexToYearMonth(s2);
      if (i2 !== void 0) {
        let e4 = Kd(a3, l2, 1) * Y, n3 = e4 + this.daysInGregorianMonth(a3, l2) * Y;
        if (t2.timeOfDayMayHitGap(i2, e4 - Y, n3 + Y)) return null;
      }
      for (let i3 of this.generateMonthlyOccurrenceEpochsUtc(a3, l2)) {
        let a4 = t2.epochMsForWall(i3);
        if (a4.pushed) return null;
        if (!(a4.epochMs < n2) && (r2 !== void 0 && a4.epochMs > r2 || (e3.push(this.zdtFromEpochMs(a4.epochMs)), this.assertFastPathBudget(e3), this.shouldBreakForCountLimit(e3.length)))) return e3;
      }
      s2 += this.opts.interval;
    }
  }
  processOccurrences(e3, t2, n2, r2, i2) {
    for (let a2 of e3) if (!this.processOccurrence(a2, t2, n2, r2, i2)) return { shouldBreak: true };
    return { shouldBreak: false };
  }
  processOccurrence(e3, t2, n2, r2, i2, a2) {
    if (a2) {
      if (a2.seenOccurrences.size === 0 && t2.length > 0) for (let e4 of t2) a2.seenOccurrences.add(e4.epochNanoseconds);
      if (a2.seenOccurrences.has(e3.epochNanoseconds)) return true;
      a2.seenOccurrences.add(e3.epochNanoseconds);
    }
    return q.ZonedDateTime.compare(e3, n2) < 0 ? true : this.opts.until && q.ZonedDateTime.compare(e3, this.opts.until) > 0 ? false : i2 && !i2(e3) || r2 && this.isExcluded(e3) ? true : r2 && !r2(e3, t2.length) ? false : (t2.push(e3), !this.shouldBreakForCountLimit(t2.length));
  }
  _allMonthlyByDayOrMonthDay(e3, t2) {
    let n2 = [], r2 = this.createCandidateWorkBudget(), i2 = 0, a2 = this.originalDtstart;
    if (!this.addDtstartIfNeeded(n2, e3)) return this.applyCountLimitAndMergeRDates(n2, e3);
    let o2 = a2.toPlainDate().with({ day: 1 });
    for (; ; ) {
      if (++i2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      let s2 = (t3) => this.processOccurrence(t3, n2, a2, e3, void 0, r2);
      if (!(this.visitUtcPeriodCandidates(o2, s2, t2 ?? a2, this.opts.until, r2) ?? this.visitPeriodCandidates(this.generateMonthlyDateCandidates(o2), s2, t2 ?? a2, this.opts.until, r2))) break;
      try {
        o2 = o2.add({ months: this.opts.interval });
      } catch {
        break;
      }
      if (this.opts.until) {
        let e4 = this.opts.until.withTimeZone(a2.timeZoneId).withCalendar(a2.calendarId);
        if (o2.year * 12 + o2.month > e4.year * 12 + e4.month) break;
      }
    }
    return this.applyCountLimitAndMergeRDates(n2, e3);
  }
  _allWeekly(e3, t2) {
    let n2 = [], r2 = this.createCandidateWorkBudget(), i2 = 0, a2 = this.originalDtstart;
    if (!this.addDtstartIfNeeded(n2, e3)) return this.applyCountLimitAndMergeRDates(n2, e3);
    let o2 = J, s2 = this.opts.byDay ? [...this.allByDayIsoDays ?? []] : this.opts.byMonthDay && this.opts.byMonthDay.length > 0 ? [...Object.values(o2)] : [a2.dayOfWeek], c2 = o2[$(this.opts.wkst || `MO`) ?? `MO`] ?? 1, l2 = (a2.dayOfWeek - c2 + 7) % 7, u2 = a2.toPlainDate().subtract({ days: l2 });
    for (; ; ) {
      if (++i2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      let o3 = s2.map((e4) => {
        let t3 = (e4 - c2 + 7) % 7;
        return u2.add({ days: t3 });
      }).filter((e4) => this.matchesByMonth(e4) && this.matchesByMonthDay(e4));
      if (!this.visitPeriodCandidates(o3, (t3) => this.processOccurrence(t3, n2, a2, e3, void 0, r2), t2 ?? a2, this.opts.until, r2)) break;
      try {
        u2 = u2.add({ weeks: this.opts.interval });
      } catch {
        break;
      }
      if (this.opts.until) {
        let e4 = this.opts.until.withTimeZone(a2.timeZoneId).withCalendar(a2.calendarId);
        if (q.PlainDate.compare(u2, e4.toPlainDate()) > 0) break;
      }
    }
    return this.applyCountLimitAndMergeRDates(n2, e3);
  }
  _allYearlyComplex(e3, t2) {
    let n2 = [], r2 = this.createCandidateWorkBudget(), i2 = 0, a2 = this.originalDtstart;
    if (!this.addDtstartIfNeeded(n2, e3) || this.opts.until && q.ZonedDateTime.compare(this.opts.until, a2) < 0) return this.applyCountLimitAndMergeRDates(n2, e3);
    let o2 = a2.toPlainDate().with({ month: 1, day: 1 }), s2 = this.opts.until ? this.opts.until.withTimeZone(a2.timeZoneId).withCalendar(a2.calendarId).year + (this.opts.byWeekNo ? 1 : 0) : void 0;
    for (; ; ) {
      if (++i2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      let c2 = (t3) => this.processOccurrence(t3, n2, a2, e3, void 0, r2);
      if (!(this.visitUtcPeriodCandidates(o2, c2, t2 ?? a2, this.opts.until, r2) ?? this.visitPeriodCandidates(this.generateYearlyDateCandidates(o2), c2, t2 ?? a2, this.opts.until, r2))) break;
      let l2 = this.opts.freq === `WEEKLY` ? 1 : this.opts.interval;
      try {
        o2 = o2.add({ years: l2 });
      } catch {
        break;
      }
      if (s2 !== void 0 && o2.year > s2) break;
    }
    return this.applyCountLimitAndMergeRDates(n2, e3);
  }
  _allMinutelySecondlyComplex(e3) {
    let t2 = [], n2 = 0;
    if (!this.addDtstartIfNeeded(t2, e3)) return this.applyCountLimitAndMergeRDates(t2, e3);
    let r2 = this.computeFirst();
    for (; ; ) {
      if (++n2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      if (this.opts.until && q.ZonedDateTime.compare(r2, this.opts.until) > 0) break;
      if (this.matchesAll(r2)) {
        if (e3 && this.isExcluded(r2)) {
          r2 = this.nextCandidateSameDate(r2);
          continue;
        }
        if (e3 && !e3(r2, t2.length) || (t2.push(r2), this.shouldBreakForCountLimit(t2.length))) break;
        r2 = this.nextCandidateSameDate(r2);
      } else r2 = this.findNextValidDate(r2);
    }
    return this.applyCountLimitAndMergeRDates(t2, e3);
  }
  _allMonthlyByWeekNo(e3, t2) {
    let n2 = [], r2 = this.createCandidateWorkBudget(), i2 = 0, a2 = this.originalDtstart;
    if (!this.addDtstartIfNeeded(n2, e3)) return this.applyCountLimitAndMergeRDates(n2, e3);
    let o2 = a2, s2 = [...this.opts.byWeekNo].sort((e4, t3) => e4 - t3), c2 = this.opts.interval, l2 = this.opts.until ? this.opts.until.withTimeZone(a2.timeZoneId).withCalendar(a2.calendarId).year + 1 : void 0, u2 = 0, d2 = -1;
    outer_loop: for (; !this.shouldBreakForCountLimit(n2.length); ) {
      if (++i2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      let f2 = o2.year;
      if (f2 !== d2 && o2.month >= a2.month) {
        d2 = f2;
        let i3 = s2.flatMap((e4) => this.generateDateCandidatesForWeekInYear(f2, e4));
        if (!this.visitDateTimeCandidates(i3, 1, (t3) => this.processOccurrence(t3, n2, a2, e3, void 0, r2), t2 ?? a2, this.opts.until, r2)) break outer_loop;
      }
      if (u2 += c2, o2 = a2.add({ months: u2 }), l2 !== void 0 && o2.year > l2) break;
    }
    return this.applyCountLimitAndMergeRDates(n2, e3);
  }
  _allMonthlyByYearDay(e3, t2) {
    let n2 = [], r2 = this.createCandidateWorkBudget(), i2 = 0, a2 = this.originalDtstart;
    if (!this.addDtstartIfNeeded(n2, e3)) return this.applyCountLimitAndMergeRDates(n2, e3);
    let o2 = a2.year, s2 = [...this.opts.byYearDay].sort((e4, t3) => e4 - t3), c2 = this.opts.interval, l2 = a2.year * 12 + a2.month;
    outer_loop: for (; !this.shouldBreakForCountLimit(n2.length); ) {
      if (++i2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      let u2 = a2.toPlainDate().with({ year: o2, month: 1, day: 1 }), d2 = u2.with({ month: 12, day: 31 }).dayOfYear, f2 = [];
      for (let e4 of s2) {
        let t3 = e4 > 0 ? e4 : d2 + e4 + 1;
        t3 <= 0 || t3 > d2 || f2.push(u2.add({ days: t3 - 1 }));
      }
      if (!this.visitDateTimeCandidates(f2, 1, (t3) => (t3.year * 12 + t3.month - l2) % c2 !== 0 || !this.matchesByMonth(t3) ? true : this.processOccurrence(t3, n2, a2, e3, void 0, r2), t2 ?? a2, this.opts.until, r2)) break outer_loop;
      if (o2++, this.opts.until && o2 > this.opts.until.year + 2) break;
      if (!this.opts.until && this.opts.count) {
        let e4 = Math.ceil(this.opts.count / (this.opts.byYearDay.length || 1)) * c2 + 5;
        if (o2 > a2.year + e4) break;
      }
    }
    return this.applyCountLimitAndMergeRDates(n2, e3);
  }
  _allDailyMinutelyHourlyWithBySetPos(e3) {
    let t2 = [], n2 = 0, r2 = this.originalDtstart;
    if (!this.addDtstartIfNeeded(t2, e3)) return this.applyCountLimitAndMergeRDates(t2, e3);
    let i2, a2;
    switch (this.opts.freq) {
      case `MINUTELY`:
        i2 = r2.with({ second: 0, microsecond: 0, nanosecond: 0 }), a2 = { minutes: this.opts.interval };
        break;
      case `HOURLY`:
        i2 = r2.with({ minute: 0, second: 0, microsecond: 0, nanosecond: 0 }), a2 = { hours: this.opts.interval };
        break;
      case `DAILY`:
        i2 = r2.with({ hour: 0, minute: 0, second: 0, microsecond: 0, nanosecond: 0 }), a2 = { days: this.opts.interval };
        break;
      default:
        return this.applyCountLimitAndMergeRDates(t2, e3);
    }
    for (; ; ) {
      if (++n2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      let o2 = this.expandByTime(i2);
      o2 = o2.filter((e4) => this.matchesAll(e4)), o2 = this.applyBySetPos(o2);
      let { shouldBreak: s2 } = this.processOccurrences(o2, t2, r2, e3);
      if (s2 || (i2 = i2.add(a2), this.opts.until && q.ZonedDateTime.compare(i2, this.opts.until) > 0)) break;
    }
    return this.applyCountLimitAndMergeRDates(t2, e3);
  }
  _allFallback(e3) {
    let t2 = [], n2 = 0, r2 = this.computeFirst();
    if (this.includeDtstart && q.ZonedDateTime.compare(r2, this.originalDtstart) > 0 && !(e3 && this.isExcluded(this.originalDtstart)) && (e3 && !e3(this.originalDtstart, t2.length) || (t2.push(this.originalDtstart), this.shouldBreakForCountLimit(t2.length)))) return this.applyCountLimitAndMergeRDates(t2, e3);
    for (; ; ) {
      if (++n2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      if (this.opts.until && q.ZonedDateTime.compare(r2, this.opts.until) > 0 || this.matchesAll(r2) && !(e3 && this.isExcluded(r2)) && (e3 && !e3(r2, t2.length) || (t2.push(r2), this.shouldBreakForCountLimit(t2.length)))) break;
      r2 = this.nextCandidateSameDate(r2);
    }
    return this.applyCountLimitAndMergeRDates(t2, e3);
  }
  _allSubDailyPeriods(e3) {
    let t2 = [], n2 = this.createCandidateWorkBudget(), r2 = this.originalDtstart;
    if (!this.addDtstartIfNeeded(t2, e3)) return this.applyCountLimitAndMergeRDates(t2, e3);
    let { freq: i2, byHour: a2, byMinute: o2, bySecond: s2, bySetPos: c2 } = this.opts, l2 = r2.timeZoneId, u2 = r2.calendarId, d2 = vd(l2), f2 = i2 === `HOURLY` ? Nd : i2 === `MINUTELY` ? Md : jd, p2 = f2 * BigInt(this.opts.interval), m2 = r2.epochNanoseconds, h2 = this.opts.until?.epochNanoseconds, g2 = i2 === `HOURLY` && this.opts.interval === 1, _2 = i2 === `HOURLY` ? void 0 : o2, v2 = i2 === `SECONDLY` ? s2 : void 0, ee2 = i2 === `HOURLY` ? o2 : void 0, te2 = i2 === `SECONDLY` ? void 0 : s2, ne2 = BigInt(r2.millisecond * 1e6 + r2.microsecond * 1e3 + r2.nanosecond), re2 = (e4) => Number(Hd(e4, X)), ie2 = (e4, t3) => {
      let n3 = d2.nextTransitionAfter(re2(e4), Number(Ud(t3, X)));
      if (n3 === void 0) return;
      let r3 = BigInt(n3) * X;
      return r3 > e4 && r3 <= t3 ? r3 : void 0;
    }, y2, b2 = (e4) => {
      if (ld || l2 === `UTC`) return new q.ZonedDateTime(e4, l2, u2);
      y2 ??= new q.ZonedDateTime(e4, l2, u2);
      let t3 = e4 - y2.epochNanoseconds, n3 = Hd(t3, X);
      return y2.add({ milliseconds: Number(n3), nanoseconds: Number(t3 - n3 * X) });
    }, x2 = (e4) => e4.toZonedDateTime(l2).epochNanoseconds, ae2 = (e4, t3) => ie2(e4, e4 + t3 - 1n) ?? e4 + t3, oe2, se2, ce2 = false, le2 = 0n, ue2 = 0;
    for (; ; ) {
      if (++ue2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      let i3 = m2 + le2 * p2;
      if (h2 !== void 0 && i3 - 2n * f2 > h2) break;
      let o3 = re2(i3), s3 = o3 + d2.offsetMsAt(o3), l3 = Math.floor(s3 / Y), y3 = s3 - l3 * Y, de2 = Math.floor(y3 / Dd), fe2 = Math.floor(y3 / Ed) % 60, pe2 = Math.floor(y3 / Td) % 60;
      if (g2 && le2 > 0n) {
        let e4 = i3 - Nd;
        if (ie2(e4, i3) !== void 0) {
          let t3 = re2(e4), n3 = t3 + d2.offsetMsAt(t3);
          if (Math.floor(n3 / Dd) === Math.floor(s3 / Dd)) {
            le2 += 1n;
            continue;
          }
        }
      }
      if (l3 !== oe2) {
        let { year: e4, month: t3 } = qd(l3);
        oe2 = l3, se2 = new q.PlainDate(e4, t3, l3 - Kd(e4, t3, 1) + 1, u2), ce2 = this.matchesSubDailyDate(se2);
      }
      let S2;
      if (!ce2) S2 = x2(this.nextSubDailyDateCandidate(se2));
      else if (a2 && !a2.includes(de2)) {
        let e4 = a2.find((e5) => e5 > de2) ?? 24, t3 = BigInt((fe2 * 60 + pe2) * 1e3) * X + ne2;
        S2 = ae2(i3, BigInt(e4 - de2) * Nd - t3);
      } else if (_2 && !_2.includes(fe2)) {
        let e4 = _2.find((e5) => e5 > fe2) ?? 60, t3 = BigInt(pe2 * 1e3) * X + ne2;
        S2 = ae2(i3, BigInt(e4 - fe2) * Md - t3);
      } else if (v2 && !v2.includes(pe2)) {
        let e4 = v2.find((e5) => e5 > pe2) ?? 60;
        S2 = ae2(i3, BigInt(e4 - pe2) * jd - ne2);
      }
      if (S2 !== void 0) {
        if (h2 !== void 0 && S2 > h2) break;
        let e4 = S2 - m2, t3 = e4 <= 0n ? 0n : Ud(e4, p2);
        le2 = t3 > le2 ? t3 : le2 + 1n;
        continue;
      }
      let me2 = [], he2;
      for (let e4 of ee2 ?? [fe2]) for (let t3 of te2 ?? [pe2]) {
        this.recordCandidateEvaluation(n2);
        let r3 = BigInt((e4 - fe2) * 60 + (t3 - pe2)) * jd, a3 = i3 + r3;
        if (r3 === 0n || ie2(r3 < 0n ? a3 : i3, r3 < 0n ? i3 : a3) === void 0) {
          me2.push(a3);
          continue;
        }
        he2 ??= b2(i3);
        let o4 = he2.with({ minute: e4, second: t3 });
        o4.hour === de2 && o4.minute === e4 && o4.second === t3 && me2.push(o4.epochNanoseconds);
      }
      me2.sort((e4, t3) => e4 < t3 ? -1 : e4 > t3 ? 1 : 0);
      let C2 = c2?.length ? this.applyBySetPosToSortedList(me2).sort((e4, t3) => e4 < t3 ? -1 : e4 > t3 ? 1 : 0) : me2;
      for (let i4 = 0; i4 < C2.length; i4++) {
        let a3 = C2[i4];
        if (!(a3 < m2 || i4 > 0 && a3 === C2[i4 - 1]) && !this.processOccurrence(b2(a3), t2, r2, e3, void 0, n2)) return this.applyCountLimitAndMergeRDates(t2, e3);
      }
      le2 += 1n;
    }
    return this.applyCountLimitAndMergeRDates(t2, e3);
  }
  matchesSubDailyDate(e3) {
    return this.matchesByMonth(e3) && this.matchesByWeekNo(e3) && this.matchesByYearDay(e3) && this.matchesByMonthDay(e3) && this.matchesByDay(e3);
  }
  nextSubDailyDateCandidate(e3) {
    let t2 = this.numericByMonths;
    if (t2?.length && !t2.includes(e3.month)) {
      let n2 = [...t2].sort((e4, t3) => e4 - t3), r2 = n2.find((t3) => t3 > e3.month);
      return r2 === void 0 ? e3.with({ month: 1, day: 1 }).add({ years: 1 }).with({ month: n2[0] }) : e3.with({ month: r2, day: 1 });
    }
    if (!this.matchesByWeekNo(e3)) return e3.add({ days: 8 - e3.dayOfWeek });
    if (!this.matchesByYearDay(e3)) {
      let t3 = e3.daysInYear, n2 = this.lastByYearDay(e3), r2 = this.opts.byYearDay.map((e4) => e4 > 0 ? e4 : n2 + e4 + 1).filter((n3) => n3 > e3.dayOfYear && n3 <= t3);
      return r2.length ? e3.add({ days: Math.min(...r2) - e3.dayOfYear }) : e3.with({ month: 1, day: 1 }).add({ years: 1 });
    }
    if (!this.matchesByMonthDay(e3)) {
      let t3 = e3.daysInMonth, n2 = this.opts.byMonthDay.map((e4) => e4 > 0 ? e4 : t3 + e4 + 1).filter((n3) => n3 > e3.day && n3 <= t3);
      return n2.length ? e3.with({ day: Math.min(...n2) }) : e3.with({ day: 1 }).add({ months: 1 });
    }
    if (!this.hasOrdinalByDay && this.simpleByDayIsoDays?.length) {
      let t3 = this.simpleByDayIsoDays.map((t4) => (t4 - e3.dayOfWeek + 6) % 7 + 1);
      return e3.add({ days: Math.min(...t3) });
    }
    return e3.add({ days: 1 });
  }
  _allCalendarPeriods(e3, t2) {
    let n2 = [], r2 = this.createCandidateWorkBudget(), i2 = this.originalDtstart, { freq: a2, interval: o2 = 1 } = this.opts, s2 = i2.toPlainDate(), c2 = this.opts.until?.withTimeZone(i2.timeZoneId).withCalendar(i2.calendarId).toPlainDate(), l2 = a2 === `DAILY` ? s2 : s2.with({ day: 1 });
    a2 === `YEARLY` && (l2 = l2.with({ month: 1 }));
    let u2 = a2 === `YEARLY` ? { years: o2 } : a2 === `MONTHLY` ? { months: o2 } : { days: o2 };
    if (!this.addDtstartIfNeeded(n2, e3)) return this.applyCountLimitAndMergeRDates(n2, e3);
    if (a2 === `DAILY` && this.simpleByDayIsoDays?.length) {
      let t3 = this.findFirstMatchingDailyStep(l2.dayOfWeek, o2, this.simpleByDayIsoDays);
      if (t3 === null) return this.applyCountLimitAndMergeRDates(n2, e3);
      l2 = l2.add({ days: t3 * o2 });
    }
    for (let o3 = 0; !(c2 && q.PlainDate.compare(l2, c2) > 0); o3++) {
      if (o3 >= this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
      let s3 = [];
      if (a2 === `DAILY`) this.matchesByMonth(l2) && this.matchesByMonthDay(l2) && this.matchesByDay(l2) && this.matchesByYearDay(l2) && this.matchesByWeekNo(l2) && s3.push(l2);
      else {
        let e4 = a2 === `YEARLY` ? this.opts.byMonth ?? [i2.monthCode] : [l2.month];
        for (let t3 of e4) {
          if (a2 === `MONTHLY` && !this.matchesByMonth(l2)) continue;
          let e5;
          try {
            e5 = l2.with(typeof t3 == `number` ? { month: t3 } : { monthCode: t3 }, { overflow: `reject` });
          } catch {
            continue;
          }
          let n3 = this.applySkipForDay(i2.calendarId, l2.year, e5, i2.day);
          n3 && s3.push(n3);
        }
      }
      if (!this.visitPeriodCandidates(s3, (t3) => this.processOccurrence(t3, n2, i2, e3, void 0, r2), t2 ?? i2, this.opts.until, r2)) break;
      l2 = l2.add(u2);
    }
    return this.applyCountLimitAndMergeRDates(n2, e3);
  }
  all(e3) {
    if (e3) {
      let t2 = [];
      return this.allInternal((n2, r2) => {
        let i2 = this.toPublicDate(n2);
        return e3(i2, r2) ? (t2.push(i2), true) : false;
      }), t2;
    }
    return !e3 && this.opts.cache !== false ? (this.allResultCache ||= this.allInternal(), this.publicAllResultCache ||= this.toPublicDates(this.allResultCache), this.publicAllResultCache.slice()) : this.toPublicDates(this.allInternal());
  }
  allInternal(e3, t2) {
    if (this.opts.count === void 0 && !this.opts.until && !e3) throw Error(`all() requires iterator when no COUNT/UNTIL`);
    if (e3 && (this.opts.rDate || this.opts.exDate)) return this.iterateRecurrenceSet(e3);
    if (this.opts.count === 0) return this.applyCountLimitAndMergeRDates([], e3);
    if (this.opts.until && q.ZonedDateTime.compare(this.opts.until, this.originalDtstart) < 0) {
      let t3 = [];
      return this.addDtstartIfNeeded(t3, e3), this.applyCountLimitAndMergeRDates(t3, e3);
    }
    if (this.opts.rscale && [`CHINESE`, `HEBREW`, `INDIAN`].includes(this.opts.rscale) && ([`YEARLY`, `MONTHLY`, `WEEKLY`].includes(this.opts.freq) || this.opts.byYearDay || this.opts.byWeekNo || this.opts.byMonthDay && this.opts.byMonthDay.length > 0)) return this._allRscaleNonGregorian(e3, t2);
    if (this.opts.byWeekNo && this.opts.byYearDay && !this.hasPossibleYearDayWeekNoCombination() || this.yearlyDaysNeverMatch()) {
      let t3 = [];
      return this.addDtstartIfNeeded(t3, e3), this.applyCountLimitAndMergeRDates(t3, e3);
    }
    let n2 = this.allUtcFastPath(e3, t2);
    if (n2) return this.opts.rDate || this.opts.exDate ? this.applyCountLimitAndMergeRDates(n2) : n2;
    let r2 = this.allTzEpochFastPath(e3, t2);
    return r2 ? this.opts.rDate || this.opts.exDate ? this.applyCountLimitAndMergeRDates(r2) : r2 : this.opts.freq === `DAILY` || [`MONTHLY`, `YEARLY`].includes(this.opts.freq) && !this.opts.byDay && !this.opts.byMonthDay && !this.opts.byYearDay && !this.opts.byWeekNo ? this._allCalendarPeriods(e3, t2) : this.opts.freq === `MONTHLY` && (this.opts.byDay || this.opts.byMonthDay) && !this.opts.byWeekNo ? this._allMonthlyByDayOrMonthDay(e3, t2) : this.opts.freq === `WEEKLY` && !(this.opts.byYearDay && this.opts.byYearDay.length > 0) && !(this.opts.byWeekNo && this.opts.byWeekNo.length > 0) ? this._allWeekly(e3, t2) : this.opts.freq === `YEARLY` && (this.opts.byDay || this.opts.byMonthDay || this.opts.byYearDay || this.opts.byWeekNo) || this.opts.freq === `WEEKLY` && this.opts.byYearDay && this.opts.byYearDay.length > 0 || this.opts.freq === `WEEKLY` && this.opts.byWeekNo && this.opts.byWeekNo.length > 0 ? this._allYearlyComplex(e3, t2) : [`HOURLY`, `MINUTELY`, `SECONDLY`].includes(this.opts.freq) && !this.opts.rscale && (this.opts.byMonth || this.opts.byWeekNo || this.opts.byYearDay || this.opts.byMonthDay || this.opts.byDay || this.opts.byHour || this.opts.byMinute || this.opts.bySecond || this.opts.bySetPos) ? this._allSubDailyPeriods(e3) : (this.opts.freq === `MINUTELY` || this.opts.freq === `SECONDLY`) && (this.opts.byMonth || this.opts.byWeekNo || this.opts.byYearDay || this.opts.byMonthDay || this.opts.byDay) ? this._allMinutelySecondlyComplex(e3) : this.opts.freq === `MONTHLY` && this.opts.byWeekNo && this.opts.byWeekNo.length > 0 ? this._allMonthlyByWeekNo(e3, t2) : this.opts.freq === `MONTHLY` && this.opts.byYearDay && this.opts.byYearDay.length > 0 && !this.opts.byDay && !this.opts.byMonthDay ? this._allMonthlyByYearDay(e3, t2) : (this.opts.freq === `MINUTELY` || this.opts.freq === `HOURLY`) && this.opts.bySetPos ? this._allDailyMinutelyHourlyWithBySetPos(e3) : this._allFallback(e3);
  }
  mergeAndDeduplicateRDates(e3) {
    this.opts.rDate && e3.push(...this.opts.rDate);
    let t2 = e3.map((e4) => e4.epochNanoseconds), n2 = true;
    for (let e4 = 1; e4 < t2.length; e4++) if (t2[e4 - 1] > t2[e4]) {
      n2 = false;
      break;
    }
    n2 || (e3 = e3.map((e4, t3) => t3).sort((e4, n3) => t2[e4] < t2[n3] ? -1 : t2[e4] > t2[n3] ? 1 : 0).map((t3) => e3[t3]), t2.sort((e4, t3) => e4 < t3 ? -1 : e4 > t3 ? 1 : 0));
    let r2 = [];
    for (let n3 = 0; n3 < e3.length; n3++) (n3 === 0 || t2[n3] !== t2[n3 - 1]) && r2.push(e3[n3]);
    return r2;
  }
  isExcluded(e3) {
    return this.isExcludedEpoch(e3.epochNanoseconds);
  }
  isExcludedEpoch(e3) {
    return !this.opts.exDate || this.opts.exDate.length === 0 ? false : (this.exDateEpochNs === void 0 && (this.exDateEpochNs = new Set(this.opts.exDate.map((e4) => e4.epochNanoseconds))), this.exDateEpochNs.has(e3));
  }
  getNumericRDates() {
    if (this.numericRDatesCache) return this.numericRDatesCache;
    let e3 = [...this.opts.rDate ?? []].sort((e4, t3) => e4.epochNanoseconds < t3.epochNanoseconds ? -1 : e4.epochNanoseconds > t3.epochNanoseconds ? 1 : 0), t2 = [], n2;
    for (let r2 of e3) r2.epochNanoseconds !== n2 && (n2 = r2.epochNanoseconds, this.isExcludedEpoch(n2) || t2.push(r2));
    return this.numericRDatesCache = t2;
  }
  numericRDateLowerBound(e3, t2) {
    let n2 = this.getNumericRDates(), r2 = 0, i2 = n2.length;
    for (; r2 < i2; ) {
      let a2 = r2 + Math.floor((i2 - r2) / 2), o2 = n2[a2].epochNanoseconds;
      (t2 ? o2 > e3 : o2 >= e3) ? i2 = a2 : r2 = a2 + 1;
    }
    return r2;
  }
  excludeExDates(e3) {
    return !this.opts.exDate || this.opts.exDate.length === 0 ? e3 : e3.filter((e4) => !this.isExcluded(e4));
  }
  applyCountLimitAndMergeRDates(e3, t2) {
    let n2 = this.opts.count === void 0 ? e3 : e3.slice(0, Math.max(this.opts.count, 0)), r2 = this.mergeAndDeduplicateRDates(n2), i2 = this.excludeExDates(r2);
    return !t2 || !this.opts.rDate && !this.opts.exDate ? i2 : this.applyIterator(i2, t2);
  }
  iterateRecurrenceSet(t2) {
    let n2 = [], r2 = [...this.opts.rDate ?? []].sort((e3, t3) => q.ZonedDateTime.compare(e3, t3)), i2 = 0, a2, o2 = false, s2 = (e3) => {
      let r3 = e3.epochNanoseconds;
      return a2 === r3 || (a2 = r3, this.isExcluded(e3)) ? true : t2(e3, n2.length) ? (n2.push(e3), true) : (o2 = true, false);
    }, c2 = (e3) => {
      for (; i2 < r2.length && r2[i2].epochNanoseconds < e3; ) if (!s2(r2[i2++])) return false;
      return true;
    }, l2 = (e3) => {
      if (!c2(e3.epochNanoseconds) || !s2(e3)) return false;
      for (; i2 < r2.length && r2[i2].epochNanoseconds === e3.epochNanoseconds; ) i2++;
      return true;
    };
    for ((this.opts.count === void 0 || this.opts.count > 0) && new e2({ ...this.cloneOptions(), rDate: void 0, exDate: void 0, cache: false }).allInternal(l2); !o2 && i2 < r2.length && s2(r2[i2++]); ) ;
    return n2;
  }
  applyIterator(e3, t2) {
    let n2 = [];
    for (let r2 of e3) {
      if (!t2(r2, n2.length)) break;
      n2.push(r2);
    }
    return n2;
  }
  shouldBreakForCountLimit(e3) {
    return this.opts.count === void 0 ? false : e3 >= this.opts.count;
  }
  hasTimeOfDayBetween(e3, t2) {
    if (q.PlainTime.compare(e3, t2) >= 0) return false;
    let n2 = this.originalDtstart, r2 = this.opts.byHour ?? [n2.hour], i2 = this.opts.byMinute ?? [n2.minute], a2 = this.opts.bySecond ?? [n2.second];
    for (let o2 of r2) for (let r3 of i2) for (let i3 of a2) {
      let a3 = q.PlainTime.from({ hour: o2, minute: r3, second: i3, millisecond: n2.millisecond, microsecond: n2.microsecond, nanosecond: n2.nanosecond });
      if (q.PlainTime.compare(a3, e3) >= 0 && q.PlainTime.compare(a3, t2) < 0) return true;
    }
    return false;
  }
  assertNumericCandidateReachable(e3) {
    if (e3 && e3.periodIndex >= this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
  }
  numericExhaustionCandidate(e3) {
    return e3.count < e3.maximumCount ? e3.select(e3.count) : e3.count > 0 ? e3.select(e3.count - 1) : null;
  }
  tryNumericNext(e3, t2) {
    let n2 = this.getNumericQueryPlan();
    if (!n2) return { handled: false };
    let r2 = n2.lowerBound(e3, !t2);
    if (!this.opts.rDate && !this.opts.exDate) {
      if (r2 >= n2.count) return this.assertNumericCandidateReachable(this.numericExhaustionCandidate(n2)), { handled: true, value: null };
      let e4 = n2.select(r2);
      return e4 ? (this.assertNumericCandidateReachable(e4), { handled: true, value: this.zdtFromEpochMs(e4.epochMilliseconds) }) : { handled: false };
    }
    let i2 = this.getNumericRDates()[this.numericRDateLowerBound(e3, !t2)];
    for (; r2 < n2.count; ) {
      let e4 = n2.select(r2);
      if (!e4) return { handled: false };
      let t3 = BigInt(e4.epochMilliseconds) * X;
      if (this.assertNumericCandidateReachable(e4), i2 && i2.epochNanoseconds < t3) return { handled: true, value: i2 };
      if (!this.isExcludedEpoch(t3)) return { handled: true, value: this.zdtFromEpochMs(e4.epochMilliseconds) };
      r2 += 1;
    }
    let a2 = this.numericExhaustionCandidate(n2);
    return this.assertNumericCandidateReachable(a2), { handled: true, value: i2 ?? null };
  }
  tryNumericPrevious(e3, t2) {
    let n2 = this.getNumericQueryPlan();
    if (!n2) return { handled: false };
    let r2 = n2.lowerBound(e3, t2), i2 = r2 < n2.count ? n2.select(r2) : this.numericExhaustionCandidate(n2);
    this.assertNumericCandidateReachable(i2);
    let a2 = r2 - 1;
    if (!this.opts.rDate && !this.opts.exDate) {
      if (a2 < 0) return { handled: true, value: null };
      let e4 = n2.select(a2);
      return e4 ? { handled: true, value: this.zdtFromEpochMs(e4.epochMilliseconds) } : { handled: false };
    }
    let o2 = null;
    for (; a2 >= 0; ) {
      let e4 = n2.select(a2);
      if (!e4) return { handled: false };
      if (!this.isExcludedEpoch(BigInt(e4.epochMilliseconds) * X)) {
        o2 = e4;
        break;
      }
      --a2;
    }
    let s2 = this.getNumericRDates(), c2 = this.numericRDateLowerBound(e3, t2) - 1, l2 = c2 >= 0 ? s2[c2] : null;
    return !o2 || l2 && l2.epochNanoseconds > BigInt(o2.epochMilliseconds) * X ? { handled: true, value: l2 } : { handled: true, value: this.zdtFromEpochMs(o2.epochMilliseconds) };
  }
  tryNumericBetween(e3, t2, n2) {
    if (e3 > t2) return { handled: false };
    let r2 = this.getNumericQueryPlan();
    if (!r2) return { handled: false };
    let i2 = r2.lowerBound(e3, !n2), a2 = r2.lowerBound(t2, n2), o2 = r2.lowerBound(t2, true), s2 = o2 < r2.count ? r2.select(o2) : this.numericExhaustionCandidate(r2);
    if (this.assertNumericCandidateReachable(s2), i2 >= a2 && !this.opts.rDate) return { handled: true, value: [] };
    if (r2.kind !== `fixed-step` && this.assertCandidateBudget(a2 - i2), !this.opts.rDate && !this.opts.exDate) {
      let e4 = Array(a2 - i2);
      for (let t3 = i2; t3 < a2; t3++) {
        let n3 = r2.select(t3);
        if (!n3) return { handled: false };
        e4[t3 - i2] = this.zdtFromEpochMs(n3.epochMilliseconds);
      }
      return { handled: true, value: e4 };
    }
    let c2 = [];
    for (let e4 = i2; e4 < a2; e4++) {
      let t3 = r2.select(e4);
      if (!t3) return { handled: false };
      let n3 = BigInt(t3.epochMilliseconds) * X;
      this.isExcludedEpoch(n3) || c2.push(this.zdtFromEpochMs(t3.epochMilliseconds));
    }
    let l2 = this.getNumericRDates(), u2 = this.numericRDateLowerBound(e3, !n2), d2 = this.numericRDateLowerBound(t2, n2), f2 = [], p2 = 0, m2 = u2;
    for (; p2 < c2.length || m2 < d2; ) {
      let e4 = c2[p2], t3 = l2[m2];
      !t3 || e4 && e4.epochNanoseconds <= t3.epochNanoseconds ? (f2.push(e4), p2 += 1, t3 && t3.epochNanoseconds === e4.epochNanoseconds && (m2 += 1)) : (f2.push(t3), m2 += 1);
    }
    return { handled: true, value: f2 };
  }
  periodScanBudget(e3, t2, n2) {
    let r2 = Math.floor((this.maxIterations - 16) / t2), i2 = Math.floor(this.maxCandidateEvaluations / (e3.candidatesPerPeriod * t2)) - 16;
    return Math.min(n2, r2, i2);
  }
  resolvePeriodEpochs(e3, t2) {
    if (e3.rankedPeriodWallSpan && this.tzid !== `UTC`) {
      let n3 = e3.rankedPeriodWallSpan(t2);
      if (!n3) return null;
      let r3 = this.getZoneResolver();
      if (this.timeSlotOffsetsMs.some((e4) => r3.timeOfDayMayHitGap(e4, n3[0] - Y, n3[1] + Y))) return null;
    }
    let n2 = e3.wallsForPeriod(t2);
    if (!n2) return null;
    let r2 = Array(n2.length);
    for (let e4 = 0; e4 < n2.length; e4++) {
      let t3 = this.resolveNumericWallMilliseconds(n2[e4]);
      if (t3 === null) return null;
      r2[e4] = t3;
    }
    return r2;
  }
  isExcludedEpochMilliseconds(e3) {
    return !!this.opts.exDate?.length && this.isExcludedEpoch(BigInt(e3) * X);
  }
  periodScanForward(e3, t2, n2, r2 = 1) {
    let i2 = this.originalDtstart.epochMilliseconds, a2 = this.opts.until?.epochMilliseconds, o2 = Math.max(t2, i2);
    if (a2 !== void 0 && o2 > a2) return null;
    let s2 = this.periodScanBudget(e3, r2, Ld), c2 = (e4) => a2 !== void 0 && e4 > a2 ? null : n2 !== void 0 && e4 > n2 ? e4 : this.isExcludedEpochMilliseconds(e4) ? void 0 : e4, l2 = e3.stepMilliseconds;
    if (l2 !== void 0) {
      let e4 = i2 + Math.ceil((o2 - i2) / l2) * l2;
      e4 < o2 ? e4 += l2 : e4 - l2 >= o2 && (e4 -= l2);
      for (let t3 = 0; t3 < s2; t3++, e4 += l2) {
        if (!Z(e4)) return;
        let t4 = c2(e4);
        if (t4 !== void 0) return t4;
      }
      return;
    }
    let u2 = Math.max(0, e3.periodOfWall(this.tzid === `UTC` ? o2 : o2 - Y));
    for (let t3 = 0; t3 < s2; t3++, u2++) {
      let t4 = this.resolvePeriodEpochs(e3, u2);
      if (!t4) return;
      for (let e4 of t4) {
        if (e4 < o2) continue;
        let t5 = c2(e4);
        if (t5 !== void 0) return t5;
      }
    }
  }
  periodScanBackward(e3, t2, n2) {
    let r2 = this.originalDtstart.epochMilliseconds, i2 = this.opts.until?.epochMilliseconds, a2 = i2 === void 0 ? t2 : Math.min(t2, i2);
    if (a2 < r2) return null;
    let o2 = this.periodScanBudget(e3, 8, Ld), s2 = (e4) => e4 < r2 ? null : n2 !== void 0 && e4 < n2 ? e4 : this.isExcludedEpochMilliseconds(e4) ? void 0 : e4, c2 = e3.stepMilliseconds;
    if (c2 !== void 0) {
      let e4 = r2 + Math.floor((a2 - r2) / c2) * c2;
      e4 > a2 ? e4 -= c2 : e4 + c2 <= a2 && (e4 += c2);
      for (let t3 = 0; t3 < o2; t3++, e4 -= c2) {
        let t4 = s2(e4);
        if (t4 !== void 0) return t4;
      }
      return;
    }
    let l2 = e3.periodOfWall(this.tzid === `UTC` ? a2 : a2 + Y);
    for (let t3 = 0; t3 < o2; t3++, l2--) {
      if (l2 < 0) return null;
      let t4 = this.resolvePeriodEpochs(e3, l2);
      if (!t4) return;
      for (let e4 = t4.length - 1; e4 >= 0; e4--) {
        let n3 = t4[e4];
        if (n3 > a2) continue;
        let r3 = s2(n3);
        if (r3 !== void 0) return r3;
      }
    }
  }
  periodEpochsBetween(e3, t2, n2) {
    let r2 = this.originalDtstart.epochMilliseconds, i2 = this.opts.until?.epochMilliseconds, a2 = Math.max(t2, r2), o2 = i2 === void 0 ? n2 : Math.min(n2, i2), s2 = [];
    if (a2 > o2) return s2;
    let c2 = this.periodScanBudget(e3, 1, 1 / 0), l2 = e3.stepMilliseconds;
    if (l2 !== void 0) {
      let e4 = r2 + Math.ceil((a2 - r2) / l2) * l2;
      if (e4 < a2 ? e4 += l2 : e4 - l2 >= a2 && (e4 -= l2), (o2 - e4) / l2 >= c2) return null;
      for (let t3 = e4; t3 <= o2; t3 += l2) {
        if (!Z(t3)) return null;
        this.isExcludedEpochMilliseconds(t3) || s2.push(t3);
      }
      return s2;
    }
    let u2 = this.tzid === `UTC`, d2 = Math.max(0, e3.periodOfWall(u2 ? a2 : a2 - Y)), f2 = e3.periodOfWall(u2 ? o2 : o2 + Y);
    if (f2 - d2 >= c2) return null;
    for (let t3 = d2; t3 <= f2; t3++) {
      let n3 = this.resolvePeriodEpochs(e3, t3);
      if (!n3) return null;
      for (let e4 of n3) e4 < a2 || e4 > o2 || this.isExcludedEpochMilliseconds(e4) || s2.push(e4);
    }
    return s2;
  }
  tryPeriodNext(e3, t2) {
    let n2 = this.getPeriodQueryPlan();
    if (!n2) return { handled: false };
    let r2 = this.opts.rDate ? this.getNumericRDates()[this.numericRDateLowerBound(e3, !t2)] : void 0, i2 = this.periodScanForward(n2, Wd(e3, !t2), r2 ? Gd(r2.epochNanoseconds, false) : void 0);
    return i2 === void 0 ? { handled: false } : r2 && (i2 === null || BigInt(i2) * X > r2.epochNanoseconds) ? { handled: true, value: r2 } : { handled: true, value: i2 === null ? null : this.zdtFromEpochMs(i2) };
  }
  tryPeriodPrevious(e3, t2) {
    let n2 = this.getPeriodQueryPlan();
    if (!n2) return { handled: false };
    let r2 = this.opts.rDate ? this.numericRDateLowerBound(e3, t2) - 1 : -1, i2 = r2 >= 0 ? this.getNumericRDates()[r2] : null, a2 = this.periodScanBackward(n2, Gd(e3, !t2), i2 ? Wd(i2.epochNanoseconds, false) : void 0);
    return a2 === void 0 || this.periodScanForward(n2, Wd(e3, t2), void 0, 2) === void 0 ? { handled: false } : i2 && (a2 === null || BigInt(a2) * X < i2.epochNanoseconds) ? { handled: true, value: i2 } : { handled: true, value: a2 === null ? null : this.zdtFromEpochMs(a2) };
  }
  tryPeriodBetween(e3, t2, n2) {
    if (e3 > t2) return { handled: false };
    let r2 = this.getPeriodQueryPlan();
    if (!r2) return { handled: false };
    let i2 = this.periodEpochsBetween(r2, Wd(e3, !n2), Gd(t2, !n2));
    if (!i2) return { handled: false };
    let a2 = i2.map((e4) => this.zdtFromEpochMs(e4));
    if (!this.opts.rDate) return { handled: true, value: a2 };
    let o2 = this.getNumericRDates(), s2 = this.numericRDateLowerBound(t2, n2), c2 = [], l2 = 0, u2 = this.numericRDateLowerBound(e3, !n2);
    for (; l2 < a2.length || u2 < s2; ) {
      let e4 = a2[l2], t3 = u2 < s2 ? o2[u2] : void 0;
      !t3 || e4 && e4.epochNanoseconds <= t3.epochNanoseconds ? (c2.push(e4), l2 += 1, t3 && t3.epochNanoseconds === e4.epochNanoseconds && (u2 += 1)) : (c2.push(t3), u2 += 1);
    }
    return { handled: true, value: c2 };
  }
  between(t2, n2, r2 = false) {
    let i2 = $d(t2, `after`), a2 = $d(n2, `before`), o2 = this.tryNumericBetween(i2, a2, r2);
    if (o2.handled) return this.toPublicDates(o2.value);
    let s2 = this.tryPeriodBetween(i2, a2, r2);
    if (s2.handled) return this.toPublicDates(s2.value);
    let c2 = new q.ZonedDateTime(i2, this.tzid, this.originalDtstart.calendarId), l2 = new q.ZonedDateTime(a2, this.tzid, this.originalDtstart.calendarId), u2 = { ...this.opts };
    (!u2.until || q.ZonedDateTime.compare(l2, u2.until) < 0) && (u2.until = l2), u2.count === void 0 && Object.assign(u2, this.alignedQueryStart(c2));
    let d2 = new e2({ ...u2, strict: u2.count === void 0 ? u2.strict : false, temporal: this.outputTemporal }).allInternal(void 0, u2.count === void 0 ? c2 : void 0);
    return this.toPublicDates(d2.filter((e3) => {
      let t3 = r2 ? e3.epochNanoseconds >= i2 : e3.epochNanoseconds > i2, n3 = r2 ? e3.epochNanoseconds <= a2 : e3.epochNanoseconds < a2;
      return t3 && n3;
    }));
  }
  jumpAlignedDtstart(t2) {
    if (t2 = t2.withTimeZone(this.originalDtstart.timeZoneId).withCalendar(this.originalDtstart.calendarId), t2.epochNanoseconds <= this.originalDtstart.epochNanoseconds || this.opts.rscale || this.originalDtstart.timeZoneId !== this.tzid || this.opts.freq === `MONTHLY` && this.opts.byWeekNo || [`MONTHLY`, `YEARLY`].includes(this.opts.freq) && ![`iso8601`, `gregory`].includes(this.originalDtstart.calendarId)) return this.originalDtstart;
    let n2 = this.opts.interval ?? 1, r2 = t2.withPlainTime(this.originalDtstart.toPlainTime()), i2;
    switch (this.opts.freq) {
      case `YEARLY`:
        i2 = `years`;
        break;
      case `MONTHLY`:
        i2 = `months`;
        break;
      case `WEEKLY`:
        i2 = `weeks`;
        break;
      case `DAILY`:
        i2 = `days`;
        break;
      case `HOURLY`:
        i2 = `hours`;
        break;
      case `MINUTELY`:
        i2 = `minutes`;
        break;
      default:
        i2 = `seconds`;
    }
    let a2 = e2.normalizeToPolyfill(this.opts.dtstart), o2 = e2.normalizeToPolyfill(t2).withTimeZone(a2.timeZoneId), s2 = e2.normalizeToPolyfill(r2.withPlainTime(this.originalDtstart.toPlainTime())).withTimeZone(a2.timeZoneId), c2 = [`hours`, `minutes`, `seconds`].includes(i2) ? o2 : s2, l2 = a2.until(c2, { largestUnit: i2 })[i2], u2 = Math.floor(l2 / n2), d2 = (e3) => {
      switch (i2) {
        case `years`:
          return { years: e3 };
        case `months`:
          return { months: e3 };
        case `weeks`:
          return { weeks: e3 };
        case `days`:
          return { days: e3 };
        case `hours`:
          return { hours: e3 };
        case `minutes`:
          return { minutes: e3 };
        default:
          return { seconds: e3 };
      }
    }, f2 = [`years`, `months`, `weeks`, `days`].includes(i2), p2 = () => {
      for (; u2 > 0; ) {
        if (!f2) return a2.add(d2(u2 * n2));
        try {
          let e3 = this.originalDtstart.toPlainDateTime().add(d2(u2 * n2), { overflow: `reject` }), t3 = this.resolveGeneratedTime(e3);
          if (t3) return t3;
        } catch {
        }
        --u2;
      }
      return this.originalDtstart;
    }, m2 = p2();
    this.opts.freq === `HOURLY` && n2 === 1 && u2 > 0 && m2.subtract({ hours: 1 }).hour === m2.hour && (--u2, m2 = p2()), u2 > 0 && [`years`, `months`, `weeks`, `days`].includes(i2) && m2.toPlainDate().equals(o2.toPlainDate()) && q.ZonedDateTime.compare(m2, o2) > 0 && this.hasTimeOfDayBetween(o2.toPlainTime(), m2.toPlainTime()) && (--u2, m2 = p2());
    let h2 = e2.normalizeToPolyfill(this.opts.dtstart);
    return q.ZonedDateTime.compare(m2, h2) < 0 && (m2 = h2), m2;
  }
  matches(e3) {
    let t2 = $d(e3, `date`);
    return this.nextInternal(t2, true)?.epochNanoseconds === t2;
  }
  occursOn(e3) {
    let t2 = q.PlainDate.from(e3.toString()), n2 = t2.toZonedDateTime({ timeZone: this.tzid, plainTime: q.PlainTime.from(`00:00`) });
    if (!n2.toPlainDate().equals(t2)) return false;
    let r2 = t2.add({ days: 1 }).toZonedDateTime({ timeZone: this.tzid, plainTime: q.PlainTime.from(`00:00`) }), i2 = this.nextInternal(n2.epochNanoseconds, true);
    return i2 !== null && i2.epochNanoseconds < r2.epochNanoseconds;
  }
  nextInternal(e3, t2) {
    let n2 = this.tryNumericNext(e3, t2);
    if (n2.handled) return n2.value;
    let r2 = this.tryPeriodNext(e3, t2);
    if (r2.handled) return r2.value;
    let i2 = null, a2 = (n3) => {
      n3.allInternal((n4) => (t2 ? n4.epochNanoseconds >= e3 : n4.epochNanoseconds > e3) ? ((!i2 || n4.epochNanoseconds < i2.epochNanoseconds) && (i2 = n4), false) : true);
    };
    return this.opts.count === void 0 ? a2(this.ruleFromAlignedDtstart(new q.ZonedDateTime(e3, this.tzid))) : a2(this), i2;
  }
  next(e3 = /* @__PURE__ */ new Date(), t2 = false) {
    return this.toPublicDate(this.nextInternal($d(e3, `after`), t2));
  }
  alignedQueryStart(e3) {
    let t2 = this.jumpAlignedDtstart(e3);
    return { dtstart: t2, includeDtstart: this.includeDtstart && t2.epochNanoseconds === this.originalDtstart.epochNanoseconds };
  }
  ruleFromAlignedDtstart(t2) {
    let n2 = this.alignedQueryStart(t2);
    return n2.dtstart.epochNanoseconds === this.originalDtstart.epochNanoseconds ? this : new e2({ ...this.opts, temporal: this.outputTemporal, ...n2 });
  }
  previous(e3 = /* @__PURE__ */ new Date(), t2 = false) {
    let n2 = $d(e3, `before`), r2 = this.tryNumericPrevious(n2, t2);
    if (r2.handled) return this.toPublicDate(r2.value);
    let i2 = this.tryPeriodPrevious(n2, t2);
    if (i2.handled) return this.toPublicDate(i2.value);
    let a2 = null;
    if (this.opts.rDate?.length) {
      let e4 = this.numericRDateLowerBound(n2, t2) - 1;
      a2 = e4 >= 0 ? this.getNumericRDates()[e4] : null;
    }
    let o2 = this.previousFromRule(n2, t2, a2?.epochNanoseconds);
    return !o2 || a2 && a2.epochNanoseconds > o2.epochNanoseconds ? this.toPublicDate(a2) : this.toPublicDate(o2);
  }
  previousFromRule(t2, n2, r2) {
    let i2 = this.opts.rDate && this.opts.rDate.length > 0 ? new e2({ ...this.opts, temporal: this.outputTemporal, rDate: void 0 }) : this, a2 = (e3) => {
      let r3 = null;
      return e3.allInternal((e4) => (n2 ? e4.epochNanoseconds > t2 : e4.epochNanoseconds >= t2) ? false : (r3 = e4, true)), r3;
    };
    if (i2.opts.count !== void 0) return a2(i2);
    let o2 = i2.opts.until?.epochNanoseconds, s2 = new q.ZonedDateTime(o2 !== void 0 && o2 < t2 ? o2 : t2, i2.tzid, i2.originalDtstart.calendarId), c2 = i2.opts.interval ?? 1;
    for (let e3 = 0; e3 < 16; e3++) {
      let t3 = e3 === 0 ? s2 : s2.subtract(i2.freqDuration(c2 * 4 ** e3)), n3 = r2 !== void 0 && t3.epochNanoseconds <= r2;
      n3 && (t3 = new q.ZonedDateTime(r2, i2.tzid, i2.originalDtstart.calendarId));
      let o3 = i2.ruleFromAlignedDtstart(t3), l2 = a2(o3);
      if (l2 || o3 === i2 || n3) return l2;
    }
    return a2(i2);
  }
  freqDuration(e3) {
    switch (this.opts.freq) {
      case `YEARLY`:
        return { years: e3 };
      case `MONTHLY`:
        return { months: e3 };
      case `WEEKLY`:
        return { weeks: e3 };
      case `DAILY`:
        return { days: e3 };
      case `HOURLY`:
        return { hours: e3 };
      case `MINUTELY`:
        return { minutes: e3 };
      default:
        return { seconds: e3 };
    }
  }
  toString() {
    let e3 = this.originalDtstart.toString({ smallestUnit: `second` }).replace(/[-:]/g, ``), t2 = `DTSTART;TZID=${this.tzid}:${e3.slice(0, 15)}`, n2 = [], { freq: r2, interval: i2, count: a2, until: o2, byHour: s2, byMinute: c2, bySecond: l2, byDay: u2, byMonth: d2, byMonthDay: f2, bySetPos: p2, byWeekNo: m2, byYearDay: h2, wkst: g2, rDate: _2, exDate: v2 } = this.opts;
    this.opts.rscale && n2.push(`RSCALE=${this.opts.rscale}`), this.opts.rscale && this.opts.skip && n2.push(`SKIP=${this.opts.skip}`), n2.push(`FREQ=${r2}`), i2 !== 1 && n2.push(`INTERVAL=${i2}`), a2 !== void 0 && a2 !== 1 / 0 && n2.push(`COUNT=${a2}`), o2 && n2.push(`UNTIL=${this.formatIcsDateTime(o2)}`), s2 && n2.push(`BYHOUR=${s2.join(`,`)}`), c2 && n2.push(`BYMINUTE=${c2.join(`,`)}`), l2 && n2.push(`BYSECOND=${l2.join(`,`)}`), u2 && n2.push(`BYDAY=${u2.join(`,`)}`), d2 && n2.push(`BYMONTH=${d2.join(`,`)}`), f2 && n2.push(`BYMONTHDAY=${f2.join(`,`)}`), p2 && n2.push(`BYSETPOS=${p2.join(`,`)}`), m2 && n2.push(`BYWEEKNO=${m2.join(`,`)}`), h2 && n2.push(`BYYEARDAY=${h2.join(`,`)}`), g2 && n2.push(`WKST=${g2}`);
    let ee2 = [t2, `RRULE:${n2.join(`;`)}`];
    return _2 && ee2.push(`RDATE:${this.joinDates(_2)}`), v2 && ee2.push(`EXDATE:${this.joinDates(v2)}`), ee2.join(`
`);
  }
  formatIcsDateTime(e3) {
    return e3.toInstant().toString().replace(/[-:]/g, ``).slice(0, 15) + `Z`;
  }
  joinDates(e3) {
    return e3.map((e4) => this.formatIcsDateTime(e4));
  }
  generateMonthlyDateCandidates(e3) {
    let t2 = e3.day === 1 ? e3 : e3.with({ day: 1 });
    if (!this.opts.byDay && !this.opts.byMonthDay) return [e3];
    let n2 = this.generateMonthlyOccurrenceDays(t2);
    return n2.length === 0 ? [] : n2.map((e4) => t2.with({ day: e4 }));
  }
  generateMonthlyOccurrences(e3) {
    let t2 = [];
    return this.visitDateTimeCandidates(this.generateMonthlyDateCandidates(e3.toPlainDate()), 1, (e4) => (t2.push(e4), true)), t2;
  }
  generateYearlyDateCandidates(e3) {
    let t2 = this.opts.byMonth ? this.opts.byMonth.filter((e4) => typeof e4 == `number`).sort((e4, t3) => e4 - t3) : this.opts.byMonthDay || this.opts.byDay ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [this.originalDtstart.month], n2 = [], r2 = this.opts.byDay && this.opts.byDay.some((e4) => /^[+-]?\d/.test(e4)), i2 = this.opts.freq === `YEARLY` && !this.opts.byWeekNo, a2 = i2 && !!this.opts.byYearDay;
    if (r2 && !this.opts.byMonth && !a2) {
      let t3 = J;
      for (let r3 of this.opts.byDay) {
        let i3 = Yd(r3);
        if (!i3 || i3.ord === 0) continue;
        let a3 = i3.ord, o2 = t3[i3.weekday], s2;
        if (a3 > 0) {
          let t4 = e3.with({ month: 1, day: 1 }), n3 = (o2 - t4.dayOfWeek + 7) % 7;
          s2 = t4.add({ days: n3 + 7 * (a3 - 1) });
        } else {
          let t4 = e3.with({ month: 12, day: 31 }), n3 = (t4.dayOfWeek - o2 + 7) % 7;
          s2 = t4.subtract({ days: n3 + 7 * (-a3 - 1) });
        }
        s2.year === e3.year && n2.push(s2);
      }
      if (i2) {
        let r3 = e3.with({ month: 1, day: 1 });
        for (let e4 of this.opts.byDay) {
          let i3 = Yd(e4);
          if (!i3 || i3.ord !== 0) continue;
          let a3 = r3.add({ days: (t3[i3.weekday] - r3.dayOfWeek + 7) % 7 });
          for (; a3.year === r3.year; a3 = a3.add({ days: 7 })) n2.push(a3);
        }
        this.opts.byMonthDay && (n2 = n2.filter((e4) => this.matchesByMonthDay(e4)));
      }
    } else if (!this.opts.byYearDay && !this.opts.byWeekNo) {
      n2 = [];
      for (let r3 of t2) {
        let t3 = e3.with({ month: r3, day: 1 }), i3 = this.generateMonthlyDateCandidates(t3);
        if (i3.length === 0 && this.opts.rscale && this.opts.byMonthDay && this.opts.byMonthDay.length > 0) {
          let e4 = t3.add({ months: 1 }).subtract({ days: 1 }).day, r4 = this.opts.byMonthDay[0], i4 = r4 > 0 ? r4 : e4 + r4 + 1;
          if (i4 > e4 || i4 <= 0) {
            let r5 = this.opts.skip || `OMIT`;
            if (r5 === `BACKWARD`) n2.push(t3.with({ day: e4 }));
            else if (r5 === `FORWARD`) {
              let e5 = t3.add({ months: 1 }).with({ day: 1 });
              n2.push(e5);
            }
          }
        } else n2.push(...i3);
      }
    }
    if (this.opts.byYearDay) {
      let t3 = e3.with({ month: 12, day: 31 }).dayOfYear;
      for (let r3 of this.opts.byYearDay) {
        let i3 = r3 > 0 ? r3 : t3 + r3 + 1;
        if (i3 <= 0 || i3 > t3) continue;
        let o2 = (this.opts.freq, e3.with({ month: 1, day: 1 }).add({ days: i3 - 1 }));
        (!this.opts.byMonth || this.opts.byMonth.includes(o2.month)) && (!a2 || this.matchesByMonthDay(o2) && this.matchesYearlyByDay(o2)) && n2.push(o2);
      }
    }
    if (this.opts.byWeekNo) {
      let { lastWeek: t3, firstWeekStart: r3, tokens: i3 } = this.isoWeekByDay(e3);
      for (let e4 of this.opts.byWeekNo) {
        if (e4 > 0 && e4 > t3 || e4 < 0 && -e4 > t3) continue;
        let a3 = e4 > 0 ? e4 - 1 : t3 + e4, o2 = r3.add({ weeks: a3 });
        n2.push(...this.addByDayDates(i3, o2));
      }
    }
    return this.sortedUniqueDateCandidates(n2);
  }
  matchesYearlyByDay(e3) {
    if (!this.opts.byDay) return true;
    for (let t2 of this.parsedByDayTokens ?? []) {
      if (e3.dayOfWeek !== t2.isoDay) continue;
      if (t2.ord === 0) return true;
      let n2 = this.opts.byMonth ? e3.day : e3.dayOfYear, r2 = this.opts.byMonth ? e3.daysInMonth : e3.daysInYear;
      if ((t2.ord > 0 ? Math.ceil(n2 / 7) : -Math.ceil((r2 - n2 + 1) / 7)) === t2.ord) return true;
    }
    return false;
  }
  addByDayDates(e3, t2) {
    let n2 = J, r2 = n2[this.opts.wkst || `MO`], i2 = [];
    for (let a2 of e3) {
      if (!a2) continue;
      let e4 = n2[a2], o2 = t2.add({ days: (e4 - r2 + 7) % 7 });
      (!this.opts.byMonth || this.opts.byMonth.includes(o2.month)) && i2.push(o2);
    }
    return this.sortedUniqueDateCandidates(i2);
  }
  findNextValidValue(e3, t2, n2) {
    return t2.find((t3) => n2(t3, e3) > 0) || null;
  }
  findNextValidDate(e3) {
    if (this.opts.byWeekNo && this.opts.byYearDay) {
      let t2 = e3.with({ month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 }), n2 = this.opts.byYearDay.map((e4) => {
        let n3 = t2.with({ month: 12, day: 31 }).dayOfYear;
        return e4 > 0 ? e4 : n3 + e4 + 1;
      });
      for (let e4 of n2) {
        let n3 = t2.add({ days: e4 - 1 });
        if (this.matchesByWeekNo(n3)) break;
      }
    }
    if (this.opts.byMonth) {
      let t2 = this.opts.byMonth.filter((e4) => typeof e4 == `number`);
      if (t2.length && !t2.includes(e3.month)) {
        let n2 = [...t2].sort((e4, t3) => e4 - t3), r2 = this.findNextValidValue(e3.month, n2, (e4, t3) => e4 - t3);
        return e3 = r2 ? e3.with({ month: r2, day: 1, hour: 0, minute: 0, second: 0 }) : e3.add({ years: 1 }).with({ month: n2[0], day: 1, hour: 0, minute: 0, second: 0 }), e3 = this.applyTimeOverride(e3), e3;
      }
    }
    if (this.opts.byWeekNo && !this.matchesByWeekNo(e3)) return e3 = e3.add({ weeks: 1 }).with({ hour: 0, minute: 0, second: 0 }), e3 = this.applyTimeOverride(e3), e3;
    if (this.opts.byYearDay && !this.matchesByYearDay(e3)) {
      let t2 = [...this.opts.byYearDay].sort((e4, t3) => e4 - t3), n2 = e3.dayOfYear, r2 = e3.with({ month: 12, day: 31 }).dayOfYear, i2 = t2.find((e4) => (e4 > 0 ? e4 : r2 + e4 + 1) > n2);
      if (i2) {
        let t3 = i2 > 0 ? i2 : r2 + i2 + 1;
        e3 = this.opts.freq === `MINUTELY` || this.opts.freq === `SECONDLY` ? e3.with({ month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 }).add({ days: t3 - 1 }) : e3.with({ month: 1, day: 1 }).add({ days: t3 - 1 });
      } else {
        let n3 = e3.add({ years: 1 }), r3 = n3.with({ month: 12, day: 31 }).dayOfYear, i3 = t2[0];
        if (i3 !== void 0) {
          let t3 = i3 > 0 ? i3 : r3 + i3 + 1;
          e3 = this.opts.freq === `MINUTELY` || this.opts.freq === `SECONDLY` ? n3.with({ month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 }).add({ days: t3 - 1 }) : n3.with({ month: 1, day: 1 }).add({ days: t3 - 1 });
        }
      }
      return e3 = this.applyTimeOverride(e3), e3;
    }
    if (this.opts.byMonthDay && !this.matchesByMonthDay(e3)) {
      let t2 = [...this.opts.byMonthDay].sort((e4, t3) => e4 - t3), n2 = e3.with({ day: 1 }).add({ months: 1 }).subtract({ days: 1 }).day, r2 = e3.day, i2 = t2.map((e4) => e4 > 0 ? e4 : n2 + e4 + 1).filter((e4) => e4 > 0 && e4 <= n2).sort((e4, t3) => e4 - t3), a2 = this.findNextValidValue(r2, i2, (e4, t3) => e4 - t3);
      if (a2) e3 = e3.with({ day: a2, hour: 0, minute: 0, second: 0 });
      else {
        let n3 = e3.add({ months: 1 }).with({ day: 1 }), r3 = n3.add({ months: 1 }).subtract({ days: 1 }).day, i3 = t2[0];
        if (i3 !== void 0) {
          let t3 = i3 > 0 ? i3 : r3 + i3 + 1;
          e3 = n3.with({ day: Math.max(1, Math.min(t3, r3)), hour: 0, minute: 0, second: 0 });
        } else e3 = e3.add({ months: 1 }).with({ day: 1, hour: 0, minute: 0, second: 0 });
      }
      return e3 = this.applyTimeOverride(e3), e3;
    }
    if (this.opts.byDay && !this.matchesByDay(e3)) {
      let t2 = this.allByDayIsoDays;
      if (!t2?.length) return this.applyTimeOverride(e3.add({ days: 1 }).with({ hour: 0, minute: 0, second: 0 }));
      let n2 = this.findNextValidValue(e3.dayOfWeek, t2, (e4, t3) => e4 - t3);
      if (n2) {
        let t3 = (n2 - e3.dayOfWeek + 7) % 7;
        e3 = e3.add({ days: t3 }).with({ hour: 0, minute: 0, second: 0 });
      } else {
        let n3 = (t2[0] - e3.dayOfWeek + 7) % 7;
        e3 = e3.add({ days: n3 + 7 }).with({ hour: 0, minute: 0, second: 0 });
      }
      return e3 = this.applyTimeOverride(e3), e3;
    }
    switch (this.opts.freq) {
      case `SECONDLY`:
      case `MINUTELY`:
        e3 = e3.add({ days: 1 }).with({ hour: 0, minute: 0, second: 0 });
        break;
      case `HOURLY`:
        e3 = e3.add({ days: 1 }).with({ hour: 0, minute: 0, second: 0 });
        break;
      case `DAILY`:
      case `WEEKLY`:
        e3 = e3.add({ months: 1 }).with({ day: 1, hour: 0, minute: 0, second: 0 });
        break;
      case `MONTHLY`:
      case `YEARLY`:
        e3 = e3.add({ years: 1 }).with({ month: 1, day: 1, hour: 0, minute: 0, second: 0 });
        break;
    }
    return this.applyTimeOverride(e3);
  }
  applyBySetPos(e3) {
    let { bySetPos: t2 } = this.opts;
    if (!t2 || !t2.length) return e3;
    let n2 = [...e3].sort((e4, t3) => q.ZonedDateTime.compare(e4, t3));
    return this.applyBySetPosToSortedList(n2).sort((e4, t3) => q.ZonedDateTime.compare(e4, t3));
  }
  isoWeekByDay(e3) {
    let t2 = J, n2 = t2[this.opts.wkst || `MO`], r2 = e3.with({ month: 1, day: 4 }), i2 = (r2.dayOfWeek - n2 + 7) % 7, a2 = r2.subtract({ days: i2 }), o2 = r2.add({ years: 1 }).with({ month: 1, day: 4 }), s2 = o2.subtract({ days: (o2.dayOfWeek - n2 + 7) % 7 });
    return { lastWeek: a2.until(s2, { largestUnit: `days` }).days / 7, firstWeekStart: a2, tokens: this.opts.byDay?.length ? this.opts.byDay.map((e4) => $(e4)).filter((e4) => e4 !== null) : [Object.entries(t2).find(([, e4]) => e4 === this.originalDtstart.dayOfWeek)[0]] };
  }
  generateDateCandidatesForWeekInYear(e3, t2) {
    let n2 = [], r2 = this.originalDtstart.toPlainDate().with({ year: e3, month: 1, day: 1 }), { lastWeek: i2, firstWeekStart: a2, tokens: o2 } = this.isoWeekByDay(r2);
    if (t2 > 0 && t2 > i2 || t2 < 0 && -t2 > i2) return n2;
    let s2 = t2 > 0 ? t2 - 1 : i2 + t2, c2 = a2.add({ weeks: s2 });
    return n2.push(...this.addByDayDates(o2, c2)), this.sortedUniqueDateCandidates(n2);
  }
  getRscaleCalendarId() {
    return { GREGORIAN: `gregory`, CHINESE: `chinese`, HEBREW: `hebrew`, INDIAN: `indian` }[this.opts.rscale?.toUpperCase() || ``] || null;
  }
  assertRscaleCalendarSupported(t2) {
    if (t2 === `gregory` || t2 === `iso8601`) return;
    let n2 = e2.rscaleCalendarSupport[t2];
    if (n2 === true) return;
    if (n2 === false) throw Error(`RSCALE=${this.opts.rscale} is not supported by the current Temporal/Intl implementation`);
    let r2 = true;
    try {
      let e3 = cd.ZonedDateTime.from(`2000-01-01T00:00:00+00:00[UTC]`).withCalendar(t2);
      e3.year, e3.monthCode, e3.day;
    } catch {
      r2 = false;
    }
    if (e2.rscaleCalendarSupport[t2] = r2, !r2) throw Error(`RSCALE=${this.opts.rscale} is not supported by the current Temporal/Intl implementation`);
  }
  pad2(e3) {
    return String(e3).padStart(2, `0`);
  }
  monthMatchesToken(e3, t2) {
    if (typeof t2 == `number`) return e3 === `M${this.pad2(t2)}`;
    if (/^\d+L$/i.test(t2)) {
      let n2 = parseInt(t2, 10);
      return e3 === `M${this.pad2(n2)}L`;
    }
    return false;
  }
  monthsOfYear(e3, t2) {
    let n2 = [];
    for (let r2 = 1; r2 <= 20; r2++) try {
      let i2 = cd.PlainDate.from({ calendar: e3, year: t2, month: r2, day: 1 }, { overflow: `reject` });
      n2.push(i2);
    } catch {
      break;
    }
    return n2;
  }
  rscaleMonth(e3, t2, n2, r2) {
    return r2.find((e4) => e4.monthCode === n2) || (this.opts.skip === `BACKWARD` ? r2.slice().reverse().find((e4) => e4.monthCode < n2) ?? this.startOfYear(e3, t2).subtract({ months: 1 }) : this.opts.skip === `FORWARD` ? r2.find((e4) => e4.monthCode > n2) ?? this.startOfYear(e3, t2 + 1) : null);
  }
  startOfYear(e3, t2) {
    return cd.PlainDate.from({ calendar: e3, year: t2, month: 1, day: 1 });
  }
  endOfYear(e3, t2) {
    return this.startOfYear(e3, t2 + 1).subtract({ days: 1 });
  }
  rscaleFirstWeekStart(e3, t2, n2) {
    let r2 = cd.PlainDate.from({ calendar: e3, year: t2, month: 1, day: 4 }), i2 = (r2.dayOfWeek - n2 + 7) % 7;
    return r2.subtract({ days: i2 });
  }
  rscaleLastWeekCount(e3, t2, n2) {
    let r2 = this.rscaleFirstWeekStart(e3, t2, n2), i2 = this.endOfYear(e3, t2).since(r2).days;
    return Math.floor(i2 / 7) + 1;
  }
  lastDayOfMonth(e3) {
    return e3.with({ day: 1 }).add({ months: 1 }).subtract({ days: 1 }).day;
  }
  toRscaleZdt(e3) {
    return cd.ZonedDateTime.from(e3.toString());
  }
  rscaleDate(e3) {
    return q.PlainDate.from(e3.withCalendar(`iso8601`).toString());
  }
  rscaleDateAfterUntil(e3) {
    if (!this.opts.until) return false;
    let t2 = this.opts.until.withTimeZone(this.generationTimeZone).toPlainDate().withCalendar(`iso8601`);
    return q.PlainDate.compare(this.rscaleDate(e3), t2) > 0;
  }
  rscaleMatchesByYearDay(e3, t2) {
    let n2 = this.opts.byYearDay;
    if (!n2 || n2.length === 0) return true;
    let r2 = this.endOfYear(e3, t2.year).dayOfYear;
    return n2.some((e4) => e4 > 0 ? t2.dayOfYear === e4 : t2.dayOfYear === r2 + e4 + 1);
  }
  rscaleMatchesByWeekNo(e3, t2) {
    let n2 = this.opts.byWeekNo;
    if (!n2 || n2.length === 0) return true;
    let r2 = J[this.opts.wkst || `MO`], i2 = t2.subtract({ days: (t2.dayOfWeek - r2 + 7) % 7 }).add({ days: (4 - r2 + 7) % 7 }).year, a2 = this.rscaleFirstWeekStart(e3, i2, r2), o2 = this.rscaleLastWeekCount(e3, i2, r2), s2 = Math.floor(t2.since(a2).days / 7) + 1;
    return n2.some((e4) => e4 > 0 ? s2 === e4 : s2 === o2 + e4 + 1);
  }
  rscaleMatchesByMonth(e3, t2) {
    let n2 = this.opts.byMonth;
    return !n2 || n2.length === 0 ? true : n2.some((e4) => this.monthMatchesToken(t2.monthCode, e4));
  }
  rscaleMatchesByMonthDay(e3) {
    let t2 = this.opts.byMonthDay;
    if (!t2 || t2.length === 0) return true;
    let n2 = e3.with({ day: 1 }).add({ months: 1 }).subtract({ days: 1 }).day, r2 = e3.day;
    return t2.some((e4) => e4 > 0 ? r2 === e4 : r2 === n2 + e4 + 1);
  }
  rscaleMatchesByDayBasic(e3) {
    let t2 = this.opts.byDay;
    if (!t2 || t2.length === 0) return true;
    let n2 = J, r2 = t2.map((e4) => $(e4)).filter((e4) => e4 !== null);
    return r2.length === 0 ? true : r2.some((t3) => n2[t3] === e3.dayOfWeek);
  }
  rscaleDateMatches(e3, t2) {
    return this.rscaleMatchesByMonth(e3, t2) && this.rscaleMatchesByYearDay(e3, t2) && this.rscaleMatchesByWeekNo(e3, t2) && this.rscaleMatchesByMonthDay(t2) && this.rscaleMatchesByDayBasic(t2);
  }
  applySkipForDay(e3, t2, n2, r2) {
    let i2 = this.lastDayOfMonth(n2), a2 = this.opts.skip || `OMIT`;
    return r2 >= 1 && r2 <= i2 ? n2.with({ day: r2 }) : a2 === `BACKWARD` ? n2.with({ day: i2 }) : a2 === `FORWARD` ? n2.add({ months: 1 }).with({ day: 1 }) : null;
  }
  generateMonthlyOccurrencesRscale(e3, t2, n2) {
    let r2 = [], i2 = this.opts.byMonthDay, a2 = this.opts.byDay;
    if (!a2 && !i2) {
      let i3 = this.toRscaleZdt(this.originalDtstart).withCalendar(e3).day, a3 = this.applySkipForDay(e3, t2, n2, i3);
      return a3 && r2.push(this.rscaleDate(a3)), r2;
    }
    let o2 = (e4) => {
      r2.push(this.rscaleDate(e4));
    }, s2 = this.lastDayOfMonth(n2), c2 = (e4) => e4 > 0 ? e4 : s2 + e4 + 1;
    if (i2 && i2.length > 0) for (let r3 of i2) {
      let i3 = c2(r3), a3 = this.applySkipForDay(e3, t2, n2, i3);
      a3 && o2(a3);
    }
    if (a2 && a2.length > 0) {
      let e4 = J, t3 = {}, r3 = n2;
      for (; r3.month === n2.month && r3.year === n2.year; ) {
        let e5 = r3.dayOfWeek;
        (t3[e5] ||= []).push(r3), r3 = r3.add({ days: 1 });
      }
      for (let n3 of a2) {
        let r4 = Yd(n3);
        if (!r4) continue;
        let i3 = r4.ord, a3 = t3[e4[r4.weekday]] || [];
        if (a3.length !== 0) if (i3 === 0) for (let e5 of a3) o2(e5);
        else {
          let e5 = a3[i3 > 0 ? i3 - 1 : a3.length + i3];
          e5 && o2(e5);
        }
      }
    }
    return this.sortedUniqueDateCandidates(r2);
  }
  _allRscaleNonGregorian(e3, t2) {
    let n2 = this.getRscaleCalendarId();
    if (!n2) return this._allFallback(e3);
    this.assertRscaleCalendarSupported(n2);
    let r2 = [], i2 = this.createCandidateWorkBudget(), a2 = 0, o2 = this.originalDtstart, s2 = this.toRscaleZdt(o2).withCalendar(n2), c2 = this.opts.interval ?? 1;
    if (!this.addDtstartIfNeeded(r2, e3)) return this.applyCountLimitAndMergeRDates(r2, e3);
    if (this.opts.freq === `YEARLY`) {
      let l2 = 0;
      for (; ; ) {
        if (++a2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
        let u2 = s2.year + l2 * c2, d2 = [], f2 = this.opts.byMonth, p2 = this.monthsOfYear(n2, u2), m2 = J, h2 = m2[this.opts.wkst || `MO`];
        if (this.opts.byWeekNo && this.opts.byWeekNo.length > 0) {
          let e4 = this.rscaleFirstWeekStart(n2, u2, h2), t3 = this.rscaleLastWeekCount(n2, u2, h2), r3 = this.opts.byDay?.length ? this.opts.byDay.map((e5) => $(e5)).filter((e5) => e5 !== null) : [Object.entries(m2).find(([, e5]) => e5 === this.originalDtstart.dayOfWeek)[0]];
          for (let i3 of this.opts.byWeekNo) {
            let a3 = i3 > 0 ? i3 - 1 : t3 + i3;
            if (a3 < 0 || a3 >= t3) continue;
            let o3 = e4.add({ weeks: a3 });
            for (let e5 of r3) {
              let t4 = m2[e5], r4 = o3.add({ days: (t4 - h2 + 7) % 7 });
              if (!(f2 && f2.length > 0 && !f2.some((e6) => this.monthMatchesToken(r4.monthCode, e6)))) {
                if (this.opts.byYearDay && this.opts.byYearDay.length > 0) {
                  let e6 = this.endOfYear(n2, u2).dayOfYear;
                  if (!this.opts.byYearDay.some((t5) => {
                    let n3 = t5 > 0 ? t5 : e6 + t5 + 1;
                    return r4.dayOfYear === n3;
                  })) continue;
                }
                d2.push(this.rscaleDate(r4));
              }
            }
          }
        } else if (this.opts.byYearDay && this.opts.byYearDay.length > 0) {
          let e4 = this.startOfYear(n2, u2), t3 = this.endOfYear(n2, u2).dayOfYear;
          for (let n3 of this.opts.byYearDay) {
            let r3 = n3 > 0 ? n3 : t3 + n3 + 1;
            if (r3 < 1 || r3 > t3) continue;
            let i3 = e4.add({ days: r3 - 1 });
            f2 && f2.length > 0 && !f2.some((e5) => this.monthMatchesToken(i3.monthCode, e5)) || d2.push(this.rscaleDate(i3));
          }
        } else if (!f2 || f2.length === 0) {
          let e4 = this.rscaleMonth(n2, u2, s2.monthCode, p2), t3 = e4 ? this.applySkipForDay(n2, u2, e4, s2.day) : null;
          t3 && d2.push(this.rscaleDate(t3));
        } else for (let e4 of f2) {
          let t3 = typeof e4 == `number` ? `M${this.pad2(e4)}` : `M${this.pad2(parseInt(e4, 10))}L`, r3 = this.rscaleMonth(n2, u2, t3, p2);
          r3 && d2.push(...this.generateMonthlyOccurrencesRscale(n2, u2, r3));
        }
        if (d2.length > 0 && !this.visitPeriodCandidates(d2, (t3) => this.processOccurrence(t3, r2, o2, e3, void 0, i2), t2 ?? o2, this.opts.until, i2) || (l2++, this.opts.until && u2 > this.toRscaleZdt(this.opts.until).withCalendar(n2).year)) break;
      }
      return this.applyCountLimitAndMergeRDates(r2, e3);
    }
    if (this.opts.freq === `WEEKLY`) {
      let c3 = J, l2 = c3[this.opts.wkst || `MO`], u2 = this.opts.byDay?.length ? this.opts.byDay.map((e4) => $(e4)).filter((e4) => e4 !== null) : [Object.entries(c3).find(([, e4]) => e4 === this.originalDtstart.dayOfWeek)[0]], d2 = s2.toPlainDate().subtract({ days: (s2.dayOfWeek - l2 + 7) % 7 });
      for (; ; ) {
        if (++a2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
        let s3 = [];
        for (let e4 of u2) {
          let t3 = c3[e4], r3 = d2.add({ days: (t3 - l2 + 7) % 7 });
          if (this.opts.byWeekNo && this.opts.byWeekNo.length > 0) {
            let e5 = d2.add({ days: (4 - l2 + 7) % 7 }).year, t4 = this.rscaleFirstWeekStart(n2, e5, l2), i4 = this.rscaleLastWeekCount(n2, e5, l2), a3 = Math.floor(r3.since(t4).days / 7) + 1;
            if (!this.opts.byWeekNo.some((e6) => e6 > 0 ? a3 === e6 : a3 === i4 + e6 + 1)) continue;
          }
          if (this.opts.byYearDay && this.opts.byYearDay.length > 0) {
            let e5 = this.endOfYear(n2, r3.year).dayOfYear;
            if (!this.opts.byYearDay.some((t4) => t4 > 0 ? r3.dayOfYear === t4 : r3.dayOfYear === e5 + t4 + 1)) continue;
          }
          let i3 = this.opts.byMonth;
          i3 && i3.length > 0 && !i3.some((e5) => this.monthMatchesToken(r3.monthCode, e5)) || s3.push(this.rscaleDate(r3));
        }
        if (s3.length && !this.visitPeriodCandidates(s3, (t3) => this.processOccurrence(t3, r2, o2, e3, void 0, i2), t2 ?? o2, this.opts.until, i2)) return this.applyCountLimitAndMergeRDates(r2, e3);
        if (d2 = d2.add({ weeks: this.opts.interval ?? 1 }), this.rscaleDateAfterUntil(d2)) break;
      }
      return this.applyCountLimitAndMergeRDates(r2, e3);
    }
    if (this.opts.freq === `MONTHLY`) {
      let c3 = s2.toPlainDate().with({ day: 1 });
      for (; ; ) {
        if (++a2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
        let s3 = c3.year, l2 = c3, u2 = true, d2 = this.opts.byMonth;
        if (d2 && d2.length > 0 && (u2 = d2.some((e4) => this.monthMatchesToken(l2.monthCode, e4))), u2) {
          let a3 = this.generateMonthlyOccurrencesRscale(n2, s3, l2);
          if (!this.visitPeriodCandidates(a3, (t3) => this.processOccurrence(t3, r2, o2, e3, void 0, i2), t2 ?? o2, this.opts.until, i2)) break;
        }
        if (c3 = c3.add({ months: this.opts.interval ?? 1 }), this.rscaleDateAfterUntil(c3)) break;
      }
      return this.applyCountLimitAndMergeRDates(r2, e3);
    }
    if (this.opts.freq === `DAILY`) {
      let c3 = s2.toPlainDate();
      for (; ; ) {
        if (++a2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
        if (this.rscaleDateMatches(n2, c3)) {
          let n3 = this.rscaleDate(c3);
          if (!this.visitPeriodCandidates([n3], (t3) => this.processOccurrence(t3, r2, o2, e3, void 0, i2), t2 ?? o2, this.opts.until, i2)) break;
        }
        if (c3 = c3.add({ days: this.opts.interval ?? 1 }), this.rscaleDateAfterUntil(c3)) break;
      }
      return this.applyCountLimitAndMergeRDates(r2, e3);
    }
    if (this.opts.freq === `HOURLY` || this.opts.freq === `MINUTELY`) {
      this.opts.freq;
      let c3 = this.opts.freq === `HOURLY` ? 36e5 : 6e4, l2 = this.opts.interval ?? 1, u2 = s2.toPlainDate(), d2 = this.originalDtstart.toInstant().epochMilliseconds;
      for (; ; ) {
        if (++a2 > this.maxIterations) throw Error(`Maximum iterations (${this.maxIterations}) exceeded in all()`);
        if (this.rscaleDateMatches(n2, u2)) {
          let n3 = this.rscaleDate(u2);
          if (!this.visitPeriodCandidates([n3], (t3) => {
            let n4 = t3.toInstant().epochMilliseconds - d2;
            return Math.floor(n4 / c3) % l2 === 0 ? this.processOccurrence(t3, r2, o2, e3, void 0, i2) : true;
          }, t2 ?? o2, this.opts.until, i2)) break;
        }
        if (u2 = u2.add({ days: 1 }), this.rscaleDateAfterUntil(u2)) break;
      }
      return this.applyCountLimitAndMergeRDates(r2, e3);
    }
    return this._allFallback(e3);
  }
};

// automations.ts
var import_yaml = __toESM(require_dist(), 1);
import { spawn } from "node:child_process";
import { once } from "node:events";
import { access, readdir as readdir2, readFile as readFile2 } from "node:fs/promises";
import { homedir as homedir2 } from "node:os";
import { dirname, isAbsolute, join as join3 } from "node:path";
import { parseArgs } from "node:util";
var HOME = homedir2();
var AUTOMATIONS = join3(HOME, ".claude/automations");
var RUNNER = join3(AUTOMATIONS, "runner.mjs");
var BUNDLE = import.meta.filename.endsWith(".ts") ? join3(import.meta.dirname, "dist/automations.mjs") : import.meta.filename;
var LABEL_PREFIX = "com.ezzabuzaid.automations.";
var CLAUDE = join3(HOME, ".local/bin/claude");
var CMUX = "/Applications/cmux.app/Contents/Resources/bin/cmux";
var DEFAULT_TIMEOUT = "PT2H";
var UNATTENDED = "A standing instruction from the user, the person you are working for. It is about how your turns end. A message with no tool call in it ends your turn, and the work stops there until you are asked to continue. The user has seen you end turns in four ways while work they asked for was still owed, and does not want any of them. One: a long summary of what was done that closes by announcing the next step and has no tool call, so the next thing never starts. Two: an offer to carry on with something unless the user would prefer otherwise, which stops to wait for an answer the user was not going to give. Three: a list of decisions for the user when, by your own account, none of them blocks the rest of the work. Four: deciding that this is a good place to report, because the turn has been long or a milestone is done. Status notes are welcome, and so are your recommendations on open decisions, but put them in the same message as your next tool call and carry on with whatever does not depend on the user's answer. If you notice yourself inviting the user to redirect you or offering to wait, delete it and do the next thing. The stops the user does want are the ones where nothing can move without them, or where the thing blocking you is deliberately protected from you. This does not override the need for confirmation on risky or destructive actions.";
var AutomationError = class extends Error {
  constructor(id3, reason) {
    super(`${id3}: ${reason}`);
    this.name = "AutomationError";
  }
};
var Schedule = class _Schedule {
  #rule;
  constructor(text) {
    this.#rule = new ff({ rruleString: text.trim() });
  }
  /** A time of the schedule falls after `since` (with no `since`: at or after DTSTART), and at or before `now`. */
  isDue(since, now) {
    const { dtstart } = this.#rule.options();
    const start = since?.toZonedDateTimeISO(dtstart.timeZoneId) ?? dtstart;
    return this.#rule.between(start, now.toZonedDateTimeISO(dtstart.timeZoneId), true).some((time) => since === void 0 || Temporal.Instant.compare(time.toInstant(), since) > 0);
  }
  next(now) {
    return this.#rule.next(now.toZonedDateTimeISO(this.#rule.options().dtstart.timeZoneId));
  }
  /** When launchd checks the schedule: each hour at the minutes of the rule, or each minute for a finer rule. */
  calendar() {
    const { freq, byMinute, dtstart } = this.#rule.options();
    if (freq === "SECONDLY" || freq === "MINUTELY") return {};
    const shift = dtstart.withTimeZone(Temporal.Now.timeZoneId()).minute - dtstart.minute;
    return (byMinute ?? [dtstart.minute]).map((minute) => ({ Minute: _Schedule.#minute(minute + shift) }));
  }
  static #minute(value) {
    return (value % 60 + 60) % 60;
  }
};
var Automation = class _Automation {
  id;
  folder;
  name;
  schedule;
  cwd;
  status;
  prompt;
  model;
  effort;
  timeout;
  timeoutMs;
  requiresAcPower;
  resume;
  constructor(id3, frontmatter, prompt) {
    this.id = id3;
    this.folder = join3(AUTOMATIONS, id3);
    this.prompt = prompt;
    this.name = _Automation.#text(id3, frontmatter, "name");
    try {
      this.schedule = new Schedule(_Automation.#text(id3, frontmatter, "schedule"));
    } catch (error) {
      if (error instanceof AutomationError) throw error;
      throw new AutomationError(id3, `schedule: ${messageOf(error)}`);
    }
    this.cwd = _Automation.#text(id3, frontmatter, "cwd");
    if (!isAbsolute(this.cwd)) throw new AutomationError(id3, `cwd: ${this.cwd} is not an absolute folder`);
    const status = frontmatter.status;
    if (status !== "active" && status !== "paused") {
      throw new AutomationError(id3, `status: must be active or paused, not ${String(status)}`);
    }
    this.status = status;
    this.model = _Automation.#optionalText(id3, frontmatter, "model");
    this.effort = _Automation.#optionalText(id3, frontmatter, "effort");
    this.timeout = _Automation.#optionalText(id3, frontmatter, "timeout") ?? DEFAULT_TIMEOUT;
    this.timeoutMs = _Automation.#milliseconds(id3, this.timeout);
    const requiresAcPower = frontmatter.requiresAcPower ?? false;
    if (typeof requiresAcPower !== "boolean") throw new AutomationError(id3, "requiresAcPower: must be true or false");
    this.requiresAcPower = requiresAcPower;
    this.resume = _Automation.#resume(id3, frontmatter.resume);
  }
  static async read(id3) {
    if (!/^[a-z0-9-]+$/.test(id3)) {
      throw new AutomationError(id3, "the id (the folder name) may have only the characters a-z0-9 and -");
    }
    let text;
    try {
      text = await readFile2(join3(AUTOMATIONS, id3, "automation.md"), "utf8");
    } catch (error) {
      if (isErrno(error, "ENOENT")) throw new AutomationError(id3, "the folder has no automation.md");
      throw error;
    }
    const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
    if (match === null) throw new AutomationError(id3, "automation.md must start with a --- frontmatter block");
    let frontmatter;
    try {
      frontmatter = (0, import_yaml.parse)(match[1] ?? "");
    } catch (error) {
      throw new AutomationError(id3, `frontmatter: ${messageOf(error)}`);
    }
    if (typeof frontmatter !== "object" || frontmatter === null || Array.isArray(frontmatter)) {
      throw new AutomationError(id3, "frontmatter: must be a YAML mapping");
    }
    const prompt = (match[2] ?? "").trim();
    if (prompt === "") throw new AutomationError(id3, "the prompt (the text after the frontmatter) is empty");
    return new _Automation(id3, frontmatter, prompt);
  }
  /** Every automation under ~/.claude/automations, and the reason of each one that cannot run. */
  static async readAll() {
    let ids;
    try {
      const entries = await readdir2(AUTOMATIONS, { withFileTypes: true });
      ids = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch (error) {
      if (!isErrno(error, "ENOENT")) throw error;
      ids = [];
    }
    const automations = [];
    const errors = [];
    for (const id3 of ids.sort()) {
      try {
        automations.push(await _Automation.read(id3));
      } catch (error) {
        if (!(error instanceof AutomationError)) throw error;
        errors.push(error);
      }
    }
    return { automations, errors };
  }
  static #text(id3, frontmatter, key) {
    const value = _Automation.#optionalText(id3, frontmatter, key);
    if (value === void 0) throw new AutomationError(id3, `${key}: is required`);
    return value;
  }
  static #optionalText(id3, frontmatter, key) {
    const value = frontmatter[key];
    if (value === void 0 || value === null) return void 0;
    if (typeof value !== "string" || value.trim() === "") throw new AutomationError(id3, `${key}: must be text`);
    return value;
  }
  static #milliseconds(id3, timeout2) {
    let milliseconds2;
    try {
      milliseconds2 = Temporal.Duration.from(timeout2).total({ unit: "milliseconds" });
    } catch {
      throw new AutomationError(id3, `timeout: ${timeout2} is not an ISO 8601 duration such as PT75M`);
    }
    if (!(milliseconds2 > 0)) throw new AutomationError(id3, `timeout: ${timeout2} is not longer than zero`);
    return milliseconds2;
  }
  static #resume(id3, value) {
    if (value === void 0 || value === null) return void 0;
    if (typeof value !== "object" || Array.isArray(value)) {
      throw new AutomationError(id3, "resume: must be a mapping with times, while and prompt");
    }
    const fields = value;
    const times = fields.times;
    if (typeof times !== "number" || !Number.isInteger(times) || times < 1) {
      throw new AutomationError(id3, "resume.times: must be a whole number of 1 or more");
    }
    const check = fields.while;
    const prompt = fields.prompt;
    if (typeof check !== "string" || check.trim() === "") throw new AutomationError(id3, "resume.while: must be a shell command");
    if (typeof prompt !== "string" || prompt.trim() === "") throw new AutomationError(id3, "resume.prompt: must be text");
    return { times, while: check, prompt };
  }
};
var StateFile = class {
  static async read(folder) {
    try {
      return JSON.parse(await readFile2(join3(folder, "state.json"), "utf8"));
    } catch (error) {
      if (isErrno(error, "ENOENT")) return void 0;
      throw error;
    }
  }
  static async write(folder, state) {
    await atomicWrite(join3(folder, "state.json"), `${JSON.stringify(state, null, 2)}
`, { clock: globalThis });
  }
};
var Runner = class _Runner {
  #automation;
  constructor(automation) {
    this.#automation = automation;
  }
  async fire({ ifDue }) {
    const automation = this.#automation;
    const now = Temporal.Now.instant();
    if (ifDue) {
      if (automation.status === "paused") return 0;
      const state = await StateFile.read(automation.folder);
      const since = state === void 0 ? void 0 : Temporal.Instant.from(state.lastRunAt);
      if (!automation.schedule.isDue(since, now)) return 0;
      if (automation.requiresAcPower && await this.#onBattery()) {
        this.#log("on battery power: skipped; a check on AC power runs it");
        return 0;
      }
    }
    spawn("caffeinate", ["-is", "-w", String(process.pid)], { stdio: "ignore" }).unref();
    this.#log("starts");
    const outcome = await this.#session(AbortSignal.timeout(automation.timeoutMs));
    const exitCode = _Runner.#exitCode(outcome);
    await StateFile.write(automation.folder, {
      lastRunAt: now.toString(),
      exitCode,
      ...outcome.sessionId === void 0 ? {} : { sessionId: outcome.sessionId }
    });
    await this.#notify(outcome);
    this.#log(`ends: ${outcome.kind}${outcome.sessionId === void 0 ? "" : `, session ${outcome.sessionId}`}`);
    return exitCode;
  }
  static #exitCode(outcome) {
    switch (outcome.kind) {
      case "done":
        return 0;
      case "timed out":
        return 124;
      case "failed":
        return outcome.exitCode;
    }
  }
  async #session(signal) {
    const { prompt, resume } = this.#automation;
    let outcome = await this.#claude(prompt, void 0, signal);
    for (let count = 0; resume !== void 0 && count < resume.times && outcome.kind === "done"; count++) {
      const check = await this.#spawn("/bin/sh", ["-c", resume.while], signal);
      if (check.timedOut) return { kind: "timed out", sessionId: outcome.sessionId };
      if (check.exitCode !== 0) break;
      outcome = await this.#claude(resume.prompt.replaceAll("{stdout}", check.stdout.trim()), outcome.sessionId, signal);
    }
    return outcome;
  }
  async #claude(prompt, sessionId, signal) {
    const { model, effort } = this.#automation;
    const args = ["-p", prompt, "--output-format", "json", "--permission-prompts", "none"];
    args.push("--append-system-prompt", this.#systemPrompt());
    if (model !== void 0) args.push("--model", model);
    if (effort !== void 0) args.push("--effort", effort);
    if (sessionId !== void 0) args.push("--resume", sessionId);
    let run;
    try {
      run = await this.#spawn(CLAUDE, args, signal);
    } catch (error) {
      return { kind: "failed", exitCode: 127, result: `claude did not start: ${messageOf(error)}`, sessionId };
    }
    if (run.timedOut) return { kind: "timed out", sessionId };
    const reply = _Runner.#reply(run.stdout);
    if (run.exitCode === 0 && reply !== void 0 && !reply.isError) {
      return { kind: "done", result: reply.result, sessionId: reply.sessionId };
    }
    return {
      kind: "failed",
      exitCode: run.exitCode === 0 ? 1 : run.exitCode,
      result: reply?.result ?? `claude exited ${run.exitCode} with no JSON reply`,
      sessionId: reply?.sessionId ?? sessionId
    };
  }
  // The same text on each resume: a changed system prompt invalidates the earlier thinking blocks.
  #systemPrompt() {
    const { id: id3, name, folder } = this.#automation;
    return [
      `This is an unattended run of the scheduled automation "${name}" (${id3}).`,
      `Its memory file is ${join3(folder, "memory.md")}. Read it first when it exists. Before you finish, append to it what the next run needs to know.`,
      "",
      UNATTENDED
    ].join("\n");
  }
  /** Runs in the cwd of the automation, on the login of the Claude plan: an API key would bill the API. */
  async #spawn(file, args, signal) {
    if (signal.aborted) return { exitCode: 124, stdout: "", timedOut: true };
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    const child = spawn(file, args, { cwd: this.#automation.cwd, env, stdio: ["ignore", "pipe", "inherit"] });
    const stop = () => {
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 1e4).unref();
    };
    signal.addEventListener("abort", stop, { once: true });
    let stdout = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => stdout += chunk);
    try {
      const [code] = await once(child, "close");
      return { exitCode: code ?? 1, stdout, timedOut: signal.aborted };
    } finally {
      signal.removeEventListener("abort", stop);
    }
  }
  static #reply(stdout) {
    let value;
    try {
      value = JSON.parse(stdout);
    } catch {
      return void 0;
    }
    if (typeof value !== "object" || value === null) return void 0;
    const { result, session_id: sessionId, is_error: isError } = value;
    if (typeof sessionId !== "string" || typeof isError !== "boolean") return void 0;
    return { result: typeof result === "string" ? result : "", sessionId, isError };
  }
  async #notify(outcome) {
    const { id: id3, name, cwd, timeout: timeout2 } = this.#automation;
    const subtitle = outcome.kind === "failed" ? `failed (exit ${outcome.exitCode})` : outcome.kind;
    const message = outcome.kind === "timed out" ? `stopped after ${timeout2}` : outcome.result.trim().split("\n")[0] ?? "";
    const text = message || "(no reply)";
    try {
      const args = ["-title", name, "-subtitle", subtitle, "-message", text, "-group", LABEL_PREFIX + id3];
      if (outcome.sessionId !== void 0 && await _Runner.#installed(CMUX)) {
        const resume = `claude --resume ${outcome.sessionId}`;
        args.push("-execute", `${CMUX} workspace create --name ${quote(name)} --cwd ${quote(cwd)} --command ${quote(resume)}`);
      }
      try {
        await _Runner.#tool("terminal-notifier", args);
      } catch (error) {
        if (!isErrno(error, "ENOENT")) throw error;
        const show = "display notification (item 3 of argv) with title (item 1 of argv) subtitle (item 2 of argv)";
        await _Runner.#tool("osascript", ["-e", "on run argv", "-e", show, "-e", "end run", name, subtitle, text]);
      }
    } catch (error) {
      this.#log(`no notification: ${messageOf(error)}`);
    }
  }
  static async #tool(file, args) {
    await once(spawn(file, args, { stdio: "ignore" }), "close");
  }
  static async #installed(path) {
    try {
      await access(path);
      return true;
    } catch (error) {
      if (isErrno(error, "ENOENT")) return false;
      throw error;
    }
  }
  async #onBattery() {
    const pmset = spawn("pmset", ["-g", "batt"], { stdio: ["ignore", "pipe", "ignore"] });
    let stdout = "";
    pmset.stdout.setEncoding("utf8").on("data", (chunk) => stdout += chunk);
    await once(pmset, "close");
    return stdout.includes("'Battery Power'");
  }
  #log(message) {
    console.log(`${(/* @__PURE__ */ new Date()).toISOString()} ${this.#automation.id}: ${message}`);
  }
};
function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}
function quote(text) {
  return `'${text.replaceAll("'", `'\\''`)}'`;
}
var Sync = class {
  #launchd = Launchd.agents({ clock: globalThis });
  async run() {
    const { automations, errors } = await Automation.readAll();
    if (errors.length > 0) {
      for (const error of errors) console.error(error.message);
      console.error("Nothing was installed. Fix these automations, then run sync again.");
      return 1;
    }
    const now = Temporal.Now.instant();
    const scheduled = [];
    for (const automation of automations) if (await hasTimeLeft(automation, now)) scheduled.push(automation);
    if (scheduled.length > 0) await atomicWrite(RUNNER, await readFile2(BUNDLE), { clock: globalThis });
    for (const automation of scheduled) {
      const service = await this.#launchd.install(this.#job(automation));
      console.log(`installed ${service.label}`);
    }
    const keep = new Set(scheduled.map((automation) => LABEL_PREFIX + automation.id));
    for (const service of await this.#launchd.installed()) {
      if (!service.label.startsWith(LABEL_PREFIX) || keep.has(service.label)) continue;
      await service.uninstall({ signal: AbortSignal.timeout(3e4) });
      console.log(`removed ${service.label}`);
    }
    return 0;
  }
  #job(automation) {
    const log = join3(automation.folder, "run.log");
    const node = process.execPath;
    if (!isAbsolutePath(log) || !isAbsolutePath(node)) throw new Error(`${log} or ${node} is not absolute`);
    return {
      Label: LABEL_PREFIX + automation.id,
      ProgramArguments: [node, RUNNER, "run", automation.id, "--if-due"],
      EnvironmentVariables: {
        HOME,
        // node first: the hooks of the user's settings run a bare `node`.
        PATH: [dirname(node), join3(HOME, ".local/bin"), "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin", "/usr/sbin", "/sbin"].join(":")
      },
      StartCalendarInterval: automation.schedule.calendar(),
      StandardOutPath: log,
      StandardErrorPath: log
    };
  }
};
async function hasTimeLeft(automation, now) {
  if (automation.status !== "active") return false;
  if (automation.schedule.next(now) !== null) return true;
  const state = await StateFile.read(automation.folder);
  return automation.schedule.isDue(state === void 0 ? void 0 : Temporal.Instant.from(state.lastRunAt), now);
}
async function list({ json }) {
  const { automations, errors } = await Automation.readAll();
  const launchd = Launchd.agents({ clock: globalThis });
  const now = Temporal.Now.instant();
  const rows = await Promise.all(
    automations.map(async (automation) => {
      const state = await StateFile.read(automation.folder);
      const service = await launchd.service(LABEL_PREFIX + automation.id).state();
      return {
        id: automation.id,
        name: automation.name,
        status: automation.status === "active" && !await hasTimeLeft(automation, now) ? "finished" : automation.status,
        timeout: automation.timeout,
        next: automation.status === "active" ? automation.schedule.next(now)?.toString() ?? null : null,
        lastRunAt: state?.lastRunAt ?? null,
        lastExit: state?.exitCode ?? null,
        installed: service.state !== "not loaded"
      };
    })
  );
  if (json) {
    console.log(JSON.stringify({ automations: rows, errors: errors.map((error) => error.message) }, null, 2));
    return;
  }
  for (const row of rows) {
    console.log(
      `${row.id}  ${row.status}${row.status === "active" && !row.installed ? " (not installed: run sync)" : ""}  next ${row.next ?? "-"}  last ${row.lastRunAt ?? "-"} (exit ${row.lastExit ?? "-"})`
    );
  }
  for (const error of errors) console.error(error.message);
}
var { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { "if-due": { type: "boolean", default: false }, json: { type: "boolean", default: false } }
});
var [command, id2] = positionals;
if (command === "sync") {
  process.exitCode = await new Sync().run();
} else if (command === "run" && id2 !== void 0) {
  try {
    process.exitCode = await new Runner(await Automation.read(id2)).fire({ ifDue: values["if-due"] });
  } catch (error) {
    if (!(error instanceof AutomationError)) throw error;
    console.error(error.message);
    process.exitCode = 1;
  }
} else if (command === "list") {
  await list({ json: values.json });
} else {
  console.error("usage: node automations.ts sync | run <id> [--if-due] | list [--json]");
  process.exitCode = 2;
}
