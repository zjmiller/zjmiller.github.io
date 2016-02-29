var fs = require('fs'),
  Benchmark = require('benchmark'),
  sourcify = require('../../src/sourcify'),
  escodegen = require('escodegen'),
  esotope = require('esotope'),
  esprima = require('esprima');

var jqueryCode = fs.readFileSync(__dirname + '/../3rd-party/jquery-1.7.1.js', 'utf-8');
var jqueryAST = esprima.parse(jqueryCode);

var suite = new Benchmark.Suite;
// add tests
suite.add('Sourcify', function() {
  sourcify(jqueryAST);
})
.add('Escodegen', function() {
  escodegen.generate(jqueryAST);
})
.add('Esotope', function() {
  esotope.generate(jqueryAST);
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': true });
