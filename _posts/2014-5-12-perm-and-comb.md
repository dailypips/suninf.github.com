---
layout: article
title: Permutation And Combination
category: other
description: Permutation and combination are traditional maths problems, both of which have to do with lists recursively.
---
Permutation and combination are traditional maths problems, both of which have to do with lists recursively. This article compares Erlang, Javascript, Python and Scheme, each of which implements both of the problems, and it can test **the expressive ability to process lists** of a language.

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
         [ [H | Tail] || Tail <- combination_helper(T) ]
         ++ combination_helper(T).
{% endhighlight %}

%% test:
> c(maths).
> maths:combination([1,2,3,4] ).


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



## Scheme
Scheme is a kind of lisp.

{% highlight lisp %}
(define nil '())

; map
(define (map func items)
  (if (null? items)
      nil
      (cons (func (car items)) (map func (cdr items)))
      ))

; filter
(define (filter pred seq)
  (cond ((null? seq) nil)
        ((pred (car seq))
         (cons (car seq)
               (filter pred (cdr seq))))
        (else (filter pred (cdr seq)))))

; accumulate
(define (accumulate op init seq)
  (if (null? seq)
      init
      (op (car seq) (accumulate op init (cdr seq)))))

; append
(define (append L R)
  (if (null? L)
        R
        (cons (car L) (append (cdr L) R))))

  ; remove
  (define (remove item seq)
    (filter (lambda (x) (not (= x item))) seq))


  ; permutation
  (define (permutation L)
    (if (null? L)
        (list nil)
        (accumulate append
                    nil
                    (map (lambda (H) (map (lambda (T) (cons H T))
                                          (permutation (remove H L))))
                         L))))

  ; combination
  (define (combination L)
    (if (null? L)
        (list nil)
        (append (map (lambda (Tail) (cons (car L) Tail)) (combination (cdr L)))
                (combination (cdr L)))))
{% endhighlight %}

; test：
> (permutation '(1 2 3))
'((1 2 3) (1 3 2) (2 1 3) (2 3 1) (3 1 2) (3 2 1))

> (combination '(1 2 3))
'((1 2 3) (1 2) (1 3) (1) (2 3) (2) (3) ())



## Python
Python is very powerful, it support list comprehension too.

{% highlight python %}
def RemoveElem( L, E ):
    k = L.index(E)
    return L[0:k] + L[k+1:len(L)]

def permutation( L ):
    if len(L) == 0 :
        return [[]]
    else:
        return [ ([H] + T) for H in L for T in permutation( RemoveElem(L,H) ) ]


def combination(L):
    Ret = combination_helper( L )
    return Ret[ : -1 ]

def combination_helper( L ):
    if len(L) == 0:
        return [[]]
    else:
        T = L[1:]
        return [ ([L[0]] + Tail) for Tail in combination_helper( T ) ] + combination_helper( T )
{% endhighlight %}

test：
for e in permutation( '123' ) :
    print e

['1', '2', '3']
['1', '3', '2']
['2', '1', '3']
['2', '3', '1']
['3', '1', '2']
['3', '2', '1']


for e in combination( '123' ):
    print e

['1', '2', '3']
['1', '2']
['1', '3']
['1']
['2', '3']
['2']
['3']

