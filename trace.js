var fs = require('fs'),
  Benchmark = require('benchmark'),
  sourcify = require('./src/sourcify'),
  escodegen = require('escodegen'),
  esotope = require('esotope'),
  esprima = require('esprima');

var jqueryCode = fs.readFileSync(__dirname + '/test/3rd-party/jquery-1.7.1.js', 'utf-8');
var jqueryAST = esprima.parse(jqueryCode);

sourcify(jqueryAST);
