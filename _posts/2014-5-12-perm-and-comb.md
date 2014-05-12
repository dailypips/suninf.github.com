---
layout: article
title: Permutation And Combination
category: other
description: Lazy instance is an object which is created on the first time it's accessed. And chrome implements a very powerful LazyInstance template class, which is very fast and thread safe.
---
Permutation and combination are traditional maths problems, both of which have to do with lists recursively. It can test the expressive ability to process lists of a language. This article compares Erlang, Javascript, Python and Lisp.

## Theory
List permutation:
[1,2,3] -> [1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]

Thinking:
To list L:

1. Choose any one element of L as the first element `Head`
2. Elements behind Head, should be chosen from a list which is excluded the `Head` element from L
3. Recognize the recursive feature: every item of the permutation of `the left list`, should be added to `Head` to build a complete item result.

List combination:
[1,2,3] -> [1,2,3], [1,2], [1,3], [1], [2,3], [2], [3]

Thinking:
To list L:

1. Every element of L has two choices, use it or not
2. Should exclude the situation of choosing null


## Erlang

Erlang has the ability of list comprehension, so as to deal with list recursively easily. And the problem solved by erlang is very simple and direct.


{% highlight erlang %}
%% maths.erl

-module(maths).
-export( [permutation/1, combination/1] ).
%% permutation
permutation( [] ) -> [ [] ];
permutation( L ) -> [ [H | T] || H <- L, T <- permutation( L--[H] ) ].

%% combination
combination( L ) -> combination_helper(L) -- [[]].

combination_helper( [] ) -> [ [] ];
combination_helper( [H | T] ) ->
         [ [H | Tail] || Tail <- combination_helper(T) ] ++ combination_helper(T).

%% test:
> c(maths).
> maths:combination([1,2,3,4] ).
{% endhighlight %}


## Javascript
Javascript has the ability to create inner function easily, but it is not easy to deal with list recursively.

{% highlight javascript %}
function permutation(L) {
    if ( L.length == 0 ) {
        return [[]];
    }

    var result = [];
    for (var i=0; i<L.length; ++i) {
        var H = L[i];
        var T = L.slice(0, i).concat( L.slice(i+1, L.length) );

        var sub_result = arguments.callee( T );

        for(var j=0; j<sub_result.length; ++j) {
            var item = [H].concat( sub_result[j] );
            result.push( item );
        }
    }

    return result;
}

function combination(List) {
    var combination_helper = function(L){
        if ( L.length == 0 ) {
            return [[]];
        }

        var result = [];

        var H = L[0];
        var T = L.slice(1, L.length);

        var sub_result = arguments.callee( T );

        for(var j=0; j<sub_result.length; ++j) {
            var item = [H].concat( sub_result[j] );
            result.push( item );

            result.push( sub_result[j] );
        }

        return result;
    }

    var result = combination_helper( List);
    result.pop();
    result.reverse();

    return result;
}

console.log( 'permutation:' );
console.log( permutation( [1,2,3,4] ) );

console.log( 'combination:' );
console.log( combination( [1,2,3,4] ) );

{% endhighlight %}

