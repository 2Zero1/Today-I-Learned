# js의 루프

## Interface

1. 인터페이스란 사양에 맞는 값과 연결된 속성키의 세트
2. 어떤 object라도 인터페이스의 정의를 충족시킬 수 있다.
3. 하나의 Object는 여러개의 인터페이스를 충족시킬 수 있다.

interface test
위의 인터페이스는 우리가 만드는 인터페이스이다.

1. test라는 키를 갖고
2. 값으로 문자열인자를 1개 받아 불린 결과를 반환하는 함수가 온다.

```js
{
  test(str) {return true;}
}
```

### Iterator Interface

1. next라는 키를 갖고
2. 값으로 인자를 받지 않고 IteratorResultObject를 반환하는 함수가 온다.
3. IteratorResultObject는 value와 done이라는 키를 갖고 있다.
4. 이중 done은 계속 반복할 수 있을지 없을지에 따라 불린값을 반환한다.

```js
{
  next() {
    return {value:1, done: false};
  }
}
```

```js
{
  data: [1,2,3,4],
  next() {
    return {
      done: this.data.length ==0,
      value: this.data.pop(),
    };
  }
}
```

### Iterable interface

1. Symbol.iterator라는 키를 갖고
2. 값으로 인자를 받지 않고 Iterator Object를 반환하는 함수가 온다.

Symbol은 es6추가된 새로운 primitive타입. 값으로 인식.
객체의 키로 사용할 수 있는 특수한 형태로 되어있음.
대괄호 안에 심볼을 넣을 수 있다.

iterable한태 iterator 객체를 요청할때 iterator객체를 새로 만들거나 리셋해준다.

```js
{
  [Symbol.iterator]() {
    return {
      next() {
        return {value:1, done:false};
      }
    }
  }
}
```

문은 엔진에게 주는 힌트

식은 값이면 메모리에 남는다.

문은 다시는 반복할 수 없다. 하지만 우리는 loop를 식으로 만들고 싶다. loop행위 하는 자체를 객체화 하기 위해 iterator를 사용한다.

커맨드 패턴은 문을 다 값으로 바꿔 invoke에 저장해놓고 이걸 호출할때마다 마음대로 실행했다 멈췄다 되돌렸다룰 하게 만들어줌

이터레이터가 커맨드 패턴으로 대체가 되지만 그렁필욘 없고 반복전용에 해당되는 객체로만 바꿔주면 될것같아 이터레이터가 생긴것

```js
// 문이 얼마나 돌릴지 알고 있지만
let arr = [1,2,3,4];
while(arr.length > 0) {
  console.log(arr.pop());
}

//iterator는 자신이 반복할지를 내부에서 결정한다. 반복은 하지 않지만 외부에서 반복 하려고 할때 반복에 필요한 조건과 실행을 전부 미리 준비해둔 객체로 갖는것.
let iterator = {
  arr: [1,2,3,4],
  next() {
    return {
      done: this.arr.length == 0,
      value: console.log(this.arr.pop()),
    };
  }
}
```

문으로 하면 두번짜야되고 문제가 발생할 수 있음. 하지만 iterator는 iterable로 얻는다면 몇번을 반복시켜도 안정적이다.

반복 처리기 직접 Iterator구현해서 해보기

```js

const loop = (iter, f) => {
  //Iterable이라면 Iterator를 얻음. 약식으로 js에서 제공하는 것으로 확인중
  if(typeof iter[Symbol.iterator] == 'function') {
    iter = iter[Symbol.iterator]();
  }else return;

  //IteratorObject아 아니면 건너뜀
  if(typeof iter.next != 'function') return;

  do{
    const v = iter.next();
    if(v.done) return;
    f(v.value);
  }while(true);
}

const iter = {
  arr:[1,2,3,4],
  [Symbol.iterator](){return this;},
  next() {
    return {
      done: this.arr.length == 0,
      value: this.arr.pop()
    };
  }
};

loop(iter, console.log);
```

스펙대로 iterable를 만든다면 언어적인 도움을 받을 수 있음.

1. Array destructuring(배열 해체)
2. Spread(펼치기)
3. Rest Parameter(나머지 인자)

```js
const iter = {
  arr:[1,2,3,4],
  [Symbol.iterator](){return this;},
  next() {
    return {
      done: this.arr.length == 0,
      value: this.arr.pop()
    };
  }
};

const [a,...b] = iter;
const b = [...iter];
const test = (...arg) => console.log(arg);
test(...iter);
```

```js

const N2 = class {
  constructor(max) {  // 무한루프를 빠지지 않도록 항상 max를 설정해줘야한다.
    this.max = max;
  }
  [Symbol.iterator]() { // 이렇게 하면 클래스에서 인스턴스를 만드는 것처럼. 자유변수와 클로저를 이용해 인스턴스와 비슷한 함수를 만들 수 있음. 
    let cursor = 0, max = this.max; //cursor를 인스턴스 멤버 처럼 쓰게 되는것.
    return {
      done: false,
      next() {
        if(cursor > max) {
          this.done = true;
        } else {
          this.value = cursor * cursor;
          cursor ++;
        }
        return this;
      }
    }
  }
}

const a = new N2(5);

console.log([...a]);
for(const b of a) {
  
}
```

## generator

iterator generator를 사용한다.

```js


const N2 = class {
  constructor(max) {  // 무한루프를 빠지지 않도록 항상 max를 설정해줘야한다.
    this.max = max;
  }
  [Symbol.iterator]() { // 이렇게 하면 클래스에서 인스턴스를 만드는 것처럼. 자유변수와 클로저를 이용해 인스턴스와 비슷한 함수를 만들 수 있음. 
    let cursor = 0, max = this.max; //cursor를 인스턴스 멤버 처럼 쓰게 되는것.
    return {
      done: false,
      next() {
        if(cursor > max) {
          this.done = true;
        } else {
          this.value = cursor * cursor;
          cursor ++;
        }
        return this;
      }
    }
  }
}

const a = new N2(5);

console.log([...a]);
for(const b of a) {
  
}

///////////////////// 제너레이터는 일반적인 동기화 흐름들 따르고 있다. yield 빼고,

const generator = function*(max) {
  let cursor = 0;
  while(cursor < max) {
    yield cursor * cursor;
    cursor++;
  }
}

```

배열은 iterable이자 iterator 객체이기도 하다

generator가 반환하는 iterator는 반드시 iterable이기도 하다.

for of 에 generator를 넘길 순 없다. 하지만 generator가 iterator를 객체를 만들어내는것이다. iterable이 하는일도 제너레이터와 같이 iterator를 만들어내는 것이다. 하지만 for of 뒤에 제너레이터를 못온다. 이터러블만 올 수 있다. 그러면 제너레이터가 만든애는 어떻게 for of를 돌릴까 ? 그 이유는 iterator이자 iterable이기 때문이다.

yield가 나오면 suspension이란게 생겨서 이때 IteratorResultObject를 반환한다.

js는 문을 만들떄 문 하나는 레코드를 만들고, 컴플리션 레코드를 이용해 제어문을 반환하는데, 제너레이터 부분은 레코드로 만들어져 자바스크립트 실행기는 원래 레코드만 돌리고 있고, 진짜 노이만 머신이 아니라 노이만 머신이 에뮬레이팅하는것이다. 레코드들을 실행시켜주는 가상머신을 돌리고 있는것이다. yield를 하면 가상머신이 돌다가 멈춘다. 레코드를 더이상 실행하지 않고. 이를 suspension이라고 한다.

while 문에서 yield로 인해 여러 레코드가 생긴다. 바벨을 쓰면 이걸다 번역하기 때문에 바벨에선 제너레이터를 사용하면 안된다.

이전 iterator는 한번 돌리면 더이상 안되는데, generator가 생성하는 것은 iterator이자 iterable이기 때문에 여러번 실행할 수 있다.

iterator는 자유변수를 사용하면서 iterator의 스펙을 맞춰줘야 하다보니 작성하기가 비교적 어렵다. 하지만 제너레이터는 지역변수만 사용하고 yield하기 때문에 쉽지만, babel에서는 절대 사용하면 안된다.
