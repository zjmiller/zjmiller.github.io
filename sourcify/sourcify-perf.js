;(function(root){
"use _sict";

var esprima;

if (typeof exports === 'object') {
  esprima = require('esprima');
  module.exports = sourcify;
} else {
  esprima = root.esprima;
  root.sourcify = sourcify;
}

// The following three objects are
//   the nodes object,
//   and the customNodes object,
//
// The nodes object contains a function corresponding to each E_see node type.
// These functions describe how these nodes should be converted to source code.
//
// The customNodes object contains functions corresponding to atypical (i.e.,
// custom) ways of converting a node to source code.

var nodes = {
  ArrayExpression: function(){
    startPrecedenceCtx('no-sequence');
    _s += '[';
    if (!MULTILINE_ARR) _s += SPACE_INSIDE_ARR_BRACKETS;
    if (_n.elements.length){
      if (MULTILINE_ARR) {
        _s += LINEBREAK;
        indent();
        if (COMMA_FIRST_ARR) {
          _s += SPACE + SPACE_AFTER_ARR_COMMA; // looks better
          writeArrayLiteralElems(LINEBREAK + ',' + SPACE_AFTER_ARR_COMMA);
          if (TRAILING_COMMA_ARR) _s += LINEBREAK + ',';
        } else {
          writeArrayLiteralElems(',' + LINEBREAK);
          if (TRAILING_COMMA_ARR) _s += ',';
        }
        unIndent();
        _s += LINEBREAK;
      } else {
        var SAVED_LINEBREAK = LINEBREAK;
        LINEBREAK = NO_SPACE;
        suppressIndent = true;
        writeArrayLiteralElems(',' + SPACE_AFTER_ARR_COMMA);
        if (TRAILING_COMMA_ARR) _s += ',';
        LINEBREAK = SAVED_LINEBREAK;
        suppressIndent = false;
      }
    }
    if (!MULTILINE_ARR) _s += SPACE_INSIDE_ARR_BRACKETS;
    precedenceStack.pop();
    _s += ']';
  },

  AssignmentExpression: function(){
    startPrecedenceCtx('assignment');
    var parens = needParens();
    if (parens) _s += '(' + SPACE_INSIDE_PARENS_FOR_PAREN_EXPR;

    write(_n.left);

    _s += SPACE_BEFORE_BIN_OP + _n.operator + SPACE_AFTER_BIN_OP;

    write(_n.right);

    if (parens) _s += SPACE_INSIDE_PARENS_FOR_PAREN_EXPR + ')';
    precedenceStack.pop();
  },

  BinaryExpression: function(){
    startPrecedenceCtx('bin-op');
    var parens = needParens() || (_n.operator === 'in' && !allowInStack[allowInStack.length - 1]);
    if (parens) _s += '(' + SPACE_INSIDE_PARENS_FOR_PAREN_EXPR;

    write(_n.left);

    if (binOpNeedsSpace()) _s += REQ_SPACE;
    else _s += SPACE_BEFORE_BIN_OP;
    _s += _n.operator;
    if (binOpNeedsSpace()) _s += REQ_SPACE;
    else _s += SPACE_AFTER_BIN_OP;

    write(_n.right);

    if (parens) _s += SPACE_INSIDE_PARENS_FOR_PAREN_EXPR + ')';
    precedenceStack.pop();

    function binOpNeedsSpace(){
      if (_n.operator === 'in' || _n.operator === 'instanceof') return true;
      return false;
    }
  },

  Block: function(){
    _s += '/*' + _n.value + '*/';
  },

  BlockStatement: function(){
    startPrecedenceCtx('yes-sequence');
    _s += '{';
    if (_n.body.length) {
      _s += LINEBREAK;
      indent();
      writeArrayStmt(_n.body, LINEBREAK);
      unIndent();
      _s += LINEBREAK;
    }
    _s += '}';
    precedenceStack.pop();
  },

  BreakStatement: function(){
    _s += 'break';
    if (_n.label) {
      _s += REQ_SPACE;
      write(_n.label);
    }
    if (SEMICOLONS) _s += ';';
  },

  CallExpression: function(){
    startPrecedenceCtx('call');
    if (!allowCallStack[allowCallStack.length - 1]) _s += '(';
    newNeedsParensStack.push(true);
    write(_n.callee);
    newNeedsParensStack.pop();
    _s += SPACE_IN_CALL_EXPR + '(';
    startPrecedenceCtx('no-sequence');
    if (_n.arguments.length === 1) {
      _s += SPACE_INSIDE_PARENS_FOR_CALL_ARGS;
      write(_n.arguments[0]);
      _s += SPACE_INSIDE_PARENS_FOR_CALL_ARGS;
    } else if (_n.arguments.length > 1) {
      _s += SPACE_INSIDE_PARENS_FOR_CALL_ARGS;
      writeArrayExpr('arguments', ',' + SPACE_BETWEEN_CALL_ARGS);
      _s += SPACE_INSIDE_PARENS_FOR_CALL_ARGS;
    }
    precedenceStack.pop();
    _s += ')';
    if (!allowCallStack[allowCallStack.length - 1]) _s += ')';
    precedenceStack.pop();
  },

  CatchClause: function(){
    _s += SPACE_BEFORE_KEYWORD + 'catch' + SPACE_AFTER_KEYWORD + '(';
    write(_n.param);
    _s += ')' + SPACE_BEFORE_BLOCK;
    write(_n.body);
  },

  ConditionalExpression: function(){
    startPrecedenceCtx('conditional-expression');
    write(_n.test);
    _s += SPACE_IN_CONDITIONAL_EXPR + '?' + SPACE_IN_CONDITIONAL_EXPR;
    allowInStack.push(true);
    write(_n.consequent);
    allowInStack.pop();
    _s += SPACE_IN_CONDITIONAL_EXPR + ':' + SPACE_IN_CONDITIONAL_EXPR;
    write(_n.alternate);
    precedenceStack.pop();
  },

  ContinueStatement: function(){
    _s += 'continue';
    if (_n.label) {
      _s += REQ_SPACE;
      write(_n.label);
    }
  },

  DebuggerStatement: function(){
    _s += 'debugger';
    if (SEMICOLONS) _s += ';';
  },

  DoWhileStatement: function(){
    _s += 'do' + SPACE_AFTER_KEYWORD;
    write(_n.body);
    _s += SPACE_BEFORE_KEYWORD + 'while' + SPACE_AFTER_KEYWORD + '(';
    write(_n.test);
    _s += ')';
    if (SEMICOLONS) _s += ';';
  },

  EmptyStatement: function(){
    _s += ';';
  },

  ExpressionStatement: function(){
    // saved string so far
    var _sSoFar = _s;
    // clear string
    _s = '';
    // write expression to string
    write(_n.expression);
    // if string starts with word that will mislead parser
    // wrap string in parens
    if (/^(function|\{)/.test(_s)) _s = '(' + _s + ')';
    // add expression statement's semicolon
    if (SEMICOLONS) _s += ';';
    // set string equal to saved string plus string for expression statement
    _s = _sSoFar + _s;
  },

  ForStatement: function(){
    _s += 'for' + SPACE_AFTER_KEYWORD + '(';
    if (_n.init) {
      allowInStack.push(false);
      if (_n.init.type === 'VariableDeclaration')
        writeCustom(_n.init, 'VariableDeclarationWithoutSemi');
      else write(_n.init);
      allowInStack.pop();
    }
    _s += ';' + SPACE_IN_FOR_STATEMENT;
    if (_n.test) write(_n.test);
    _s += ';' + SPACE_IN_FOR_STATEMENT;
    if (_n.update) write(_n.update);
    _s += ')';
    if (_n.body.type === 'BlockStatement'){
      _s += SPACE_BEFORE_BLOCK;
      write(_n.body);
    } else {
      _s += SPACE;
      write(_n.body);
    }
  },

  ForInStatement: function(){
    _s += 'for' + SPACE_AFTER_KEYWORD + '(';
    if (_n.left.type === 'VariableDeclaration')
      writeCustom(_n.left, 'VariableDeclarationWithoutSemi');
    else write(_n.left);
    _s += REQ_SPACE + 'in' + REQ_SPACE;
    write(_n.right);
    _s += ')';
    if (_n.body.type === 'BlockStatement'){
      _s += SPACE_BEFORE_BLOCK;
      write(_n.body);
    } else {
      _s += SPACE;
      write(_n.body);
    }
  },

  FunctionDeclaration: function(){
    _s += 'function';
    if (_n.generator) {
      _s += SPACE_IN_GENERATOR + '*' + SPACE_IN_GENERATOR;
    }
    if (_n.id) { // Esprima uses null id func decl in default export
      _s += REQ_SPACE;
      write(_n.id);
    }
    _s += SPACE_BEFORE_FUNC_PARAMS + '(' + SPACE_INSIDE_PARENS_FOR_FUNC_PARAMS;
    if (_n.params.length === 1) {
      write(_n.params[0]);
    } else if (_n.params.length > 1) {
      writeArrayExpr('params', ',' + SPACE_BETWEEN_FUNC_PARAMS);
    }
    _s += SPACE_INSIDE_PARENS_FOR_FUNC_PARAMS + ')' + SPACE_BEFORE_FUNC_BLOCK;
    write(_n.body);
  },

  FunctionExpression: function(){
    _s += 'function';
    if (_n.generator) {
      _s += SPACE_IN_GENERATOR + '*' + SPACE_IN_GENERATOR;
    }
    if (_n.id) {
      _s += REQ_SPACE;
      write(_n.id);
    }
    _s += SPACE_BEFORE_FUNC_PARAMS + '(' + SPACE_INSIDE_PARENS_FOR_FUNC_PARAMS;
    if (_n.params.length === 1) {
      write(_n.params[0]);
    } else if (_n.params.length > 1) {
      writeArrayExpr('params', ',' + SPACE_BETWEEN_FUNC_PARAMS);
    }
    _s += SPACE_INSIDE_PARENS_FOR_FUNC_PARAMS + ')' + SPACE_BEFORE_FUNC_BLOCK;
    write(_n.body);
  },

  Identifier: function(){
    _s += _n.name;
  },

  IfStatement: function(){
    _s += 'if' + SPACE_AFTER_KEYWORD + '(';
    write(_n.test);
    _s += ')';
    if (_n.consequent.type === 'BlockStatement'){
      _s += SPACE_BEFORE_BLOCK;
      write(_n.consequent);
    } else {
      _s += SPACE;
      write(_n.consequent);
    }
    if (_n.alternate) {
      _s += 'else';
      if (_n.alternate.type === 'BlockStatement'){
        _s += SPACE_AFTER_KEYWORD;
        write(_n.alternate);
      } else {
        _s += SPACE;
        write(_n.alternate);
      }
    }
  },

  LabeledStatement: function(){
    write(_n.label);
    _s += ':' + SPACE;
    write(_n.body);
  },

  Line: function(){
    _s += '//' + _n.value;
  },

  Literal: function(){
    _s += _n.raw;
  },

  LogicalExpression: function(){
    startPrecedenceCtx('bin-op');
    var parens = needParens();
    if (parens) _s += '(' + SPACE_INSIDE_PARENS_FOR_PAREN_EXPR;
    write(_n.left);
    _s += SPACE_BEFORE_BIN_OP + _n.operator + SPACE_AFTER_BIN_OP;
    write(_n.right);
    if (parens) _s += SPACE_INSIDE_PARENS_FOR_PAREN_EXPR + ')';
    precedenceStack.pop();
  },

  MemberExpression: function(){
    startPrecedenceCtx('member');
    newNeedsParensStack.push(true);
    write(_n.object);
    newNeedsParensStack.pop();
    var computed = _n.computed;
    if (computed) {
      startPrecedenceCtx('yes-sequence');
      _s += '[';
    }
    else _s += '.';
    write(_n.property);
    if (computed) {
      _s += ']';
      precedenceStack.pop();
    }
    precedenceStack.pop();
  },

  NewExpression: function(){
    if (_n.arguments.length) startPrecedenceCtx('new-with-args');
    else startPrecedenceCtx('new-without-args');
    _s += 'new' + REQ_SPACE;
    allowCallStack.push(false);
    write(_n.callee);
    allowCallStack.pop();
    if (newNeedsParensStack[newNeedsParensStack.length - 1] || _n.arguments.length) _s += '(';
    writeArrayExpr('arguments', ',' + SPACE_BETWEEN_CALL_ARGS);
    if (newNeedsParensStack[newNeedsParensStack.length - 1] || _n.arguments.length) _s += ')';
    precedenceStack.pop();
  },

  ObjectExpression: function(){
    startPrecedenceCtx('no-sequence');
    _s += '{';
    if (!MULTILINE_OBJ) _s += SPACE_INSIDE_OBJ_BRACKETS;
    if (_n.properties.length){
      if (MULTILINE_OBJ) {
        _s += LINEBREAK;
        indent();
        if (COMMA_FIRST_OBJ) {
          // need to pushes everything out an extra indent
          // except first line of property with comma
          LINEBREAK += INDENT_INCREMENT;

          _s += SPACE + SPACE_AFTER_OBJ_COMMA; // looks better

          // Linebreak.slice(0, -2) makes sure the comma gets pulled back.
          // Basically, if the property value is a function, we want
          // the body of the function to get double indented. If it were to just
          // get a single indent, it would start two spaces past the comma. Which
          // looks like 0 spaces past the start of the key name. The double indent
          // makes the function body start 2 spaces past the start of the key name.
          writeArrayExpr('properties', LINEBREAK.slice(0, -2) + ',' + SPACE_AFTER_OBJ_COMMA);
          if (TRAILING_COMMA_OBJ) _s += LINEBREAK.slice(0, -2) + ',';
          LINEBREAK = LINEBREAK.slice(0, -2);
        } else {
          writeArrayExpr('properties', ',' + LINEBREAK);
          if (TRAILING_COMMA_OBJ) _s += ',';
        }
        unIndent();
        _s += LINEBREAK;
      } else {
        var SAVED_LINEBREAK = LINEBREAK;
        LINEBREAK = NO_SPACE;
        suppressIndent = true;
        writeArrayExpr('properties', ',' + SPACE_AFTER_OBJ_COMMA);
        if (TRAILING_COMMA_OBJ) _s += ',';
        LINEBREAK = SAVED_LINEBREAK;
        suppressIndent = false;
      }
    }
    if (!MULTILINE_OBJ) _s += SPACE_INSIDE_OBJ_BRACKETS;
    _s += '}';
    precedenceStack.pop();
  },

  Program: function(){
    writeArrayStmt(_n.body, LINEBREAK);
  },

  Property: function(){
    if (_n.kind === 'get' || _n.kind === 'set') {
      _s += _n.kind + REQ_SPACE;
      if (_n.computed) _s += '[';
      write(_n.key);
      if (_n.computed) _s += ']';
      writeCustom(_n.value, 'FunctionBody');
    } else {
      if (_n.computed) _s += '[';
      write(_n.key);
      if (_n.computed) _s += ']';
      _s += SPACE_AFTER_OBJ_KEY + ':' + SPACE_BEFORE_OBJ_VALUE;
      write(_n.value);
    }
  },

  ReturnStatement: function(){
    _s += 'return';
    if (_n.argument) {
      _s += REQ_SPACE;
      write(_n.argument);
    }
    if (SEMICOLONS) _s += ';';
  },

  SequenceExpression: function(){
    startPrecedenceCtx('yes-sequence');
    var parens = needParens();
    if (parens) _s += '(';
    writeArrayExpr('expressions', ',' + SPACE_AFTER_BIN_OP);
    if (parens) _s += ')';
    precedenceStack.pop();
  },

  SwitchCase: function(){
    if (_n.test) {
      _s += 'case' + REQ_SPACE;
      write(_n.test);
      _s += ':';
    } else {
      _s += 'default:';
    }

    if (_n.consequent){
      _s += LINEBREAK;
      indent();
      writeArrayStmt(_n.consequent, LINEBREAK);
      unIndent();
    }
  },

  SwitchStatement: function(){
    _s += 'switch' + SPACE_AFTER_KEYWORD + '(';
    write(_n.discriminant);
    _s += ')' + SPACE_BEFORE_BLOCK + '{';
    if (_n.cases.length){
      _s += LINEBREAK;
      indent();
      writeArrayStmt(_n.cases, LINEBREAK);
      unIndent();
    }
    _s += LINEBREAK + '}';
  },

  ThisExpression: function(){
    _s += 'this';
  },

  ThrowStatement: function(){
    _s += 'throw' + REQ_SPACE;
    write(_n.argument);
    if (SEMICOLONS) _s += ';';
  },

  TryStatement: function(){
    _s += 'try' + SPACE_AFTER_KEYWORD;
    write(_n.block);
    if (_n.handler) write(_n.handler);
    if (_n.finalizer) {
      _s += SPACE_BEFORE_KEYWORD + 'finally' + SPACE_AFTER_KEYWORD;
      write(_n.finalizer);
    }
  },

  UpdateExpression: function(){
    if (_n.prefix) startPrecedenceCtx('update-prefix');
    else startPrecedenceCtx('update-postfix');
    var parens = needParens();
    if (parens) _s += '(' + SPACE_INSIDE_PARENS_FOR_PAREN_EXPR;
    if (_n.prefix) _s +=  _n.operator + SPACE_AFTER_PREFIX_UN_OP;
    write(_n.argument);
    if (!_n.prefix) _s += SPACE_BEFORE_POSTFIX_UN_OP + _n.operator;
    if (parens) _s += SPACE_INSIDE_PARENS_FOR_PAREN_EXPR + ')';
    precedenceStack.pop();
  },

  UnaryExpression: function(){
    startPrecedenceCtx('un-op');
    var parens = needParens();
    if (parens) _s += '(' + SPACE_INSIDE_PARENS_FOR_PAREN_EXPR;
    if (_n.prefix) {
      _s += _n.operator;
      if (unOpNeedsSpace()) _s += REQ_SPACE;
      else _s += SPACE_AFTER_PREFIX_UN_OP;
    }
    write(_n.argument);
    // currently no postfix unary operators
    if (parens) _s += SPACE_INSIDE_PARENS_FOR_PAREN_EXPR + ')';
    precedenceStack.pop();

    function unOpNeedsSpace(){
      if (_n.operator === 'typeof' || _n.operator === 'void' || _n.operator === 'delete') return true;
      return false;
    }
  },

  VariableDeclaration: function(){
    _s += _n.kind;
    if (_n.declarations.length){
      _s += REQ_SPACE;
      write(_n.declarations[0]);
      if (_n.declarations.length > 1 && !COMMA_FIRST_VAR) {
        _s += ',' + SPACE_AFTER_VAR_COMMA;
      }
      if (_n.declarations.length > 1 && MULTILINE_VAR) {
        _s += LINEBREAK;
        indent();
        if (COMMA_FIRST_VAR) {
          _s += ',' + SPACE_AFTER_VAR_COMMA;
          writeArrayExpr('declarations', LINEBREAK + ',' + SPACE_AFTER_ARR_COMMA, 1);
          _s += LINEBREAK; // when comma first, puts semicolon on next line by itself
        } else {
          writeArrayExpr('declarations', ',' + LINEBREAK, 1);
        }
        if (SEMICOLONS) _s += ';';
        unIndent();
      } else if (_n.declarations.length > 1) {
        var SAVED_LINEBREAK = LINEBREAK;
        LINEBREAK = NO_SPACE;
        suppressIndent = true;
        writeArrayExpr('declarations', ',' + SPACE_AFTER_VAR_COMMA, 1);
        if (SEMICOLONS) _s += ';';
        LINEBREAK = SAVED_LINEBREAK;
        suppressIndent = false;
      } else {
        if (SEMICOLONS) _s += ';';
      }
    }
  },

  VariableDeclarator: function(){
    write(_n.id);

    if (_n.init) {
      _s += SPACE_BEFORE_BIN_OP + '=' + SPACE_AFTER_BIN_OP;
      write(_n.init);
    }
  },

  WhileStatement: function(){
    _s += 'while' + SPACE_AFTER_KEYWORD + '(';
    write(_n.test);
    _s += ')';
    if (_n.body.type === 'BlockStatement'){
      _s += SPACE_BEFORE_BLOCK;
      write(_n.body);
    } else {
      _s += REQ_SPACE;
      write(_n.body);
    }
  },

  WithStatement: function(){
    _s += 'with' + SPACE_AFTER_KEYWORD + '(';
    write(_n.object);
    _s += ')';
    if (_n.body.type === 'BlockStatement'){
      _s += SPACE_BEFORE_BLOCK;
      write(_n.body);
    } else {
      _s += SPACE;
      write(_n.body);
    }
  },
}

var customNodes = {
  ExpressionStatementWithDefensiveSemi: function(){
    // saved string so far
    var _sSoFar = _s;
    // clear string
    _s = '';
    // when not using semicolons everywhere else
    // use defensive semicolons here
    if (!SEMICOLONS) _s += ';';
    // write expression to string
    write(_n.expression);
    // if string starts with word that will mislead parser
    // wrap string in parens
    if (/^(function|\{)/.test(_s)) _s = '(' + _s + ')';
    // add expression statement's semicolon
    if (SEMICOLONS) _s += ';';
    // set string equal to saved string plus string for expression statement
    _s = _sSoFar + _s;
  },

  FunctionBody: function(){
    _s += SPACE_BEFORE_FUNC_PARAMS + '(' + SPACE_INSIDE_PARENS_FOR_FUNC_PARAMS;
    if (_n.params.length === 1) {
      write(_n.params[0]);
    } else if (_n.params.length > 1) {
      writeArrayExpr('params', ',' + SPACE_BETWEEN_FUNC_PARAMS);
    } // but shld only have 1 arg... b/c used in setters
    _s += SPACE_INSIDE_PARENS_FOR_FUNC_PARAMS + ')' + SPACE_BEFORE_FUNC_BLOCK;
    write(_n.body);
  },

  VariableDeclarationWithoutSemi: function(){
    _s += _n.kind + REQ_SPACE;
    writeArrayExpr('declarations', ',' + SPACE_AFTER_VAR_COMMA);
  },
}

// Formatting
var SPACE = ' ',
  NO_SPACE = '',
  REQ_SPACE = SPACE,
  LINEBREAK = '\n';

// Formatting options
var SEMICOLONS,
    PRESERVE_COMMENTS,
    PRESERVE_LINEBREAKS_BETWEEN_STATEMENTS,
    INITIAL_INDENT,
    INDENT_INCREMENT,
    SPACE_AFTER_ARR_COMMA,
    SPACE_AFTER_BIN_OP,
    SPACE_AFTER_KEYWORD,
    SPACE_AFTER_OBJ_COMMA,
    SPACE_AFTER_OBJ_KEY,
    SPACE_AFTER_PREFIX_UN_OP,
    SPACE_AFTER_VAR_COMMA, // can make var decl multiline by setting this to LINEBREAK + INDENT_INCREMENT
    SPACE_BEFORE_BIN_OP,
    SPACE_BEFORE_BLOCK, // doesn't include function bodies
    SPACE_BEFORE_FUNC_BLOCK,
    SPACE_BEFORE_FUNC_PARAMS,
    SPACE_BEFORE_KEYWORD, // else, catch, finally, while in do...while
    SPACE_BEFORE_OBJ_VALUE,
    SPACE_BEFORE_POSTFIX_UN_OP,
    SPACE_BETWEEN_CALL_ARGS,
    SPACE_BETWEEN_FUNC_PARAMS,
    SPACE_IN_CALL_EXPR,
    SPACE_IN_CONDITIONAL_EXPR,
    SPACE_IN_FOR_STATEMENT,
    SPACE_IN_GENERATOR,
    SPACE_INSIDE_ARR_BRACKETS,
    SPACE_INSIDE_OBJ_BRACKETS,
    SPACE_INSIDE_PARENS_FOR_CALL_ARGS,
    SPACE_INSIDE_PARENS_FOR_FUNC_PARAMS,
    SPACE_INSIDE_PARENS_FOR_PAREN_EXPR,
    TRAILING_COMMA_ARR,
    TRAILING_COMMA_OBJ,
    MULTILINE_ARR,
    MULTILINE_OBJ,
    MULTILINE_VAR,
    COMMA_FIRST_ARR,
    COMMA_FIRST_OBJ,
    COMMA_FIRST_VAR;

var defaultOptions = {
  semicolons: true,
  preserveComments: true,
  preserveLinebreaksBetweenStatements: false,
  initialIndent: NO_SPACE,
  indentIncrement: SPACE + SPACE,
  spaceAfterArrComma: SPACE,
  spaceAfterBinOp: SPACE,
  spaceAfterKeyword: SPACE,
  spaceAfterObjComma: SPACE,
  spaceAfterObjKey: NO_SPACE,
  spaceAfterPrefixUnOp: NO_SPACE,
  spaceAfterVarComma: SPACE, // can make decl multiline by setting this to LINEBREAK + INDENT_INCREMENT
  spaceBeforeBinOp: SPACE,
  spaceBeforeBlock: SPACE, // doesn't include function bodies
  spaceBeforeFuncBlock: NO_SPACE,
  spaceBeforeFuncParams: NO_SPACE,
  spaceBeforeKeyword: SPACE, // else, catch, finally, while in do...while
  spaceBeforeObjValue: SPACE,
  spaceBeforePostfixUnOp: NO_SPACE,
  spaceBetweenCallArgs: SPACE,
  spaceBetweenFuncParams: SPACE,
  spaceInCallExpr: NO_SPACE,
  spaceInConditionalExpr: SPACE,
  spaceInForStatement: SPACE,
  spaceInGenerator: NO_SPACE,
  spaceInsideArrBrackets: NO_SPACE,
  spaceInsideObjBrackets: NO_SPACE,
  spaceInsideParensForCallArgs: NO_SPACE,
  spaceInsideParensForFuncParams: NO_SPACE,
  spaceInsideParensForParenExpr: NO_SPACE,
  trailingCommaObj: true,
  trailingCommaArr: false,
  multilineArr: false,
  multilineObj: true,
  multilineVar: false,
  commaFirstArr: false,
  commaFirstObj: false,
  commaFirstVar: false,
};

var optionsHaveBeenSet = false;

function setOptions(options){
  var options = options || {};
  var spaceOptionsRegex = /initialIndent|indentIncrement|spaceAfterArrComma|spaceAfterBinOp|spaceAfterKeyword|spaceAfterObjComma|spaceAfterObjKey|spaceAfterPrefixUnOp|spaceAfterVarComma|spaceBeforeBinOp|spaceBeforeBlock|spaceBeforeFuncBlock|spaceBeforeFuncParams|spaceBeforeKeyword|spaceBeforeObjValue|spaceBeforePostfixUnOp|spaceBetweenCallArgs|spaceBetweenFuncParams|spaceInCallExpr|spaceInConditionalExpr|spaceInForStatement|spaceInGenerator|spaceInsideArrBrackets|spaceInsideObjBrackets|spaceInsideParensForCallArgs|spaceInsideParensForFuncParams|spaceInsideParensForParenExpr/;

  for (var key in options){
    if (spaceOptionsRegex.test(key)) {
      options[key] = convertToSpaces(options[key]);
    }
  }

  addDefaults(options, defaultOptions);
  SEMICOLONS = options.semicolons;
  PRESERVE_COMMENTS = options.preserveComments;
  PRESERVE_LINEBREAKS_BETWEEN_STATEMENTS = options.preserveLinebreaksBetweenStatements;
  INITIAL_INDENT = options.initialIndent;
  INDENT_INCREMENT = options.indentIncrement;
  SPACE_AFTER_ARR_COMMA = options.spaceAfterArrComma;
  SPACE_AFTER_BIN_OP = options.spaceAfterBinOp;
  SPACE_AFTER_KEYWORD = options.spaceAfterKeyword;
  SPACE_AFTER_OBJ_COMMA = options.spaceAfterObjComma;
  SPACE_AFTER_OBJ_KEY = options.spaceAfterObjKey;
  SPACE_AFTER_PREFIX_UN_OP = options.spaceAfterPrefixUnOp;
  SPACE_AFTER_VAR_COMMA = options.spaceAfterVarComma; // can make decl multiline by setting this to LINEBREAK + INDENT_INCREMENT
  SPACE_BEFORE_BIN_OP = options.spaceBeforeBinOp;
  SPACE_BEFORE_BLOCK = options.spaceBeforeBlock; // doesn't include function bodies
  SPACE_BEFORE_FUNC_BLOCK = options.spaceBeforeFuncBlock;
  SPACE_BEFORE_FUNC_PARAMS = options.spaceBeforeFuncParams;
  SPACE_BEFORE_KEYWORD = options.spaceBeforeKeyword; // else, catch, finally, while in do...while
  SPACE_BEFORE_OBJ_VALUE = options.spaceBeforeObjValue;
  SPACE_BEFORE_POSTFIX_UN_OP = options.spaceBeforePostfixUnOp;
  SPACE_BETWEEN_CALL_ARGS = options.spaceBetweenCallArgs;
  SPACE_BETWEEN_FUNC_PARAMS = options.spaceBetweenFuncParams;
  SPACE_IN_CALL_EXPR = options.spaceInCallExpr;
  SPACE_IN_CONDITIONAL_EXPR = options.spaceInConditionalExpr;
  SPACE_IN_FOR_STATEMENT = options.spaceInForStatement;
  SPACE_IN_GENERATOR = options.spaceInGenerator;
  SPACE_INSIDE_ARR_BRACKETS = options.spaceInsideArrBrackets;
  SPACE_INSIDE_OBJ_BRACKETS = options.spaceInsideObjBrackets;
  SPACE_INSIDE_PARENS_FOR_CALL_ARGS = options.spaceInsideParensForCallArgs;
  SPACE_INSIDE_PARENS_FOR_FUNC_PARAMS = options.spaceInsideParensForFuncParams;
  SPACE_INSIDE_PARENS_FOR_PAREN_EXPR = options.spaceInsideParensForParenExpr;
  TRAILING_COMMA_ARR = options.trailingCommaArr;
  TRAILING_COMMA_OBJ = options.trailingCommaObj;
  MULTILINE_ARR = options.multilineArr;
  MULTILINE_OBJ = options.multilineObj;
  MULTILINE_VAR = options.multilineVar;
  COMMA_FIRST_ARR = options.commaFirstArr;
  COMMA_FIRST_OBJ = options.commaFirstObj;
  COMMA_FIRST_VAR = options.commaFirstVar;

  optionsHaveBeenSet = true;

  function addDefaults(target, defaults) {
    for (var key in defaults) {
      if (target[key] === undefined) {
        target[key] = defaults[key];
      }
    }
    return target;
  }

  function convertToSpaces(option){
    if (typeof option === 'number') {
      var result = '';
      for(var i = 0; i < option; i++) result += SPACE;
      return result;
    }
    if (typeof option === 'string') {
      return option;
    }
    if (option === true) return SPACE;
    if (option === false) return NO_SPACE;
  }
}

// The string we write to, the current node, and the current node's type
var _s, _n, _t;


// precedence API
// Handles precedence
var precedenceStack = [0];

// Starts precedence ctx with the given number
// If no number given, assumes it is binary op
// Checks bin op of current node
var startPrecedenceCtx = function(newPrecedence){
  var newPrecedenceNum;
  if (newPrecedence === 'bin-op') {
    var op = _n.operator;
    newPrecedenceNum = getBinOpPrec(op);
  } else {
    newPrecedenceNum = stringToPrec(newPrecedence);
  }

  precedenceStack.push(newPrecedenceNum);
}

var getBinOpPrec = function(op){
  if (/\=/.test(op)) return 3;
  if (/\=\=|\!\=|\=\=\=|\!\=\=/.test(op)) return 10;
  if (/\+\=/.test(op)) return 3;
  if (/\<|\<\=|\>|\>\=|in|instanceof'/.test(op)) return 11;
  if (/\+|\-/.test(op)) return 13;
  if (/\*\*|\*|\/|\%/.test(op)) return 14;
  if (op === '||') return 5;
  if (op === '&&') return 6;
  if (/\-\=|\*\=|\/\=|\%\=|\<\<\=|\>\>\=|\>\>\>\=|\&\=|\^\=|\|\=/.test(op)) return 3;
  if (/\<\<|\>\>|\>\>\>/.test(op)) return 12;
  if (op === '|') return 7;
  if (op === '^') return 8;
  if (op === '&') return 9;
}
var stringToPrec = function(str){
  if (str === 'yes-sequence') return 1;
  if (str === 'no-sequence') return 2;
  if (str === 'assignment') return 3;
  if (str === 'conditional-expression') return 3;
  if (str === 'un-op') return 15;
  if (str === 'update-prefix') return 15;
  if (str === 'update-postfix') return 16;
  if (str === 'call') return 17;
  if (str === 'new-without-args') return 17;
  if (str === 'member') return 18;
  if (str === 'new-with-args') return 18;
}

var needParens = function(){
  return precedenceStack[precedenceStack.length - 1] < precedenceStack[precedenceStack.length - 2];
}

var allowInStack = [true];

var nodeAllowsInRegex = /BlockStatement|DoWhileStatement|ExpressionStatement|ForInStatement|FunctionDeclaration|IfStatement|LabeledStatement|ReturnStatement|SwitchStatement|ThrowStatement|TryStatement|VariableDeclaration|WhileStatement|WithStatement|ArrayExpression|CallExpression|FunctionExpression|ObjectExpression|MemberExpression|NewExpression/;

var newNeedsParensStack = [false];

var allowCallStack = [true];


// Handles indenting API

var currentIndent = '';
// used to turn off indentation in obj and arr literals
// when relevant multiline option is set to false
var suppressIndent = false;
var indent = function(increment){
  if (!suppressIndent) {
    if (increment) {
      currentIndent += increment;
      _s += increment; // indents first line extra
    } else {
      currentIndent += INDENT_INCREMENT;
      _s += INDENT_INCREMENT; // indents first line extra
    }
    LINEBREAK += INDENT_INCREMENT; // indents subsequent lines
  }
}
var unIndent = function(){
  if (!suppressIndent){
    currentIndent = currentIndent.slice(0, -INDENT_INCREMENT.length);
    LINEBREAK = LINEBREAK.slice(0, -INDENT_INCREMENT.length);
  }
}

var enhanceIndent = function(enhancement){
  currentIndent += enhancement;
}
var dehanceIndent = function(dehancement){
  currentIndent = currentIndent.slice(0, -dehancement.length);
}

function sourcify(input, options){
  setOptions(options);
  _s = '';
  if (typeof input === 'string') {
    input = esprima.parse(input, {
      attachComment: true,
      loc: true
    });
  }
  _n = input;
  nodes.Program(input);
  return _s;
}

function write(input){
  if (input.type === 'Identifier') return _s += input.name;
  if (input.type === 'Literal') return _s += input.raw;

  // save old node
  var saved = _n;

  beforeWriteNode(input);
  nodes[_t]();
  afterWriteNode(saved);
}

function writeCustom(input, customHandler){
  // see write() for comments on _sucture
  var saved = _n;
  beforeWriteNode(input);
  customNodes[customHandler]();
  afterWriteNode(saved);
}

function beforeWriteNode(input){
  _n = input;
  _t = _n.type;

  if (_n.leadingComments && PRESERVE_COMMENTS && isStatementRegex.test(_t)) {
    writeArrayStmt(_n.leadingComments, LINEBREAK);
    _s += LINEBREAK;
  }

  if (nodeAllowsInRegex.test(_t)) allowInStack.push(true);
  if (_t !== 'NewExpression') newNeedsParensStack.push(false);
  if (_t !== 'CallExpression') allowCallStack.push(true);
}

function afterWriteNode(saved){
    // Don't write trailing comments here
    // b/c we don't want to duplicate comments
    // When is a trailing comment not also a leading comment?
    // Only when it occurs at the end of an array (I'm pretty sure).
    // So the code to write trailing comments occurs in writeArray()

    if (nodeAllowsInRegex.test(_t)) allowInStack.pop();
    if (_t !== 'NewExpression') newNeedsParensStack.pop();
    if (_t !== 'CallExpression') allowCallStack.pop();

    _n = saved;
    _t = _n.type;
}

var isStatementRegex = /BlockStatement|BreakStatement|ContinueStatement|DoWhileStatement|DebuggerStatement|EmptyStatement|ExpressionStatement|ForInStatement|ForStatement|FunctionDeclaration|IfStatement|LabeledStatement|ReturnStatement|SwitchStatement|ThrowStatement|VariableDeclaration|WhileStatement|WithStatement/;

function linebreaksBtwnStmts(stmt1, stmt2){
  var lineStmt1EndsOn = stmt1.loc.end.line;
  var lineStmt2StartsOn = stmt2.loc.start.line;
  var linesBetweenStmts = lineStmt2StartsOn - lineStmt1EndsOn;

  // Some of these lines might be occupied by comments
  var linesWithComments = calcLinesWithComments(stmt1, stmt2);
  linesBetweenStmts = linesBetweenStmts - linesWithComments;

  if (linesBetweenStmts === 0) return SPACE;

  var result = '';
  for (var i = 1; i <= linesBetweenStmts; i++){
    if (i !== linesBetweenStmts) result += '\n';
    else result += LINEBREAK;
  }
  return result;
}

function calcLinesWithComments(stmt1, stmt2){
  var result = 0;
  if (!stmt1.trailingComments) return result;

  stmt1.trailingComments.forEach(function(comment){
    if (comment.type === 'Line') result++;
    if (comment.type === 'Block') {
      result = result + (comment.value.match(new RegExp(LINEBREAK, 'g')) || []).length + 1;
    }
  });
  return result;
}

function writeArrayStmt(arr, sep){
  var saved = _n,
    end = arr.length;

  for (var i = 0; i < end; i++){
    var item = arr[i];
    _n = item;
    _t = _n.type;
    if (_t === 'ExpressionStatement' && !SEMICOLONS) writeCustom(item, 'ExpressionStatementWithDefensiveSemi');
    else write(item);

    if (PRESERVE_LINEBREAKS_BETWEEN_STATEMENTS && isStatementRegex.test(_t)) {
      if (i < end - 1) {
        var nextNode = arr[i + 1];
        _s += linebreaksBtwnStmts(item, nextNode);
      }
    } else if (i < end - 1) _s += sep;
  }

  if (_n.trailingComments && PRESERVE_COMMENTS) {
    _s += SPACE;
    writeArrayStmt(_n.trailingComments, '\n');
  }

  _n = saved;
  _t = _n.type;
}

var writeArrayExpr = function(field, sep, start, end){
  var saved = _n;
  start = start || 0;
  end = end || saved[field].length;

  for(var i = start; i < end; i++){
    var item = saved[field][i];
    _n = item;
    _t = _n.type;
    write(item);
    if (i < end - 1) _s += sep;
  }

  _n = saved;
  _t = _n.type;
}

var writeArrayLiteralElems = function(sep){
  var saved = _n,
    elements = saved['elements'];

  for(var i = 0; i < elements.length; i++){
    var item = elements[i];
    if (item) { // this is to handle sparse arrays
      _n = item;
      _t = _n.type;
      write(item);
    }
    if (i < elements.length - 1) _s += sep;
  }

  _n = saved;
  _t = _n.type;
}

})(this);
