;(function(root){
"use strict";

var esprima;

if (typeof exports === 'object') {
  esprima = require('esprima');
  module.exports = sourcify;
} else {
  esprima = root.esprima;
  root.sourcify = sourcify;
}


// This object contains functions that describe how a node type should be
// converted to source code.
var nodes = {
  ArrayExpression: function(){
    startPrecedenceCtx('no-sequence');
    write('[');
    if (!MULTILINE_ARR) write(SPACE_INSIDE_ARR_BRACKETS);
    if (has.elements){
      if (MULTILINE_ARR) {
        write(LINEBREAK);
        indent();
        if (COMMA_FIRST_ARR) {
          write(SPACE + SPACE_AFTER_ARR_COMMA); // looks better
          writeArray('elements', LINEBREAK + ',' + SPACE_AFTER_ARR_COMMA);
          if (TRAILING_COMMA_ARR) write(LINEBREAK + ',');
        } else {
          writeArray('elements', ',' + LINEBREAK);
          if (TRAILING_COMMA_ARR) write(',');
        }
        unIndent();
        write(LINEBREAK);
      } else {
        var SAVED_LINEBREAK = LINEBREAK;
        LINEBREAK = NO_SPACE;
        suppressIndent = true;
        writeArray('elements', ',' + SPACE_AFTER_ARR_COMMA);
        if (TRAILING_COMMA_ARR) write(',');
        LINEBREAK = SAVED_LINEBREAK;
        suppressIndent = false;
      }
    }
    if (!MULTILINE_ARR) write(SPACE_INSIDE_ARR_BRACKETS);
    endPrecedenceCtx();
    write(']');
  },

  AssignmentExpression: function(){
    startPrecedenceCtx('assignment');
    if (need.parens) write('(' + SPACE_INSIDE_PARENS_FOR_PAREN_EXPR);
    write.left;
    write(SPACE_BEFORE_BIN_OP);
    write.operator;
    write(SPACE_AFTER_BIN_OP);
    write.right;
    if (need.parens) write(SPACE_INSIDE_PARENS_FOR_PAREN_EXPR + ')');
    endPrecedenceCtx();
  },

  BinaryExpression: function(){
    startPrecedenceCtx('bin-op');
    if (need.parens) write('(' + SPACE_INSIDE_PARENS_FOR_PAREN_EXPR);
    write.left;
    if (binOpNeedsSpace()) write(REQ_SPACE);
    else write(SPACE_BEFORE_BIN_OP);
    write.operator;
    if (binOpNeedsSpace()) write(REQ_SPACE);
    else write(SPACE_AFTER_BIN_OP);
    write.right;
    if (need.parens) write(SPACE_INSIDE_PARENS_FOR_PAREN_EXPR + ')');
    endPrecedenceCtx();

    function binOpNeedsSpace(){
      if (currentNode.operator === 'in' || currentNode.operator === 'instanceof') return true;
      return false;
    }
  },

  Block: function(){
    write('/*');
    write.value;
    write('*/');
  },

  BlockStatement: function(){
    startPrecedenceCtx('yes-sequence');
    write('{');
    if (has.body) {
      write(LINEBREAK);
      indent();
      writeArray('body', LINEBREAK);
      unIndent();
      write(LINEBREAK);
    }
    write('}');
    endPrecedenceCtx(1);
  },

  BreakStatement: function(){
    write('break');
    if (has.label) {
      write(REQ_SPACE);
      write.label;
    }
    if (SEMICOLONS) write(';');
  },

  CallExpression: function(){
    startPrecedenceCtx('call');
    if (!is.callAllowed) write('(');
    newNeedsParens();
    write.callee;
    resetNewNeedsParens();
    write(SPACE_IN_CALL_EXPR);
    write('(');
    startPrecedenceCtx('no-sequence');
    if (has.arguments) write(SPACE_INSIDE_PARENS_FOR_CALL_ARGS);
    writeArray('arguments', ',' + SPACE_BETWEEN_CALL_ARGS);
    if (has.arguments) write(SPACE_INSIDE_PARENS_FOR_CALL_ARGS);
    endPrecedenceCtx('no-sequence');
    write(')');
    if (!is.callAllowed) write(')');
    endPrecedenceCtx();
  },

  CatchClause: function(){
    write(SPACE_BEFORE_KEYWORD);
    write('catch');
    write(SPACE_AFTER_KEYWORD);
    write('(');
    write.param;
    write(')');
    write(SPACE_BEFORE_BLOCK);
    write.body;
  },

  ConditionalExpression: function(){
    startPrecedenceCtx('conditional-expression');
    write.test;
    write(SPACE_IN_CONDITIONAL_EXPR);
    write('?');
    write(SPACE_IN_CONDITIONAL_EXPR);
    allowIn();
    write.consequent;
    resetAllowIn();
    write(SPACE_IN_CONDITIONAL_EXPR);
    write(':');
    write(SPACE_IN_CONDITIONAL_EXPR);
    write.alternate;
    endPrecedenceCtx();
  },

  ContinueStatement: function(){
    write('continue');
    if (has.label) {
      write(REQ_SPACE);
      write.label;
    }
  },

  DebuggerStatement: function(){
    write('debugger');
    if (SEMICOLONS) write(';');
  },

  DoWhileStatement: function(){
    write('do');
    write(SPACE_AFTER_KEYWORD);
    write.body;
    write(SPACE_BEFORE_KEYWORD);
    write('while');
    write(SPACE_AFTER_KEYWORD);
    write('(');
    write.test;
    write(')');
    if (SEMICOLONS) write(';');
  },

  EmptyStatement: function(){
    write(';');
  },

  ExpressionStatement: function(){
    // saved string so far
    var strSoFar = str;
    // clear string
    str = '';
    // write expression to string
    write.expression;
    // if string starts with word that will mislead parser
    // wrap string in parens
    if (str.slice(0, 8) === 'function') str = '(' + str + ')';
    if (str.slice(0, 5) === 'class') str = '(' + str + ')';
    if (str.slice(0, 5) === 'async') str = '(' + str + ')';
    if (str.slice(0, 1) === '{') str = '(' + str + ')';
    // add expression statement's semicolon
    if (SEMICOLONS) write(';');
    // set string equal to saved string plus string for expression statement
    str = strSoFar + str;
  },

  ForStatement: function(){
    write('for');
    write(SPACE_AFTER_KEYWORD);
    write('(');
    if (has.init) {
      disallowIn();
      if (type.of.init === 'VariableDeclaration')
        writeCustom(currentNode.init, 'VariableDeclarationWithoutSemi');
      else write.init;
      resetAllowIn();
    }
    write(';'); // required semicolon
    write(SPACE_IN_FOR_STATEMENT);
    if (has.test) write.test;
    write(';'); // required semicolon
    write(SPACE_IN_FOR_STATEMENT);
    if (has.update) write.update;
    write(')');
    if (type.of.body === 'BlockStatement'){
      write(SPACE_BEFORE_BLOCK);
      write.body;
    } else {
      write(SPACE);
      write.body;
    }
  },

  ForInStatement: function(){
    write('for');
    write(SPACE_AFTER_KEYWORD);
    write('(');
    if (type.of.left === 'VariableDeclaration')
      writeCustom(currentNode.left, 'VariableDeclarationWithoutSemi');
    else write.left;
    write(REQ_SPACE);
    write('in');
    write(REQ_SPACE);
    write.right;
    write(')');
    if (type.of.body === 'BlockStatement'){
      write(SPACE_BEFORE_BLOCK);
      write.body;
    } else {
      write(SPACE);
      write.body;
    }
  },

  FunctionDeclaration: function(){
    write('function');
    if (is.generator) {
      write(SPACE_IN_GENERATOR);
      write('*');
      write(SPACE_IN_GENERATOR);
    }
    if (has.id) {
      write(REQ_SPACE);
      write.id; // Esprima uses null id func decl in default export
    }
    write(SPACE_BEFORE_FUNC_PARAMS);
    write('(');
    write(SPACE_INSIDE_PARENS_FOR_FUNC_PARAMS);
    writeArray('params', ',' + SPACE_BETWEEN_FUNC_PARAMS);
    write(SPACE_INSIDE_PARENS_FOR_FUNC_PARAMS);
    write(')');
    write(SPACE_BEFORE_FUNC_BLOCK);
    write.body;
  },

  FunctionExpression: function(){
    write('function');
    if (is.generator) {
      write(SPACE_IN_GENERATOR);
      write('*');
      write(SPACE_IN_GENERATOR);
    }
    if (has.id) {
      write(REQ_SPACE);
      write.id; // Esprima uses null id func decl in default export
    }
    write(SPACE_BEFORE_FUNC_PARAMS);
    write('(');
    write(SPACE_INSIDE_PARENS_FOR_FUNC_PARAMS);
    writeArray('params', ',' + SPACE_BETWEEN_FUNC_PARAMS);
    write(SPACE_INSIDE_PARENS_FOR_FUNC_PARAMS);
    write(')');
    write(SPACE_BEFORE_FUNC_BLOCK);
    write.body;
  },

  Identifier: function(){
    // must use this form instead of write.name
    // b/c Object.defineProperty can't overwrite name property
    write(currentNode.name);
  },

  IfStatement: function(){
    write('if');
    write(SPACE_AFTER_KEYWORD);
    write('(');
    write.test;
    write(')');
    if (type.of.consequent === 'BlockStatement'){
      write(SPACE_BEFORE_BLOCK);
      write.consequent;
    } else {
      write(SPACE);
      write.consequent;
    }
    if (has.alternate) {
      write('else');
      if (type.of.alternate === 'BlockStatement'){
        write(SPACE_AFTER_KEYWORD);
        write.alternate;
      } else {
        write(SPACE);
        write.alternate;
      }
    }
  },

  LabeledStatement: function(){
    write.label
    write(':');
    write(SPACE);
    write.body;
  },

  Line: function(){
    write('//');
    write.value;
  },

  Literal: function(){
    write.raw;
  },

  LogicalExpression: function(){
    startPrecedenceCtx('bin-op');
    if (need.parens) write('(' + SPACE_INSIDE_PARENS_FOR_PAREN_EXPR);
    write.left;
    write(SPACE_BEFORE_BIN_OP);
    write.operator;
    write(SPACE_AFTER_BIN_OP);
    write.right;
    if (need.parens) write(SPACE_INSIDE_PARENS_FOR_PAREN_EXPR + ')');
    endPrecedenceCtx();
  },

  MemberExpression: function(){
    startPrecedenceCtx('member');
    newNeedsParens();
    write.object;
    resetNewNeedsParens();
    if (is.computed) {
      startPrecedenceCtx('yes-sequence');
      write('[');
    }
    else write('.');
    write.property;
    if (is.computed) {
      write(']');
      endPrecedenceCtx(1);
    }
    endPrecedenceCtx(18);
  },

  NewExpression: function(){
    if (has.arguments) startPrecedenceCtx('new-with-args');
    else startPrecedenceCtx('new-without-args');
    write('new ');
    disallowCall();
    write.callee;
    resetAllowCall();
    if (does.newNeedParens || has.arguments) write('(');
    writeArray('arguments', ',' + SPACE_BETWEEN_CALL_ARGS);
    if (does.newNeedParens || has.arguments) write(')');
    endPrecedenceCtx();
  },

  ObjectExpression: function(){
    startPrecedenceCtx('no-sequence');
    write('{');
    if (!MULTILINE_OBJ) write(SPACE_INSIDE_OBJ_BRACKETS);
    if (has.properties){
      if (MULTILINE_OBJ) {
        write(LINEBREAK);
        indent();
        if (COMMA_FIRST_OBJ) {
          // need to pushes everything out an extra indent
          // except first line of property with comma
          LINEBREAK += INDENT_INCREMENT;

          write(SPACE + SPACE_AFTER_OBJ_COMMA); // looks better

          // Linebreak.slice(0, -2) makes sure the comma gets pulled back.
          // Basically, if the property value is a function, we want
          // the body of the function to get double indented. If it were to just
          // get a single indent, it would start two spaces past the comma. Which
          // looks like 0 spaces past the start of the key name. The double indent
          // makes the function body start 2 spaces past the start of the key name.
          writeArray('properties', LINEBREAK.slice(0, -2) + ',' + SPACE_AFTER_OBJ_COMMA);
          if (TRAILING_COMMA_OBJ) write(LINEBREAK.slice(0, -2) + ',');
          LINEBREAK = LINEBREAK.slice(0, -2);
        } else {
          writeArray('properties', ',' + LINEBREAK);
          if (TRAILING_COMMA_OBJ) write(',')
        }
        unIndent();
        write(LINEBREAK);
      } else {
        var SAVED_LINEBREAK = LINEBREAK;
        LINEBREAK = NO_SPACE;
        suppressIndent = true;
        writeArray('properties', ',' + SPACE_AFTER_OBJ_COMMA);
        if (TRAILING_COMMA_OBJ) write(',');
        LINEBREAK = SAVED_LINEBREAK;
        suppressIndent = false;
      }
    }
    if (!MULTILINE_OBJ) write(SPACE_INSIDE_OBJ_BRACKETS);
    write('}');
    endPrecedenceCtx(2);
  },

  Program: function(){
    writeArray('body', LINEBREAK);
  },

  Property: function(){
    if (currentNode.kind === 'get' || currentNode.kind === 'set') {
      write.kind;
      write(REQ_SPACE);
      if (is.computed) write('[');
      write.key;
      if (is.computed) write(']');
      writeCustom(currentNode.value, 'FunctionBody');
    } else {
      if (is.computed) write('[');
      write.key;
      if (is.computed) write(']');
      write(SPACE_AFTER_OBJ_KEY);
      write(':');
      write(SPACE_BEFORE_OBJ_VALUE);
      write.value;
    }
  },

  ReturnStatement: function(){
    write('return');
    if (has.argument) {
      write(REQ_SPACE);
      write.argument;
    }
    if (SEMICOLONS) write(';');
  },

  SequenceExpression: function(){
    startPrecedenceCtx('yes-sequence');
    if (need.parens) write('(');
    writeArray('expressions', ',' + SPACE_AFTER_BIN_OP);
    if (need.parens) write(')');
    endPrecedenceCtx();
  },

  SwitchCase: function(){
    if (has.test) {
      write('case');
      write(REQ_SPACE);
      write.test;
      write(':');
    } else {
      write('default:')
    }

    if (has.consequent){
      write(LINEBREAK);
      indent();
      writeArray('consequent', LINEBREAK);
      unIndent();
    }
  },

  SwitchStatement: function(){
    write('switch');
    write(SPACE_AFTER_KEYWORD);
    write('(');
    write.discriminant;
    write(')');
    write(SPACE_BEFORE_BLOCK);
    write('{');
    if (has.cases){
      write(LINEBREAK);
      indent();
      writeArray('cases', LINEBREAK);
      unIndent();
    }
    write(LINEBREAK);
    write('}');
  },

  ThisExpression: function(){
    write('this');
  },

  ThrowStatement: function(){
    write('throw');
    write(REQ_SPACE);
    write.argument;
    if (SEMICOLONS) write(';');
  },

  TryStatement: function(){
    write('try');
    write(SPACE_AFTER_KEYWORD);
    write.block;
    if (has.handler) write.handler;
    if (has.finalizer) {
      write(SPACE_BEFORE_KEYWORD);
      write('finally');
      write(SPACE_AFTER_KEYWORD);
      write.finalizer;
    }
  },

  UpdateExpression: function(){
    if (is.prefix) startPrecedenceCtx('update-prefix');
    else startPrecedenceCtx('update-postfix');
    if (need.parens) write('(' + SPACE_INSIDE_PARENS_FOR_PAREN_EXPR);
    if (is.prefix) {
      write.operator;
      write(SPACE_AFTER_PREFIX_UN_OP);
    }
    write.argument;
    if (is.not.prefix) {
      write(SPACE_BEFORE_POSTFIX_UN_OP);
      write.operator;
    }
    if (need.parens) write(SPACE_INSIDE_PARENS_FOR_PAREN_EXPR + ')');
    endPrecedenceCtx();
  },

  UnaryExpression: function(){
    startPrecedenceCtx('un-op');
    if (need.parens) write('(' + SPACE_INSIDE_PARENS_FOR_PAREN_EXPR);
    if (is.prefix) {
      write.operator;
      if (unOpNeedsSpace()) write(REQ_SPACE);
      else write(SPACE_AFTER_PREFIX_UN_OP);
    }
    write.argument;
    // currently no postfix unary operators
    if (need.parens) write(SPACE_INSIDE_PARENS_FOR_PAREN_EXPR + ')');
    endPrecedenceCtx();

    function unOpNeedsSpace(){
      if (currentNode.operator === 'typeof' || currentNode.operator === 'void' || currentNode.operator === 'delete') return true
      return false;
    }
  },

  VariableDeclaration: function(){
    write.kind;
    if (has.declarations){
      write(REQ_SPACE);
      write(currentNode.declarations[0]);
      if (how.many.declarations > 1 && !COMMA_FIRST_VAR) {
        write(',');
        write(SPACE_AFTER_VAR_COMMA);
      }
      if (how.many.declarations > 1 && MULTILINE_VAR) {
        write(LINEBREAK);
        indent();
        if (COMMA_FIRST_VAR) {
          write(',');
          write(SPACE_AFTER_VAR_COMMA);
          writeArray('declarations', LINEBREAK + ',' + SPACE_AFTER_ARR_COMMA, 1);
          write(LINEBREAK); // when comma first, puts semicolon on next line by itself
        } else {
          writeArray('declarations', ',' + LINEBREAK, 1);
        }
        if (SEMICOLONS) write(';');
        unIndent();
      } else if (how.many.declarations > 1) {
        var SAVED_LINEBREAK = LINEBREAK;
        LINEBREAK = NO_SPACE;
        suppressIndent = true;
        writeArray('declarations', ',' + SPACE_AFTER_VAR_COMMA, 1);
        if (SEMICOLONS) write(';');
        LINEBREAK = SAVED_LINEBREAK;
        suppressIndent = false;
      } else {
        if (SEMICOLONS) write(';');
      }
    }
  },

  VariableDeclarator: function(){
    write.id;
    if (has.init) {
      write(SPACE_BEFORE_BIN_OP);
      write('=');
      write(SPACE_AFTER_BIN_OP);
      write.init;
    }
  },

  WhileStatement: function(){
    write('while');
    write(SPACE_AFTER_KEYWORD);
    write('(');
    write.test;
    write(')');
    if (type.of.body === 'BlockStatement'){
      write(SPACE_BEFORE_BLOCK);
      write.body;
    } else {
      write(REQ_SPACE);
      write.body;
    }
  },

  WithStatement: function(){
    write('with');
    write('SPACE_AFTER_KEYWORD');
    write('(');
    write.object;
    write(')');
    if (type.of.body === 'BlockStatement'){
      write(SPACE_BEFORE_BLOCK);
      write.body;
    } else {
      write(SPACE);
      write.body;
    }
  },
}

// This object contains functions corresponding to atypical ways of converting a
// node to source code.
var customNodes = {
  ExpressionStatementWithDefensiveSemi: function(){
    // saved string so far
    var strSoFar = str;
    // clear string
    str = '';
    // when not using semicolons everywhere else
    // use defensive semicolons here
    if (!SEMICOLONS) write(';');
    // write expression to string
    write.expression;
    // if string starts with word that will mislead parser
    // wrap string in parens
    if (str.slice(0, 8) === 'function') str = '(' + str + ')';
    if (str.slice(0, 5) === 'class') str = '(' + str + ')';
    if (str.slice(0, 5) === 'async') str = '(' + str + ')';
    // add expression statement's semicolon
    if (SEMICOLONS) write(';');
    // set string equal to saved string plus string for expression statement
    str = strSoFar + str;
  },

  FunctionBody: function(){
    write(SPACE_BEFORE_FUNC_PARAMS);
    write('(');
    write(SPACE_INSIDE_PARENS_FOR_FUNC_PARAMS);
    writeArray('params', ',' + SPACE_BETWEEN_FUNC_PARAMS); // but shld only have 1 arg...
    write(SPACE_INSIDE_PARENS_FOR_FUNC_PARAMS);
    write(')');
    write(SPACE_BEFORE_FUNC_BLOCK);
    write.body;
  },

  VariableDeclarationWithoutSemi: function(){
    write.kind;
    write(REQ_SPACE);
    writeArray('declarations', ',' + SPACE_AFTER_VAR_COMMA);
  },
}

// Formatting
var SPACE = ' ',
  NO_SPACE = '',
  REQ_SPACE = SPACE,
  LINEBREAK = '\n';

// Formatting options (user can set these)
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

// If option corresponds to spacing and can take boolean, number, or string
var spaceOptionsRegex = /initialIndent|indentIncrement|spaceAfterArrComma|spaceAfterBinOp|spaceAfterKeyword|spaceAfterObjComma|spaceAfterObjKey|spaceAfterPrefixUnOp|spaceAfterVarComma|spaceBeforeBinOp|spaceBeforeBlock|spaceBeforeFuncBlock|spaceBeforeFuncParams|spaceBeforeKeyword|spaceBeforeObjValue|spaceBeforePostfixUnOp|spaceBetweenCallArgs|spaceBetweenFuncParams|spaceInCallExpr|spaceInConditionalExpr|spaceInForStatement|spaceInGenerator|spaceInsideArrBrackets|spaceInsideObjBrackets|spaceInsideParensForCallArgs|spaceInsideParensForFuncParams|spaceInsideParensForParenExpr/;

function setOptions(options){
  var options = options || {};

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

// The string we write to and return as the result of calling sourcify()
var str = '';

// There's always a current node
var currentNode;

function load(node){
  currentNode = node;
}

// precedence API
// Handles precedence
var precedenceStack = [0];

// Starts precedence ctx
function startPrecedenceCtx(newPrecedence){
  var op = currentNode.operator;
  if (newPrecedence === undefined || newPrecedence === 'bin-op') {
    newPrecedence = getBinOpPrec(op);
  } else if (typeof newPrecedence === 'string') {
    newPrecedence = stringToPrec(newPrecedence);
  }

  precedenceStack.push(newPrecedence);
}

function getBinOpPrec(op){
  if (/\=|\+\=|\-\=|\*\=|\/\=|\%\=|\<\<\=|\>\>\=|\>\>\>\=|\&\=|\^\=|\|\=/.test(op)) return 3;
  if (op === '||') return 5;
  if (op === '&&') return 6;
  if (op === '|') return 7;
  if (op === '^') return 8;
  if (op === '&') return 9;
  if (/\=\=|\!\=|\=\=\=|\!\=\=/.test(op)) return 10;
  if (/\<|\<\=|\>|\>\=|in|instanceof'/.test(op)) return 11;
  if (/\<\<|\>\>|\>\>\>/.test(op)) return 12;
  if (/\+|\-/.test(op)) return 13;
  if (/\*\*|\*|\/|\%/.test(op)) return 14;
}

function stringToPrec(str){
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
  if (str === 'new-with-args') return 17;
}

function endPrecedenceCtx(oldPrecedence){
  precedenceStack.pop();
}

// This determines whether an expression needs to be wrapped in parens
var need = {
  get parens(){
    if (currentNode.operator === 'in' && !is.inAllowed) return true;
    var l = precedenceStack.length
    if (l < 2) return false;
    if (precedenceStack[l - 1] < precedenceStack[l - 2]) return true;
    return false;
  }
}

// allowsIn API
// Handles 'in' operator in for-loop initializer
var allowInStack = [true];

function allowIn(){
  allowInStack.push(true);
};

function disallowIn(){
  allowInStack.push(false);
}

function resetAllowIn(){
  allowInStack.pop();
}

var is = {
  get inAllowed(){
    return allowInStack[allowInStack.length - 1];
  },
  get callAllowed(){
    return allowCallStack[allowCallStack.length - 1];
  }
};

var nodesThatAllowInAnywhereRegex = /BlockStatement|DoWhileStatement|ExpressionStatement|ForInStatement|FunctionDeclaration|IfStatement|LabeledStatement|ReturnStatement|SwitchStatement|ThrowStatement|TryStatement|VariableDeclaration|WhileStatement|WithStatement|ArrayExpression|CallExpression|FunctionExpression|ObjectExpression|MemberExpression|NewExpression/;

function nodeAllowsIn(){
  var type = currentNode.type;
  if (nodesThatAllowInAnywhereRegex.test(type)) return true;
  return false;
}

function maybeAllowIn(){
  if (nodeAllowsIn()) allowIn();
}

function maybeResetAllowIn(){
  if (nodeAllowsIn()) resetAllowIn();
}

// newNeedsParens API
// Handles whether new expression must use parens
var newNeedsParensStack = [false];

function newNeedsParens(){
  newNeedsParensStack.push(true);
};

function newDoesntNeedParens(){
  newNeedsParensStack.push(false);
};

function resetNewNeedsParens(){
  newNeedsParensStack.pop();
}

var does = {
  get newNeedParens(){
    return newNeedsParensStack[newNeedsParensStack.length - 1]
  }
}

function nodeMeansNewDoesntNeedParens(){
  if (currentNode.type !== 'NewExpression') return true;
  return false;
}

function maybeNewDoesntNeedParens(){
  if (nodeMeansNewDoesntNeedParens()) newDoesntNeedParens();
};

function maybeResetNewNeedsParens(){
  if (nodeMeansNewDoesntNeedParens()) resetNewNeedsParens();
}

// allowCall API
// Handles whether call expression must be wrapped in parens
// Happens when it is the callee of a new expression
var allowCallStack = [true];

function allowCall(){
  allowCallStack.push(true);
};

function disallowCall(){
  allowCallStack.push(false);
}

function resetAllowCall(){
  allowCallStack.pop();
}

function nodeAllowsCall(){
  if (currentNode.type !== 'CallExpression') return true;
  return false;
}

function maybeAllowCall(){
  if (nodeAllowsCall()) allowCall();
}

function maybeResetAllowCall(){
  if (nodeAllowsCall()) resetAllowCall();
}

// Indenting

var currentIndent = '';

// used to turn off indentation in obj and arr literals
// when relevant multiline option is set to false
var suppressIndent = false;

function indent(increment){
  if (!suppressIndent) {
    if (increment) {
      currentIndent += increment;
      str += increment; // indents first line extra
    } else {
      currentIndent += INDENT_INCREMENT;
      str += INDENT_INCREMENT; // indents first line extra
    }
    LINEBREAK += INDENT_INCREMENT; // indents subsequent lines
  }
}

function unIndent(decrement){
  if (!suppressIndent){
    var length;
    if (decrement) {
      var length = decrement.length;
      currentIndent = currentIndent.slice(0, -length);
      LINEBREAK = LINEBREAK.slice(0, -length);
    } else {
      currentIndent = currentIndent.slice(0, -INDENT_INCREMENT.length);
      LINEBREAK = LINEBREAK.slice(0, -INDENT_INCREMENT.length);
    }
  }
}

function enhanceIndent(enhancement){
  currentIndent += enhancement;
}

function dehanceIndent(dehancement){
  currentIndent = currentIndent.slice(0, -dehancement.length);
}

// booleans needed for "is" API
var possibleESTreeBooleanFields = [
  'computed',
  'generator',
  'method',
  'prefix',
  'shorthand',
];


is.not = {};

possibleESTreeBooleanFields.forEach(function(field){
  Object.defineProperty(is, field, {
    get: function(){
      return currentNode[field];
    }
  });
  Object.defineProperty(is.not, field, {
    get: function(){
      return !currentNode[field];
    }
  });
});

function sourcify(input, options){
  setOptions(options);
  str = '';
  if (typeof input === 'string') {
    input = esprima.parse(input, {
      attachComment: true,
      loc: true
    });
  }
  write(input);
  return str;
}

function write(input){
  // if string, just write it
  if (!input.type && !Array.isArray(input)) {
    str += input;
    return;
  }

  // save old node
  var oldNode = currentNode ? currentNode : input;

  // load this node, handle context,
  // also handle comments
  beforeWriteNode(input);

  // write node to string
  nodes[currentNode.type]();

  // load old node
  afterWriteNode(oldNode);
}

function writeCustom(input, customHandler){
  // see write() for comments on structure
  var oldNode = currentNode ? currentNode : input;
  beforeWriteNode(input);
  customNodes[customHandler]();
  afterWriteNode(oldNode);
}

function beforeWriteNode(input){
  load(input);

  if (has.leadingComments && PRESERVE_COMMENTS && isStatement(input)) {
    writeArray('leadingComments', LINEBREAK);
    write(LINEBREAK);
  }

  maybeAllowIn();
  maybeNewDoesntNeedParens();
  maybeAllowCall();
}

function afterWriteNode(oldNode){
    // Don't write trailing comments here
    // b/c we don't want to duplicate comments
    // When is a trailing comment not also a leading comment?
    // Only when it occurs at the end of an array (I'm pretty sure).
    // So the code to write trailing comments occurs in writeArray()

    maybeResetAllowIn();
    maybeResetNewNeedsParens();
    maybeResetAllowCall();

    load(oldNode);
}

var statementNodesRegex = /BlockStatement|BreakStatement|ContinueStatement|DoWhileStatement|DebuggerStatement|EmptyStatement|ExpressionStatement|ForInStatement|ForStatement|FunctionDeclaration|IfStatement|LabeledStatement|ReturnStatement|SwitchStatement|ThrowStatement|VariableDeclaration|WhileStatement|WithStatement/;

function isStatement(node){
  if (statementNodesRegex.test(node.type)) return true;
  return false;
}

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

function writeArray(field, separator, startIndex, endIndex){
  var savedNode = currentNode;
  if (startIndex === undefined) startIndex = 0;
  if (endIndex === undefined) endIndex = savedNode[field].length;

  for(var i = startIndex; i < endIndex; i++){
    var itemNode = savedNode[field][i];
    if (itemNode !== null) { // this is just to handle sparse array literals
      load(itemNode);
      if (itemNode.type === 'ExpressionStatement' && !SEMICOLONS) {
        writeCustom(itemNode, 'ExpressionStatementWithDefensiveSemi')
      } else {
        write(itemNode);
      }
    }

    if (PRESERVE_LINEBREAKS_BETWEEN_STATEMENTS && isStatement(itemNode)) {
      if (i < endIndex - 1) {
        var nextNode = savedNode[field][i + 1];
        write(linebreaksBtwnStmts(itemNode, nextNode));
      }
    } else {
      if (i < endIndex - 1) write(separator);
    }

  }

  // We don't write trailing comments in write()
  // b/c we don't want to duplicate comments
  // When is a trailing comment not also a leading comment?
  // Only when it occurs at the end of an array (I'm pretty sure).
  // So the code to write trailing comments occurs here

  if (has.trailingComments && PRESERVE_COMMENTS) {
    write(SPACE);
    writeArray('trailingComments', '\n');
  }

  load(savedNode);
}

// set up write API, has API, and how.many API
var has = {};
var how = {};
how.many = {};
var type = {};
type.of = {};
var possibleESTreeFields = [
  'alternate',
  'argument',
  'arguments',
  'block',
  'body',
  'callee',
  'cases',
  'consequent',
  'declarations',
  'discriminant',
  'elements',
  'expression',
  'finalizer',
  'handler',
  'id',
  'init',
  'key',
  'kind',
  'label',
  'leadingComments', // non-ESTree
  'left',
  'name',
  'object',
  'operator',
  'param',
  'params',
  'properties',
  'property',
  'raw', // non-ESTree
  'right',
  'test',
  'trailingComments', // non-ESTree
  'update',
  'value',
];

possibleESTreeFields.forEach(function(field){
  // e.g., write.id or write.test
  if (field !== 'arguments' && field !== 'name') {
    Object.defineProperty(write, field, {
      get: function(){
        write(currentNode[field]);
      }
    });
  }

  // e.g., has.id or has.test
  Object.defineProperty(has, field, {
    get: function(){
      return currentNode[field] && (Array.isArray(currentNode[field]) ? currentNode[field].length > 0 : true);
    }
  });

  Object.defineProperty(how.many, field, {
    get: function(){
      return currentNode[field].length;
    }
  });

  Object.defineProperty(type.of, field, {
    get: function(){
      return currentNode[field].type;
    }
  });
});

})(this);
