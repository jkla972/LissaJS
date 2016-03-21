window.LissaJS = (function() {

var LissaJS = {};

LissaJS.Error = function(message)
{
	this.name="LissaJS Error";
	this.originalMessage = message;
	this.message = Array.prototype.join.call(arguments,' ');
};
LissaJS.Error.prototype = Error.prototype;
LissaJS.Error.prototype.constructor = LissaJS.Error;

LissaJS.queueScript = function(name,deps,callback) {
    callback();
}
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

/** @file Mathematical functions, providing stuff that the built-in `Math` object doesn't, as well as vector and matrix math operations. 
 *
 * Provides {@link LissaJS.math}, {@link LissaJS.vectormath} and {@link LissaJS.matrixmath}
 */

LissaJS.queueScript('math',['base'],function() {

/** Mathematical functions, providing stuff that the built-in `Math` object doesn't
 * @namespace LissaJS.math */

/** @typedef complex
 * @property {number} re
 * @property {number} im
 */

/** @typedef range
 * @desc A range of numbers, separated by a constant intervaland between fixed lower and upper bounds.
 * @type {number[]}
 * @property {number} 0 Minimum value
 * @property {number} 1 Maximum value
 * @property {number} 2 Step size
 * @see LissaJS.math.defineRange
 */

var math = LissaJS.math = /** @lends LissaJS.math */ {

	/** Regex to match numbers in scientific notation */
	re_scientificNumber: /(\-?(?:0|[1-9]\d*)(?:\.\d+)?)[eE]([\+\-]?\d+)/,
	
	/** Construct a complex number from real and imaginary parts.
	 *
	 * Elsewhere in this documentation, `{number}` will refer to either a JavaScript float or a {@link complex} object, interchangeably.
	 * @param {number} re
	 * @param {number} im
	 * @returns {complex}
	 */
	complex: function(re,im)
	{
		if(!im)
			return re;
		else
			return {re: re, im: im, complex: true, 
			toString: math.complexToString}
	},
	
	/** String version of a complex number
	 * @returns {string}
	 * @method
	 * @memberof! complex
	 */
	complexToString: function()
	{
		return math.niceNumber(this);
	},

	/** Negate a number.
	 * @param {number} n
	 * @returns {number}
	 */
	negate: function(n)
	{
		if(n.complex)
			return math.complex(-n.re,-n.im);
		else
			return -n;
	},

	/** Complex conjugate
	 * @param {number} n
	 * @returns {number}
	 */
	conjugate: function(n)
	{
		if(n.complex)
			return math.complex(n.re,-n.im);
		else
			return n;
	},

	/** Add two numbers
	 * @param {number} a
	 * @param {number} b
	 * @returns {number}
	 */
	add: function(a,b)
	{
		if(a.complex)
		{
			if(b.complex)
				return math.complex(a.re+b.re, a.im + b.im);
			else
				return math.complex(a.re+b, a.im);
		}
		else
		{
			if(b.complex)
				return math.complex(a + b.re, b.im);
			else
				return a+b;
		}
	},

	/** Subtract one number from another
	 * @param {number} a
	 * @param {number} b
	 * @returns {number}
	 */
	sub: function(a,b)
	{
		if(a.complex)
		{
			if(b.complex)
				return math.complex(a.re-b.re, a.im - b.im);
			else
				return math.complex(a.re-b, a.im);
		}
		else
		{
			if(b.complex)
				return math.complex(a - b.re, -b.im);
			else
				return a-b;
		}
	},

	/** Multiply two numbers
	 * @param {number} a
	 * @param {number} b
	 * @returns {number}
	 */
	mul: function(a,b)
	{
		if(a.complex)
		{
			if(b.complex)
				return math.complex(a.re*b.re - a.im*b.im, a.re*b.im + a.im*b.re);
			else
				return math.complex(a.re*b, a.im*b);
		}
		else
		{
			if(b.complex)
				return math.complex(a*b.re, a*b.im);
			else
				return a*b;
		}
	},

	/** Divide one number by another
	 * @param {number} a
	 * @param {number} b
	 * @returns {number}
	 */
	div: function(a,b)
	{
		if(a.complex)
		{
			if(b.complex)
			{
				var q = b.re*b.re + b.im*b.im;
				return math.complex((a.re*b.re + a.im*b.im)/q, (a.im*b.re - a.re*b.im)/q);
			}
			else
				return math.complex(a.re/b, a.im/b);
		}
		else
		{
			if(b.complex)
			{
				var q = b.re*b.re + b.im*b.im;
				return math.complex(a*b.re/q, -a*b.im/q);
			}
			else
				return a/b;
		}
	},

	/** Exponentiate a number
	 * @param {number} a
	 * @param {number} b
	 * @returns {number}
	 */
	pow: function(a,b)
	{
		if(a.complex && LissaJS.util.isInt(b) && Math.abs(b)<100)
		{
			if(b<0)
				return math.div(1,math.pow(a,-b));
			if(b==0)
				return 1;
			var coeffs = math.binomialCoefficients(b);

			var re = 0;
			var im = 0;
			var sign = 1;
			for(var i=0;i<b;i+=2) {
				re += coeffs[i]*Math.pow(a.re,b-i)*Math.pow(a.im,i)*sign;
				im += coeffs[i+1]*Math.pow(a.re,b-i-1)*Math.pow(a.im,i+1)*sign;
				sign = -sign;
			}
			if(b%2==0)
				re += Math.pow(a.im,b)*sign;
			return math.complex(re,im);
		}
		if(a.complex || b.complex || (a<0 && math.fract(b)!=0))
		{
			if(!a.complex)
				a = {re: a, im: 0, complex: true};
			if(!b.complex)
				b = {re: b, im: 0, complex: true};
			var ss = a.re*a.re + a.im*a.im;
			var arg1 = math.arg(a);
			var mag = Math.pow(ss,b.re/2) * Math.exp(-b.im*arg1);
			var arg = b.re*arg1 + (b.im * Math.log(ss))/2;
			return math.complex(mag*Math.cos(arg), mag*Math.sin(arg));
		}
		else
		{
			return Math.pow(a,b);
		}
	},

	/** Calculate the Nth row of Pascal's triangle
	 * @param {number} n
	 * @returns {number[]}
	 */
	binomialCoefficients: function(n) {
		var b = [1];
		var f = 1;

		for(var i=1;i<=n;i++) { 
			b.push( f*=(n+1-i)/i );
		}
		return b;
	},

	/** a mod b. Always returns a positive number
	 * @param {number} a
	 * @param {number} b
	 * @returns {number}
	 */
	mod: function(a,b) {
		if(b==Infinity) {
			return a;
		}
		b = math.abs(b);
		return ((a%b)+b)%b;
	},

	/** Calculate the `b`-th root of `a`
	 * @param {number} a
	 * @param {number} b
	 * @returns {number}
	 */
	root: function(a,b)
	{
		return math.pow(a,div(1,b));
	},

	/** Square root
	 * @param {number} n
	 * @returns {number}
	 */
	sqrt: function(n)
	{
		if(n.complex)
		{
			var r = math.abs(n);
			return math.complex( Math.sqrt((r+n.re)/2), (n.im<0 ? -1 : 1) * Math.sqrt((r-n.re)/2));
		}
		else if(n<0)
			return math.complex(0,Math.sqrt(-n));
		else
			return Math.sqrt(n)
	},

	/** Natural logarithm (base `e`)
	 * @param {number} n
	 * @returns {number}
	 */
	log: function(n)
	{
		if(n.complex)
		{
			var mag = math.abs(n);
			var arg = math.arg(n);
			return math.complex(Math.log(mag), arg);
		}
		else if(n<0)
			return math.complex(Math.log(-n),Math.PI);
		else
			return Math.log(n);
	},

	/** Calculate `e^n`
	 * @param {number} n
	 * @returns {number}
	 */
	exp: function(n)
	{
		if(n.complex)
		{
			return math.complex( Math.exp(n.re) * Math.cos(n.im), Math.exp(n.re) * Math.sin(n.im) );
		}
		else
			return Math.exp(n);
	},
	
	/** Magnitude of a number - absolute value of a real; modulus of a complex number.
	 * @param {number} n
	 * @returns {number}
	 */
	abs: function(n)
	{
		if(n.complex)
		{
			if(n.re==0)
				return Math.abs(n.im);
			else if(n.im==0)
				return Math.abs(n.re);
			else
				return Math.sqrt(n.re*n.re + n.im*n.im)
		}
		else
			return Math.abs(n);
	},

	/** Argument of a (complex) number
	 * @param {number} n
	 * @returns {number}
	 */
	arg: function(n)
	{
		if(n.complex)
			return Math.atan2(n.im,n.re);
		else
			return Math.atan2(0,n);
	},

	/** Real part of a number
	 * @param {number} n
	 * @returns {number}
	 */
	re: function(n)
	{
		if(n.complex)
			return n.re;
		else
			return n;
	},

	/** Imaginary part of a number
	 * @param {number} n
	 * @returns {number}
	 */
	im: function(n)
	{
		if(n.complex)
			return n.im;
		else
			return 0;
	},

	/** Is `a` less than `b`?
	 * @throws {LissaJS.Error} `math.order complex numbers` if `a` or `b` are complex numbers.
	 * @param {number} a
	 * @param {number} b
	 * @returns {boolean}
	 */
	lt: function(a,b)
	{
		if(a.complex || b.complex)
			throw(new LissaJS.Error('math.order complex numbers'));
		return a<b;
	},

	/** Is `a` greater than `b`?
	 * @throws {LissaJS.Error} `math.order complex numbers` if `a` or `b` are complex numbers.
	 * @param {number} a
	 * @param {number} b
	 * @returns {boolean}
	 */
	gt: function(a,b)
	{
		if(a.complex || b.complex)
			throw(new LissaJS.Error('math.order complex numbers'));
		return a>b;
	},

	/** Is `a` less than or equal to `b`?
	 * @throws {LissaJS.Error} `math.order complex numbers` if `a` or `b` are complex numbers.
	 * @param {number} a
	 * @param {number} b
	 * @returns {boolean}
	 */
	leq: function(a,b)
	{
		if(a.complex || b.complex)
			throw(new LissaJS.Error('math.order complex numbers'));
		return a<=b;
	},
	
	/** Is `a` greater than or equal to `b`?
	 * @throws {LissaJS.Error} `math.order complex numbers` if `a` or `b` are complex numbers.
	 * @param {number} a
	 * @param {number} b
	 * @returns {boolean}
	 */
	geq: function(a,b)
	{
		if(a.complex || b.complex)
			throw(new LissaJS.Error('math.order complex numbers'));
		return a>=b;
	},

	/** Is `a` equal to `b`?
	 * @param {number} a
	 * @param {number} b
	 * @returns {boolean}
	 */
	eq: function(a,b)
	{
		if(a.complex)
		{
			if(b.complex)
				return (a.re==b.re && a.im==b.im);
			else
				return (a.re==b && a.im==0);
		}
		else
		{
			if(b.complex)
				return (a==b.re && b.im==0);
			else
				return a==b;
		}
	},

	/** Greatest of two numbers - wraps `Math.max`
	 * @throws {LissaJS.Error} `math.order complex numbers` if `a` or `b` are complex numbers.
	 * @param {number} a
	 * @param {number} b
	 * @returns {number}
	 */
	max: function(a,b)
	{
		if(a.complex || b.complex)
			throw(new LissaJS.Error('math.order complex numbers'));
		return Math.max(a,b);
	},

	/** Greatest of a list of numbers
	 * @throws {LissaJS.Error} `math.order complex numbers` if any element of the list is complex.
	 * @param {Array} numbers
	 * @returns {number}
	 */
	listmax: function(numbers) {
		if(numbers.length==0) {
			return;
		}
		var best = numbers[0];
		for(var i=1;i<numbers.length;i++) {
			best = math.max(best,numbers[i]);
		}
		return best;
	},

	/** Least of two numbers - wraps `Math.min`
	 * @throws {LissaJS.Error} `math.order complex numbers` if `a` or `b` are complex numbers.
	 * @param {number} a
	 * @param {number} b
	 * @returns {number}
	 */
	min: function(a,b)
	{
		if(a.complex || b.complex)
			throw(new LissaJS.Error('math.order complex numbers'));
		return Math.min(a,b);
	},
	
	/** Least of a list of numbers
	 * @throws {LissaJS.Error} `math.order complex numbers` if any element of the list is complex.
	 * @param {Array} numbers
	 * @returns {number}
	 */
	listmin: function(numbers) {
		if(numbers.length==0) {
			return;
		}
		var best = numbers[0];
		for(var i=1;i<numbers.length;i++) {
			best = math.min(best,numbers[i]);
		}
		return best;
	},

	/** Are `a` and `b` unequal?
	 * @param {number} a
	 * @param {number} b
	 * @returns {boolean}
	 * @see LissaJS.math.eq
	 */
	neq: function(a,b)
	{
		return !math.eq(a,b);
	},

	/** If `n` can be written in the form `a*pi^n`, return the biggest possible `n`, otherwise return `0`.
	 * @param {number} n
	 * @returns {number}
	 */
	piDegree: function(n)
	{
		n=Math.abs(n);

		if(n>10000)	//so big numbers don't get rounded to a power of pi accidentally
			return 0;

		var degree,a;
		for(degree=1; (a=n/Math.pow(Math.PI,degree))>1 && Math.abs(a-math.round(a))>0.00000001; degree++) {}
		return( a>=1 ? degree : 0 );
	},

	/** Display a number nicely - rounds off to 10dp so floating point errors aren't displayed
	 * @param {number} n
	 * @param {object} options - `precisionType` is either "dp" or "sigfig"
	 * @returns {string}
	 */
	niceNumber: function(n,options)
	{
		options = options || {};
		if(n.complex)
		{
			var re = math.niceNumber(n.re,options);
			var im = math.niceNumber(n.im,options);
			if(math.precround(n.im,10)==0)
				return re+'';
			else if(math.precround(n.re,10)==0)
			{
				if(n.im==1)
					return 'i';
				else if(n.im==-1)
					return '-i';
				else
					return im+'*i';
			}
			else if(n.im<0)
			{
				if(n.im==-1)
					return re+' - i';
				else
					return re+im+'*i';
			}
			else
			{
				if(n.im==1)
					return re+' + '+'i';
				else
					return re+' + '+im+'*i';
			}
		}
		else	
		{
			if(n==Infinity) {
				return 'infinity';
			} else if(n==-Infinity) {
				return '-infinity';
			}

			var piD = 0;
			if(options.precisionType === undefined && (piD = math.piDegree(n)) > 0)
				n /= Math.pow(Math.PI,piD);

			var out;
			switch(options.precisionType) {
			case 'sigfig':
				var precision = options.precision;
				out = math.siground(n,precision)+'';
				var sigFigs = math.countSigFigs(out,true);
				if(sigFigs<precision) {
					if(out.indexOf('.')==-1)
						out += '.';
					for(var i=0;i<precision-sigFigs;i++)
						out+='0';
				}
				break;
			case 'dp':
				var precision = options.precision;
				out = math.precround(n,precision)+'';
				var dp = math.countDP(out);
				if(dp<precision) {
					if(out.indexOf('.')==-1)
						out += '.';
					for(var i=0;i<precision-dp;i++)
						out+='0';
				}
				break;
			default:
				var a = Math.abs(n);
				if(a<1e-15) {
					out = '0';
				} else if(Math.abs(n)<1e-8) {
					out = n+'';
				} else {
					out = math.precround(n,10)+'';
				}
			}
			switch(piD)
			{
			case 0:
				return out;
			case 1:
				if(n==1)
					return 'pi';
				else if(n==-1)
					return '-pi';
				else
					return out+'*pi';
			default:
				if(n==1)
					return 'pi^'+piD;
				else if(n==-1)
					return '-pi^'+piD;
				else
					return out+'*pi'+piD;
			}
		}
	},

	/** Get a random number in range `[0..n-1]`
	 * @param {number} n
	 * @returns {number}
	 */
	randomint: function(n) {
		return Math.floor(n*(Math.random()%1)); 
	},

	/** Get a  random shuffling of the numbers `[0..n-1]`
	 * @param {number} n
	 * @returns {number[]}
	 */
	deal: function(N) 
	{ 
		var J, K, Q = new Array(N);
		for (J=0 ; J<N ; J++)
			{ K = math.randomint(J+1) ; Q[J] = Q[K] ; Q[K] = J; }
		return Q; 
	},

	/** Randomly shuffle a list. Returns a new list - the original is unmodified.
	 * @param {Array} list
	 * @returns {Array}
	 */
	shuffle: function(list) {
		var l = list.length;
		var permutation = math.deal(l);
		var list2 = new Array(l);
		for(var i=0;i<l;i++) {
			list2[i]=(list[permutation[i]]);
		}
		return list2;
	},

	/** Calculate the inverse of a shuffling
	 * @param {number[]} l
	 * @returns {number[]} l
	 * @see LissaJS.math.deal
	 */
	inverse: function(l)
	{
		arr = new Array(l.length);
		for(var i=0;i<l.length;i++)
		{
			arr[l[i]]=i;
		}
		return arr;
	},

	/* Just the numbers from 1 to `n` (inclusive) in an array!
	 * @param {number} n
	 * @returns {number[]}
	 */
	range: function(n)
	{
		var arr=new Array(n);
		for(var i=0;i<n;i++)
		{
			arr[i]=i;
		}
		return arr;
	},

	/** Round `a` to `b` decimal places. Real and imaginary parts of complex numbers are rounded independently.
	 * @param {number} n
	 * @param {number} b
	 * @returns {number}
	 * @throws {LissaJS.Error} "math.precround.complex" if b is complex
	 */
	precround: function(a,b) {
		if(b.complex)
			throw(new LissaJS.Error('math.precround.complex'));
		if(a.complex)
			return math.complex(math.precround(a.re,b),math.precround(a.im,b));
		else
		{
			var be = Math.pow(10,b);

			var fracPart = a % 1;
			var intPart = a - fracPart;

			//test to allow a bit of leeway to account for floating point errors
			//if a*10^b is less than 1e-9 away from having a five as the last digit of its whole part, round it up anyway
			var v = fracPart*be*10 % 1;
			var d = (fracPart>0 ? Math.floor : Math.ceil)(fracPart*be*10 % 10);

			// multiply fractional part by 10^b; we'll throw away the remaining fractional part (stuff < 10^b)
			fracPart *= be;

			if( (d==4 && 1-v<1e-9) || (d==-5 && v>-1e-9 && v<0)) {
				fracPart += 1;
			}

			var rounded_fracPart = Math.round(fracPart);
			// if the fractional part has rounded up to a whole number, just add sgn(fracPart) to the integer part
			if(rounded_fracPart==be || rounded_fracPart==-be) {
				return intPart+math.sign(fracPart);
			}

			// get the fractional part as a string of decimal digits
			var fracPartString = Math.round(Math.abs(fracPart))+'';
			while(fracPartString.length<b) {
				fracPartString = '0'+fracPartString;
			}
			
			// construct the rounded number as a string, then convert it to a JS float
			var out = parseFloat(intPart+'.'+fracPartString);

			// make sure a negative number remains negative
			if(intPart==0 && a<0) {
				return -out;
			} else {
				return out;
			}
		}
	},

	/** Round `a` to `b` significant figures. Real and imaginary parts of complex numbers are rounded independently.
	 * @param {number} n
	 * @param {number} b
	 * @returns {number}
	 * @throws {LissaJS.Error} "math.precround.complex" if b is complex
	 */
	siground: function(a,b) {
		if(b.complex)
			throw(new LissaJS.Error('math.siground.complex'));
		if(a.complex)
			return math.complex(math.siground(a.re,b),math.siground(a.im,b));
		else
		{
			var s = math.sign(a);
			if(a==0) { return 0; }
			if(a==Infinity || a==-Infinity) { return a; }
			b = Math.pow(10, b-Math.ceil(math.log10(s*a)));

			//test to allow a bit of leeway to account for floating point errors
			//if a*10^b is less than 1e-9 away from having a five as the last digit of its whole part, round it up anyway
			var v = a*b*10 % 1;
			var d = (a>0 ? Math.floor : Math.ceil)(a*b*10 % 10);
			if(d==4 && 1-v<1e-9) {
				return Math.round(a*b+1)/b;
			}
			else if(d==-5 && v>-1e-9 && v<0) {
				return Math.round(a*b+1)/b;
			}

			return Math.round(a*b)/b;
		}
	},

	/** Count the number of decimal places used in the string representation of a number.
	 * @param {number|string} n
	 * @returns {number}
	 */
	countDP: function(n) {
		var m = n.match(/\.(\d*)$/);
		if(!m)
			return 0;
		else
			return m[1].length;
	},
	
	/** Calculate the significant figures precision of a number.
	 * @param {number|string} n
	 * @param {number} [max] - be generous with calculating sig. figs. for whole numbers. e.g. '1000' could be written to 4 sig figs.
	 * @returns {number}
	 */
	countSigFigs: function(n,max) {
		var m;
		if(max) {
			m = n.match(/^-?(?:(\d0*)$|(?:([1-9]\d*[1-9]0*)$)|([1-9]\d*\.\d+$)|(0\.0+$)|(?:0\.0*([1-9]\d*))|(?:(\d*(?:\.\d+)?)[Ee][+\-]?\d+)$)/i);
		} else {
			m = n.match(/^-?(?:(\d)0*$|(?:([1-9]\d*[1-9])0*$)|([1-9]\d*\.\d+$)|(0\.0+$)|(?:0\.0*([1-9]\d*))|(?:(\d*(?:\.\d+)?)[Ee][+\-]?\d+)$)/i);
		}
		if(!m)
			return 0;
		var sigFigs = m[1] || m[2] || m[3] || m[4] || m[5] || m[6];
		return sigFigs.replace('.','').length;
	},

	/** Is n given to the desired precision?
	 * @param {number|string} n
	 * @param {string} precisionType - either 'dp' or 'sigfig'
	 * @param {number} precision - number of desired digits of precision
	 * @param {boolean} strictPrecision - must trailing zeroes be used to get to the desired precision (true), or is it allowed to give fewer digits in that case (false)?
	 * @returns {boolean}
	 */
	toGivenPrecision: function(n,precisionType,precision,strictPrecision) {
		if(precisionType=='none') {
			return true;
		}

		n += '';

		var precisionOK = false;

		var counters = {'dp': math.countDP, 'sigfig': math.countSigFigs};
		var counter = counters[precisionType];
		var digits = counter(n);

		if(strictPrecision)
			precisionOK = digits == precision;
		else
			precisionOK = digits <= precision;

		if(precisionType=='sigfig' && !precisionOK && digits < precision && /[1-9]\d*0+$/.test(n)) {	// in cases like 2070, which could be to either 3 or 4 sig figs
			var trailingZeroes = n.match(/0*$/)[0].length;
			if(digits + trailingZeroes >= precision) {
				precisionOK = true;
			}
		}

		return precisionOK;
	},

	/** Is a within +/- tolerance of b?
	 * @param {number} a
	 * @param {number} b
	 * @param {number} tolerance
	 * @returns {boolean}
	 */
	withinTolerance: function(a,b,tolerance) {
		if(tolerance==0) {
			return math.eq(a,b);
		} else {
			var upper = math.add(b,tolerance);
			var lower = math.sub(b,tolerance);
			return math.geq(a,lower) && math.leq(a,upper);
		}
	},

	/** Factorial, or Gamma(n+1) if n is not a positive integer.
	 * @param {number} n
	 * @returns {number}
	 */
	factorial: function(n)
	{
		if( LissaJS.util.isInt(n) && n>=0 )
		{
			if(n<=1) {
				return 1;
			}else{
				var j=1;
				for(var i=2;i<=n;i++)
				{
					j*=i;
				}
				return j;
			}
		}
		else	//gamma function extends factorial to non-ints and negative numbers
		{
			return math.gamma(math.add(n,1));
		}
	},

	/** Lanczos approximation to the gamma function 
	 *
	 * http://en.wikipedia.org/wiki/Lanczos_approximation#Simple_implementation
	 * @param {number} n
	 * @returns {number}
	 */
	gamma: function(n)
	{
		var g = 7;
		var p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
		
		var mul = math.mul, div = math.div, exp = math.exp, neg = math.negate, pow = math.pow, sqrt = math.sqrt, sin = math.sin, add = math.add, sub = math.sub, pi = Math.PI, im = math.complex(0,1);
		
		if((n.complex && n.re<0.5) || (!n.complex && n<0.5))
		{
			return div(pi,mul(sin(mul(pi,n)),math.gamma(sub(1,n))));
		}
		else
		{
			n = sub(n,1);			//n -= 1
			var x = p[0];
			for(var i=1;i<g+2;i++)
			{
				x = add(x, div(p[i],add(n,i)));	// x += p[i]/(n+i)
			}
			var t = add(n,add(g,0.5));		// t = n+g+0.5
			return mul(sqrt(2*pi),mul(pow(t,add(n,0.5)),mul(exp(neg(t)),x)));	// return sqrt(2*pi)*t^(z+0.5)*exp(-t)*x
		}
	},

	/** Base-10 logarithm
	 * @param {number} n
	 * @returns {number}
	 */
	log10: function(n)
	{
		return mul(math.log(n),Math.LOG10E);
	},

	/** Convert from degrees to radians
	 * @param {number} x
	 * @returns {number}
	 * @see LissaJS.math.degrees
	 */
	radians: function(x) {
		return mul(x,Math.PI/180);
	},

	/** Convert from radians to degrees
	 * @param {number} x
	 * @returns {number}
	 * @see LissaJS.math.radians
	 */
	degrees: function(x) {
		return mul(x,180/Math.PI);
	},

	/** Cosine
	 * @param {number} x
	 * @returns {number}
	 */
	cos: function(x) {
		if(x.complex)
		{
			return math.complex(Math.cos(x.re)*math.cosh(x.im), -Math.sin(x.re)*math.sinh(x.im));
		}
		else
			return Math.cos(x);
	},
	
	/** Sine
	 * @param {number} x
	 * @returns {number}
	 */
	sin: function(x) {
		if(x.complex)
		{
			return math.complex(Math.sin(x.re)*math.cosh(x.im), Math.cos(x.re)*math.sinh(x.im));
		}
		else
			return Math.sin(x);
	},

	/** Tangent
	 * @param {number} x
	 * @returns {number}
	 */
	tan: function(x) {
		if(x.complex)
			return div(math.sin(x),math.cos(x));
		else
			return Math.tan(x);
	},

	/** Cosecant 
	 * @param {number} x
	 * @returns {number}
	 */
	cosec: function(x) {
		return div(1,math.sin(x));
	},

	/** Secant
	 * @param {number} x
	 * @returns {number}
	 */
	sec: function(x) {
		return div(1,math.cos(x));
	},
		
	/** Cotangent
	 * @param {number} x
	 * @returns {number}
	 */
	cot: function(x) {
		return div(1,math.tan(x));
	},

	/** Inverse sine
	 * @param {number} x
	 * @returns {number}
	 */
	arcsin: function(x) {
		if(x.complex || math.abs(x)>1)
		{
			var i = math.complex(0,1), ni = math.complex(0,-1);
			var ex = add(mul(x,i),math.sqrt(sub(1,mul(x,x)))); //ix+sqrt(1-x^2)
			return mul(ni,math.log(ex));
		}
		else
			return Math.asin(x);
	},

	/** Inverse cosine
	 * @param {number} x
	 * @returns {number}
	 */
	arccos: function(x) {
		if(x.complex || math.abs(x)>1)
		{
			var i = math.complex(0,1), ni = math.complex(0,-1);
			var ex = add(x, math.sqrt( sub(mul(x,x),1) ) );	//x+sqrt(x^2-1)
			var result = mul(ni,math.log(ex));
			if(math.re(result)<0 || math.re(result)==0 && math.im(result)<0)
				result = math.negate(result);
			return result;
		}
		else
			return Math.acos(x);
	},

	/** Inverse tangent
	 * @param {number} x
	 * @returns {number}
	 */
	arctan: function(x) {
		if(x.complex)
		{
			var i = math.complex(0,1);
			var ex = div(add(i,x),sub(i,x));
			return mul(math.complex(0,0.5), math.log(ex));
		}
		else
			return Math.atan(x);
	},

	/** Hyperbolic sine
	 * @param {number} x
	 * @returns {number}
	 */
	sinh: function(x) {
		if(x.complex)
			return div(sub(math.exp(x), math.exp(math.negate(x))),2);
		else
			return (Math.exp(x)-Math.exp(-x))/2;
	},

	/** Hyperbolic cosine
	 * @param {number} x
	 * @returns {number}
	 */
	cosh: function(x) {
		if(x.complex)
			return div(add(math.exp(x), math.exp(math.negate(x))),2);
		else
			return (Math.exp(x)+Math.exp(-x))/2
	},

	/** Hyperbolic tangent
	 * @param {number} x
	 * @returns {number}
	 */
	tanh: function(x) {
		return div(math.sinh(x),math.cosh(x));
	},

	/** Hyperbolic cosecant
	 * @param {number} x
	 * @returns {number}
	 */
	cosech: function(x) {
		return div(1,math.sinh(x));
	},

	/** Hyperbolic secant
	 * @param {number} x
	 * @returns {number}
	 */
	sech: function(x) {
		return div(1,math.cosh(x));
	},

	/** Hyperbolic tangent
	 * @param {number} x
	 * @returns {number}
	 */
	coth: function(x) {
		return div(1,math.tanh(x));
	},

	/** Inverse hyperbolic sine
	 * @param {number} x
	 * @returns {number}
	 */
	arcsinh: function(x) {
		if(x.complex)
			return math.log(add(x, math.sqrt(add(mul(x,x),1))));
		else
			return Math.log(x + Math.sqrt(x*x+1));
	},

	/** Inverse hyperbolic cosine
	 * @param {number} x
	 * @returns {number}
	 */
	arccosh: function (x) {
		if(x.complex)
			return math.log(add(x, math.sqrt(sub(mul(x,x),1))));
		else
			return Math.log(x + Math.sqrt(x*x-1));
	},

	/** Inverse hyperbolic tangent
	 * @param {number} x
	 * @returns {number}
	 */
	arctanh: function (x) {
		if(x.complex)
			return div(math.log(div(add(1,x),sub(1,x))),2);
		else
			return 0.5 * Math.log((1+x)/(1-x));
	},

	/** Round up to the nearest integer. For complex numbers, real and imaginary parts are rounded independently.
	 * @param {number} x
	 * @returns {number}
	 * @see LissaJS.math.round
	 * @see LissaJS.math.floor
	 */
	ceil: function(x) {
		if(x.complex)
			return math.complex(math.ceil(x.re),math.ceil(x.im));
		else
			return Math.ceil(x);
	},

	/** Round down to the nearest integer. For complex numbers, real and imaginary parts are rounded independently.
	 * @param {number} x
	 * @returns {number}
	 * @see LissaJS.math.ceil
	 * @see LissaJS.math.round
	 */
	floor: function(x) {
		if(x.complex)
			return math.complex(math.floor(x.re),math.floor(x.im));
		else
			return Math.floor(x);
	},

	/** Round to the nearest integer; fractional part >= 0.5 rounds up. For complex numbers, real and imaginary parts are rounded independently.
	 * @param {number} x
	 * @returns {number}
	 * @see LissaJS.math.ceil
	 * @see LissaJS.math.floor
	 */
	round: function(x) {
		if(x.complex)
			return math.complex(Math.round(x.re),Math.round(x.im));
		else
			return Math.round(x);
	},

	/** Integer part of a number - chop off the fractional part. For complex numbers, real and imaginary parts are rounded independently.
	 * @param {number} x
	 * @returns {number}
	 * @see LissaJS.math.fract
	 */
	trunc: function(x) {
		if(x.complex)
			return math.complex(math.trunc(x.re),math.trunc(x.im));

		if(x>0) {
			return Math.floor(x);
		}else{
			return Math.ceil(x);
		}
	},

	/** Fractional part of a number - Take away the whole number part. For complex numbers, real and imaginary parts are rounded independently.
	 * @param {number} x
	 * @returns {number}
	 * @see LissaJS.math.trunc
	 */
	fract: function(x) {
		if(x.complex)
			return math.complex(math.fract(x.re),math.fract(x.im));

		return x-math.trunc(x);
	},

	/** Sign of a number - +1, 0, or -1. For complex numbers, gives the sign of the real and imaginary parts separately.
	 * @param {number} x
	 * @returns {number}
	 */
	sign: function(x) {
		if(x.complex)
			return math.complex(math.sign(x.re),math.sign(x.im));

		if(x==0) {
			return 0;
		}else if (x>0) {
			return 1;
		}else {
			return -1;
		}
	},

	/** Get a random real number between `min` and `max` (inclusive)
	 * @param {number} min
	 * @param {number] max
	 * @returns {number}
	 * @see LissaJS.math.random
	 * @see LissaJS.math.choose
	 */
	randomrange: function(min,max)
	{
		return Math.random()*(max-min)+min;
	},

	/** Get a random number in the specified range. 
	 *
	 * Returns a random choice from `min` to `max` at `step`-sized intervals
	 *
	 * If all the values in the range are appended to the list, eg `[min,max,step,v1,v2,v3,...]`, just pick randomly from the values.
	 * 
	 * @param {range} range - `[min,max,step]`
	 * @returns {number}
	 * @see LissaJS.math.randomrange
	 */
	random: function(range)
	{
		if(range.length>3)	//if values in range are given after [min,max,step]
		{
			return math.choose(range.slice(3));
		}
		else
		{
			if(range[2]==0)
			{
				return math.randomrange(range[0],range[1]);
			}
			else
			{
				var diff = range[1]-range[0];
				var steps = diff/range[2];
				var n = Math.floor(math.randomrange(0,steps+1));
				return range[0]+n*range[2];
			}
		}
	},

	/** Remove all the values in the list `exclude` from the list `range`
	 * @param {number[]} range
	 * @param {number[]} exclude
	 * @returns {number[]}
	 */
	except: function(range,exclude) {
		range = range.filter(function(r) {
			for(var i=0;i<exclude.length;i++) {
				if(math.eq(r,exclude[i]))
					return false;
			}
			return true;
		});
		return range;
	},

	/** Choose one item from an array, at random
	 * @param {Array} selection
	 * @returns {object}
	 * @throws {LissaJS.Error} "math.choose.empty selection" if `selection` has length 0.
	 * @see LissaJS.math.randomrange
	 */
	choose: function(selection)
	{
		if(selection.length==0)
			throw(new LissaJS.Error('math.choose.empty selection'));
		var n = Math.floor(math.randomrange(0,selection.length));
		return selection[n];
	},


	/* Product of the numbers in the range `[a..b]`, i.e. $frac{a!}{b!}$.
	 *
	 * from http://dreaminginjavascript.wordpress.com/2008/11/08/combinations-and-permutations-in-javascript/ 
	 * 
	 * (public domain)
	 * @param {number} a
	 * @param {number} b
	 * @returns {number}
	 */
	productRange: function(a,b) {
		if(a>b)
			return 1;
		var product=a,i=a;
		while (i++<b) {
			product*=i;
		}
		return product;
	},
	 
	/** `nCk` - number of ways of picking `k` unordered elements from `n`.
	 * @param {number} n
	 * @param {number} k
	 * @throws {LissaJS.Error} "math.combinations.complex" if either of `n` or `k` is complex.
	 */
	combinations: function(n,k) {
		if(n.complex || k.complex)
			throw(new LissaJS.Error('math.combinations.complex'));

		k=Math.max(k,n-k);
		return math.productRange(k+1,n)/math.productRange(1,n-k);
	},

	/** `nPk` - number of ways of picking `k` ordered elements from `n`.
	 * @param {number} n
	 * @param {number} k
	 * @throws {LissaJS.Error} "math.combinations.complex" if either of `n` or `k` is complex.
	 */
	permutations: function(n,k) {
		if(n.complex || k.complex)
			throw(new LissaJS.Error('math.permutations.complex'));

		return math.productRange(k+1,n);
	},

	/** Does `a` divide `b`? If either of `a` or `b` is not an integer, return `false`.
	 * @param {number} a
	 * @param {number} b
	 * @returns {boolean}
	 */
	divides: function(a,b) {
		if(a.complex || b.complex || !LissaJS.util.isInt(a) || !LissaJS.util.isInt(b))
			return false;

		return (b % a) == 0;
	},

	/** Greatest common factor (GCF), or greatest common divisor (GCD), of `a` and `b`.
	 * @param {number} a
	 * @param {number} b
	 * @returns {number}
	 * @throws {LissaJS.Error} "math.gcf.complex" if either of `a` or `b` is complex.
	 */
	gcd: function(a,b) {
		if(a.complex || b.complex)
			throw(new LissaJS.Error('math.gcf.complex'));

		if(Math.floor(a)!=a || Math.floor(b)!=b)
			return 1;
		a = Math.floor(Math.abs(a));
		b = Math.floor(Math.abs(b));
		
		var c=0;
		if(a<b) { c=a; a=b; b=c; }		

		if(b==0){return 1;}
		
		while(a % b != 0) {
			c=b;
			b=a % b;
			a=c;
		}
		return b;
	},

	/** Lowest common multiple (LCM) of `a` and `b`.
	 * @param {number} a
	 * @param {number} b
	 * @returns {number}
	 * @throws {LissaJS.Error} "math.gcf.complex" if either of `a` or `b` is complex.
	 */
	lcm: function(a,b) {
		if(arguments.length==0) {
			return 1;
		} else if(arguments.length==1) {
			return a;
		}
		if(a.complex || b.complex)
			throw(new LissaJS.Error('math.lcm.complex'));

		if(arguments.length>2) {
			a = Math.floor(Math.abs(a));
			for(var i=1;i<arguments.length;i++) {
				if(arguments[i].complex) {
					throw(new LissaJS.Error('math.lcm.complex'));
				}
				b = Math.floor(Math.abs(arguments[i]));
				a = a*b/math.gcf(a,b);
			}
			return a;
		}

		a = Math.floor(Math.abs(a));
		b = Math.floor(Math.abs(b));
		
		var c = math.gcf(a,b);
		return a*b/c;
	},


	/** Write the range of integers `[a..b]` as an array of the form `[min,max,step]`, for use with {@link LissaJS.math.random}. If either number is complex, only the real part is used.
	 *
	 * @param {number} a
	 * @param {number} b
	 * @returns {range}
	 * @see LissaJS.math.random
	 */
	defineRange: function(a,b)
	{
		if(a.complex)
			a=a.re;
		if(b.complex)
			b=b.re;
		return [a,b,1];
	},

	/** Change the step size of a range created with {@link LissaJS.math.defineRange}
	 * @param {range} range
	 * @param {number} step
	 * @returns {range}
	 */
	rangeSteps: function(range,step)
	{
		if(step.complex)
			step = step.re;
		return [range[0],range[1],step];
	},

	/** Get a rational approximation to a real number by the continued fractions method.
	 *
	 * If `accuracy` is given, the returned answer will be within `Math.exp(-accuracy)` of the original number
	 * 
	 * @param {number} n
	 * @param {number} [accuracy]
	 * @returns {number[]} - [numerator,denominator]
	 */
	rationalApproximation: function(n,accuracy)
	{
		if(accuracy===undefined)
			accuracy = 15;
		accuracy = Math.exp(-accuracy);

		var on = n;
		var e = Math.floor(n);
		if(e==n)
			return [n,1];
		var l = 0;
		var frac = [];
		while(Math.abs(on-e)>accuracy)
		{
			l+=1;
			var i = Math.floor(n);
			frac.push(i);
			n = 1/(n-i);
			var e = Infinity;
			for(var j=l-1;j>=0;j--)
			{
				e = frac[j]+1/e;
			}
		}
		if(l==0) {
			return [e,1];
		}
		var f = [1,0];
		for(j=l-1;j>=0;j--)
		{
			f = [frac[j]*f[0]+f[1],f[0]];
		}
		return f;
	},

	/** The first 1000 primes */
	primes: [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997,1009,1013,1019,1021,1031,1033,1039,1049,1051,1061,1063,1069,1087,1091,1093,1097,1103,1109,1117,1123,1129,1151,1153,1163,1171,1181,1187,1193,1201,1213,1217,1223,1229,1231,1237,1249,1259,1277,1279,1283,1289,1291,1297,1301,1303,1307,1319,1321,1327,1361,1367,1373,1381,1399,1409,1423,1427,1429,1433,1439,1447,1451,1453,1459,1471,1481,1483,1487,1489,1493,1499,1511,1523,1531,1543,1549,1553,1559,1567,1571,1579,1583,1597,1601,1607,1609,1613,1619,1621,1627,1637,1657,1663,1667,1669,1693,1697,1699,1709,1721,1723,1733,1741,1747,1753,1759,1777,1783,1787,1789,1801,1811,1823,1831,1847,1861,1867,1871,1873,1877,1879,1889,1901,1907,1913,1931,1933,1949,1951,1973,1979,1987,1993,1997,1999,2003,2011,2017,2027,2029,2039,2053,2063,2069,2081,2083,2087,2089,2099,2111,2113,2129,2131,2137,2141,2143,2153,2161,2179,2203,2207,2213,2221,2237,2239,2243,2251,2267,2269,2273,2281,2287,2293,2297,2309,2311,2333,2339,2341,2347,2351,2357,2371,2377,2381,2383,2389,2393,2399,2411,2417,2423,2437,2441,2447,2459,2467,2473,2477,2503,2521,2531,2539,2543,2549,2551,2557,2579,2591,2593,2609,2617,2621,2633,2647,2657,2659,2663,2671,2677,2683,2687,2689,2693,2699,2707,2711,2713,2719,2729,2731,2741,2749,2753,2767,2777,2789,2791,2797,2801,2803,2819,2833,2837,2843,2851,2857,2861,2879,2887,2897,2903,2909,2917,2927,2939,2953,2957,2963,2969,2971,2999,3001,3011,3019,3023,3037,3041,3049,3061,3067,3079,3083,3089,3109,3119,3121,3137,3163,3167,3169,3181,3187,3191,3203,3209,3217,3221,3229,3251,3253,3257,3259,3271,3299,3301,3307,3313,3319,3323,3329,3331,3343,3347,3359,3361,3371,3373,3389,3391,3407,3413,3433,3449,3457,3461,3463,3467,3469,3491,3499,3511,3517,3527,3529,3533,3539,3541,3547,3557,3559,3571,3581,3583,3593,3607,3613,3617,3623,3631,3637,3643,3659,3671,3673,3677,3691,3697,3701,3709,3719,3727,3733,3739,3761,3767,3769,3779,3793,3797,3803,3821,3823,3833,3847,3851,3853,3863,3877,3881,3889,3907,3911,3917,3919,3923,3929,3931,3943,3947,3967,3989,4001,4003,4007,4013,4019,4021,4027,4049,4051,4057,4073,4079,4091,4093,4099,4111,4127,4129,4133,4139,4153,4157,4159,4177,4201,4211,4217,4219,4229,4231,4241,4243,4253,4259,4261,4271,4273,4283,4289,4297,4327,4337,4339,4349,4357,4363,4373,4391,4397,4409,4421,4423,4441,4447,4451,4457,4463,4481,4483,4493,4507,4513,4517,4519,4523,4547,4549,4561,4567,4583,4591,4597,4603,4621,4637,4639,4643,4649,4651,4657,4663,4673,4679,4691,4703,4721,4723,4729,4733,4751,4759,4783,4787,4789,4793,4799,4801,4813,4817,4831,4861,4871,4877,4889,4903,4909,4919,4931,4933,4937,4943,4951,4957,4967,4969,4973,4987,4993,4999,5003,5009,5011,5021,5023,5039,5051,5059,5077,5081,5087,5099,5101,5107,5113,5119,5147,5153,5167,5171,5179,5189,5197,5209,5227,5231,5233,5237,5261,5273,5279,5281,5297,5303,5309,5323,5333,5347,5351,5381,5387,5393,5399,5407,5413,5417,5419,5431,5437,5441,5443,5449,5471,5477,5479,5483,5501,5503,5507,5519,5521,5527,5531,5557,5563,5569,5573,5581,5591,5623,5639,5641,5647,5651,5653,5657,5659,5669,5683,5689,5693,5701,5711,5717,5737,5741,5743,5749,5779,5783,5791,5801,5807,5813,5821,5827,5839,5843,5849,5851,5857,5861,5867,5869,5879,5881,5897,5903,5923,5927,5939,5953,5981,5987,6007,6011,6029,6037,6043,6047,6053,6067,6073,6079,6089,6091,6101,6113,6121,6131,6133,6143,6151,6163,6173,6197,6199,6203,6211,6217,6221,6229,6247,6257,6263,6269,6271,6277,6287,6299,6301,6311,6317,6323,6329,6337,6343,6353,6359,6361,6367,6373,6379,6389,6397,6421,6427,6449,6451,6469,6473,6481,6491,6521,6529,6547,6551,6553,6563,6569,6571,6577,6581,6599,6607,6619,6637,6653,6659,6661,6673,6679,6689,6691,6701,6703,6709,6719,6733,6737,6761,6763,6779,6781,6791,6793,6803,6823,6827,6829,6833,6841,6857,6863,6869,6871,6883,6899,6907,6911,6917,6947,6949,6959,6961,6967,6971,6977,6983,6991,6997,7001,7013,7019,7027,7039,7043,7057,7069,7079,7103,7109,7121,7127,7129,7151,7159,7177,7187,7193,72077211,7213,7219,7229,7237,7243,7247,7253,7283,7297,7307,7309,7321,7331,7333,7349,7351,7369,7393,7411,7417,7433,7451,7457,7459,7477,7481,7487,7489,7499,7507,7517,7523,7529,7537,7541,7547,7549,7559,7561,7573,7577,7583,7589,7591,7603,7607,7621,7639,7643,7649,7669,7673,7681,7687,7691,7699,7703,7717,7723,7727,7741,7753,7757,7759,7789,7793,7817,7823,7829,7841,7853,7867,7873,7877,7879,7883,7901,7907,7919],

	/** Factorise n. When n=2^(a1)*3^(a2)*5^(a3)*..., this returns the powers [a1,a2,a3,...]
	 * 
	 * @param {number} n
	 * @returns {number[]} - exponents of the prime factors of n
	 */
	factorise: function(n) {
		if(n<=0) {
			return [];
		}
		var factors = [];
		for(var i=0;i<math.primes.length;i++) {
			var acc = 0;
			var p = math.primes[i];
			while(n%p==0) {
				acc += 1;
				n /= p;
			}
			factors.push(acc);
			if(n==1) {
				break;
			}
		}
		return factors;
	},

	/** Sum the elements in the given list
	 *
	 * @param {list} list
	 * @returns {number}
	 */
	sum: function(list) {
		var total = 0;
		var l = list.length;

		if(l==0) {
			return 0;
		}

		for(var i=0;i<l;i++) {
			total = math.add(total,list[i]);
		}
		
		return total;
	}

};
math.gcf = math.gcd;

var add = math.add, sub = math.sub, mul = math.mul, div = math.div, eq = math.eq, neq = math.neq, negate = math.negate;

/** A list of the vector's components. 
 * @typedef vector
 *  @type {number[]}
 */

/** Vector operations.
 *
 * These operations are very lax about the dimensions of vectors - they stick zeroes in when pairs of vectors don't line up exactly
 * @namespace LissaJS.vectormath
 */
var vectormath = LissaJS.vectormath = {
	/** Negate a vector - negate each of its components
	 * @param {vector} v
	 * @returns {vector}
	 */
	negate: function(v) {
		return v.map(function(x) { return negate(x); });
	},

	/** Add two vectors
	 * @param {vector} a
	 * @param {vector} b
	 * @returns {vector}
	 */
	add: function(a,b) {
		if(b.length>a.length)
		{
			var c = b;
			b = a;
			a = c;
		}
		return a.map(function(x,i){ return add(x,b[i]||0) });
	},

	/** Subtract one vector from another
	 * @param {vector} a
	 * @param {vector} b
	 * @returns {vector}
	 */
	sub: function(a,b) {
		if(b.length>a.length)
		{
			return b.map(function(x,i){ return sub(a[i]||0,x) });
		}
		else
		{
			return a.map(function(x,i){ return sub(x,b[i]||0) });
		}
	},

	/** Multiply by a scalar
	 * @param {number} k
	 * @param {vector} v
	 * @returns {vector}
	 */
	mul: function(k,v) {
		return v.map(function(x){ return mul(k,x) });
	},

	/** Divide by a scalar
	 * @param {vector} v
	 * @param {number} k
	 * @returns {vector}
	 */
	div: function(v,k) {
		return v.map(function(x){ return div(x,k); });
	},

	/** Vector dot product - each argument can be a vector, or a matrix with one row or one column, which is converted to a vector.
	 * @param {vector|matrix} a
	 * @param {vector|matrix} b
	 * @returns {number}
	 * @throws {LissaJSError} "vectormaths.dot.matrix too big" if either of `a` or `b` is bigger than `1xN` or `Nx1`.
	 */
	dot: function(a,b) {

		//check if A is a matrix object. If it's the right shape, we can use it anyway
		if('rows' in a)
		{
			if(a.rows==1)
				a = a[0];
			else if(a.columns==1)
				a = a.map(function(x){return x[0]});
			else
				throw(new LissaJS.Error('vectormath.dot.matrix too big'));
		}
		//Same check for B
		if('rows' in b)
		{
			if(b.rows==1)
				b = b[0];
			else if(b.columns==1)
				b = b.map(function(x){return x[0]});
			else
				throw(new LissaJS.Error('vectormath.dot.matrix too big'));
		}
		if(b.length>a.length)
		{
			var c = b;
			b = a;
			a = c;
		}
		return a.reduce(function(s,x,i){ return add(s,mul(x,b[i]||0)) },0);
	},

	/** Vector cross product - each argument can be a vector, or a matrix with one row, which is converted to a vector.
	 *
	 * @param {vector|matrix} a
	 * @param {vector|matrix} b
	 * @returns {vector}
	 *
	 * @throws {LissaJSError} "vectormaths.cross.matrix too big" if either of `a` or `b` is bigger than `1xN` or `Nx1`.
	 * @throws {LissaJSError} "vectormath.cross.not 3d" if either of the vectors is not 3D.
	 */
	cross: function(a,b) {
		//check if A is a matrix object. If it's the right shape, we can use it anyway
		if('rows' in a)
		{
			if(a.rows==1)
				a = a[0];
			else if(a.columns==1)
				a = a.map(function(x){return x[0]});
			else
				throw(new LissaJS.Error('vectormath.cross.matrix too big'));
		}
		//Same check for B
		if('rows' in b)
		{
			if(b.rows==1)
				b = b[0];
			else if(b.columns==1)
				b = b.map(function(x){return x[0]});
			else
				throw(new LissaJS.Error('vectormath.cross.matrix too big'));
		}

		if(a.length!=3 || b.length!=3)
			throw(new LissaJS.Error('vectormath.cross.not 3d'));

		return [
				sub( mul(a[1],b[2]), mul(a[2],b[1]) ),
				sub( mul(a[2],b[0]), mul(a[0],b[2]) ),
				sub( mul(a[0],b[1]), mul(a[1],b[0]) )
				];
	},

	/** Length of a vector
	 * @param {vector} a
	 * @returns {number}
	 */
	abs: function(a) {
		return Math.sqrt( a.reduce(function(s,x){ return s + mul(x,x); },0) );
	},

	/** Are two vectors equal? True if each pair of corresponding components is equal.
	 * @param {vector} a
	 * @param {vector} b
	 * @returns {boolean}
	 */
	eq: function(a,b) {
		if(b.length>a.length)
		{
			var c = b;
			b = a;
			a = c;
		}
		return a.reduce(function(s,x,i){return s && eq(x,b[i]||0)},true);
	},

	/** Are two vectors unequal?
	 * @param {vector} a
	 * @param {vector} b
	 * @returns {boolean}
	 * @see {LissaJS.vectormath.eq}
	 */
	neq: function(a,b) {
		return !vectormath.eq(a,b);
	},

	/** Multiply a vector on the left by a matrix
	 * @param {matrix} m
	 * @param {vector} v
	 * @returns {vector}
	 */
	matrixmul: function(m,v) {
		return m.map(function(row){
			return row.reduce(function(s,x,i){ return add(s,mul(x,v[i]||0)); },0);
		});
	},

	/** Apply given function to each element
	 * @param {vector}
	 * @param {function}
	 * @returns {vector}
	 */
	map: function(v,fn) {
		return v.map(fn);
	},

	/** Round each element to given number of decimal places
	 * @param {vector}
	 * @param {number} - number of decimal places
	 * @returns {vector}
	 */
	precround: function(v,dp) {
		return vectormath.map(v,function(n){return math.precround(n,dp);});
	},

	/** Round each element to given number of significant figures
	 * @param {vector}
	 * @param {number} - number of decimal places
	 * @returns {vector}
	 */
	siground: function(v,sf) {
		return vectormath.map(v,function(n){return math.siground(n,sf);});
	},

	/** Transpose of a vector
	 * @param {vector} v
	 * @returns {matrix}
	 */
	transpose: function(v) {
		var matrix = v.map(function(x){ return [x]; });
		matrix.rows = 1;
		matrix.columns = v.length;
		return matrix;
	},

	/** Convert a vector to a 1-column matrix
	 * @param {vector} v
	 * @returns {matrix}
	 */
	toMatrix: function(v) {
		var m = v.map(function(n){return [n]});
		m.rows = m.length;
		m.columns = 1;
		return m;
	}
}

/** An array of rows (each of which is an array of numbers) 
 * @typedef matrix
 * @type {Array.Array.<number>}
 * @property {number} rows
 * @property {number} columns
 */

/** Matrix operations.
 *
 * These operations are very lax about the dimensions of vectors - they stick zeroes in when pairs of matrices don't line up exactly
 * @namespace LissaJS.matrixmath
 */
var matrixmath = LissaJS.matrixmath = {
	/** Negate a matrix - negate each of its elements */
	negate: function(m) {
		var matrix = [];
		for(var i=0;i<m.rows;i++) {
			matrix.push(m[i].map(function(x){ return negate(x) }));
		}
		matrix.rows = m.rows;
		matrix.columns = m.columns;
		return matrix;
	},

	/** Add two matrices.
	 *
	 * @param {matrix} a
	 * @param {matrix} b
	 * @returns {matrix}
	 */
	add: function(a,b) {
		var rows = Math.max(a.rows,b.rows);
		var columns = Math.max(a.columns,b.columns);
		var matrix = [];
		for(var i=0;i<rows;i++)
		{
			var row = [];
			matrix.push(row);
			for(var j=0;j<columns;j++)
			{
				row[j] = add(a[i][j]||0,b[i][j]||0);
			}
		}
		matrix.rows = rows;
		matrix.columns = columns;
		return matrix;
	},

	/** Subtract one matrix from another
	 *
	 * @param {matrix} a
	 * @param {matrix} b
	 * @returns {matrix}
	 */
	sub: function(a,b) {
		var rows = Math.max(a.rows,b.rows);
		var columns = Math.max(a.columns,b.columns);
		var matrix = [];
		for(var i=0;i<rows;i++)
		{
			var row = [];
			matrix.push(row);
			for(var j=0;j<columns;j++)
			{
				row[j] = sub(a[i][j]||0,b[i][j]||0);
			}
		}
		matrix.rows = rows;
		matrix.columns = columns;
		return matrix;
	},
	
	/** Matrix determinant. Only works up to 3x3 matrices.
	 * @param {matrix} m
	 * @returns {number}
	 * @throws {LissaJSError} "matrixmath.abs.too big" if the matrix has more than 3 rows.
	 */
	abs: function(m) {
		if(m.rows!=m.columns)
			throw(new LissaJS.Error('matrixmath.abs.non-square'));

		//abstraction failure!
		switch(m.rows)
		{
		case 1:
			return m[0][0];
		case 2:
			return sub( mul(m[0][0],m[1][1]), mul(m[0][1],m[1][0]) );
		case 3:
			return add( sub(
							mul(m[0][0],sub(mul(m[1][1],m[2][2]),mul(m[1][2],m[2][1]))),
							mul(m[0][1],sub(mul(m[1][0],m[2][2]),mul(m[1][2],m[2][0])))
						),
						mul(m[0][2],sub(mul(m[1][0],m[2][1]),mul(m[1][1],m[2][0])))
					);
		default:
			throw(new LissaJS.Error('matrixmath.abs.too big'));
		}
	},

	/** Multiply a matrix by a scalar
	 * @param {number} k
	 * @param {matrix} m
	 * @returns {matrix}
	 */
	scalarmul: function(k,m) {
		var out = m.map(function(row){ return row.map(function(x){ return mul(k,x); }); });
		out.rows = m.rows;
		out.columns = m.columns;
		return out;
	},

	/** Divide a matrix by a scalar
	 * @param {matrix} m
	 * @param {number} k
	 * @returns {matrix}
	 */
	scalardiv: function(m,k) {
		var out = m.map(function(row){ return row.map(function(x){ return div(x,k); }); });
		out.rows = m.rows;
		out.columns = m.columns;
		return out;
	},

	/** Multiply two matrices
	 * @param {matrix} a
	 * @param {matrix} b
	 * @returns {matrix}
	 * @throws {LissaJSError} "matrixmath.mul.different sizes" if `a` doesn't have as many columns as `b` has rows.
	 */
	mul: function(a,b) {
		if(a.columns!=b.rows)
			throw(new LissaJS.Error('matrixmath.mul.different sizes'));

		var out = [];
		out.rows = a.rows;
		out.columns = b.columns;
		for(var i=0;i<a.rows;i++)
		{
			var row = [];
			out.push(row);
			for(var j=0;j<b.columns;j++)
			{
				var s = 0;
				for(var k=0;k<a.columns;k++)
				{
					s = add(s,mul(a[i][k],b[k][j]));
				}
				row.push(s);
			}
		}
		return out;
	},

	/** Are two matrices equal? True if each pair of corresponding elements is equal.
	 * @param {matrix} a
	 * @param {matrix} b
	 * @returns {boolean}
	 */
	eq: function(a,b) {
		var rows = Math.max(a.rows,b.rows);
		var columns = Math.max(a.columns,b.columns);
		for(var i=0;i<rows;i++)
		{
			var rowA = a[i] || [];
			var rowB = b[i] || [];
			for(var j=0;j<rows;j++)
			{
				if(!eq(rowA[j]||0,rowB[j]||0))
					return false;
			}
		}
		return true;
	},

	/** Are two matrices unequal?
	 * @param {matrix} a
	 * @param {matrix} b
	 * @returns {boolean}
	 * @see {LissaJS.matrixmath.eq}
	 */
	neq: function(a,b) {
		return !matrixmath.eq(a,b);
	},

	/** Make an `NxN` identity matrix.
	 * @param {number} n
	 * @returns {matrix}
	 */
	id: function(n) {
		var out = [];
		out.rows = out.columns = n;
		for(var i=0;i<n;i++)
		{
			var row = [];
			out.push(row);
			for(var j=0;j<n;j++)
				row.push(j==i ? 1 : 0);
		}
		return out;
	},

	/** Matrix transpose
	 * @param {matrix}
	 * @returns {matrix}
	 */
	transpose: function(m) {
		var out = [];
		out.rows = m.columns;
		out.columns = m.rows;

		for(var i=0;i<m.columns;i++)
		{
			var row = [];
			out.push(row);
			for(var j=0;j<m.rows;j++)
			{
				row.push(m[j][i]||0);
			}
		}
		return out;
	},

	/** Apply given function to each element
	 * @param {matrix}
	 * @param {function}
	 * @returns {matrix}
	 */
	map: function(m,fn) {
		var out = m.map(function(row){
			return row.map(fn);
		});
		out.rows = m.rows;
		out.columns = m.columns;
		return out;
	},

	/** Round each element to given number of decimal places
	 * @param {matrix}
	 * @param {number} - number of decimal places
	 * @returns {matrix}
	 */
	precround: function(m,dp) {
		return matrixmath.map(m,function(n){return math.precround(n,dp);});
	},

	/** Round each element to given number of significant figures
	 * @param {matrix}
	 * @param {number} - number of decimal places
	 * @returns {matrix}
	 */
	siground: function(m,sf) {
		return matrixmath.map(m,function(n){return math.siground(n,sf);});
	}
}


/** Set operations.
 *
 * @namespace LissaJS.setmath
 */
var setmath = LissaJS.setmath = {
	/** Does the set contain the given element?
	 * @param {set} set
	 * @param {object} element
	 * @returns {bool}
	 */
	contains: function(set,element) {
		for(var i=0,l=set.length;i<l;i++) {
			if(LissaJS.util.eq(set[i],element)) {
				return true;
			}
		}
	},

	/** Union of two sets
	 * @param {set} a
	 * @param {set} b
	 * @returns {set}
	 */
	union: function(a,b) {
		var out = a.slice();
		for(var i=0,l=b.length;i<l;i++) {
			if(!setmath.contains(a,b[i])) {
				out.push(b[i]);
			}
		}
		return out;
	},
	
	/** Intersection of two sets
	 * @param {set} a
	 * @param {set} b
	 * @returns {set}
	 */
	intersection: function(a,b) {
		return a.filter(function(v) {
			return setmath.contains(b,v);
		});
	},

	/** Are two sets equal? Yes if a,b and (a intersect b) all have the same length
	 * @param {set} a
	 * @param {set} b
	 * @returns {bool}
	 */
	eq: function(a,b) {	
		return a.length==b.length && setmath.intersection(a,b).length==a.length;
	},

	/** Set minus - remove b's elements from a
	 * @param {set} a
	 * @param {set} b
	 * @returns {set}
	 */
	minus: function(a,b) {
		return a.filter(function(v){ return !setmath.contains(b,v); });
	},

	/** Size of a set
	 * @param {set} set
	 * @returns {number}
	 */
	size: function(set) {
		return set.length;
	}
}

});
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

/** @file Convenience functions, extensions to javascript built-ins, etc. Provides {@link LissaJS.util}. Includes es5-shim.js */

LissaJS.queueScript('util',['base','math'],function() {

/** @namespace LissaJS.util */

var util = LissaJS.util = /** @lends LissaJS.util */ {

    extend_dict: function() {
        var o = {};
        var key,i;
        for(i=0;i<arguments.length;i++) {
            for(key in arguments[i]) {
                var value = arguments[i][key];
                if(value!==undefined) {
                    o[key] = value;
                }
            }
        }
        return o;
    },

    isArray: function(it) {
        return Object.prototype.toString.call(it) === '[object Array]';
    },

	/** Derive type B from A (class inheritance, really)
	 *
	 * B's prototype supercedes A's.
	 * @param {function} a - the constructor for the parent class
	 * @param {function} b - a constructor to be called after `a`'s constructor is done.
	 * @returns {function} a constructor for the derived class
	 */
	extend: function(a,b,extendMethods)
	{ 
		var c = function() 
		{ 
			a.apply(this,arguments);
			b.apply(this,arguments);
		};

		var x;
		for(x in a.prototype)
		{
			c.prototype[x]=a.prototype[x];
		}
		for(x in b.prototype)
		{
			c.prototype[x]=b.prototype[x];
		}

		if(extendMethods)
		{
			for(x in a.prototype)
			{
				if(typeof(a.prototype[x])=='function' && b.prototype[x])
					c.prototype[x]=LissaJS.util.extend(a.prototype[x],b.prototype[x]);
			}
		}

		return c;
	},

	/** Clone an array, with array elements copied too.
	 * Array.splice() will create a copy of an array, but the elements are the same objects, which can cause fruity bugs.
	 * This function clones the array elements as well, so there should be no side-effects when operating on the cloned array.
	 * @param {Array} arr
	 * @param {boolean} deep - if true, do a deep copy of each element
	 * @see LissaJS.util.copyobj
	 * @returns {Array}
	 */
	copyarray: function(arr,deep)
	{
		arr = arr.slice();
		if(deep)
		{
			for(var i=0;i<arr.length;i++)
			{
				arr[i]=util.copyobj(arr[i],deep);
			}
		}
		return arr;
	},

	/** Clone an object.
	 * @param {object} obj
	 * @param {boolean} deep - if true, each property is cloned as well (recursively) so there should be no side-effects when operating on the cloned object.
	 * @returns {object}
	 */
	copyobj: function(obj,deep)
	{
		switch(typeof(obj))
		{
		case 'object':
			if(obj===null)
				return obj;
			if(obj.length!==undefined)
			{
				return util.copyarray(obj,deep);
			}
			else
			{
				var newobj={};
				for(var x in obj)
				{
					if(deep)
						newobj[x] = util.copyobj(obj[x],deep);
					else
						newobj[x]=obj[x];
				}
				return newobj;
			}
		default:
			return obj;
		}
	},

	/** Shallow copy an object into an already existing object
	 * (add all src's properties to dest)
	 * @param {object} src
	 * @param {object} dest
	 */
	copyinto: function(src,dest)
	{
		for(var x in src)
		{
			if(dest[x]===undefined)
				dest[x]=src[x]
		}
	},

	/** Generic equality test on {@link LissaJS.jme.token}s
	 * @param {LissaJS.jme.token} a
	 * @param {LissaJS.jme.token} b
	 * @returns {boolean}
	 */
	eq: function(a,b) {
		if(a.type != b.type)
			return false;
		if(a.type in util.equalityTests) {
			return util.equalityTests[a.type](a,b);
		} else {
			throw(new LissaJS.Error('util.equality not defined for type %s',a.type));
		}
	},

	equalityTests: {
		'number': function(a,b) {
			return LissaJS.math.eq(a.value,b.value);
		},
		'vector': function(a,b) {
			return LissaJS.vectormath.eq(a.value,b.value);
		},
		'matrix': function(a,b) {
			return LissaJS.matrixmath.eq(a.value,b.value);
		},
		'list': function(a,b) {
			return a.value.length==b.value.length && a.value.filter(function(ae,i){return !util.eq(ae,b.value[i])}).length==0;
		},
		'set': function(a,b) {
			return LissaJS.setmath.eq(a.value,b.value);
		},
		'range': function(a,b) {
			return a.value[0]==b.value[0] && a.value[1]==b.value[1] && a.value[2]==b.value[2];
		},
		'name': function(a,b) {
			return a.name == b.name;
		},
		'string': function(a,b) {
			return a.value==b.value;
		},
		'boolean': function(a,b) {
			return a.value==b.value;
		}
	},


	/** Generic inequality test on {@link LissaJS.jme.token}s
	 * @param {LissaJS.jme.token} a
	 * @param {LissaJS.jme.token} b
	 * @returns {boolean}
	 * @see LissaJS.util.eq
	 */
	neq: function(a,b) {
		return !util.eq(a,b);
	},

	/** Are two arrays equal? True if their elements are all equal
	 * @param {Array} a
	 * @param {Array} b
	 * @returns {boolean}
	 */
	arraysEqual: function(a,b) {
		if(a.length!=b.length) {
			return false;
		}
		var l = a.length;
		for(var i=0;i<l;i++) {
			if(Array.isArray(a[i])) {
				if(!Array.isArray(b[i])) {
					return false;
				} else if(!util.arraysEqual(a[i],b[i])) {
					return false;
				}
			} else {
				if(a!=b) {
					return false;
				}
			}
		}
		return true;
	},

	/** Filter out values in `exclude` from `list`
	 * @param {LissaJS.jme.types.TList} list
	 * @param {LissaJS.jme.types.TList} exclude
	 * @returns {Array}
	 */
	except: function(list,exclude) {
		return list.filter(function(l) {
			for(var i=0;i<exclude.length;i++) {
				if(util.eq(l,exclude[i]))
					return false;
			}
			return true;
		});
	},

	/** Return a copy of the input list with duplicates removed
	 * @param {array} list
	 * @returns {list}
	 * @see LissaJS.util.eq
	 */
	distinct: function(list) {
		if(list.length==0) {
			return [];
		}
		var out = [list[0]];
		for(var i=1;i<list.length;i++) {
			var got = false;
			for(var j=0;j<out.length;j++) {
				if(util.eq(list[i],out[j])) {
					got = true;
					break;
				}
			}
			if(!got) {
				out.push(list[i]);
			}
		}
		return out;
	},

	/** Is value in the list?
	 * @param {array} list
	 * @param {LissaJS.jme.token} value
	 * @returns {boolean}
	 */
	contains: function(list,value) {
		for(var i=0;i<list.length;i++) {
			if(util.eq(value,list[i])) {
				return true;
			}
		}
		return false;
	},

	/** Test if parameter is an integer
	 * @param {object} i
	 * @returns {boolean}
	 */
	isInt: function(i)
	{
		return parseInt(i,10)==i;
	},

	/** Test if parameter is a float
	 * @param {object} f
	 * @returns {boolean}
	 */
	isFloat: function(f)
	{
		return parseFloat(f)==f;
	},

	/** Is `n` a number? i.e. `!isNaN(n)`, or is `n` "infinity", or if `allowFractions` is true, is `n` a fraction?
	 * @param {number} n
	 * @param {boolean} allowFractions
	 * @returns {boolean}
	 */
	isNumber: function(n,allowFractions) {
		if(!isNaN(n)) {
			return true;
		}
		n = n.toString().trim();
		if(/-?infinity/i.test(n)) {
			return true;
		} else if(allowFractions && util.re_fraction.test(n)) {
			return true;
		} else {
			return false;
		}
	},

	/** Wrap a list index so -1 maps to length-1
	 * @param {number} n
	 * @param {number} size
	 * @returns {number}
	 */
	wrapListIndex: function(n,size) {
		if(n<0) {
			n += size;
		}
		return n;
	},

	/** Test if parameter is a boolean - that is: a boolean literal, or any of the strings 'false','true','yes','no', case-insensitive.
	 * @param {object} b
	 * @returns {boolean}
	 */
	isBool: function(b)
	{
		if(b==null) { return false; }
		if(typeof(b)=='boolean') { return true; }

		b = b.toString().toLowerCase();
		return b=='false' || b=='true' || b=='yes' || b=='no';
	},

	/** Parse parameter as a boolean. The boolean value `true` and the strings 'true' and 'yes' are parsed as the value `true`, everything else is `false`.
	 * @param {object} b
	 * @returns {boolean}
	 */
	parseBool: function(b)
	{
		if(!b)
			return false;
		b = b.toString().toLowerCase();
		return( b=='true' || b=='yes' );
	},

	/** Regular expression recognising a fraction */
	re_fraction: /^\s*(-?)\s*(\d+)\s*\/\s*(\d+)\s*/,

	/** Parse a number - either parseFloat, or parse a fraction
	 * @param {string} s
	 * @returns {number}
	 */
	parseNumber: function(s,allowFractions) {
		s = s.toString().trim();
		var m;
		if(util.isFloat(s)) {
			return parseFloat(s);
		} else if(s.toLowerCase()=='infinity') {
			return Infinity;
		} else if(s.toLowerCase()=='-infinity') {
			return -Infinity;
		} else if(allowFractions && (m = util.re_fraction.exec(s))) {
			var n = parseInt(m[2])/parseInt(m[3]);
			return m[1] ? -n : n;
		} else {
			return NaN;
		}
	},

	/** Pad string `s` on the left with a character `p` until it is `n` characters long.
	 * @param {string} s
	 * @param {number} n
	 * @param {string} p
	 * @returns {string}
	 */
	lpad: function(s,n,p)
	{
		s=s.toString();
		p=p[0];
		while(s.length<n) { s=p+s; }
		return s;
	},

	/** Replace occurences of `%s` with the extra arguments of the function
	 * @example formatString('hello %s %s','Mr.','Perfect') => 'hello Mr. Perfect'
	 * @param {string} str
	 * @param {...string} value - string to substitute
	 * @returns {string}
	 */
	formatString: function(str)
	{
		var i=0;
		for(var i=1;i<arguments.length;i++)
		{
			str=str.replace(/%s/,arguments[i]);
		}
		return str;
	},

	/** Format an amount of currency
	 * @example currency(5.3,'£','p') => £5.30
	 * @param {number} n
	 * @param {string} prefix - symbol to use in front of currency if abs(n) >= 1
	 * @param {string} suffix - symbol to use in front of currency if abs(n) <= 1
	 */
	currency: function(n,prefix,suffix) {
		if(n<0)
			return '-'+util.currency(-n,prefix,suffix);
		else if(n==0) {
			return prefix+'0';
		}

		var s = LissaJS.math.niceNumber(Math.floor(100*n));
		if(Math.abs(n)>=1) {
			if(n%1<0.005)
				return prefix+LissaJS.math.niceNumber(n);
			s = s.replace(/(..)$/,'.$1');
			return prefix+s
		} else {
			return s+suffix;
		}
	},

	/** Get rid of the % on the end of percentages and parse as float, then divide by 100
	 * @example unPercent('50%') => 0.5
	 * @example unPercent('50') => 0.5
	 * @param {string} s
	 * @returns {number}
	 */
	unPercent: function(s)
	{
		return (parseFloat(s.replace(/%/,''))/100);
	},


	/** Pluralise a word
	 * 
	 * If `n` is not unity, return `plural`, else return `singular`
	 * @param {number} n
	 * @param {string} singular - string to return if `n` is +1 or -1
	 * @param {string} plural - string to returns if `n` is not +1 or -1
	 * @returns {string}
	 */
	pluralise: function(n,singular,plural)
	{
		n = LissaJS.math.precround(n,10);
		if(n==-1 || n==1)
			return singular;
		else
			return plural;
	},

	/** Make the first letter in the string a capital
	 * @param {string} str
	 * @returns {string}
	 */
	capitalise: function(str) {
		return str.replace(/^[a-z]/,function(c){return c.toUpperCase()});
	},

	/** Split a string up according to brackets
	 *
	 * Strips out nested brackets
	 * @example splitbrackets('a{{b}}c','{','}') => ['a','b','c']
	 * @param {string} t - string to split
	 * @param {string} lb - left bracket string
	 * @param {string} rb - right bracket string
	 * @returns {string[]} - alternating strings in brackets and strings outside: odd-numbered indices are inside brackets.
	 */
	splitbrackets: function(str,lb,rb)
	{
		var length = str.length;
		var lb_length = lb.length;
		var rb_length = rb.length;

		var out = [];	// bits to return
		var end = 0;	// end of the last pair of bracket

		for(var i=0;i<length;i++) {
			// if last character wasn't an escape
			if(i==0 || str.charAt(i-1)!='\\') {
				// if cursor is at a left bracket
				if(str.slice(i,i+lb_length)==lb) {
					var j = i+lb_length;
					var depth = 1;
					var shortened = str.slice();	// this will store the contents of the brackets, with nested brackets removed
					var acc = 0;	// number of characters removed in shortened text

					// scan along until matching right bracket found
					while(j<length && depth>0) {
						if(j==0 || str.charAt(j-1)!='\\') {
							if(str.slice(j,j+lb_length)==lb) {
								// remove this bracket from shortened
								shortened = shortened.slice(0,j-acc)+shortened.slice(j+lb_length-acc);
								acc += lb_length;
								// add 1 to depth
								depth += 1;
								j += lb_length;
							} else if(str.slice(j,j+rb_length)==rb) {
								// remove this bracket from shortened
								shortened = shortened.slice(0,j-acc)+shortened.slice(j+rb_length-acc);
								acc += rb_length;
								// subtract 1 from depth
								depth -= 1;
								j += rb_length;
							} else {
								j += 1;
							}
						} else {
							j += 1;
						}
					}
					// if matching right bracket found
					if(depth==0) {
						// output plain text found before bracket
						out.push(str.slice(end,i));
						// output contents of bracket
						out.push(shortened.slice(i+lb_length,j-acc));
						// remember the position of the end of the bracket
						end = j;
						i = j-1;
					}
				}
			}
		}
		// output the remaining plain text
		out.push(str.slice(end));
		return out;
	},

	/** Because XML doesn't like having ampersands hanging about, replace them with escape codes
	 * @param {string} str - XML string
	 * @returns {string}
	 */
	escapeHTML: function(str)
	{
		return str.replace(/&/g,'&amp;');
	},

	/** Create a comparison function which sorts objects by a particular property
	 * @param {string[]|string} prop - name of the property (or list of names of properties) to sort by
	 * @returns {function}
	 */
	sortBy: function(props) {
		if(typeof props=='string') {
			props = [props];
		}
		var l = props.length;
		return function(a,b) {
			for(var i=0;i<l;i++) {
				var prop = props[i];
				if(a[prop]>b[prop])
					return 1;
				else if(a[prop]<b[prop])
					return -1;
			}
			return 0;
		}
	},

	/** Hash a string into a string of digits
	 * 
	 * From {@link http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/}
	 */
	hashCode: function(str){
		var hash = 0, i, c;
		if (str.length == 0) return hash;
		for (i = 0; i < str.length; i++) {
			c = str.charCodeAt(i);
			hash = ((hash<<5)-hash)+c;
		}
		if(hash<0)
			return '0'+(-hash);
		else
			return '1'+hash;
	},

	/** Cartesian product of one or more lists
	 * @param {array} lists - list of arrays
	 * @returns {array}
	 */
	product: function(lists) {
		var indexes = lists.map(function(){return 0});
		var zero = false;
		var lengths = lists.map(function(l){
			if(l.length==0) {
				zero = true;
			}
			return l.length
		});
		if(zero) {
			return [];
		}
		var end = lists.length-1;

		var out = [];
		while(indexes[0]!=lengths[0]) {
			out.push(indexes.map(function(i,n){return lists[n][i]}));
			var k = end;
			indexes[k] += 1;
			while(k>0 && indexes[k]==lengths[k]) {
				indexes[k] = 0;
				k -= 1;
				indexes[k] += 1;
			}
		}
		return out;
	},

	/** Zip lists together: given lists [a,b,c,...], [x,y,z,...], return [[a,x],[b,y],[c,z], ...]
	 * @param {array} lists - list of arrays
	 * @returns {array}
	 */
	zip: function(lists) {
		var out = [];
		if(lists.length==0) {
			return out;
		}
		for(var i=0;true;i++) {
			var z = [];
			for(var j=0;j<lists.length;j++) {
				if(i<lists[j].length) {
					z.push(lists[j][i]);
				} else {
					return out;
				}
			}
			out.push(z);
		}
	},

	/** All combinations of r items from given array, without replacement
	 * @param {array} list
	 * @param {number} r
	 */
	combinations: function(list,r) {
		var indexes = [];
		for(var i=0;i<r;i++) {
			indexes.push(i);
		}
		var length = list.length;
		var end = r-1;

		var out = [];
		var steps = 0;
		while(steps<1000 && indexes[0]<length+1-r) {
			steps += 1;

			out.push(indexes.map(function(i){return list[i]; }));
			indexes[end] += 1;
			if(indexes[end]==length) {
				var k = end;
				while(k>=0 && indexes[k]==length+1-r+k) {
					k -= 1;
					indexes[k] += 1;
				}
				for(k=k+1;k<r;k++) {
					indexes[k] = indexes[k-1]+1;
				}
			}
		}
		return out;
	},

	
	/** All combinations of r items from given array, with replacement
	 * @param {array} list
	 * @param {number} r
	 */
	combinations_with_replacement: function(list,r) {
		var indexes = [];
		for(var i=0;i<r;i++) {
			indexes.push(0);
		}
		var length = list.length;
		var end = r-1;

		var out = [];
		while(indexes[0]<length) {
			out.push(indexes.map(function(i){return list[i]; }));
			indexes[end] += 1;
			if(indexes[end]==length) {
				var k = end;
				while(k>=0 && indexes[k]==length) {
					k -= 1;
					indexes[k] += 1;
				}
				for(k=k+1;k<r;k++) {
					indexes[k] = indexes[k-1];
				}
			}
		}
		return out;
	},


	/** All permutations of all choices of r elements from list
	 *
	 * Inspired by the algorithm in Python's itertools library
	 * @param {array} list - elements to choose and permute
	 * @param {number} r - number of elements to choose
	 */
	permutations: function(list,r) {
		var n = list.length;
		if(r===undefined) {
			r = n;
		}
		var indices = [];
		var cycles = [];
		for(var i=0;i<n;i++) {
			indices.push(i);
		}
		for(var i=n;i>=n-r+1;i--) {
			cycles.push(i);
		}

		var out = [indices.slice(0,r).map(function(v){return list[v]})];

		while(n) {
			for(var i=r-1;i>=0;i--) {
				cycles[i] -= 1
				if(cycles[i]==0) {
					indices.push(indices.splice(i,1)[0]);
					cycles[i] = n-i
				} else {
					var j = cycles[i];
					var t = indices[i];
					indices[i] = indices[n-j];
					indices[n-j] = t;
					out.push(indices.slice(0,r).map(function(v){return list[v]}));
					break;
				}
			}
			if(i==-1) {
				return out;
			}
		}
	},

	/** Get the letter format of an ordinal
	 * e.g. the Nth element in the sequence a,b,c,...z,aa,ab,..,az,ba,...
	 * @param {number} n
	 * @returns {string}
	 */
	letterOrdinal: function(n) {
		var alphabet = 'abcdefghijklmnopqrstuvwxyz';
		var b = alphabet.length;
		if(n==0) {
			return alphabet[0];
		}
		var s = '';
		while(n>0) {
			if(s) {
				n -= 1;
			}
			var m = n%b;
			s = alphabet[m]+s;
			n = (n-m)/b;
		}
		return s;
	},

	/** Get a human-sensible name of a part, given its path
	 * @param {string} path
	 * @returns {string}
	 */
	nicePartName: function(path) {
		var re_path = /^p(\d+)(?:g(\d+)|s(\d+))?$/;
		var m = re_path.exec(path);
		var s = R('part')+' '+util.letterOrdinal(m[1]);
		if(m[2]) {
			s += ' '+R('gap')+' '+m[2];
		}
		if(m[3]) {
			s += ' '+R('step')+' '+m[3];
		}
		return s;
	}
	
};

var endDelimiters = {
    '$': /[^\\]\$/,
    '\\(': /[^\\]\\\)/,
    '$$': /[^\\]\$\$/,
    '\\[': /[^\\]\\\]/
}
var re_startMaths = /(^|[^\\])(?:\$\$|\$)|\\\(|\\\[|\\begin\{(\w+)\}/;

/** Split a string up by TeX delimiters (`$`, `\[`, `\]`)
 *
 * `bits.re_end` stores the delimiter if the returned array has unfinished maths at the end
 * @param {string} txt - string to split up
 * @param {RegExp} re_end - If tex is split across several strings (e.g. text nodes with <br> in the middle), this can be used to give the end delimiter for unfinished maths 
 * @returns {string[]} bits - stuff outside TeX, left delimiter, TeX, right delimiter, stuff outside TeX, ...
 * @example contentsplitbrackets('hello $x+y$ and \[this\] etc') => ['hello ','$','x+y','$',' and ','\[','this','\]']
 * @memberof LissaJS.util
 * @method
 */
var contentsplitbrackets = util.contentsplitbrackets = function(txt,re_end) {
    var i = 0;
    var m;
    var startDelimiter='', endDelimiter='';
	var startText = '';
    var start='', end='';
    var startChop, endChop;
    var re_end;
	var bits = [];
	
    while(txt.length) {
		if(!re_end) {
			m = re_startMaths.exec(txt);
			
			if(!m) {     // if no maths delimiters, we're done
				bits.push(txt);
				txt = '';
				break;
			}
			
			startDelimiter = m[0];
			var start = m.index;
			
			startChop = start+startDelimiter.length;
			startText = txt.slice(0,start);
			if(m[1]) {
				startText += m[1];
				startDelimiter = startDelimiter.slice(m[1].length);
			}
			txt = txt.slice(startChop);

			if(startDelimiter.match(/^\\begin/m)) {    //if this is an environment, construct a regexp to find the corresponding \end{} command.
				var environment = m[1];
				re_end = new RegExp('[^\\\\]\\\\end\\{'+environment+'\\}');    // don't ask if this copes with nested environments
			}
			else if(startDelimiter.match(/^(?:.|[\r\n])\$/m)) {
				re_end = endDelimiters[startDelimiter.slice(1)];
			} else {
				re_end = endDelimiters[startDelimiter];    // get the corresponding end delimiter for the matched start delimiter
			}
		}
        
        m = re_end.exec(txt);
        
        if(!m) {    // if no ending delimiter, the text contains no valid maths
			bits.push(startText,startDelimiter,txt);
			bits.re_end = re_end;
			txt = '';
			break;
        }
        
        endDelimiter = m[0].slice(1);
        var end = m.index+1;    // the end delimiter regexp has a "not a backslash" character at the start because JS regexps don't do negative lookbehind
        endChop = end+endDelimiter.length;
		var math = txt.slice(0,end);
		txt = txt.slice(endChop);
		i += startChop+endChop;

		bits.push(startText,startDelimiter,math,endDelimiter);
		re_end = null;
    }
	return bits;
}

//Because indexOf not supported in IE
if(!Array.indexOf)
{
	Array.prototype.indexOf = function(obj){
		for(var i=0; i<this.length; i++){
			if(this[i]==obj){
				return i;
			}
		}
		return -1;
	};
}

//nice short 'string contains' function
if(!String.prototype.contains)
{
	String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
}
if(!Array.prototype.contains)
{
	Array.prototype.contains = function(it) { return this.indexOf(it) != -1; };
}

//merge one array into another, only adding elements which aren't already present
if(!Array.prototype.merge)
{
	Array.prototype.merge = function(arr,sortfn)
	{
		if(this.length==0)
			return arr.slice();

		var out = this.concat(arr);
		if(sortfn)
			out.sort(sortfn);
		else
			out.sort();
		if(sortfn) 
		{
			for(var i=1; i<out.length;) {
				if(sortfn(out[i-1],out[i])==0)	//duplicate elements, so remove latest
					out.splice(i,1);
				else
					i++;
			}
		}
		else
		{
			for(var i=1;i<out.length;) {
				if(out[i-1]==out[i])
					out.splice(i,1);
				else
					i++;
			}
		}

		return out;
	};
}

/* Cross-Browser Split 1.0.1
(c) Steven Levithan <stevenlevithan.com>; MIT License
An ECMA-compliant, uniform cross-browser split method */

var cbSplit;

// avoid running twice, which would break `cbSplit._nativeSplit`'s reference to the native `split`
if (!cbSplit) {

cbSplit = function (str, separator, limit) {
    // if `separator` is not a regex, use the native `split`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
        return cbSplit._nativeSplit.call(str, separator, limit);
    }

    var output = [],
        lastLastIndex = 0,
        flags = (separator.ignoreCase ? "i" : "") +
                (separator.multiline  ? "m" : "") +
                (separator.sticky     ? "y" : ""),
        separator = RegExp(separator.source, flags + "g"), // make `global` and avoid `lastIndex` issues by working with a copy
        separator2, match, lastIndex, lastLength;

    str = str + ""; // type conversion
    if (!cbSplit._compliantExecNpcg) {
        separator2 = RegExp("^" + separator.source + "$(?!\\s)", flags); // doesn't need /g or /y, but they don't hurt
    }

    /* behavior for `limit`: if it's...
    - `undefined`: no limit.
    - `NaN` or zero: return an empty array.
    - a positive number: use `Math.floor(limit)`.
    - a negative number: no limit.
    - other: type-convert, then use the above rules. */
    if (limit === undefined || +limit < 0) {
        limit = Infinity;
    } else {
        limit = Math.floor(+limit);
        if (!limit) {
            return [];
        }
    }

    while (match = separator.exec(str)) {
        lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser

        if (lastIndex > lastLastIndex) {
            output.push(str.slice(lastLastIndex, match.index));

            // fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
            if (!cbSplit._compliantExecNpcg && match.length > 1) {
                match[0].replace(separator2, function () {
                    for (var i = 1; i < arguments.length - 2; i++) {
                        if (arguments[i] === undefined) {
                            match[i] = undefined;
                        }
                    }
                });
            }

            if (match.length > 1 && match.index < str.length) {
                Array.prototype.push.apply(output, match.slice(1));
            }

            lastLength = match[0].length;
            lastLastIndex = lastIndex;

            if (output.length >= limit) {
                break;
            }
        }

        if (separator.lastIndex === match.index) {
            separator.lastIndex++; // avoid an infinite loop
        }
    }

    if (lastLastIndex === str.length) {
        if (lastLength || !separator.test("")) {
            output.push("");
        }
    } else {
        output.push(str.slice(lastLastIndex));
    }

    return output.length > limit ? output.slice(0, limit) : output;
};

cbSplit._compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
cbSplit._nativeSplit = String.prototype.split;

} // end `if (!cbSplit)`

// for convenience, override the builtin split function with the cross-browser version...
if(!String.prototype.split)
{
	String.prototype.split = function (separator, limit) {
		return cbSplit(this, separator, limit);
	};
}


// es5-shim.min.js 24/09/2012
//
// -- kriskowal Kris Kowal Copyright (C) 2009-2011 MIT License
// -- tlrobinson Tom Robinson Copyright (C) 2009-2010 MIT License (Narwhal Project)
// -- dantman Daniel Friesen Copyright (C) 2010 XXX TODO License or CLA
// -- fschaefer Florian Schäfer Copyright (C) 2010 MIT License
// -- Gozala Irakli Gozalishvili Copyright (C) 2010 MIT License
// -- kitcambridge Kit Cambridge Copyright (C) 2011 MIT License
// -- kossnocorp Sasha Koss XXX TODO License or CLA
// -- bryanforbes Bryan Forbes XXX TODO License or CLA
// -- killdream Quildreen Motta Copyright (C) 2011 MIT Licence
// -- michaelficarra Michael Ficarra Copyright (C) 2011 3-clause BSD License
// -- sharkbrainguy Gerard Paapu Copyright (C) 2011 MIT License
// -- bbqsrc Brendan Molloy (C) 2011 Creative Commons Zero (public domain)
// -- iwyg XXX TODO License or CLA
// -- DomenicDenicola Domenic Denicola Copyright (C) 2011 MIT License
// -- xavierm02 Montillet Xavier Copyright (C) 2011 MIT License
// -- Raynos Jake Verbaten Copyright (C) 2011 MIT Licence
// -- samsonjs Sami Samhuri Copyright (C) 2010 MIT License
// -- rwldrn Rick Waldron Copyright (C) 2011 MIT License
// -- lexer Alexey Zakharov XXX TODO License or CLA

/*!
    Copyright (c) 2009, 280 North Inc. http://280north.com/
    MIT License. http://github.com/280north/narwhal/blob/master/README.md
*/
// Module systems magic dance
(function (definition) {
    // RequireJS
    if (typeof define == "function") {
        define(definition);
    // CommonJS and <script>
    } else {
        definition();
    }
})(function () {

/**
 * Brings an environment as close to ECMAScript 5 compliance
 * as is possible with the facilities of erstwhile engines.
 *
 * Annotated ES5: http://es5.github.com/ (specific links below)
 * ES5 Spec: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
 * Required reading: http://javascriptweblog.wordpress.com/2011/12/05/extending-javascript-natives/
 */

//
// Function
// ========
//

// ES-5 15.3.4.5
// http://es5.github.com/#x15.3.4.5

if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        if (typeof target != "function") {
            throw new TypeError("Function.prototype.bind called on incompatible " + target);
        }
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        // XXX slicedArgs will stand in for "A" if used
        var args = slice.call(arguments, 1); // for normal call
        // 4. Let F be a new native ECMAScript object.
        // 11. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 12. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 13. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 14. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        var bound = function () {

            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs, the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Construct]] internal
                //   method of target providing args as the arguments.

                var F = function(){};
                F.prototype = target.prototype;
                var self = new F;

                var result = target.apply(
                    self,
                    args.concat(slice.call(arguments))
                );
                if (Object(result) === result) {
                    return result;
                }
                return self;

            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs, the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Call]] internal method
                //   of target providing boundThis as the this value and
                //   providing args as the arguments.

                // equiv: target.call(this, ...boundArgs, ...args)
                return target.apply(
                    that,
                    args.concat(slice.call(arguments))
                );

            }

        };
        // XXX bound.length is never writable, so don't even try
        //
        // 15. If the [[Class]] internal property of Target is "Function", then
        //     a. Let L be the length property of Target minus the length of A.
        //     b. Set the length own property of F to either 0 or L, whichever is
        //       larger.
        // 16. Else set the length own property of F to 0.
        // 17. Set the attributes of the length own property of F to the values
        //   specified in 15.3.5.1.

        // TODO
        // 18. Set the [[Extensible]] internal property of F to true.

        // TODO
        // 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).
        // 20. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "caller", PropertyDescriptor {[[Get]]: thrower, [[Set]]:
        //   thrower, [[Enumerable]]: false, [[Configurable]]: false}, and
        //   false.
        // 21. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "arguments", PropertyDescriptor {[[Get]]: thrower,
        //   [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},
        //   and false.

        // TODO
        // NOTE Function objects created using Function.prototype.bind do not
        // have a prototype property or the [[Code]], [[FormalParameters]], and
        // [[Scope]] internal properties.
        // XXX can't delete prototype in pure-js.

        // 22. Return F.
        return bound;
    };
}

// Shortcut to an often accessed properties, in order to avoid multiple
// dereference that costs universally.
// _Please note: Shortcuts are defined after `Function.prototype.bind` as we
// us it in defining shortcuts.
var call = Function.prototype.call;
var prototypeOfArray = Array.prototype;
var prototypeOfObject = Object.prototype;
var slice = prototypeOfArray.slice;
// Having a toString local variable name breaks in Opera so use _toString.
var _toString = call.bind(prototypeOfObject.toString);
var owns = call.bind(prototypeOfObject.hasOwnProperty);

// If JS engine supports accessors creating shortcuts.
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if ((supportsAccessors = owns(prototypeOfObject, "__defineGetter__"))) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
}

//
// Array
// =====
//

// ES5 15.4.3.2
// http://es5.github.com/#x15.4.3.2
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
        return _toString(obj) == "[object Array]";
    };
}

// The IsCallable() check in the Array functions
// has been replaced with a strict check on the
// internal class of the object to trap cases where
// the provided function was actually a regular
// expression literal, which in V8 and
// JavaScriptCore is a typeof "function".  Only in
// V8 are regular expression literals permitted as
// reduce parameters, so it is desirable in the
// general case for the shim to match the more
// strict and common behavior of rejecting regular
// expressions.

// ES5 15.4.4.18
// http://es5.github.com/#x15.4.4.18
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(fun /*, thisp*/) {
        var self = toObject(this),
            thisp = arguments[1],
            i = -1,
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        while (++i < length) {
            if (i in self) {
                // Invoke the callback function with call, passing arguments:
                // context, property value, property key, thisArg object context
                fun.call(thisp, self[i], i, self);
            }
        }
    };
}

// ES5 15.4.4.19
// http://es5.github.com/#x15.4.4.19
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function map(fun /*, thisp*/) {
        var self = toObject(this),
            length = self.length >>> 0,
            result = Array(length),
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self)
                result[i] = fun.call(thisp, self[i], i, self);
        }
        return result;
    };
}

// ES5 15.4.4.20
// http://es5.github.com/#x15.4.4.20
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(fun /*, thisp */) {
        var self = toObject(this),
            length = self.length >>> 0,
            result = [],
            value,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                value = self[i];
                if (fun.call(thisp, value, i, self)) {
                    result.push(value);
                }
            }
        }
        return result;
    };
}

// ES5 15.4.4.16
// http://es5.github.com/#x15.4.4.16
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
        var self = toObject(this),
            length = self.length >>> 0,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !fun.call(thisp, self[i], i, self)) {
                return false;
            }
        }
        return true;
    };
}

// ES5 15.4.4.17
// http://es5.github.com/#x15.4.4.17
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
if (!Array.prototype.some) {
    Array.prototype.some = function some(fun /*, thisp */) {
        var self = toObject(this),
            length = self.length >>> 0,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, self)) {
                return true;
            }
        }
        return false;
    };
}

// ES5 15.4.4.21
// http://es5.github.com/#x15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function reduce(fun /*, initial*/) {
        var self = toObject(this),
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        // no value to return if no initial value and an empty array
        if (!length && arguments.length == 1) {
            throw new TypeError('reduce of empty array with no initial value');
        }

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= length) {
                    throw new TypeError('reduce of empty array with no initial value');
                }
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self) {
                result = fun.call(void 0, result, self[i], i, self);
            }
        }

        return result;
    };
}

// ES5 15.4.4.22
// http://es5.github.com/#x15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {
        var self = toObject(this),
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        // no value to return if no initial value, empty array
        if (!length && arguments.length == 1) {
            throw new TypeError('reduceRight of empty array with no initial value');
        }

        var result, i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0) {
                    throw new TypeError('reduceRight of empty array with no initial value');
                }
            } while (true);
        }

        do {
            if (i in this) {
                result = fun.call(void 0, result, self[i], i, self);
            }
        } while (i--);

        return result;
    };
}

// ES5 15.4.4.14
// http://es5.github.com/#x15.4.4.14
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {
        var self = toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }

        var i = 0;
        if (arguments.length > 1) {
            i = toInteger(arguments[1]);
        }

        // handle negative indices
        i = i >= 0 ? i : Math.max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === sought) {
                return i;
            }
        }
        return -1;
    };
}

// ES5 15.4.4.15
// http://es5.github.com/#x15.4.4.15
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
if (!Array.prototype.lastIndexOf) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {
        var self = toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }
        var i = length - 1;
        if (arguments.length > 1) {
            i = Math.min(i, toInteger(arguments[1]));
        }
        // handle negative indices
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && sought === self[i]) {
                return i;
            }
        }
        return -1;
    };
}

//
// Object
// ======
//

// ES5 15.2.3.2
// http://es5.github.com/#x15.2.3.2
if (!Object.getPrototypeOf) {
    // https://github.com/kriskowal/es5-shim/issues#issue/2
    // http://ejohn.org/blog/objectgetprototypeof/
    // recommended by fschaefer on github
    Object.getPrototypeOf = function getPrototypeOf(object) {
        return object.__proto__ || (
            object.constructor
                ? object.constructor.prototype
                : prototypeOfObject
        );
    };
}

// ES5 15.2.3.3
// http://es5.github.com/#x15.2.3.3
if (!Object.getOwnPropertyDescriptor) {
    var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a non-object: ";

    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
        if ((typeof object != "object" && typeof object != "function") || object === null) {
            throw new TypeError(ERR_NON_OBJECT + object);
        }
        // If object does not owns property return undefined immediately.
        if (!owns(object, property)) {
            return;
        }

        // If object has a property then it's for sure both `enumerable` and
        // `configurable`.
        var descriptor =  { enumerable: true, configurable: true };

        // If JS engine supports accessor properties then property may be a
        // getter or setter.
        if (supportsAccessors) {
            // Unfortunately `__lookupGetter__` will return a getter even
            // if object has own non getter property along with a same named
            // inherited getter. To avoid misbehavior we temporary remove
            // `__proto__` so that `__lookupGetter__` will return getter only
            // if it's owned by an object.
            var prototype = object.__proto__;
            object.__proto__ = prototypeOfObject;

            var getter = lookupGetter(object, property);
            var setter = lookupSetter(object, property);

            // Once we have getter and setter we can put values back.
            object.__proto__ = prototype;

            if (getter || setter) {
                if (getter) {
                    descriptor.get = getter;
                }
                if (setter) {
                    descriptor.set = setter;
                }
                // If it was accessor property we're done and return here
                // in order to avoid adding `value` to the descriptor.
                return descriptor;
            }
        }

        // If we got this far we know that object has an own property that is
        // not an accessor so we set it as a value and return descriptor.
        descriptor.value = object[property];
        return descriptor;
    };
}

// ES5 15.2.3.4
// http://es5.github.com/#x15.2.3.4
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
        return Object.keys(object);
    };
}

// ES5 15.2.3.5
// http://es5.github.com/#x15.2.3.5
if (!Object.create) {
    Object.create = function create(prototype, properties) {
        var object;
        if (prototype === null) {
            object = { "__proto__": null };
        } else {
            if (typeof prototype != "object") {
                throw new TypeError("typeof prototype["+(typeof prototype)+"] != 'object'");
            }
            var Type = function () {};
            Type.prototype = prototype;
            object = new Type();
            // IE has no built-in implementation of `Object.getPrototypeOf`
            // neither `__proto__`, but this manually setting `__proto__` will
            // guarantee that `Object.getPrototypeOf` will work as expected with
            // objects created using `Object.create`
            object.__proto__ = prototype;
        }
        if (properties !== void 0) {
            Object.defineProperties(object, properties);
        }
        return object;
    };
}

// ES5 15.2.3.6
// http://es5.github.com/#x15.2.3.6

// Patch for WebKit and IE8 standard mode
// Designed by hax <hax.github.com>
// related issue: https://github.com/kriskowal/es5-shim/issues#issue/5
// IE8 Reference:
//     http://msdn.microsoft.com/en-us/library/dd282900.aspx
//     http://msdn.microsoft.com/en-us/library/dd229916.aspx
// WebKit Bugs:
//     https://bugs.webkit.org/show_bug.cgi?id=36423

function doesDefinePropertyWork(object) {
    try {
        Object.defineProperty(object, "sentinel", {});
        return "sentinel" in object;
    } catch (exception) {
        // returns falsy
    }
}

// check whether defineProperty works if it's given. Otherwise,
// shim partially.
if (Object.defineProperty) {
    var definePropertyWorksOnObject = doesDefinePropertyWork({});
    var definePropertyWorksOnDom = typeof document == "undefined" ||
        doesDefinePropertyWork(document.createElement("div"));
    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
        var definePropertyFallback = Object.defineProperty;
    }
}

if (!Object.defineProperty || definePropertyFallback) {
    var ERR_NON_OBJECT_DESCRIPTOR = "Property description must be an object: ";
    var ERR_NON_OBJECT_TARGET = "Object.defineProperty called on non-object: "
    var ERR_ACCESSORS_NOT_SUPPORTED = "getters & setters can not be defined " +
                                      "on this javascript engine";

    Object.defineProperty = function defineProperty(object, property, descriptor) {
        if ((typeof object != "object" && typeof object != "function") || object === null) {
            throw new TypeError(ERR_NON_OBJECT_TARGET + object);
        }
        if ((typeof descriptor != "object" && typeof descriptor != "function") || descriptor === null) {
            throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);
        }
        // make a valiant attempt to use the real defineProperty
        // for I8's DOM elements.
        if (definePropertyFallback) {
            try {
                return definePropertyFallback.call(Object, object, property, descriptor);
            } catch (exception) {
                // try the shim if the real one doesn't work
            }
        }

        // If it's a data property.
        if (owns(descriptor, "value")) {
            // fail silently if "writable", "enumerable", or "configurable"
            // are requested but not supported
            /*
            // alternate approach:
            if ( // can't implement these features; allow false but not true
                !(owns(descriptor, "writable") ? descriptor.writable : true) ||
                !(owns(descriptor, "enumerable") ? descriptor.enumerable : true) ||
                !(owns(descriptor, "configurable") ? descriptor.configurable : true)
            )
                throw new RangeError(
                    "This implementation of Object.defineProperty does not " +
                    "support configurable, enumerable, or writable."
                );
            */

            if (supportsAccessors && (lookupGetter(object, property) ||
                                      lookupSetter(object, property)))
            {
                // As accessors are supported only on engines implementing
                // `__proto__` we can safely override `__proto__` while defining
                // a property to make sure that we don't hit an inherited
                // accessor.
                var prototype = object.__proto__;
                object.__proto__ = prototypeOfObject;
                // Deleting a property anyway since getter / setter may be
                // defined on object itself.
                delete object[property];
                object[property] = descriptor.value;
                // Setting original `__proto__` back now.
                object.__proto__ = prototype;
            } else {
                object[property] = descriptor.value;
            }
        } else {
            if (!supportsAccessors) {
                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
            }
            // If we got that far then getters and setters can be defined !!
            if (owns(descriptor, "get")) {
                defineGetter(object, property, descriptor.get);
            }
            if (owns(descriptor, "set")) {
                defineSetter(object, property, descriptor.set);
            }
        }
        return object;
    };
}

// ES5 15.2.3.7
// http://es5.github.com/#x15.2.3.7
if (!Object.defineProperties) {
    Object.defineProperties = function defineProperties(object, properties) {
        for (var property in properties) {
            if (owns(properties, property) && property != "__proto__") {
                Object.defineProperty(object, property, properties[property]);
            }
        }
        return object;
    };
}

// ES5 15.2.3.8
// http://es5.github.com/#x15.2.3.8
if (!Object.seal) {
    Object.seal = function seal(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.9
// http://es5.github.com/#x15.2.3.9
if (!Object.freeze) {
    Object.freeze = function freeze(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// detect a Rhino bug and patch it
try {
    Object.freeze(function () {});
} catch (exception) {
    Object.freeze = (function freeze(freezeObject) {
        return function freeze(object) {
            if (typeof object == "function") {
                return object;
            } else {
                return freezeObject(object);
            }
        };
    })(Object.freeze);
}

// ES5 15.2.3.10
// http://es5.github.com/#x15.2.3.10
if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.11
// http://es5.github.com/#x15.2.3.11
if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
        return false;
    };
}

// ES5 15.2.3.12
// http://es5.github.com/#x15.2.3.12
if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
        return false;
    };
}

// ES5 15.2.3.13
// http://es5.github.com/#x15.2.3.13
if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
        // 1. If Type(O) is not Object throw a TypeError exception.
        if (Object(object) !== object) {
            throw new TypeError(); // TODO message
        }
        // 2. Return the Boolean value of the [[Extensible]] internal property of O.
        var name = '';
        while (owns(object, name)) {
            name += '?';
        }
        object[name] = true;
        var returnValue = owns(object, name);
        delete object[name];
        return returnValue;
    };
}

// ES5 15.2.3.14
// http://es5.github.com/#x15.2.3.14
if (!Object.keys) {
    // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
    var hasDontEnumBug = true,
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null}) {
        hasDontEnumBug = false;
    }

    Object.keys = function keys(object) {

        if ((typeof object != "object" && typeof object != "function") || object === null) {
            throw new TypeError("Object.keys called on a non-object");
        }

        var keys = [];
        for (var name in object) {
            if (owns(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (owns(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }
        return keys;
    };

}

//
// Date
// ====
//

// ES5 15.9.5.43
// http://es5.github.com/#x15.9.5.43
// This function returns a String value represent the instance in time
// represented by this Date object. The format of the String is the Date Time
// string format defined in 15.9.1.15. All fields are present in the String.
// The time zone is always UTC, denoted by the suffix Z. If the time value of
// this object is not a finite Number a RangeError exception is thrown.
if (!Date.prototype.toISOString || 
    (new Date(-1).toISOString() !== '1969-12-31T23:59:59.999Z') ||
    (new Date(-62198755200000).toISOString().indexOf('-000001') === -1)) {
    Date.prototype.toISOString = function toISOString() {
        var result, length, value, year, month;
        if (!isFinite(this)) {
            throw new RangeError("Date.prototype.toISOString called on non-finite value.");
        }

        year = this.getUTCFullYear();

        month = this.getUTCMonth();
        // see https://github.com/kriskowal/es5-shim/issues/111
        year += Math.floor(month / 12);
        month = (month % 12 + 12) % 12;

        // the date time string format is specified in 15.9.1.15.
        result = [month + 1, this.getUTCDate(),
            this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];
        year = (year < 0 ? '-' : (year > 9999 ? '+' : '')) + ('00000' + Math.abs(year)).slice(0 <= year && year <= 9999 ? -4 : -6);

        length = result.length;
        while (length--) {
            value = result[length];
            // pad months, days, hours, minutes, and seconds to have two digits.
            if (value < 10) {
                result[length] = "0" + value;
            }
        }
        // pad milliseconds to have three digits.
        return year + "-" + result.slice(0, 2).join("-") + "T" + result.slice(2).join(":") + "." +
            ("000" + this.getUTCMilliseconds()).slice(-3) + "Z";
    }
}

// ES5 15.9.4.4
// http://es5.github.com/#x15.9.4.4
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}


// ES5 15.9.5.44
// http://es5.github.com/#x15.9.5.44
// This function provides a String representation of a Date object for use by
// JSON.stringify (15.12.3).
function isPrimitive(input) {
    var t = typeof input;
    return input === null || t === "undefined" || t === "boolean" || t === "number" || t === "string";
}

function ToPrimitive(input) {
    var val, valueOf, toString;
    if (isPrimitive(input)) {
        return input;
    }
    valueOf = input.valueOf;
    if (typeof valueOf === "function") {
        val = valueOf.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    toString = input.toString;
    if (typeof toString === "function") {
        val = toString.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    throw new TypeError();
}

var dateToJSONIsSupported = false;
try {
    dateToJSONIsSupported = Date.prototype.toJSON && new Date(NaN).toJSON() === null;
} catch (e) {}
if (!dateToJSONIsSupported) {
    Date.prototype.toJSON = function toJSON(key) {
        // When the toJSON method is called with argument key, the following
        // steps are taken:

        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be ToPrimitive(O, hint Number).
        var o = Object(this),
            tv = ToPrimitive(o),
            toISO;
        // 3. If tv is a Number and is not finite, return null.
        if (typeof tv === 'number' && !isFinite(tv)) {
            return null;
        }
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        toISO = o.toISOString;
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (typeof toISO != "function") {
            throw new TypeError('toISOString property is not callable');
        }
        // 6. Return the result of calling the [[Call]] internal method of
        //  toISO with O as the this value and an empty argument list.
        return toISO.call(o);

        // NOTE 1 The argument is ignored.

        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.
    };
}

// ES5 15.9.4.2
// http://es5.github.com/#x15.9.4.2
// based on work shared by Daniel Friesen (dantman)
// http://gist.github.com/303249
if (!Date.parse || "Date.parse is buggy") {
    // XXX global assignment won't work in embeddings that use
    // an alternate object for the context.
    Date = (function(NativeDate) {

        // Date.length === 7
        var Date = function Date(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            if (this instanceof NativeDate) {
                var date = length == 1 && String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(Date.parse(Y)) :
                    // We have to manually make calls depending on argument
                    // length here
                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :
                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :
                    length >= 5 ? new NativeDate(Y, M, D, h, m) :
                    length >= 4 ? new NativeDate(Y, M, D, h) :
                    length >= 3 ? new NativeDate(Y, M, D) :
                    length >= 2 ? new NativeDate(Y, M) :
                    length >= 1 ? new NativeDate(Y) :
                                  new NativeDate();
                // Prevent mixups with unfixed Date object
                date.constructor = Date;
                return date;
            }
            return NativeDate.apply(this, arguments);
        };

        // 15.9.1.15 Date Time String Format.
        var isoDateExpression = new RegExp("^" +
            "(\\d{4}|[\+\-]\\d{6})" + // four-digit year capture or sign + 6-digit extended year
            "(?:-(\\d{2})" + // optional month capture
            "(?:-(\\d{2})" + // optional day capture
            "(?:" + // capture hours:minutes:seconds.milliseconds
                "T(\\d{2})" + // hours capture
                ":(\\d{2})" + // minutes capture
                "(?:" + // optional :seconds.milliseconds
                    ":(\\d{2})" + // seconds capture
                    "(?:\\.(\\d{3}))?" + // milliseconds capture
                ")?" +
            "(" + // capture UTC offset component
                "Z|" + // UTC capture
                "(?:" + // offset specifier +/-hours:minutes
                    "([-+])" + // sign capture
                    "(\\d{2})" + // hours offset capture
                    ":(\\d{2})" + // minutes offset capture
                ")" +
            ")?)?)?)?" +
        "$");

        var monthes = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];

        function dayFromMonth(year, month) {
            var t = month > 1 ? 1 : 0;
            return monthes[month] + Math.floor((year - 1969 + t) / 4) - Math.floor((year - 1901 + t) / 100) + Math.floor((year - 1601 + t) / 400) + 365 * (year - 1970);
        }

        // Copy any custom methods a 3rd party library may have added
        for (var key in NativeDate) {
            Date[key] = NativeDate[key];
        }

        // Copy "native" methods explicitly; they may be non-enumerable
        Date.now = NativeDate.now;
        Date.UTC = NativeDate.UTC;
        Date.prototype = NativeDate.prototype;
        Date.prototype.constructor = Date;

        // Upgrade Date.parse to handle simplified ISO 8601 strings
        Date.parse = function parse(string) {
            var match = isoDateExpression.exec(string);
            if (match) {
                // parse months, days, hours, minutes, seconds, and milliseconds
                // provide default values if necessary
                // parse the UTC offset component
                var year = Number(match[1]),
                    month = Number(match[2] || 1) - 1,
                    day = Number(match[3] || 1) - 1,
                    hour = Number(match[4] || 0),
                    minute = Number(match[5] || 0),
                    second = Number(match[6] || 0),
                    millisecond = Number(match[7] || 0),
                    // When time zone is missed, local offset should be used (ES 5.1 bug)
                    // see https://bugs.ecmascript.org/show_bug.cgi?id=112
                    offset = !match[4] || match[8] ? 0 : Number(new Date(1970, 0)),
                    signOffset = match[9] === "-" ? 1 : -1,
                    hourOffset = Number(match[10] || 0),
                    minuteOffset = Number(match[11] || 0),
                    result;
                if (hour < (minute > 0 || second > 0 || millisecond > 0 ? 24 : 25) && 
                    minute < 60 && second < 60 && millisecond < 1000 && 
                    month > -1 && month < 12 && hourOffset < 24 && minuteOffset < 60 && // detect invalid offsets
                    day > -1 && day < dayFromMonth(year, month + 1) - dayFromMonth(year, month)) {
                    result = ((dayFromMonth(year, month) + day) * 24 + hour + hourOffset * signOffset) * 60;
                    result = ((result + minute + minuteOffset * signOffset) * 60 + second) * 1000 + millisecond + offset;
                    if (-8.64e15 <= result && result <= 8.64e15) {
                        return result;
                    }
                }
                return NaN;
            }
            return NativeDate.parse.apply(this, arguments);
        };

        return Date;
    })(Date);
}

//
// String
// ======
//

// ES5 15.5.4.20
// http://es5.github.com/#x15.5.4.20
var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
    "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
    "\u2029\uFEFF";
if (!String.prototype.trim || ws.trim()) {
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    // http://perfectionkills.com/whitespace-deviations/
    ws = "[" + ws + "]";
    var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
        trimEndRegexp = new RegExp(ws + ws + "*$");
    String.prototype.trim = function trim() {
        if (this === undefined || this === null) {
            throw new TypeError("can't convert "+this+" to object");
        }
        return String(this).replace(trimBeginRegexp, "").replace(trimEndRegexp, "");
    };
}

//
// Util
// ======
//

// ES5 9.4
// http://es5.github.com/#x9.4
// http://jsperf.com/to-integer
var toInteger = function (n) {
    n = +n;
    if (n !== n) { // isNaN
        n = 0;
    } else if (n !== 0 && n !== (1/0) && n !== -(1/0)) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    return n;
};

var prepareString = "a"[0] != "a";
    // ES5 9.9
    // http://es5.github.com/#x9.9
var toObject = function (o) {
    if (o == null) { // this matches both null and undefined
        throw new TypeError("can't convert "+o+" to object");
    }
    // If the implementation doesn't support by-index access of
    // string characters (ex. IE < 9), split the string
    if (prepareString && typeof o == "string" && o) {
        return o.split("");
    }
    return Object(o);
};
});

});
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
 * Provides {@link LissaJS.jme}
 */

LissaJS.queueScript('jme',['jme-base','jme-builtins'],function(){});

LissaJS.queueScript('jme-base',['base','math','util'],function() {

var util = LissaJS.util;
var math = LissaJS.math;

/** @typedef LissaJS.jme.tree
  * @type {object}
  * @property {tree[]} args - the token's arguments (if it's an op or function)
  * @property {LissaJS.jme.token} tok - the token at this node
  */

/** @namespace LissaJS.jme */
var jme = LissaJS.jme = /** @lends LissaJS.jme */ {

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
	 * @see LissaJS.jme.compile
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
				throw(new LissaJS.Error('jme.tokenise.invalid',oexpr));
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
	 * @returns {LissaJS.jme.tree}
	 * @see LissaJS.jme.tokenise
	 * @see LissaJS.jme.compile
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
					throw(new LissaJS.Error('jme.shunt.not enough arguments',tok.name || tok.type));

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
					throw(new LissaJS.Error('jme.shunt.no left bracket in function'));
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
					throw(new LissaJS.Error('jme.shunt.no left square bracket'));
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
					throw(new LissaJS.Error('jme.shunt.no left bracket'));
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
				throw(new LissaJS.Error('jme.shunt.no right bracket'));
			}
			else
			{
				addoutput(x);
			}
		}

		if(listmode.length>0)
			throw(new LissaJS.Error('jme.shunt.no right square bracket'));

		if(output.length>1)
			throw(new LissaJS.Error('jme.shunt.missing operator'));

		return(output[0]);
	},

	/** Substitute variables defined in `scope` into the given syntax tree (in place).
	 * @param {LissaJS.jme.tree} tree
	 * @param {LissaJS.jme.Scope} scope
	 * @param {boolean} [allowUnbound=false] - allow unbound variables to remain in the returned tree
	 * @returns {LissaJS.jme.tree}
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
						throw new LissaJS.Error('jme.substituteTree.undefined variable',name);
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
	 * @param {LissaJS.jme.Scope} scope
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
							throw(new LissaJS.Error('jme.typecheck.function maybe implicit multiplication',op,op[0],possibleOp));
						else
							throw(new LissaJS.Error('jme.typecheck.function not defined',op,op));
					}
					else
						throw(new LissaJS.Error('jme.typecheck.op not defined',op));
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
							throw(new LissaJS.Error('jme.typecheck.no right type unbound name',tree.args[i].name));
						}
					}
					throw(new LissaJS.Error('jme.typecheck.no right type definition',op));
				}
			}
		default:
			return tok;
		}
	},

	/** Compile an expression string to a syntax tree. (Runs {@link LissaJS.jme.tokenise} then {@Link LissaJS.jme.shunt})
	 * @param {JME} expr
	 * @see LissaJS.jme.tokenise
	 * @see LissaJS.jme.shunt
	 * @returns {LissaJS.jme.tree}
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
	 * @see LissaJS.jme.tokenise
	 * @see LissaJS.jme.shunt
	 * @returns {LissaJS.jme.tree[]}
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
						throw(new LissaJS.Error('jme.compile list.mismatched bracket'));
					}
					break;
				case ']':
					if(!brackets.length || brackets.pop().type!='[') {
						throw(new LissaJS.Error('jme.compile list.mismatched bracket'));
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
			throw(new LissaJS.Error('jme.compile list.missing right bracket'));
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
	 * @param {LissaJS.jme.Scope} scope
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

	/** Substitute variables into content. To substitute variables, use {@link LissaJS.jme.variables.DOMcontentsubvars}.
	 * @param {string} str
	 * @param {LissaJS.jme.Scope} scope
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
					throw(new LissaJS.Error('jme.texsubvars.no right bracket',cmd));
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
				throw(new LissaJS.Error('jme.texsubvars.missing parameter',cmd,s));
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
				throw(new LissaJS.Error('jme.texsubvars.no right brace',cmd));

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
			return ''+LissaJS.math.niceNumber(v.value)+'';
		},
		'string': function(v,display) {
			return v.value;
		},
	},

	/** Produce a string representation of the given token, for display
	 * @param {LissaJS.jme.token} v
	 * @see LissaJS.jme.typeToDisplayString
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
	 * @param {LissaJS.jme.Scope} scope
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
						v = '('+LissaJS.jme.display.treeToJME({tok:v})+')';
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

	/** Unwrap a {@link LissaJS.jme.token} into a plain JavaScript value
	 * @param {LissaJS.jme.token} v
	 * @returns {object}
	 */
	unwrapValue: function(v) {
		if(v.type=='list')
			return v.value.map(jme.unwrapValue);
		else
			return v.value;
	},
	
	/** Wrap up a plain JavaScript value (number, string, bool or array) as a {@link LissaJS.jme.token}.
	 * @param {object} v
	 * @param {string} typeHint - name of the expected type (to differentiate between, for example, matrices, vectors and lists
	 * @returns {LissaJS.jme.token}
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
	 * @param {LissaJS.jme.token} 
	 * 
	 * @returns {boolean}
	 */
	isOp: function(tok,op) {
		return tok.type=='op' && tok.name==op;
	},

	/** Is a token a TName?
	 *
	 * @param {LissaJS.jme.token} 
	 * 
	 * @returns {boolean}
	 */
	isName: function(tok,name) {
		return tok.type=='name' && tok.name==name;
	},

	/** Is a token a TFunction?
	 *
	 * @param {LissaJS.jme.token} 
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
 * @memberof LissaJS.jme
 * @param {rule[]} rules
 * @param {object} flags
 */
var Ruleset = jme.Ruleset = function(rules,flags) {
	this.rules = rules;
	this.flags = util.extend_dict({},displayFlags,flags);
}
Ruleset.prototype = /** @lends LissaJS.jme.Ruleset.prototype */ {
	/** Test whether flag is set 
	 * @memberof LissaJS.jme.Ruleset.prototype
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
		throw(new LissaJS.Error('jme.display.collectRuleset.no sets'));

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
					throw(new LissaJS.Error('jme.display.collectRuleset.set not defined',name));
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
 * @memberof LissaJS.jme
 * @constructor
 * @property {object} variables - dictionary of {@link LissaJS.jme.token} objects
 * @property {object} functions - dictionary of arrays of {@link LissaJS.jme.funcObj} objects. There can be more than one function for each name because of signature overloading.
 * @property {objects} rulesets - dictionary of {@link LissaJS.jme.Ruleset} objects
 *
 * @param {LissaJS.jme.Scope[]} scopes - List of scopes to combine into this one. Scopes appearing later in the list override ones appearing earlier, in case variable/ruleset names conflict.
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
Scope.prototype = /** @lends LissaJS.jme.Scope.prototype */ {
	/** Add a JME function to the scope.
	 * @param {jme.funcObj} fn - function to add
	 */
	addFunction: function(fn) {
		if(!(fn.name in this.functions))
			this.functions[fn.name] = [fn];
		else
			this.functions[fn.name].push(fn);
	},

	/** Evaluate an expression in this scope - equivalent to `LissaJS.jme.evaluate(expr,this)`
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


/** @typedef LissaJS.jme.token
 * @type {object}
 * @property {string} type
 * @see LissaJS.jme.types
 */

/** The data types supported by JME expressions 
 * @namespace LissaJS.jme.types
 */
var types = jme.types = {}

/** Number type.
 * @memberof LissaJS.jme.types
 * @augments LissaJS.jme.token
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
 * @memberof LissaJS.jme.types
 * @augments LissaJS.jme.token
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
 * @memberof LissaJS.jme.types
 * @augments LissaJS.jme.token
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
 * @memberof LissaJS.jme.types
 * @augments LissaJS.jme.token
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
 * @memberof LissaJS.jme.types
 * @augments LissaJS.jme.token
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
 * @memberof LissaJS.jme.types
 * @augments LissaJS.jme.token
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
 * @memberof LissaJS.jme.types
 * @augments LissaJS.jme.token
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
 * @memberof LissaJS.jme.types
 * @augments LissaJS.jme.token
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
 * @memberof LissaJS.jme.types
 * @augments LissaJS.jme.token
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
 * @memberof LissaJS.jme.types
 * @augments LissaJS.jme.token
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
 * @memberof LissaJS.jme.types
 * @augments LissaJS.jme.token
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
 * @memberof LissaJS.jme.types
 * @augments LissaJS.jme.token
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
 * @memberof LissaJS.jme
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
 * @memberof LissaJS.jme
 * @enum {string}
 */
var prefixForm = {
	'+': '+u',
	'-': '-u',
	'!': 'not'
}
/** Some names represent different operations when used as prefix. This dictionary translates them.
 * @readonly
 * @memberof LissaJS.jme
 * @enum {string}
 */
var postfixForm = {
	'!': 'fact'
}

/** Operator precedence
 * @enum {number}
 * @memberof LissaJS.jme
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
 * @memberof LissaJS.jme
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
 * @memberof LissaJS.jme
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
 * @memberof LissaJS.jme
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
 * @memberof LissaJS.jme
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
	 * @memberof LissaJS.jme.funcObj 
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
			r[varnames[j]] = new TNum(LissaJS.math.randomrange(min,max));
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
 * @memberof LissaJS.jme 
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
 * @memberof LissaJS.jme
 * @enum {function}
 * @see LissaJS.jme.substituteTree
 */
var substituteTreeOps = jme.substituteTreeOps = {};

/** Custom findvars behaviour for specific functions - for a given usage of a function, work out which variables it depends on.
 * 
 * Functions have the signature <tree with function call at top, list of bound variable names, scope>.
 *
 * tree.args is a list of the function's arguments.
 *
 * @memberof LissaJS.jme
 * @enum {function}
 * @see LissaJS.jme.findvars
 */
var findvarsOps = jme.findvarsOps = {}

/** Find all variables used in given syntax tree
 * @memberof LissaJS.jme
 * @method
 * @param {LissaJS.jme.tree} tree
 * @param {string[]} boundvars - variables to be considered as bound (don't include them)
 * @param {LissaJS.jme.Scope} scope
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
 * @memberof LissaJS.jme
 * @method
 * @param {LissaJS.jme.token} r1
 * @param {LissaJS.jme.token} r2
 * @param {function} checkingFunction - one of {@link LissaJS.jme.checkingFunctions}
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
/*
Copyright 2011-15 Newcastle University

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
 * Provides {@link LissaJS.jme}
 */

LissaJS.queueScript('jme-builtins',['jme-base'],function(){

var util = LissaJS.util;
var math = LissaJS.math;
var vectormath = LissaJS.vectormath;
var matrixmath = LissaJS.matrixmath;
var setmath = LissaJS.setmath;
var jme = LissaJS.jme;
var types = LissaJS.jme.types;

var Scope = jme.Scope;
var funcObj = jme.funcObj;

var TNum = types.TNum;
var TString = types.TString;
var TBool = types.TBool;
var THTML = types.THTML;
var TList = types.TList;
var TMatrix = types.TMatrix;
var TName = types.TName;
var TRange = types.TRange;
var TSet = types.TSet;
var TVector = types.TVector;


/** The built-in JME evaluation scope
 * @type {LissaJS.jme.Scope}
 * @memberof LissaJS.jme
 */
var builtinScope = jme.builtinScope = new Scope();

builtinScope.functions['eval'] = [{
	name: 'eval',
	intype: ['?'],
	outtype: '?',
	typecheck: function(){return true;},
	doc: {
		usage: ['eval(x+2)'],
		description: 'Dummy function used by simplification rules to evaluate an expression.'
	}
}];

var funcs = {};

function newBuiltin(name,intype,outcons,fn,options) {
    window.scope = builtinScope;
	return builtinScope.addFunction(new funcObj(name,intype,outcons,fn,options));
}

newBuiltin('+u', [TNum], TNum, function(a){return a;}, {doc: {usage: '+x', description: "Unary addition.", tags: ['plus','positive']}});	
newBuiltin('+u', [TVector], TVector, function(a){return a;}, {doc: {usage: '+x', description: "Vector unary addition.", tags: ['plus','positive']}});	
newBuiltin('+u', [TMatrix], TMatrix, function(a){return a;}, {doc: {usage: '+x', description: "Matrix unary addition.", tags: ['plus','positive']}});	
newBuiltin('-u', [TNum], TNum, math.negate, {doc: {usage: '-x', description: "Negation.", tags: ['minus','negative','negate']}});
newBuiltin('-u', [TVector], TVector, vectormath.negate, {doc: {usage: '-x', description: "Vector negation.", tags: ['minus','negative','negate']}});
newBuiltin('-u', [TMatrix], TMatrix, matrixmath.negate, {doc: {usage: '-x', description: "Matrix negation.", tags: ['minus','negative','negate']}});

newBuiltin('+', [TNum,TNum], TNum, math.add, {doc: {usage: 'x+y', description: "Add two numbers together.", tags: ['plus','add','addition']}});

newBuiltin('+', [TList,TList], TList, null, {
	evaluate: function(args,scope)
	{
		var value = args[0].value.concat(args[1].value);
		return new TList(value);
	},

	doc: {
		usage: ['list1+list2','[1,2,3]+[4,5,6]'],
		description: "Concatenate two lists.",
		tags: ['join','append','concatenation']
	}
});

newBuiltin('+',[TList,'?'],TList, null, {
	evaluate: function(args,scope)
	{
		var value = args[0].value.slice();
		value.push(args[1]);
		return new TList(value);
	},

	doc: {
		usage: ['list+3','[1,2] + 3'],
		description: "Add an item to a list",
		tags: ['push','append','insert']
	}
});

var fconc = function(a,b) { return a+b; }
newBuiltin('+', [TString,'?'], TString, fconc, {doc: {usage: '\'Hello \' + name', description: '_string_ + _anything else_ is string concatenation.', tags: ['concatenate','concatenation','add','join','strings','plus']}});
newBuiltin('+', ['?',TString], TString, fconc, {doc: {usage: 'name + \' is OK.\'', description: '_string_ + _anything else_ is string concatenation.', tags: ['concatenate','concatenation','add','join','strings','plus']}});

newBuiltin('+', [TVector,TVector], TVector, vectormath.add, {doc: {usage: 'vector(1,2) + vector(0,1)', description: 'Add two vectors.', tags: ['addition','plus']}});
newBuiltin('+', [TMatrix,TMatrix], TMatrix, matrixmath.add, {doc: {usage: 'matrix([1,0],[0,1]) + matrix([2,2],[2,2])', description: 'Add two matrices.', tags: ['addition','plus']}});
newBuiltin('-', [TNum,TNum], TNum, math.sub, {doc: {usage: ['x-y','2 - 1'], description: 'Subtract one number from another.', tags: ['minus','take away','subtraction']}});
newBuiltin('-', [TVector,TVector], TVector, vectormath.sub, {doc: {usage: 'vector(1,2) - vector(2,3)', description: 'Subtract one vector from another.', tags: ['subtraction','minus','take away']}});
newBuiltin('-', [TMatrix,TMatrix], TMatrix, matrixmath.sub, {doc: {usage: 'matrix([1,1],[2,3]) - matrix([3,3],[2,2])', description: 'Subtract one matrix from another.', tags: ['subtraction','minus','take away']}});
newBuiltin('*', [TNum,TNum], TNum, math.mul, {doc: {usage: ['3x','3*x','x*y','x*3'], description: 'Multiply two numbers.', tags: ['multiplication','compose','composition','times']}} );
newBuiltin('*', [TNum,TVector], TVector, vectormath.mul, {doc: {usage: '3*vector(1,2,3)', description: 'Multiply a vector on the left by a scalar.', tags: ['multiplication','composition','compose','times']}});
newBuiltin('*', [TVector,TNum], TVector, function(a,b){return vectormath.mul(b,a)}, {doc: {usage: 'vector(1,2,3) * 3', description: 'Multiply a vector on the right by a scalar.', tags: ['multiplication','composition','compose','times']}});
newBuiltin('*', [TMatrix,TVector], TVector, vectormath.matrixmul, {doc: {usage: 'matrix([1,0],[0,1]) * vector(1,2)', description: 'Multiply a matrix by a vector.', tags: ['multiplication','composition','compose','times']}});
newBuiltin('*', [TNum,TMatrix], TMatrix, matrixmath.scalarmul, {doc: {usage: '3*matrix([1,0],[0,1])', description: 'Multiply a matrix on the left by a scalar.', tags: ['multiplication','composition','compose','times']}} );
newBuiltin('*', [TMatrix,TNum], TMatrix, function(a,b){ return matrixmath.scalarmul(b,a); }, {doc: {usage: 'matrix([1,0],[1,2]) * 3', description: 'Multiply a matrix on the right by a scalar.', tags: ['multiplication','composition','compose','times']}} );
newBuiltin('*', [TMatrix,TMatrix], TMatrix, matrixmath.mul, {doc: {usage: 'matrix([1,0],[1,1]) * matrix([2,3],[3,4])', description: 'Multiply two matrices.', tags: ['multiplication','composition','compose','times']}});
newBuiltin('/', [TNum,TNum], TNum, math.div, {doc: {usage: ['x/y','3/2'], description: 'Divide two numbers.', tags: ['division','quotient','fraction']}} );
newBuiltin('/', [TMatrix,TNum], TMatrix, function(a,b){ return matrixmath.scalardiv(a,b); }, {doc: {usage: 'matrix([1,0],[1,2]) * 3', description: 'Multiply a matrix on the right by a scalar.', tags: ['multiplication','composition','compose','times']}} );
newBuiltin('/', [TVector,TNum], TVector, function(a,b){return vectormath.div(a,b)}, {doc: {usage: 'vector(1,2,3) * 3', description: 'Multiply a vector on the right by a scalar.', tags: ['multiplication','composition','compose','times']}});
newBuiltin('^', [TNum,TNum], TNum, math.pow, {doc: {usage: ['x^y','x^2','2^x','e^x'], description: 'Exponentiation.', tags: ['power','exponentiate','raise']}} );

newBuiltin('dot',[TVector,TVector],TNum,vectormath.dot, {doc: {usage: 'dot( vector(1,2,3), vector(2,3,4) )', description: 'Dot product of two vectors', tags: ['projection','project']}});
newBuiltin('dot',[TMatrix,TVector],TNum,vectormath.dot, {doc: {usage: 'dot( matrix([1],[2],[3]), vector(1,2,3) )', description: 'If the left operand is a matrix with one column, treat it as a vector, so we can calculate the dot product with another vector.', tags: ['projection','project']}});
newBuiltin('dot',[TVector,TMatrix],TNum,vectormath.dot, {doc: {usage: 'dot( vector(1,2,3), matrix([1],[2],[3]) )', description: 'If the right operand is a matrix with one column, treat it as a vector, so we can calculate the dot product with another vector.', tags: ['projection','project']}});
newBuiltin('dot',[TMatrix,TMatrix],TNum,vectormath.dot, {doc: {usage: 'dot( matrix([1],[2],[3]), matrix( [1],[2],[3] )', description: 'If both operands are matrices with one column, treat them as vectors, so we can calculate the dot product.', tags: ['projection','project']}});
newBuiltin('cross',[TVector,TVector],TVector,vectormath.cross, {doc: {usage: 'cross( vector(1,2,3), vector(1,2,3) )', description: 'Cross product of two vectors.'}});
newBuiltin('cross',[TMatrix,TVector],TVector,vectormath.cross, {doc: {usage: 'cross( matrix([1],[2],[3]), vector(1,2,3) )', description: 'If the left operand is a matrix with one column, treat it as a vector, so we can calculate the cross product with another vector.'}});
newBuiltin('cross',[TVector,TMatrix],TVector,vectormath.cross, {doc: {usage: 'cross( vector(1,2,3), matrix([1],[2],[3]) )', description: 'If the right operand is a matrix with one column, treat it as a vector, so we can calculate the crossproduct with another vector.'}});
newBuiltin('cross',[TMatrix,TMatrix],TVector,vectormath.cross, {doc: {usage: 'cross( matrix([1],[2],[3]), matrix([1],[2],[3]) )', description: 'If both operands are matrices with one column, treat them as vectors, so we can calculate the cross product with another vector.'}});
newBuiltin('det', [TMatrix], TNum, matrixmath.abs, {doc: {usage: 'det( matrix([1,2],[2,3]) )', description: 'Determinant of a matrix.'}});

newBuiltin('transpose',[TVector],TMatrix, vectormath.transpose, {doc: {usage: 'transpose( vector(1,2,3) )', description: 'Transpose of a vector.'}});
newBuiltin('transpose',[TMatrix],TMatrix, matrixmath.transpose, {doc: {usage: 'transpose( matrix([1,2,3],[4,5,6]) )', description: 'Transpose of a matrix.'}});

newBuiltin('id',[TNum],TMatrix, matrixmath.id, {doc: {usage: 'id(3)', description: 'Identity matrix with $n$ rows and columns.'}});

newBuiltin('..', [TNum,TNum], TRange, math.defineRange, {doc: {usage: ['a..b','1..2'], description: 'Define a range', tags: ['interval']}});
newBuiltin('#', [TRange,TNum], TRange, math.rangeSteps, {doc: {usage: ['a..b#c','0..1 # 0.1'], description: 'Set the step size for a range.'}}); 

newBuiltin('in',[TNum,TRange],TBool,function(x,r) {
	var start = r[0];
	var end = r[1];
	var step = r[2];
	if(x>end || x<start) {
		return false;
	}
	if(step===0) {
		return true;
	} else {
		var max_steps = Math.floor(end-start)/step;
		var steps = Math.floor((x-start)/step);
		return step*steps+start==x && steps <= max_steps;
	}
});

newBuiltin('list',[TRange],TList,function(range) {
	var numbers = range.slice(3).map(function(n){ return new TNum(n); });
	return numbers;
});

newBuiltin('latex',[TString],TString,null,{
	evaluate: function(args,scope) {
		args[0].latex = true;
		return args[0];
	},
	doc: {
		usage: ['latex("something")'],
		description: 'Output a string as raw LaTeX. Normally, strings are wrapped in a \\textrm command.'
	}
});

newBuiltin('capitalise',[TString],TString,function(s) { return util.capitalise(s); }, {doc: {usage: ['capitalise(\'hello there\')'], description: 'Capitalise the first letter of a string', tags: ['upper-case','case','upper']}});
newBuiltin('upper',[TString],TString,function(s) { return s.toUpperCase(); }, {doc: {usage: ['upper(\'hello there\')'], description: 'Change all the letters in a string to capitals.', tags: ['upper-case','case','upper','capitalise','majuscule']}});
newBuiltin('lower',[TString],TString,function(s) { return s.toLowerCase(); }, {doc: {usage: ['lower(\'HELLO, you!\')'], description: 'Change all the letters in a string to minuscules.', tags: ['lower-case','lower','case']}});
newBuiltin('pluralise',[TNum,TString,TString],TString,function(n,singular,plural) { return util.pluralise(n,singular,plural); });
newBuiltin('join',[TList,TString],TString,function(list,delimiter) { 
	return list.map(jme.tokenToDisplayString).join(delimiter);
});

//the next three versions of the `except` operator
//exclude numbers from a range, given either as a range, a list or a single value
newBuiltin('except', [TRange,TRange], TList,
	function(range,except) {
		if(range[2]==0)
			throw(new LissaJS.Error("jme.func.except.continuous range"));
		range = range.slice(3);
		if(except[2]==0)
		{
			return range.filter(function(i){return i<except[0] || i>except[1]}).map(function(i){return new TNum(i)});
		}
		else
		{
			except = except.slice(3);
			return math.except(range,except).map(function(i){return new TNum(i)});
		}
	},

	{doc: {
		usage: '-9..9 except -1..1',
		description: 'Exclude a range of numbers from a larger range.',
		tags: ['except', 'exclude', 'filter', 'remove', 'numbers']
	}}
);

newBuiltin('except', [TRange,TList], TList,
	function(range,except) {
		if(range[2]==0)
			throw(new LissaJS.Error("jme.func.except.continuous range"));
		range = range.slice(3);
		except = except.map(function(i){ return i.value; });
		return math.except(range,except).map(function(i){return new TNum(i)});
	},

	{doc: {
		usage: '-9..9 except [-1,1]',
		description: 'Exclude a list of numbers from a range.',
		tags: ['except', 'exclude', 'filter', 'remove', 'numbers']
	}}
);

newBuiltin('except', [TRange,TNum], TList,
	function(range,except) {
		if(range[2]==0)
			throw(new LissaJS.Error("jme.func.except.continuous range"));
		range = range.slice(3);
		return math.except(range,[except]).map(function(i){return new TNum(i)});
	},

	{doc: {
		usage: '-9..9 except 0',
		description: 'Exclude a number from a range.',
		tags: ['except', 'exclude', 'filter', 'remove', 'numbers']
	}}
);

//exclude numbers from a list, so use the math.except function
newBuiltin('except', [TList,TRange], TList,
	function(range,except) {
		range = range.map(function(i){ return i.value; });
		except = except.slice(3);
		return math.except(range,except).map(function(i){return new TNum(i)});
	},

	{doc: {
		usage: '[1,4,9,16,25,36] except 10..30',
		description: 'Exclude a range of numbers from a list.',
		tags: ['except', 'exclude', 'filter', 'remove', 'numbers']
	}}
);

//exclude values of any type from a list containing values of any type, so use the util.except function
newBuiltin('except', [TList,TList], TList,
	function(list,except) {
		return util.except(list,except);
	},

	{doc: {
		usage: ["['a','b','c'] except ['b','d']",'[vector(0,1),vector(1,0),vector(1,1)] except [vector(1,1),vector(2,2)]'],
		description: 'Remove elements of the second list from the first.',
		tags: ['except', 'exclude', 'filter', 'remove']
	}}
);

newBuiltin('except',[TList,'?'], TList, null, {
	evaluate: function(args,scope) {
		return new TList(util.except(args[0].value,[args[1]]));
	},

  	doc: {
		usage: '[a,b,c,d] except b',
		description: 'Exclude a value from a list.',
		tags: ['except', 'exclude', 'filter', 'remove']
	}
});

newBuiltin('distinct',[TList],TList, util.distinct,{unwrapValues: false});

newBuiltin('in',['?',TList],TBool,null,{
	evaluate: function(args,scope) {
		return new TBool(util.contains(args[1].value,args[0]));
	}
});

newBuiltin('<', [TNum,TNum], TBool, math.lt, {doc: {usage: ['x<y','1<2'], description: 'Returns @true@ if the left operand is less than the right operand.', tags: ['comparison','inequality','numbers']}});
newBuiltin('>', [TNum,TNum], TBool, math.gt, {doc: {usage: ['x>y','2>1'], description: 'Returns @true@ if the left operand is greater than the right operand.', tags: ['comparison','inequality','numbers']}} );
newBuiltin('<=', [TNum,TNum], TBool, math.leq, {doc: {usage: ['x <= y','1<=1'], description: 'Returns @true@ if the left operand is less than or equal to the right operand.', tags: ['comparison','inequality','numbers']}} );
newBuiltin('>=', [TNum,TNum], TBool, math.geq, {doc: {usage: 'x >= y', description: 'Returns @true@ if the left operand is greater than or equal to the right operand.', tags: ['comparison','inequality','numbers']}} );
newBuiltin('<>', ['?','?'], TBool, null, {
	evaluate: function(args,scope) {
		return new TBool(util.neq(args[0],args[1]));
	},
	doc: {
		usage: ['\'this string\' <> \'that string\'', 'a <> b', '1<>2','sin(90)<>1'], 
		description: 'Inequality test.', 
		tags: ['comparison','not equal']
	}
});
newBuiltin('=', ['?','?'], TBool, null, {
	evaluate: function(args,scope) {
		return new TBool(util.eq(args[0],args[1]));
	},
	doc: {
		usage: ['x=y','vector(1,2)=vector(1,2,0)','0.1=0.2'], 
		description: 'Equality test.', 
		tags: ['comparison','same','identical']
	}
});

newBuiltin('and', [TBool,TBool], TBool, function(a,b){return a&&b;}, {doc: {usage: ['true && true','true and true'], description: 'Logical AND.'}} );
newBuiltin('not', [TBool], TBool, function(a){return !a;}, {doc: {usage: ['not x','!x'], description: 'Logical NOT.'}} );	
newBuiltin('or', [TBool,TBool], TBool, function(a,b){return a||b;}, {doc: {usage: ['x || y','x or y'], description: 'Logical OR.'}} );
newBuiltin('xor', [TBool,TBool], TBool, function(a,b){return (a || b) && !(a && b);}, {doc: {usage: 'a xor b', description: 'Logical XOR.', tags: ['exclusive or']}} );
newBuiltin('implies', [TBool,TBool], TBool, function(a,b){return !a || b;}, {doc: {usage: 'a xor b', description: 'Logical XOR.', tags: ['exclusive or']}} );

newBuiltin('abs', [TNum], TNum, math.abs, {doc: {usage: 'abs(x)', description: 'Absolute value of a number.', tags: ['norm','length','complex']}} );
newBuiltin('abs', [TString], TNum, function(s){return s.length}, {doc: {usage: 'abs(x)', description: 'Absolute value of a number.', tags: ['norm','length','complex']}} );
newBuiltin('abs', [TList], TNum, function(l) { return l.length; }, {doc: {usage: 'abs([1,2,3])', description: 'Length of a list.', tags: ['size','number','elements']}});
newBuiltin('abs', [TRange], TNum, function(r) { return r[2]==0 ? Math.abs(r[0]-r[1]) : r.length-3; }, {doc: {usage: 'abs(1..5)', description: 'Number of elements in a numerical range.', tags: ['size','length']}});
newBuiltin('abs', [TVector], TNum, vectormath.abs, {doc: {usage: 'abs(vector(1,2,3))', description: 'Modulus of a vector.', tags: ['size','length','norm']}});
newBuiltin('arg', [TNum], TNum, math.arg, {doc: {usage: 'arg(1+i)', description: 'Argument of a complex number.', tags: ['angle','direction']}} );
newBuiltin('re', [TNum], TNum, math.re, {doc: {usage: 're(1 + 2i)', description: 'Real part of a complex number.'}} );
newBuiltin('im', [TNum], TNum, math.im, {doc: {usage: 'im(1 + 2i)', description: 'Imaginary part of a complex number.'}} );
newBuiltin('conj', [TNum], TNum, math.conjugate, {doc: {usage: 'conj(1 + 2i)', description: 'Conjugate of a complex number.'}} );

newBuiltin('isint',[TNum],TBool, function(a){ return util.isInt(a); }, {doc: {usage: 'isint(1)', description: 'Returns @true@ if the argument is an integer.', tags: ['test','whole number']}});

newBuiltin('sqrt', [TNum], TNum, math.sqrt, {doc: {usage: 'sqrt(x)', description: 'Square root.'}} );
newBuiltin('ln', [TNum], TNum, math.log, {doc: {usage: 'ln(x)', description: 'Natural logarithm.', tags: ['base e']}} );
newBuiltin('log', [TNum], TNum, math.log10, {doc: {usage: 'log(x)', description: 'Logarithm with base $10$.'}} );
newBuiltin('exp', [TNum], TNum, math.exp, {doc: {usage: 'exp(x)', description: 'Exponentiation. Equivalent to @e^x@. ', tags: ['exponential']}} );
newBuiltin('fact', [TNum], TNum, math.factorial, {doc: {usage: ['fact(x)','x!'], description: 'Factorial.', tags: ['!']}} );
newBuiltin('gamma', [TNum], TNum, math.gamma, {doc: {usage: ['fact(x)','x!'], description: 'Factorial.', tags: ['!']}} );
newBuiltin('sin', [TNum], TNum, math.sin, {doc: {usage: 'sin(x)', description: 'Sine.', tags: ['trigonometric','trigonometry']}} );
newBuiltin('cos', [TNum], TNum, math.cos, {doc: {usage: 'cos(x)', description: 'Cosine.', tags: ['trigonometric','trigonometry']}} );
newBuiltin('tan', [TNum], TNum, math.tan, {doc: {usage: 'tan(x)', description: 'Tangent.', tags: ['trigonometric','trigonometry']}} );
newBuiltin('cosec', [TNum], TNum, math.cosec, {doc: {usage: 'cosec(x)', description: 'Cosecant.', tags: ['trigonometric','trigonometry']}} );
newBuiltin('sec', [TNum], TNum, math.sec, {doc: {usage: 'sec(x)', description: 'Secant.', tags: ['trigonometric','trigonometry']}} );
newBuiltin('cot', [TNum], TNum, math.cot, {doc: {usage: 'cot(x)', description: 'Cotangent.', tags: ['trigonometric','trigonometry']}} );
newBuiltin('arcsin', [TNum], TNum, math.arcsin, {doc: {usage: 'arcsin(x)', description: 'Inverse sine.', tags: ['arcsine']}} );
newBuiltin('arccos', [TNum], TNum, math.arccos, {doc: {usage: 'arccos(x)', description: 'Inverse cosine.', tags: ['arccosine']}} );
newBuiltin('arctan', [TNum], TNum, math.arctan, {doc: {usage: 'arctan(x)', description: 'Inverse tangent.', tags: ['arctangent']}} );
newBuiltin('sinh', [TNum], TNum, math.sinh, {doc: {usage: 'sinh(x)', description: 'Hyperbolic sine.'}} );
newBuiltin('cosh', [TNum], TNum, math.cosh, {doc: {usage: 'cosh(x)', description: 'Hyperbolic cosine.'}} );
newBuiltin('tanh', [TNum], TNum, math.tanh, {doc: {usage: 'tanh(x)', description: 'Hyperbolic tangent.'}} );
newBuiltin('cosech', [TNum], TNum, math.cosech, {doc: {usage: 'cosech(x)', description: 'Hyperbolic cosecant.'}} );
newBuiltin('sech', [TNum], TNum, math.sech, {doc: {usage: 'sech(x)', description: 'Hyperbolic secant.'}} );
newBuiltin('coth', [TNum], TNum, math.coth, {doc: {usage: 'coth(x)', description: 'Hyperbolic cotangent.'}} );
newBuiltin('arcsinh', [TNum], TNum, math.arcsinh, {doc: {usage: 'arcsinh(x)', description: 'Inverse hyperbolic sine.'}} );
newBuiltin('arccosh', [TNum], TNum, math.arccosh, {doc: {usage: 'arccosh(x)', description: 'Inverse hyperbolic cosine.'}} );
newBuiltin('arctanh', [TNum], TNum, math.arctanh, {doc: {usage: 'arctanh(x)', description: 'Inverse hyperbolic tangent.'}} );
newBuiltin('ceil', [TNum], TNum, math.ceil, {doc: {usage: 'ceil(x)', description: 'Round up to nearest integer.', tags: ['ceiling']}} );
newBuiltin('floor', [TNum], TNum, math.floor, {doc: {usage: 'floor(x)', description: 'Round down to nearest integer.'}} );
newBuiltin('trunc', [TNum], TNum, math.trunc, {doc: {usage: 'trunc(x)', description: 'If the argument is positive, round down to the nearest integer; if it is negative, round up to the nearest integer.', tags: ['truncate','integer part']}} );
newBuiltin('fract', [TNum], TNum, math.fract, {doc: {usage: 'fract(x)', description: 'Fractional part of a number. Equivalent to @x-trunc(x)@.'}} );
newBuiltin('degrees', [TNum], TNum, math.degrees, {doc: {usage: 'degrees(pi/2)', description: 'Convert radians to degrees.'}} );
newBuiltin('radians', [TNum], TNum, math.radians, {doc: {usage: 'radians(90)', description: 'Convert degrees to radians.'}} );
newBuiltin('round', [TNum], TNum, math.round, {doc: {usage: 'round(x)', description: 'Round to nearest integer.', tags: ['whole number']}} );
newBuiltin('sign', [TNum], TNum, math.sign, {doc: {usage: 'sign(x)', description: 'Sign of a number. Equivalent to $\\frac{x}{|x|}$, or $0$ when $x=0$.', tags: ['positive','negative']}} );

newBuiltin('factorise',[TNum],TList,function(n) {
		return math.factorise(n).map(function(n){return new TNum(n)});
	}
);

newBuiltin('random', [TRange], TNum, math.random, {doc: {usage: 'random(1..4)', description: 'A random number in the given range.', tags: ['choose','pick']}} );

newBuiltin('random',[TList],'?',null, {
	evaluate: function(args,scope) 
	{
		return math.choose(args[0].value);
	},

	doc: {
		usage: 'random([1,1,2,3,5])',
		description: 'Choose a random item from a list.',
		tags: ['pick','select']
	}
});

newBuiltin( 'random',[],'?', null, {
	typecheck: function() { return true; },
	evaluate: function(args,scope) { return math.choose(args);},
	doc: {
		usage: 'random(1,2,3,4,5)',
		description: 'Choose at random from the given arguments.',
		tags: ['pick','select']
	}
});

newBuiltin('mod', [TNum,TNum], TNum, math.mod, {doc: {usage: 'mod(a,b)', description: 'Modulus, i.e. $a \\bmod{b}.$', tags: ['remainder','modulo']}} );
newBuiltin('max', [TNum,TNum], TNum, math.max, {doc: {usage: 'max(x,y)', description: 'Maximum of two numbers.', tags: ['supremum','biggest','largest','greatest']}} );
newBuiltin('min', [TNum,TNum], TNum, math.min, {doc: {usage: 'min(x,y)', description: 'Minimum of two numbers.', tags: ['smallest','least']}} );
newBuiltin('max', [TList], TNum, math.listmax, {unwrapValues: true});
newBuiltin('min', [TList], TNum, math.listmin, {unwrapValues: true});
newBuiltin('precround', [TNum,TNum], TNum, math.precround, {doc: {usage: 'precround(x,3)', description: 'Round to given number of decimal places.', tags: ['dp']}} );
newBuiltin('precround', [TMatrix,TNum], TMatrix, matrixmath.precround, {doc: {usage: 'precround(x,3)', description: 'Round to given number of decimal places.', tags: ['dp']}} );
newBuiltin('precround', [TVector,TNum], TVector, vectormath.precround, {doc: {usage: 'precround(x,3)', description: 'Round to given number of decimal places.', tags: ['dp']}} );
newBuiltin('siground', [TNum,TNum], TNum, math.siground, {doc: {usage: 'siground(x,3)', description: 'Round to given number of significant figures.', tags: ['sig figs','sigfig']}} );
newBuiltin('siground', [TMatrix,TNum], TMatrix, matrixmath.siground, {doc: {usage: 'precround(x,3)', description: 'Round to given number of decimal places.', tags: ['dp']}} );
newBuiltin('siground', [TVector,TNum], TVector, vectormath.siground, {doc: {usage: 'precround(x,3)', description: 'Round to given number of decimal places.', tags: ['dp']}} );
newBuiltin('dpformat', [TNum,TNum], TString, function(n,p) {return math.niceNumber(n,{precisionType: 'dp', precision:p});}, {latex: true, doc: {usage: 'dpformat(x,3)', description: 'Round to given number of decimal points and pad with zeroes if necessary.', tags: ['dp','decimal points','format','display','precision']}} );
newBuiltin('sigformat', [TNum,TNum], TString, function(n,p) {return math.niceNumber(n,{precisionType: 'sigfig', precision:p});}, {latex: true, doc: {usage: 'dpformat(x,3)', description: 'Round to given number of significant figures and pad with zeroes if necessary.', tags: ['sig figs','sigfig','format','display','precision']}} );
newBuiltin('perm', [TNum,TNum], TNum, math.permutations, {doc: {usage: 'perm(6,3)', description: 'Count permutations. $^n \\kern-2pt P_r$.', tags: ['combinatorics']}} );
newBuiltin('comb', [TNum,TNum], TNum, math.combinations , {doc: {usage: 'comb(6,3)', description: 'Count combinations. $^n \\kern-2pt C_r$.', tags: ['combinatorics']}});
newBuiltin('root', [TNum,TNum], TNum, math.root, {doc: {usage: ['root(8,3)','root(x,n)'], description: '$n$<sup>th</sup> root.', tags: ['cube']}} );
newBuiltin('award', [TNum,TBool], TNum, function(a,b){return (b?a:0);}, {doc: {usage: ['award(a,b)','award(5,x=y)'], description: 'If @b@ is @true@, returns @a@, otherwise returns @0@.', tags: ['mark']}} );
newBuiltin('gcd', [TNum,TNum], TNum, math.gcf, {doc: {usage: 'gcd(a,b)', description: 'Greatest common denominator of two integers.', tags: ['highest']}} );
newBuiltin('gcd_without_pi_or_i', [TNum,TNum], TNum, function(a,b) {	// take out factors of pi or i before working out gcd. Used by the fraction simplification rules
		if(a.complex && a.re==0) {
			a = a.im;
		}
		if(b.complex && b.re==0) {
			b = b.im;
		}
		a = a/math.pow(Math.PI,math.piDegree(a));
		b = b/math.pow(Math.PI,math.piDegree(b));
		return math.gcf(a,b);
} );
newBuiltin('lcm', [TNum,TNum], TNum, math.lcm, {doc: {usage: 'lcm(a,b)', description: 'Lowest common multiple of two integers.', tags: ['least']}} );
newBuiltin('lcm', [TList], TNum, function(l){ 
		if(l.length==0) {
			return 1;
		} else if(l.length==1) {
			return l[0];
		} else {
			return math.lcm.apply(math,l);
		}
	},
	{unwrapValues: true, doc: {usage: 'lcm(a,b)', description: 'Lowest common multiple of two integers.', tags: ['least']}} 
);
newBuiltin('|', [TNum,TNum], TBool, math.divides, {doc: {usage: 'x|y', description: 'Returns @true@ if @x@ divides @y@.', tags: ['multiple of']}} );

newBuiltin('diff', ['?','?',TNum], '?', null, {doc: {usage: ['diff(f(x),x,n)', 'diff(x^2,x,1)','diff(y,x,1)'], description: '$n$<sup>th</sup> derivative. Currently for display only - can\'t be evaluated.', tags: ['differentiate','differential','differentiation']}});
newBuiltin('pdiff', ['?',TName,TNum], '?', null, {doc: {usage: ['pdiff(f(x,y),x,n)','pdiff(x+y,x,1)'], description: '$n$<sup>th</sup> partial derivative. Currently for display only - can\'t be evaluated.', tags: ['differentiate','differential','differentiation']}});
newBuiltin('int', ['?','?'], '?', null, {doc: {usage: 'int(f(x),x)', description: 'Integral. Currently for display only - can\'t be evaluated.'}});
newBuiltin('defint', ['?','?',TNum,TNum], '?', null, {doc: {usage: 'defint(f(x),y,0,1)', description: 'Definite integral. Currently for display only - can\'t be evaluated.'}});

newBuiltin('sum',[TList],TNum,math.sum,{unwrapValues: true});
newBuiltin('sum',[TVector],TNum,math.sum);

newBuiltin('deal',[TNum],TList, 
	function(n) {
		return math.deal(n).map(function(i) {
			return new TNum(i);
		});
	},
	{doc: {
		usage: ['deal(n)','deal(5)'],
		description: 'A random shuffling of the integers $[0 \\dots n-1]$.',
		tags: ['permutation','order','shuffle']
	}}
);

newBuiltin('shuffle',[TList],TList,
	function(list) {
		return math.shuffle(list);
	},
	{doc: {
		usage: ['shuffle(list)','shuffle([1,2,3])'],
		description: 'Randomly reorder a list.',
		tags: ['permutation','order','shuffle','deal']	
	}}
);

newBuiltin('shuffle',[TRange],TList,
	function(range) {
		var list = range.slice(3).map(function(n){return new TNum(n)})
		return math.shuffle(list);
	},
	{doc: {
		usage: ['shuffle(list)','shuffle([1,2,3])'],
		description: 'Randomly reorder a list.',
		tags: ['permutation','order','shuffle','deal']	
	}}
);

//if needs to be a bit different because it can return any type
newBuiltin('if', [TBool,'?','?'], '?',null, {
	evaluate: function(args,scope)
	{
		var test = jme.evaluate(args[0],scope).value;

		if(test)
			return jme.evaluate(args[1],scope);
		else
			return jme.evaluate(args[2],scope);
	},

	doc: {
		usage: 'if(test,a,b)',
		description: 'If @test@ is true, return @a@, otherwise return @b@.',
		tags: ['test','decide']
	}
});

newBuiltin('switch',[],'?', null, {
	typecheck: function(variables)
	{
		//should take alternating booleans and [any value]
		//final odd-numbered argument is the 'otherwise' option
		if(variables.length <2)
			return false;

		var check=0;
		if(variables.length % 2 == 0)
			check = variables.length;
		else
			check = variables.length-1;

		for( var i=0; i<check; i+=2 )
		{
			switch(variables[i].tok.type)
			{
			case '?':
			case 'boolean':
				break;
			default:
				return false;
			}
		}
		return true;
	},
	evaluate: function(args,scope)
	{
		for(var i=0; i<args.length-1; i+=2 )
		{
			var result = jme.evaluate(args[i],scope).value;
			if(result)
				return jme.evaluate(args[i+1],scope);
		}
		if(args.length % 2 == 1)
			return jme.evaluate(args[args.length-1],scope);
		else
			throw(new LissaJS.Error('jme.func.switch.no default case'));
	},

	doc: {
		usage: 'switch(test1,a1,test2,a2,b)',
		description: 'Select cases. Alternating boolean expressions with values to return, with the final argument representing the default case.',
		tags: ['choose','test']
	}
});

newBuiltin('isa',['?',TString],TBool, null, {
	evaluate: function(args,scope)
	{
		var kind = jme.evaluate(args[1],scope).value;
		if(args[0].tok.type=='name' && scope.variables[args[0].tok.name.toLowerCase()]==undefined )
			return new TBool(kind=='name');

		var match = false;
		if(kind=='complex')
		{
			match = args[0].tok.type=='number' && args[0].tok.value.complex || false;
		}
		else
		{
			match = args[0].tok.type == kind;
		}
		return new TBool(match);
	},

	doc: {
		usage: 'x isa \'number\'',
		description: 'Determine the data-type of an expression.',
		tags: ['typeof','test','is a']
	}
});

// repeat(expr,n) evaluates expr n times and returns a list of the results
newBuiltin('repeat',['?',TNum],TList, null, {
	evaluate: function(args,scope)
	{
		var size = jme.evaluate(args[1],scope).value;
		var value = [];
		for(var i=0;i<size;i++)
		{
			value[i] = jme.evaluate(args[0],scope);
		}
		return new TList(value);
	},

	doc: {
		usage: ['repeat(expr,n)','repeat( random(1..3), 5)'],
		description: 'Evaluate the given expression $n$ times, returning the results in a list.'
	}
});

function satisfy(names,definitions,conditions,scope,maxRuns) {
		maxRuns = maxRuns===undefined ? 100 : maxRuns;
		if(definitions.length!=names.length) {
			throw(new LissaJS.Error('jme.func.satisfy.wrong number of definitions'));
		}

		var satisfied = false;
		var runs = 0;
		while(runs<maxRuns && !satisfied) {
			runs += 1;

			var variables = {};
			for(var i=0; i<names.length; i++) {
				variables[names[i]] = jme.evaluate(definitions[i],scope);
			}
			var nscope = new jme.Scope([scope,{variables:variables}]);
			satisfied = true;
			for(var i=0; i<conditions.length; i++) {
				var ok = jme.evaluate(conditions[i],nscope);
				if(ok.type!='boolean') {
					throw(new LissaJS.Error('jme.func.satisfy.condition not a boolean'));
				}
				if(!ok.value) {
					satisfied = false;
					break;
				}
			}
		}
		if(!satisfied) {
			throw(new LissaJS.Error('jme.func.satisfy.took too many runs'));
		}

		return variables;
}

newBuiltin('satisfy', [TList,TList,TList,TNum], TList, null, {
	evaluate: function(args,scope)
	{
		var names = args[0].args.map(function(t){ return t.tok.name; });
		var definitions = args[1].args;
		var conditions = args[2].args;
		var maxRuns = args.length>3 ? jme.evaluate(args[3]).value : 100;
		
		var variables = satisfy(names,definitions,conditions,scope,maxRuns);

		return new TList(names.map(function(name){ return variables[name]; }));
	}
});
jme.findvarsOps.satisfy = function(tree,boundvars,scope) {
	var names = tree.args[0].args.map(function(t){return t.tok.name});
	boundvars = boundvars.concat(0,0,names);
	var vars = [];
	for(var i=1;i<tree.args.length;i++)
		vars = vars.merge(jme.findvars(tree.args[i],boundvars));
	return vars;
}

newBuiltin('listval',[TList,TNum],'?', null, {
	evaluate: function(args,scope)
	{
		var list = args[0];
		var index = util.wrapListIndex(args[1].value,list.vars);
		if(list.type!='list') {
			if(list.type=='name')
				throw(new LissaJS.Error('jme.variables.variable not defined',list.name));
			else
				throw(new LissaJS.Error('jme.func.listval.not a list'));
		}
		if(index in list.value)
			return list.value[index];
		else
			throw(new LissaJS.Error('jme.func.listval.invalid index',index,list.value.length));
	},

	doc: {
		usage: ['list[i]','[0,1,2,3][2]'],
		description: 'Return a particular element of a list.',
		tags: ['index','item','access']
	}
});

newBuiltin('listval',[TList,TRange],TList, null, {
	evaluate: function(args,scope)
	{
		var range = args[1].value;
		var list = args[0];
		var size = list.vars;
		var start = util.wrapListIndex(range[0],size);
		var end = util.wrapListIndex(range[1]),size;
		var value = list.value.slice(start,end);
		return new TList(value);
	},

	doc: {
		usage: ['list[1..3]','[0,1,2,3,4][1..3]'],
		description: 'Slice a list - return the elements with indices in the given range.',
		tags: ['range','section','part']
	}
});

newBuiltin('listval',[TVector,TNum],TNum, null, {
	evaluate: function(args,scope)
	{
		var vector = args[0].value;
		var index = util.wrapListIndex(args[1].value,vector.length);
		return new TNum(vector[index] || 0);
	},

	doc: {
		usage: ['vec[1]','vector(0,1,2)[1]'],
		description: 'Return a particular component of a vector.',
		tags: ['index','item','access']
	}
});

newBuiltin('listval',[TVector,TRange],TVector,null, {
	evaluate: function(args,scope)
	{
		var range = args[1].value;
		var vector = args[0].value;
		var start = util.wrapListIndex(range[0],vector.length);
		var end = util.wrapListIndex(range[1],vector.length);
		var v = [];
		for(var i=start;i<end;i++) {
			v.push(vector[i] || 0);
		}
		return new TVector(v);
	}
});

newBuiltin('listval',[TMatrix,TNum],TVector, null, {
	evaluate: function(args,scope)
	{
		var matrix = args[0].value;
		var index = util.wrapListIndex(args[1].value,matrix.length);
		return new TVector(matrix[index] || []);
	},

	doc: {
		usage: ['mat[1]','matrix([1,0],[0,1])[1]'],
		description: 'Return a particular row of a matrix.',
		tags: ['index','item','access','element','cell']
	}
});

newBuiltin('listval',[TMatrix,TRange],TMatrix,null, {
	evaluate: function(args,scope)
	{
		var range = args[1].value;
		var matrix = args[0].value;
		var start = util.wrapListIndex(range[0],matrix.length);
		var end = util.wrapListIndex(range[1],matrix.length);
		var v = [];
		return new TMatrix(matrix.slice(start,end));
	}
});

newBuiltin('isset',[TName],TBool,null, {
	evaluate: function(args,scope) {
		var name = args[0].tok.name;
		return new TBool(name in scope.variables);
	}
});
jme.findvarsOps.isset = function(tree,boundvars,scope) {
	return [];
}
jme.substituteTreeOps.isset = function(tree,scope,allowUnbound) {
	return tree;
}

function mapOverList(lambda,names,list,scope) {
	var olist = list.map(function(v) {
		var d = {}
		if(typeof(names)=='string') {
			d[names] = v;
		} else {
			names.forEach(function(name,i) {
				d[name] = v.value[i];
			});
		}
		return scope.evaluate(lambda,d);
	});
	return new TList(olist);
}

/** Functions for 'map', by the type of the thing being mapped over.
 * Functions take a JME expression lambda, a name or list of names to map, a value to map over, and a scope to evaluate against.
 * @memberof LissaJS.jme
 * @enum {function}
 */
jme.mapFunctions = {
	'list': mapOverList,
	'set': mapOverList,
	'range': function(lambda,name,range,scope) {
		var list = range.slice(3).map(function(n){return new TNum(n)});
		return mapOverList(lambda,name,list,scope);
	},
	'matrix': function(lambda,name,matrix,scope) {
		return new TMatrix(matrixmath.map(matrix,function(n) {
			var d = {}
			d[name] = new TNum(n);
			var o = scope.evaluate(lambda,d);
			if(o.type!='number') {
				throw(new LissaJS.Error("jme.map.matrix map returned non number"))
			}
			return o.value;
		}));
	},
	'vector': function(lambda,name,vector,scope) {
		return new TVector(vectormath.map(vector,function(n) {
			var d = {}
			d[name] = new TNum(n);
			var o = scope.evaluate(lambda,d);
			if(o.type!='number') {
				throw(new LissaJS.Error("jme.map.vector map returned non number"))
			}
			return o.value;
		}));
	}
}

newBuiltin('map',['?',TName,'?'],TList, null, {
	evaluate: function(args,scope)
	{
		var lambda = args[0];

		var value = jme.evaluate(args[2],scope);
		if(!(value.type in jme.mapFunctions)) {
			throw(new LissaJS.Error('jme.typecheck.map not on enumerable',value.type));
		}
		scope = new Scope(scope);

		var names_tok = args[1].tok;
		var names;
		if(names_tok.type=='name') {
			names = names_tok.name;
		} else {
			names = args[1].args.map(function(t){return t.tok.name;});
		}
		return jme.mapFunctions[value.type](lambda,names,value.value,scope);
	},
	
	doc: {
		usage: ['map(expr,x,list)','map(x^2,x,[0,2,4,6])'],
		description: 'Apply the given expression to every value in a list.'
	}
});

jme.findvarsOps.map = function(tree,boundvars,scope) {
	boundvars = boundvars.slice();
	if(tree.args[1].tok.type=='list') {
		var names = tree.args[1].args;
		for(var i=0;i<names.length;i++) {
			boundvars.push(names[i].tok.name.toLowerCase());
		}
	} else {
		boundvars.push(tree.args[1].tok.name.toLowerCase());
	}
	var vars = jme.findvars(tree.args[0],boundvars,scope);
	vars = vars.merge(jme.findvars(tree.args[2],boundvars));
	return vars;
}
jme.substituteTreeOps.map = function(tree,scope,allowUnbound) {
	tree.args[2] = jme.substituteTree(tree.args[2],scope,allowUnbound);
	return tree;
}

newBuiltin('filter',['?',TName,'?'],TList,null, {
	evaluate: function(args,scope) {
		var lambda = args[0];

		var list = jme.evaluate(args[2],scope);
		switch(list.type) {
		case 'list':
			list = list.value;
			break;
		case 'range':
			list = list.value.slice(3);
			for(var i=0;i<list.length;i++) {
				list[i] = new TNum(list[i]);
			}
			break;
		default:
			throw(new LissaJS.Error('jme.typecheck.map not on enumerable',list.type));
		}
		scope = new Scope(scope);
		var name = args[1].tok.name;
		var value = list.filter(function(v) {
			scope.variables[name] = v;
			return jme.evaluate(lambda,scope).value;
		});
		return new TList(value);
	}
});
jme.findvarsOps.filter = function(tree,boundvars,scope) {
	boundvars = boundvars.slice();
	if(tree.args[1].tok.type=='list') {
		var names = tree.args[1].args;
		for(var i=0;i<names.length;i++) {
			boundvars.push(names[i].tok.name.toLowerCase());
		}
	} else {
		boundvars.push(tree.args[1].tok.name.toLowerCase());
	}
	var vars = jme.findvars(tree.args[0],boundvars,scope);
	vars = vars.merge(jme.findvars(tree.args[2],boundvars));
	return vars;
}
jme.substituteTreeOps.filter = function(tree,scope,allowUnbound) {
	tree.args[2] = jme.substituteTree(tree.args[2],scope,allowUnbound);
	return tree;
}

newBuiltin('let',['?'],TList, null, {
	evaluate: function(args,scope)
	{
		var lambda = args[args.length-1];

		var variables = {};
		for(var i=0;i<args.length-1;i+=2) {
			var name = args[i].tok.name;
			var value = scope.evaluate(args[i+1]);
			variables[name] = value;
		}
		var nscope = new Scope([scope,{variables:variables}]);

		return nscope.evaluate(lambda);
	},

	typecheck: function(variables) {
		if(variables.length<3 || (variables.length%2)!=1) {
			return false;
		}
		for(var i=0;i<variables.length-1;i+=2) {
			if(variables[i].tok.type!='name') {
				return false;
			}
		}
	}
});
jme.findvarsOps.let = function(tree,boundvars,scope) {
	// find vars used in variable assignments
	var vars = [];
	for(var i=0;i<tree.args.length-1;i+=2) {
		vars = vars.merge(jme.findvars(tree.args[i+1],boundvars,scope));
	}

	// find variable names assigned by let
	boundvars = boundvars.slice();
	for(var i=0;i<tree.args.length-1;i+=2) {
		boundvars.push(tree.args[i].tok.name.toLowerCase());
	}

	// find variables used in the lambda expression, excluding the ones assigned by let
	vars = vars.merge(jme.findvars(tree.args[tree.args.length-1],boundvars,scope));

	return vars;
}
jme.substituteTreeOps.let = function(tree,scope,allowUnbound) {
	for(var i=1;i<tree.args.length-1;i+=2) {
		tree.args[i] = jme.substituteTree(tree.args[i],scope,allowUnbound);
	}
}

newBuiltin('sort',[TList],TList, null, {
	evaluate: function(args,scope)
	{
		var list = args[0];
		var newlist = new TList(list.vars);
		newlist.value = list.value.slice().sort(function(a,b){ 
			if(math.gt(a.value,b.value))
				return 1;
			else if(math.lt(a.value,b.value))
				return -1;
			else
				return 0;
		});
		return newlist;
	},

	doc: {
		usage: 'sort(list)',
		description: 'Sort a list.'
	}
});

newBuiltin('reverse',[TList],TList,null, {
	evaluate: function(args,scope) {
		var list = args[0];
		return new TList(list.value.slice().reverse());
	}
});

// indices of given value in given list
newBuiltin('indices',[TList,'?'],TList,null, {
	evaluate: function(args,scope) {
		var list = args[0];
		var target = args[1];
		var out = [];
		list.value.map(function(v,i) {
			if(util.eq(v,target)) {
				out.push(new TNum(i));
			}
		});
		return new TList(out);
	}
});

newBuiltin('set',[TList],TSet,function(l) {
	return util.distinct(l);
});
newBuiltin('set',[TRange],TSet,function(r) {
	return r.slice(3).map(function(n){return new TNum(n)});
});

newBuiltin('set', ['?'], TSet, null, {
	evaluate: function(args,scope) {
		return new TSet(util.distinct(args));
	},
	typecheck: function() {
		return true;
	}

});
newBuiltin('list',[TSet],TList,function(set) {
	var l = [];
	for(i=0;i<set.length;i++) {
		l.push(set[i]);
	}
	return l;
});

newBuiltin('union',[TSet,TSet],TSet,setmath.union);
newBuiltin('intersection',[TSet,TSet],TSet,setmath.intersection);
newBuiltin('or',[TSet,TSet],TSet,setmath.union);
newBuiltin('and',[TSet,TSet],TSet,setmath.intersection);
newBuiltin('-',[TSet,TSet],TSet,setmath.minus);
newBuiltin('abs',[TSet],TNum,setmath.size);

newBuiltin('in',['?',TSet],TBool,null,{
	evaluate: function(args,scope) {
		return new TBool(util.contains(args[1].value,args[0]));
	}
});

newBuiltin('product',['?'],TList,function() {
	var lists = Array.prototype.slice.call(arguments);
	var prod = util.product(lists);
	return prod.map(function(l){ return new TList(l); });
}, {
	typecheck: function(variables) {
		for(var i=0;i<variables.length;i++) {
			var t = variables[i].type;
			if(!(t=='list' || t=='set')) {
				return false;
			}
		}
		return true;
	}
});

newBuiltin('zip',['?'],TList,function() {
	var lists = Array.prototype.slice.call(arguments);
	var zipped = util.zip(lists);
	return zipped.map(function(l){ return new TList(l); });
}, {
	typecheck: function(variables) {
		for(var i=0;i<variables.length;i++) {
			var t = variables[i].type;
			if(!(t=='list' || t=='set')) {
				return false;
			}
		}
		return true;
	}
});

newBuiltin('combinations',['?',TNum],TList,function(list,r) {
	var prod = util.combinations(list,r);
	return prod.map(function(l){ return new TList(l); });
}, {
	typecheck: function(variables) {
		return (variables[0].type=='set' || variables[0].type=='list') && variables[1].type=='number';
	}
});

newBuiltin('combinations_with_replacement',['?',TNum],TList,function(list,r) {
	var prod = util.combinations_with_replacement(list,r);
	return prod.map(function(l){ return new TList(l); });
}, {
	typecheck: function(variables) {
		return (variables[0].type=='set' || variables[0].type=='list') && variables[1].type=='number';
	}
});

newBuiltin('permutations',['?',TNum],TList,function(list,r) {
	var prod = util.permutations(list,r);
	return prod.map(function(l){ return new TList(l); });
}, {
	typecheck: function(variables) {
		return (variables[0].type=='set' || variables[0].type=='list') && variables[1].type=='number';
	}
});

newBuiltin('vector',['*TNum'],TVector, null, {
	evaluate: function(args,scope)
	{
		var value = [];
		for(var i=0;i<args.length;i++)
		{
			value.push(args[i].value);
		}
		return new TVector(value);
	},

	doc: {
		usage: ['vector(1,2,3)','vector(a,b)'],
		description: 'Create a vector with the given components.',
		tags: ['constructor','new']
	}
});

newBuiltin('vector',[TList],TVector, null, {
	evaluate: function(args,scope)
	{
		var list = args[0];
		var value = list.value.map(function(x){return x.value});
		return new TVector(value);
	},

	doc: {
		usage: ['vector([1,2,3])','vector(list)'],
		description: 'Create a vector from a list of numbers.',
		tags: ['constructor','new','convert','cast']
	}
});

newBuiltin('matrix',[TList],TMatrix,null, {
	evaluate: function(args,scope)
	{
		var list = args[0];
		var rows = list.vars;
		var columns = 0;
		var value = [];
		switch(list.value[0].type)
		{
		case 'number':
			value = [list.value.map(function(e){return e.value})];
			rows = 1;
			columns = list.vars;
			break;
		case 'vector':
			value = list.value.map(function(v){return v.value});
			columns = list.value[0].value.length;
			break;
		case 'list':
			for(var i=0;i<rows;i++)
			{
				var row = list.value[i].value;
				value.push(row.map(function(x){return x.value}));
				columns = Math.max(columns,row.length);
			}
			break;
		default:
			throw(new LissaJS.Error('jme.func.matrix.invalid row type',list.value[0].type));
		}
		value.rows = rows;
		value.columns = columns;
		return new TMatrix(value);
	},

	doc: {
		usage: ['matrix([ [1,2], [3,4] ])', 'matrix([ row1, row2 ])'],
		tags: ['convert','cast','constructor','new'],
		description: 'Create a matrix from a list of rows. This constructor is useful if the number of rows is not a constant.'
	}
});

newBuiltin('matrix',['*list'],TMatrix, null, {
	evaluate: function(args,scope)
	{
		var rows = args.length;
		var columns = 0;
		var value = [];
		for(var i=0;i<args.length;i++)
		{
			var row = args[i].value;
			value.push(row.map(function(x){return x.value}));
			columns = Math.max(columns,row.length);
		}
		value.rows = rows;
		value.columns = columns;
		return new TMatrix(value);
	},

	doc: {
		usage: ['matrix([1,0],[0,1])','matrix(row1,row2,row3)'],
		description: 'Create a matrix. The arguments are lists of numbers, representing the rows.',
		tags: ['constructor', 'new']
	}
});

newBuiltin('rowvector',['*number'],TMatrix, null, {
	evaluate: function(args,scope)
	{
		var row = [];
		for(var i=0;i<args.length;i++)
		{
			row.push(args[i].value);
		}
		var matrix = [row];
		matrix.rows = 1;
		matrix.columns = row.length;
		return new TMatrix(matrix);
	},

	doc: {
		usage: 'rowvector(1,2,3)',
		description: 'Create a row vector, i.e. an $n \\times 1$ matrix, with the given components.',
		tags: ['constructor','new']
	}
});

newBuiltin('rowvector',[TList],TMatrix, null, {
	evaluate: function(args,scope)
	{
		var list = args[0];
		var row = list.value.map(function(x){return x.value});
		var matrix = [row];
		matrix.rows = 1;
		matrix.columns = row.length;
		return new TMatrix(matrix);
	},

	doc: {
		usage: 'rowvector(1,2,3)',
		description: 'Create a row vector, i.e. an $n \\times 1$ matrix, with the given components.',
		tags: ['constructor','new']
	}
});

//cast vector to list
newBuiltin('list',[TVector],TList,null, {
	evaluate: function(args,scope)
	{
		var vector = args[0];
		var value = vector.value.map(function(n){ return new TNum(n)});
		return new TList(value);
	},

	doc: {
		usage: ['list(vector(0,1,2))','list(vector)'],
		description: 'Cast a vector to a list.',
		tags: ['convert']
	}
});

//cast matrix to list of lists
newBuiltin('list',[TMatrix],TList,null, {
	evaluate: function(args,scope)
	{
		var matrix = args[0];
		var value = [];
		for(var i=0;i<matrix.value.rows;i++)
		{
			var row = new TList(matrix.value[i].map(function(n){return new TNum(n)}));
			value.push(row);
		}
		return new TList(value);
	},

	doc: {
		usage: ['list(matrix([0,1],[2,3]))'],
		tags: ['convert','cast'],
		description: 'Cast a matrix to a list of its rows.'
	}
});

///end of builtins
});
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

/** @file Stuff to do with making new functions from JME or JavaScript code, 
 * generating question variables, 
 * and substituting variables into maths or the DOM 
 *
 * Provides {@link LissaJS.jme.variables}
 */

LissaJS.queueScript('jme-variables',['base','jme','util'],function() {

var jme = LissaJS.jme;
var util = LissaJS.util;

/** @namespace LissaJS.jme.variables */

jme.variables = /** @lends LissaJS.jme.variables */ {

	/** Make a new function, whose definition is written in JME.
	 * @param {object} fn - contains `definition` and `paramNames`.
	 * @param {LissaJS.jme.Scope} scope
	 * @returns {function} - function which evaluates arguments and adds them to the scope, then evaluates `fn.definition` over that scope.
	 */
	makeJMEFunction: function(fn,scope) {
		fn.tree = jme.compile(fn.definition,scope,true);
		return function(args,scope) {
			var oscope = scope;
			scope = new jme.Scope(scope);

			for(var j=0;j<args.length;j++)
			{
				scope.variables[fn.paramNames[j]] = args[j];
			}
			return jme.evaluate(this.tree,scope);
		}
	},

	/** Make a new function, whose definition is written in JavaScript.
	 *
	 * The JavaScript is wrapped with `(function(<paramNames>){ ` and ` }`)
	 *
	 * @param {object} fn - contains `definition` and `paramNames`.
	 * @param {object} withEnv - dictionary of local variables for javascript functions
	 * @returns {function} - function which evaluates arguments, unwraps them to JavaScript values, then evalutes the JavaScript function and returns the result, wrapped as a {@link LissaJS.jme.token}
	 */
	makeJavascriptFunction: function(fn,withEnv) {
		var paramNames = fn.paramNames.slice();
		paramNames.push('scope');
		var preamble='fn.jfn=(function('+paramNames.join(',')+'){\n';
		var math = LissaJS.math;
		var util = LissaJS.util;
		withEnv = withEnv || {};

		try {
			with(withEnv) {
				var jfn = eval(preamble+fn.definition+'\n})');
			}
		} catch(e) {
			throw(new LissaJS.Error('jme.variables.syntax error in function definition'));
		}
		return function(args,scope) {
			args = args.map(function(a){return jme.unwrapValue(a)});
			args.push(scope);
			try {
				var val = jfn.apply(this,args);
				if(val===undefined) {
					throw(new LissaJS.Error('jme.user javascript.returned undefined',fn.name));
				}
				val = jme.wrapValue(val,fn.outtype);
				if(!val.type)
					val = new fn.outcons(val);
				return val;
			}
			catch(e)
			{
				throw(new LissaJS.Error('jme.user javascript.error',fn.name,e.message));
			}
		}
	},

	/** Make a custom function.
	 *
	 * @param {object} tmpfn - contains `definition`, `name`, `language`, `parameters`
	 * @param {LissaJS.jme.Scope} scope
	 * @param {object} withEnv - dictionary of local variables for javascript functions
	 * @returns {object} - contains `outcons`, `intype`, `evaluate`
	 */
	makeFunction: function(tmpfn,scope,withEnv) {
		var intype = [],
			paramNames = [];

		tmpfn.parameters.map(function(p) {
			intype.push(jme.types[p.type]);
			paramNames.push(p.name);
		});

		var outcons = jme.types[tmpfn.outtype];

		var fn = new jme.funcObj(tmpfn.name,intype,outcons,null,true);

		fn.outcons = outcons;
		fn.intype = intype;
		fn.paramNames = paramNames;
		fn.definition = tmpfn.definition;
		fn.name = tmpfn.name;
		fn.language = tmpfn.language;

		try {
			switch(fn.language)
			{
			case 'jme':
				fn.evaluate = jme.variables.makeJMEFunction(fn,scope);
				break;
			case 'javascript':
				fn.evaluate = jme.variables.makeJavascriptFunction(fn,withEnv);
				break;
			}
		} catch(e) {
			throw(new LissaJS.Error('jme.variables.error making function',fn.name,e.message));
		}
		return fn
	},

	/** Make up custom functions
	 * @param {object[]} tmpFunctions
	 * @param {LissaJS.jme.Scope} scope
	 * @param {object} withEnv - dictionary of local variables for javascript functions
	 * @returns {object[]}
	 * @see LissaJS.jme.variables.makeFunction
	 */
	makeFunctions: function(tmpFunctions,scope,withEnv)
	{
		scope = new jme.Scope(scope);
		var functions = scope.functions;
		var tmpFunctions2 = [];
		for(var i=0;i<tmpFunctions.length;i++)
		{
			var cfn = jme.variables.makeFunction(tmpFunctions[i],scope,withEnv);

			if(functions[cfn.name]===undefined)
				functions[cfn.name] = [];
			functions[cfn.name].push(cfn);

		}
		return functions;
	},

	/** Evaluate a variable, evaluating all its dependencies first.
	 * @param {string} name - the name of the variable to evaluate
	 * @param {object} todo - dictionary of variables still to evaluate
	 * @param {LissaJS.jme.Scope} scope
	 * @param {string[]} path - Breadcrumbs - variable names currently being evaluated, so we can detect circular dependencies
	 * @return {LissaJS.jme.token}
	 */
	computeVariable: function(name,todo,scope,path)
	{
		if(scope.variables[name]!==undefined)
			return scope.variables[name];

		if(path===undefined)
			path=[];


		if(path.contains(name))
		{
			throw(new LissaJS.Error('jme.variables.circular reference',name,path));
		}

		var v = todo[name];

		if(v===undefined)
			throw(new LissaJS.Error('jme.variables.variable not defined',name));

		//work out dependencies
		for(var i=0;i<v.vars.length;i++)
		{
			var x=v.vars[i];
			if(scope.variables[x]===undefined)
			{
				var newpath = path.slice(0);
				newpath.splice(0,0,name);
				try {
					jme.variables.computeVariable(x,todo,scope,newpath);
				}
				catch(e) {
					if(e.originalMessage == 'jme.variables.circular reference' || e.originalMessage == 'jme.variables.variable not defined') {
						throw(e);
					} else {
						throw(new LissaJS.Error('jme.variables.error computing dependency',x));
					}
				}
			}
		}

		if(!v.tree) {
			throw(new LissaJS.Error('jme.variables.empty definition',name));
		}
		try {
			scope.variables[name] = jme.evaluate(v.tree,scope);
		} catch(e) {
			throw(new LissaJS.Error('jme.variables.error evaluating variable',name,e.message));
		}
		return scope.variables[name];
	},

	/** Evaluate dictionary of variables
	 * @param {object} todo - dictionary of variables mapped to their definitions
	 * @param {LissaJS.jme.Scope} scope
	 * @param {LissaJS.jme.tree} condition - condition on the values of the variables which must be satisfied
	 * @returns {object} - {variables: dictionary of evaluated variables, conditionSatisfied: was the condition satisfied?}
	 */
	makeVariables: function(todo,scope,condition)
	{
		scope = new jme.Scope(scope);

		var conditionSatisfied = true;
		if(condition) {
			var condition_vars = jme.findvars(condition);
			condition_vars.map(function(v) {
				jme.variables.computeVariable(v,todo,scope);
			});
			conditionSatisfied = jme.evaluate(condition,scope).value;
		}

		if(conditionSatisfied) {
			for(var x in todo)
			{
				jme.variables.computeVariable(x,todo,scope);
			}
		}
		return {variables: scope.variables, conditionSatisfied: conditionSatisfied};
	},

	/** Given a todo dictionary of variables, return a dictionary with only the variables depending on the given list of variables
	 * @param {object} todo - dictionary of variables mapped to their definitions
	 * @param {string[]} variables - list of variable names whose dependants we should find
	 * @returns {object} - a copy of the todo list, only including the dependants of the given variables
	 */
	variableDependants: function(todo,ancestors) {
		var out = {}
		var dependants = {};
		function findDependants(name) {
			if(name in dependants) {
				return dependants[name];
			}
			var d = [];
			todo[name].vars.map(function(name2) {
				d = d.concat(name2,findDependants(name2));
			});
			var o = [];
			d.map(function(name2) {
				if(!o.contains(name2)) {
					o.push(name2);
				}
			});
			dependants[name] = o;
			return o;
		}
		for(var name in todo) {
			findDependants(name);
		}
		var out = {};
		for(var name in dependants) {
			for(i=0;i<ancestors.length;i++) {
				if(dependants[name].contains(ancestors[i])) {
					out[name] = todo[name];
					break;
				}
			}
		}
		return out;
	},

	/** Substitute variables into a DOM element (works recursively on the element's children)
	 *
	 * Ignores iframes and elements with the attribute `nosubvars`.
	 * @param {Element} element
	 * @param {LissaJS.jme.Scope} scope
	 */
	DOMcontentsubvars: function(element, scope) {
		if($.nodeName(element,'iframe'))
			return element;
		if(element.hasAttribute('nosubvars'))
			return element;

		if(element.hasAttribute('data-jme-visible')) {
			var condition = element.getAttribute('data-jme-visible');
			var result = scope.evaluate(condition);
			if(!(result.type=='boolean' && result.value==true)) {
				$(element).remove();
				return;
			}
		}

		var re_end;
		$(element).contents().each(function() {
			if(this.nodeType==(this.TEXT_NODE || 3)) {
				var selector = $(this);
				var str = this.nodeValue;
				var bits = util.contentsplitbrackets(str,re_end);	//split up string by TeX delimiters. eg "let $X$ = \[expr\]" becomes ['let ','$','X','$',' = ','\[','expr','\]','']
				re_end = bits.re_end;
				var i=0;
				var l = bits.length;
				for(var i=0; i<l; i+=4) {
					var textsubs = jme.variables.DOMsubvars(bits[i],scope,this.ownerDocument);
					for(var j=0;j<textsubs.length;j++) {
						selector.before(textsubs[j]);
					}
					var startDelimiter = bits[i+1] || '';
					var tex = bits[i+2] || '';
					var endDelimiter = bits[i+3] || '';
					var n = this.ownerDocument.createTextNode(startDelimiter+tex+endDelimiter);
					selector.before(n);
				}
				selector.remove();
			} else {
				jme.variables.DOMcontentsubvars(this,scope);
			}
		});
		return element;
	},

	/** Substitute variables into the contents of a text node. Substituted values might contain HTML elements, so the return value is a collection of DOM elements, not another string.
	 * @param {string} str - the contents of the text node
	 * @param {LissaJS.jme.Scope} scope
	 * @param {Document} doc - the document the text node belongs to.
	 * @returns {Node[]} - array of DOM nodes to replace the string with
	 */
	DOMsubvars: function(str,scope,doc) {
		doc = doc || document;
		var bits = util.splitbrackets(str,'{','}');

		if(bits.length==1)
			return [doc.createTextNode(str)];

		function doToken(token) {
			switch(token.type){ 
			case 'html':
				return token.value;
			case 'number':
				return LissaJS.math.niceNumber(token.value);
			case 'string':
				return token.value.replace(/\\([{}])/g,'$1');
			case 'list':
				return '[ '+token.value.map(function(item){return doToken(item)}).join(', ')+' ]';
			default:
				return jme.display.treeToJME({tok:token});
			}
		}

		var out = [];
		for(var i=0; i<bits.length; i++)
		{
			if(i % 2)
			{
				var v = jme.evaluate(jme.compile(bits[i],scope),scope);
				v = doToken(v);
			}
			else
			{
				v = bits[i];
			}
			if(typeof v == 'string') {
				if(out.length>0 && typeof out[out.length-1]=='string')
					out[out.length-1]+=v;
				else
					out.push(v);
			}
			else {
				out.push(v);
			}
		}
		for(var i=0;i<out.length;i++) {
			if(typeof out[i] == 'string') {
				var d = document.createElement('div');
				d.innerHTML = out[i];
				d = importNode(doc,d,true);
				out[i] = $(d).contents();
			}
		}
		return out;
	}
};


// cross-browser importNode from http://www.alistapart.com/articles/crossbrowserscripting/
// because IE8 is completely mentile and won't let you copy nodes between documents in anything approaching a reasonable way
function importNode(doc,node,allChildren) {
	var ELEMENT_NODE = 1;
	var TEXT_NODE = 3;
	var CDATA_SECTION_NODE = 4;
	var COMMENT_NODE = 8;

	switch (node.nodeType) {
		case ELEMENT_NODE:
			var newNode = doc.createElement(node.nodeName);
			var il;
			/* does the node have any attributes to add? */
			if (node.attributes && (il=node.attributes.length) > 0) {
				for (var i = 0; i < il; i++)
					newNode.setAttribute(node.attributes[i].nodeName, node.getAttribute(node.attributes[i].nodeName));
			}
			/* are we going after children too, and does the node have any? */
			if (allChildren && node.childNodes && (il=node.childNodes.length) > 0) {
				for (var i = 0; i<il; i++)
					newNode.appendChild(importNode(doc,node.childNodes[i], allChildren));
			}
			return newNode;
		case TEXT_NODE:
		case CDATA_SECTION_NODE:
			return doc.createTextNode(node.nodeValue);
		case COMMENT_NODE:
			return doc.createComment(node.nodeValue);
	}
};




});
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

/** @file Stuff to do with displaying JME expressions - convert to TeX, simplify, or convert syntax trees back to JME 
 *
 * Provides {@link LissaJS.jme.display}
 */

LissaJS.queueScript('jme-display',['base','math','jme','util'],function() {
	
var math = LissaJS.math;
var jme = LissaJS.jme;
var util = LissaJS.util;

/** A JME expression
 * @typedef JME
 * @type {string}
 */

/** A LaTeX string
 * @typedef TeX
 * @type {string}
 */

/** @namespace LissaJS.jme.display */

jme.display = /** @lends LissaJS.jme.display */ {
	/** Convert a JME expression to LaTeX.
	 *
	 * @param {JME} expr
	 * @param {string[]|LissaJS.jme.Ruleset} ruleset - can be anything accepted by {@link LissaJS.jme.display.collectRuleset}
	 * @param {LissaJS.jme.Scope} scope
	 * @returns {TeX}
	 */
	exprToLaTeX: function(expr,ruleset,scope)
	{
		if(!ruleset)
			ruleset = simplificationRules.basic;
		ruleset = jme.collectRuleset(ruleset,scope.rulesets);

		expr+='';	//make sure expr is a string

		if(!expr.trim().length)	//if expr is the empty string, don't bother going through the whole compilation proces
			return '';
		var tree = jme.display.simplify(expr,ruleset,scope); //compile the expression to a tree and simplify it
		var tex = texify(tree,ruleset.flags); //render the tree as TeX
		return tex;
	},

	/** Simplify a JME expression string according to the given ruleset and return it as a JME string
	 * 
	 * @param {JME} expr
	 * @param {string[]|LissaJS.jme.Ruleset} ruleset - can be anything accepted by {@link LissaJS.jme.display.collectRuleset}
	 * @param {LissaJS.jme.Scope} scope
	 * @returns {JME}
	 *
	 * @see LissaJS.jme.display.simplify
	 */
	simplifyExpression: function(expr,ruleset,scope)
	{
		if(expr.trim()=='')
			return '';
		return treeToJME(jme.display.simplify(expr,ruleset,scope),ruleset.flags);
	},

	/** Simplify a JME expression string according to given ruleset and return it as a syntax tree
	 *
	 * @param {JME} expr 
	 * @param {string[]|LissaJS.jme.Ruleset} ruleset
	 * @param {LissaJS.jme.Scope} scope
	 * @returns {LissaJS.jme.tree}
	 *
	 * @see LissaJS.jme.display.simplifyExpression
	 * @see LissaJS.jme.display.simplifyTree
	 */
	simplify: function(expr,ruleset,scope)
	{
		if(expr.trim()=='')
			return;

		if(!ruleset)
			ruleset = simplificationRules.basic;
		ruleset = jme.collectRuleset(ruleset,scope.rulesets);		//collect the ruleset - replace set names with the appropriate Rule objects

		try 
		{
			var exprTree = jme.compile(expr,{},true);	//compile the expression to a tree. notypecheck is true, so undefined function names can be used.
			return jme.display.simplifyTree(exprTree,ruleset,scope);	// simplify the tree
		}
		catch(e) 
		{
			//e.message += '\nSimplifying expression failed. Expression was: '+expr;
			throw(e);
		}
	},

	/** Simplify a syntax tree according to the given ruleset
	 * 
	 * @param {LissaJS.jme.tree} exprTree
	 * @param {string[]|LissaJS.jme.Ruleset} ruleset
	 * @param {LissaJS.jme.Scope} scope
	 * @returns {LissaJS.jme.tree}
	 *
	 * @see LissaJS.jme.display.simplify
	 */
	simplifyTree: function(exprTree,ruleset,scope)
	{
		if(!scope)
			throw(new LissaJS.Error('jme.display.simplifyTree.no scope given'));
		scope = LissaJS.util.copyobj(scope);
		scope.variables = {};	//remove variables from the scope so they don't accidentally get substituted in
		var applied = true;

		var rules = ruleset.rules;

		// apply rules until nothing can be done
		while( applied )
		{
			//the eval() function is a meta-function which, when used in the result of a rule, allows you to replace an expression with a single data value
			if(exprTree.tok.type=='function' && exprTree.tok.name=='eval')	
			{
				exprTree = {tok: LissaJS.jme.evaluate(exprTree.args[0],scope)};
			}
			else
			{
				if(exprTree.args)	//if this token is an operation with arguments, try to simplify the arguments first
				{
					for(var i=0;i<exprTree.args.length;i++)
					{
						exprTree.args[i] = jme.display.simplifyTree(exprTree.args[i],ruleset,scope);
					}
				}
				applied = false;
				for( var i=0; i<rules.length;i++)	//check each rule
				{
					var match;
					if(match = rules[i].match(exprTree,scope))	//if rule can be applied, apply it!
					{
						exprTree = jme.substituteTree(LissaJS.util.copyobj(rules[i].result,true),new jme.Scope([{variables:match}]));
						applied = true;
						break;
					}
				}
			}
		}
		return exprTree
	}
};


/// all private methods below here



/** Apply brackets to an op argument if appropriate
 * @memberof LissaJS.jme.display
 * @private
 *
 * @param {LissaJS.jme.tree} thing
 * @param {string[]} texArgs - the arguments of `thing`, as TeX
 * @param {number} i - the index of the argument to bracket
 * @returns {TeX}
 */
function texifyOpArg(thing,texArgs,i)
{
	var precedence = jme.precedence;
	var tex = texArgs[i];
	if(thing.args[i].tok.type=='op')	//if this is an op applied to an op, might need to bracket
	{
		var op1 = thing.args[i].tok.name;	//child op
		var op2 = thing.tok.name;			//parent op
		var p1 = precedence[op1];	//precedence of child op
		var p2 = precedence[op2];	//precedence of parent op

		//if leaving out brackets would cause child op to be evaluated after parent op, or precedences the same and parent op not commutative, or child op is negation and parent is exponentiation
		if( p1 > p2 || (p1==p2 && i>0 && !jme.commutative[op2]) || (op1=='-u' && precedence[op2]<=precedence['*']) )	
			tex = '\\left ( '+tex+' \\right )';
	}
	//complex numbers might need brackets round them when multiplied with something else or unary minusing
	else if(thing.args[i].tok.type=='number' && thing.args[i].tok.value.complex && thing.tok.type=='op' && (thing.tok.name=='*' || thing.tok.name=='-u') )	
	{
		var v = thing.args[i].tok.value;
		if(!(v.re==0 || v.im==0))
			tex = '\\left ( '+tex+' \\right )';
	}
	return tex;
}

/** Helper function for texing infix operators
 * @memberof LissaJS.jme.display
 * @private
 *
 * @param {TeX} code - the TeX command for the operator
 * @returns {function} - a function which will convert a syntax tree with the operator at the top to TeX, by putting `code` in between the TeX of the two arguments.
 */
function infixTex(code)
{
	return function(thing,texArgs)
	{
		var arity = jme.builtinScope.functions[thing.tok.name][0].intype.length;
		if( arity == 1 )	//if operation is unary, prepend argument with code
		{
			return code+texArgs[0];
		}
		else if ( arity == 2 )	//if operation is binary, put code in between arguments
		{
			return texArgs[0]+' '+code+' '+texArgs[1];
		}
	}
}

/** Helper for texing nullary functions
 * @memberof LissaJS.jme.display
 * @private
 *
 * @param {TeX} code - the TeX command for the function
 * @returns {function} - a function which returns the appropriate (constant) TeX code
 */
function nullaryTex(code)
{
	return function(thing,texArgs){ return '\\textrm{'+code+'}'; };
}

/** Helper function for texing functions
 * @memberof LissaJS.jme.display
 * @private
 *
 * @param {TeX} code - the TeX command for the function
 * @returns {function} - a function which converts a syntax tree to the appropriate TeX
 */
function funcTex(code)
{
	return function(thing,texArgs)
	{
		return code+' \\left ( '+texArgs.join(', ')+' \\right )';
	}
}

/** Define how to texify each operation and function
 * @enum {function}
 * @memberof LissaJS.jme.display
 */
var texOps = jme.display.texOps = {
	/** range definition. Should never really be seen */
	'#': (function(thing,texArgs) { return texArgs[0]+' \\, \\# \\, '+texArgs[1]; }),	

	/** logical negation */
	'not': infixTex('\\neg '),	

	/** unary addition */
	'+u': function(thing,texArgs,settings) {
		var tex = texArgs[0];
		if( thing.args[0].tok.type=='op' ) {
			var op = thing.args[0].tok.name;
			if( op=='-u' || op=='+u' ) {
				tex='\\left ( '+tex+' \\right )';
			}
		}
		return '+'+tex;
	},

	/** unary minus */
	'-u': (function(thing,texArgs,settings) {
		var tex = texArgs[0];
		if( thing.args[0].tok.type=='op' )
		{
			var op = thing.args[0].tok.name;
			if(
				op=='-u' || op=='+u' || 
				(!(op=='/' || op=='*') && jme.precedence[op]>jme.precedence['-u'])	//brackets are needed if argument is an operation which would be evaluated after negation
			) {
				tex='\\left ( '+tex+' \\right )';
			}
		}
		else if(thing.args[0].tok.type=='number' && thing.args[0].tok.value.complex) {
			var value = thing.args[0].tok.value;
			return settings.texNumber({complex:true,re:-value.re,im:-value.im});
		}
		return '-'+tex;
	}),

	/** exponentiation */
	'^': (function(thing,texArgs) {
		var tex0 = texArgs[0];
		//if left operand is an operation, it needs brackets round it. Exponentiation is right-associative, so 2^3^4 won't get any brackets, but (2^3)^4 will.
		if(thing.args[0].tok.type=='op' || (thing.args[0].tok.type=='function' && thing.args[0].tok.name=='exp'))
			tex0 = '\\left ( ' +tex0+' \\right )';	
		return (tex0+'^{ '+texArgs[1]+' }');
	}),


	'*': (function(thing,texArgs) {
		var s = texifyOpArg(thing,texArgs,0);
		for(var i=1; i<thing.args.length; i++ )
		{
			//specials or subscripts
			if(util.isInt(texArgs[i-1].charAt(texArgs[i-1].length-1)) && util.isInt(texArgs[i].charAt(0)))
			{ 
				s+=' \\times ';
			}
			else if(thing.args[i-1].tok.type=='special' || thing.args[i].tok.type=='special')	
			{
				s+=' ';
			}
			//anything times e^(something) or (not number)^(something)
			else if (jme.isOp(thing.args[i].tok,'^') && (thing.args[i].args[0].value==Math.E || thing.args[i].args[0].tok.type!='number'))	
			{
				s+=' ';
			}
			//real number times Pi or E
			else if (thing.args[i].tok.type=='number' && (thing.args[i].tok.value==Math.PI || thing.args[i].tok.value==Math.E || thing.args[i].tok.value.complex) && thing.args[i-1].tok.type=='number' && !(thing.args[i-1].tok.value.complex))	
			{
				s+=' ';
			}
			//number times a power of i
			else if (jme.isOp(thing.args[i].tok,'^') && thing.args[i].args[0].tok.type=='number' && math.eq(thing.args[i].args[0].tok.value,math.complex(0,1)) && thing.args[i-1].tok.type=='number')	
			{
				s+=' ';
			}
			// times sign when LHS or RHS is a factorial
			else if((thing.args[i-1].tok.type=='function' && thing.args[i-1].tok.name=='fact') || (thing.args[i].tok.type=='function' && thing.args[i].tok.name=='fact')) {
				s += ' \\times ';
			}
			//(anything except i) times i
			else if ( !(thing.args[i-1].tok.type=='number' && math.eq(thing.args[i-1].tok.value,math.complex(0,1))) && thing.args[i].tok.type=='number' && math.eq(thing.args[i].tok.value,math.complex(0,1)))
			{
				s+=' ';
			}
			else if ( thing.args[i].tok.type=='number'
					||
						jme.isOp(thing.args[i].tok,'-u')
					||
					(
						!jme.isOp(thing.args[i].tok,'-u') 
						&& (thing.args[i].tok.type=='op' && jme.precedence[thing.args[i].tok.name]<=jme.precedence['*'] 
							&& (thing.args[i].args[0].tok.type=='number' 
							&& thing.args[i].args[0].tok.value!=Math.E)
						)
					)
			)
			{
				s += ' \\times ';
			}
			else {
				s+= ' ';
			}
			s += texifyOpArg(thing,texArgs,i);
		}
		return s;
	}),
	'/': (function(thing,texArgs) { return ('\\frac{ '+texArgs[0]+' }{ '+texArgs[1]+' }'); }),
	'+': (function(thing,texArgs,settings) {
		var a = thing.args[0];
		var b = thing.args[1];
		if(jme.isOp(b.tok,'+u') || jme.isOp(b.tok,'-u')) {
			return texArgs[0]+' + \\left ( '+texArgs[1]+' \\right )';
		} else {
			return texArgs[0]+' + '+texArgs[1];
		}
	}),
	'-': (function(thing,texArgs,settings) {
		var a = thing.args[0];
		var b = thing.args[1];
		if(b.tok.type=='number' && b.tok.value.complex && b.tok.value.re!=0) {
			var texb = settings.texNumber(math.complex(b.tok.value.re,-b.tok.value.im));
			return texArgs[0]+' - '+texb;
		}
		else{
			if(jme.isOp(b.tok,'+') || jme.isOp(b.tok,'-') || jme.isOp(b.tok,'+u') || jme.isOp(b.tok,'-u'))
				return texArgs[0]+' - \\left ( '+texArgs[1]+' \\right )';
			else
				return texArgs[0]+' - '+texArgs[1];
		}
	}),
	'dot': infixTex('\\cdot'),
	'cross': infixTex('\\times'),
	'transpose': (function(thing,texArgs) {
		var tex = texArgs[0];
		if(thing.args[0].tok.type=='op')
			tex = '\\left ( ' +tex+' \\right )';
		return (tex+'^{\\mathrm{T}}');
	}),
	'..': infixTex('\\dots'),
	'except': infixTex('\\operatorname{except}'),
	'<': infixTex('\\lt'),
	'>': infixTex('\\gt'),
	'<=': infixTex('\\leq'),
	'>=': infixTex('\\geq'),
	'<>': infixTex('\neq'),
	'=': infixTex('='),
	'and': infixTex('\\wedge'),
	'or': infixTex('\\vee'),
	'xor': infixTex('\\, \\textrm{XOR} \\,'),
	'implies': infixTex('\\to'),
	'|': infixTex('|'),
	'abs': (function(thing,texArgs,settings) { 
		var arg;
		if(thing.args[0].tok.type=='vector')
			arg = texVector(thing.args[0].tok.value,settings);
		else if(thing.args[0].tok.type=='function' && thing.args[0].tok.name=='vector')
			arg = texVector(thing.args[0],settings);
		else if(thing.args[0].tok.type=='matrix')
			arg = texMatrix(thing.args[0].tok.value,settings);
		else if(thing.args[0].tok.type=='function' && thing.args[0].tok.name=='matrix')
			arg = texMatrix(thing.args[0],settings);
		else
			arg = texArgs[0];
		return ('\\left | '+arg+' \\right |');
	}),
	'sqrt': (function(thing,texArgs) { return ('\\sqrt{ '+texArgs[0]+' }'); }),
	'exp': (function(thing,texArgs) { return ('e^{ '+texArgs[0]+' }'); }),
	'fact': (function(thing,texArgs)
			{
				if(thing.args[0].tok.type=='number' || thing.args[0].tok.type=='name')
				{
					return texArgs[0]+'!';
				}
				else
				{
					return '\\left ('+texArgs[0]+' \\right )!';
				}
			}),
	'ceil': (function(thing,texArgs) { return '\\left \\lceil '+texArgs[0]+' \\right \\rceil';}),
	'floor': (function(thing,texArgs) { return '\\left \\lfloor '+texArgs[0]+' \\right \\rfloor';}),
	'int': (function(thing,texArgs) { return ('\\int \\! '+texArgs[0]+' \\, \\mathrm{d}'+texArgs[1]); }),
	'defint': (function(thing,texArgs) { return ('\\int_{'+texArgs[2]+'}^{'+texArgs[3]+'} \\! '+texArgs[0]+' \\, \\mathrm{d}'+texArgs[1]); }),
	'diff': (function(thing,texArgs) 
			{
				var degree = (thing.args[2].tok.type=='number' && thing.args[2].tok.value==1) ? '' : '^{'+texArgs[2]+'}';
				if(thing.args[0].tok.type=='name')
				{
					return ('\\frac{\\mathrm{d}'+degree+texArgs[0]+'}{\\mathrm{d}'+texArgs[1]+degree+'}');
				}
				else
				{
					return ('\\frac{\\mathrm{d}'+degree+'}{\\mathrm{d}'+texArgs[1]+degree+'} \\left ('+texArgs[0]+' \\right )');
				}
			}),
	'partialdiff': (function(thing,texArgs) 
			{ 
				var degree = (thing.args[2].tok.type=='number' && thing.args[2].tok.value==1) ? '' : '^{'+texArgs[2]+'}';
				if(thing.args[0].tok.type=='name')
				{
					return ('\\frac{\\partial '+degree+texArgs[0]+'}{\\partial '+texArgs[1]+degree+'}');
				}
				else
				{
					return ('\\frac{\\partial '+degree+'}{\\partial '+texArgs[1]+degree+'} \\left ('+texArgs[0]+' \\right )');
				}
			}),
	'sub': (function(thing,texArgs) {
		return texArgs[0]+'_{ '+texArgs[1]+' }';
	}),
	'sup': (function(thing,texArgs) {
		return texArgs[0]+'^{ '+texArgs[1]+' }';
	}),
	'limit': (function(thing,texArgs) { return ('\\lim_{'+texArgs[1]+' \\to '+texArgs[2]+'}{'+texArgs[0]+'}'); }),
	'mod': (function(thing,texArgs) {return texArgs[0]+' \\pmod{'+texArgs[1]+'}';}),
	'perm': (function(thing,texArgs) { return '^{'+texArgs[0]+'}\\kern-2pt P_{'+texArgs[1]+'}';}),
	'comb': (function(thing,texArgs) { return '^{'+texArgs[0]+'}\\kern-1pt C_{'+texArgs[1]+'}';}),
	'root': (function(thing,texArgs) { return '\\sqrt['+texArgs[1]+']{'+texArgs[0]+'}'; }),
	'if': (function(thing,texArgs) 
			{
				for(var i=0;i<3;i++)
				{
					if(thing.args[i].args!==undefined)
						texArgs[i] = '\\left ( '+texArgs[i]+' \\right )';
				}
				return '\\textbf{If} \\; '+texArgs[0]+' \\; \\textbf{then} \\; '+texArgs[1]+' \\; \\textbf{else} \\; '+texArgs[2]; 
			}),
	'switch': funcTex('\\operatorname{switch}'),
	'gcd': funcTex('\\operatorname{gcd}'),
	'lcm': funcTex('\\operatorname{lcm}'),
	'trunc': funcTex('\\operatorname{trunc}'),
	'fract': funcTex('\\operatorname{fract}'),
	'degrees': funcTex('\\operatorname{degrees}'),
	'radians': funcTex('\\operatorname{radians}'),
	'round': funcTex('\\operatorname{round}'),
	'sign': funcTex('\\operatorname{sign}'),
	'random': funcTex('\\operatorname{random}'),
	'max': funcTex('\\operatorname{max}'),
	'min': funcTex('\\operatorname{min}'),
	'precround': funcTex('\\operatorname{precround}'),
	'siground': funcTex('\\operatorname{siground}'),
	'award': funcTex('\\operatorname{award}'),
	'hour24': nullaryTex('hour24'),
	'hour': nullaryTex('hour'),
	'ampm': nullaryTex('ampm'),
	'minute': nullaryTex('minute'),
	'second': nullaryTex('second'),
	'msecond': nullaryTex('msecond'),
	'dayofweek': nullaryTex('dayofweek'),
	'sin': funcTex('\\sin'),
	'cos': funcTex('\\cos'),
	'tan': funcTex('\\tan'),
	'sec': funcTex('\\sec'),
	'cot': funcTex('\\cot'),
	'cosec': funcTex('\\csc'),
	'arccos': funcTex('\\arccos'),
	'arcsin': funcTex('\\arcsin'),
	'arctan': funcTex('\\arctan'),
	'cosh': funcTex('\\cosh'),
	'sinh': funcTex('\\sinh'),
	'tanh': funcTex('\\tanh'),
	'coth': funcTex('\\coth'),
	'cosech': funcTex('\\operatorname{cosech}'),
	'sech': funcTex('\\operatorname{sech}'),
	'arcsinh': funcTex('\\operatorname{arcsinh}'),
	'arccosh': funcTex('\\operatorname{arccosh}'),
	'arctanh': funcTex('\\operatorname{arctanh}'),
	'ln': function(thing,texArgs,settings) {
		if(thing.args[0].tok.type=='function' && thing.args[0].tok.name=='abs')
			return '\\ln '+texArgs[0];
		else
			return '\\ln \\left ( '+texArgs[0]+' \\right )';
	},
	'log': funcTex('\\log_{10}'),
	'vector': (function(thing,texArgs,settings) {
		return '\\left ( '+texVector(thing,settings)+' \\right )';
	}),
	'rowvector': (function(thing,texArgs,settings) {
		if(thing.args[0].tok.type!='list')
			return texMatrix({args:[{args:thing.args}]},settings,true);
		else
			return texMatrix(thing,settings,true);
	}),
	'matrix': (function(thing,texArgs,settings) {
		return texMatrix(thing,settings,true);
	}),
	'listval': (function(thing,texArgs) {
		return texArgs[0]+' \\left['+texArgs[1]+'\\right]';
	}),
	'verbatim': (function(thing,texArgs) {
		return thing.args[0].tok.value;
	}),
	'set': function(thing,texArgs,settings) {
		if(thing.args.length==1 && thing.args[0].tok.type=='list') {
			return '\\left\\{ '+texify(thing.args[0],settings)+' \\right\\}';
		} else {
			return '\\left\\{ '+texArgs.join(', ')+' \\right\\}';
		}
	}
}

/** Convert a number to TeX, displaying it as a fractionm using {@link LissaJS.math.rationalApproximation}
 * @memberof LissaJS.jme.display
 * @private
 * 
 * @param {number} n
 * @returns {TeX}
 */
var texRationalNumber = jme.display.texRationalNumber = function(n)
{
	if(n.complex)
	{
		var re = texRationalNumber(n.re);
		var im = texRationalNumber(n.im)+' i';
		if(n.im==0)
			return re;
		else if(n.re==0)
		{
			if(n.im==1)
				return 'i';
			else if(n.im==-1)
				return '-i';
			else
				return im;
		}
		else if(n.im<0)
		{
			if(n.im==-1)
				return re+' - i';
			else
				return re+' '+im;
		}
		else
		{
			if(n.im==1)
				return re+' + '+'i';
			else
				return re+' + '+im;
		}

	}
	else
	{
		var piD;
		if((piD = math.piDegree(n)) > 0)
			n /= Math.pow(Math.PI,piD);

		var m;
		var out = math.niceNumber(n);
		if(m = out.match(math.re_scientificNumber)) {
			var mantissa = m[1];
			var exponent = m[2];
			if(exponent[0]=='+')
				exponent = exponent.slice(1);
			return mantissa+' \\times 10^{'+exponent+'}';
		}

		var f = math.rationalApproximation(Math.abs(n));
		if(f[1]==1)
			out = Math.abs(f[0]).toString();
		else
			out = '\\frac{'+f[0]+'}{'+f[1]+'}';
		if(n<0)
			out=' - '+out;

		switch(piD)
		{
		case 0:
			return out;
		case 1:
			if(n==-1)
				return '-\\pi';
			else
				return out+' \\pi';
		default:
			if(n==-1)
				return '-\\pi^{'+piD+'}';
			else
				return out+' \\pi^{'+piD+'}';
		}
	}
}

/** Convert a number to TeX, displaying it as a decimal.
 * @memberof LissaJS.jme.display
 * @private
 *
 * @param {number} n
 * @returns {TeX}
 */
function texRealNumber(n)
{
	if(n.complex)
	{
		var re = texRealNumber(n.re);
		var im = texRealNumber(n.im)+' i';
		if(n.im==0)
			return re;
		else if(n.re==0)
		{
			if(n.im==1)
				return 'i';
			else if(n.im==-1)
				return '-i';
			else
				return im;
		}
		else if(n.im<0)
		{
			if(n.im==-1)
				return re+' - i';
			else
				return re+' '+im;
		}
		else
		{
			if(n.im==1)
				return re+' + '+'i';
			else
				return re+' + '+im;
		}

	}
	else
	{
		if(n==Infinity)
			return '\\infty';
		else if(n==-Infinity)
			return '-\\infty';

		var piD;
		if((piD = math.piDegree(n)) > 0)
			n /= Math.pow(Math.PI,piD);

		var out = math.niceNumber(n);

		var m;
		if(m = out.match(math.re_scientificNumber)) {
			var mantissa = m[1];
			var exponent = m[2];
			if(exponent[0]=='+')
				exponent = exponent.slice(1);
			return mantissa+' \\times 10^{'+exponent+'}';
		}

		switch(piD)
		{
		case 0:
			return out;
		case 1:
			if(n==1)
				return '\\pi';
			else if(n==-1)
				return '-\\pi';
			else
				return out+' \\pi';
		default:
			if(n==1)
				return '\\pi^{'+piD+'}';
			else if(n==-1)
				return '-\\pi^{'+piD+'}';
			else
				return out+' \\pi^{'+piD+'}';
		}
	}
}

/** Convert a vector to TeX. If `settings.rowvector` is true, then it's set horizontally.
 * @memberof LissaJS.jme.display
 * @private
 * 
 * @param {number[]|LissaJS.jme.tree} v
 * @param {object} settings
 * @returns {TeX}
 */
function texVector(v,settings)
{
	var out;
	var elements;
	if(v.args)
	{
		elements = v.args.map(function(x){return texify(x,settings)});
	}
	else
	{
		var texNumber = settings.fractionnumbers ? texRationalNumber : texRealNumber;
		elements = v.map(function(x){return texNumber(x)});
	}
	if(settings.rowvector)
		out = elements.join(' , ');
	else
		out = '\\begin{matrix} '+elements.join(' \\\\ ')+' \\end{matrix}';
	return out;
}

/** Convert a matrix to TeX.
 * @memberof LissaJS.jme.display
 * @private
 *
 * @param {Array.Array.<number>|LissaJS.jme.tree} m
 * @param {object} settings
 * @param {boolean} parens - enclose the matrix in parentheses?
 * @returns {TeX}
 */
function texMatrix(m,settings,parens)
{
	var out;

	if(m.args)
	{
		var all_lists = true;
		var rows = m.args.map(function(x) {
			if(x.tok.type=='list') {
				return x.args.map(function(y){ return texify(y,settings); });
			} else {
				all_lists = false;
			}
		})
		if(!all_lists) {
			return '\\operatorname{matrix}(' + m.args.map(function(x){return texify(x,settings);}).join(',') +')';
		}
	}
	else
	{
		var texNumber = settings.fractionnumbers ? texRationalNumber : texRealNumber;
		var rows = m.map(function(x){
			return x.map(function(y){ return texNumber(y) });
		});
	}

	if(rows.length==1) {
		out = rows[0].join(', & ');
	}
	else {
		rows = rows.map(function(x) {
			return x.join(' & ');
		});
		out = rows.join(' \\\\ ');
	}

	if(parens)
		return '\\begin{pmatrix} '+out+' \\end{pmatrix}';
	else
		return '\\begin{matrix} '+out+' \\end{matrix}';
}

/** Dictionary of functions to convert specific name annotations to TeX
 *
 * @enum
 * @memberof LissaJS.jme.display
 */
var texNameAnnotations = jme.display.texNameAnnotations = {
	verbatim: function(name) {	//verbatim - use to get round things like i and e being interpreted as constants
		return name;
	},
	op: function(name) {
		return '\\operatorname{'+name+'}';
	},
	vector: function(name) {
		return '\\boldsymbol{'+name+'}';
	},
	unit: function(name) {	//unit vector
		return '\\hat{'+name+'}';
	},
	dot: function(name) {		//dot on top
		return '\\dot{'+name+'}';
	},
	matrix: function(name) {
		return '\\mathrm{'+name+'}';
	}
}
texNameAnnotations.verb = texNameAnnotations.verbatim;
texNameAnnotations.v = texNameAnnotations.vector;
texNameAnnotations.m = texNameAnnotations.matrix;


/** Convert a variable name to TeX
 * @memberof LissaJS.jme.display
 *
 * @param {string} name
 * @param {string[]} [annotations]
 * @param {function} [longNameMacro=texttt] - function which returns TeX for a long name
 * @returns {TeX}
 */

var texName = jme.display.texName = function(name,annotations,longNameMacro)
{
	longNameMacro = longNameMacro || (function(name){ return '\\texttt{'+name+'}'; });

	var oname = name;

	function applyAnnotations(name) {
		if(!annotations) {
			return name;
		}

		for(var i=0;i<annotations.length;i++)
		{
			var annotation = annotations[i];
			if(annotation in texNameAnnotations) {
				name = texNameAnnotations[annotation](name);
			} else {
				name = '\\'+annotation+'{'+name+'}';
			}
		}
		return name;
	}

	var num_subscripts = name.length - name.replace('_','').length;
	var re_math_variable = /^([^_]*[a-zA-Z])(?:(\d+)|_(\d+)|_([^']{1,2}))?('*)$/;
	var m,isgreek;
	// if the name is a single letter or greek letter name, followed by digits, subscripts or primes
	// m[1]: the "root" name - the bit before any digits, subscripts or primes
	// m[2]: digits immediately following the root
	// m[3]: digits in a subscript
	// m[4]: one or two non-prime characters in a subscript
	// m[5]: prime characters, at the end of the name
	if((m=name.match(re_math_variable)) && (m[1].length==1 || (isgreek=greek.contains(m[1])))) {
		if(isgreek) {
			m[1] = '\\'+m[1];
		}
		name = applyAnnotations(m[1]);
		var subscript = (m[2] || m[3] || m[4]);
		if(subscript) {
			name += '_{'+subscript+'}';
		}
		name += m[5];
	} else if(!name.match(/^\\/)) {
		name = applyAnnotations(longNameMacro(name));
	}

	return name;
}

var greek = ['alpha','beta','gamma','delta','epsilon','zeta','eta','theta','iota','kappa','lambda','mu','nu','xi','omicron','pi','rho','sigma','tau','upsilon','phi','chi','psi','omega']

/** Dictionary of functions to turn {@link LissaJS.jme.types} objects into TeX strings
 *
 * @enum
 * @memberof LissaJS.jme.display
 */
var typeToTeX = jme.display.typeToTeX = {
	'number': function(thing,tok,texArgs,settings) {
		if(tok.value==Math.E)
			return 'e';
		else if(tok.value==Math.PI)
			return '\\pi';
		else
			return settings.texNumber(tok.value);
	},
	'string': function(thing,tok,texArgs,settings) {
		if(tok.latex)
			return tok.value.replace(/\\([\{\}])/g,'$1');
		else
			return '\\textrm{'+tok.value+'}';
	},
	'boolean': function(thing,tok,texArgs,settings) {
		return tok.value ? 'true' : 'false';
	},
	range: function(thing,tok,texArgs,settings) {
		return tok.value[0]+ ' \\dots '+tok.value[1];
	},
	list: function(thing,tok,texArgs,settings) {
		if(!texArgs)
		{
			texArgs = [];
			for(var i=0;i<tok.vars;i++)
			{
				texArgs[i] = texify(tok.value[i],settings);
			}
		}
		return '\\left[ '+texArgs.join(', ')+' \\right]';
	},
	vector: function(thing,tok,texArgs,settings) {
		return ('\\left ( ' 
				+ texVector(tok.value,settings)
				+ ' \\right )' );
	},
	matrix: function(thing,tok,texArgs,settings) {
		return '\\left ( '+texMatrix(tok.value,settings)+' \\right )';
	},
	name: function(thing,tok,texArgs,settings) {
		return texName(tok.name,tok.annotation);
	},
	special: function(thing,tok,texArgs,settings) {
		return tok.value;
	},
	conc: function(thing,tok,texArgs,settings) {
		return texArgs.join(' ');
	},
	op: function(thing,tok,texArgs,settings) {
		return texOps[tok.name.toLowerCase()](thing,texArgs,settings);
	},
	'function': function(thing,tok,texArgs,settings) {
		var lowerName = tok.name.toLowerCase();
		if(texOps[lowerName]) {
			return texOps[lowerName](thing,texArgs,settings);
		}
		else {
			function texOperatorName(name) {
				return '\\operatorname{'+name.replace(/_/g,'\\_')+'}';
			}
			return texName(tok.name,tok.annotation,texOperatorName)+' \\left ( '+texArgs.join(', ')+' \\right )';
		}
	},
	set: function(thing,tok,texArgs,settings) {
		texArgs = [];
		for(var i=0;i<tok.value.length;i++) {
			texArgs.push(texify(tok.value[i],settings));
		}
		return '\\left\\{ '+texArgs.join(', ')+' \\right\\}';
	}
}
/** Turn a syntax tree into a TeX string. Data types can be converted to TeX straightforwardly, but operations and functions need a bit more care.
 *
 * The idea here is that each function and op has a function associated with it which takes a syntax tree with that op at the top and returns the appropriate TeX
 *
 * @memberof LissaJS.jme.display
 * @method
 *
 * @param {LissaJS.jme.tree} thing
 * @param {object} settings
 *
 * @returns {TeX}
 */
var texify = LissaJS.jme.display.texify = function(thing,settings)
{
	if(!thing)
		return '';

	if(!settings)
		settings = {};

	if(thing.args)
	{
		var texArgs = [];
		for(var i=0; i<thing.args.length; i++ )
		{
			texArgs[i] = texify(thing.args[i],settings);
		}
	}

	settings.texNumber = settings.fractionnumbers ? texRationalNumber : texRealNumber;

	var tok = thing.tok || thing;
	if(tok.type in typeToTeX) {
		return typeToTeX[tok.type](thing,tok,texArgs,settings);
	} else {
		throw(new LissaJS.Error(R('jme.display.unknown token type',tok.type)));
	}
}

/** Write a number in JME syntax as a fraction, using {@link LissaJS.math.rationalApproximation}
 *
 * @memberof LissaJS.jme.display
 * @private
 *
 * @param {number} n
 * @param {object} settings - if `settings.niceNumber===false`, don't round off numbers
 * @returns {JME}
 */
var jmeRationalNumber = jme.display.jmeRationalNumber = function(n,settings)
{
	settings = settings || {};
	if(n.complex)
	{
		var re = jmeRationalNumber(n.re);
		var im = jmeRationalNumber(n.im)+'i';
		if(n.im==0)
			return re;
		else if(n.re==0)
		{
			if(n.im==1)
				return 'i';
			else if(n.im==-1)
				return '-i';
			else
				return im;
		}
		else if(n.im<0)
		{
			if(n.im==-1)
				return re+' - i';
			else
				return re+' - '+jmeRationalNumber(-n.im)+'i';
		}
		else
		{
			if(n.im==1)
				return re+' + '+'i';
			else
				return re+' + '+im;
		}

	}
	else
	{
		var piD;
		if((piD = math.piDegree(n)) > 0)
			n /= Math.pow(Math.PI,piD);

		
		var m;
		var out;
		if(settings.niceNumber===false) {
			out = n+'';
		} else {
			out = math.niceNumber(n);
		}
		if(m = out.match(math.re_scientificNumber)) {
			var mantissa = m[1];
			var exponent = m[2];
			if(exponent[0]=='+')
				exponent = exponent.slice(1);
			return mantissa+'*10^('+exponent+')';
		}

		var f = math.rationalApproximation(Math.abs(n));
		if(f[1]==1)
			out = Math.abs(f[0]).toString();
		else
			out = f[0]+'/'+f[1];
		if(n<0)
			out=' - '+out;

		switch(piD)
		{
		case 0:
			return out;
		case 1:
			return out+' pi';
		default:
			return out+' pi^'+piD;
		}
	}
}

/** Write a number in JME syntax as a decimal.
 *
 * @memberof LissaJS.jme.display
 * @private
 *
 * @param {number} n
 * @param {object} settings - if `settings.niceNumber===false`, don't round off numbers
 * @returns {JME}
 */
function jmeRealNumber(n,settings)
{
	settings = settings || {};
	if(n.complex)
	{
		var re = jmeRealNumber(n.re);
		var im = jmeRealNumber(n.im);
		if(im[im.length-1].match(/[a-zA-Z]/))
			im += '*i';
		else
			im += 'i';

		if(n.im==0)
			return re;
		else if(n.re==0)
		{
			if(n.im==1)
				return 'i';
			else if(n.im==-1)
				return '-i';
			else
				return im;
		}
		else if(n.im<0)
		{
			if(n.im==-1)
				return re+' - i';
			else
				return re+' - '+jmeRealNumber(-n.im)+'i';
		}
		else
		{
			if(n.im==1)
				return re+' + i';
			else
				return re+' + '+im;
		}

	}
	else
	{
		if(n==Infinity)
			return 'infinity';
		else if(n==-Infinity)
			return '-infinity';

		var piD;
		if((piD = math.piDegree(n)) > 0)
			n /= Math.pow(Math.PI,piD);

		var out;
		if(settings.niceNumber===false) {
			out = n+'';
		} else {
			out = math.niceNumber(n);
		}

		var m;
		if(m = out.match(math.re_scientificNumber)) {
			var mantissa = m[1];
			var exponent = m[2];
			if(exponent[0]=='+')
				exponent = exponent.slice(1);
			return mantissa+'*10^('+exponent+')';
		}

		
		switch(piD)
		{
		case 0:
			return out;
		case 1:
			if(n==1)
				return 'pi';
			else
				return out+' pi';
		default:
			if(n==1)
				return 'pi^'+piD;
			else
				return out+' pi^'+piD;
		}
	}
}

/** Dictionary of functions to turn {@link LissaJS.jme.types} objects into JME strings
 *
 * @enum
 * @memberof LissaJS.jme.display
 */
var typeToJME = LissaJS.jme.display.typeToJME = {
	'number': function(tree,tok,bits,settings) {
		switch(tok.value)
		{
		case Math.E:
			return 'e';
		case Math.PI:
			return 'pi';
		default:
			return settings.jmeNumber(tok.value,settings);
		}
	},
	name: function(tree,tok,bits,settings) {
		return tok.name;
	},
	'string': function(tree,tok,bits,settings) {
		var str = tok.value
					.replace(/\\/g,'\\\\')
					.replace(/\\([{}])/g,'$1')
					.replace(/\n/g,'\\n')
					.replace(/"/g,'\\"')
					.replace(/'/g,"\\'")
		;
		return '"'+str+'"';
	},
	'boolean': function(tree,tok,bits,settings) {
		return (tok.value ? 'true' : 'false');
	},
	range: function(tree,tok,bits,settings) {
		return tok.value[0]+'..'+tok.value[1]+(tok.value[2]==1 ? '' : '#'+tok.value[2]);
	},
	list: function(tree,tok,bits,settings) {
		if(!bits)
		{
			if(tok.value) {
				bits = tok.value.map(function(b){return treeToJME({tok:b},settings);});
			}
			else {
				bits = [];
			}
		}
		return '[ '+bits.join(', ')+' ]';
	},
	vector: function(tree,tok,bits,settings) {
		return 'vector('+tok.value.map(function(n){ return settings.jmeNumber(n,settings)}).join(',')+')';
	},
	matrix: function(tree,tok,bits,settings) {
		return 'matrix('+
			tok.value.map(function(row){return '['+row.map(function(n){ return settings.jmeNumber(n,settings)}).join(',')+']'}).join(',')+')';
	},
	'function': function(tree,tok,bits,settings) {
		if(!bits) {
			return tok.name+'()';
		} else {
			return tok.name+'('+bits.join(',')+')';
		}
	},
	op: function(tree,tok,bits,settings) {
		var op = tok.name;
		var args = tree.args, l = args.length;

		for(var i=0;i<l;i++)
		{
			var arg_type = args[i].tok.type;
			var arg_value = args[i].tok.value;
			var pd;

			if(arg_type=='op' && op in opBrackets && opBrackets[op][i][args[i].tok.name]==true)
			{
				bits[i]='('+bits[i]+')';
				args[i].bracketed=true;
			}
			else if(arg_type=='number' && arg_value.complex && (op=='*' || op=='-u' || op=='/'))	// put brackets round a complex number
			{
				if(arg_value.im!=0 && !(arg_value.im==1 && arg_value.re==0))
				{
					bits[i] = '('+bits[i]+')';
					args[i].bracketed = true;
				}
			} else if(arg_type=='number' && (pd = math.piDegree(args[i].tok.value))>0 && arg_value/math.pow(Math.PI,pd)>1 && (op=='*' || op=='-u' || op=='/')) {
				bits[i] = '('+bits[i]+')';
				args[i].bracketed = true;
			}
		}
		
		//omit multiplication symbol when not necessary
		if(op=='*')
		{
			//number or brackets followed by name or brackets doesn't need a times symbol
			//except <anything>*(-<something>) does
			if( ((args[0].tok.type=='number' && math.piDegree(args[0].tok.value)==0 && args[0].tok.value!=Math.E) || args[0].bracketed) && (args[1].tok.type == 'name' || args[1].bracketed && !jme.isOp(tree.args[1].tok,'-u')) )	
			{
				op = '';
			}
		}

		switch(op)
		{
		case '+u':
			op='+';
			break;
		case '-u':
			op='-';
			if(args[0].tok.type=='number' && args[0].tok.value.complex)
				return settings.jmeNumber({complex:true, re: -args[0].tok.value.re, im: -args[0].tok.value.im},settings);
			break;
		case '-':
			var b = args[1].tok.value;
			if(args[1].tok.type=='number' && args[1].tok.value.complex && args[1].tok.value.re!=0) {
				return bits[0]+' - '+settings.jmeNumber(math.complex(b.re,-b.im),settings);
			}
			op = ' - ';
			break;
		case 'and':
		case 'or':
		case 'isa':
		case 'except':
		case '+':
			op=' '+op+' ';
			break;
		case 'not':
			op = 'not ';
		}

		if(l==1)
			{return op+bits[0];}
		else
			{return bits[0]+op+bits[1];}
	},
	set: function(tree,tok,bits,settings) {
		return 'set('+tok.value.map(function(thing){return treeToJME({tok:thing},settings);}).join(',')+')';
	},

	expression: function(tree,tok,bits,settings) {
		return treeToJME(tok.tree);
	}
}

/** Turn a syntax tree back into a JME expression (used when an expression is simplified)
 * @memberof LissaJS.jme.display
 * @method
 * 
 * @param {LissaJS.jme.tree} tree
 * @param {object} settings
 * @returns {JME}
 */
var treeToJME = jme.display.treeToJME = function(tree,settings)
{
	if(!tree)
		return '';

	settings = settings || {};

	var args=tree.args, l;

	if(args!==undefined && ((l=args.length)>0))
	{
		var bits = args.map(function(i){return treeToJME(i,settings)});
	}

    settings.jmeNumber = settings.fractionnumbers ? jmeRationalNumber : jmeRealNumber;

	var tok = tree.tok;
	if(tok.type in typeToJME) {
		return typeToJME[tok.type](tree,tok,bits,settings);
	} else {
		throw(new LissaJS.Error(R('jme.display.unknown token type',tok.type)));
	}
}


/** Does each argument (of an operation) need brackets around it?
 *
 * Arrays consisting of one object for each argument of the operation
 * @enum
 * @memberof LissaJS.jme.display
 * @private
 */
var opBrackets = LissaJS.jme.display.opBrackets = {
	'+u':[{}],
	'-u':[{'+':true,'-':true}],
	'+': [{},{}],
	'-': [{},{'+':true,'-':true}],
	'*': [{'+u':true,'-u':true,'+':true, '-':true, '/':true},{'+u':true,'-u':true,'+':true, '-':true, '/':true}],
	'/': [{'+u':true,'-u':true,'+':true, '-':true, '*':true},{'+u':true,'-u':true,'+':true, '-':true, '*':true}],
	'^': [{'+u':true,'-u':true,'+':true, '-':true, '*':true, '/':true},{'+u':true,'-u':true,'+':true, '-':true, '*':true, '/':true}],
	'and': [{'or':true, 'xor':true},{'or':true, 'xor':true}],
	'or': [{'xor':true},{'xor':true}],
	'xor':[{},{}],
	'=': [{},{}]
};

/** Simplification rule
 * @memberof LissaJS.jme.display
 * @constructor
 *
 * @param {JME} pattern - expression pattern to match. Variables will match any sub-expression.
 * @param {JME[]} conditions - conditions as expressions in JME expressions on the matched variables, which must all evaluate to true for the rule to match.
 * @param {JME} result - expression pattern to rewrite to.
 * 
 * @property {JME} patternString - the JME string defining the pattern to match
 * @property {JME} resultString - the JME string defining the result of the rule
 * @property {JME} conditionStrings - JME strings defining the conditions
 * @property {LissaJS.jme.tree} tree - `patternString` compiled to a syntax tree
 * @property {LissaJS.jme.tree} result - `result` compiled to a syntax tree
 * @property {LissaJS.jme.tree[]} conditions `conditions` compiled to syntax trees
 */
var Rule = jme.display.Rule = function(pattern,conditions,result)
{
	this.patternString = pattern;
	this.tree = jme.compile(pattern,{},true);

	this.resultString = result;
	this.result = jme.compile(result,{},true);

	this.conditionStrings = conditions.slice();
	this.conditions = [];
	for(var i=0;i<conditions.length;i++)
	{
		this.conditions.push(jme.compile(conditions[i],{},true));
	}
}

Rule.prototype = /** @lends LissaJS.jme.display.Rule.prototype */ {
	/** Match a rule on given syntax tree.
	 * @memberof LissaJS.jme.display.Rule.prototype
	 * @param {LissaJS.jme.tree} exprTree - the syntax tree to test
	 * @param {LissaJS.jme.Scope} scope - used when checking conditions
	 * @returns {boolean|object} - `false` if no match, or a dictionary of matched subtrees
	 */
	match: function(exprTree,scope)
	{
		//see if expression matches rule
		var match = matchTree(this.tree,exprTree);
		if(match==false)
			return false;

		//if expression matches rule, then match is a dictionary of matched variables
		//check matched variables against conditions
		if(this.matchConditions(match,scope))
			return match;
		else
			return false;
	},

	/** Check that a matched pattern satisfies all the rule's conditions
	 * @memberof LissaJS.jme.display.Rule.prototype
	 * @param {object} match
	 * @param {LissaJS.jme.Scope} scope
	 * @returns {boolean}
	 */
	matchConditions: function(match,scope)
	{
		for(var i=0;i<this.conditions.length;i++)
		{
			var c = LissaJS.util.copyobj(this.conditions[i],true);
			c = jme.substituteTree(c,new jme.Scope([{variables:match}]));
			try
			{
				var result = jme.evaluate(c,scope);
				if(result.value==false)
					return false;
			}
			catch(e)
			{
				return false;
			}
		}
		return true;
	}
}

var endTermNames = {
	'??':true,
	'm_nothing':true,
	'm_number': true
}
function isEndTerm(term) {
	while(term.tok.type=='function' && /^m_(?:all|pm|not|commute)$/.test(term.tok.name) || jme.isOp(term.tok,';')) {
		term = term.args[0];
	}
	if(term.tok.type=='function' && term.tok.name=='m_any') {
		for(var i=0;i<term.args.length;i++) {
			if(isEndTerm(term.args[i])) {
				return true;
			}
		}
		return false;
	}
	return term.tok.type=='name' && endTermNames[term.tok.name];
}

function getCommutingTerms(tree,op,names) {
	if(names===undefined) {
		names = [];
	}

	if(op=='+' && jme.isOp(tree.tok,'-')) {
		tree = {tok: new jme.types.TOp('+'), args: [tree.args[0],{tok: new jme.types.TOp('-u'), args: [tree.args[1]]}]};
	}

	if(!tree.args || tree.tok.name!=op) {
		return {terms: [tree], termnames: names.slice()};
	}

	var terms = [];
	var termnames = [];
	var rest = [];
	var restnames = [];
	for(var i=0; i<tree.args.length;i++) {
		var arg = tree.args[i];
		var oarg = arg;
		var argnames = names.slice();
		while(jme.isOp(arg.tok,';')) {
			argnames.push(arg.args[1].tok.name);
			arg = arg.args[0];
		}
		if(jme.isOp(arg.tok,op) || (op=='+' && jme.isOp(arg.tok,'-'))) {
			var sub = getCommutingTerms(arg,op,argnames);
			terms = terms.concat(sub.terms);
			termnames = termnames.concat(sub.termnames);
		} else if(jme.isName(arg.tok,'?') || isEndTerm(arg)) {
			rest.push(arg);
			restnames.push(argnames);
		} else {
			terms.push(arg);
			termnames.push(argnames);
		}
	}
	if(rest.length) {
		terms = terms.concat(rest);
		termnames = termnames.concat(restnames);
	}
	return {terms: terms, termnames: termnames};
}
LissaJS.jme.display.getCommutingTerms = getCommutingTerms;

/** Recusrively check whether `exprTree` matches `ruleTree`. Variables in `ruleTree` match any subtree.
 * @memberof LissaJS.jme.display
 *
 * @param {LissaJS.jme.tree} ruleTree
 * @param {LissaJS.jme.tree} exprTree
 * @param {boolean} doCommute - take commutativity of operations into account, e.g. terms of a sum can be in any order.
 * @returns {boolean|object} - `false` if no match, otherwise a dictionary of subtrees matched to variable names
 */
function matchTree(ruleTree,exprTree,doCommute)
{
	if(doCommute===undefined) {
		doCommute = false;
	}
	if(!exprTree)
		return false;

	var ruleTok = ruleTree.tok;
	var exprTok = exprTree.tok;

	if(jme.isOp(ruleTok,';')) {
		if(ruleTree.args[1].tok.type!='name') {
			throw(new LissaJS.Error('jme.matchTree.group name not a name'));
		}
		var name = ruleTree.args[1].tok.name;
		var m = matchTree(ruleTree.args[0],exprTree,doCommute);
		if(m) {
			m[name] = exprTree;
			return m;
		} else {
			return false;
		}
	}

	if(ruleTok.type=='name')
	{
		switch(ruleTok.name) {
			case '?':
			case '??':
				return {};
			case 'm_number':
				return exprTok.type=='number' ? {} : false;
		}
	}

	if(ruleTok.type=='function') {
		switch(ruleTok.name) {
			case 'm_any':
				for(var i=0;i<ruleTree.args.length;i++) {
					var m;
					if(m=matchTree(ruleTree.args[i],exprTree,doCommute)) {
						return m;
					}
				}
				return false;

			case 'm_all':
				return matchTree(ruleTree.args[0],exprTree,doCommute);

			case 'm_pm':
				if(jme.isOp(exprTok,'-u')) {
					return matchTree({tok: new jme.types.TOp('-u'),args: [ruleTree.args[0]]},exprTree,doCommute);
				} else {
					return matchTree(ruleTree.args[0],exprTree,doCommute);
				}

			case 'm_not':
				if(!matchTree(ruleTree.args[0],exprTree,doCommute)) {
					return {};
				} else {
					return false;
				}

			case 'm_and':
				var d = {};
				for(var i=0;i<ruleTree.args.length;i++) {
					var m = matchTree(ruleTree.args[i],exprTree,doCommute);
					if(m) {
						for(var name in m) {
							d[name] = m[name];
						}
					} else {
						return false;
					}
				}
				return d;

			case 'm_uses':
				var vars = jme.findvars(exprTree);
				for(var i=0;i<ruleTree.args.length;i++) {
					var name = ruleTree.args[i].tok.name;
					if(!vars.contains(name)) {
						return false;
					}
				}
				return {};

			case 'm_commute':
				return matchTree(ruleTree.args[0],exprTree,true);

			case 'm_type':
				var wantedType = ruleTree.args[0].tok.name || ruleTree.args[0].tok.value;
				if(exprTok.type==wantedType) {
					return {};
				} else {
					return false;
				}
		}
	}
	if(jme.isName(ruleTok,'m_nothing')) {
		return false;
	} else if(jme.isName(ruleTok,'m_number')) {
		if(exprTok.type=='number') {
			return {};
		} else {
			return false;
		}
	}

	if(ruleTok.type!='op' && ruleTok.type != exprTok.type)
	{
		return false;
	}

	switch(ruleTok.type)
	{
	case 'number':
		if( !math.eq(ruleTok.value,exprTok.value) ) {
			return false;
		} else {
			return {};
		}

	case 'string':
	case 'boolean':
	case 'special':
	case 'range':
		if(ruleTok.value != exprTok.value) {
			return false;
		} else {
			return {};
		}

	case 'function':
	case 'op':
		var d = {};

		if(doCommute && jme.commutative[ruleTok.name]) {
			var commutingOp = ruleTok.name;

			var ruleTerms = getCommutingTerms(ruleTree,commutingOp);
			var exprTerms = getCommutingTerms(exprTree,commutingOp);
			var rest = [];

			var namedTerms = {};
			var matchedRules = [];
			var termMatches = [];

			for(var i=0; i<exprTerms.terms.length; i++) {
				var m = null;
				var matched = false;
				for(var j=0; j<ruleTerms.terms.length; j++) {
					var ruleTerm = ruleTerms.terms[j];
					m = matchTree(ruleTerm,exprTerms.terms[i],doCommute);
					if((!matchedRules[j] || ruleTerm.tok.name=='m_all') && m) {
						matched = true;
						matchedRules[j] = true;
						for(var name in m) {
							if(!namedTerms[name]) {
								namedTerms[name] = [];
							}
							namedTerms[name].push(m[name]);
						}
						var names = ruleTerms.termnames[j];
						if(names) {
							for(var k=0;k<names.length;k++) {
								var name = names[k];
								if(!namedTerms[name]) {
									namedTerms[name] = [];
								}
								namedTerms[name].push(exprTerms.terms[i]);
							}
						}
						break;
					}
				}
				if(!matched) {
					return false;
				}
			}
			for(var i=0;i<ruleTerms.terms.length;i++) {
				var term = ruleTerms.terms[i];
				if(!isEndTerm(term) && !matchedRules[i]) {
					return false;
				}
			}
			for(var name in namedTerms) {
				var terms = namedTerms[name];
				var sub = terms[0];
				for(var i=1;i<terms.length;i++) {
					var op = new jme.types.TOp(commutingOp);
					sub = {tok: op, args: [sub,terms[i]]};
				}
				d[name] = sub;
			}
			return d;
		} else {
			if(ruleTok.type!=exprTok.type || ruleTok.name!=exprTok.name) {
				return false;
			}
			for(var i=0;i<ruleTree.args.length;i++)
			{
				var m = matchTree(ruleTree.args[i],exprTree.args[i],doCommute);
				if(m==false) {
					return false;
				} else {
					for(var x in m) {
						d[x]=m[x];
					}
				}
			}
			return d
		}
	case 'name':
		if(ruleTok.name.toLowerCase()==exprTok.name.toLowerCase()) {
			return {};
		} else {
			return false;
		}
	default:
		return {};
	}
}
jme.display.matchTree = matchTree;

/** Match expresison against a pattern. Wrapper for {@link LissaJS.jme.display.matchTree}
 *
 * @memberof LissaJS.jme.display
 * @method
 *
 * @param {JME} pattern
 * @param {JME} expr
 * @param {boolean} doCommute
 *
 * @returns {boolean|object} - `false` if no match, otherwise a dictionary of subtrees matched to variable names
 */
var matchExpression = jme.display.matchExpression = function(pattern,expr,doCommute) {
	pattern = jme.compile(pattern);
	expr = jme.compile(expr);
	return matchTree(pattern,expr,doCommute);
}

/** Built-in simplification rules
 * @enum {LissaJS.jme.display.Rule[]}
 * @memberof LissaJS.jme.display
 */
var simplificationRules = jme.display.simplificationRules = {
	basic: [
		['+(?;x)',[],'x'],					//get rid of unary plus
		['?;x+(-?;y)',[],'x-y'],			//plus minus = minus
		['?;x+?;y',['y<0'],'x-eval(-y)'],
		['?;x-?;y',['y<0'],'x+eval(-y)'],
		['?;x-(-?;y)',[],'x+y'],			//minus minus = plus
		['-(-?;x)',[],'x'],				//unary minus minus = plus
		['-?;x',['x isa "complex"','re(x)<0'],'eval(-x)'],
		['?;x+?;y',['x isa "number"','y isa "complex"','re(y)=0'],'eval(x+y)'],
		['-?;x+?;y',['x isa "number"','y isa "complex"','re(y)=0'],'-eval(x-y)'],
		['(-?;x)/?;y',[],'-(x/y)'],			//take negation to left of fraction
		['?;x/(-?;y)',[],'-(x/y)'],			
		['(-?;x)*?;y',[],'-(x*y)'],			//take negation to left of multiplication
		['?;x*(-?;y)',[],'-(x*y)'],		
		['?;x+(?;y+?;z)',[],'(x+y)+z'],		//make sure sums calculated left-to-right
		['?;x-(?;y+?;z)',[],'(x-y)-z'],
		['?;x+(?;y-?;z)',[],'(x+y)-z'],
		['?;x-(?;y-?;z)',[],'(x-y)+z'],
		['(?;x*?;y)*?;z',[],'x*(y*z)'],		//make sure multiplications go right-to-left
		['?;n*i',['n isa "number"'],'eval(n*i)'],			//always collect multiplication by i
		['i*?;n',['n isa "number"'],'eval(n*i)']
	],

	unitFactor: [
		['1*?;x',[],'x'],
		['?;x*1',[],'x']
	],

	unitPower: [
		['?;x^1',[],'x']
	],

	unitDenominator: [
		['?;x/1',[],'x']
	],

	zeroFactor: [
		['?;x*0',[],'0'],
		['0*?;x',[],'0'],
		['0/?;x',[],'0']
	],

	zeroTerm: [
		['0+?;x',[],'x'],
		['?;x+0',[],'x'],
		['?;x-0',[],'x'],
		['0-?;x',[],'-x']
	],

	zeroPower: [
		['?;x^0',[],'1']
	],

	noLeadingMinus: [
		['-?;x+?;y',[],'y-x'],											//don't start with a unary minus
		['-0',[],'0']
	],

	collectNumbers: [
		['-?;x-?;y',['x isa "number"','y isa "number"'],'-(x+y)'],										//collect minuses
		['?;n+?;m',['n isa "number"','m isa "number"'],'eval(n+m)'],	//add numbers
		['?;n-?;m',['n isa "number"','m isa "number"'],'eval(n-m)'],	//subtract numbers
		['?;n+?;x',['n isa "number"','!(x isa "number")'],'x+n'],		//add numbers last

		['(?;x+?;n)+?;m',['n isa "number"','m isa "number"'],'x+eval(n+m)'],	//collect number sums
		['(?;x-?;n)+?;m',['n isa "number"','m isa "number"'],'x+eval(m-n)'],	
		['(?;x+?;n)-?;m',['n isa "number"','m isa "number"'],'x+eval(n-m)'],	
		['(?;x-?;n)-?;m',['n isa "number"','m isa "number"'],'x-eval(n+m)'],	
		['(?;x+?;n)+?;y',['n isa "number"'],'(x+y)+n'],						//shift numbers to right hand side
		['(?;x+?;n)-?;y',['n isa "number"'],'(x-y)+n'],
		['(?;x-?;n)+?;y',['n isa "number"'],'(x+y)-n'],
		['(?;x-?;n)-?;y',['n isa "number"'],'(x-y)-n'],

		['?;n*?;m',['n isa "number"','m isa "number"'],'eval(n*m)'],		//multiply numbers
		['?;x*?;n',['n isa "number"','!(x isa "number")','n<>i'],'n*x'],			//shift numbers to left hand side
		['?;m*(?;n*?;x)',['m isa "number"','n isa "number"'],'eval(n*m)*x']
	],

	simplifyFractions: [
		['?;n/?;m',['n isa "number"','m isa "number"','gcd_without_pi_or_i(n,m)>1'],'eval(n/gcd_without_pi_or_i(n,m))/eval(m/gcd_without_pi_or_i(n,m))'],			//cancel simple fraction
		['(?;n*?;x)/?;m',['n isa "number"','m isa "number"','gcd_without_pi_or_i(n,m)>1'],'(eval(n/gcd_without_pi_or_i(n,m))*x)/eval(m/gcd_without_pi_or_i(n,m))'],	//cancel algebraic fraction
		['?;n/(?;m*?;x)',['n isa "number"','m isa "number"','gcd_without_pi_or_i(n,m)>1'],'eval(n/gcd_without_pi_or_i(n,m))/(eval(m/gcd_without_pi_or_i(n,m))*x)'],	
		['(?;n*?;x)/(?;m*?;y)',['n isa "number"','m isa "number"','gcd_without_pi_or_i(n,m)>1'],'(eval(n/gcd_without_pi_or_i(n,m))*x)/(eval(m/gcd_without_pi_or_i(n,m))*y)'],
		['?;n/?;m',['n isa "complex"','m isa "complex"','re(n)=0','re(m)=0'],'eval(n/i)/eval(m/i)']			// cancel i when numerator and denominator are both purely imaginary
	],

	zeroBase: [
		['0^?;x',[],'0']
	],

	constantsFirst: [
		['?;x*?;n',['n isa "number"','!(x isa "number")','n<>i'],'n*x'],
		['?;x*(?;n*?;y)',['n isa "number"','n<>i','!(x isa "number")'],'n*(x*y)']
	],

	sqrtProduct: [
		['sqrt(?;x)*sqrt(?;y)',[],'sqrt(x*y)']
	],

	sqrtDivision: [
		['sqrt(?;x)/sqrt(?;y)',[],'sqrt(x/y)']
	],

	sqrtSquare: [
		['sqrt(?;x^2)',[],'x'],
		['sqrt(?;x)^2',[],'x'],
		['sqrt(?;n)',['n isa "number"','isint(sqrt(n))'],'eval(sqrt(n))']
	],

	trig: [
		['sin(?;n)',['n isa "number"','isint(2*n/pi)'],'eval(sin(n))'],
		['cos(?;n)',['n isa "number"','isint(2*n/pi)'],'eval(cos(n))'],
		['tan(?;n)',['n isa "number"','isint(n/pi)'],'0'],
		['cosh(0)',[],'1'],
		['sinh(0)',[],'0'],
		['tanh(0)',[],'0']
	],

	otherNumbers: [
		['?;n^?;m',['n isa "number"','m isa "number"'],'eval(n^m)']
	]
};
/** Compile an array of rules (in the form `[pattern,conditions[],result]` to {@link LissaJS.jme.display.Rule} objects
 * @param {Array} rules
 * @returns {LissaJS.jme.Ruleset}
 */
var compileRules = jme.display.compileRules = function(rules)
{
	for(var i=0;i<rules.length;i++)
	{
		var pattern = rules[i][0];
		var conditions = rules[i][1];
		var result = rules[i][2];
		rules[i] = new Rule(pattern,conditions,result);
	}
	return new jme.Ruleset(rules,{});
}

var all=[];
var nsimplificationRules = LissaJS.jme.display.simplificationRules = {};
for(var x in simplificationRules)
{
	nsimplificationRules[x] = nsimplificationRules[x.toLowerCase()] = compileRules(simplificationRules[x]);
	all = all.concat(nsimplificationRules[x].rules);
}
simplificationRules = nsimplificationRules;
simplificationRules['all']=new jme.Ruleset(all,{});

LissaJS.jme.builtinScope = new LissaJS.jme.Scope([LissaJS.jme.builtinScope,{rulesets: simplificationRules}]);
});
LissaJS.evaluate = function(expr,variables) {
    return LissaJS.jme.builtinScope.evaluate(expr,variables);
}

LissaJS.exprToLaTeX = function(expr,ruleset) {
    return LissaJS.jme.display.exprToLaTeX(expr,ruleset,LissaJS.jme.builtinScope);
}

LissaJS.simplifyExpression = function(expr,ruleset) {
    if(ruleset===undefined) {
        ruleset = 'all';
    }
    return LissaJS.jme.display.simplifyExpression(expr,ruleset,LissaJS.jme.builtinScope);
}

return LissaJS;
})();

