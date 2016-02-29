$(function(){

	var currentDemoOptions = [
		'preserveComments',
		'preserveLinebreaksBetweenStatements',
		'semicolons',
		'multilineObj',
		'trailingCommaObj',
		'commaFirstObj',
		'spaceAfterObjKey',
		'spaceBeforeObjValue',
		'spaceInsideObjBrackets',
	];

	function tryToSourcify(){
		var input = demoInput.getValue();
		try {
			tree = esprima.parse(input, {attachComment: true, loc: true});
			$('.demo-input-error').html('');
			try {
			 var output = sourcify(tree, collectOptions(currentDemoOptions));
			 demoOutput.setValue(output);
			} catch(e) {
				console.log(e);
			 $('.demo-input-error').html('Sourcify Error: ' + e);
			}
		} catch(e) {
			$('.demo-input-error').html('Parser Error: ' + e.description);
		}
	}

	function tryToSourcifyWithoutParse(){
		try {
		 var output = sourcify(tree, collectOptions(currentDemoOptions));
		 demoOutput.setValue(output);
		} catch(e) {
		 $('.demo-input-error').html('Sourcify Error: ' + e);
		}
	}

	var booleanOptions = [
		'preserveComments',
		'preserveLinebreaksBetweenStatements',
		'multilineObj',
		'trailingCommaObj',
		'commaFirstObj',
		'semicolons',
		'spaceAfterObjKey',
		'spaceBeforeObjValue',
		'spaceInsideObjBrackets',
    'spaceAfterObjComma',
		'trailingCommaArr',
		'multilineArr',
		'multilineVar',
		'commaFirstArr',
		'commaFirstVar',
    'spaceAfterArrComma',
    'spaceAfterBinOp',
    'spaceAfterKeyword',
    'spaceAfterPrefixUnOp',
    'spaceAfterVarComma',
    'spaceBeforeBinOp',
    'spaceBeforeBlock',
    'spaceBeforeFuncBlock',
    'spaceBeforeFuncParams',
    'spaceBeforeKeyword',
    'spaceBeforePostfixUnOp',
    'spaceBetweenCallArgs',
    'spaceBetweenFuncParams',
    'spaceInCallExpr',
    'spaceInConditionalExpr',
    'spaceInForStatement',
    'spaceInGenerator',
    'spaceInsideArrBrackets',
    'spaceInsideParensForCallArgs',
    'spaceInsideParensForFuncParams',
    'spaceInsideParensForParenExpr',
	];

	var readableNamesForBooleanOptions = {
		'semicolons':'use semicolons',
		'preserveComments':'preserve comments',
		'preserveLinebreaksBetweenStatements':'preserve linebreaks between statements',
		'trailingCommaArr':'trailing comma in arrays',
		'trailingCommaObj':'trailing comma in objects',
		'multilineArr':'multiline arrays',
		'multilineObj':'multiline objects',
		'multilineVar':'multiline variable declarations',
		'commaFirstArr':'comma-first style arrays',
		'commaFirstObj':'comma-first style objects',
		'commaFirstVar':'comma-first style variable declarations',
    'spaceAfterArrComma':'space after comma in arrays',
    'spaceAfterBinOp':'space after binary operator',
    'spaceAfterKeyword':'space after keyword',
    'spaceAfterObjComma':'space after comma in objects',
    'spaceAfterObjKey':'space after key in objects',
    'spaceAfterPrefixUnOp':'space after prefix unary operator',
    'spaceAfterVarComma':'space after comma in variable declaration',
    'spaceBeforeBinOp':'space before binary operator',
    'spaceBeforeBlock':'space before block',
    'spaceBeforeFuncBlock':'space before function block',
    'spaceBeforeFuncParams':'space before function params',
    'spaceBeforeKeyword':'space before keyword',
    'spaceBeforeObjValue':'space before object value',
    'spaceBeforePostfixUnOp':'space before postfix unary operator',
    'spaceBetweenCallArgs':'space between arguments in function call',
    'spaceBetweenFuncParams':'space between parameters in function definition',
    'spaceInCallExpr':'space between callee and arguments',
    'spaceInConditionalExpr':'spaces in a conditional expression',
    'spaceInForStatement':'spaces in a for statement',
    'spaceInGenerator':'spaces in a generator function',
    'spaceInsideArrBrackets':'spaces inside array brackets',
    'spaceInsideObjBrackets':'spaces inside object brackets',
    'spaceInsideParensForCallArgs':'spaces inside parens for call arguments',
    'spaceInsideParensForFuncParams':'spaces inside parens for function params',
    'spaceInsideParensForParenExpr':'spaces inside parens for parenthized expression',
	}

	function loadOptions(booleanOptions){
		$('.demo-options-container').html('');

		booleanOptions.forEach(function(booleanOption){
			var $div = $('<div>')
				.addClass('demo-option')
				.attr('data-option', booleanOption)
				.text(readableNamesForBooleanOptions[booleanOption]);

			var $checkbox = $('<div>')
				.addClass('demo-option-checkbox')
				.attr('data-option', booleanOption);

			$div.append($checkbox);
			$('.demo-options-container').append($div);
		});
	}

	function collectOptions(currentDemoOptions){
		var options = {};
		currentDemoOptions.forEach(function(booleanOption){
			options[booleanOption] = Boolean($('[data-option="' + booleanOption + '"]').attr('selected'))
		});
		return options;
	}

	// Demo-related CodeMirror setup

	var demoInput = CodeMirror($('.demo-input')[0], {
	  lineNumbers: true,
	  value: "var myObj = {longishKey: \"longish string literal\", num: 12345, arr: [true, 1, /h/]};",
	  mode:  "javascript",
	});

	var demoOutput = CodeMirror($('.demo-output')[0], {
	  value: "",
	  mode:  "javascript",
	  readOnly: "nocursor",
	});

	demoInput.on('change', function() {
		tryToSourcify();
	});

	// Demo options setup

	$('.demo-options-container').on('click', '.demo-option-checkbox', function(e) {
    var $checkbox = $(e.target);
		var option = $checkbox.attr('data-option');
		var $demoOption = $('.demo-option[data-option="' + option + '"]');

    var isSelected = Boolean($checkbox.attr('selected'));
    if (isSelected) {
      $checkbox.removeAttr('selected');
      $checkbox.html('');
			$demoOption.removeAttr('selected');
    } else {
      $checkbox.attr('selected', 'true');
      $checkbox.html('&#10003;');
			$demoOption.attr('selected', 'true');
    }

		tryToSourcifyWithoutParse();

  });

	// Comparison-related CodeMirror setup

	var compareSourcify = CodeMirror($('.compare-sourcify')[0], {
	  value: $('#compare-sourcify-source').html(),
	  mode:  "javascript",
	  readOnly: "nocursor",
	});

	var compareEscodegen = CodeMirror($('.compare-escodegen')[0], {
	  value: $('#compare-escodegen-source').html(),
	  mode:  "javascript",
	  readOnly: "nocursor",
	});

	// fullPage.js initialization

	$('#fullpage').fullpage({
		anchors: ['slide'],
		controlArrows: true,
		loopHorizontal: false,
		scrollingSpeed: 1000,
		scrollOverflow: true,
		onSlideLeave: function(anchorLink, index, slideIndex, direction, nextSlideIndex){
			if (slideIndex === 2) hideScrollBar();

			// Make old header nav inactive
			$('[data-slideIndex="' + slideIndex + '"]').removeClass('header-nav-active');

			// Make new header nav active
			$('[data-slideIndex="' + nextSlideIndex + '"]').addClass('header-nav-active');
		},
		afterSlideLoad: function(anchorLink, index, slideAnchor, slideIndex){
			if (slideIndex === 2) showScrollBar();
		},
	});

	function showScrollBar(){
		$('.slimScrollBar').css('opacity', '0.4');
	}

	function hideScrollBar(){
		$('.slimScrollBar').css('opacity', '0');
	}

	// specific code demo loading

	$('.demo-nav').on('click', function(e){
		var $target = $(e.target);
		$('.demo-nav').removeClass('demo-nav-active');
		$target.addClass('demo-nav-active');
		var demoNumber = $target.attr('data-demo');
		demos['loadDemo' + demoNumber]();
	})

	var demos = {
		loadDemo1: function(){
			demoInput.setValue('// npm-style\n// (i.e., no semicolons & comma-first objs)\nvar a={ b:1, d:3, myArrary  :[1,true]  ,\nmyBinOp:(1+2)*4,nestedObj:\n{"stringKey": new Val, [computedProp()]:a, get age()\n{//getters and setters work too\n return __age;}}}\nvar b = true;\nvar pi = 3.14;');

			$('.demo-option-checkbox').removeAttr('selected').html('');
			$('.demo-option').removeAttr('selected');

			var demo1Options = currentDemoOptions = [
				'preserveComments',
				'semicolons',
				'commaFirstObj',
				'multilineObj',
				'spaceAfterObjKey',
				'spaceBeforeObjValue',
				'trailingCommaObj',
			];

			loadOptions(demo1Options);

			var demo1OptionsChecked = [
				'preserveComments',
				'commaFirstObj',
				'multilineObj',
				'spaceBeforeObjValue',
			];

			demo1OptionsChecked.forEach(function(demoOption){
				var $checkbox = $('.demo-option-checkbox[data-option="' + demoOption + '"]');
				var $demoOption = $('.demo-option[data-option="' + demoOption + '"]');

				$checkbox.attr('selected', 'true');
				$checkbox.html('&#10003;');
				$demoOption.attr('selected', 'true');
			});

			tryToSourcify();
		},

		loadDemo2: function(){
			demoInput.setValue('function fn(a, b){\nvar i = 2, result;\n\nresult = Math.pow(a, b * 2);\n\nreturn result;}');

			$('.demo-option-checkbox').removeAttr('selected').html('');
			$('.demo-option').removeAttr('selected');

			var demo2Options = currentDemoOptions = [
				'semicolons',
				'spaceBeforeFuncParams',
				'spaceInsideParensForFuncParams',
				'spaceBetweenFuncParams',
				'spaceBeforeFuncBlock',
				'multilineVar',
				'spaceInCallExpr',
				'spaceInsideParensForCallArgs',
				'spaceBetweenCallArgs',
				'spaceBeforeBinOp',
				'spaceAfterBinOp',
			];

			loadOptions(demo2Options);

			var demo2OptionsChecked = [
				'semicolons',
				'spaceBeforeFuncParams',
				'spaceInsideParensForFuncParams',
				'spaceBetweenFuncParams',
				'spaceBeforeFuncBlock',
				'spaceBeforeBinOp',
				'spaceAfterBinOp',
			];

			demo2OptionsChecked.forEach(function(demoOption){
				var $checkbox = $('.demo-option-checkbox[data-option="' + demoOption + '"]');
				var $demoOption = $('.demo-option[data-option="' + demoOption + '"]');

				$checkbox.attr('selected', 'true');
				$checkbox.html('&#10003;');
				$demoOption.attr('selected', 'true');
			});
			tryToSourcify();
		},
		
	};

	demos.loadDemo1();
});
