var fs = require('fs'),
  esprima = require('esprima'),
  sourcify = require('../src/sourcify'),
  assert = require('chai').assert;

function test(code, expected){
  var parsed = esprima.parse(code),
    generated = sourcify(parsed);

  assert.equal(generated + '\n', expected);
}

describe('es5 standard', function(){
  var files = fs.readdirSync(__dirname + '/fixtures/es5-standard');
  files.sort().forEach(function(file){
    if (!/expected\.js$/.test(file)) {
      it(file, function(){
        var code,
          expectedFileName,
          expected;

        code = fs.readFileSync(__dirname + '/fixtures/es5-standard/' + file, 'utf-8');
        expectedFileName = file.replace(/\.js$/, '.expected.js');
        expected = fs.readFileSync(__dirname + '/fixtures/es5-standard/' + expectedFileName, 'utf-8');
        test(code, expected);
      });
    }
  });
})
