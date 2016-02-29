var fs = require('fs'),
  esprima = require('esprima'),
  sourcify = require('../src/sourcify'),
  expect = require('chai').expect;

function test(code, expected){
  var parsed = esprima.parse(code),
    generated = sourcify(parsed);

  expect(generated + '\n').to.be.equal(expected);
}

describe('es5 edge cases', function(){
  var files = fs.readdirSync(__dirname + '/fixtures/es5-edge-cases');
  files.sort().forEach(function(file){
    if (!/expected\.js$/.test(file)) {
      it(file, function(){
        var code,
          expectedFileName,
          expected;

        code = fs.readFileSync(__dirname + '/fixtures/es5-edge-cases/' + file, 'utf-8');
        expectedFileName = file.replace(/\.js$/, '.expected.js');
        expected = fs.readFileSync(__dirname + '/fixtures/es5-edge-cases/' + expectedFileName, 'utf-8');
        test(code, expected);
      });
    }
  });
})
