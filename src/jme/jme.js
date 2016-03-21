/*
Copyright 2011-14 Newcastle University

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

/** @file Sets up most of the JME stuff: compiler, built-in functions, and expression comparison functions.
 *
 * Provides {@link Numbas.jme}
 */

Numbas.queueScript('jme',['jme-base','jme-builtins'],function(){});

Numbas.queueScript('jme-base',['base','math','util'],function() {

var util = Numbas.util;
var math = Numbas.math;

/** @typedef Numbas.jme.tree
  * @type {object}
  * @property {tree[]} args - the token's arguments (if it's an op or function)
  * @property {Numbas.jme.token} tok - the token at this node
  */

/** @namespace Numbas.jme */
var jme = Numbas.jme = /** @lends Numbas.jme */ {

	/** Mathematical constants */
	constants: {
		'e': Math.E,
		'pi': Math.PI,
		'i': math.complex(0,1),
		'infinity': Infinity,
		'infty': Infinity
	},

	/** Regular expressions to match tokens */
	re: {
		re_bool: /^(true|false)(?![a-zA-Z_0-9'])/i,
		re_number: /^[0-9]+(?:\x2E[0-9]+)?/,
		re_name: /^{?((?:(?:[a-zA-Z]+):)*)((?:\$?[a-zA-Z_][a-zA-Z0-9_]*'*)|\?\??)}?/i,
		re_op: /^(\.\.|#|<=|>=|<>|&&|\|\||[\|*+\-\/\^<>=!&;]|(?:(not|and|or|xor|implies|isa|except|in)([^a-zA-Z0-9_']|$)))/i,
		re_punctuation: /^([\(\),\[\]])/,
		re_string: /^(['"])((?:[^\1\\]|\\.)*?)\1/,
		re_comment: /^\/\/.*(?:\n|$)/
	},

	/** Convert given expression string to a list of tokens. Does some tidying, e.g. inserts implied multiplication symbols.
	 * @param {JME} expr 
	 * @returns {token[]}
	 * @see Numbas.jme.compile
	 */
	tokenise: function(expr)
	{
		if(!expr)
			return [];

		expr += '';
		
		var oexpr = expr;

		expr = expr.replace(jme.re.re_strip_whitespace, '');	//get rid of whitespace

		var tokens = [];
		var i = 0;
		
		while( expr.length )
		{
			expr = expr.replace(jme.re.re_strip_whitespace, '');	//get rid of whitespace
		
			var result;
			var token;

            while(result=expr.match(jme.re.re_comment)) {
                expr=expr.slice(result[0].length).replace(jme.re.re_strip_whitespace,'');
            }

			if(result = expr.match(jme.re.re_number))
			{
				token = new TNum(result[0]);

				if(tokens.length>0 && (tokens[tokens.length-1].type==')' || tokens[tokens.length-1].type=='name'))	//right bracket followed by a number is interpreted as multiplying contents of brackets by number
				{
					tokens.push(new TOp('*'));
				}
			}
			else if (result = expr.match(jme.re.re_bool))
			{
				token = new TBool(util.parseBool(result[0]));
				result[0] = result[1];
			}
			else if (result = expr.match(jme.re.re_op))
			{
				if(result[2])		//if word-ish operator
					result[0] = result[2];
				token = result[0];
				//work out if operation is being used prefix or postfix
				var nt;
				var postfix = false;
				var prefix = false;
				if( tokens.length==0 || (nt=tokens[tokens.length-1].type)=='(' || nt==',' || nt=='[' || (nt=='op' && !tokens[tokens.length-1].postfix) )
				{
					if(token in prefixForm) {
						token = prefixForm[token];
						prefix = true;
					}
				}
				else
				{
					if(token in postfixForm) {
						token = postfixForm[token];
						postfix = true;
					}
				}
				token=new TOp(token,postfix,prefix);
			}
			else if (result = expr.match(jme.re.re_name))
			{
				var name = result[2];
				var annotation = result[1] ? result[1].split(':').slice(0,-1) : null;
				if(!annotation)
				{
					var lname = name.toLowerCase();
					// fill in constants here to avoid having more 'variables' than necessary
					if(lname in jme.constants) {
						token = new TNum(jme.constants[lname]);
					}else{
						token = new TName(name);
					}
				}
				else
				{
					token = new TName(name,annotation);
				}
				
				if(tokens.length>0 && (tokens[tokens.length-1].type=='number' || tokens[tokens.length-1].type=='name' || tokens[tokens.length-1].type==')')) {	//number or right bracket or name followed by a name, eg '3y', is interpreted to mean multiplication, eg '3*y'
					tokens.push(new TOp('*'));
				}
			}
			else if (result = expr.match(jme.re.re_punctuation))
			{
				if(result[0]=='(' && tokens.length>0 && (tokens[tokens.length-1].type=='number' || tokens[tokens.length-1].type==')')) {	//number or right bracket followed by left parenthesis is also interpreted to mean multiplication
					tokens.push(new TOp('*'));
				}

				token = new TPunc(result[0]);
			}
			else if (result = expr.match(jme.re.re_string))
			{
				var str = result[2];
	
				var estr = '';
				while(true) {
					var i = str.indexOf('\\');
					if(i==-1)
						break;
					else {
						estr += str.slice(0,i);
						var c;
						if((c=str.charAt(i+1))=='n') {
							estr+='\n';
						}
						else if(c=='{' || c=='}') {
							estr+='\\'+c;
						}
						else {
							estr+=c;
						}
						str=str.slice(i+2);
					}
				}
				estr+=str;

				token = new TString(estr);
			}
			else if(expr.length)
			{
				//invalid character or not able to match a token
				throw(new Numbas.Error('jme.tokenise.invalid',oexpr));
			}
			else
				break;
			
			expr=expr.slice(result[0].length);	//chop found token off the expression
			
			tokens.push(token);
		}

		//rewrite some synonyms
		for(var i=0; i<tokens.length; i++)
		{
			if(tokens[i].name)
			{
				if(synonyms[tokens[i].name])
					tokens[i].name=synonyms[tokens[i].name];
			}
		}


		return(tokens);
	},

	/** Shunt list of tokens into a syntax tree. Uses the shunting yard algorithm (wikipedia has a good description)
	 * @param {token[]} tokens
	 * @returns {Numbas.jme.tree}
	 * @see Numbas.jme.tokenise
	 * @see Numbas.jme.compile
	 */
	shunt: function(tokens)
	{
		var output = [];
		var stack = [];
		
		var numvars=[],olength=[],listmode=[];

		function addoutput(tok)
		{
			if(tok.vars!==undefined)
			{
				if(output.length<tok.vars)
					throw(new Numbas.Error('jme.shunt.not enough arguments',tok.name || tok.type));

				var thing = {tok: tok,
							 args: output.slice(output.length-tok.vars)};
				output = output.slice(0,output.length-tok.vars);
				output.push(thing);
			}
			else
				output.push({tok:tok});
		}

		for(var i = 0;i < tokens.length; i++ )
		{
			var tok = tokens[i];
			
			switch(tok.type) 
			{
			case "number":
			case "string":
			case 'boolean':
				addoutput(tok);
				break;
			case "name":
				if( i<tokens.length-1 && tokens[i+1].type=="(")
				{
						stack.push(new TFunc(tok.name,tok.annotation));
						numvars.push(0);
						olength.push(output.length);
				}
				else 
				{										//this is a variable otherwise
					addoutput(tok);
				}
				break;
				
			case ",":
				while( stack.length && stack[stack.length-1].type != "(" && stack[stack.length-1].type != '[')
				{	//reached end of expression defining function parameter, so pop all of its operations off stack and onto output
					addoutput(stack.pop())
				}

				numvars[numvars.length-1]++;

				if( ! stack.length )
				{
					throw(new Numbas.Error('jme.shunt.no left bracket in function'));
				}
				break;
				
			case "op":

				if(!tok.prefix) {
					var o1 = precedence[tok.name];
					while(
							stack.length && 
							stack[stack.length-1].type=="op" && 
							(
							 (o1 > precedence[stack[stack.length-1].name]) || 
							 (
							  leftAssociative(tok.name) && 
							  o1 == precedence[stack[stack.length-1].name]
							 )
							)
					) 
					{	//while ops on stack have lower precedence, pop them onto output because they need to be calculated before this one. left-associative operators also pop off operations with equal precedence
						addoutput(stack.pop());
					}
				}
				stack.push(tok);
				break;

			case '[':
				if(i==0 || tokens[i-1].type=='(' || tokens[i-1].type=='[' || tokens[i-1].type==',' || tokens[i-1].type=='op')	//define list
				{
					listmode.push('new');
				}
				else		//list index
					listmode.push('index');

				stack.push(tok);
				numvars.push(0);
				olength.push(output.length);
				break;

			case ']':
				while( stack.length && stack[stack.length-1].type != "[" ) 
				{
					addoutput(stack.pop());
				}
				if( ! stack.length ) 
				{
					throw(new Numbas.Error('jme.shunt.no left square bracket'));
				}
				else
				{
					stack.pop();	//get rid of left bracket
				}

				//work out size of list
				var n = numvars.pop();
				var l = olength.pop();
				if(output.length>l)
					n++;

				switch(listmode.pop())
				{
				case 'new':
					addoutput(new TList(n))
					break;
				case 'index':
					var f = new TFunc('listval');
					f.vars = 2;
					addoutput(f);
					break;
				}
				break;
				
			case "(":
				stack.push(tok);
				break;
				
			case ")":
				while( stack.length && stack[stack.length-1].type != "(" ) 
				{
					addoutput(stack.pop());
				}
				if( ! stack.length ) 
				{
					throw(new Numbas.Error('jme.shunt.no left bracket'));
				}
				else
				{
					stack.pop();	//get rid of left bracket

					//if this is a function call, then the next thing on the stack should be a function name, which we need to pop
					if( stack.length && stack[stack.length-1].type=="function") 
					{	
						//work out arity of function
						var n = numvars.pop();
						var l = olength.pop();
						if(output.length>l)
							n++;
						var f = stack.pop();
						f.vars = n;

						addoutput(f);
					}
				}
				break;
			}
		}

		//pop all remaining ops on stack into output
		while(stack.length)
		{
			var x = stack.pop();
			if(x.type=="(")
			{
				throw(new Numbas.Error('jme.shunt.no right bracket'));
			}
			else
			{
				addoutput(x);
			}
		}

		if(listmode.length>0)
			throw(new Numbas.Error('jme.shunt.no right square bracket'));

		if(output.length>1)
			throw(new Numbas.Error('jme.shunt.missing operator'));

		return(output[0]);
	},

	/** Substitute variables defined in `scope` into the given syntax tree (in place).
	 * @param {Numbas.jme.tree} tree
	 * @param {Numbas.jme.Scope} scope
	 * @param {boolean} [allowUnbound=false] - allow unbound variables to remain in the returned tree
	 * @returns {Numbas.jme.tree}
	 */
	substituteTree: function(tree,scope,allowUnbound)
	{
		if(!tree)
			return null;
		if(tree.tok.bound)
			return tree;

		if(tree.args===undefined)
		{
			if(tree.tok.type=='name')
			{
				var name = tree.tok.name.toLowerCase();
				if(scope.variables[name]===undefined)
				{
					if(allowUnbound)
						return {tok: new TName(name)};
					else
						throw new Numbas.Error('jme.substituteTree.undefined variable',name);
				}
				else
				{
					var v = scope.variables[name];
					if(v.tok) {
						return v;
					} else {
						return {tok: v};
					}
				}
			}
			else {
				return tree;
			}
		} else if((tree.tok.type=='function' || tree.tok.type=='op') && tree.tok.name in substituteTreeOps) {
			tree = {tok: tree.tok,
					args: tree.args.slice()};
			substituteTreeOps[tree.tok.name](tree,scope,allowUnbound);
			return tree;
		} else {
			tree = {
				tok: tree.tok,
				args: tree.args.slice()
			};
			for(var i=0;i<tree.args.length;i++) {
				tree.args[i] = jme.substituteTree(tree.args[i],scope,allowUnbound);
			}
			return tree;
		}
	},

	/** Evaluate a syntax tree (or string, which is compiled to a syntax tree), with respect to the given scope.
	 * @param {tree|string} tree
	 * @param {Numbas.jme.Scope} scope
	 * @returns {jme.type}
	 */
	evaluate: function(tree,scope)
	{
		//if a string is given instead of an expression tree, compile it to a tree
		if( typeof(tree)=='string' )
			tree = jme.compile(tree,scope);
		if(!tree)
			return null;


		tree = jme.substituteTree(tree,scope,true);

		var tok = tree.tok;
		switch(tok.type)
		{
		case 'number':
		case 'boolean':
		case 'range':
			return tok;
		case 'list':
			if(tok.value===undefined)
			{
				var value = [];
				for(var i=0;i<tree.args.length;i++)
				{
					value[i] = jme.evaluate(tree.args[i],scope);
				}
				tok = new TList(value);
			}
			return tok;
		case 'string':
			var value = tok.value;
			if(value.contains('{'))
				value = jme.contentsubvars(value,scope)
			var t = new TString(value);
			t.latex = tok.latex;
			return t;
		case 'name':
			if(tok.name.toLowerCase() in scope.variables)
				return scope.variables[tok.name.toLowerCase()];
			else
				tok = new TName(tok.name);
				tok.unboundName = true;
				return tok;
			break;
		case 'op':
		case 'function':
			var op = tok.name.toLowerCase();
			if(lazyOps.indexOf(op)>=0) {
				return scope.functions[op][0].evaluate(tree.args,scope);
			}
			else {

				for(var i=0;i<tree.args.length;i++) {
					tree.args[i] = jme.evaluate(tree.args[i],scope);
				}

				var matchedFunction;
				if(scope.functions[op]===undefined)
				{
					if(tok.type=='function') {
						//check if the user typed something like xtan(y), when they meant x*tan(y)
						var possibleOp = op.slice(1);
						if(possibleOp in scope.functions)
							throw(new Numbas.Error('jme.typecheck.function maybe implicit multiplication',op,op[0],possibleOp));
						else
							throw(new Numbas.Error('jme.typecheck.function not defined',op,op));
					}
					else
						throw(new Numbas.Error('jme.typecheck.op not defined',op));
				}

				for(var j=0;j<scope.functions[op].length; j++)
				{
					var fn = scope.functions[op][j];
					if(fn.typecheck(tree.args))
					{
						matchedFunction = fn;
						break;
					}
				}
				if(matchedFunction)
					return matchedFunction.evaluate(tree.args,scope);
				else {
					for(var i=0;i<=tree.args.length;i++) {
						if(tree.args[i] && tree.args[i].unboundName) {
							throw(new Numbas.Error('jme.typecheck.no right type unbound name',tree.args[i].name));
						}
					}
					throw(new Numbas.Error('jme.typecheck.no right type definition',op));
				}
			}
		default:
			return tok;
		}
	},

	/** Compile an expression string to a syntax tree. (Runs {@link Numbas.jme.tokenise} then {@Link Numbas.jme.shunt})
	 * @param {JME} expr
	 * @see Numbas.jme.tokenise
	 * @see Numbas.jme.shunt
	 * @returns {Numbas.jme.tree}
	 */
	compile: function(expr)
	{
		expr+='';	//make sure expression is a string and not a number or anything like that

		if(!expr.trim().length)
			return null;

		//tokenise expression
		var tokens = jme.tokenise(expr);

		//compile to parse tree
		var tree = jme.shunt(tokens);

		if(tree===null)
			return;

		return(tree);
	},

	/** Compile a list of expressions, separated by commas
	 * @param {JME} expr
	 * @see Numbas.jme.tokenise
	 * @see Numbas.jme.shunt
	 * @returns {Numbas.jme.tree[]}
	 */
	compileList: function(expr,scope) {
		expr+='';	//make sure expression is a string and not a number or anything like that

		if(!expr.trim().length)
			return null;
		//typecheck
		scope = new Scope(scope);

		//tokenise expression
		var tokens = jme.tokenise(expr);

		var bits = [];
		var brackets = [];
		var start = 0;
		for(var i=0;i<tokens.length;i++) {
			switch(tokens[i].type) {
				case '(':
				case '[':
					brackets.push(tokens[i]);
					break;
				case ')':
					if(!brackets.length || brackets.pop().type!='(') {
						throw(new Numbas.Error('jme.compile list.mismatched bracket'));
					}
					break;
				case ']':
					if(!brackets.length || brackets.pop().type!='[') {
						throw(new Numbas.Error('jme.compile list.mismatched bracket'));
					}
					break;
				case ',':
					if(brackets.length==0) {
						bits.push(tokens.slice(start,i));
						start = i+1;
					}
					break;
			}
		}
		if(brackets.length) {
			throw(new Numbas.Error('jme.compile list.missing right bracket'));
		}
		bits.push(tokens.slice(start));

		//compile to parse tree
		var trees = bits.map(function(b){return jme.shunt(b)});

		return trees;
	},

	/** Compare two expressions over some randomly selected points in the space of variables, to decide if they're equal.
	 * @param {JME} expr1
	 * @param {JME} expr2
	 * @param {object} settings
	 * @param {Numbas.jme.Scope} scope
	 * @returns {boolean}
	 */
	compare: function(expr1,expr2,settings,scope) {
		expr1 += '';
		expr2 += '';

		var compile = jme.compile, evaluate = jme.evaluate;

		var checkingFunction = checkingFunctions[settings.checkingType.toLowerCase()];	//work out which checking type is being used

		try {
			var tree1 = compile(expr1,scope);
			var tree2 = compile(expr2,scope);

			if(tree1 == null || tree2 == null) 
			{	//one or both expressions are invalid, can't compare
				return false; 
			}

			//find variable names used in both expressions - can't compare if different
			var vars1 = findvars(tree1);
			var vars2 = findvars(tree2);

			for(var v in scope.variables)
			{
				delete vars1[v];
				delete vars2[v];
			}
			
			if( !varnamesAgree(vars1,vars2) ) 
			{	//whoops, differing variables
				return false;
			}

			if(vars1.length) 
			{	// if variables are used,  evaluate both expressions over a random selection of values and compare results
				var errors = 0;
				var rs = randoms(vars1, settings.vsetRangeStart, settings.vsetRangeEnd, settings.vsetRangePoints);
				for(var i = 0; i<rs.length; i++) {
					var nscope = new jme.Scope([scope,{variables:rs[i]}]);
					util.copyinto(scope.variables,rs[i]);
					var r1 = evaluate(tree1,nscope);
					var r2 = evaluate(tree2,nscope);
					if( !resultsEqual(r1,r2,checkingFunction,settings.checkingAccuracy) ) { errors++; }
				}
				if(errors < settings.failureRate) {
					return true;
				}else{
					return false;
				}
			} else {
				//if no variables used, can just evaluate both expressions once and compare
				r1 = evaluate(tree1,scope);
				r2 = evaluate(tree2,scope);
				return resultsEqual(r1,r2,checkingFunction,settings.checkingAccuracy);
			}
		}
		catch(e) {
			return false;
		}

	},

	/** Substitute variables into content. To substitute variables, use {@link Numbas.jme.variables.DOMcontentsubvars}.
	 * @param {string} str
	 * @param {Numbas.jme.Scope} scope
	 * @returns {string}
	 */
	contentsubvars: function(str, scope)
	{
		var bits = util.contentsplitbrackets(str);	//split up string by TeX delimiters. eg "let $X$ = \[expr\]" becomes ['let ','$','X','$',' = ','\[','expr','\]','']
		for(var i=0; i<bits.length; i+=4)
		{
			bits[i] = jme.subvars(bits[i],scope,true);
		}
		return bits.join('');
	},

	/** Split up a TeX expression, finding the \var and \simplify commands.
	 * Returns an array [normal tex,var or simplify,options,argument,normal tex,...]a
	 * @param {string} s
	 * @returns {string[]}
	 */
	texsplit: function(s)
	{
		var cmdre = /^((?:.|[\n\r])*?)\\(var|simplify)/m;
		var out = [];
		var m;
		while( m = s.match(cmdre) )
		{
			out.push(m[1]);
			var cmd = m[2];
			out.push(cmd);

			var i = m[0].length;

			var args = '';
			var argbrackets = false;
			if( s.charAt(i) == '[' )
			{
				argbrackets = true;
				var si = i+1;
				while(i<s.length && s.charAt(i)!=']')
					i++;
				if(i==s.length)
					throw(new Numbas.Error('jme.texsubvars.no right bracket',cmd));
				else
				{
					args = s.slice(si,i);
					i++;
				}
			}
			if(!argbrackets)
				args='all';
			out.push(args);

			if(s.charAt(i)!='{')
			{
				throw(new Numbas.Error('jme.texsubvars.missing parameter',cmd,s));
			}

			var brackets=1;
			var si = i+1;
			while(i<s.length-1 && brackets>0)
			{
				i++;
				if(s.charAt(i)=='{')
					brackets++;
				else if(s.charAt(i)=='}')
					brackets--;
			}
			if(i == s.length-1 && brackets>0)
				throw(new Numbas.Error('jme.texsubvars.no right brace',cmd));

			var expr = s.slice(si,i);
			s = s.slice(i+1);
			out.push(expr);
		}
		out.push(s);
		return out;
	},

	/** Dictionary of functions 
	 * type: function(value,display:boolean) -> string 
	 * which convert a JME token to a string for display
	 */
	typeToDisplayString: {
		'number': function(v) {
			return ''+Numbas.math.niceNumber(v.value)+'';
		},
		'string': function(v,display) {
			return v.value;
		},
	},

	/** Produce a string representation of the given token, for display
	 * @param {Numbas.jme.token} v
	 * @see Numbas.jme.typeToDisplayString
	 * @returns {string}
	 */
	tokenToDisplayString: function(v) {
		if(v.type in jme.typeToDisplayString) {
			return jme.typeToDisplayString[v.type](v);
		} else {
			return jme.display.treeToJME({tok:v});
		}
	},

	/** Substitute variables into a text string (not maths).
	 * @param {string} str
	 * @param {Numbas.jme.Scope} scope
	 * @param {boolean} [display=false] - Is this string going to be displayed to the user? If so, avoid unnecessary brackets and quotes.
	 */
	subvars: function(str, scope,display)
	{
		var bits = util.splitbrackets(str,'{','}');
		if(bits.length==1)
		{
			return str;
		}
		var out = '';
		for(var i=0; i<bits.length; i++)
		{
			if(i % 2)
			{
				var v = jme.evaluate(jme.compile(bits[i],scope),scope);
				if(display) {
					v = jme.tokenToDisplayString(v);
				} else {
					if(v.type=='number') {
						v = '('+Numbas.jme.display.treeToJME({tok:v})+')';
					} else if(v.type=='string') {
						v = "'"+v.value+"'";
					} else {
						v = jme.display.treeToJME({tok:v});
					}
				}

				out += v;
			}
			else
			{
				out+=bits[i];
			}
		}
		return out;
	},

	/** Unwrap a {@link Numbas.jme.token} into a plain JavaScript value
	 * @param {Numbas.jme.token} v
	 * @returns {object}
	 */
	unwrapValue: function(v) {
		if(v.type=='list')
			return v.value.map(jme.unwrapValue);
		else
			return v.value;
	},
	
	/** Wrap up a plain JavaScript value (number, string, bool or array) as a {@link Numbas.jme.token}.
	 * @param {object} v
	 * @param {string} typeHint - name of the expected type (to differentiate between, for example, matrices, vectors and lists
	 * @returns {Numbas.jme.token}
	 */
	wrapValue: function(v,typeHint) {
		switch(typeof v) {
		case 'number':
			return new jme.types.TNum(v);
		case 'string':
			return new jme.types.TString(v);
		case 'boolean':
			return new jme.types.TBool(v);
		default:
			if(util.isArray(v)) {
				// it would be nice to abstract this, but some types need the arguments to be wrapped, while others don't
				switch(typeHint) {
				case 'matrix':
					return new jme.types.TMatrix(v);
				case 'vector':
					return new jme.types.TVector(v);
				case 'range':
					return new jme.types.TRange(v);
				case 'set':
					v = v.map(jme.wrapValue);
					return new jme.types.TSet(v);
				default:
					v = v.map(jme.wrapValue);
					return new jme.types.TList(v);
				}
			}
			return v;
		}
	},

	/** Is a token a TOp?
	 *
	 * @param {Numbas.jme.token} 
	 * 
	 * @returns {boolean}
	 */
	isOp: function(tok,op) {
		return tok.type=='op' && tok.name==op;
	},

	/** Is a token a TName?
	 *
	 * @param {Numbas.jme.token} 
	 * 
	 * @returns {boolean}
	 */
	isName: function(tok,name) {
		return tok.type=='name' && tok.name==name;
	},

	/** Is a token a TFunction?
	 *
	 * @param {Numbas.jme.token} 
	 * 
	 * @returns {boolean}
	 */
	isFunction: function(tok,name) {
		return tok.type=='function' && tok.name==name;
	}
};

/** Regular expression to match whitespace (because '\s' doesn't match *everything*) */
jme.re.re_whitespace = '(?:[\\s \\f\\n\\r\\t\\v\\u00A0\\u2028\\u2029]|(?:\&nbsp;))';
jme.re.re_strip_whitespace = new RegExp('^'+jme.re.re_whitespace+'+|'+jme.re.re_whitespace+'+$','g');


var displayFlags = {
	fractionnumbers: undefined,
	rowvector: undefined
};

var ruleSort = util.sortBy(['patternString','resultString','conditionStrings']);

/** Set of simplification rules
 * @constructor
 * @memberof Numbas.jme
 * @param {rule[]} rules
 * @param {object} flags
 */
var Ruleset = jme.Ruleset = function(rules,flags) {
	this.rules = rules;
	this.flags = util.extend_dict({},displayFlags,flags);
}
Ruleset.prototype = /** @lends Numbas.jme.Ruleset.prototype */ {
	/** Test whether flag is set 
	 * @memberof Numbas.jme.Ruleset.prototype
	 */
	flagSet: function(flag) {
		flag = flag.toLowerCase();
		if(this.flags.hasOwnProperty(flag))
			return this.flags[flag];
		else
			return false;
	}
}

function mergeRulesets(r1,r2) {
	var rules = r1.rules.merge(r2.rules,ruleSort);
	var flags = util.extend_dict({},r1.flags,r2.flags);
	return new Ruleset(rules, flags);
}

//collect a ruleset together from a list of ruleset names, or rulesets.
// set can be a comma-separated string of ruleset names, or an array of names/Ruleset objects.
var collectRuleset = jme.collectRuleset = function(set,scopeSets)
{
	scopeSets = util.copyobj(scopeSets);

	if(!set)
		return [];

	if(!scopeSets)
		throw(new Numbas.Error('jme.display.collectRuleset.no sets'));

	var rules = [];
	var flags = {};

	if(typeof(set)=='string') {
		set = set.split(',');
	}
	else {
		flags = util.extend_dict(flags,set.flags);
		if(set.rules)
			set = set.rules;
	}

	for(var i=0; i<set.length; i++ )
	{
		if(typeof(set[i])=='string')
		{
			var m = /^\s*(!)?(.*)\s*$/.exec(set[i]);
			var neg = m[1]=='!' ? true : false;
			var name = m[2].trim().toLowerCase();
			if(name in displayFlags)
			{
				flags[name]= !neg;
			}
			else if(name.length>0)
			{
				if(!(name in scopeSets))
				{
					throw(new Numbas.Error('jme.display.collectRuleset.set not defined',name));
				}

				var sub = collectRuleset(scopeSets[name],scopeSets);

				flags = util.extend_dict(flags,sub.flags);

				scopeSets[name] = sub;
				if(neg)
				{
					for(var j=0; j<sub.rules.length; j++)
					{
						if((m=rules.indexOf(sub.rules[j]))>=0)
						{
							rules.splice(m,1);
						}
					}
				}
				else
				{
					for(var j=0; j<sub.rules.length; j++)
					{
						if(!(rules.contains(sub.rules[j])))
						{
							rules.push(sub.rules[j]);
						}
					}
				}
			}
		}
		else
			rules.push(set[i]);
	}
	return new Ruleset(rules,flags);
}

var fnSort = util.sortBy('id');

/**
 * JME evaluation environment.
 * @memberof Numbas.jme
 * @constructor
 * @property {object} variables - dictionary of {@link Numbas.jme.token} objects
 * @property {object} functions - dictionary of arrays of {@link Numbas.jme.funcObj} objects. There can be more than one function for each name because of signature overloading.
 * @property {objects} rulesets - dictionary of {@link Numbas.jme.Ruleset} objects
 *
 * @param {Numbas.jme.Scope[]} scopes - List of scopes to combine into this one. Scopes appearing later in the list override ones appearing earlier, in case variable/ruleset names conflict.
 */
var Scope = jme.Scope = function(scopes) {
	this.variables = {};
	this.functions = {};
	this.rulesets = {};

	if(scopes===undefined)
		return;

	if(!util.isArray(scopes))
		scopes = [scopes];

	for(var i=0;i<scopes.length;i++) {
		var scope = scopes[i];
		if(scope) {
			if('variables' in scope) {
				for(var x in scope.variables) {
					this.variables[x] = scope.variables[x];
				}
			}
			if('functions' in scope) {
				for(var x in scope.functions) {
					if(!(x in this.functions))
						this.functions[x] = scope.functions[x].slice();
					else 
						this.functions[x] = this.functions[x].merge(scope.functions[x],fnSort);
				}
			}
			if('rulesets' in scope) {
				for(var x in scope.rulesets) {
					if(!(x in this.rulesets))
						this.rulesets[x] = scope.rulesets[x];
					else
						this.rulesets[x] = mergeRulesets(this.rulesets[x],scope.rulesets[x]);
				}
			}
		}
	}
}
Scope.prototype = /** @lends Numbas.jme.Scope.prototype */ {
	/** Add a JME function to the scope.
	 * @param {jme.funcObj} fn - function to add
	 */
	addFunction: function(fn) {
		if(!(fn.name in this.functions))
			this.functions[fn.name] = [fn];
		else
			this.functions[fn.name].push(fn);
	},

	/** Evaluate an expression in this scope - equivalent to `Numbas.jme.evaluate(expr,this)`
	 * @param {JME} expr
	 * @param {object} [variables] - dictionary of variables to sub into expression. Values are automatically wrapped up as JME types, so you can pass raw JavaScript values.
	 * @returns {token}
	 */
	evaluate: function(expr,variables) {
		var scope = this;
		if(variables) {
			scope = new Scope([this]);
			for(var name in variables) {
				scope.variables[name] = jme.wrapValue(variables[name]);
			}
		}
		return jme.evaluate(expr,scope);
	}
};


/** @typedef Numbas.jme.token
 * @type {object}
 * @property {string} type
 * @see Numbas.jme.types
 */

/** The data types supported by JME expressions 
 * @namespace Numbas.jme.types
 */
var types = jme.types = {}

/** Number type.
 * @memberof Numbas.jme.types
 * @augments Numbas.jme.token
 * @property {number} value
 * @property type "number"
 * @constructor
 * @param {number} num
 */
var TNum = types.TNum = types.number = function(num)
{
	if(num===undefined) 
		return;

	this.value = num.complex ? num : parseFloat(num);
}
TNum.prototype.type = 'number';
TNum.doc = {
	name: 'number',
	usage: ['0','1','0.234','i','e','pi'],
	description: "@i@, @e@, @infinity@ and @pi@ are reserved keywords for the imaginary unit, the base of the natural logarithm, $\\infty$ and $\\pi$, respectively."
};

/** String type.
 * @memberof Numbas.jme.types
 * @augments Numbas.jme.token
 * @property {string} value
 * @property type "string"
 * @constructor
 * @param {string} s
 */
var TString = types.TString = types.string = function(s)
{
	this.value = s;
}
TString.prototype.type = 'string';
TString.doc = {
	name: 'string',
	usage: ['\'hello\'','"hello"'],
	description: "Use strings to create non-mathematical text."
};

/** Boolean type
 * @memberof Numbas.jme.types
 * @augments Numbas.jme.token
 * @property {boolean} value
 * @property type "boolean"
 * @constructor
 * @param {boolean} b
 */
var TBool = types.TBool = types.boolean = function(b)
{
	this.value = b;
}
TBool.prototype.type = 'boolean';
TBool.doc = {
	name: 'boolean',
	usage: ['true','false'],
	description: "Booleans represent either truth or falsity. The logical operations @and@, @or@ and @xor@ operate on and return booleans."
}


/** List of elements of any data type
 * @memberof Numbas.jme.types
 * @augments Numbas.jme.token
 * @property {number} vars - Length of list
 * @property {object[]} value - Values (may not be filled in if the list was created empty)
 * @property type "html"
 * @constructor
 * @param {number|object} value - Either the size of the list, or an array of values
 */
var TList = types.TList = types.list = function(value)
{
	switch(typeof(value))
	{
	case 'number':
		this.vars = value;
		break;
	case 'object':
		this.value = value;
		this.vars = value.length;
		break;
	default:
		this.vars = 0;
	}
}
TList.prototype.type = 'list';
TList.doc = {
	name: 'list',
	usage: ['[0,1,2,3]','[a,b,c]','[true,false,false]'],
	description: "A list of elements of any data type."
};

/** Set type
 * @memberof Numbas.jme.types
 * @augments Numbas.jme.token
 * @property {object[]} value - Array of elements. Constructor assumes all elements are distinct
 * @property type "set"
 * @constructor
 * @param {object[]} value
 */
var TSet = types.TSet = types.set = function(value) {
	this.value = value;
}
TSet.prototype.type = 'set';

/** Vector type
 * @memberof Numbas.jme.types
 * @augments Numbas.jme.token
 * @property {number[]} value - Array of components
 * @property type "vector"
 * @constructor
 * @param {number[]} value
 */
var TVector = types.TVector = types.vector = function(value)
{
	this.value = value;
}
TVector.prototype.type = 'vector';
TVector.doc = {
	name: 'vector',
	usage: ['vector(1,2)','vector([1,2,3,4])'],
	description: 'The components of a vector must be numbers.\n\n When combining vectors of different dimensions, the smaller vector is padded with zeroes to make up the difference.'
}

/** Matrix type
 * @memberof Numbas.jme.types
 * @augments Numbas.jme.token
 * @property {matrix} value - Array of rows (which are arrays of numbers)
 * @property type "matrix"
 * @constructor
 * @param {matrix} value
 */
var TMatrix = types.TMatrix = types.matrix = function(value)
{
	this.value = value;
}
TMatrix.prototype.type = 'matrix';
TMatrix.doc = {
	name: 'matrix',
	usage: ['matrix([1,2,3],[4,5,6])','matrix(row1,row2)'],
	description: "Matrices are constructed from lists of numbers, representing the rows.\n\n When combining matrices of different dimensions, the smaller matrix is padded with zeroes to make up the difference."
}

/** A range of numerical values - either discrete or continuous
 * @memberof Numbas.jme.types
 * @augments Numbas.jme.token
 * @property {number[]} value - `[start,end,step]` and then, if the range is discrete, all the values included in the range.
 * @property {number} size - the number of values in the range (if it's discrete, `undefined` otherwise)
 * @property type "range"
 * @constructor
 * @param {number[]} range - `[start,end,step]`
 */
var TRange = types.TRange = types.range = function(range)
{
	this.value = range;
	if(this.value!==undefined)
	{
		var start = this.value[0], end = this.value[1], step = this.value[2];

		//if range is discrete, store all values in range so they don't need to be computed each time
		if(step != 0)
		{
			var n = (end-start)/step;
			this.size = n+1;
			for(var i=0;i<=n;i++)
			{
				this.value[i+3] = start+i*step;
			}
		}
	}
}
TRange.prototype.type = 'range';
TRange.doc = {
	name: 'range',
	usage: ['1..3','1..3#0.1','1..3#0'],
	description: 'A range @a..b#c@ represents the set of numbers $\\{a+nc | 0 \\leq n \\leq \\frac{b-a}{c} \\}$. If the step size is zero, then the range is the continuous interval $\[a,b\]$.'
}

/** Variable name token
 * @memberof Numbas.jme.types
 * @augments Numbas.jme.token
 * @property {string} name
 * @property {string} value - Same as `name`
 * @property {string[]} annotation - List of annotations (used to modify display)
 * @property type "name"
 * @constructor
 * @param {string} name
 * @param {string[]} annotation
 */
var TName = types.TName = types.name = function(name,annotation)
{
	this.name = name;
	this.value = name;
	this.annotation = annotation;
}
TName.prototype.type = 'name';
TName.doc = {
	name: 'name',
	usage: ['x','X','x1','longName','dot:x','vec:x'],
	description: 'A variable or function name. Names are case-insensitive, so @x@ represents the same thing as @X@. \
\n\n\
@e@, @i@ and @pi@ are reserved names representing mathematical constants. They are rewritten by the interpreter to their respective numerical values before evaluation. \
\n\n\
Names can be given _annotations_ to change how they are displayed. The following annotations are built-in:\
\n\n\
* @verb@ - does nothing, but names like @i@, @pi@ and @e@ are not interpreted as the famous mathematical constants.\n\
* @op@ - denote the name as the name of an operator -- wraps the name in the LaTeX @\\operatorname@ command when displayed\n\
* @v@ or @vector@ - denote the name as representing a vector -- the name is displayed in boldface\n\
* @unit@ - denote the name as representing a unit vector -- places a hat above the name when displayed\n\
* @dot@ - places a dot above the name when displayed, for example when representing a derivative\n\
* @m@ or @matrix@ - denote the name as representing a matrix -- displayed using a non-italic font\
\n\n\
Any other annotation is taken to be a LaTeX command. For example, a name @vec:x@ is rendered in LaTeX as <code>\\vec{x}</code>, which places an arrow above the name.\
	'
};

/** JME function token
 * @memberof Numbas.jme.types
 * @augments Numbas.jme.token
 * @property {string} name
 * @property {string[]} annotation - List of annotations (used to modify display)
 * @property {number} vars - Arity of the function
 * @property type "function"
 * @constructor
 * @param {string} name
 * @param {string[]} annotation
 */
var TFunc = types.TFunc = types['function'] = function(name,annotation)
{
	this.name = name;
	this.annotation = annotation;
}
TFunc.prototype.type = 'function';
TFunc.prototype.vars = 0;

/** Unary/binary operation token
 * @memberof Numbas.jme.types
 * @augments Numbas.jme.token
 * @property {string} name
 * @property {number} vars - Arity of the operation
 * @property {boolean} postfix
 * @property {boolean} prefix
 * @properrty type "op"
 * @constructor
 * @param {string} op - Name of the operation
 * @param {boolean} postfix
 * @param {boolean} prefix
 */
var TOp = types.TOp = types.op = function(op,postfix,prefix)
{
	var arity = 2;
	if(jme.arity[op]!==undefined)
		arity = jme.arity[op];

	this.name = op;
	this.postfix = postfix || false;
	this.prefix = prefix || false;
	this.vars = arity;
}
TOp.prototype.type = 'op';

/** Punctuation token
 * @memberof Numbas.jme.types
 * @augments Numbas.jme.token
 * @property {string} type - The punctuation character
 * @constructor
 * @param {string} kind - The punctuation character
 */
var TPunc = types.TPunc = function(kind)
{
	this.type = kind;
}

var TExpression = types.TExpression = types.expression = function(tree) {
	if(typeof(tree)=='string') {
		tree = jme.compile(tree);
	}
	this.tree = tree;
}
TExpression.prototype = {
	type: 'expression'
}


/** Arities of built-in operations
 * @readonly
 * @memberof Numbas.jme
 * @enum {number} */
var arity = jme.arity = {
	'!': 1,
	'not': 1,
	'fact': 1,
	'+u': 1,
	'-u': 1
}

/** Some names represent different operations when used as prefix. This dictionary translates them.
 * @readonly
 * @memberof Numbas.jme
 * @enum {string}
 */
var prefixForm = {
	'+': '+u',
	'-': '-u',
	'!': 'not'
}
/** Some names represent different operations when used as prefix. This dictionary translates them.
 * @readonly
 * @memberof Numbas.jme
 * @enum {string}
 */
var postfixForm = {
	'!': 'fact'
}

/** Operator precedence
 * @enum {number}
 * @memberof Numbas.jme
 * @readonly
 */
var precedence = jme.precedence = {
	';': 0,
	'fact': 1,
	'not': 1,
	'+u': 2.5,
	'-u': 2.5,
	'^': 2,
	'*': 3,
	'/': 3,
	'+': 4,
	'-': 4,
	'|': 5,
	'..': 5,
	'#':6,
	'except': 6.5,
	'in': 6.5,
	'<': 7,
	'>': 7,
	'<=': 7,
	'>=': 7,
	'<>': 8,
	'=': 8,
	'isa': 9,
	'and': 11,
	'or': 12,
	'xor': 13,
	'implies': 14
};

/** Synonyms of names - keys in this dictionary are translated to their corresponding values after tokenising.
 * @enum {string}
 * @memberof Numbas.jme
 * @readonly
 */
var synonyms = jme.synonyms = {
	'&':'and',
	'&&':'and',
	'divides': '|',
	'||':'or',
	'sqr':'sqrt',
	'gcf': 'gcd',
	'sgn':'sign',
	'len': 'abs',
	'length': 'abs',
	'verb': 'verbatim'
};
	
/** Operations which evaluate lazily - they don't need to evaluate all of their arguments 
 * @memberof Numbas.jme
 */
var lazyOps = jme.lazyOps = ['if','switch','repeat','map','let','isa','satisfy','filter','isset'];

var rightAssociative = {
	'^': true,
	'+u': true,
	'-u': true
}

function leftAssociative(op)
{
	// check for left-associativity because that is the case when you do something more
	// exponentiation is only right-associative operation at the moment
	return !(op in rightAssociative);
};

/** Operations which commute.
 * @enum {boolean}
 * @memberof Numbas.jme
 * @readonly
 */
var commutative = jme.commutative =
{
	'*': true,
	'+': true,
	'and': true,
	'=': true
};


var funcObjAcc = 0;	//accumulator for ids for funcObjs, so they can be sorted
/**
 * Function object - for doing type checking away from the evaluator.
 * 
 * `options` can contain any of
 *
 * - `typecheck`: a function which checks whether the funcObj can be applied to the given arguments 
 * - `evaluate`: a function which performs the funcObj on given arguments and variables. Arguments are passed as expression trees, i.e. unevaluated
 * - `unwrapValues`: unwrap list elements in arguments into javascript primitives before passing to the evaluate function
 *
 * @memberof Numbas.jme
 * @constructor
 * @param {string} name
 * @param {function[]|string[]} intype - A list of data type constructors for the function's paramters' types. Use the string '?' to match any type. Or, give the type's name with a '*' in front to match any number of that type.
 * @param {function} outcons - The constructor for the output value of the function
 * @param {function} fn - JavaScript code which evaluates the function.
 * @param {object} options
 *
 */
var funcObj = jme.funcObj = function(name,intype,outcons,fn,options)
{
	/** 
	 * @member {number} 
	 * @memberof Numbas.jme.funcObj 
	 */
	this.id = funcObjAcc++;
	options = options || {};
	for(var i=0;i<intype.length;i++)
	{
		if(intype[i]!='?' && intype[i]!='?*')
		{
			if(intype[i][0]=='*')
			{
				var type = types[intype[i].slice(1)];
				intype[i] = '*'+type.prototype.type;
			}
			else
			{
				intype[i]=intype[i].prototype.type;
			}
		}
	}

	name = name.toLowerCase();

	this.name=name;
	this.intype = intype;
	if(typeof(outcons)=='function')
		this.outtype = new outcons().type;
	else
		this.outtype = '?';
	this.outcons = outcons;
	this.fn = fn;

	this.typecheck = options.typecheck || function(variables)
	{
		variables = variables.slice();	//take a copy of the array

		for( var i=0; i<this.intype.length; i++ )
		{
			if(this.intype[i][0]=='*')	//arbitrarily many
			{
				var ntype = this.intype[i].slice(1);
				while(variables.length)
				{
					if(variables[0].type==ntype || ntype=='?' || variables[0].type=='?')
						variables = variables.slice(1);
					else
						return false;
				}
			}else{
				if(variables.length==0)
					return false;

				if(variables[0].type==this.intype[i] || this.intype[i]=='?' || variables[0].type=='?')
					variables = variables.slice(1);
				else
					return false;
			}
		}
		if(variables.length>0)	//too many args supplied
			return false;
		else
			return true;
	};

	this.evaluate = options.evaluate || function(args,scope)
	{
		var nargs = [];
		for(var i=0; i<args.length; i++) {
			if(options.unwrapValues)
				nargs.push(jme.unwrapValue(args[i]));
			else
				nargs.push(args[i].value);
		}

		var result = this.fn.apply(null,nargs);

		if(options.unwrapValues) {
			result = jme.wrapValue(result);
			if(!result.type)
				result = new this.outcons(result);
		}
		else
			result = new this.outcons(result);

		if(options.latex) {
			result.latex = true;
		}

		return result;
	}	

	this.doc = options.doc;
}




function randoms(varnames,min,max,times)
{
	times *= varnames.length;
	var rs = [];
	for( var i=0; i<times; i++ )
	{
		var r = {};
		for( var j=0; j<varnames.length; j++ )
		{
			r[varnames[j]] = new TNum(Numbas.math.randomrange(min,max));
		}
		rs.push(r);
	}
	return rs;
}


function varnamesAgree(array1, array2) {
	var name;
	for(var i=0; i<array1.length; i++) {
		if( (name=array1[i])[0]!='$' && !array2.contains(name) )
			return false;
	}
	
	return true;
};

/** 
 * Numerical comparison functions
 * @enum {function}
 * @memberof Numbas.jme 
 */
var checkingFunctions = 
{
	/** Absolute difference between variables - fail if bigger than tolerance */
	absdiff: function(r1,r2,tolerance) 
	{
		if(r1===Infinity || r1===-Infinity)
			return r1===r2;

		return math.leq(math.abs(math.sub(r1,r2)), Math.abs(tolerance));
	},

	/** Relative (proportional) difference between variables - fail if `r1/r2 - 1` is bigger than tolerance */
	reldiff: function(r1,r2,tolerance) {
		if(r1===Infinity || r1===-Infinity)
			return r1===r2;

		// 
		if(r2!=0) {
			return math.leq(Math.abs(math.sub(r1,r2)), Math.abs(math.mul(tolerance,r2)));
		} else {	//or if correct answer is 0, checks abs difference
			return math.leq(Math.abs(math.sub(r1,r2)), tolerance);
		}
	},

	/** Round both values to given number of decimal places, and fail if unequal. */
	dp: function(r1,r2,tolerance) {
		if(r1===Infinity || r1===-Infinity)
			return r1===r2;

		tolerance = Math.floor(Math.abs(tolerance));
		return math.eq( math.precround(r1,tolerance), math.precround(r2,tolerance) );
	},

	/** Round both values to given number of significant figures, and fail if unequal. */
	sigfig: function(r1,r2,tolerance) {
		if(r1===Infinity || r1===-Infinity)
			return r1===r2;

		tolerance = Math.floor(Math.abs(tolerance));
		return math.eq(math.siground(r1,tolerance), math.siground(r2,tolerance));
	}
};

/** Custom substituteTree behaviour for specific functions - for a given usage of a function, substitute in variable values from the scope.
 *
 * Functions have the signature <tree with function call at the top, scope, allowUnbound>
 *
 * @memberof Numbas.jme
 * @enum {function}
 * @see Numbas.jme.substituteTree
 */
var substituteTreeOps = jme.substituteTreeOps = {};

/** Custom findvars behaviour for specific functions - for a given usage of a function, work out which variables it depends on.
 * 
 * Functions have the signature <tree with function call at top, list of bound variable names, scope>.
 *
 * tree.args is a list of the function's arguments.
 *
 * @memberof Numbas.jme
 * @enum {function}
 * @see Numbas.jme.findvars
 */
var findvarsOps = jme.findvarsOps = {}

/** Find all variables used in given syntax tree
 * @memberof Numbas.jme
 * @method
 * @param {Numbas.jme.tree} tree
 * @param {string[]} boundvars - variables to be considered as bound (don't include them)
 * @param {Numbas.jme.Scope} scope
 * @returns {string[]}
 */
var findvars = jme.findvars = function(tree,boundvars,scope)
{
	if(!scope)
		scope = jme.builtinScope;
	if(boundvars===undefined)
		boundvars = [];

	if(tree.tok.type=='function' && tree.tok.name in findvarsOps) {
		return findvarsOps[tree.tok.name](tree,boundvars,scope);
	}

	if(tree.args===undefined)
	{
		switch(tree.tok.type)
		{
		case 'name':
			var name = tree.tok.name.toLowerCase();
			if(boundvars.indexOf(name)==-1)
				return [name];
			else
				return [];
			break;
		case 'string':
			var bits = util.contentsplitbrackets(tree.tok.value);
			var out = [];
			for(var i=0;i<bits.length;i+=4)
			{
				var plain = bits[i];
				var sbits = util.splitbrackets(plain,'{','}');
				for(var k=1;k<sbits.length-1;k+=2)
				{
					var tree2 = jme.compile(sbits[k],scope,true);
					out = out.merge(findvars(tree2,boundvars));
				}
				if(i<=bits.length-3) {
					var tex = bits[i+2];
					var tbits = jme.texsplit(tex);
					for(var j=0;j<tbits.length;j+=4) {
						var cmd = tbits[j+1];
						var expr = tbits[j+3];
						switch(cmd)
						{
						case 'var':
							var tree2 = jme.compile(expr,scope,true);
							out = out.merge(findvars(tree2,boundvars));
							break;
						case 'simplify':
							var sbits = util.splitbrackets(expr,'{','}');
							for(var k=1;k<sbits.length-1;k+=2)
							{
								var tree2 = jme.compile(sbits[k],scope,true);
								out = out.merge(findvars(tree2,boundvars));
							}
							break;
						}
					}
				}
			}
			return out;
		default:
			return [];
		}
	}
	else
	{
		var vars = [];
		for(var i=0;i<tree.args.length;i++)
			vars = vars.merge(findvars(tree.args[i],boundvars));
		return vars;
	}
}

/** Check that two values are equal 
 * @memberof Numbas.jme
 * @method
 * @param {Numbas.jme.token} r1
 * @param {Numbas.jme.token} r2
 * @param {function} checkingFunction - one of {@link Numbas.jme.checkingFunctions}
 * @param {number} checkingAccuracy
 * @returns {boolean}
 */
function resultsEqual(r1,r2,checkingFunction,checkingAccuracy)
{	// first checks both expressions are of same type, then uses given checking type to compare results

	var v1 = r1.value, v2 = r2.value;

	if(r1.type != r2.type)
	{
		return false;
	}
	switch(r1.type)
	{
	case 'number':
		if(v1.complex || v2.complex)
		{
			if(!v1.complex)
				v1 = {re:v1, im:0, complex:true};
			if(!v2.complex)
				v2 = {re:v2, im:0, complex:true};
			return checkingFunction(v1.re, v2.re, checkingAccuracy) && checkingFunction(v1.im,v2.im,checkingAccuracy);
		}
		else
		{
			return checkingFunction( v1, v2, checkingAccuracy );
		}
		break;
	case 'vector':
		if(v1.length != v2.length)
			return false;
		for(var i=0;i<v1.length;i++)
		{
			if(!resultsEqual(new TNum(v1[i]),new TNum(v2[i]),checkingFunction,checkingAccuracy))
				return false;
		}
		return true;
		break;
	case 'matrix':
		if(v1.rows != v2.rows || v1.columns != v2.columns)
			return false;
		for(var i=0;i<v1.rows;i++)
		{
			for(var j=0;j<v1.columns;j++)
			{
				if(!resultsEqual(new TNum(v1[i][j]||0),new TNum(v2[i][j]||0),checkingFunction,checkingAccuracy))
					return false;
			}
		}
		return true;
		break;
	case 'list':
		if(v1.length != v2.length)
			return false;
		for(var i=0;i<v1.length;i++)
		{
			if(!resultsEqual(v1[i],v2[i],checkingFunction,checkingAccuracy))
				return false;
		}
		return true;
	default:
		return util.eq(r1,r2);
	}
};

});
